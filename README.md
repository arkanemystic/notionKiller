# Notion Killer v2.2

A cross-platform desktop productivity dashboard built with Electron, featuring task management, project tracking, and iCalendar integration.

## Features

- ✅ **Task Management**: Create, edit, and track tasks with due dates, scheduled dates, and start dates
- 📋 **Project Management**: Organize work with project status tracking
- 📅 **Calendar Integration**: Import events from iCalendar (.ics) feeds
- 🎯 **Dashboard View**: Quick overview of active projects and upcoming tasks
- 📆 **Visual Calendar**: See all tasks, projects, and calendar events in one view
- 💾 **Local Storage**: All data stored locally in JSON files for privacy
- 🔄 **Auto-Sync**: Automatic calendar synchronization every hour

## Setup Instructions for VSCode

### Step 1: Create Project Directory

```bash
mkdir personal-dashboard
cd personal-dashboard
```

### Step 2: Initialize Node.js Project

```bash
npm init -y
```

### Step 3: Install Dependencies

```bash
npm install electron electron-builder electron-store node-ical uuid
```

### Step 4: Create File Structure

Create the following directory structure:

```
personal-dashboard/
├── package.json
├── main.js
├── preload.js
├── lib/
│   ├── data-manager.js
│   └── ics-service.js
└── src/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── app.js
        ├── ui.js
        └── calendar.js
```

You can create the directories with:

```bash
mkdir -p lib src/css src/js
```

### Step 5: Copy Code Files

Copy the code from each artifact into the corresponding files:

1. **package.json** - Replace the auto-generated file
2. **main.js** - Main process entry point
3. **preload.js** - Preload script for IPC bridge
4. **lib/data-manager.js** - Data management module
5. **lib/ics-service.js** - Calendar sync service
6. **src/index.html** - Main HTML file
7. **src/css/style.css** - Stylesheet
8. **src/js/app.js** - Main application logic
9. **src/js/ui.js** - UI rendering functions
10. **src/js/calendar.js** - Calendar view logic

### Step 6: Open in VSCode

```bash
code .
```

### Step 7: Run the Application

Open the integrated terminal in VSCode (`Ctrl + \`` or `Cmd + \``) and run:

```bash
npm start
```

The application should launch in a new window!

## Building for Distribution

### Build for Current Platform

```bash
npm run build
```

### Build for Windows (x64)

```bash
npm run build:win
```

### Build for macOS (Apple Silicon)

```bash
npm run build:mac
```

Built applications will be in the `dist/` folder.

## Usage Guide

### Dashboard View

- View active projects and upcoming tasks for the next 7 days
- Quick access to create new tasks and projects
- Click on any item to edit

### Tasks View

- Complete task list with filtering
- Check boxes to mark tasks as complete
- Color-coded calendar events (purple)
- Click any task to edit details

### Projects View

- All projects with status indicators
- Track progress with task completion counts
- Filter by status (Not Started, In Progress, Done)

### Calendar View

- Visual timeline of all tasks and events
- Blue: Regular tasks
- Green: Project due dates
- Purple: Imported calendar events
- Gray background: ICS feed events (display only)

### Settings

1. Click the settings icon (⚙️) in the sidebar
2. **iCalendar URL**: Enter your .ics calendar feed URL
3. **Import Preference**:
   - **Display Only**: Events appear in calendar view only
   - **Import as Tasks**: Events are imported as actionable tasks
4. **Import Start Date**: Only import events on or after this date
5. Click "Sync Now" to manually trigger synchronization

## Data Storage

All data is stored locally in:
- **Windows**: `%APPDATA%/personal-dashboard/`
- **macOS**: `~/Library/Application Support/personal-dashboard/`

Files:
- `data/tasks.json` - All tasks
- `data/projects.json` - All projects
- `config.json` - Settings (managed by electron-store)

## Calendar Sync Behavior

- **Automatic sync**: Runs every hour
- **Manual sync**: Click "Sync Now" in settings
- **Deduplication**: Events are tracked by UID to prevent duplicates
- **Date filtering**: Only events on/after the import start date are imported as tasks
- **Display mode**: Can view all ICS events in calendar without importing them

## Troubleshooting

### App won't start
- Ensure all dependencies are installed: `npm install`
- Check Node.js version (14+ recommended)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Calendar not syncing
- Verify the ICS URL is accessible in a browser
- Check internet connection
- Look for error messages in settings after clicking "Sync Now"
- Try a different .ics feed to test

### Data not persisting
- Check file permissions in the app data directory
- Ensure you have write access to the application data folder
- Look for errors in the DevTools console (View → Toggle Developer Tools)

## Development Mode

To enable developer tools, set the environment variable:

```bash
NODE_ENV=development npm start
```

This will open Chrome DevTools automatically.

## Technologies Used

- **Electron** - Desktop application framework
- **Node.js** - Backend runtime
- **Tailwind CSS** - Styling
- **FullCalendar** - Calendar component
- **node-ical** - ICS parsing
- **electron-store** - Settings persistence
- **UUID** - Unique ID generation

## Future Enhancements

- Natural language task input with local SLM
- Database migration (SQLite)
- Bi-directional calendar sync (CalDAV)
- Task templates
- Recurring tasks
- Tags and labels
- Search functionality
- Dark/light theme toggle
- Export/import data

## License

MIT License - Feel free to modify and distribute

## Support

For issues or questions, check the console logs for errors:
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
- Press `Cmd+Option+I` (macOS)

---

**Version**: 2.2.0  
**Platform**: Windows x64, macOS arm64  
**Framework**: Electron