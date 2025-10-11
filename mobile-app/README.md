# CollisionOS Mobile - Technician App

**React Native (Expo) mobile app for collision repair technicians**

## 🚀 Features

### ✅ Implemented (MVP Complete)

1. **Job Management**
   - View assigned jobs list with real-time status
   - Job detail view with vehicle/customer info
   - Update job status (start, pause, complete)
   - Search and filter jobs

2. **Time Clock**
   - Punch in/out functionality
   - Job-level time tracking
   - Daily time summary
   - Automatic sync with backend

3. **Photo Upload**
   - Take photos with camera
   - Upload from gallery
   - Associate photos with jobs
   - Image preview and management

4. **User Profile**
   - View account details
   - App settings (notifications, theme)
   - Performance stats
   - Logout

5. **Offline Mode** (Planned)
   - Local SQLite cache
   - Queue actions when offline
   - Auto-sync when online

---

## 📱 Screens Overview

### Authentication
- **LoginScreen** - Email/password login

### Main App (Bottom Tabs)
- **JobListScreen** - List of assigned jobs with search
- **TimeClockScreen** - Punch in/out, time tracking
- **CameraScreen** - Quick camera access
- **ProfileScreen** - User settings and stats

### Detail Screens
- **JobDetailScreen** - Job details, photo upload, status updates

---

## 🛠️ Tech Stack

- **Framework**: React Native (Expo 49)
- **UI Library**: React Native Paper (Material Design)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **Offline Storage**: Redux Persist + AsyncStorage (+ SQLite for advanced caching)
- **Camera**: expo-camera
- **Image Picker**: expo-image-picker
- **Notifications**: expo-notifications
- **API**: Axios for backend communication

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Studio
- Physical device (optional, for testing camera/GPS)

### Installation

```bash
# Navigate to mobile-app directory
cd mobile-app

# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on physical device (scan QR code with Expo Go app)
```

---

## 📂 Project Structure

```
mobile-app/
├── src/
│   ├── navigation/
│   │   └── RootNavigator.js       # Main navigation setup
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.js     # Authentication
│   │   ├── jobs/
│   │   │   ├── JobListScreen.js   # Job list
│   │   │   └── JobDetailScreen.js # Job details
│   │   ├── timeclock/
│   │   │   └── TimeClockScreen.js # Time tracking
│   │   ├── camera/
│   │   │   └── CameraScreen.js    # Camera
│   │   ├── profile/
│   │   │   └── ProfileScreen.js   # User profile
│   │   └── LoadingScreen.js       # Loading state
│   ├── store/
│   │   ├── store.js               # Redux store config
│   │   ├── api/
│   │   │   └── apiSlice.js        # API client
│   │   └── slices/
│   │       ├── authSlice.js       # Authentication state
│   │       ├── jobsSlice.js       # Jobs state
│   │       └── timeClockSlice.js  # Time clock state
│   ├── services/
│   │   └── NotificationService.js # Push notifications
│   └── constants/
│       └── theme.js               # App theme
├── App.js                         # App entry point
├── app.json                       # Expo config
└── package.json                   # Dependencies
```

---

## 🔌 Backend API Integration

The app expects the following API endpoints (based on CollisionOS backend):

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout

### Jobs
- `GET /api/jobs?technician_id={id}` - Get technician's jobs
- `GET /api/jobs/:id` - Get job details
- `PATCH /api/jobs/:id/status` - Update job status
- `POST /api/jobs/:id/photos` - Upload photo to job

### Time Clock
- `POST /api/timeclock/clock-in` - Clock in (with optional job_id)
- `POST /api/timeclock/clock-out` - Clock out
- `GET /api/timeclock/entries?technician_id={id}&date={date}` - Get time entries

### Notifications
- `POST /api/notifications/register-device` - Register push token

---

## 🎨 Design Principles (IMEX-Inspired)

1. **Mobile-First UX**
   - Large touch targets (min 44x44 points)
   - Clear visual hierarchy
   - Bottom navigation for frequent actions
   - Pull-to-refresh pattern

