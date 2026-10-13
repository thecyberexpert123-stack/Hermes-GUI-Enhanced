import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface WisprUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  authenticated: boolean;
}

export interface WisprKeybind {
  action: string;
  keys: string;
  code: number[];
}

export interface WisprDictation {
  id: string;
  timestamp: string;
  app: string;
  url?: string;
  status?: string;
  formattedText: string;
  pastedText: string;
  duration?: number;
  numWords?: number;
  e2eLatency?: number;
  detectedLanguage?: string;
  micDevice?: string;
}

export interface WisprStatusResponse {
  installed: boolean;
  running: boolean;
  appPath: string;
  version: string;
  user: WisprUser | null;
  keybinds: WisprKeybind[];
  recentDictations: WisprDictation[];
  lastDictation: WisprDictation | null;
  totalDictationsCount: number;
}

const APPDATA_ROAMING = '/mnt/c/Users/anish/AppData/Roaming/Wispr Flow';
const APPDATA_LOCAL = '/mnt/c/Users/anish/AppData/Local/WisprFlow';
const DB_PATH = path.join(APPDATA_ROAMING, 'flow.sqlite');
const CONFIG_PATH = path.join(APPDATA_ROAMING, 'config.json');
const SESSION_PATH = path.join(APPDATA_ROAMING, 'session.json');
const EXE_PATH = path.join(APPDATA_LOCAL, 'Wispr Flow.exe');

function mapKeyCodeToString(codes: number[]): string {
  const map: Record<number, string> = {
    20: 'Caps Lock',
    27: 'Escape',
    160: 'Shift',
    162: 'Ctrl',
    164: 'Alt',
    86: 'V',
    88: 'X',
    90: 'Z',
    77: 'M',
    32: 'Space',
    91: 'Win',
  };
  return codes.map((c) => map[c] || `Key(${c})`).join(' + ');
}

/**
 * Read active Wispr Flow user profile from session.json
 */
export function getWisprUser(): WisprUser | null {
  try {
    if (!fs.existsSync(SESSION_PATH)) return null;
    const raw = fs.readFileSync(SESSION_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const tokenKey = Object.keys(data).find((k) => k.includes('auth-token'));
    if (!tokenKey || !data[tokenKey]) return null;

    const tokenData = typeof data[tokenKey] === 'string' ? JSON.parse(data[tokenKey]) : data[tokenKey];
    const user = tokenData?.user;
    if (!user) return null;

    const metadata = user.user_metadata || {};
    return {
      id: user.id || '',
      name: metadata.full_name || metadata.name || 'Wispr User',
      email: user.email || metadata.email || '',
      avatarUrl: metadata.avatar_url || metadata.picture || '',
      authenticated: true,
    };
  } catch {
    return null;
  }
}

/**
 * Read configured keybinds from config.json
 */
export function getWisprKeybinds(): WisprKeybind[] {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return [];
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const keybinds: WisprKeybind[] = [];

    const rawList = data.prefs?.cache?.splitKeybinds || data.splitKeybinds || [];

    if (Array.isArray(rawList)) {
      for (const item of rawList) {
        if (item.shortcut && item.value) {
          keybinds.push({
            action: item.value,
            keys: mapKeyCodeToString(item.shortcut),
            code: item.shortcut,
          });
        }
      }
    }
    return keybinds;
  } catch {
    return [
      { action: 'ptt', keys: 'Caps Lock', code: [20] },
      { action: 'dismiss', keys: 'Escape', code: [27] },
    ];
  }
}

/**
 * Safely query flow.sqlite using an atomic read snapshot
 */
