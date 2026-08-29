@echo off
setlocal

echo ============================================
echo   journi - Full Stack Installer (Windows)
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found on your PATH.
    echo.
    echo journi needs Node.js version 22.5 or newer. Download the LTS
    echo installer for Windows from:
    echo.
    echo     https://nodejs.org/
    echo.
    echo Run that installer, restart your computer if it asks you to,
    echo then double-click install.bat again.
    echo.
    pause
    exit /b 1
)

echo Found Node.js:
node -v
echo.

echo [1/4] Installing frontend dependencies...
cd /d "%~dp0journi"
call npm install
if errorlevel 1 goto :error

echo.
echo [2/4] Building the frontend for production...
call npm run build
if errorlevel 1 goto :error

echo.
echo [3/4] Installing backend dependencies...
cd /d "%~dp0server"
call npm install
if errorlevel 1 goto :error

cd /d "%~dp0"

echo.
echo [4/4] Creating a desktop shortcut...
set VBS="%TEMP%\journi_shortcut.vbs"
> %VBS% echo Set oWS = WScript.CreateObject("WScript.Shell")
>> %VBS% echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\journi.lnk"
>> %VBS% echo Set oLink = oWS.CreateShortcut(sLinkFile)
>> %VBS% echo oLink.TargetPath = "%~dp0start-journi.bat"
>> %VBS% echo oLink.WorkingDirectory = "%~dp0"
>> %VBS% echo oLink.Description = "Launch journi"
>> %VBS% echo oLink.Save
cscript /nologo %VBS% >nul 2>nul
del %VBS% >nul 2>nul

echo.
echo ============================================
echo   Install complete!
echo.
echo   Double-click "start-journi.bat" (or the new
echo   "journi" shortcut on your Desktop) to launch it.
echo ============================================
echo.
pause
exit /b 0

:error
echo.
echo Something went wrong during install - see the messages above.
echo If it mentions Python or a C++ compiler, you can ignore it: journi's
echo backend does not need one. Otherwise, re-run install.bat after fixing
echo the reported issue.
echo.
pause
exit /b 1
