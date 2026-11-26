#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-3777}"
APP_URL="http://127.0.0.1:${PORT}/"

echo ""
echo "============================================================"
echo "  virtual7 CCF Prompt-Werkstatt - Offline-Backup (#/)"
echo "============================================================"
echo "  Primäre Online-URL : https://etroxtaran.github.io/CCF-ai-workshop/"
echo "  Lokales Backup     : ${APP_URL}"
echo ""

if [ ! -f "workshop-ui/dist/index.html" ]; then
  echo "[FEHLER] workshop-ui/dist/index.html fehlt."
  echo "Nutze online https://etroxtaran.github.io/CCF-ai-workshop/"
  echo "oder baue lokal mit: cd workshop-ui && npm install && npm run build"
  exit 1
fi

open_browser() {
  local url="$1"
  (
    sleep 2
    if command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$url" >/dev/null 2>&1 || true
    elif command -v open >/dev/null 2>&1; then
      open "$url" >/dev/null 2>&1 || true
    elif command -v wslview >/dev/null 2>&1; then
      wslview "$url" >/dev/null 2>&1 || true
    fi
  ) &
}

if command -v node >/dev/null 2>&1 && node -e "process.exit(parseInt(process.versions.node,10)>=18?0:1)" >/dev/null 2>&1; then
  echo "[OK] Node.js 18+ gefunden - starte statischen Offline-Backup-Server für Workshop-App (#/)..."
  open_browser "$APP_URL"
  PORT="$PORT" exec node workshop-ui/server.mjs
elif command -v node >/dev/null 2>&1; then
  echo "[WARNUNG] Gefundenes Node.js ist älter als v18 - weiche auf Python-Backup aus..."
fi

PY_CMD=""
if command -v python3 >/dev/null 2>&1 && python3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 7) else 1)" >/dev/null 2>&1; then
  PY_CMD="python3"
elif command -v python >/dev/null 2>&1 && python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 7) else 1)" >/dev/null 2>&1; then
  PY_CMD="python"
fi

if [ -n "$PY_CMD" ]; then
  echo "[INFO] Kein Node.js gefunden - starte statischen Offline-Backup-Server über Python (#/)..."
  open_browser "$APP_URL"
  exec "$PY_CMD" -m http.server "$PORT" --bind 127.0.0.1 --directory workshop-ui/dist
fi

echo "[FEHLER] Weder Node.js noch Python 3.7+ gefunden."
echo "Nutze direkt die primäre GitHub-Pages-URL:"
echo "  https://etroxtaran.github.io/CCF-ai-workshop/"
echo "Oder öffne alternativ README.md und aufgaben.md."
exit 1
