# HR Nexus Mobile App

A React Native Expo mobile application for HR Nexus - your comprehensive HR management system on the go.

## 📱 Features

### Authentication
- ✅ Sign in / Sign up
- ✅ Email verification
- ✅ Invitation acceptance
- ✅ Secure token storage

### Task Management
- ✅ View all tasks
- ✅ Filter by category (Recruiting, Onboarding, Performance, etc.)
- ✅ Create new tasks
- ✅ Update task status (To Do → In Progress → Completed)
- ✅ Edit and delete tasks
- ✅ Priority levels (Low, Medium, High)

### AI Assistant
- ✅ Chat with AI for HR queries
- ✅ Upload documents for context
- ✅ Conversation history
- ✅ Real-time responses

### Dashboard
- ✅ Quick overview of HR pillars
- ✅ Task statistics
- ✅ Organization info

### Settings
- ✅ Account information
- ✅ Organization details
- ✅ Sign out

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (https://nodejs.org/)
- npm or yarn
- Expo Go app on your mobile device
  - iOS: Download from App Store
  - Android: Download from Google Play
- Running backend server (see backend README)

### Installation

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   copy .env.example .env
   ```

4. **Configure API URL in `.env`:**
   
   For **physical device** (recommended for testing):
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:8000
   ```
   Find your IP:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
   
   For **Android emulator**:
   ```
   EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
   ```
   
   For **iOS simulator**:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```

### Running the App

1. **Start the Expo development server:**
   ```bash
   npm start
   ```

2. **Open on your device:**
   
   **Option A: Physical Device (Recommended)**
   - Open Expo Go app
   - Scan the QR code from terminal
   
   **Option B: iOS Simulator (Mac only)**
   - Press `i` in terminal
   
   **Option C: Android Emulator**
   - Press `a` in terminal
   
   **Option D: Web Browser**
   - Press `w` in terminal

## 📁 Project Structure

```
mobile/
├── app/                          # App screens (Expo Router)
│   ├── (auth)/                  # Authentication flow
│   │   ├── _layout.tsx          # Auth layout
│   │   ├── signin.tsx           # Sign in screen
│   │   ├── signup.tsx           # Sign up screen
│   │   └── verify.tsx           # Email verification
│   ├── (tabs)/                  # Main app tabs
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── index.tsx            # Dashboard
│   │   ├── tasks.tsx            # Tasks screen
│   │   ├── assistant.tsx        # AI Assistant
│   │   └── settings.tsx         # Settings
│   └── _layout.tsx              # Root layout
├── components/                   # Reusable UI components
│   ├── Button.tsx               # Custom button
│   ├── Card.tsx                 # Card container
│   ├── Input.tsx                # Text input
│   └── TaskCard.tsx             # Task display card
├── contexts/                     # React contexts
│   ├── AuthContext.tsx          # Authentication state
│   └── OrganizationContext.tsx  # Organization data
├── lib/                          # Utilities
│   ├── api.ts                   # API client
│   └── storage.ts               # Secure storage
├── constants/                    # App constants
│   ├── app.ts                   # App-wide constants
│   └── theme.ts                 # Theme colors & styles
├── types/                        # TypeScript types
│   └── index.ts                 # Type definitions
├── assets/                       # Images and icons
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
└── tsconfig.json                # TypeScript config
```

## 🛠️ Tech Stack

- **Framework:** React Native with Expo SDK 51
- **Navigation:** Expo Router (file-based routing)
- **Language:** TypeScript
- **HTTP Client:** Axios
- **Storage:** Expo Secure Store
- **Icons:** @expo/vector-icons (Ionicons)
- **Document Picker:** expo-document-picker
- **Image Picker:** expo-image-picker

## 🔧 Configuration

### API Connection

The app connects to your backend via the `EXPO_PUBLIC_API_URL` environment variable. Make sure:

1. Backend is running on port 8000
2. Backend allows CORS from your device's IP
3. Your device and computer are on the same network

### Backend Requirements

Ensure your backend is configured with:
- CORS enabled for mobile app
- Endpoints match the API client in `lib/api.ts`
- JWT authentication working
- File upload endpoints configured

## 📱 Testing on Different Platforms

### iOS (Mac required)
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## 🐛 Troubleshooting

### Cannot connect to backend
- ✅ Check backend is running: `http://YOUR_IP:8000/docs`
- ✅ Verify `.env` has correct IP address
- ✅ Ensure device and computer on same network
- ✅ Check firewall isn't blocking port 8000

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### Authentication issues
- ✅ Clear app data in Expo Go
- ✅ Verify token storage in SecureStore
- ✅ Check backend JWT configuration

### Module not found errors
```bash
npm install
npx expo start --clear
```

## 🚢 Building for Production

### Android APK
```bash
npx eas build --platform android --profile preview
```

### iOS IPA (requires Apple Developer account)
```bash
npx eas build --platform ios --profile preview
```

### Setup EAS Build
1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Configure: `eas build:configure`

## 📝 Available Scripts

- `npm start` - Start Expo dev server
- `npm run android` - Open on Android
- `npm run ios` - Open on iOS (Mac only)
- `npm run web` - Open in web browser
- `npm run lint` - Run ESLint

## 🔐 Security

- Tokens stored in Expo SecureStore (encrypted)
- JWT-based authentication
- Automatic token refresh handling
- Secure password input fields

## 🤝 Contributing

When adding new features:
1. Follow the existing project structure
2. Add TypeScript types in `types/index.ts`
3. Use existing UI components from `components/`
4. Update this README if needed

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions:
- Check backend logs for API errors
- Review Expo dev tools for client errors
- Ensure all dependencies are installed
- Verify environment configuration

## 🎯 Roadmap

- [ ] Document management screen
- [ ] Offline support
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Calendar integration
- [ ] Performance reviews module
