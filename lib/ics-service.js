const https = require('https');
const http = require('http');
const ical = require('node-ical');
const { v4: uuidv4 } = require('uuid');

class IcsService {
  constructor(dataManager) {
    this.syncInterval = null;
    this.dataManager = dataManager;
  }

  async sync() {
    try {
      const settings = await this.getSettings();
      if (!settings.icsUrl) {
        throw new Error('No ICS URL configured');
      }
      
      const events = await this.fetchICS(settings.icsUrl);
      await this.processEvents(events);
      return { success: true };
    } catch (error) {
      console.error('ICS sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  async fetchICS(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const events = ical.sync.parseICS(data);
            resolve(events);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  async processEvents(events) {
    const tasks = [];
    
    for (const event of Object.values(events)) {
      if (event.type !== 'VEVENT') continue;
      
      tasks.push({
        id: uuidv4(),
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        startDate: event.start?.toISOString(),
        endDate: event.end?.toISOString(),
        location: event.location || '',
        isCalendarEvent: true,
        status: 'pending'
      });
    }
    
    // Store the processed events
    await this.saveTasks(tasks);
  }

  startAutoSync(interval = 1800000) { // 30 minutes by default
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.sync(); // Initial sync
    this.syncInterval = setInterval(() => this.sync(), interval);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getSettings() {
    return this.dataManager.getSettings();
  }

  async saveTasks(tasks) {
    const existingData = await this.dataManager.getData();
    const newTasks = tasks.filter(task => 
      !existingData.tasks.some(existing => 
        existing.isCalendarEvent && existing.title === task.title && existing.startDate === task.startDate
      )
    );
    
    for (const task of newTasks) {
      await this.dataManager.createTask(task);
    }
  }
}

module.exports = IcsService;