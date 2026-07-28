import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';


// #region server call definitions

const api = {
  generate: configData => ipcRenderer.invoke('generate', configData),
  createDataset: schema_json => ipcRenderer.invoke('db:createDataset', schema_json),
  deleteDataset: (dataset_id, table_name) => ipcRenderer.invoke('db:deleteDataset', dataset_id, table_name),
  cloneDataset: dataset => ipcRenderer.invoke('db:cloneDataset', dataset),
  editDataset: (dataset, new_name, new_description) => ipcRenderer.invoke('db:editDataset', dataset, new_name, new_description),
  getDataset: table_name => ipcRenderer.invoke('db:getDataset', table_name),
  getAllDatasets: () => ipcRenderer.invoke('db:getAllDatasets'),
  updateColor: (table_name, row_id, color) => ipcRenderer.invoke('db:updateColor', table_name, row_id, color),
  updateCell: (table_name, row_id, column_name, value) => ipcRenderer.invoke('db:updateCell', table_name, row_id, column_name, value),
  createRow: (table_name, row_values) => ipcRenderer.invoke('db:createRow', table_name, row_values),
  deleteRow: (table_name, row_id) => ipcRenderer.invoke('db:deleteRow', table_name, row_id),

  // auto-updater
  onUpdateError: callback => ipcRenderer.on('update-error', () => callback()),
  onUpdateDownloaded: callback => ipcRenderer.on('update-downloaded', () => callback()),
  startInstall: () => ipcRenderer.send('updater:startInstall'),

  // application restart
  restart: () => ipcRenderer.send('restart')
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
