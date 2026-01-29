@echo off
REM ============================================================
REM  Restaurant Kiosk Print Service - Enhanced Uninstaller
REM  Removes the Windows Service with validation and logging
REM ============================================================

REM CRITICAL: Change to the directory where this batch file is located
cd /d "%~dp0"

echo.
echo ============================================================
echo   Restaurant Kiosk Print Service - Uninstaller
echo ============================================================
echo.
echo Current directory: %CD%
echo.
echo This will REMOVE the print service from your system.
echo.
echo WARNING: This action cannot be undone!
echo.
pause

REM ============================================
REM Check if running as Administrator
REM ============================================
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
REM Validate Service Name
REM ============================================
echo [1/5] Validating service configuration...
echo ============================================================

set SERVICE_NAME=KioskPrintService

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Service '%SERVICE_NAME%' is not installed
    echo.
    echo Nothing to uninstall!
    echo.
    pause
    exit /b 0
) else (
    echo [OK] Service '%SERVICE_NAME%' found
)

REM Get service status
for /f "tokens=3" %%a in ('sc query %SERVICE_NAME% ^| findstr "STATE"') do set SERVICE_STATE=%%a
echo [INFO] Current status: %SERVICE_STATE%
echo.

REM ============================================
REM Check Required Files
REM ============================================
echo [2/5] Checking required files...
echo ============================================================

set ALL_FILES_OK=1

REM Check package.json
if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found!
    set ALL_FILES_OK=0
)

REM Check scripts directory
if exist "scripts\uninstall-service.js" (
    echo [OK] uninstall-service.js found
) else (
    echo [ERROR] scripts\uninstall-service.js not found!
    set ALL_FILES_OK=0
)

REM Check node_modules
if exist "node_modules" (
    echo [OK] node_modules directory found
) else (
    echo [WARNING] node_modules not found - dependencies may not be installed
    set ALL_FILES_OK=0
)

if %ALL_FILES_OK% equ 0 (
    echo.
    echo [WARNING] Some files are missing!
    echo Attempting manual uninstall...
    echo.
)

echo.

REM ============================================
REM Stop Service
REM ============================================
echo [3/5] Stopping service...
echo ============================================================

if "%SERVICE_STATE%"=="RUNNING" (
    echo Stopping %SERVICE_NAME%...
    net stop %SERVICE_NAME%
    
    if %errorLevel% equ 0 (
        echo [OK] Service stopped successfully
        timeout /t 2 /nobreak >nul
    ) else (
        echo [WARNING] Failed to stop service gracefully
        echo Attempting forced stop...
        sc stop %SERVICE_NAME%
        timeout /t 3 /nobreak >nul
    )
) else (
    echo [INFO] Service is not running
)

echo.

REM ============================================
REM Uninstall Service
REM ============================================
echo [4/5] Uninstalling service...
echo ============================================================

REM Try npm script first
if %ALL_FILES_OK% equ 1 (
    echo Using npm uninstall script...
    call npm run uninstall-service
    set UNINSTALL_RESULT=%errorLevel%
) else (
    echo Skipping npm script (files missing)
    set UNINSTALL_RESULT=1
)

REM If npm failed or files missing, try manual uninstall
if %UNINSTALL_RESULT% neq 0 (
    echo.
    echo [WARNING] npm uninstall failed or unavailable
    echo Attempting manual service deletion...
    
    sc delete %SERVICE_NAME%
    
    if %errorLevel% equ 0 (
        echo [OK] Service deleted manually
        set UNINSTALL_RESULT=0
    ) else (
        echo [ERROR] Manual deletion also failed!
        set UNINSTALL_RESULT=1
    )
)

echo.

REM ============================================
REM Verify Uninstallation
REM ============================================
echo [5/5] Verifying uninstallation...
echo ============================================================

timeout /t 2 /nobreak >nul

sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo [OK] Service successfully removed
    set VERIFY_OK=1
) else (
    echo [WARNING] Service may still exist
    sc query %SERVICE_NAME%
    echo.
    echo You may need to restart your computer to complete removal.
    set VERIFY_OK=0
)

echo.

REM ============================================
REM Summary
REM ============================================
echo ============================================================
if %VERIFY_OK% equ 1 (
    echo   Uninstallation Complete!
) else (
    echo   Uninstallation Completed with Warnings
)
echo ============================================================
echo.

if %VERIFY_OK% equ 1 (
    echo The print service has been removed from your system.
    echo.
    echo What's left:
    echo   - Project files (in this folder)
    echo   - Dependencies (node_modules)
    echo   - Any generated PDFs (in Downloads\KioskPrints)
    echo.
    echo To completely remove everything:
    echo   1. Delete this entire folder
    echo   2. Delete C:\Users\KIOSK\Downloads\KioskPrints (optional)
) else (
    echo Service removal encountered issues.
    echo.
    echo Try these steps:
    echo   1. Restart your computer
    echo   2. Run this script again as Administrator
    echo   3. If still failing, manually delete: sc delete %SERVICE_NAME%
)

echo.
echo Log file location: %CD%\logs\
echo.

pause
