import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { HERMES_PATH } from '@/lib/hermes';

const execAsync = promisify(exec);

// Allowed command list prefixes or safe commands to run in WSL
const SAFE_PREFIXES = [
  'uname',
  'uptime',
  'free',
  'df',
  'top',
  'ps',
  'w',
  'whoami',
  'id',
  'ls',
  'pwd',
  'cat',
  'head',
  'tail',
  'grep',
  'find',
  'echo',
  'date',
  'ip',
  'netstat',
  'ss',
  'hermes',
  'systemctl status',
  'which',
  'kill',
];

export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command string is required' }, { status: 400 });
    }

    const trimmed = command.trim();
    if (!trimmed) {
      return NextResponse.json({ stdout: '', stderr: '', exitCode: 0 });
    }

    // Safety filter: prevent dangerous destructive commands like rm -rf / or mkfs
    const lower = trimmed.toLowerCase();
    if (
      lower.includes('rm -rf') ||
      lower.includes('mkfs') ||
      lower.includes(':(){ :|:& };:') ||
      lower.includes('shutdown') ||
      lower.includes('reboot') ||
      lower.includes('> /dev/sda') ||
      lower.match(/^kill\s+(-9\s+)?1(\s|$)/) // Protect PID 1
    ) {
      return NextResponse.json(
        {
          stdout: '',
          stderr: 'EXECUTION_DENIED: Destructive or system-critical alteration commands are restricted by Stark Protocol.',
          exitCode: 1,
        },
        { status: 403 }
      );
    }

    const { stdout, stderr } = await execAsync(trimmed, {
      env: {
        ...process.env,
        PATH: HERMES_PATH,
        TERM: 'xterm-256color',
      },
      timeout: 10000,
      maxBuffer: 1024 * 512,
    });

    return NextResponse.json({
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: 0,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || 'Execution error',
      exitCode: err.code || 1,
      executedAt: new Date().toISOString(),
    });
  }
}
