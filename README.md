# HR Nexus

An AI-powered HR management platform that streamlines HR operations with intelligent document management, task tracking, and an AI assistant.

## 🌟 Features

### 🤖 AI Assistant
- **Natural Language Queries**: Ask questions about your HR documents in plain English
- **Smart Document Search**: AI-powered search with precise source citations
- **Context-Aware Responses**: Maintains conversation history for better understanding
- **Real-time Streaming**: Get answers as they're generated

### 📄 Document Management
- **Multi-Format Support**: Upload PDF, Word, and text documents
- **Automatic Processing**: Documents are automatically indexed for AI search
- **Organized Storage**: Categorize documents by HR pillars
- **Quick Access**: View and download documents anytime

### ✅ Task Management
- **Category-Based Organization**: Organize tasks by HR pillars (Recruiting, Onboarding, Payroll, etc.)
- **Priority Levels**: Set High, Medium, or Low priority
- **Status Tracking**: Track Pending and Completed tasks
- **Smart Filtering**: Filter by priority, category, and search

### 👥 Multi-Tenant Organization Support
- **Organization Management**: Each organization has isolated data
- **User Invitations**: Invite team members via email
- **Role-Based Access**: Admin and Employee roles
- **Team Collaboration**: Share documents and tasks within your organization

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Smooth Animations**: Framer Motion animations for delightful interactions
- **Dark Mode Ready**: Clean, professional interface
- **Intuitive Navigation**: Easy-to-use sidebar and navigation

## 🏗️ Architecture

### Frontend (Next.js 16)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Context API
- **HTTP Client**: Axios

### Backend (FastAPI)
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Vector Database**: ChromaDB for document embeddings
- **AI/ML**: Ollama with Llama 3.2 for local LLM
- **Authentication**: JWT tokens
- **Email**: Gmail SMTP for invitations and notifications

## 📁 Project Structure

```
hr_new/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # App router pages
│   │   ├── (auth)/         # Authentication pages
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── invitations/
│   │   └── (dashboard)/    # Dashboard pages
│   │       ├── dashboard/
│   │       ├── ai-assistant/
│   │       ├── documents/
│   │       ├── tasks/
│   │       └── settings/
│   ├── components/          # Reusable components
│   │   ├── ui/             # UI components
│   │   └── landing/        # Landing page components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utilities and API client
│   └── public/             # Static assets
│
└── backend/                 # FastAPI backend application
    ├── main.py             # Main application entry
    ├── models.py           # Pydantic models
    ├── database.py         # MongoDB connection
    ├── rag_utils.py        # RAG (Retrieval-Augmented Generation)
    ├── email_utils.py      # Email functionality
    ├── invitation_service.py
    ├── organization_service.py
    ├── chroma_db/          # Vector database storage
    └── uploads/            # Uploaded documents
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB** (local or cloud)
- **Ollama** with Llama 3.2 model
- **Gmail account** (for email notifications)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=hrnexus

   # Ollama Configuration
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2:latest

   # JWT Secret Key
   SECRET_KEY=your-secret-key-here

   # Email Configuration (Gmail SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   EMAIL_FROM=HR Nexus <your-email@gmail.com>

   # Frontend URL (for email links)
   FRONTEND_URL=http://localhost:3000

   # Verification
   VERIFICATION_CODE_EXPIRY_MINUTES=10
   ```

5. **Start the backend server**
   ```bash
   python main.py
   ```
   
   The backend will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:3000`

### Ollama Setup

1. **Install Ollama**
   
   Download from [ollama.ai](https://ollama.ai)

2. **Pull the Llama 3.2 model**
   ```bash
   ollama pull llama3.2
   ```

3. **Verify Ollama is running**
   ```bash
   ollama list
   ```

## 🔑 Key Features Explained

### RAG (Retrieval-Augmented Generation)
The AI Assistant uses RAG to provide accurate answers:
1. Documents are split into chunks and embedded using sentence transformers
2. User queries are embedded and matched against document chunks
3. Relevant chunks are retrieved and sent to the LLM
4. LLM generates answers with source citations

### Multi-Tenancy
- Each organization has isolated data
- Users belong to one organization
- All queries are automatically filtered by organization_id
- Middleware ensures data isolation at the API level

### Email Invitations
- Admins can invite users via email
- Invitation links expire after 7 days
- New users create accounts through invitation links
- Uses Gmail SMTP with app passwords

## 🎯 HR Pillars

The platform organizes HR operations into 8 core pillars:

1. **Recruiting** - Candidate screening and hiring
2. **Onboarding** - New hire orientation
3. **Payroll** - Salary and compensation
4. **Benefits** - Insurance and perks
5. **Learning & Development** - Training programs
6. **Employee Relations** - Workplace dynamics
7. **Performance** - Reviews and goals
8. **Offboarding** - Exit processes

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security
- **Data Isolation**: Multi-tenant architecture
- **CORS Protection**: Configured CORS policies
- **Input Validation**: Pydantic models for validation

## 📱 Mobile Optimization

The entire application is fully responsive and optimized for mobile devices:
- Touch-friendly UI elements
- Optimized layouts for small screens
- Reduced animations on mobile for performance
- Mobile-first navigation

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- Framer Motion
- Axios
- Lucide Icons

**Backend:**
- FastAPI
- MongoDB
- ChromaDB
- Ollama (Llama 3.2)
- Sentence Transformers
- bcrypt
- python-jose (JWT)

## 📝 API Endpoints

### Authentication
- `POST /auth/signup` - Create new organization
- `POST /auth/login` - User login
- `POST /auth/verify` - Email verification

### Documents
- `GET /documents` - List documents
- `POST /documents/upload` - Upload document
- `GET /documents/{id}/view` - View document
- `DELETE /documents/{id}` - Delete document

### Tasks
- `GET /tasks` - List tasks
- `POST /tasks` - Create task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task

### AI Assistant
- `POST /chat` - Chat with AI (supports streaming)

### Organizations
- `GET /organizations/me` - Get current organization
- `PUT /organizations/me` - Update organization
- `GET /organizations/me/stats` - Get statistics

### Invitations
- `POST /invitations` - Create invitation
- `GET /invitations` - List invitations
- `POST /invitations/accept/{token}` - Accept invitation
- `DELETE /invitations/{id}` - Revoke invitation

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- **Ollama** for local LLM inference
- **ChromaDB** for vector storage
- **FastAPI** for the excellent Python framework
- **Next.js** for the React framework
- **Tailwind CSS** for styling utilities

---

**Built with ❤️ for modern HR teams**
