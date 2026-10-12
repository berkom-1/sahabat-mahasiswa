const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    title: 'Sahabat Mahasiswa - Portal & Komunitas Mahasiswa',
    icon: path.join(__dirname, 'assets', 'logo-icon.svg'),
    autoHideMenuBar: true,
    backgroundColor: '#120F1D',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Buka tautan eksternal (rute Google Maps, dll.) di browser default Windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('google.com/maps') || !url.includes('localhost')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  // Berikan izin Geolocation otomatis untuk fitur Haversine jarak kosan terdekat
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'geolocation') {
      callback(true);
      return;
    }
    callback(true);
  });

  // Handler untuk membuka login Google di browser eksternal default
  ipcMain.on('open-external-google-login', (event, url) => {
    const authUrl = url || 'https://cxstsxortzfsdzqugjhp.supabase.co/auth/v1/authorize?provider=google&prompt=select_account';
    shell.openExternal(authUrl);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
