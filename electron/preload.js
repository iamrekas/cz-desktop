const { contextBridge, ipcRenderer } = require("electron");
require('electron-promise-ipc/preload');
const promiseIpc = require('electron-promise-ipc');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        version: () => promiseIpc.send('getVersion'),
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ["toMain", "updates:check", "updates:download", "updates:install"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["fromMain", "updates:log"];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);