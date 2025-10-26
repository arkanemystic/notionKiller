// Main Application Logic
let appState = {
  projects: [],
  tasks: [],
  settings: {},
  currentView: 'dashboard',
  editingTask: null,
  editingProject: null
};

// Initialize app on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  setupIPCListeners();
  switchView('dashboard');
});

// Load data from main process
async function loadData() {
  try {
    const result = await window.api.getData();
    if (result.success) {
      appState.projects = result.projects || [];
      appState.tasks = result.tasks || [];
      renderCurrentView();
    } else {
      showToast('Failed to load data', 'error');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Error loading data', 'error');
  }
}

// Load settings
async function loadSettings() {
  try {
    const result = await window.api.getSettings();
    if (result.success) {
      appState.settings = result.settings;
      populateSettingsForm();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      switchView(view);
    });
  });

  // Settings button
  document.getElementById('nav-settings').addEventListener('click', openSettings);

  // New Task buttons
  document.getElementById('btn-new-task').addEventListener('click', () => openTaskModal());
  document.getElementById('btn-new-task-dashboard').addEventListener('click', () => openTaskModal());

  // New Project buttons
  document.getElementById('btn-new-project').addEventListener('click', () => openProjectModal());
  document.getElementById('btn-new-project-dashboard').addEventListener('click', () => openProjectModal());

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      closeModal(e.target.closest('.modal'));
    });
  });

  // Click outside modal to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Form submissions
  document.getElementById('form-task').addEventListener('submit', handleTaskSubmit);
  document.getElementById('form-project').addEventListener('submit', handleProjectSubmit);
  document.getElementById('form-settings').addEventListener('submit', handleSettingsSubmit);

  // Delete buttons
  document.getElementById('btn-delete-task').addEventListener('click', handleTaskDelete);
  document.getElementById('btn-delete-project').addEventListener('click', handleProjectDelete);

  // Sync button
  document.getElementById('btn-sync-now').addEventListener('click', handleSyncNow);
}

// Setup IPC listeners
function setupIPCListeners() {
  window.api.onDataUpdated(async () => {
    await loadData();
  });

  window.api.onIcsSyncStatus((status) => {
    const statusEl = document.getElementById('sync-status');
    if (status.status === 'fetching') {
      statusEl.textContent = 'Syncing...';
      statusEl.className = 'text-sm mt-2 text-blue-400';
    } else if (status.status === 'success') {
      statusEl.textContent = status.message || 'Sync successful';
      statusEl.className = 'text-sm mt-2 text-green-400';
      showToast(status.message || 'Calendar synced successfully', 'success');
    } else if (status.status === 'error') {
      statusEl.textContent = status.message || 'Sync failed';
      statusEl.className = 'text-sm mt-2 text-red-400';
      showToast(status.message || 'Sync failed', 'error');
    }
  });
}

// Switch between views
function switchView(viewName) {
  // Update navigation
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update content
  document.querySelectorAll('.view-content').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`view-${viewName}`).classList.add('active');

  appState.currentView = viewName;
  renderCurrentView();
}

// Render current view
function renderCurrentView() {
  switch (appState.currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'tasks':
      renderTasksList();
      break;
    case 'projects':
      renderProjectsList();
      break;
    case 'calendar':
      renderCalendar();
      break;
  }
}

// Task Modal
function openTaskModal(task = null) {
  appState.editingTask = task;
  const modal = document.getElementById('modal-task');
  const form = document.getElementById('form-task');
  const title = document.getElementById('modal-task-title');
  const deleteBtn = document.getElementById('btn-delete-task');

  form.reset();

  if (task) {
    title.textContent = 'Edit Task';
    deleteBtn.classList.remove('hidden');
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-due-date').value = task.dueDate || '';
    document.getElementById('task-scheduled-date').value = task.scheduledDate || '';
    document.getElementById('task-start-date').value = task.startDate || '';
    document.getElementById('task-project').value = task.projectId || '';
    document.getElementById('task-done').checked = task.isDone;
  } else {
    title.textContent = 'New Task';
    deleteBtn.classList.add('hidden');
  }

  // Populate projects dropdown
  const projectSelect = document.getElementById('task-project');
  projectSelect.innerHTML = '<option value="">No Project</option>';
  appState.projects.forEach(project => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.title;
    projectSelect.appendChild(option);
  });

  if (task && task.projectId) {
    projectSelect.value = task.projectId;
  }

  modal.classList.add('active');
}

