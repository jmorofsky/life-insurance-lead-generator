import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { databaseService } from './db';
import { spawn } from 'child_process';
import { autoUpdater } from 'electron-updater';
import icon from '../../resources/icon.png?asset';


function getPythonPath() {
  let path = '';

  if (app.isPackaged) {
    path = join(process.resourcesPath, 'resources', 'main');
  } else {
    path = join(__dirname, '../../resources/main');
  };

  const ext = process.platform === 'win32' ? '.exe' : '';
  return path + ext;
};

async function triggerPythonGenerator(configData) {
  const filePath = getPythonPath();

  const userDataPath = app.getPath('userData');
  const py = spawn(filePath, [userDataPath], { windowsHide: true });

  let stdout = '';
  let stderr = '';

  py.stdout.on('data', data => { stdout += data.toString() });
  py.stderr.on('data', data => { stderr += data.toString() });

  // py.stdin.write(JSON.stringify(configData || {}));
  py.stdin.write(JSON.stringify({ userDataPath: userDataPath }));
  py.stdin.end();

  const exitCode = await new Promise((resolve, reject) => {
    py.on('close', resolve);
    py.on('error', reject);
  });

  // TODO: handle showing these better
  console.log(stdout);
  console.log(stderr);

  if (exitCode !== 0) {
    throw new Error(`Generator exited with code ${exitCode}.`);
  };

  return true;
};

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 850,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  };
};

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // #region auto-updater

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
  };

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.checkForUpdates();

  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000); // 1 hour

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  });

  // #endregion auto-updater

  // #region server call definitions

  ipcMain.handle('generate', async (_, configData) => {
    try {
      await triggerPythonGenerator(configData);
      return { status: 'success' };
    } catch (error) {
      return { status: 'error', error: error.message };
    };
  });

  ipcMain.handle('db:getMarriageLeads', () => {
    return databaseService.getMarriageLeads();
  });

  ipcMain.handle('db:updateColor', (_, rowId, color) => {
    return databaseService.updateColor(rowId, color);
  });

  ipcMain.on('updater:startInstall', () => {
    autoUpdater.quitAndInstall();
  });

  // #endregion server call definitions

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  };
});
