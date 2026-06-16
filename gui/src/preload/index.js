import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';


// #region server call definitions

const api = {
  getMarriageLeads: () => ipcRenderer.invoke('db:getMarriageLeads'),
  updateColor: (rowId, color) => ipcRenderer.invoke('db:updateColor', rowId, color),
  generate: configData => ipcRenderer.invoke('generate', configData),

  // auto-updater
  onUpdateDownloaded: callback => ipcRenderer.on('update-downloaded', () => callback()),
  startInstall: () => ipcRenderer.send('updater:startInstall')
};

// #endregion server call definitions

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  };
} else {
  window.electron = electronAPI;
  window.api = api;
};
