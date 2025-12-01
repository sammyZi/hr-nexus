# Quick Start Guide

## Prerequisites
- Python 3.8+
- MongoDB installed and running
- Ollama installed and running
- Node.js 16+ (for frontend)

## Setup

### 1. Start MongoDB

Make sure MongoDB is installed and running:

```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Run automated setup (Windows)
setup.bat

# OR run automated setup (Mac/Linux)
chmod +x setup.sh
./setup.sh

# OR manual setup:
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database with sample data
python seed_data.py
```

### 3. Start Ollama Service

In a new terminal:
```bash
ollama serve
```

### 4. Start Backend Server

```bash
# In backend directory with venv activated
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### 5. Frontend Setup

In a new terminal:
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

You should see:
```
> next dev
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

### 6. Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## Features

### AI Assistant
1. **Upload Documents**
   - Click "Upload" button
   - Select PDF, DOCX, or TXT files
   - Max 50MB per file

2. **Ask Questions**
   - Type your question
   - Press Enter or click Send
   - Get answers with citations

3. **Copy Responses**
   - Click "Copy" button on any response
   - Formatted text copied to clipboard
   - Includes all formatting

4. **View Sources**
   - See source documents
   - Click "View" to open document
   - Check relevance scores

### Task Management
1. **Create Tasks**
   - Click "Create Task" button
   - Select category (color-coded)
   - Set priority (Low/Medium/High)
   - Add description

2. **Manage Tasks**
   - Change status (Pending/In Progress/Completed)
   - Mark important tasks with star
   - Delete tasks
   - View task details

3. **Filter & Sort**
   - Filter by category
   - Filter by status
   - Sort by priority
   - Search by title

## Troubleshooting

### MongoDB connection error
```
Error: Connection refused to MongoDB
Solution: Start MongoDB service (see step 1)
```

### Backend won't start
```
Error: ModuleNotFoundError
Solution: pip install -r requirements.txt
```

### Database not seeded
```
Error: No users found
Solution: Run python seed_data.py
```

### Ollama connection error
```
Error: Connection refused
Solution: Start Ollama service (ollama serve)
```

### Port already in use
```
Error: Address already in use
Solution: Use different port (uvicorn main:app --reload --port 8001)
```

### Frontend won't load
```
Error: Cannot find module
Solution: npm install in frontend directory
```

### Documents not uploading
```
Error: Upload failed
Solution: Check file size (<50MB) and format (PDF/DOCX/TXT)
```

## File Structure

```
hr_new/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── rag_utils.py         # RAG system
│   ├── requirements.txt      # Python dependencies
│   ├── chroma_db/           # Vector database
│   └── uploads/             # Uploaded documents
├── frontend/
│   ├── app/                 # Next.js app
│   ├── components/          # React components
│   ├── lib/                 # Utilities
│   ├── package.json         # Node dependencies
│   └── next.config.js       # Next.js config
└── README.md
```

## API Endpoints

### Documents
- `POST /documents/upload` - Upload document
- `GET /documents` - List documents
- `DELETE /documents/{id}` - Delete document
- `GET /documents/{id}/view` - View document

### Chat
- `POST /chat` - Send message (streaming)
- `GET /chat/history` - Get chat history

### Tasks
- `POST /tasks` - Create task
- `GET /tasks` - List tasks
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task

## Sample Users

After running the seed script, you can login with:

- **Admin**: admin@hrnexus.com / admin123
- **HR Manager**: hr.manager@hrnexus.com / manager123
- **Recruiter**: recruiter@hrnexus.com / recruiter123

## Environment Variables

The `.env` file in backend contains:

```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=hrnexus
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
SECRET_KEY=your-secret-key
```

## Performance Tips

1. **Use smaller documents** - Faster processing
2. **Ask specific questions** - Better answers
3. **Upload relevant documents** - Fewer false positives
4. **Use categories** - Better organization
5. **Mark important tasks** - Easy filtering

## Next Steps

1. ✅ Setup complete
2. 📤 Upload your first document
3. ❓ Ask a question
4. 📋 Create a task
5. 🎯 Explore features

## Support

For issues or questions:
1. Check troubleshooting section
2. Review error messages
3. Check logs in terminal
4. Verify all services running

## Documentation

- [RAG System](RAG_IMPROVEMENTS.md)
- [Message Formatting](MESSAGE_FORMATTING_GUIDE.md)
- [UI Components](SELECT_COMPONENT_GUIDE.md)
- [Dropdown Fixes](PORTAL_DROPDOWN_FIX.md)

Enjoy using the HR Assistant! 🚀
