# Projekt-Kontext: virtual7 CCF Prompt-Werkstatt

Dieses Dokument dient als verbindlicher semantischer Rahmen („Source of Truth“) für alle Texte, Oberflächen, Präsentationen und Aufgaben in diesem Repository.

## Architektur & Rollen
1. **Workshop-App** (`https://etroxtaran.github.io/CCF-ai-workshop/`, offline `http://127.0.0.1:3777/`): Geführter Einstieg mit **Ziel × Werkzeug**-Auswahl und interaktivem Labor.
2. **Workshop-Hub** (`#/hub`): Modul-Auswahl über alle Live-Themen (`prompt-werkstatt-tierwelt` L1 und `context-engineering-projekt` L2) hinweg.
3. **Trainer-Bühne** (`https://etroxtaran.github.io/CCF-ai-workshop/#/beamer`, offline `http://127.0.0.1:3777/#/beamer`): Projektions-Ansicht im Tageslicht-Theme mit **4 Phasen**, **Live-Demo** (inkl. Mutated Q4), **QR-Beitritt**, **Moderatoren-Notizen (`P`)**, **Shortcut-Übersicht (`?`)** und **Dauer-Presets** (`30`/`45`/`60`/`90` Min.). Das detaillierte Regie-Dokument liegt in [PRESENTER_RUNBOOK.md](PRESENTER_RUNBOOK.md).

## Didaktischer Kern (Didactic Core)
- **Zwei Phasen (Standard 45 Min. Netto-Hands-on):**
  - **15 Min. Aha-Kern** (Schritte 02–03): Zero-Shot vs. strukturierte Prompt-Methoden, 5 Steuerungsebenen (Prompt, Priming, System-/Projekt-Kontext, Skills/Workflows, Tools/MCP & Guardrails), 3 Reife-Stufen (Chaos -> Guardrails -> Wissens-Vault) sowie die Anti-Halluzinations-Fangfrage.
  - **30 Min. Praxis-Pfad** (Schritt 04): **Ziel-Labor** (konkretes Arbeitsziel + Werkzeug-Setup), vertiefter Aufbau/Check der eigenen **Wissensbasis** & **Transfer-Brücke** in den CCF-Projektalltag.
- **Ergebnis-Validierung:** Deterministische Prüfung generierter KI-Antworten (`verifyClaim` inkl. `widerspruch`-Erkennung), Ziel-spezifische Definition-of-Done-Rubriken, 4-Säulen-Regelwerk-Check (`AGENTS.md`) und 1-Klick-Export (`.md`/`.json`).

## Ziel × Werkzeug (Keine Spaltung)
Die **Werkzeug-Hilfe** passt Kopiervorlagen, Hinweise und Schritt-für-Schritt-Aufgaben an **4 Arbeitsumgebungen** an — ohne getrennte Lerninhalte:
- **Web-Chat** (Browser-Chats ohne lokalen Ordnerzugriff, z. B. ChatGPT, Claude.ai, Langdock, M365 Copilot, Google Gemini)
- **Desktop & Ordner** (Claude Desktop / Cowork, ChatGPT / Claude Projects, Gemini Gems, Langdock Assistants, lokale Dateiablage / Explorer)
- **IDE & Editor** (Google Antigravity, Cursor, Windsurf, VS Code + GitHub Copilot mit Workspace-Kontext)
- **Code-Agent** (Claude Code, Codex CLI, Gemini CLI, OpenCode — Terminal & MCP)

Kombiniert mit **4 Zielen** im **Ziel-Labor**:
- `Besser Prompten` · `App bauen` · `Präsentation bauen` · `KI im Alltag`

## Daten- & Compliance-Garantie
- **L1 (`prompt-werkstatt-tierwelt`):** 68 **100 % öffentliche** Wikipedia-Artikel (Tierwelt & Ökosysteme).
- **L2 (`context-engineering-projekt`):** 10 **100 % synthetische** Projektdokumente (*Kernbank 2026*).
- Keinerlei interne, personenbezogene oder vertrauliche Kundendaten.
