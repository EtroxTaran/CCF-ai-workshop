#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "============================================================"
echo "  virtual7 CCF KI-Workshop - BEAMER REGIE (/beamer)"
echo "============================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "[FEHLER] Fuer den Beamer-Live-Server wird Node.js >= 18 benoetigt."
  exit 1
fi

(sleep 2 && (command -v xdg-open >/dev/null 2>&1 && xdg-open "http://127.0.0.1:3777/beamer" || command -v open >/dev/null 2>&1 && open "http://127.0.0.1:3777/beamer" || true)) &
exec node workshop-ui/server.mjs
