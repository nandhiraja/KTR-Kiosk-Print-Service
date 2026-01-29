@echo off
REM ============================================================
REM  Restaurant Kiosk Print Service - Printer Fix Script
REM  Diagnoses and fixes common printer issues
REM ============================================================

cd /d "%~dp0"

echo.
echo ============================================================
echo   Restaurant Kiosk Print Service - Printer Diagnostics
echo ============================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/7] Checking Print Spooler Service...
echo ============================================================

sc query spooler | find "RUNNING" >nul
if %errorLevel% equ 0 (
    echo [OK] Print Spooler is running
) else (
    echo [WARNING] Print Spooler is not running
    echo Starting Print Spooler...
    net start spooler
    if %errorLevel% equ 0 (
        echo [OK] Print Spooler started
    ) else (
        echo [ERROR] Failed to start Print Spooler
    )
)

REM Ensure spooler auto-starts
sc config spooler start= auto >nul 2>&1
echo [OK] Print Spooler set to auto-start
echo.

echo [2/7] Checking Default Printer...
echo ============================================================

REM Get default printer
for /f "skip=1 tokens=1,2 delims=," %%a in ('wmic printer where default^=true get name^,default /format:csv 2^>nul') do (
    set DEFAULT_PRINTER=%%b
)

if defined DEFAULT_PRINTER (
    echo [OK] Default printer: %DEFAULT_PRINTER%
) else (
    echo [WARNING] No default printer configured!
    echo.
    echo Please set a default printer:
    echo   1. Open Settings ^> Devices ^> Printers ^& scanners
    echo   2. Click on your thermal printer
    echo   3. Click "Manage"
    echo   4. Click "Set as default"
    echo.
    echo Available printers:
    wmic printer get name,status
    echo.
    set NO_DEFAULT_PRINTER=1
)
echo.

echo [3/7] Listing Available Printers...
echo ============================================================
wmic printer get name,status,sharename
echo.

echo [4/7] Checking Kiosk Print Service...
echo ============================================================

sc query KioskPrintService >nul 2>&1
if %errorLevel% equ 0 (
    sc query KioskPrintService | find "RUNNING" >nul
    if %errorLevel% equ 0 (
        echo [OK] KioskPrintService is running
        set SERVICE_RUNNING=1
    ) else (
        echo [WARNING] KioskPrintService is installed but not running
        set SERVICE_STOPPED=1
    )
) else (
    echo [WARNING] KioskPrintService is not installed
    set SERVICE_NOT_INSTALLED=1
)
echo.

echo [5/7] Checking PDF Output Directory...
echo ============================================================

set USER_DOWNLOADS=%USERPROFILE%\Downloads\KioskPrints
set SYSTEM_DOWNLOADS=C:\WINDOWS\system32\config\systemprofile\Downloads\KioskPrints

if exist "%SYSTEM_DOWNLOADS%" (
    echo [WARNING] PDFs are being saved to SYSTEM profile:
    echo   %SYSTEM_DOWNLOADS%
    echo.
    echo This means you won't see them in your Downloads folder.
    echo.
    
    REM Count files
    dir /b "%SYSTEM_DOWNLOADS%\*.pdf" 2>nul | find /c ".pdf" > temp_count.txt
    set /p PDF_COUNT=<temp_count.txt
    del temp_count.txt
    
    echo Found %PDF_COUNT% PDF files in SYSTEM profile.
    echo.
    
    set /p MOVE_FILES="Do you want to move these PDFs to your Downloads folder? (Y/N): "
    if /i "%MOVE_FILES%"=="Y" (
        if not exist "%USER_DOWNLOADS%" mkdir "%USER_DOWNLOADS%"
        
        echo Moving PDF files...
        xcopy "%SYSTEM_DOWNLOADS%\*.pdf" "%USER_DOWNLOADS%\" /Y /I
        
        if %errorLevel% equ 0 (
            echo [OK] PDFs moved to: %USER_DOWNLOADS%
        ) else (
            echo [ERROR] Failed to move PDFs
        )
    )
) else (
    echo [OK] No PDFs in SYSTEM profile
)

if exist "%USER_DOWNLOADS%" (
    echo [OK] User Downloads folder exists: %USER_DOWNLOADS%
) else (
    echo Creating user Downloads folder...
    mkdir "%USER_DOWNLOADS%"
    echo [OK] Created: %USER_DOWNLOADS%
)
echo.

echo [6/7] Testing Printer Configuration...
echo ============================================================

if defined DEFAULT_PRINTER (
    echo Testing print to: %DEFAULT_PRINTER%
    
    REM Create test file
    echo Restaurant Kiosk Print Service - Test Print > test_print.txt
    echo Timestamp: %date% %time% >> test_print.txt
    echo. >> test_print.txt
    echo If you see this, your printer is working! >> test_print.txt
    
    set /p DO_TEST_PRINT="Do you want to send a test print? (Y/N): "
    if /i "%DO_TEST_PRINT%"=="Y" (
        notepad /p test_print.txt
        echo.
        echo [INFO] Test print sent to default printer
        echo Did the test page print? (Check your printer)
        echo.
    )
    
    del test_print.txt 2>nul
) else (
    echo [SKIP] Cannot test - no default printer configured
)
echo.

echo [7/7] Recommended Actions...
echo ============================================================

set NEED_REINSTALL=0

if defined NO_DEFAULT_PRINTER (
    echo [ACTION REQUIRED] Set a default printer
    echo   Settings ^> Devices ^> Printers ^& scanners
    echo.
)

if defined SERVICE_NOT_INSTALLED (
    echo [ACTION REQUIRED] Install the service first
    echo   Run: INSTALL.bat
    echo.
    set NEED_REINSTALL=0
)

if defined SERVICE_STOPPED (
    echo [ACTION REQUIRED] Start the service
    set /p START_SERVICE="Start KioskPrintService now? (Y/N): "
    if /i "%START_SERVICE%"=="Y" (
        net start KioskPrintService
        if %errorLevel% equ 0 (
            echo [OK] Service started
        ) else (
            echo [ERROR] Failed to start service
            echo Check logs: type logs\combined.log
        )
    )
    echo.
)

if defined SERVICE_RUNNING (
    set /p RESTART_SERVICE="Restart KioskPrintService to apply fixes? (Y/N): "
    if /i "%RESTART_SERVICE%"=="Y" (
        echo Restarting service...
        net stop KioskPrintService
        timeout /t 2 /nobreak >nul
        net start KioskPrintService
        
        if %errorLevel% equ 0 (
            echo [OK] Service restarted
        ) else (
            echo [ERROR] Failed to restart service
        )
    )
    echo.
)

echo ============================================================
echo   Diagnostic Complete
echo ============================================================
echo.
echo Next Steps:
echo   1. Ensure printer is powered on and set as default
echo   2. Restart the service if you made changes
echo   3. Test with: http://localhost:9100/print/health
echo   4. Send a test print from your application
echo.
echo For detailed troubleshooting, see: TROUBLESHOOTING.md
echo.

pause
