const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DataManager = require('./lib/data-manager');
const IcsService = require('./lib/ics-service');

let mainWindow;
const dataManager = new DataManager();
const icsService = new IcsService(dataManager);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-data', () => dataManager.getData());
ipcMain.handle('get-settings', () => dataManager.getSettings());
ipcMain.handle('save-settings', (event, settings) => dataManager.saveSettings(settings));
ipcMain.handle('create-task', (event, taskData) => dataManager.createTask(taskData));
ipcMain.handle('update-task', (event, taskData) => dataManager.updateTask(taskData));
ipcMain.handle('delete-task', (event, taskId) => dataManager.deleteTask(taskId));
ipcMain.handle('create-project', (event, projectData) => dataManager.createProject(projectData));
ipcMain.handle('update-project', (event, projectData) => dataManager.updateProject(projectData));
ipcMain.handle('delete-project', (event, projectId) => dataManager.deleteProject(projectId));
ipcMain.handle('trigger-ics-sync', () => icsService.sync());