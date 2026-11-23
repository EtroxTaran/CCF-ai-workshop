@echo off
setlocal
cd /d "%~dp0"
echo.
echo ============================================================
echo   virtual7 CCF KI-Workshop - Prompt-Werkstatt (Start)
echo ============================================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js gefunden - starte Workshop-Server inkl. Live-Tools...
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3777/"
    node workshop-ui\server.mjs
    goto :eof
)

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Kein Node.js gefunden - starte statischen Guide-Modus ueber Python...
    start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3777/"
    python -m http.server 3777 --directory workshop-ui\dist
    goto :eof
)

echo [FEHLER] Weder Node.js noch Python gefunden.
echo Bitte oeffne alternativ README.md und aufgaben.md oder nutze die Beamer-URL des Trainers.
pause
