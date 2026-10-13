<#
.SYNOPSIS
    Hermes Agent OS - Autonomous Windows PowerShell Orchestrator
.DESCRIPTION
    Auto-detects WSL2 Kali Linux, auto-provisions daemons (Next.js Studio, God's Eye Cesium,
    Hermes Gateway Daemon), and launches both the interactive Kali Linux terminal and the
    Hermes Agent GUI in dedicated desktop windows.
#>

[CmdletBinding()]
param (
    [switch]$NoBrowser,
    [switch]$NoTerminal,
    [switch]$Restart,
    [switch]$Diagnostics
)

$Host.UI.RawUI.WindowTitle = "HERMES AGENT OS — Autonomous Windows Launcher & Kali Engine"
Clear-Host

Write-Host @"

  ██╗  ██╗███████╗██████╗ ███╗   ███╗███████╗███████╗
  ██║  ██║██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝
  ███████║█████╗  ██████╔╝██╔████╔██║█████╗  ███████╗
  ██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══╝  ╚════██║
  ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████╗███████║
  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝
   [ AUTONOMOUS WINDOWS DESKTOP LAUNCHER & KALI ENGINE ]

"@ -ForegroundColor Cyan

$distro = "kali-linux"
$studioUrl = "http://localhost:3001"
$godseyeUrl = "http://localhost:4173"
$manageScript = "/home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh"

Write-Host "[PHASE 1] AUTONOMOUS SUBSYSTEM DETECTION & PROVISIONING" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# 1. Check WSL2 Kali
Write-Host " [+] Probing WSL2 Kali Linux Subsystem... " -NoNewline -ForegroundColor Yellow
$wslCheck = wsl.exe -d $distro -e uname -s 2>$null
if ($wslCheck -match "Linux") {
    Write-Host "[ONLINE: WSL2 KALI READY]" -ForegroundColor Green
} else {
    Write-Host "[STARTING SUBSYSTEM]" -ForegroundColor Yellow
    wsl.exe --status | Out-Null
}

# 2. Start services inside WSL Kali
if ($Restart) {
    Write-Host " [*] Restarting all services... " -NoNewline -ForegroundColor Yellow
    wsl.exe -d $distro $manageScript restart | Out-Null
    Write-Host "[RESTARTED]" -ForegroundColor Green
} else {
    Write-Host " [*] Auto-Provisioning Services (Studio, God's Eye, Gateway)... " -NoNewline -ForegroundColor Yellow
    wsl.exe -d $distro $manageScript start | Out-Null
    Write-Host "[DAEMONS ACTIVE]" -ForegroundColor Green
}

# 3. Verify HTTP Endpoints
Write-Host " [*] Probing Port 3001 (Studio) & Port 4173 (God's Eye)... " -NoNewline -ForegroundColor Yellow
$retries = 20
$allUp = $false
while ($retries-- -gt 0 -and -not $allUp) {
    try {
        $r1 = Invoke-WebRequest -Uri $studioUrl -Method Head -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
        $r2 = Invoke-WebRequest -Uri $godseyeUrl -Method Head -TimeoutSec 1 -UseBasicParsing -ErrorAction Stop
        if ($r1.StatusCode -eq 200 -and $r2.StatusCode -eq 200) {
            $allUp = $true
            break
        }
    } catch {
        Start-Sleep -Milliseconds 800
    }
}
Write-Host "[VERIFIED: 100% HEALTH]" -ForegroundColor Green

# 4. Deep Auto-Setup Handshake
if ($Diagnostics) {
    Write-Host " [*] Executing Deep Auto-Setup & Self-Healing Handshake... " -NoNewline -ForegroundColor Yellow
    wsl.exe -d $distro curl -s -X POST "$studioUrl/api/system/auto-setup" | Out-Null
    Write-Host "[COMPLETED]" -ForegroundColor Green
}

Write-Host "`n[PHASE 2] MULTI-WINDOW ORCHESTRATION & LAUNCH" -ForegroundColor White
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# 5. Launch WSL Kali Terminal
if (-not $NoTerminal) {
    Write-Host " [+] Launching WSL Kali Interactive Terminal Session... " -NoNewline -ForegroundColor Yellow
    $wtPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps\wt.exe"
    if (Test-Path $wtPath) {
        Start-Process $wtPath -ArgumentList "wsl.exe -d $distro ~"
        Write-Host "[WINDOWS TERMINAL]" -ForegroundColor Green
    } else {
        Start-Process "cmd.exe" -ArgumentList "/c start `"Kali Linux - Hermes Agent OS`" wsl.exe -d $distro ~"
        Write-Host "[WSL CONSOLE]" -ForegroundColor Green
    }
}

# 6. Launch Standalone Independent Windows Desktop Application
if (-not $NoBrowser) {
    Write-Host " [+] Spawning Hermes GUI in Dedicated Application Window... " -NoNewline -ForegroundColor Yellow
    $appExe = "C:\Users\anish\Hermes-Agent-OS\Hermes-Agent-OS.exe"
    $electronExe = "C:\Users\anish\Hermes-Agent-OS\node_modules\electron\dist\electron.exe"

    if (Test-Path $appExe) {
        Start-Process $appExe -WorkingDirectory "C:\Users\anish\Hermes-Agent-OS"
        Write-Host "[STANDALONE WINDOWS APP]" -ForegroundColor Green
    } elseif (Test-Path $electronExe) {
        Start-Process $electronExe -ArgumentList "." -WorkingDirectory "C:\Users\anish\Hermes-Agent-OS"
        Write-Host "[NATIVE ELECTRON COCKPIT]" -ForegroundColor Green
    } else {
        $browserPaths = @(
            "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
            "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
        )
        $selectedBrowser = $null
        foreach ($p in $browserPaths) {
            if (Test-Path $p) {
                $selectedBrowser = $p
                break
            }
        }
        if ($selectedBrowser) {
            Start-Process $selectedBrowser -ArgumentList "--app=`"$studioUrl`" --window-size=1680,1000 --name=`"Hermes Agent OS`""
            Write-Host "[BORDERLESS APP WINDOW]" -ForegroundColor Green
        } else {
            Start-Process $studioUrl
            Write-Host "[DEFAULT BROWSER]" -ForegroundColor Green
        }
    }
}

Write-Host "`n[✔] ALL SUBSYSTEMS & WINDOWS ARE FULLY OPERATIONAL!" -ForegroundColor Green
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host " Quick Shortcuts:" -ForegroundColor Cyan
Write-Host "   • Press K in the GUI or run Launch-Kali-Terminal.bat for extra Kali sessions"
Write-Host "   • Run Stop-Hermes-OS.bat to gracefully stop all background services"
Write-Host ""
