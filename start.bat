@echo off
title 23TRADE Local Platform Launcher
echo ============================================================
echo   23TRADE - DECENTRALIZED PERPETUAL & 0DTE OPTIONS TERMINAL
echo ============================================================
echo.
echo [1] Start 23TRADE Local Exchange (http://localhost:3000)
echo [2] Run Contracts & Aegis Sentinel Test Suite (27/27 Tests)
echo [3] Open Interactive Architecture Canvas (architecture.html)
echo.
echo Press Enter to launch 23TRADE Platform on http://localhost:3000 ...
set /p choice="Select option [1-3] (default is 1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo Starting 23TRADE Exchange on http://localhost:3000...
    timeout /t 1 >nul
    start http://localhost:3000
    node server.cjs
    exit
)
if "%choice%"=="2" (
    echo Running verification suite...
    node test-simulation.js
    pause
    exit
)
if "%choice%"=="3" (
    echo Opening Architecture Canvas...
    start architecture.html
    exit
)
