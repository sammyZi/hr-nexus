# HR Nexus - Quick Start Guide

## Batch Files for Windows

This project includes several batch files to make development easier on Windows.

### Available Commands

#### 🚀 Start All Services
```bash
start-all.bat
```
Starts all three services (Backend, Frontend, Mobile) in separate windows.

#### 🔧 Start Individual Services

**Backend Only:**
```bash
start-backend.bat
```
- Starts FastAPI server on http://localhost:8000
- API docs available at http://localhost:8000/docs

**Frontend Only:**
```bash
start-frontend.bat
```
- Starts Next.js server on http://localhost:3000

**Mobile Only:**
```bash
start-mobile.bat
```
- Starts Expo development server
- Scan QR code with Expo Go app

#### 🎯 Quick Development (Backend + Frontend)
```bash
start-dev.bat
```
Starts only backend and frontend servers. Press any key to stop both.

#### 🛑 Stop All Services
```bash
stop-all.bat
```
Stops all running HR Nexus services.

---

## Prerequisites

### Required Software

1. **Python 3.8+**
   - Download: https://www.python.org/downloads/
   - Make sure to check "Add Python to PATH" during installation

2. **Node.js 18+**
   - Download: https://nodejs.org/
   - Includes npm automatically

3. **For Mobile Development:**
   - Install Expo Go app on your phone (iOS/Android)
   - Or set up Android Studio / Xcode for emulators

---

## First Time Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file in `backend` folder:
```env
DATABASE_URL=sqlite:///./hr_nexus.db
SECRET_KEY=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env.local` file in `frontend` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Mobile Setup
```bash
cd mobile
npm install
```

Create `.env` file in `mobile` folder:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
```

Run `get-ip.bat` in the mobile folder to get your local IP address.

---

## Usage Examples

### Scenario 1: Full Stack Development
```bash
# Start everything
start-all.bat

# Work on your code...

# Stop everything when done
stop-all.bat
```

### Scenario 2: Backend + Frontend Only
```bash
# Quick start for web development
start-dev.bat

# Press any key to stop both servers
```

### Scenario 3: Individual Services
```bash
# Terminal 1: Backend
start-backend.bat

# Terminal 2: Frontend
start-frontend.bat

# Terminal 3: Mobile (optional)
start-mobile.bat
```

---

## Troubleshooting

### Port Already in Use

**Backend (Port 8000):**
```bash
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Frontend (Port 3000):**
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Python Virtual Environment Issues
```bash
cd backend
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Node Modules Issues
```bash
# Frontend
cd frontend
rmdir /s /q node_modules
npm install

# Mobile
cd mobile
rmdir /s /q node_modules
npm install
```

### Mobile App Not Connecting
1. Make sure backend is running
2. Check your `.env` file has correct IP address
3. Run `get-ip.bat` to verify your local IP
4. Ensure phone and computer are on same WiFi network
5. Check firewall isn't blocking port 8000

---

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:8000 | FastAPI server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:3000 | Next.js web app |
| Mobile | Expo QR Code | React Native app |

---

## Tips

1. **Keep terminals open** - Each service runs in its own window
2. **Check logs** - Each window shows real-time logs
3. **Auto-reload** - All services support hot reload during development
4. **Stop cleanly** - Use `stop-all.bat` or close individual windows

---

## Need Help?

- Check `QUICK_START.md` for detailed setup instructions
- Check `README.md` for project overview
- Review individual service READMEs in their folders
