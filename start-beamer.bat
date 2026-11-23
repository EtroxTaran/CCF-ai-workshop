@echo off
setlocal
cd /d "%~dp0"
echo.
echo ============================================================
echo   virtual7 CCF KI-Workshop - BEAMER REGIE (/beamer)
echo ============================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FEHLER] Fuer den Beamer-Live-Server wird Node.js ^>= 18 benoetigt.
    pause
    exit /b 1
)

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3777/beamer"
node workshop-ui\server.mjs