2. **Offline Capability**
   - Cache job data locally (SQLite)
   - Queue actions when offline
   - Sync when connection restored

3. **Performance**
   - Image compression before upload
   - Lazy loading for job list
   - Optimistic UI updates

4. **Accessibility**
   - High contrast colors
   - Screen reader support
   - Large text option

---

## 🧪 Testing

```bash
# Unit tests (Jest)
npm test

# Run tests in watch mode
npm run test:watch

# E2E tests (Detox - requires setup)
npm run test:e2e
```

---

## 📦 Building for Production

### iOS (requires macOS + Xcode)
```bash
# Build for iOS
npm run build:ios

# This will create an .ipa file for App Store submission
```

### Android
```bash
# Build for Android
npm run build:android

# This will create an .apk or .aab file for Play Store
```

---

## 🔐 Environment Variables

Create `.env` file in mobile-app root:

```env
API_BASE_URL=http://localhost:3001/api
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

For production, use your server URL:
```env
API_BASE_URL=https://api.collisionos.com
```

---

## 🚀 Deployment

### Expo Go (Development)
```bash
expo publish
```

### Standalone Apps (Production)
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

---

## 🔄 Offline Mode Implementation (Next Phase)

### SQLite Caching
```javascript
// Store jobs locally
await SQLite.executeSqlAsync(
  'INSERT INTO jobs (id, data, synced) VALUES (?, ?, ?)',
  [job.id, JSON.stringify(job), 0]
);

// Sync when online
const unsyncedJobs = await SQLite.getAllAsync(
  'SELECT * FROM jobs WHERE synced = 0'
);
```

### Action Queue
```javascript
// Queue actions when offline
if (!isOnline) {
  await AsyncStorage.setItem('actionQueue', JSON.stringify([
    { type: 'UPDATE_JOB_STATUS', payload: { jobId, status } }
  ]));
}

// Process queue when online
const queue = await AsyncStorage.getItem('actionQueue');
for (const action of JSON.parse(queue)) {
  await dispatch(action);
}
```

---

## 📊 Performance Metrics

- **Startup Time**: < 3 seconds (target)
- **API Response**: < 500ms (95th percentile)
- **Image Upload**: < 5 seconds per photo
- **Offline Sync**: < 10 seconds for 100 jobs

---

## 🐛 Known Issues & Roadmap

### Known Issues
- [ ] Camera permissions require app restart on some Android devices
- [ ] Photo thumbnails not cached (reloads each time)

### Roadmap (Next 2 Weeks)
- [ ] Implement full offline mode with SQLite
- [ ] Add barcode scanner for parts
- [ ] Voice notes for job updates
- [ ] Push notifications for job assignments
- [ ] Digital signature capture
- [ ] Parts request feature

---

## 📝 Comparison with IMEX Mobile

| Feature | IMEX Mobile | CollisionOS Mobile | Status |
|---------|------------|-------------------|--------|
| Job List View | ✅ | ✅ | ✅ Complete |
| Job Details | ✅ | ✅ | ✅ Complete |
| Photo Upload | ✅ | ✅ | ✅ Complete |
| Time Clock | ✅ | ✅ | ✅ Complete |
| Status Updates | ✅ | ✅ | ✅ Complete |
| Push Notifications | ✅ | ⚠️ Infrastructure ready | 🔶 Partial |
| Offline Mode | ⚠️ Limited | ⚠️ Planned | 🔶 Next Phase |
| Barcode Scanning | ❌ | 🚀 Planned | 🟢 Advantage |
| Voice Notes | ❌ | 🚀 Planned | 🟢 Advantage |

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/awesome-feature`
2. Make changes and test on iOS/Android
3. Commit: `git commit -m "Add awesome feature"`
4. Push: `git push origin feature/awesome-feature`
5. Create Pull Request

---

## 📄 License

MIT License - CollisionOS Mobile App

---

## 🆘 Support

- **Documentation**: [IMEX Competitive Analysis](../.claude/project_updates/IMEX-competitive-analysis.md)
- **Backend API**: [CollisionOS Server README](../README.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/collision-os/issues)

---

**Built with ❤️ for collision repair technicians**
