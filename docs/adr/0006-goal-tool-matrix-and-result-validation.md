# ADR 0006: Ziel × Werkzeug-Matrix (4×4) & Deterministische Ergebnis-Validierung

- **Status:** Accepted
- **Datum:** 2026-11-26
- **Kontext:** Teilnehmende betraten den Workshop zuvor ohne klare Orientierung, welches Arbeitsergebnis für ihre Rolle/ihr Tagesgeschäft relevant ist, und ohne objektive Prüfinstanz für selbst generierte KI-Antworten. Zudem fehlte eine explizite Abdeckung von KI-unterstützten Editoren/IDEs neben Web-Chats, Desktop-Apps und Terminal-Code-Agents.

## Entscheidung

1. **Beibehaltung von `#/` als Guided Start mit sofortiger 4×4-Matrix (`GoalToolMatrixChooser`):**
   - Bestehende QR-Codes und gedruckte Links auf `#/` bleiben 100 % gültig.
   - Direkt in Schritt 01 wählen Teilnehmende sichtbar:
     - **4 Arbeitsziele (`GoalId`):** `prompting` (Besser Prompten), `app-building` (App bauen), `presentations` (Präsentation bauen), `everyday-ai` (KI im Alltag).
     - **4 Werkzeuge (`ToolMode`):** `web` (Web-Chat), `desktop` (Desktop & Ordner), `ide` (IDE & Editor: VS Code Copilot, Cursor, Windsurf), `agent` (Code-Agent).
   - Ein prominenter Einstiegspunkt führt zusätzlich in den **Workshop-Hub** (`#/hub`) mit L1/L2-Modulwahl.

2. **Deterministische Ergebnis-Validierung im Client & auf CLI/MCP (`shared/output-validator.mjs` & `shared/corpus-engine.mjs`):**
   - `verifyClaim()` prüft Sachaussagen zusätzlich auf **kontextuelle Zahlen- und deutsche Negations-Widersprüche** (`status: "widerspruch"`, `mismatch_reasons`), z. B. *„38 Zähne“* vs. belegte *„42 Zähne“* beim Eisbären, *„Squalen“* vs. belegtes *„Fehlen von Squalen“* beim Eisbären sowie `2 Stunden` vs. `4 Stunden` im L2-Kernbank-Korpus.
   - `validateParticipantOutput()` und `validateRulebook()` in `shared/output-validator.mjs` bewerten beliebige KI-Ausgaben und eigene `AGENTS.md`-Regelwerke offline, deterministisch und nachvollziehbar — ohne externes LLM und ohne Telemetrie.
   - Jedes Ergebnis lässt sich über Ziel-spezifische **Definition-of-Done-Rubriken** prüfen und lokal als `.md` oder `.json` exportieren.

3. **Ehrliche Label-Führung bei der Audio-/Kurztext-Hilfe:**
   - Solange keine modul-spezifischen `.mp3`-Dateien unter `public/audio/<modulId>/<clipId>.mp3` vorliegen, zeigt `AudioGuideChip` ehrlich den Titel **„Kurztext-Hilfe“** statt einen fehlenden Audio-Player zu simulieren (Erweiterung gemäß ADR 0003 bleibt jederzeit kompatibel).

4. **Mehrschichtige Verifikation (`L0`–`L4`):**
   - Statische Link-, Script-, Build-Sync- (`build_modules.mjs --check`) und Python-Suite (`verify_workshop.py`), Node-Unit- & Integrationstests (`node --test`), Playwright-E2E- & `axe-core`-Barrierefreiheitstests auf `/` und `/CCF-ai-workshop/` sowie CI/Pages/Offline-ZIP-Gates.

## Konsequenzen

- Neue Workshop-Module in `modules/<slug>/module.json` müssen `praxisPaths` für alle 4 `ToolMode`-Werte (inkl. `ide`) und idealerweise `contradictionClaims` bereitstellen.
- Alle automatisierten Testsuiten laufen offline ohne Internet- oder LLM-API-Zugang reproduzierbar durch.
