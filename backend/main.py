from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import os
from typing import List, Optional
from dotenv import load_dotenv
import shutil
import uuid
import asyncio

from models import Base, User, Task, TaskCategory, UserCreate, UserLogin, Token, TaskCreate, TaskResponse
from document_models import Document, DocumentResponse
from email_utils import send_verification_email
from rag_utils import process_document, get_answer_with_fallback

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hrnexus.db")
SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
UPLOAD_DIR = "./uploads"

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

oauth2_scheme = None # Simplified for this snippet, usually OAuth2PasswordBearer

# Password hashing functions using bcrypt directly
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HR Nexus API")

# CORS configuration - must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create a default user if none exists
    if db.query(User).count() == 0:
        default_user = User(
            email="admin@hrnexus.com",
            hashed_password=hash_password("admin123"),
            is_verified=True
        )
        db.add(default_user)
        db.commit()
    
    if db.query(Task).count() == 0:
        # Seed tasks
        tasks = [
            Task(title="Screen Candidates for Senior Dev", category=TaskCategory.Recruiting, priority="High", owner_id=1),
            Task(title="Prepare Onboarding Kit for Alice", category=TaskCategory.Onboarding, priority="Medium", owner_id=1),
            Task(title="Process Monthly Payroll", category=TaskCategory.Payroll, priority="High", owner_id=1),
            Task(title="Review Health Insurance Options", category=TaskCategory.Benefits, priority="Medium", owner_id=1),
            Task(title="Schedule Python Workshop", category=TaskCategory.Learning_Development, priority="Low", owner_id=1),
            Task(title="Mediator for Team Conflict", category=TaskCategory.Employee_Relations, priority="High", owner_id=1),
            Task(title="Q4 Performance Reviews", category=TaskCategory.Performance, priority="High", owner_id=1),
            Task(title="Exit Interview for Bob", category=TaskCategory.Offboarding, priority="Medium", owner_id=1),
        ]
        db.add_all(tasks)
        db.commit()
    db.close()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.options("/auth/signup")
async def signup_options():
    return {}

@app.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user.password)
    verification_token = secrets.token_urlsafe(32)
    new_user = User(email=user.email, hashed_password=hashed_password, verification_token=verification_token)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    await send_verification_email(new_user.email, verification_token)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/verify/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": "Email verified successfully"}

@app.options("/auth/login")
async def login_options():
    return {}

