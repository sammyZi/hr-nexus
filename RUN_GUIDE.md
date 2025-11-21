# HR Nexus - Setup & Run Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- Git

## 1. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment (optional but recommended):
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

**Configuration**:
1. Copy `.env.example` to `.env`.
2. **CRITICAL**: Open `.env` and set the following:
   - `MAIL_USERNAME`: Your Gmail address.
   - `MAIL_PASSWORD`: Your Gmail App Password (not your login password).
   - `OPENAI_API_KEY`: Your OpenAI API Key (sk-...).
   - `SECRET_KEY`: Generate a random string.

Run the server:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.
Docs at `http://localhost:8000/docs`.

## 2. Frontend Setup
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## 3. Application Features

### Navigation
The app includes a sidebar with the following sections:
- **Dashboard**: Overview of all tasks across pillars
- **8 HR Pillars**: Dedicated pages for each pillar
  - Recruiting
  - Onboarding
  - Payroll
  - Benefits
  - Learning & Development
  - Employee Relations
  - Performance
  - Offboarding
- **AI Assistant**: Chat interface with RAG-powered AI
- **Documents**: Document library and management

### Task Management
On any page (Dashboard or Pillar pages):
1. **View Tasks**: See all tasks or filter by pillar
2. **Create Task**: Click "Create Task" button
   - Fill in title, description, category, and priority
   - Tasks are immediately added to the database
3. **Update Status**: Click the status dropdown on any task card
   - Change between Pending, In Progress, Completed
4. **Delete Task**: Click the three-dot menu and select Delete

### Document Upload & RAG
On Pillar pages or Documents page:
1. **Upload Documents**: Click "Upload Document" button
   - Drag and drop or click to browse
   - Supports PDF, DOCX, DOC, TXT files (max 10MB)
   - Documents are automatically processed and added to RAG database
2. **View Documents**: Go to Documents page to see all uploaded files
3. **Delete Documents**: Click Delete button on any document

### AI Policy Assistant
Navigate to AI Assistant page:
1. **Upload Documents**: Click "Upload Document" to add HR policies
2. **Ask Questions**: Type questions about your uploaded documents
3. **Get Answers**: AI will respond based on the document content
4. **Message History**: All conversations are saved in the session

## 4. Verification Steps

### Basic Flow
1. **Navigate**: Open `http://localhost:3000`
2. **Signup**: Go to `/signup` and create an account
3. **Verify Email**: Check your email for verification link
4. **Login**: Log in at `/login`
5. **Dashboard**: You'll see the HR Command Center with seeded tasks

### Test Task Management
1. Click "Create Task" on Dashboard
2. Fill in the form and submit
3. Verify the task appears in the list
4. Change the task status using the dropdown
5. Delete the task using the menu

### Test Document Upload
1. Go to any Pillar page (e.g., Recruiting)
2. Click "Upload Document"
3. Upload a sample PDF or TXT file
4. Wait for processing confirmation
5. Go to Documents page to verify it's listed

### Test AI Assistant
1. Navigate to AI Assistant page
2. Upload an HR policy document (PDF/DOCX)
3. Wait for processing
4. Ask a question like "What is the remote work policy?"
5. Verify you get a relevant answer

### Test Navigation
1. Use the sidebar to navigate between pages
2. Verify each pillar page shows filtered tasks
3. Test mobile responsiveness (resize browser)
4. Verify sidebar collapses on mobile

## 5. Default Credentials
A default admin user is created on first startup:
- Email: `admin@hrnexus.com`
- Password: `admin123`

## Troubleshooting
- **Email fails**: Ensure you are using an App Password for Gmail, not your main password. Check `MAIL_PORT=587`.
- **Chat fails**: Ensure `OPENAI_API_KEY` is valid and you have credits.
- **Frontend errors**: Check browser console for errors. Ensure backend is running on port 8000.
- **Document upload fails**: Check file size (max 10MB) and format (PDF, DOCX, TXT only).
- **Tasks not appearing**: Verify backend is running and check browser network tab for API errors.

