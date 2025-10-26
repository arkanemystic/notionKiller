// FullCalendar Integration
let calendar = null;

function renderCalendar() {
  if (!calendar) {
    initializeCalendar();
  } else {
    updateCalendarEvents();
  }
}

async function initializeCalendar() {
  const calendarEl = document.getElementById('calendar');
  
  // Load settings to get ICS URL
  const settingsResult = await window.api.getSettings();
  const settings = settingsResult.success ? settingsResult.settings : {};

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    themeSystem: 'standard',
    height: 'auto',
    eventSources: [
      // Source 1: User Tasks (not calendar events)
      {
        events: function(info, successCallback, failureCallback) {
          const taskEvents = appState.tasks
            .filter(task => !task.isCalendarEvent && !task.isDone)
            .map(task => {
              const date = task.dueDate || task.scheduledDate || task.startDate;
              if (!date) return null;
              
              return {
                id: task.id,
                title: task.description,
                start: date,
                allDay: true,
                backgroundColor: '#3b82f6',
                borderColor: '#3b82f6',
                extendedProps: {
                  type: 'task',
                  data: task
                }
              };
            })
            .filter(e => e !== null);
          
          successCallback(taskEvents);
        },
        color: '#3b82f6'
      },
      
      // Source 2: User Projects
      {
        events: function(info, successCallback, failureCallback) {
          const projectEvents = appState.projects
            .filter(project => project.dueDate && project.status !== 'Done')
            .map(project => ({
              id: project.id,
              title: `📋 ${project.title}`,
              start: project.dueDate,
              allDay: true,
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              extendedProps: {
                type: 'project',
                data: project
              }
            }));
          
          successCallback(projectEvents);
        },
        color: '#10b981'
      },
      
      // Source 3: Calendar Events imported as tasks (purple color)
      {
        events: function(info, successCallback, failureCallback) {
          const calendarTaskEvents = appState.tasks
            .filter(task => task.isCalendarEvent && !task.isDone)
            .map(task => {
              const date = task.startDate || task.scheduledDate || task.dueDate;
              if (!date) return null;
              
              return {
                id: task.id,
                title: `📅 ${task.description}`,
                start: date,
                end: task.dueDate || date,
                allDay: true,
                backgroundColor: '#8b5cf6',
                borderColor: '#8b5cf6',
                extendedProps: {
                  type: 'calendar-task',
                  data: task
                }
              };
            })
            .filter(e => e !== null);
          
          successCallback(calendarTaskEvents);
        },
        color: '#8b5cf6'
      }
    ],
    eventClick: function(info) {
      const { type, data } = info.event.extendedProps;
      
      if (type === 'task' || type === 'calendar-task') {
        openTaskModal(data);
      } else if (type === 'project') {
        openProjectModal(data);
      }
    },
    eventDidMount: function(info) {
      // Add tooltip
      info.el.title = info.event.title;
    }
  });

  // Add ICS feed if URL is configured (display only)
  if (settings.icsUrl) {
    try {
      // Note: FullCalendar's ICS feed feature may require additional setup
      // For now, we'll handle ICS events through the sync service
      // The direct ICS feed display would require the icalendar plugin
      calendar.addEventSource({
        url: settings.icsUrl,
        format: 'ics',
        color: '#6b7280',
        textColor: '#d1d5db',
        display: 'background',
        failure: function() {
          console.log('ICS feed could not be loaded for display');
        }
      });
    } catch (error) {
      console.error('Error loading ICS feed:', error);
    }
  }

  calendar.render();
}

function updateCalendarEvents() {
  if (calendar) {
    calendar.refetchEvents();
  }
}

// Override switchView to ensure calendar updates properly
(function() {
  const originalSwitchView = window.switchView;
  if (originalSwitchView) {
    window.switchView = function(viewName) {
      originalSwitchView(viewName);
      if (viewName === 'calendar' && calendar) {
        setTimeout(() => {
          calendar.updateSize();
          updateCalendarEvents();
        }, 100);
      }
    };
  }
})();