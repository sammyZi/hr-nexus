# HR Nexus Backend

Backend API for HR Nexus application using FastAPI and MongoDB.

## Prerequisites

- Python 3.8+
- MongoDB (running locally or remote)
- Ollama (for AI features)

## Setup

1. **Install MongoDB**
   - Download and install MongoDB from https://www.mongodb.com/try/download/community
   - Start MongoDB service:
     ```bash
     # Windows
     net start MongoDB
     
     # Linux/Mac
     sudo systemctl start mongod
     ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   - Update `.env` file with your MongoDB connection string:
     ```
     MONGODB_URL=mongodb://localhost:27017
     DATABASE_NAME=hrnexus
     ```

5. **Initialize Database**
   ```bash
   python init_db.py
   ```
   
   This will create database indexes for performance.

6. **Run the Application**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## Getting Started

1. Navigate to the frontend application
2. Sign up with your organization name and email
3. Verify your email
4. Start uploading documents and creating tasks

## Clear Database (Optional)

If you need to clear all data and start fresh:

```bash
python clear_sample_data.py
```

This will remove all users, tasks, documents, and organizations from the database.

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/verify/{token}` - Verify email

### Tasks
- `GET /tasks` - Get all tasks (optional: ?category=Recruiting)
- `POST /tasks` - Create new task
- `PUT /tasks/{task_id}` - Update task
- `PATCH /tasks/{task_id}/status` - Update task status
- `DELETE /tasks/{task_id}` - Delete task

### Documents
- `POST /documents/upload` - Upload document
- `GET /documents` - Get all documents
- `GET /documents/{doc_id}/view` - View document
- `GET /documents/{doc_id}/download` - Download document
- `DELETE /documents/{doc_id}` - Delete document

### Chat
- `POST /chat` - Chat with AI assistant

## Database Structure

### Users Collection
```json
{
  "_id": ObjectId,
  "email": "user@example.com",
  "hashed_password": "...",
  "is_active": true,
  "is_verified": true,
  "verification_token": null,
  "created_at": ISODate
}
```

### Tasks Collection
```json
{
  "_id": ObjectId,
  "title": "Task Title",
  "description": "Task Description",
  "category": "Recruiting",
  "priority": "High",
  "status": "Pending",
  "owner_id": "user_id",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### Documents Collection
```json
{
  "_id": ObjectId,
  "filename": "unique_filename.pdf",
  "original_filename": "document.pdf",
  "file_path": "./uploads/...",
  "file_type": "pdf",
  "file_size": 12345,
  "uploaded_at": ISODate,
  "category": "Benefits"
}
```

## Development

- API documentation available at: http://localhost:8000/docs
- Health check: http://localhost:8000/health
