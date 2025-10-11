# CollisionOS Mobile - Setup Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Step 1: Install Dependencies
```bash
cd mobile-app
npm install
```

### Step 2: Configure API Endpoint
Create `.env` file:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

Or for local network testing (find your IP with `ipconfig` or `ifconfig`):
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3001/api
```

### Step 3: Start Expo Dev Server
```bash
npm start
```

### Step 4: Run on Device/Simulator

**Option A: Physical Device (Recommended for camera testing)**
1. Install "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan QR code from terminal
3. App will load on your device

**Option B: iOS Simulator (macOS only)**
```bash
npm run ios
```

**Option C: Android Emulator**
```bash
npm run android
```

---

## 📱 Testing Credentials

Use these credentials from your CollisionOS backend:

```
Email: technician@example.com
Password: password123
```

Or create a new technician user in the web app.

---

## 🔧 Troubleshooting

### Issue: "Unable to resolve module"
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### Issue: "Network request failed" when logging in
1. Check backend server is running: `http://localhost:3001/api/health`
2. Update `.env` with correct IP (not localhost) if using physical device
3. Ensure firewall allows port 3001

### Issue: Camera not working
1. Check `app.json` has camera permissions
2. On iOS simulator, camera is not available (use physical device)
3. On Android, grant camera permissions in app settings

### Issue: App crashes on startup
```bash
# Check Expo logs
npx expo start

# View device logs
npx react-native log-ios    # For iOS
npx react-native log-android # For Android
```

---

## 📦 Project Structure Explained

```
mobile-app/
├── App.js                         # Entry point, sets up providers
├── app.json                       # Expo config (permissions, icons, etc.)
├── package.json                   # Dependencies
├── .env                          # API URL (create this!)
│
├── src/
│   ├── navigation/
│   │   └── RootNavigator.js      # Auth flow + main tabs
│   │
│   ├── screens/                  # All UI screens
│   │   ├── auth/
│   │   │   └── LoginScreen.js
│   │   ├── jobs/
│   │   │   ├── JobListScreen.js  # Main screen: job list
│   │   │   └── JobDetailScreen.js # Job details + photo upload
│   │   ├── timeclock/
│   │   │   └── TimeClockScreen.js # Punch in/out
│   │   ├── camera/
│   │   │   └── CameraScreen.js   # Camera UI
│   │   └── profile/
│   │       └── ProfileScreen.js  # User settings
│   │
│   ├── store/                    # Redux state management
│   │   ├── store.js             # Redux store config
│   │   ├── api/
│   │   │   └── apiSlice.js      # API client (axios)
│   │   └── slices/
│   │       ├── authSlice.js     # Login/logout state
│   │       ├── jobsSlice.js     # Jobs data
│   │       └── timeClockSlice.js # Time tracking
│   │
│   ├── services/
│   │   └── NotificationService.js # Push notifications
│   │
│   └── constants/
│       └── theme.js              # App colors/styles
```

---

## 🔌 Backend API Requirements

The mobile app expects these endpoints from CollisionOS backend:

### Authentication
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/logout`

### Jobs
- ✅ `GET /api/jobs?technician_id={id}`
- ✅ `GET /api/jobs/:id`
- 🔶 `PATCH /api/jobs/:id/status` (may need to add)
- 🔶 `POST /api/jobs/:id/photos` (may need to add)

### Time Clock
- 🔶 `POST /api/timeclock/clock-in` (already exists in backend)
- 🔶 `POST /api/timeclock/clock-out` (already exists in backend)
- ✅ `GET /api/timeclock/entries`

> **Note**: Routes marked with 🔶 may need to be wired up. Check `server/routes/timeclock.js`.

---

## 🎨 Customization

### Change App Theme
Edit `src/constants/theme.js`:
```javascript
export const theme = {
  colors: {
    primary: '#1976d2',    // Change this to your brand color
    secondary: '#f57c00',
    // ...
  },
};
```

### Change App Icon
Replace files:
- `assets/icon.png` (1024x1024)
- `assets/adaptive-icon.png` (Android)
- `assets/splash.png` (Splash screen)

### Add New Screen
1. Create screen file: `src/screens/MyScreen.js`
2. Add route in `src/navigation/RootNavigator.js`
3. Add to bottom tabs or stack navigator

---

## 📸 Camera Permissions (Important!)

### iOS
Already configured in `app.json`:
```json
"ios": {
  "infoPlist": {
    "NSCameraUsageDescription": "This app uses the camera to scan barcodes and take photos for job documentation"
  }
}
```

### Android
Already configured in `app.json`:
```json
"android": {
  "permissions": [
    "android.permission.CAMERA"
  ]
}
```

---

## 🧪 Testing Features

### Test Camera (Physical Device Only)
1. Go to "Camera" tab
2. Grant camera permission when prompted
3. Take photo
4. Photo will upload to backend

### Test Time Clock
1. Go to "Time Clock" tab
2. Tap "Clock In"
3. Verify time is tracking
4. Tap "Clock Out"
5. Check "Today's Summary"

### Test Job Updates
1. Go to "Jobs" tab
2. Tap on a job
3. Tap "Start Job" (if not started)
4. Verify status changes in backend

### Test Offline Mode (Next Phase)
1. Enable airplane mode
2. Update job status (should queue action)
3. Disable airplane mode
4. Verify action syncs to backend

---

## 🚀 Building for App Stores

### iOS (Requires macOS + Apple Developer Account)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android (No special requirements)
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

---

## 📊 Performance Optimization

### Image Compression
Already implemented in camera upload:
```javascript
quality: 0.8  // 80% quality (reduces file size)
```

### Lazy Loading
Implemented in job list with `FlatList`:
```javascript
<FlatList
  data={jobs}
  renderItem={renderJobCard}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
/>
```

### Caching
Enabled via Redux Persist:
- Jobs cached locally
- Auth state persisted
- Works offline (partially)

---

## 🔐 Security Best Practices

### Already Implemented
- ✅ JWT token storage in secure AsyncStorage
- ✅ Auto-logout on token expiration
- ✅ HTTPS for production API
- ✅ No sensitive data in Redux logs

### TODO
- [ ] Biometric login (Face ID / Fingerprint)
- [ ] PIN code for app access
- [ ] Certificate pinning for API

---

## 📝 Next Steps

After setup is complete:

1. **Test all features**
   - Login
   - View jobs
   - Clock in/out
   - Upload photos
   - Update job status

2. **Connect to production API**
   - Update `.env` with production URL
   - Test with real data

3. **Build for testing**
   - Use Expo Go for internal testing
   - Build standalone app for beta testers

4. **Add advanced features**
   - Offline mode (SQLite)
   - Push notifications
   - Barcode scanner
   - Voice notes

---

## 🆘 Getting Help

- **Expo Docs**: https://docs.expo.dev/
- **React Native Paper**: https://callstack.github.io/react-native-paper/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **CollisionOS Backend**: See main `README.md`

---

**Ready to compete with IMEX Mobile! 🚀**
