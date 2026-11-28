@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
if "%PORT%"=="" set "PORT=3777"
set "STAGE_URL=http://127.0.0.1:%PORT%/#/beamer"

echo.
echo ============================================================
echo   virtual7 CCF Prompt-Werkstatt - Trainer-Buehne (#/beamer)
echo ============================================================
echo   Primaere Online-URL : https://etroxtaran.github.io/CCF-ai-workshop/#/beamer
echo   Workshop-Hub        : https://etroxtaran.github.io/CCF-ai-workshop/#/hub
echo   Lokales Backup      : %STAGE_URL%  ^(App: http://127.0.0.1:%PORT%/ · Hub: http://127.0.0.1:%PORT%/#/hub^)
echo.

if not exist "workshop-ui\dist\index.html" (
    echo [FEHLER] workshop-ui\dist\index.html fehlt.
    echo Nutze online https://etroxtaran.github.io/CCF-ai-workshop/#/beamer
    echo oder baue lokal mit: node scripts/build_modules.mjs ^&^& cd workshop-ui ^&^& npm install ^&^& npm run build
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    node -e "process.exit(parseInt(process.versions.node,10)>=18?0:1)" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Node.js 18+ gefunden - starte statischen Offline-Backup-Server fuer Trainer-Buehne ^(#/beamer^)...
        start "" cmd /c "(timeout /t 2 /nobreak >nul 2>&1 || ping -n 3 127.0.0.1 >nul) && start ^"^" ^"%STAGE_URL%^""
        node workshop-ui\server.mjs
        if errorlevel 1 pause
        goto :eof
    ) else (
        echo [WARNUNG] Gefundenes Node.js ist aelter als v18 - weiche auf Python-Backup aus...
    )
)

set "PY_CMD="
call python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "PY_CMD=python"
if defined PY_CMD goto :run_python
call py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "PY_CMD=py -3"
if defined PY_CMD goto :run_python
call python3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "PY_CMD=python3"

:run_python

if defined PY_CMD (
    echo [INFO] Kein Node.js gefunden - starte statischen Offline-Backup-Server fuer Trainer-Buehne ueber Python ^(#/beamer^)...
    start "" cmd /c "(timeout /t 2 /nobreak >nul 2>&1 || ping -n 3 127.0.0.1 >nul) && start ^"^" ^"%STAGE_URL%^""
    call %PY_CMD% -m http.server %PORT% --bind 127.0.0.1 --directory workshop-ui\dist
    if errorlevel 1 pause
    goto :eof
)

echo [FEHLER] Weder Node.js noch Python 3.7+ gefunden.
echo Nutze direkt die primaere GitHub-Pages-URL:
echo   https://etroxtaran.github.io/CCF-ai-workshop/#/beamer
echo Oder nutze alternativ presentation\CCF_HandsOn_Prompt_Werkstatt.pptx.
pause
exit /b 1
