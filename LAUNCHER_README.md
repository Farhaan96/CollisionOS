# 🚗 CollisionOS Desktop Launchers

This folder contains several ways to launch your CollisionOS desktop application easily.

## 📋 Available Launchers

### 1. **Launch CollisionOS.bat** (Recommended)

- **Double-click to run**: Simple Windows batch file
- **Features**:
  - Automatically installs dependencies if missing
  - Initializes database on first run
  - Shows progress and error messages
  - Launches the full desktop app with Electron
- **Best for**: Most users who want a simple double-click solution

### 2. **Launch-CollisionOS.ps1** (Advanced)

- **PowerShell script** with additional options
- **Features**:
  - Color-coded output and progress indicators
  - Command-line options for different launch modes
  - Better error handling and troubleshooting tips
- **Usage Options**:

  ```powershell
  # Standard launch (desktop app)
  .\Launch-CollisionOS.ps1

  # Web-only mode (no desktop window)
  .\Launch-CollisionOS.ps1 -WebOnly

  # Debug mode (with developer tools)
  .\Launch-CollisionOS.ps1 -DebugMode

  # Skip dependency check (faster startup)
  .\Launch-CollisionOS.ps1 -SkipDependencies
  ```

- **Best for**: Power users who want more control

### 3. **Create-Desktop-Shortcut.ps1**

- **Right-click → Run with PowerShell** to create a desktop shortcut
- Creates a shortcut on your desktop that launches CollisionOS
- **Best for**: Users who want easy desktop access

## 🚀 Quick Start

1. **First-time setup**: Double-click `Launch CollisionOS.bat`
2. **Daily use**: Use the desktop shortcut (after running step 1)
3. **Development**: Use PowerShell launcher with options

## 🌐 Access Methods

Once launched, you can access CollisionOS in two ways:

- **🖥️ Desktop App**: Automatically opens in an Electron window
- **🌐 Web Browser**: Navigate to http://localhost:3003

## 🔑 Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

Or use any of these test accounts:

- `manager` / `manager123` (Manager)
- `estimator` / `estimator123` (Estimator)
- `technician` / `technician123` (Technician)

## ❓ Troubleshooting

### App won't start?

1. Make sure Node.js is installed
2. Check that ports 3003 and 3005 are available
3. Try the PowerShell launcher for better error messages

### Missing dependencies?

1. Delete the `node_modules` folder
2. Run the launcher again (it will reinstall automatically)

### Database issues?

1. Delete the `data/collisionos.db` file
2. Run the launcher again (it will recreate the database)

## 🛠️ Manual Commands

If you prefer command line:

```bash
# Install dependencies
npm install

# Initialize database
npm run db:migrate
npm run db:seed

# Launch desktop app
npm run dev

# Launch web-only
npm start

# Launch with debugging
npm run dev:debug
```

## 📁 File Structure

- `Launch CollisionOS.bat` - Simple batch launcher
- `Launch-CollisionOS.ps1` - Advanced PowerShell launcher
- `Create-Desktop-Shortcut.ps1` - Creates desktop shortcut
- `CollisionOS.url` - Web shortcut file
- `LAUNCHER_README.md` - This documentation

---

**Need help?** Check the main README.md or open an issue in the project repository.
