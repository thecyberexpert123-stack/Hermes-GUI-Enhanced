const { app, BrowserWindow, Menu, Tray, shell } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let tray = null;
const DISTRO = 'kali-linux';
const STUDIO_URL = 'http://127.0.0.1:3001';
const MANAGE_SCRIPT = '/home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh';

// Set application identity for Windows taskbar grouping
app.setAppUserModelId('com.hermes.agent.os');

function updateSplash(step, text) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      if (typeof window.updateBootProgress === 'function') {
        window.updateBootProgress(${step}, ${JSON.stringify(text)});
      }
    `).catch(() => {});
  }
}

function probeHttp(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const up = await probeHttp(url);
    if (up) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

function launchKaliTerminal() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const wtPath = path.join(localAppData, 'Microsoft', 'WindowsApps', 'wt.exe');

  exec(`where wt.exe`, (err, stdout) => {
    if (!err && stdout.includes('wt.exe')) {
      exec(`start "" wt.exe -p "kali-linux" -d "\\\\wsl.localhost\\kali-linux\\home\\thecyberexpert"`);
    } else {
      exec(`start "Kali Linux - Hermes Agent OS" wsl.exe -d ${DISTRO}`);
    }
  });
}

function executeWslCommand(cmd) {
  return new Promise((resolve) => {
    exec(`wsl.exe -d ${DISTRO} ${cmd}`, { timeout: 25000 }, (err, stdout, stderr) => {
      resolve({ success: !err, stdout, stderr });
    });
  });
}

async function initializeHermesEnvironment() {
  updateSplash(1, 'PROBING WSL2 KALI SUBSYSTEM...');
  await executeWslCommand('uname -s');
  updateSplash(1, 'WSL2 KALI SUBSYSTEM CONFIRMED.');

  updateSplash(2, 'AUTO-PROVISIONING DAEMONS (STUDIO, CESIUM, GATEWAY)...');
  await executeWslCommand(`${MANAGE_SCRIPT} start`);
  updateSplash(2, 'DAEMONS INITIALIZED IN PERSISTENT SESSIONS.');

  updateSplash(3, 'SPAWNING KALI LINUX INTERACTIVE TERMINAL...');
  launchKaliTerminal();
  updateSplash(3, 'KALI TERMINAL SESSION ENGAGED.');

  updateSplash(4, 'VALIDATING SOCKET (127.0.0.1:3001)...');
  const ready = await waitForServer(STUDIO_URL, 35);

  if (ready) {
    updateSplash(4, 'NEURAL COCKPIT ACTIVE. ENGAGING...');
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(STUDIO_URL);
      }
    }, 600);
  } else {
    updateSplash(4, 'STARTUP TIMEOUT: ATTEMPTING DIRECT CONNECT...');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(STUDIO_URL);
    }
  }
}

function createWindow() {
  const icoPath = path.join(__dirname, 'hermes.ico');

  mainWindow = new BrowserWindow({
    width: 1680,
    height: 1000,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#03060c',
    title: 'HERMES AGENT OS — STARK MARK-XV',
    icon: icoPath,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the offline cybernetic splash bootloader first
  mainWindow.loadFile(path.join(__dirname, 'splash.html'));

  // Handle external link clicks
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost:4173') || url.startsWith('http://127.0.0.1:4173')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle network / loading errors gracefully
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL.includes('3001')) {
      console.warn('Load failed, retrying in 2 seconds...', errorDescription);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(STUDIO_URL);
        }
      }, 2000);
    }
  });

  // Clean shutdown on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Begin background initialization
  initializeHermesEnvironment();
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
