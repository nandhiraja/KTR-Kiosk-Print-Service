@echo off
REM ============================================================
REM  Restaurant Kiosk Print Service - Enhanced Installer
REM  Installs service with comprehensive validation and logging
REM ============================================================

REM CRITICAL: Change to the directory where this batch file is located
cd /d "%~dp0"

echo.
echo ============================================================
echo   Restaurant Kiosk Print Service - Installer
echo ============================================================
echo.
echo Current directory: %CD%
echo.
echo This will install the print service on your system.
echo.
echo Features:
echo   - Saves PDFs to Downloads/KioskPrints folder
echo   - Prints to thermal printer (if connected)
echo   - Auto-starts on Windows boot
echo   - Auto-restart on crash
echo.
echo Prerequisites:
echo   - Node.js installed (v18 or higher)
echo   - Running as Administrator
echo.
pause

REM ============================================
REM Check if running as Administrator
REM ============================================
echo.
echo [0/6] Checking administrator privileges...
echo ============================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Running as Administrator
echo.

REM ============================================
REM Validate Required Files
REM ============================================
echo [1/6] Validating project files...
echo ============================================================

set ALL_FILES_OK=1

REM Check package.json
if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found!
    set ALL_FILES_OK=0
)

REM Check server.js
if exist "src\server.js" (
    echo [OK] src\server.js found
) else (
    echo [ERROR] src\server.js not found!
    set ALL_FILES_OK=0
)

REM Check config
if exist "src\config\printer.config.js" (
    echo [OK] printer.config.js found
) else (
    echo [ERROR] src\config\printer.config.js not found!
    set ALL_FILES_OK=0
)

REM Check install script
if exist "scripts\install-service.js" (
    echo [OK] install-service.js found
) else (
    echo [ERROR] scripts\install-service.js not found!
    set ALL_FILES_OK=0
)

if %ALL_FILES_OK% equ 0 (
    echo.
    echo [ERROR] Critical files are missing!
    echo.
    echo Ensure you have extracted all files correctly.
    echo.
    pause
    exit /b 1
)

echo [OK] All required files present
echo.

REM ============================================
REM Check Node.js
REM ============================================
echo [2/6] Checking Node.js installation...
echo ============================================================

REM Refresh environment variables to get latest PATH
call refreshenv >nul 2>&1

REM Try node command directly first
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VERSION=%%i
    goto :node_found
)

REM If not found, try common installation paths
set NODE_PATH=
if exist "C:\Program Files\nodejs\node.exe" set NODE_PATH=C:\Program Files\nodejs\node.exe
if exist "C:\Program Files (x86)\nodejs\node.exe" set NODE_PATH=C:\Program Files (x86)\nodejs\node.exe
if exist "%APPDATA%\npm\node.exe" set NODE_PATH=%APPDATA%\npm\node.exe

if defined NODE_PATH (
    REM Add to PATH for this session
    set "PATH=%PATH%;%NODE_PATH:node.exe=%"
    for /f "tokens=*" %%i in ('"%NODE_PATH%" --version 2^>nul') do set NODE_VERSION=%%i
    goto :node_found
)

REM Node.js not found
echo.
echo [ERROR] Node.js is not installed or not found!
echo.
echo You have two options:
echo.
echo Option 1: Install Node.js
echo   Download from: https://nodejs.org/
echo   Use LTS version (v18 or higher)
echo   Make sure to check "Add to PATH" during installation
echo.
echo Option 2: If already installed, try:
echo   1. Close this window
echo   2. Open a NEW Command Prompt as Administrator
echo   3. Run this installer again
echo.
pause
exit /b 1

:node_found
echo [OK] Node.js found: %NODE_VERSION%

REM Check npm
call npm --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
    echo [OK] npm found: %NPM_VERSION%
) else (
    echo [ERROR] npm not found!
    echo.
    pause
    exit /b 1
)

echo.

REM ============================================
REM Check if Service Already Exists
REM ============================================
echo [3/6] Checking for existing service...
echo ============================================================

set SERVICE_NAME=KioskPrintService

sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% equ 0 (
    echo.
    echo [WARNING] Service '%SERVICE_NAME%' is already installed!
    echo.
    echo To reinstall:
    echo   1. Close this window
    echo   2. Run UNINSTALL.bat first
    echo   3. Then run INSTALL.bat again
    echo.
    pause
    exit /b 1
) else (
    echo [OK] No existing service found
)

