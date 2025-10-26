// UI Rendering Functions

// Render Dashboard View
function renderDashboard() {
  renderDashboardProjects();
  renderDashboardTasks();
}

function renderDashboardProjects() {
  const container = document.getElementById('dashboard-projects');
  const activeProjects = appState.projects.filter(p => p.status !== 'Done');
  
  // Sort by due date
  activeProjects.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  if (activeProjects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="text-gray-500">No active projects</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeProjects.map(project => `
    <div class="project-item bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition" data-project-id="${project.id}">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="font-semibold text-white mb-1">${escapeHtml(project.title)}</h3>
          <div class="flex items-center gap-2 text-sm">
            <span class="status-badge status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
            ${project.dueDate ? `<span class="text-gray-400">Due: ${formatDate(project.dueDate)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Add click listeners
  container.querySelectorAll('.project-item').forEach(el => {
    el.addEventListener('click', () => {
      const projectId = el.dataset.projectId;
      const project = appState.projects.find(p => p.id === projectId);
      if (project) openProjectModal(project);
    });
  });
}

function renderDashboardTasks() {
  const container = document.getElementById('dashboard-tasks');
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingTasks = appState.tasks.filter(task => {
    if (task.isDone) return false;
    
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const scheduledDate = task.scheduledDate ? new Date(task.scheduledDate) : null;
    
    const relevantDate = dueDate || scheduledDate;
    if (!relevantDate) return false;
    
    return relevantDate >= today && relevantDate <= sevenDaysFromNow;
  });

  // Sort by date
  upcomingTasks.sort((a, b) => {
    const dateA = new Date(a.dueDate || a.scheduledDate);
    const dateB = new Date(b.dueDate || b.scheduledDate);
    return dateA - dateB;
  });

  if (upcomingTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="text-gray-500">No upcoming tasks</p>
      </div>
    `;
    return;
  }

  container.innerHTML = upcomingTasks.map(task => {
    const project = task.projectId ? appState.projects.find(p => p.id === task.projectId) : null;
    const dateLabel = task.dueDate ? formatDate(task.dueDate) : formatDate(task.scheduledDate);
    
    return `
      <div class="task-item bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition" data-task-id="${task.id}">
        <div class="flex items-start gap-3">
          <input type="checkbox" ${task.isDone ? 'checked' : ''} class="task-checkbox mt-1" data-task-id="${task.id}">
          <div class="flex-1">
            <p class="task-description font-medium text-white mb-1">${escapeHtml(task.description)}</p>
            <div class="flex items-center gap-2 text-sm text-gray-400">
              ${task.isCalendarEvent ? '<span class="text-purple-400">📅 Calendar Event</span>' : ''}
              ${dateLabel ? `<span>${dateLabel}</span>` : ''}
              ${project ? `<span class="text-blue-400">• ${escapeHtml(project.title)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners
  container.querySelectorAll('.task-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('task-checkbox')) return;
      const taskId = el.dataset.taskId;
      const task = appState.tasks.find(t => t.id === taskId);
      if (task) openTaskModal(task);
    });
  });

  // Add checkbox listeners
  container.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      e.stopPropagation();
      const taskId = checkbox.dataset.taskId;
      const task = appState.tasks.find(t => t.id === taskId);
      if (task) {
        task.isDone = checkbox.checked;
        await window.api.updateTask(task);
      }
    });
  });
}

// Render Tasks List View
function renderTasksList() {
  const container = document.getElementById('tasks-list');
  
  if (appState.tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p>No tasks yet. Create your first task!</p>
      </div>
    `;
    return;
  }

  // Sort tasks: incomplete first, then by due date
  const sortedTasks = [...appState.tasks].sort((a, b) => {
    if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
    const dateA = new Date(a.dueDate || a.scheduledDate || a.startDate || '9999');
    const dateB = new Date(b.dueDate || b.scheduledDate || b.startDate || '9999');
    return dateA - dateB;
  });

  container.innerHTML = sortedTasks.map(task => {
    const project = task.projectId ? appState.projects.find(p => p.id === task.projectId) : null;
    
    return `
      <div class="task-item p-4 ${task.isDone ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="flex items-start gap-4">
          <input type="checkbox" ${task.isDone ? 'checked' : ''} class="task-checkbox mt-1" data-task-id="${task.id}">
          <div class="flex-1">
            <p class="task-description text-lg font-medium text-white mb-2">${escapeHtml(task.description)}</p>
            <div class="flex flex-wrap gap-3 text-sm text-gray-400">
              ${task.isCalendarEvent ? '<span class="text-purple-400">📅 Calendar Event</span>' : ''}
              ${task.dueDate ? `<span>Due: ${formatDate(task.dueDate)}</span>` : ''}
              ${task.scheduledDate ? `<span>Scheduled: ${formatDate(task.scheduledDate)}</span>` : ''}
              ${task.startDate && !task.isCalendarEvent ? `<span>Start: ${formatDate(task.startDate)}</span>` : ''}
              ${project ? `<span class="text-blue-400">Project: ${escapeHtml(project.title)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners
  container.querySelectorAll('.task-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('task-checkbox')) return;
      const taskId = el.dataset.taskId;
      const task = appState.tasks.find(t => t.id === taskId);
      if (task) openTaskModal(task);
    });
  });

  // Add checkbox listeners
  container.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      e.stopPropagation();
      const taskId = checkbox.dataset.taskId;
      const task = appState.tasks.find(t => t.id === taskId);
      if (task) {
        task.isDone = checkbox.checked;
        await window.api.updateTask(task);
        renderTasksList(); // Re-render to update sorting
      }
    });
  });
}

// Render Projects List View
function renderProjectsList() {
  const container = document.getElementById('projects-list');
  
  if (appState.projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <p>No projects yet. Create your first project!</p>
      </div>
    `;
    return;
  }

  // Sort projects by status (Not Started, In Progress, Done) and due date
  const sortedProjects = [...appState.projects].sort((a, b) => {
    const statusOrder = { 'Not Started': 0, 'In Progress': 1, 'Done': 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    const dateA = new Date(a.dueDate || '9999');
    const dateB = new Date(b.dueDate || '9999');
    return dateA - dateB;
  });

  container.innerHTML = sortedProjects.map(project => {
    const taskCount = appState.tasks.filter(t => t.projectId === project.id).length;
    const completedTasks = appState.tasks.filter(t => t.projectId === project.id && t.isDone).length;
    
    return `
      <div class="project-item p-4" data-project-id="${project.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-white mb-2">${escapeHtml(project.title)}</h3>
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <span class="status-badge status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span>
              ${project.dueDate ? `<span class="text-gray-400">Due: ${formatDate(project.dueDate)}</span>` : ''}
              ${taskCount > 0 ? `<span class="text-gray-400">${completedTasks}/${taskCount} tasks complete</span>` : ''}
            </div>
          </div>
          <div class="text-gray-500 text-sm">
            Created ${formatDate(project.createdAt)}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners
  container.querySelectorAll('.project-item').forEach(el => {
    el.addEventListener('click', () => {
      const projectId = el.dataset.projectId;
      const project = appState.projects.find(p => p.id === projectId);
      if (project) openProjectModal(project);
    });
  });
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}