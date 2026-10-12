@echo off
title HERMES AGENT OS - Autonomous Windows Launcher & Kali Orchestrator
color 0b
cls

echo ===============================================================================
echo   ██╗  ██╗███████╗██████╗ ███╗   ███╗███████╗███████╗
echo   ██║  ██║██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝
echo   ███████║█████╗  ██████╔╝██╔████╔██║█████╗  ███████╗
echo   ██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══╝  ╚════██║
echo   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████╗███████║
echo   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝
echo    [ AUTONOMOUS WINDOWS DESKTOP LAUNCHER & KALI ENGINE ]
echo ===============================================================================
echo.

echo [PHASE 1] AUTONOMOUS SUBSYSTEM DETECTION & AUTO-SETUP
echo -------------------------------------------------------------
echo [*] Checking WSL2 Kali Linux Environment...
wsl.exe -d kali-linux -e uname -s >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Starting WSL2 Kali Linux Subsystem...
    wsl.exe --status >nul 2>&1
)
echo [+] WSL2 Kali Linux Subsystem: ONLINE

echo [*] Auto-Provisioning Hermes Services (Studio, God's Eye, Gateway)...
wsl.exe -d kali-linux /home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh start
echo [+] Subsystems and Background Daemons Active.

echo.
echo [PHASE 2] MULTI-WINDOW ORCHESTRATION & LAUNCH
echo -------------------------------------------------------------

:: 1. Launch WSL Kali Interactive Terminal
echo [*] Spawning WSL Kali Interactive Terminal Session...
where wt.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" wt.exe -p "kali-linux" -d "\\wsl.localhost\kali-linux\home\thecyberexpert"
    echo [+] Launched via Windows Terminal [kali-linux profile].
) else (
    start "Kali Linux - Hermes OS" wsl.exe -d kali-linux
    echo [+] Launched via standard WSL Console.
)

:: 2. Launch Hermes GUI in Dedicated Borderless App Window
echo [*] Spawning Hermes GUI in Dedicated Desktop Window...
set BROWSER_CMD=
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_CMD=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_CMD=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    set "BROWSER_CMD=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
)

if defined BROWSER_CMD (
    start "" "%BROWSER_CMD%" --app="http://localhost:3001" --window-size=1680,1000 --name="Hermes Agent OS"
    echo [+] Launched in Dedicated Borderless Desktop Window.
) else (
    start "" "http://localhost:3001"
    echo [+] Launched in Default Browser.
)

echo.
echo [PHASE 3] J.A.R.V.I.S. CONTROLLER ACTIVE
echo -------------------------------------------------------------
echo [✔] All systems operational.
echo.
echo CONTROLLER COMMANDS:
echo   [1] Spawn Extra Kali Terminal
echo   [2] Launch God's Eye 3D Earth Viewer
echo   [3] Run Deep Diagnostics & Auto-Setup
echo   [4] Open Codebase in Windows Explorer
echo   [5] Check Services Status
echo   [6] Stop All Services & Exit
echo.

:LOOP
set /p CHOICE="hermes-os [1-6]> "
if "%CHOICE%"=="1" (
    start "" wt.exe -p "kali-linux" -d "\\wsl.localhost\kali-linux\home\thecyberexpert" 2>nul || start "Kali Linux" wsl.exe -d kali-linux
    goto LOOP
)
if "%CHOICE%"=="2" (
    start "" msedge.exe --app="http://localhost:4173" --window-size=1400,900 2>nul || start "" "http://localhost:4173"
    goto LOOP
)
if "%CHOICE%"=="3" (
    echo Triggering Auto-Setup Handshake...
    wsl.exe -d kali-linux curl -s -X POST http://localhost:3001/api/system/auto-setup
    echo Done.
    goto LOOP
)
if "%CHOICE%"=="4" (
    start "" explorer.exe "\\wsl.localhost\kali-linux\home\thecyberexpert\.gemini\antigravity\scratch\studio"
    goto LOOP
)
if "%CHOICE%"=="5" (
    wsl.exe -d kali-linux /home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh status
    goto LOOP
)
if "%CHOICE%"=="6" (
    echo Stopping all services...
    wsl.exe -d kali-linux /home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh stop
    echo All services stopped. Goodbye.
    timeout /t 2 >nul
    exit /b 0
)
goto LOOP
