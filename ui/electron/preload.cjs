const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orion', {
  state: {
    getAll: () => ipcRenderer.invoke('state:getAll'),
    setFlag: (id, flag, value) => ipcRenderer.invoke('state:setFlag', { id, flag, value }),
    deleteEntry: (id) => ipcRenderer.invoke('state:deleteEntry', { id }),
  },
  scan: {
    runNow: () => ipcRenderer.invoke('scan:runNow'),
  },
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
  },
  downloads: {
    sha256: (filePath) => ipcRenderer.invoke('downloads:sha256', filePath),
  },
  notify: {
    show: (title, body) => ipcRenderer.invoke('notify:show', { title, body }),
    onTrayScanNow: (cb) => ipcRenderer.on('tray:scanNow', cb),
  },
});
