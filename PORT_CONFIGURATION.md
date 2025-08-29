# Port Configuration Guide

## 🎯 Target Port Configuration

Your CollisionOS application is now configured to run on:
- **Frontend (React)**: `http://localhost:3000`
- **Backend (API)**: `http://localhost:3001`

## 📋 Configuration Changes Made

### 1. **package.json Updates**
```json
{
  "proxy": "http://localhost:3001",
  "scripts": {
    "client": "set BROWSER=none&& set PORT=3000&& set FAST_REFRESH=false&& react-scripts start",
    "dev": "concurrently \"npm run server\" \"npm run client\" \"wait-on http://localhost:3000 && electron .\"",
    "dev:debug": "concurrently \"npm run server\" \"npm run client\" \"wait-on http://localhost:3000 && electron . --inspect\"",
    "electron-dev": "concurrently \"npm run server\" \"npm run client\" \"wait-on http://localhost:3000 && electron .\""
  }
}
```

### 2. **server/index.js Updates**
```javascript
const PORT = process.env.SERVER_PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://collisionos.com', 'https://app.collisionos.com']
    : ['http://localhost:3000'],
  credentials: true
}));
```

## 🚀 How to Start the Application

### Option 1: Start Both Frontend and Backend
```bash
npm run dev
```

### Option 2: Start Frontend Only (UI Development)
```bash
npm run dev:ui
```

### Option 3: Start Backend Only (API Development)
```bash
npm run dev:server
```

### Option 4: Start with Electron (Desktop App)
```bash
npm run electron-dev
```

## 🔧 Environment Variables

Create a `.env` file in your project root with:

```env
# Server Configuration
SERVER_PORT=3001
CLIENT_PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=collisionos_jwt_secret_key_2024_make_it_secure_and_random
JWT_EXPIRES_IN=24h

# Database Configuration
SQLITE_PATH=./data/collisionos.db

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🌐 Access Points

Once running, you can access:

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`
- **API Health Check**: `http://localhost:3001/health`
- **API Documentation**: `http://localhost:3001/api`

## 🔍 Verification Steps

### 1. Check if ports are available
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Check if port 3001 is in use
netstat -ano | findstr :3001
```

### 2. Kill processes if needed
```bash
# Kill process on port 3000 (replace PID with actual process ID)
taskkill /PID <PID> /F

# Kill process on port 3001 (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### 3. Test the application
1. Start the application: `npm run dev`
2. Open browser to: `http://localhost:3000`
3. You should see the login page
4. API should be available at: `http://localhost:3001`

## 🚨 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

1. **Find the process using the port**:
   ```bash
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

2. **Kill the process**:
   ```bash
   taskkill /PID <PID> /F
   ```

3. **Alternative: Use different ports**:
   - Update `package.json` client script: `set PORT=3002`
   - Update `server/index.js`: `const PORT = 3003`
   - Update proxy: `"proxy": "http://localhost:3003"`

### CORS Issues
If you encounter CORS errors:

1. **Check server CORS configuration** in `server/index.js`
2. **Verify proxy settings** in `package.json`
3. **Ensure environment variables** are set correctly

### Authentication Issues
If login doesn't work:

1. **Check server is running** on port 3001
2. **Verify proxy configuration** in package.json
3. **Check browser console** for network errors
4. **Test API directly**: `http://localhost:3001/health`

## 📊 Port Usage Summary

| Service | Port | Purpose | URL |
|---------|------|---------|-----|
| React Frontend | 3000 | User Interface | `http://localhost:3000` |
| Express Backend | 3001 | API Server | `http://localhost:3001` |
| Proxy | 3000→3001 | API Requests | Automatic |

## ✅ Success Indicators

Your application is correctly configured when:

1. ✅ Frontend loads at `http://localhost:3000`
2. ✅ Login page appears
3. ✅ Backend responds at `http://localhost:3001/health`
4. ✅ No CORS errors in browser console
5. ✅ Authentication works properly
6. ✅ Dashboard loads after login

## 🔄 Quick Commands

```bash
# Start everything
npm run dev

# Start just the UI
npm run dev:ui

# Start just the server
npm run dev:server

# Start with Electron
npm run electron-dev

# Check what's running on ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

Your CollisionOS application is now properly configured to run on ports 3000 and 3001!
