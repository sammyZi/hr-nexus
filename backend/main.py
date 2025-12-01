from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
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
from bson import ObjectId

from models import (
    UserInDB, TaskInDB, DocumentInDB,
    UserCreate, OrganizationSignup, UserLogin, Token, TaskCreate, TaskResponse,
    DocumentResponse, TaskCategory, generate_slug,
    OrganizationResponse, OrganizationUpdate, OrganizationStats
)
from database import (
    users_collection, tasks_collection, documents_collection, 
    organizations_collection, close_database
)
from email_utils import send_verification_email
from rag_utils import process_document, get_answer_with_fallback
from organization_service import OrganizationService

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
UPLOAD_DIR = "./uploads"

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Password hashing functions using bcrypt
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

app = FastAPI(title="HR Nexus API")

# Tenant Context Middleware
class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract organization context from JWT and inject into request state.
    Automatically filters all queries by organization_id for data isolation.
    """
    
    # Public endpoints that don't require authentication
    PUBLIC_PATHS = [
        "/health",
        "/auth/signup",
        "/auth/login",
        "/auth/verify",
        "/organizations/signup",
        "/invitations/accept",
        "/docs",
        "/openapi.json",
        "/redoc"
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public endpoints
        path = request.url.path
        
        # Check if path starts with any public path
        is_public = any(path.startswith(public_path) for public_path in self.PUBLIC_PATHS)
        
        # Also skip OPTIONS requests (CORS preflight)
        if is_public or request.method == "OPTIONS":
            return await call_next(request)
        
        # Extract JWT token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        
        if not auth_header.startswith("Bearer "):
            return Response(
                content='{"detail":"Not authenticated"}',
                status_code=401,
                media_type="application/json"
            )
        
        token = auth_header.replace("Bearer ", "")
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Extract organization context from token
            organization_id = payload.get("organization_id")
            user_id = payload.get("user_id")
            role = payload.get("role")
            email = payload.get("sub")
            
            # Inject into request state for use in endpoints
            request.state.organization_id = organization_id
            request.state.user_id = user_id
            request.state.role = role
            request.state.email = email
            
            # Log for debugging (optional)
            print(f"[TENANT] Request from org={organization_id}, user={user_id}, role={role}", flush=True)
            
        except JWTError as e:
            return Response(
                content=f'{{"detail":"Invalid authentication token: {str(e)}"}}',
                status_code=401,
                media_type="application/json"
            )
        except Exception as e:
            return Response(
                content=f'{{"detail":"Authentication error: {str(e)}"}}',
                status_code=401,
                media_type="application/json"
            )
        
        # Continue processing the request
        response = await call_next(request)
        return response

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply Tenant Context Middleware
app.add_middleware(TenantContextMiddleware)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Create JWT access token with organization context.
    
    Expected data keys:
    - sub: user email
    - user_id: user ID
    - organization_id: organization ID
    - role: user role ("admin" or "employee")
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.on_event("shutdown")
async def shutdown_event():
    close_database()

@app.get("/health")
def health_check():
    return {"status": "ok", "database": "mongodb"}

@app.options("/auth/signup")
async def signup_options():
    return {}

@app.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user.password)
    verification_token = secrets.token_urlsafe(32)
    
    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "is_active": True,
        "is_verified": False,
        "verification_token": verification_token,
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(new_user)
    
    await send_verification_email(user.email, verification_token)
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.options("/organizations/signup")
async def organization_signup_options():
    return {}

@app.post("/organizations/signup", response_model=Token)
async def organization_signup(signup_data: OrganizationSignup):
    """
    Create a new organization and first admin user.
    Returns JWT with organization context.
    """
    # Check if user email already exists
    existing_user = await users_collection.find_one({"email": signup_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate organization slug
    base_slug = generate_slug(signup_data.organization_name)
    slug = base_slug
    counter = 1
    
    # Ensure slug is unique
    while await organizations_collection.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Create organization
    new_organization = {
        "name": signup_data.organization_name,
        "slug": slug,
        "logo_url": None,
        "settings": {},
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    org_result = await organizations_collection.insert_one(new_organization)
    organization_id = str(org_result.inserted_id)
    
    # Create first admin user
    hashed_password = hash_password(signup_data.password)
    verification_token = secrets.token_urlsafe(32)
    
    new_user = {
        "organization_id": organization_id,
        "email": signup_data.email,
        "hashed_password": hashed_password,
        "role": "admin",
        "is_active": True,
        "is_verified": False,
        "verification_token": verification_token,
        "created_at": datetime.utcnow()
    }
    
    user_result = await users_collection.insert_one(new_user)
    user_id = str(user_result.inserted_id)
    
    # Send verification email
    await send_verification_email(signup_data.email, verification_token)
    
    # Create JWT with organization context
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": signup_data.email,
            "user_id": user_id,
            "organization_id": organization_id,
            "role": "admin"
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/verify/{token}")
async def verify_email(token: str):
    user = await users_collection.find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_token": None}}
    )
    return {"message": "Email verified successfully"}

@app.options("/auth/login")
async def login_options():
    return {}

@app.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    """
    Login user and return JWT with organization context.
    """
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not db_user["is_verified"]:
        raise HTTPException(status_code=400, detail="Email not verified")
    
    # Create JWT with organization context
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": db_user["email"],
            "user_id": str(db_user["_id"]),
            "organization_id": db_user.get("organization_id"),
            "role": db_user.get("role", "employee")
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Organization endpoints
@app.get("/organizations/me", response_model=OrganizationResponse)
async def get_current_organization(request: Request):
    """
    Get current user's organization.
    Requires authentication via JWT token.
    """
    organization_id = request.state.organization_id
    
    if not organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    organization = await OrganizationService.get_organization(organization_id)
    
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return OrganizationResponse(
        id=str(organization.id),
        name=organization.name,
        slug=organization.slug,
        logo_url=organization.logo_url,
        settings=organization.settings,
        created_at=organization.created_at,
        is_active=organization.is_active
    )

@app.put("/organizations/me", response_model=OrganizationResponse)
async def update_current_organization(request: Request, update_data: OrganizationUpdate):
    """
    Update current user's organization.
    Only organization admins can update organization settings.
    """
    organization_id = request.state.organization_id
    role = request.state.role
    
    # Check if user is admin
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can update organization settings"
        )
    
    if not organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Convert to dict and remove None values
    update_dict = update_data.model_dump(exclude_none=True)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    organization = await OrganizationService.update_organization(organization_id, update_dict)
    
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return OrganizationResponse(
        id=str(organization.id),
        name=organization.name,
        slug=organization.slug,
        logo_url=organization.logo_url,
        settings=organization.settings,
        created_at=organization.created_at,
        is_active=organization.is_active
    )

@app.get("/organizations/me/stats", response_model=OrganizationStats)
async def get_organization_statistics(request: Request):
    """
    Get statistics for current user's organization.
    Returns counts of users, documents, tasks, etc.
    """
    organization_id = request.state.organization_id
    
    if not organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    stats = await OrganizationService.get_organization_stats(organization_id)
    
    return OrganizationStats(**stats)

# Task endpoints
@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(category: str = None):
    query = {}
    if category and category != "All":
        query["category"] = category
    
    tasks = await tasks_collection.find(query).to_list(length=None)
    
    # Convert MongoDB documents to response format
    return [
        TaskResponse(
            id=str(task["_id"]),
            title=task["title"],
            description=task.get("description"),
            category=task["category"],
            priority=task["priority"],
            status=task["status"],
            owner_id=task.get("owner_id"),
            created_at=task["created_at"],
            updated_at=task["updated_at"]
        )
        for task in tasks
    ]

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate):
    # Get first user as default owner
    first_user = await users_collection.find_one({})
    owner_id = str(first_user["_id"]) if first_user else None
    
    new_task = {
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "priority": task.priority,
        "status": "Pending",
        "owner_id": owner_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await tasks_collection.insert_one(new_task)
    new_task["_id"] = result.inserted_id
    
    return TaskResponse(
        id=str(new_task["_id"]),
        title=new_task["title"],
        description=new_task["description"],
        category=new_task["category"],
        priority=new_task["priority"],
        status=new_task["status"],
        owner_id=new_task["owner_id"],
        created_at=new_task["created_at"],
        updated_at=new_task["updated_at"]
    )

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task: TaskCreate):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    db_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "priority": task.priority,
        "updated_at": datetime.utcnow()
    }
    
    await tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )
    
    updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    
    return TaskResponse(
        id=str(updated_task["_id"]),
        title=updated_task["title"],
        description=updated_task["description"],
        category=updated_task["category"],
        priority=updated_task["priority"],
        status=updated_task["status"],
        owner_id=updated_task["owner_id"],
        created_at=updated_task["created_at"],
        updated_at=updated_task["updated_at"]
    )

@app.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status: str = Query(...)):
    print(f"[TASK] Updating task {task_id} status to: {status}", flush=True)
    
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    db_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_status = db_task["status"]
    
    await tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    print(f"[TASK] Task {task_id} status changed: {old_status} -> {status}", flush=True)
    return {"message": "Task status updated", "task_id": task_id, "status": status}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    result = await tasks_collection.delete_one({"_id": ObjectId(task_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully", "task_id": task_id}

# Document endpoints
from fastapi import BackgroundTasks

# Store processing status
processing_status = {}

def process_document_background(doc_id: str, file_path: str, file_ext: str):
    """Background task to process document"""
    try:
        processing_status[doc_id] = {"status": "processing", "progress": 0}
        print(f"[DOC {doc_id}] Starting processing...")
        
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
def get_document_status(doc_id: str):
    """Get processing status of a document"""
    status = processing_status.get(doc_id, {"status": "unknown"})
    return status

@app.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None)
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
        
        # Save to database
        new_doc = {
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_type": file_ext,
            "file_size": file_size,
            "uploaded_at": datetime.utcnow(),
            "category": category
        }
        
        result = await documents_collection.insert_one(new_doc)
        doc_id = str(result.inserted_id)
        
        # Process document in background
        processing_status[doc_id] = {"status": "queued", "progress": 0}
        background_tasks.add_task(process_document_background, doc_id, file_path, file_ext)
        
        return DocumentResponse(
            id=doc_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_type=file_ext,
            file_size=file_size,
            uploaded_at=new_doc["uploaded_at"],
            category=category
        )
    
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/documents", response_model=List[DocumentResponse])
async def get_documents(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    documents = await documents_collection.find(query).sort("uploaded_at", -1).to_list(length=None)
    
    return [
        DocumentResponse(
            id=str(doc["_id"]),
            filename=doc["filename"],
            original_filename=doc["original_filename"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            uploaded_at=doc["uploaded_at"],
            category=doc.get("category")
        )
        for doc in documents
    ]

@app.get("/documents/{doc_id}/view")
async def view_document(doc_id: str):
    """View a document inline in browser"""
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    doc = await documents_collection.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc["file_path"]):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    
    media_type_map = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
    }
    
    media_type = media_type_map.get(doc["file_type"], 'application/octet-stream')
    
    return FileResponse(
        path=doc["file_path"],
        filename=doc["original_filename"],
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename={doc['original_filename']}"
        }
    )

@app.get("/documents/view-by-name/{filename:path}")
async def view_document_by_name(filename: str):
    """View a document by its original filename (used by AI citations)"""
    from urllib.parse import unquote
    
    decoded_filename = unquote(filename)
    print(f"[DOC] Looking for document: {decoded_filename}", flush=True)
    
    doc = await documents_collection.find_one({"original_filename": decoded_filename})
    
    if not doc:
        doc = await documents_collection.find_one(
            {"original_filename": {"$regex": decoded_filename, "$options": "i"}}
        )
    
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{decoded_filename}' not found")
    
    if not os.path.exists(doc["file_path"]):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    
    media_type_map = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
    }
    
    media_type = media_type_map.get(doc["file_type"], 'application/octet-stream')
    
    print(f"[DOC] Found document: {doc['original_filename']} (ID: {str(doc['_id'])})", flush=True)
    
    return FileResponse(
        path=doc["file_path"],
        filename=doc["original_filename"],
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename={doc['original_filename']}"
        }
    )

@app.get("/documents/{doc_id}/download")
async def download_document(doc_id: str):
    """Download a document"""
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    doc = await documents_collection.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc["file_path"]):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=doc["file_path"],
        filename=doc["original_filename"],
        media_type='application/octet-stream',
        headers={
            "Content-Disposition": f"attachment; filename={doc['original_filename']}"
        }
    )

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    doc = await documents_collection.find_one({"_id": ObjectId(doc_id)})
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
            vectordb.delete(where={"source_file": doc["file_path"]})
            print(f"Deleted document chunks from vector DB: {doc['file_path']}")
    except Exception as e:
        print(f"Error deleting from vector DB: {e}")
    
    # Delete physical file
    if os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])
    
    # Delete from database
    await documents_collection.delete_one({"_id": ObjectId(doc_id)})
    
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
        if file:
            file_ext = file.filename.split('.')[-1].lower()
            temp_path = f"temp_{uuid.uuid4()}_{file.filename}"
            
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            result = process_document(temp_path, file_ext)
            os.remove(temp_path)
            
            if not result.get("success"):
                raise HTTPException(status_code=500, detail=result.get("message"))
        
        if query:
            conversation_history = []
            if history:
                try:
                    conversation_history = json_lib.loads(history)
                except:
                    conversation_history = []
            
            if stream == "true":
                async def generate():
                    try:
                        for chunk, source, done in get_answer_with_fallback(query, conversation_history, stream=True):
                            yield f"data: {json_lib.dumps({'chunk': chunk, 'done': done, 'source': source})}\n\n"
                            await asyncio.sleep(0)
                    except Exception as e:
                        yield f"data: {json_lib.dumps({'chunk': f'Error: {str(e)}', 'done': True, 'source': 'error'})}\n\n"
                
                return StreamingResponse(generate(), media_type="text/event-stream")
            else:
                answer, source = get_answer_with_fallback(query, conversation_history)
                return {"answer": answer, "query": query, "source": source}
        else:
            return {"message": "Document processed successfully", "query": ""}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
