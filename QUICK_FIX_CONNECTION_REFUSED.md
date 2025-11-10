# Quick Fix Guide - Connection Refused

## 🔍 Problem Diagnosis

The error `ERR_CONNECTION_REFUSED` means the frontend can't connect to the backend.

## ✅ Server Status

**Backend Server**: ✅ Running on port 3002
**Frontend Client**: ❓ Need to check

---

## 🚀 Solution: Start Both Server AND Client

You need **TWO** terminals running:

### Terminal 1 - Backend Server (Already Running ✅)
```bash
npm run server
```

### Terminal 2 - Frontend Client (Need to Start ❌)
```bash
npm run client
```

---

## 🎯 Quick Start (Both Together)

**Option 1: Start Both at Once**
```bash
npm start
```
This starts both server (port 3002) and client (port 3000) together.

**Option 2: Start Separately**
- Terminal 1: `npm run server`
- Terminal 2: `npm run client`

---

## ✅ What You Should See

### Backend Terminal:
```
✅ Server running on port 3002
✅ Database connected
```

### Frontend Terminal:
```
Compiled successfully!
You can now view collision-os in the browser.
  Local:            http://localhost:3000
```

---

## 🔧 If Still Not Working

1. **Check Browser Console** (F12):
   - Look for the exact error message
   - Check Network tab - see which requests are failing

2. **Verify Ports**:
   - Backend: http://localhost:3002/health (should work)
   - Frontend: http://localhost:3000 (should show React app)

3. **Check Proxy**:
   - Frontend uses proxy: `"proxy": "http://localhost:3002"` in package.json
   - This should handle API requests automatically

---

## 📝 Next Steps

1. **Start the frontend client**:
   ```bash
   npm run client
   ```

2. **Wait for compilation** (30-60 seconds)

3. **Open browser**: http://localhost:3000

4. **Try logging in**

---

**The backend is running fine - you just need to start the frontend client!**