export function getWisprDictations(limit = 20): { dictations: WisprDictation[]; totalCount: number } {
  try {
    if (!fs.existsSync(DB_PATH)) return { dictations: [], totalCount: 0 };

    const snapDb = '/tmp/wispr_flow_snap.sqlite';
    const snapWal = snapDb + '-wal';
    const srcWal = DB_PATH + '-wal';

    fs.copyFileSync(DB_PATH, snapDb);
    try {
      if (fs.existsSync(srcWal)) {
        fs.copyFileSync(srcWal, snapWal);
      }
    } catch {}

    // Use built-in node:sqlite DatabaseSync
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(snapDb, { readOnly: true });

    let totalCount = 0;
    let rows: any[] = [];
    try {
      try {
        const countRow = db.prepare('SELECT COUNT(*) as count FROM History').get();
        if (countRow && typeof countRow.count === 'number') {
          totalCount = countRow.count;
        }
      } catch {}

      const safeLimit = Math.min(100, Math.max(1, limit));
      rows = db
        .prepare(
          `SELECT transcriptEntityId, timestamp, app, url, status, formattedText, pastedText, duration, numWords, e2eLatency, detectedLanguage, micDevice
           FROM History
           ORDER BY timestamp DESC
           LIMIT ?`
        )
        .all(safeLimit);
    } finally {
      try {
        db.close();
      } catch {}
    }

    const dictations: WisprDictation[] = (rows as any[]).map((r) => ({
      id: r.transcriptEntityId || '',
      timestamp: r.timestamp || '',
      app: r.app || 'Unknown',
      url: r.url || undefined,
      status: r.status || 'finalized',
      formattedText: (r.formattedText || r.pastedText || '').trim(),
      pastedText: (r.pastedText || r.formattedText || '').trim(),
      duration: typeof r.duration === 'number' ? r.duration : undefined,
      numWords: typeof r.numWords === 'number' ? r.numWords : undefined,
      e2eLatency: typeof r.e2eLatency === 'number' ? r.e2eLatency : undefined,
      detectedLanguage: r.detectedLanguage || undefined,
      micDevice: r.micDevice || undefined,
    }));

    return { dictations, totalCount };
  } catch (err) {
    console.warn('Wispr dictation snapshot query notice:', err);
    return { dictations: [], totalCount: 0 };
  }
}

let lastProcessCheckTime = 0;
let cachedRunning = false;

/**
 * Check if Wispr Flow process is actively running on Windows host
 */
export async function isWisprProcessRunning(): Promise<boolean> {
  const now = Date.now();
  if (now - lastProcessCheckTime < 4000) {
    return cachedRunning;
  }
  try {
    const { stdout } = await execAsync(
      `powershell.exe -NoProfile -NonInteractive -Command "if (Get-Process 'Wispr Flow' -ErrorAction SilentlyContinue) { 'RUNNING' } else { 'STOPPED' }" < /dev/null`,
      { timeout: 3500, windowsHide: true }
    );
    cachedRunning = stdout.trim() === 'RUNNING';
  } catch {
    cachedRunning = fs.existsSync(DB_PATH + '-wal');
  }
  lastProcessCheckTime = now;
  return cachedRunning;
}

/**
 * Get comprehensive Wispr Flow status and latest dictations
 */
export async function getWisprStatus(): Promise<WisprStatusResponse> {
  const installed = fs.existsSync(EXE_PATH) || fs.existsSync(DB_PATH);
  const user = getWisprUser();
  const keybinds = getWisprKeybinds();
  const { dictations, totalCount } = getWisprDictations(15);

  let version = '1.6.1102';
  try {
    const appDirs = fs.readdirSync(APPDATA_LOCAL).filter((d) => d.startsWith('app-'));
    if (appDirs.length > 0) {
      version = appDirs[0].replace('app-', '');
    }
  } catch {}

  const running = await isWisprProcessRunning();

  return {
    installed,
    running,
    appPath: EXE_PATH,
    version,
    user,
    keybinds,
    recentDictations: dictations,
    lastDictation: dictations.find((d) => (d.formattedText || d.pastedText || '').trim().length > 0) || dictations[0] || null,
    totalDictationsCount: totalCount,
  };
}

/**
 * Launch Wispr Flow on Windows host silently in background tray
 */
export async function launchWisprFlowApp(): Promise<{ success: boolean; message: string }> {
  try {
    await execAsync(
      `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -Command 'Start-Process -FilePath "$env:LOCALAPPDATA\\WisprFlow\\Wispr Flow.exe"' < /dev/null`,
      { timeout: 6000, windowsHide: true }
    );
    cachedRunning = true;
    lastProcessCheckTime = Date.now();
    return { success: true, message: 'Wispr Flow launched silently on Windows host in tray' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to launch Wispr Flow' };
  }
}

/**
 * Trigger Wispr Flow Push-To-Talk via simulated hotkey (Caps Lock)
 */
export async function triggerWisprPtt(): Promise<{ success: boolean; message: string }> {
  try {
    await execAsync(
      `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $ws.SendKeys('{CAPSLOCK}')" < /dev/null`,
      { timeout: 5000, windowsHide: true }
    );
    return { success: true, message: 'Wispr Flow PTT toggled via Caps Lock' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to trigger Wispr PTT' };
  }
}
