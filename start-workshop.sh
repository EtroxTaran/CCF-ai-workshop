#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "============================================================"
echo "  virtual7 CCF KI-Workshop - Prompt-Werkstatt (Start)"
echo "============================================================"
echo ""

open_browser() {
  local url="$1"
  (sleep 2 && (command -v xdg-open >/dev/null 2>&1 && xdg-open "$url" || command -v open >/dev/null 2>&1 && open "$url" || true)) &
}

if command -v node >/dev/null 2>&1; then
  echo "[OK] Node.js gefunden - starte Workshop-Server inkl. Live-Tools..."
  open_browser "http://127.0.0.1:3777/"
  exec node workshop-ui/server.mjs
elif command -v python3 >/dev/null 2>&1; then
  echo "[INFO] Kein Node.js gefunden - starte statischen Guide-Modus ueber Python..."
  open_browser "http://127.0.0.1:3777/"
  exec python3 -m http.server 3777 --directory workshop-ui/dist
else
  echo "[FEHLER] Weder Node.js noch python3 gefunden."
  exit 1
fi
