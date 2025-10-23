const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    scanDirectory: (path) => ipcRenderer.invoke('scan-directory', path),
    organizeFiles: (data) => ipcRenderer.invoke('organize-files', data),
    cleanupEmptyFolders: (data) => ipcRenderer.invoke('cleanup-empty-folders', data),
    getDefaultDirectories: () => ipcRenderer.invoke('get-default-directories'),
    openDirectory: (path) => ipcRenderer.invoke('open-directory', path)
});
