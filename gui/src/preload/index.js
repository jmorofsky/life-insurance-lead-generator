import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';


// #region server call definitions

const api = {
  generate: configData => ipcRenderer.invoke('generate', configData),
  createDataset: schema_json => ipcRenderer.invoke('db:createDataset', schema_json),
  getDataset: table_name => ipcRenderer.invoke('db:getDataset', table_name),
  getAllDatasets: () => ipcRenderer.invoke('db:getAllDatasets'),
  updateColor: (table_name, row_id, color) => ipcRenderer.invoke('db:updateColor', table_name, row_id, color),
  deleteRow: (table_name, row_id) => ipcRenderer.invoke('db:deleteRow', table_name, row_id),

  // auto-updater
  onUpdateError: callback => ipcRenderer.on('update-error', () => callback()),
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