@app.post("/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# Task endpoints
@app.get("/tasks", response_model=List[TaskResponse])
def get_tasks(category: str = None, db: Session = Depends(get_db)):
    query = db.query(Task)
    if category and category != "All":
        query = query.filter(Task.category == category)
    return query.all()

@app.post("/tasks", response_model=TaskResponse)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    # For simplicity, assigning to first user
    new_task = Task(**task.dict(), owner_id=1) 
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: TaskCreate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task.dict().items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/tasks/{task_id}/status")
def update_task_status(task_id: int, status: str, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.status = status
    db.commit()
    return {"message": "Task status updated", "task_id": task_id, "status": status}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully", "task_id": task_id}

# Document endpoints
from fastapi import BackgroundTasks

# Store processing status
processing_status = {}

def process_document_background(doc_id: int, file_path: str, file_ext: str):
    """Background task to process document"""
    try:
        # Set initial status
        processing_status[doc_id] = {"status": "processing", "progress": 0}
        print(f"[DOC {doc_id}] Starting processing...")
        
        # Process the document
        result = process_document(file_path, file_ext)
        
        if result.get("success"):
            processing_status[doc_id] = {
                "status": "completed",
                "progress": 100,
                "message": result.get("message"),
                "num_chunks": result.get("num_chunks")
            }
            print(f"[DOC {doc_id}] ✓ Processing completed - {result.get('num_chunks')} chunks created")
        else:
            processing_status[doc_id] = {
                "status": "failed",
                "progress": 0,
                "message": result.get("message")
            }
            print(f"[DOC {doc_id}] ✗ Processing failed: {result.get('message')}")
    except Exception as e:
        processing_status[doc_id] = {
            "status": "failed",
            "progress": 0,
            "message": str(e)
        }
        print(f"[DOC {doc_id}] ✗ Processing error: {str(e)}")

@app.get("/documents/{doc_id}/status")
def get_document_status(doc_id: int):
    """Get processing status of a document"""
    status = processing_status.get(doc_id, {"status": "unknown"})
    return status

@app.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Validate file type
    allowed_extensions = ['pdf', 'docx', 'doc', 'txt']
    file_ext = file.filename.split('.')[-1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}")
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        
        # Save to database immediately
        new_doc = Document(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_type=file_ext,
            file_size=file_size,
            category=category
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        
        # Process document in background
        processing_status[new_doc.id] = {"status": "queued", "progress": 0}
        background_tasks.add_task(process_document_background, new_doc.id, file_path, file_ext)
        
        return new_doc
    
    except Exception as e:
        # Clean up file if anything goes wrong
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/documents", response_model=List[DocumentResponse])
def get_documents(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Document)
    if category:
        query = query.filter(Document.category == category)
    return query.order_by(Document.uploaded_at.desc()).all()

@app.get("/documents/{doc_id}/view")
def view_document(doc_id: int, db: Session = Depends(get_db)):
    """View a document inline in browser"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    
    # Set appropriate media type for inline viewing
    media_type_map = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
    }
    
    media_type = media_type_map.get(doc.file_type, 'application/octet-stream')
    
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename={doc.original_filename}"
        }
    )

@app.get("/documents/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    """Download a document"""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type='application/octet-stream',
        headers={
            "Content-Disposition": f"attachment; filename={doc.original_filename}"
        }
    )

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector database
    try:
        from langchain_community.embeddings import OllamaEmbeddings
        from langchain_chroma import Chroma
        
        PERSIST_DIRECTORY = "./chroma_db"
        OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        if os.path.exists(PERSIST_DIRECTORY):
            embeddings = OllamaEmbeddings(
                base_url=OLLAMA_BASE_URL,
                model="nomic-embed-text"
            )
            vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
            
            # Delete all chunks from this document
            # Filter by source_file metadata
            vectordb.delete(where={"source_file": doc.file_path})
            print(f"Deleted document chunks from vector DB: {doc.file_path}")
    except Exception as e:
        print(f"Error deleting from vector DB: {e}")
    
    # Delete physical file
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    # Delete from database
    db.delete(doc)
    db.commit()
    
    return {"message": "Document deleted successfully from all locations", "doc_id": doc_id}

# Chat endpoint
@app.options("/chat")
async def chat_options():
    return {}

from fastapi.responses import StreamingResponse
import json as json_lib

@app.post("/chat")
async def chat(
    query: str = Form(...), 
    file: Optional[UploadFile] = File(None),
    history: Optional[str] = Form(None),
    stream: Optional[str] = Form("false")
):
    try:
        # If file is provided, process it first
        if file:
            file_ext = file.filename.split('.')[-1].lower()
            temp_path = f"temp_{uuid.uuid4()}_{file.filename}"
            
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            result = process_document(temp_path, file_ext)
            os.remove(temp_path)
            
            if not result.get("success"):
                raise HTTPException(status_code=500, detail=result.get("message"))
        
        # Get answer from RAG with conversation history
        if query:
            # Parse conversation history if provided
            conversation_history = []
            if history:
                try:
                    conversation_history = json_lib.loads(history)
                except:
                    conversation_history = []
            
            # Check if streaming is requested
            if stream == "true":
                # Return streaming response directly from LLM
                async def generate():
                    try:
                        for chunk, source, done in get_answer_with_fallback(query, conversation_history, stream=True):
                            yield f"data: {json_lib.dumps({'chunk': chunk, 'done': done, 'source': source})}\n\n"
                            await asyncio.sleep(0)  # Allow other tasks to run
                    except Exception as e:
                        yield f"data: {json_lib.dumps({'chunk': f'Error: {str(e)}', 'done': True, 'source': 'error'})}\n\n"
                
                return StreamingResponse(generate(), media_type="text/event-stream")
            else:
                # Regular response
                answer, source = get_answer_with_fallback(query, conversation_history)
                return {"answer": answer, "query": query, "source": source}
        else:
            return {"message": "Document processed successfully", "query": ""}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

