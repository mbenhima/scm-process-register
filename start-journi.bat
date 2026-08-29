@echo off
setlocal

set PORT=4000

if not exist "%~dp0journi\dist\index.html" (
    echo The frontend has not been built yet.
    echo Please run install.bat first.
    echo.
    pause
    exit /b 1
)

echo ============================================
echo   Starting journi
echo ============================================
echo.
echo   Opening http://localhost:%PORT%/ in your browser...
echo.
echo   Keep this window open while you use journi.
echo   Close this window, or press Ctrl+C, to stop it.
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%PORT%/"

cd /d "%~dp0server"
set PORT=%PORT%
node index.js

echo.
echo journi has stopped.
pause
