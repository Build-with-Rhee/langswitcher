const { app, BrowserWindow, session, shell } = require('electron');
const { isAllowedExternal } = require('./navigation.cjs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs');

// Optional development override for a read-only cloud home directory.
// Packaged Windows builds normally use the standard per-user application path.
if (process.env.LANGSWITCHER_USER_DATA) {
  const dataPath = path.resolve(process.env.LANGSWITCHER_USER_DATA);
  fs.mkdirSync(dataPath, { recursive: true });
  app.setPath('userData', dataPath);
  app.setPath('sessionData', dataPath);
}

const entry = path.join(__dirname, '..', 'dist', 'index.html');
const entryUrl = pathToFileURL(entry).href;
function createWindow() {
  const window = new BrowserWindow({
    width: 1260, height: 940, minWidth: 380, minHeight: 650,
    title: '말사이 · LangSwitcher', backgroundColor: '#f6f7f3', autoHideMenuBar: true,
    icon: path.join(__dirname, 'icons', 'icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternal(url)) shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => { if (url !== entryUrl) event.preventDefault(); });
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.loadFile(entry);
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => callback(permission === 'clipboard-sanitized-write'));
  // Desktop conversion is entirely offline; deny all external network requests.
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_details, callback) => callback({ cancel: true }));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
