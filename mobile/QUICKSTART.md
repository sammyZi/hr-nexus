# Quick Start Guide - HR Nexus Mobile

Get your HR Nexus mobile app running in 5 minutes!

## Step 1: Prerequisites ✓

Install these if you haven't:
- ✅ Node.js 18+ from https://nodejs.org/
- ✅ Expo Go app on your phone (App Store/Google Play)

## Step 2: Setup Backend 🖥️

1. Make sure backend is running:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0
   ```

2. Find your computer's IP address:
   - **Windows:** Open CMD and run `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

## Step 3: Setup Mobile App 📱

1. Open new terminal and navigate to mobile:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   copy .env.example .env
   ```

4. Edit `.env` and replace with YOUR IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
   ```
   ⚠️ Replace `192.168.1.100` with YOUR actual IP from Step 2!

## Step 4: Start the App 🚀

1. Start Expo:
   ```bash
   npm start
   ```

2. Open Expo Go on your phone

3. Scan the QR code that appears in terminal

4. Wait for app to load (first time takes ~30 seconds)

## Step 5: Test It! 🎉

1. You should see the Sign In screen
2. Create an account or sign in
3. Start managing HR tasks!

## Troubleshooting 🔧

**"Cannot connect to server"**
- ✅ Is backend running?
- ✅ Are phone and computer on same WiFi?
- ✅ Did you use YOUR computer's IP in `.env`?

**"Network request failed"**
- ✅ Check Windows Firewall isn't blocking port 8000
- ✅ Test backend in browser: `http://YOUR_IP:8000/docs`

**App won't load**
```bash
# Clear cache and restart
npx expo start --clear
```

## Common Commands

```bash
# Start development server
npm start

# Start with cache cleared
npx expo start --clear

# Check if backend is accessible
# Open in browser: http://YOUR_IP:8000/docs

# Restart backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0
```

## Need Help?

1. Check backend is running at `http://YOUR_IP:8000/docs`
2. Verify phone and computer on same network
3. Make sure `.env` has correct IP address
4. Try restarting both backend and Expo server

## What's Next?

- 📱 Create and manage tasks
- 💬 Chat with AI Assistant
- 📊 View dashboard statistics
- ⚙️ Configure settings

Happy HR managing! 🎯
