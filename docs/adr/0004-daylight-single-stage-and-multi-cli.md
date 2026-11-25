---
status: accepted
---

# Tageslicht-Trainer-Bühne als alleinige Projektionsfläche & Multi-CLI-Kompatibilität

Die statische Trainer-Bühne (`#/beamer`) wird im hellen Tageslicht-Farbschema (mit 1-Klick-Taste `T` für Dunkelmodus) als alleinige Projektionsfläche für 11:00–12:00 Uhr ausgelegt (Riesen-Timer, 10-Meter-Typografie `22–28 px`, schrittweiser Demo-Reveal per `Space`/`N`, eingebetteter Wissens-Graph, GitHub-Pages-QR-Code und Debrief-Abschluss); die PowerPoint-Datei wird auf 6 schlanke Backup-/Handout-Folien reduziert. Für `Code-Agent` unterstützen `stufe-2-skills-guardrails/` und `stufe-3-obsidian-vault/` neben `AGENTS.md` / `CLAUDE.md` / `.agents/skills/` direkt Unterordner-`.mcp.json`, `.claude/skills/`, `GEMINI.md` und `.vscode/mcp.json`.

## Consequences

- Kein Alt-Tab-Ping-Pong und kein Hell/Dunkel-Kontrastschock zwischen PowerPoint und Browser während der Moderation.
- Relative Vite-Base (`./`) und Hash-Routing (`#/beamer` plus `404.html`-Fallback) sorgen dafür, dass GitHub Pages (`.github/workflows/deploy-pages.yml`) und lokales Offline-Starten identisch funktionieren.
- Alle Webfonts werden lokal mitgebündelt (keine externen `fonts.googleapis.com`-Aufrufe mehr).
