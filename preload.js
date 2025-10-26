const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Data operations
  getData: () => ipcRenderer.invoke('get-data'),
  
  // Settings operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Task operations
  createTask: (taskData) => ipcRenderer.invoke('create-task', taskData),
  updateTask: (taskData) => ipcRenderer.invoke('update-task', taskData),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  
  // Project operations
  createProject: (projectData) => ipcRenderer.invoke('create-project', projectData),
  updateProject: (projectData) => ipcRenderer.invoke('update-project', projectData),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
  
  // ICS sync
  triggerIcsSync: () => ipcRenderer.invoke('trigger-ics-sync'),
  
  // Event listeners
  onDataUpdated: (callback) => {
    ipcRenderer.on('data-updated', callback);
  },
  onIcsSyncStatus: (callback) => {
    ipcRenderer.on('ics-sync-status', (event, status) => callback(status));
  },
  
  // Cleanup listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});