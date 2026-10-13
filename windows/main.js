const { app, BrowserWindow, Menu, Tray, shell, session, desktopCapturer } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let tray = null;
const DISTRO = 'kali-linux';
const STUDIO_URL = 'http://127.0.0.1:3001';
const MANAGE_SCRIPT = '/home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh';

// 1. Configure audio autoplay policy & hardware flags before app ready
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-features', 'AudioServiceOutOfProcess');
app.commandLine.appendSwitch('ignore-certificate-errors');

// 2. Set application identity for Windows taskbar grouping
app.setAppUserModelId('com.hermes.agent.os');

// 3. Single instance lock (focus existing window if re-launched)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

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
    try {
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        resolve(res.statusCode < 500);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function waitForServer(maxAttempts = 35) {
  const candidateUrls = [STUDIO_URL, 'http://localhost:3001'];
  for (let i = 0; i < maxAttempts; i++) {
    for (const url of candidateUrls) {
      const up = await probeHttp(url);
      if (up) return url;
    }
    await new Promise((r) => setTimeout(r, 700));
  }
  return null;
}

function launchKaliTerminal() {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\anish', 'AppData', 'Local');
  const wtPath = path.join(localAppData, 'Microsoft', 'WindowsApps', 'wt.exe');

  try {
    if (fs.existsSync(wtPath)) {
      const child = spawn(wtPath, ['wsl.exe', '-d', DISTRO, '~'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    } else {
      const child = spawn('cmd.exe', ['/c', 'start', 'Kali Linux - Hermes Agent OS', 'wsl.exe', '-d', DISTRO, '~'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    }
  } catch (err) {
    console.error('Failed to launch Kali terminal:', err);
  }
}

function executeWslCommand(cmd) {
  return new Promise((resolve) => {
    exec(`wsl.exe -d ${DISTRO} bash -c "${cmd.replace(/"/g, '\\"')}"`, { timeout: 25000 }, (err, stdout, stderr) => {
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

  updateSplash(4, 'VALIDATING LOCAL SOCKET (PORT 3001)...');
  const activeUrl = await waitForServer(35);

  if (activeUrl) {
    updateSplash(4, 'NEURAL COCKPIT ACTIVE. ENGAGING...');
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(activeUrl);
      }
    }, 600);
  } else {
    updateSplash(4, 'STARTUP TIMEOUT: ATTEMPTING DIRECT CONNECT...');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadURL(STUDIO_URL);
    }
  }
}

function createTray() {
  const icoPath = path.join(__dirname, 'hermes.ico');
  if (!fs.existsSync(icoPath)) return;

  try {
    tray = new Tray(icoPath);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'HERMES AGENT OS — STARK MARK-XV',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Open Cockpit Window',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Spawn Kali Linux Terminal [Ctrl+K]',
        click: () => launchKaliTerminal(),
      },
      {
        label: 'Toggle Fullscreen HUD [F11]',
        click: () => {
          if (mainWindow) {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
      },
      {
        label: 'Restart Subsystems & Daemons',
        click: () => {
          executeWslCommand(`${MANAGE_SCRIPT} restart`).then(() => {
            if (mainWindow) mainWindow.loadURL(STUDIO_URL);
          });
        },
      },
      { type: 'separator' },
      {
        label: 'Quit Hermes OS',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('HERMES AGENT OS — Neural HUD & Kali Subsystem');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('System tray registration notice:', err.message);
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
    icon: fs.existsSync(icoPath) ? icoPath : undefined,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the offline cybernetic splash bootloader first
  mainWindow.loadFile(path.join(__dirname, 'splash.html'));

  // Keyboard accelerators for the native Windows application
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F11') {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        event.preventDefault();
      } else if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        mainWindow.reload();
        event.preventDefault();
      } else if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      } else if (input.control && input.key.toLowerCase() === 'k') {
        launchKaliTerminal();
        event.preventDefault();
      }
    }
  });

  // Handle external link clicks (allow God's Eye port 4173)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('http://localhost:4173') ||
      url.startsWith('http://127.0.0.1:4173') ||
      url.startsWith('http://localhost:3001') ||
      url.startsWith('http://127.0.0.1:3001')
    ) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle network / loading errors gracefully with automatic retry
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL.includes('3001')) {
      console.warn('Endpoint not ready yet, retrying in 2 seconds...', errorDescription);
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(STUDIO_URL);
        }
      }, 2000);
    }
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      // Clean quit
      app.isQuitting = true;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Begin background initialization
  initializeHermesEnvironment();
}

app.whenReady().then(() => {
  // 1. Grant media & microphone permissions automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler(() => true);

  // 2. Implement displayMedia handler for Windows Host Desktop Audio loopback capture
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources && sources.length > 0) {
        callback({ video: sources[0], audio: 'loopback' });
      } else {
        callback({});
      }
    }).catch(() => {
      callback({});
    });
  });

  createWindow();
  createTray();

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