async function handleTaskSubmit(e) {
  e.preventDefault();

  const taskData = {
    description: document.getElementById('task-description').value,
    dueDate: document.getElementById('task-due-date').value || null,
    scheduledDate: document.getElementById('task-scheduled-date').value || null,
    startDate: document.getElementById('task-start-date').value || null,
    projectId: document.getElementById('task-project').value || null,
    isDone: document.getElementById('task-done').checked
  };

  try {
    const taskId = document.getElementById('task-id').value;
    let result;

    if (taskId) {
      // Update existing task
      result = await window.api.updateTask({ id: taskId, ...taskData });
    } else {
      // Create new task
      result = await window.api.createTask(taskData);
    }

    if (result.success) {
      closeModal(document.getElementById('modal-task'));
      showToast(taskId ? 'Task updated' : 'Task created', 'success');
      await loadData();
    } else {
      showToast('Failed to save task', 'error');
    }
  } catch (error) {
    console.error('Error saving task:', error);
    showToast('Error saving task', 'error');
  }
}

async function handleTaskDelete() {
  const taskId = document.getElementById('task-id').value;
  if (!taskId) return;

  showConfirmDialog('Are you sure you want to delete this task?', async () => {
    try {
      const result = await window.api.deleteTask(taskId);
      if (result.success) {
        closeModal(document.getElementById('modal-task'));
        showToast('Task deleted', 'success');
        await loadData();
      } else {
        showToast('Failed to delete task', 'error');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Error deleting task', 'error');
    }
  });
}

// Project Modal
function openProjectModal(project = null) {
  appState.editingProject = project;
  const modal = document.getElementById('modal-project');
  const form = document.getElementById('form-project');
  const title = document.getElementById('modal-project-title');
  const deleteBtn = document.getElementById('btn-delete-project');

  form.reset();

  if (project) {
    title.textContent = 'Edit Project';
    deleteBtn.classList.remove('hidden');
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-title').value = project.title;
    document.getElementById('project-status').value = project.status;
    document.getElementById('project-due-date').value = project.dueDate || '';
  } else {
    title.textContent = 'New Project';
    deleteBtn.classList.add('hidden');
  }

  modal.classList.add('active');
}

async function handleProjectSubmit(e) {
  e.preventDefault();

  const projectData = {
    title: document.getElementById('project-title').value,
    status: document.getElementById('project-status').value,
    dueDate: document.getElementById('project-due-date').value || null
  };

  try {
    const projectId = document.getElementById('project-id').value;
    let result;

    if (projectId) {
      result = await window.api.updateProject({ id: projectId, ...projectData });
    } else {
      result = await window.api.createProject(projectData);
    }

    if (result.success) {
      closeModal(document.getElementById('modal-project'));
      showToast(projectId ? 'Project updated' : 'Project created', 'success');
      await loadData();
    } else {
      showToast('Failed to save project', 'error');
    }
  } catch (error) {
    console.error('Error saving project:', error);
    showToast('Error saving project', 'error');
  }
}

async function handleProjectDelete() {
  const projectId = document.getElementById('project-id').value;
  if (!projectId) return;

  showConfirmDialog('Are you sure you want to delete this project?', async () => {
    try {
      const result = await window.api.deleteProject(projectId);
      if (result.success) {
        closeModal(document.getElementById('modal-project'));
        showToast('Project deleted', 'success');
        await loadData();
      } else {
        showToast('Failed to delete project', 'error');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Error deleting project', 'error');
    }
  });
}

// Settings Modal
async function openSettings() {
  await loadSettings();
  const modal = document.getElementById('modal-settings');
  modal.classList.add('active');
}

function populateSettingsForm() {
  document.getElementById('settings-ics-url').value = appState.settings.icsUrl || '';
  
  const preference = appState.settings.icsImportPreference || 'displayOnly';
  if (preference === 'displayOnly') {
    document.getElementById('import-display').checked = true;
  } else {
    document.getElementById('import-tasks').checked = true;
  }
  
  document.getElementById('settings-import-start-date').value = appState.settings.icsImportStartDate || '';
}

async function handleSettingsSubmit(e) {
  e.preventDefault();

  const settingsData = {
    icsUrl: document.getElementById('settings-ics-url').value,
    icsImportPreference: document.querySelector('input[name="import-preference"]:checked').value,
    icsImportStartDate: document.getElementById('settings-import-start-date').value || null
  };

  try {
    const result = await window.api.saveSettings(settingsData);
    if (result.success) {
      appState.settings = settingsData;
      showToast('Settings saved', 'success');
    } else {
      showToast('Failed to save settings', 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings', 'error');
  }
}

async function handleSyncNow() {
  try {
    await window.api.triggerIcsSync();
  } catch (error) {
    console.error('Error triggering sync:', error);
    showToast('Error triggering sync', 'error');
  }
}

// Utility Functions
function closeModal(modal) {
  modal.classList.remove('active');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showConfirmDialog(message, onConfirm) {
  const modal = document.getElementById('modal-confirm');
  const messageEl = document.getElementById('confirm-message');
  const confirmBtn = document.getElementById('btn-confirm-yes');
  
  messageEl.textContent = message;
  
  const handleConfirm = () => {
    onConfirm();
    closeModal(modal);
    confirmBtn.removeEventListener('click', handleConfirm);
  };
  
  confirmBtn.addEventListener('click', handleConfirm);
  modal.classList.add('active');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}