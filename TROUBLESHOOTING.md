# 🔧 CollisionOS Troubleshooting Guide

## 🚨 Black Screen Issue

If you see a black screen for a second and then nothing happens, try these solutions:

### Solution 1: Use the Test Launcher

1. **Double-click** `Test Launch.bat`
2. This will show you exactly what's happening
3. Look for error messages in the console

### Solution 2: Use the Fixed Launcher

1. **Double-click** `Launch CollisionOS - Fixed.bat`
2. This launcher starts components separately
3. You'll see multiple windows - this is normal

### Solution 3: Use Quick Launch

1. **Double-click** `Quick Launch.bat`
2. This is the simplest option
3. Keep the window open to see any errors

---

## 🔍 Common Issues & Fixes

### ❌ "Node.js not found"

**Fix:** Install Node.js from https://nodejs.org/

### ❌ "npm not found"

**Fix:** Node.js includes npm - reinstall Node.js

### ❌ "package.json not found"

**Fix:** Make sure you're in the CollisionOS folder

### ❌ "Port 3000/3001 in use"

**Fix:**

1. Close other applications
2. Restart your computer
3. Or run: `netstat -ano | findstr :3000` to find what's using the port

### ❌ "Dependencies missing"

**Fix:** Run `npm install` in the CollisionOS folder

### ❌ "Database error"

**Fix:** Run `npm run db:seed` to recreate the database

---

## 🚀 Manual Startup (If Launchers Don't Work)

If none of the launchers work, start manually:

### Step 1: Open Command Prompt

1. Press `Win + R`
2. Type `cmd`
3. Press Enter
4. Navigate to your CollisionOS folder: `cd "C:\Users\farha\OneDrive\Desktop\CollisionOS"`

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Seed Database

```bash
npm run db:seed
```

### Step 4: Start Application

```bash
npm run electron-dev
```

---

## 🎯 What Each Launcher Does

### `Launch CollisionOS.bat` (Original)

- Runs `npm run electron-dev`
- May have timing issues

### `Test Launch.bat` (Diagnostic)

- Tests each component separately
- Shows detailed error messages
- Best for troubleshooting

### `Launch CollisionOS - Fixed.bat` (Separate Windows)

- Starts server, client, and Electron separately
- Shows multiple console windows
- More reliable but more complex

### `Quick Launch.bat` (Simple)

- Just runs the original command
- Keeps window open to see errors

---

## 🔧 Advanced Troubleshooting

### Check if React Server is Running

1. Open browser
2. Go to `http://localhost:3000`
3. Should see the CollisionOS login page

### Check if API Server is Running

1. Open browser
2. Go to `http://localhost:3001/health`
3. Should see a JSON response

### Check Electron Logs

1. When the app starts, press `F12` or `Ctrl+Shift+I`
2. Look at the Console tab for errors

### Reset Everything

1. Close all command prompts
2. Delete `node_modules` folder
3. Delete `data/collisionos.db`
4. Run `npm install`
5. Run `npm run db:seed`
6. Try the launcher again

---

## 📞 Still Having Issues?

If nothing works:

1. **Check Windows Defender** - It might be blocking the app
2. **Run as Administrator** - Right-click launcher → "Run as administrator"
3. **Update Node.js** - Download the latest version
4. **Restart Computer** - Sometimes fixes port issues
5. **Check Antivirus** - Temporarily disable to test

---

## 🎉 Success Indicators

When CollisionOS starts successfully, you should see:

1. ✅ A desktop window opens with the CollisionOS interface
2. ✅ Login page appears
3. ✅ You can log in with demo credentials
4. ✅ Dashboard loads with clickable elements

**Login Credentials:**

- Username: `admin` / Password: `admin123`
- Username: `manager` / Password: `manager123`
- Username: `estimator` / Password: `estimator123`

---

**🚀 Happy troubleshooting!** 🚗
