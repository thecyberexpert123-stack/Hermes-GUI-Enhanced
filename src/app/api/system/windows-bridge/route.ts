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
}

/**
 * Execute command against Windows host via cmd.exe
 */
async function execOnWindows(cmd: string): Promise<string> {
  const { stdout } = await execAsync(`cmd.exe /c "${cmd}" < /dev/null`, { timeout: 6000 });
  return stdout.trim();
}

/**
 * GET: Query Windows Host Telemetry & Subsystems
 */
export async function GET() {
  const telemetry: WindowsTelemetry = {
    isWsl: fs.existsSync('/proc/sys/fs/binfmt_misc/WSLInterop') || fs.existsSync('/mnt/c'),
    windowsUser: 'unknown',
    hasWindowsTerminal: false,
    installedBrowsers: [],
    distroName: 'kali-linux',
  };

  try {
    const userOut = await execOnWindows('echo %USERNAME%').catch(() => 'anish');
    telemetry.windowsUser = userOut.replace(/['"\r\n]/g, '').trim() || 'anish';
  } catch {
    telemetry.windowsUser = 'anish';
  }

  // Probe Windows Terminal
  try {
    const wtOut = await execOnWindows('where wt.exe').catch(() => '');
    if (wtOut && wtOut.toLowerCase().includes('wt.exe')) {
      telemetry.hasWindowsTerminal = true;
      telemetry.windowsTerminalPath = wtOut.split('\n')[0].trim();
    }
  } catch {}

  // Probe installed browsers
  const browserCandidates = [
    { name: 'Edge', path: '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', winCmd: 'msedge.exe' },
    { name: 'Chrome', path: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe', winCmd: 'chrome.exe' },
    { name: 'Brave', path: '/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', winCmd: 'brave.exe' },
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
        // Spawns native Windows Terminal or WSL Kali console on the Windows desktop
        let launchCmd = 'start "" wt.exe -p "kali-linux" -d "\\\\wsl.localhost\\kali-linux\\home\\thecyberexpert"';
        try {
          await execOnWindows(launchCmd);
        } catch {
          // Fallback to direct wsl.exe start
          launchCmd = 'start "" wsl.exe -d kali-linux';
          await execOnWindows(launchCmd);
        }
        return NextResponse.json({
          success: true,
          action,
          message: 'Launched interactive Kali Linux terminal session on Windows desktop.',
        });
      }

      case 'open-explorer': {
        const targetPath = body.path || '\\\\wsl.localhost\\kali-linux\\home\\thecyberexpert\\.gemini\\antigravity\\scratch\\studio';
        await execOnWindows(`start "" explorer.exe "${targetPath}"`);
        return NextResponse.json({
          success: true,
          action,
          message: `Opened Windows File Explorer at ${targetPath}.`,
        });
      }

      case 'launch-godseye': {
        // Launch God's Eye 3D Earth in dedicated app window
        const winCmd = 'start "" msedge.exe --app="http://localhost:4173" --window-size=1440,900';
        await execOnWindows(winCmd).catch(() => execOnWindows('start "" http://localhost:4173'));
        return NextResponse.json({
          success: true,
          action,
          message: "Launched God's Eye 3D Earth Viewer in dedicated Windows app window.",
        });
      }

      case 'launch-studio-app': {
        // Launch Studio in dedicated borderless app window
        const winCmd = 'start "" msedge.exe --app="http://localhost:3001" --window-size=1680,1000';
        await execOnWindows(winCmd).catch(() => execOnWindows('start "" http://localhost:3001'));
        return NextResponse.json({
          success: true,
          action,
          message: 'Launched Hermes Agent OS in dedicated Windows desktop app window.',
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
