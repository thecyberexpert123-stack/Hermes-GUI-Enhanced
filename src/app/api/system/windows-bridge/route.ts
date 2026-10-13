import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
export const dynamic = 'force-dynamic';

interface WindowsTelemetry {
  isWsl: boolean;
  windowsUser: string;
  hasWindowsTerminal: boolean;
  windowsTerminalPath?: string;
  installedBrowsers: Array<{ name: string; path: string; available: boolean }>;
  distroName: string;
  isStandaloneAppInstalled: boolean;
  isStandaloneAppRunning: boolean;
}

/**
 * Execute command against Windows host via powershell.exe cleanly from /mnt/c
 */
async function execOnWindows(psCommand: string): Promise<string> {
  const { stdout } = await execAsync(`powershell.exe -NoProfile -Command "${psCommand.replace(/"/g, '`"')}" < /dev/null`, {
    cwd: '/mnt/c',
    timeout: 8000,
  });
  return stdout.trim();
}

/**
 * Launch detached background process on Windows host via powershell.exe Start-Process
 */
async function launchOnWindows(psCommand: string): Promise<void> {
  await execAsync(`powershell.exe -NoProfile -Command "${psCommand.replace(/"/g, '`"')}" < /dev/null`, {
    cwd: '/mnt/c',
    timeout: 8000,
  });
}

/**
 * GET: Query Windows Host Telemetry & Subsystems
 */
export async function GET() {
  const telemetry: WindowsTelemetry = {
    isWsl: fs.existsSync('/proc/sys/fs/binfmt_misc/WSLInterop') || fs.existsSync('/mnt/c'),
    windowsUser: 'anish',
    hasWindowsTerminal: false,
    installedBrowsers: [],
    distroName: 'kali-linux',
    isStandaloneAppInstalled: false,
    isStandaloneAppRunning: false,
  };

  try {
    const userOut = await execOnWindows('$env:USERNAME').catch(() => 'anish');
    telemetry.windowsUser = userOut.replace(/['"\r\n]/g, '').trim() || 'anish';
  } catch {
    telemetry.windowsUser = 'anish';
  }

  // Probe Windows Terminal
  try {
    const wtCheck = await execOnWindows("if (Get-Command wt.exe -ErrorAction SilentlyContinue) { (Get-Command wt.exe).Source }").catch(() => '');
    if (wtCheck && wtCheck.toLowerCase().includes('wt.exe')) {
      telemetry.hasWindowsTerminal = true;
      telemetry.windowsTerminalPath = wtCheck.split('\n')[0].trim();
    }
  } catch {}

  // Probe Standalone Desktop Application
  try {
    const appInstalled = fs.existsSync('/mnt/c/Users/anish/Hermes-Agent-OS/Hermes-Agent-OS.exe') ||
      fs.existsSync('/mnt/c/Users/anish/Hermes-Agent-OS/node_modules/electron/dist/electron.exe');
    telemetry.isStandaloneAppInstalled = appInstalled;

    const electronRunning = await execOnWindows("if (Get-Process electron -ErrorAction SilentlyContinue) { 'RUNNING' } else { 'STOPPED' }").catch(() => 'STOPPED');
    telemetry.isStandaloneAppRunning = electronRunning.includes('RUNNING');
  } catch {}

  // Probe installed browsers
  const browserCandidates = [
    { name: 'Edge', path: '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' },
    { name: 'Chrome', path: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe' },
    { name: 'Brave', path: '/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe' },
  ];

  telemetry.installedBrowsers = browserCandidates.map((b) => ({
    name: b.name,
    path: b.path,
    available: fs.existsSync(b.path),
  }));

  return NextResponse.json({
    status: 'ONLINE',
    telemetry,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST: Execute Windows Host Action
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || '';

    switch (action) {
      case 'launch-kali': {
        // Spawns native Windows Terminal or WSL Kali console directly on Windows desktop
        const psCmd = "if (Get-Command wt.exe -ErrorAction SilentlyContinue) { Start-Process wt.exe -ArgumentList 'wsl.exe -d kali-linux ~' } else { Start-Process cmd.exe -ArgumentList '/c start `\"Kali Linux - Hermes Agent OS`\" wsl.exe -d kali-linux ~' }";
        await launchOnWindows(psCmd);
        return NextResponse.json({
          success: true,
          action,
          message: 'Spawned interactive Kali Linux terminal session on Windows desktop.',
        });
      }

      case 'open-explorer': {
        const targetPath = body.path || 'C:\\Users\\anish\\Hermes-Agent-OS';
        const psCmd = `Start-Process explorer.exe -ArgumentList '${targetPath}'`;
        await launchOnWindows(psCmd);
        return NextResponse.json({
          success: true,
          action,
          message: `Opened Windows File Explorer at ${targetPath}.`,
        });
      }

      case 'launch-godseye': {
        // Launch God's Eye 3D Earth in dedicated app window
        const psCmd = "if (Test-Path 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe') { Start-Process 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' -ArgumentList '--app=http://localhost:4173 --window-size=1440,900' } else { Start-Process 'http://localhost:4173' }";
        await launchOnWindows(psCmd);
        return NextResponse.json({
          success: true,
          action,
          message: "Launched God's Eye 3D Earth Viewer on Windows desktop.",
        });
      }

      case 'launch-studio-app': {
        // Launch independent standalone desktop application (NO web browser)
        const psCmd = "if (Test-Path 'C:\\Users\\anish\\Hermes-Agent-OS\\Hermes-Agent-OS.exe') { Start-Process 'C:\\Users\\anish\\Hermes-Agent-OS\\Hermes-Agent-OS.exe' -WorkingDirectory 'C:\\Users\\anish\\Hermes-Agent-OS' } elseif (Test-Path 'C:\\Users\\anish\\Hermes-Agent-OS\\node_modules\\electron\\dist\\electron.exe') { Start-Process 'C:\\Users\\anish\\Hermes-Agent-OS\\node_modules\\electron\\dist\\electron.exe' -ArgumentList '.' -WorkingDirectory 'C:\\Users\\anish\\Hermes-Agent-OS' } else { Start-Process 'http://127.0.0.1:3001' }";
        await launchOnWindows(psCmd);
        return NextResponse.json({
          success: true,
          action,
          message: 'Launched Hermes Agent OS standalone independent desktop application.',
        });
      }

      case 'restart-daemons': {
        const scriptPath = '/home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh';
        await execAsync(`bash ${scriptPath} restart`, { timeout: 25000 });
        return NextResponse.json({
          success: true,
          action,
          message: 'Restarted all Hermes Agent OS daemons (Studio, God\'s Eye, Gateway).',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Windows bridge operation failed' },
      { status: 500 }
    );
  }
}
