const electron = require('electron');
const { requireTaskPool } = require('electron-remote');
const generate = requireTaskPool(require.resolve('./extras/MediaEngine'));
// Module to control application life.
const app = electron.app;
const ipcMain = electron.ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    const startUrl = process.env.ELECTRON_START_URL || url.format({
            pathname: path.join(__dirname, '/../build/index.html'),
            protocol: 'file:',
            slashes: true
        });
    
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        'node-integration': 'iframe', // and this line
        'webPreferences': {
          'webSecurity': false
        }
    });
    mainWindow.loadURL(startUrl);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

ipcMain.on('generate-media', (event, arg) => {
    console.log('generate-media');
    const frames = arg;
    generate(frames)
    .then(result => {
        const filename = result.replace(/^.*[\\\/]/, '');
        const index = filename.split('.')[0]; // shot number
        event.sender.send(`media-reply-${index}`, result);
    });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.