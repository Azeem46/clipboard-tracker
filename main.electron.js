const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Super Clipboard Manager',
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register global shortcut (Ctrl+Shift+V)
  globalShortcut.register('Control+Shift+V', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Don't quit app, just hide window (so shortcut still works)
  // On macOS, apps usually stay open until Cmd+Q
  if (process.platform !== 'darwin') {
    // app.quit();
  }
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
}); 