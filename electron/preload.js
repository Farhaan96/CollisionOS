const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFile: options => ipcRenderer.invoke('select-file', options),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: options => ipcRenderer.invoke('save-file', options),

  // Settings
  getSetting: key => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  openExternal: url => ipcRenderer.invoke('open-external', url),

  // Database operations
  database: {
    query: (sql, params) => ipcRenderer.invoke('database-query', sql, params),
    transaction: operations =>
      ipcRenderer.invoke('database-transaction', operations),
  },

  // Menu events
  onMenuNewJob: callback => ipcRenderer.on('menu-new-job', callback),
  onMenuNewCustomer: callback => ipcRenderer.on('menu-new-customer', callback),
  onMenuImportEstimates: callback =>
    ipcRenderer.on('menu-import-estimates', callback),
  onMenuImportCustomers: callback =>
    ipcRenderer.on('menu-import-customers', callback),
  onMenuImportParts: callback => ipcRenderer.on('menu-import-parts', callback),
  onMenuExportReports: callback =>
    ipcRenderer.on('menu-export-reports', callback),
  onMenuExportBackup: callback =>
    ipcRenderer.on('menu-export-backup', callback),
  onMenuPreferences: callback => ipcRenderer.on('menu-preferences', callback),
  onMenuProductionBoard: callback =>
    ipcRenderer.on('menu-production-board', callback),
  onMenuFinancialDashboard: callback =>
    ipcRenderer.on('menu-financial-dashboard', callback),
  onMenuCustomerManagement: callback =>
    ipcRenderer.on('menu-customer-management', callback),
  onMenuPartsManagement: callback =>
    ipcRenderer.on('menu-parts-management', callback),
  onMenuQualityControl: callback =>
    ipcRenderer.on('menu-quality-control', callback),
  onMenuScanner: callback => ipcRenderer.on('menu-scanner', callback),
  onMenuCamera: callback => ipcRenderer.on('menu-camera', callback),
  onMenuPrinterSetup: callback =>
    ipcRenderer.on('menu-printer-setup', callback),
  onMenuBackupRestore: callback =>
    ipcRenderer.on('menu-backup-restore', callback),
  onMenuAbout: callback => ipcRenderer.on('menu-about', callback),

  // Remove listeners
  removeAllListeners: channel => ipcRenderer.removeAllListeners(channel),
});

// Expose a versions object to give access to versions
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

// Expose process type
contextBridge.exposeInMainWorld('process', {
  type: process.type,
  platform: process.platform,
});
