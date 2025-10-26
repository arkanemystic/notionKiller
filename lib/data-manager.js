const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

class DataManager {
  constructor() {
    this.DATA_DIR = path.join(app.getPath('userData'), 'data');
    this.TASKS_FILE = path.join(this.DATA_DIR, 'tasks.json');
    this.PROJECTS_FILE = path.join(this.DATA_DIR, 'projects.json');
    this.SETTINGS_FILE = path.join(this.DATA_DIR, 'settings.json');
    this.initializeDataDirectory();
  }

  async initializeDataDirectory() {
    try {
      await fs.mkdir(this.DATA_DIR, { recursive: true });
      await this.ensureFile(this.TASKS_FILE, []);
      await this.ensureFile(this.PROJECTS_FILE, []);
      await this.ensureFile(this.SETTINGS_FILE, {});
    } catch (error) {
      console.error('Error initializing data directory:', error);
    }
  }

  async ensureFile(filePath, defaultContent) {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
    }
  }

  async getData() {
    const [tasks, projects, settings] = await Promise.all([
      this.readFile(this.TASKS_FILE),
      this.readFile(this.PROJECTS_FILE),
      this.readFile(this.SETTINGS_FILE)
    ]);
    return { tasks, projects, settings };
  }

  async getSettings() {
    return this.readFile(this.SETTINGS_FILE);
  }

  async saveSettings(settings) {
    await this.writeFile(this.SETTINGS_FILE, settings);
    return settings;
  }

  async createTask(taskData) {
    const tasks = await this.readFile(this.TASKS_FILE);
    const newTask = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...taskData
    };
    tasks.push(newTask);
    await this.writeFile(this.TASKS_FILE, tasks);
    return newTask;
  }

  async updateTask(taskData) {
    const tasks = await this.readFile(this.TASKS_FILE);
    const index = tasks.findIndex(task => task.id === taskData.id);
    if (index === -1) throw new Error('Task not found');
    tasks[index] = { ...tasks[index], ...taskData };
    await this.writeFile(this.TASKS_FILE, tasks);
    return tasks[index];
  }

  async deleteTask(taskId) {
    const tasks = await this.readFile(this.TASKS_FILE);
    const newTasks = tasks.filter(task => task.id !== taskId);
    await this.writeFile(this.TASKS_FILE, newTasks);
    return true;
  }

  async createProject(projectData) {
    const projects = await this.readFile(this.PROJECTS_FILE);
    const newProject = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...projectData
    };
    projects.push(newProject);
    await this.writeFile(this.PROJECTS_FILE, projects);
    return newProject;
  }

  async updateProject(projectData) {
    const projects = await this.readFile(this.PROJECTS_FILE);
    const index = projects.findIndex(project => project.id === projectData.id);
    if (index === -1) throw new Error('Project not found');
    projects[index] = { ...projects[index], ...projectData };
    await this.writeFile(this.PROJECTS_FILE, projects);
    return projects[index];
  }

  async deleteProject(projectId) {
    const projects = await this.readFile(this.PROJECTS_FILE);
    const newProjects = projects.filter(project => project.id !== projectId);
    await this.writeFile(this.PROJECTS_FILE, newProjects);
    return true;
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      throw error;
    }
  }
}

module.exports = DataManager;