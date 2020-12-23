const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");
const log = require('electron-log');
const { autoUpdater } = require("electron-updater");
const promiseIpc = require('electron-promise-ipc');

const windowUrl = app.isPackaged
  ? `file://${path.join(__dirname, '../build/index.html')}`
  : `http://localhost:3000`;

autoUpdater.autoDownload = false
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('updates:log', text);
}

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js") // use a preload script
    }
  });
  // mainWindow.loadURL(windowUrl);
  mainWindow.loadURL(`file://${path.join(__dirname, '../build/version.html')}`);
  mainWindow.on(`closed`, () => (mainWindow = null));
}

ipcMain.on('updates:check', function (event, arg) {
  log.info('Checking for updates...');
  autoUpdater.checkForUpdates();
})
ipcMain.on('updates:download', function (event, arg) {
  log.info('Download updates...');
  autoUpdater.downloadUpdate();
})
ipcMain.on('updates:install', function (event, arg) {
  log.info('Installing updates...');
  autoUpdater.quitAndInstall();
})

autoUpdater.on('checking-for-update', () => {
  log.info('Checking for updates (from updater)...');
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  log.info('Update avaible...', info);
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not avaible...', info);
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  log.info('Error in updates...' + err == null ? "unknown" : (err.stack || err).toString());
  sendStatusToWindow('Error in auto-updater. ' + err == null ? "unknown" : (err.stack || err).toString());
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  log.info('Updates downloaded.');
  sendStatusToWindow('Update downloaded');
});

app.on(`ready`, createWindow);

app.on(`window-all-closed`, () => {
  if (process.platform !== `darwin`) {
    app.quit();
  }
});

app.on(`activate`, () => {
  if (mainWindow === null) {
    createWindow();
  }
});

promiseIpc.on('getVersion', () => app.getVersion());