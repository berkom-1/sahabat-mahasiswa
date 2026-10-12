const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExternalGoogleLogin: (url) => {
    ipcRenderer.send('open-external-google-login', url);
  }
});
