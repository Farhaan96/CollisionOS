const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
// Force development mode for now to ensure it loads from localhost:3003
const isDev = true; // process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      // Security best practices for 2024
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      // Additional security measures
      sandbox: false, // Required for preload script
      webviewTag: false,
      plugins: false
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  console.log('Loading URL:', startUrl);
  
  // Load the URL with better error handling to prevent red crash page
  const loadWithRetry = async (retryCount = 0) => {
    try {
      await mainWindow.loadURL(startUrl);
    } catch (err) {
      console.log(`Loading attempt ${retryCount + 1} failed:`, err.message);
      if (retryCount < 5) {
        // Wait progressively longer between retries
        const delay = Math.min(1000 + (retryCount * 500), 5000);
        setTimeout(() => loadWithRetry(retryCount + 1), delay);
      } else {
        // Only show fallback page after multiple failures
        mainWindow.loadURL('data:text/html,<h1 style="color:#333;font-family:system-ui">Loading CollisionOS...</h1><p style="color:#666;font-family:system-ui">Starting development server...</p>');
      }
    }
  };
  
  loadWithRetry();

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
    mainWindow.focus(); // Ensure window is focused
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle page load errors more gracefully
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Page load issue:', errorCode, errorDescription);
    // Don't show error page immediately - let the retry logic handle it
    if (errorCode !== -3) { // -3 is aborted, which is normal during retries
      console.log('Non-critical load error, retrying...');
    }
  });

  // Handle navigation and ensure clicks work
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
    mainWindow.webContents.executeJavaScript(`
      console.log('CollisionOS: DOM loaded, enabling interactions');
      
      // Clean overlay removal without debug logging
      function removeOverlays() {
        const overlays = document.querySelectorAll('.MuiBackdrop-root, .MuiModal-backdrop, [data-rht-toaster]');
        overlays.forEach(overlay => {
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '-1';
        });
        
        // Remove webpack dev server overlay
        const webpackOverlay = document.getElementById('webpack-dev-server-client-overlay');
        if (webpackOverlay) {
          webpackOverlay.style.display = 'none';
          webpackOverlay.style.pointerEvents = 'none';
          webpackOverlay.style.zIndex = '-1';
        }
      }
      
      // Remove overlays immediately
      removeOverlays();
      
      // Watch for new overlays and remove them
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            removeOverlays();
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Ensure all interactive elements are properly clickable
      function enableInteractions() {
        const interactiveElements = document.querySelectorAll('button, [role="button"], a, .MuiButton-root, .MuiCard-root, input, textarea, select');
        interactiveElements.forEach(element => {
          element.style.pointerEvents = 'auto';
          if (element.tagName === 'BUTTON' || element.classList.contains('MuiButton-root')) {
            element.style.cursor = 'pointer';
          }
        });
      }
      
      // Enable interactions after a short delay to ensure DOM is ready
      setTimeout(enableInteractions, 100);
      
      console.log('Interactions enabled successfully');
    `);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window focus events
  mainWindow.on('focus', () => {
    console.log('Window focused');
  });

  mainWindow.on('blur', () => {
    console.log('Window blurred');
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Don't quit the app when window is closed - keep it running
  console.log('Window closed, but keeping app alive');
  // app.quit(); // Commented out to prevent immediate closure
});

// Handle IPC events
ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('get-setting', async (event, key) => {
  // Implement settings retrieval
  return null;
});

ipcMain.handle('set-setting', async (event, key, value) => {
  // Implement settings storage
  return true;
});

ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electronVersion: process.versions.electron
  };
});

ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

// Database handlers
ipcMain.handle('database-query', async (event, sql, params) => {
  try {
    // Import database models
    const { sequelize } = require('../server/database/models');
    const result = await sequelize.query(sql, {
      replacements: params || {},
      type: sequelize.QueryTypes.SELECT
    });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
});

ipcMain.handle('database-transaction', async (event, operations) => {
  try {
    const { sequelize } = require('../server/database/models');
    const result = await sequelize.transaction(async (transaction) => {
      const results = [];
      for (const operation of operations) {
        const opResult = await sequelize.query(operation.sql, {
          replacements: operation.params || {},
          type: sequelize.QueryTypes.SELECT,
          transaction
        });
        results.push(opResult);
      }
      return results;
    });
    return result;
  } catch (error) {
    console.error('Database transaction error:', error);
    throw error;
  }
});

// Create application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Job',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('menu-new-job');
        }
      },
      {
        label: 'New Customer',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          mainWindow.webContents.send('menu-new-customer');
        }
      },
      { type: 'separator' },
      {
        label: 'Import Estimates',
        click: () => {
          mainWindow.webContents.send('menu-import-estimates');
        }
      },
      {
        label: 'Import Customers',
        click: () => {
          mainWindow.webContents.send('menu-import-customers');
        }
      },
      {
        label: 'Import Parts',
        click: () => {
          mainWindow.webContents.send('menu-import-parts');
        }
      },
      { type: 'separator' },
      {
        label: 'Export Reports',
        click: () => {
          mainWindow.webContents.send('menu-export-reports');
        }
      },
      {
        label: 'Export Backup',
        click: () => {
          mainWindow.webContents.send('menu-export-backup');
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Production Board',
        accelerator: 'CmdOrCtrl+1',
        click: () => {
          mainWindow.webContents.send('menu-production-board');
        }
      },
      {
        label: 'Financial Dashboard',
        accelerator: 'CmdOrCtrl+2',
        click: () => {
          mainWindow.webContents.send('menu-financial-dashboard');
        }
      },
      {
        label: 'Customer Management',
        accelerator: 'CmdOrCtrl+3',
        click: () => {
          mainWindow.webContents.send('menu-customer-management');
        }
      },
      {
        label: 'Parts Management',
        accelerator: 'CmdOrCtrl+4',
        click: () => {
          mainWindow.webContents.send('menu-parts-management');
        }
      },
      {
        label: 'Quality Control',
        accelerator: 'CmdOrCtrl+5',
        click: () => {
          mainWindow.webContents.send('menu-quality-control');
        }
      },
      { type: 'separator' },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
        click: () => {
          mainWindow.webContents.toggleDevTools();
        }
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          mainWindow.reload();
        }
      }
    ]
  },
  {
    label: 'Tools',
    submenu: [
      {
        label: 'Scanner',
        click: () => {
          mainWindow.webContents.send('menu-scanner');
        }
      },
      {
        label: 'Camera',
        click: () => {
          mainWindow.webContents.send('menu-camera');
        }
      },
      {
        label: 'Print',
        accelerator: 'CmdOrCtrl+P',
        click: () => {
          mainWindow.webContents.send('menu-print');
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About CollisionOS',
        click: () => {
          mainWindow.webContents.send('menu-about');
        }
      },
      {
        label: 'Preferences',
        accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
        click: () => {
          mainWindow.webContents.send('menu-preferences');
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
