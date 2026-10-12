@echo off
title KALI LINUX - HERMES AGENT OS TERMINAL
where wt.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    start "" wt.exe -p "kali-linux" -d "\\wsl.localhost\kali-linux\home\thecyberexpert"
) else (
    start "Kali Linux - Hermes Agent OS" wsl.exe -d kali-linux
)