echo.

REM ============================================
REM Install Dependencies
REM ============================================
echo [4/6] Installing dependencies...
echo ============================================================

echo Running: npm install
echo.

call npm install
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo.
    echo Possible causes:
    echo   - No internet connection
    echo   - npm registry issues
    echo   - Corrupted package-lock.json
    echo.
    echo Try:
    echo   1. Check your internet connection
    echo   2. Delete package-lock.json and node_modules
    echo   3. Run this installer again
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed
echo.

REM ============================================
REM Install Printer Support
REM ============================================
echo [5/6] Installing printer support (optional)...
echo ============================================================

call npm install pdf-to-printer
if %errorLevel% neq 0 (
    echo.
    echo [WARNING] Printer package installation failed.
    echo PDFs will be saved but may not print automatically.
    echo You can install it later: npm install pdf-to-printer
    echo.
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Printer support installed
)

echo.

REM ============================================
REM Install Windows Service
REM ============================================
echo [6/6] Installing Windows Service...
echo ============================================================

echo Running: npm run install-service
echo.

call npm run install-service
set INSTALL_RESULT=%errorLevel%

if %INSTALL_RESULT% neq 0 (
    echo.
    echo [ERROR] Failed to install Windows Service!
    echo.
    echo Check the output above for specific errors.
    echo.
    echo Common issues:
    echo   - node-windows module not installed
    echo   - Insufficient permissions
    echo   - Service name conflict
    echo.
    pause
    exit /b 1
)

echo [OK] Service installation script completed
echo.

REM ============================================
REM Wait for Service to Start
REM ============================================
echo Waiting for service to start...
timeout /t 3 /nobreak >nul

REM ============================================
REM Verify Service Installation
REM ============================================
echo.
echo Verifying service installation...
echo ============================================================

sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Service verification failed!
    echo Service does not appear to be installed.
    echo.
    echo Check logs for details: %CD%\logs\
    echo.
    pause
    exit /b 1
)

REM Check service status
sc query %SERVICE_NAME% | find "RUNNING" >nul
if %errorLevel% equ 0 (
    echo [OK] Service is RUNNING
    set SERVICE_RUNNING=1
) else (
    echo [WARNING] Service installed but NOT running
    
    REM Try to start it
    echo Attempting to start service...
    net start %SERVICE_NAME%
    
    if %errorLevel% equ 0 (
        echo [OK] Service started successfully
        set SERVICE_RUNNING=1
    ) else (
        echo [ERROR] Service failed to start
        echo.
        echo Check logs: %CD%\logs\combined.log
        echo Check Windows Event Viewer for details
        set SERVICE_RUNNING=0
    )
)

echo.

REM ============================================
REM Installation Summary
REM ============================================
echo ============================================================
if %SERVICE_RUNNING% equ 1 (
    echo   Installation Complete!
) else (
    echo   Installation Completed with Warnings
)
echo ============================================================
echo.

if %SERVICE_RUNNING% equ 1 (
    echo The print service is now running.
    echo.
    echo Service Details:
    echo   Name: %SERVICE_NAME%
    echo   Port: http://localhost:9100
    echo   Auto-start: YES (starts on boot)
    echo   Mode: printer (set in service config)
    echo.
    echo PDF Output: C:\Users\KIOSK\Downloads\KioskPrints\
    echo Logs: %CD%\logs\
    echo.
    echo Test Health: http://localhost:9100/print/health
    echo.
    echo Important:
    echo   1. Set a default printer in Windows Settings
    echo   2. Ensure Print Spooler is running
    echo   3. Run FIX_PRINTER.bat to verify printer setup
    echo.
    echo Service Commands:
    echo   Start:  net start %SERVICE_NAME%
    echo   Stop:   net stop %SERVICE_NAME%
    echo   Status: sc query %SERVICE_NAME%
) else (
    echo Installation encountered issues.
    echo.
    echo The service is installed but not running.
    echo.
    echo Troubleshooting:
    echo   1. Check logs: type logs\combined.log
    echo   2. Start manually: net start %SERVICE_NAME%
    echo   3. Check Event Viewer: eventvwr
    echo   4. See TROUBLESHOOTING.md for help
)

echo.
pause
