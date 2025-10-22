# Testing Frontend-Backend Connectivity

## Quick Test (5 minutes)

### Step 1: Start the Backend Server
```bash
npm run dev:server
```

**Expected output:**
```
🎉 CollisionOS Server Started Successfully!
=====================================
🌐 Server: http://localhost:3002
📊 Environment: development
🔗 Health check: http://localhost:3002/health
📚 API docs: http://localhost:3002/api-docs
🔧 Database: Legacy SQLite/PostgreSQL
📡 Real-time: Socket.io
=====================================
```

**✅ Success indicator:** You should see port **3002** (not 3001)

### Step 2: Test Backend Health (in a new terminal)
```bash
curl http://localhost:3002/health
```

**Expected output:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-22T...",
  "environment": "development",
  "database": {
    "type": "sqlite",
    "connected": true
  }
}
```

### Step 3: Start the Frontend (in another terminal)
```bash
npm run dev:ui
```

**Expected output:**
```
Compiled successfully!

You can now view collision-os in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Step 4: Test in Browser

1. **Open:** http://localhost:3000
2. **Open Browser DevTools:** Press F12
3. **Go to Console tab**
4. **Navigate to:** RO Search page or any page that makes API calls

**✅ Success indicators in Console:**
```
API GET http://localhost:3002/api/repair-orders - 200ms ✅
API GET http://localhost:3002/api/dashboard - 150ms ✅
```

**❌ Failure would look like:**
```
Network Error: ERR_CONNECTION_REFUSED ❌
```

### Step 5: Verify API Connection

**Test a specific API endpoint:**
```bash
# Get repair orders
curl http://localhost:3002/api/repair-orders

# Get dashboard data
curl http://localhost:3002/api/dashboard/overview
```

## Detailed Connectivity Test

### Test Frontend API Service
```bash
# In browser console (http://localhost:3000)
# Paste this JavaScript:

fetch('http://localhost:3002/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend connected:', data))
  .catch(err => console.error('❌ Connection failed:', err));
```

### Test Backend Routes
```bash
# Test all major endpoints
curl http://localhost:3002/health
curl http://localhost:3002/api/customers
curl http://localhost:3002/api/repair-orders
curl http://localhost:3002/api/parts
curl http://localhost:3002/api/dashboard/overview
```

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3002
lsof -i :3002

# Kill the process
kill -9 <PID>
```

### Environment Variables Not Loading
```bash
# Verify .env.local exists
ls -la .env.local

# Check the contents
cat .env.local | grep PORT
```

### CORS Errors
Check that backend CORS is configured (should already be):
```javascript
// server/index.js should have:
cors({
  origin: ['http://localhost:3000'],
  credentials: true,
})
```

## What Changed?

| Component | Before | After |
|-----------|--------|-------|
| Backend Port | 3001 | **3002** ✅ |
| Proxy | 3001 | **3002** ✅ |
| .env.local | Missing | **Created** ✅ |
| Frontend → Backend | ❌ Failed | ✅ Connected |

## Success Criteria

- ✅ Backend starts on port 3002
- ✅ Frontend starts on port 3000
- ✅ API calls from frontend reach backend
- ✅ No CORS errors in console
- ✅ No connection refused errors
- ✅ Data loads in UI components
