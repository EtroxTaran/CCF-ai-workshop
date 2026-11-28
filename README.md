# virtual7 CCF Prompt-Werkstatt — Modularer KI-Workshop-Hub

**Woran arbeiten wir hier?** In 30 Sekunden vom Einstieg zur verlässlichen KI-Nutzung: Jede teilnehmende Person wählt **eigenes Ziel** *(Besser Prompten · App bauen · Präsentation · KI im Alltag)* **und eigenes Werkzeug** *(Web-Chat · Desktop & Ordner · IDE & Editor · Code-Agent)* — und prüft das Ergebnis objektiv anhand von **Definition-of-Done-Kriterien** und **Ergebnis-Validierung**.

- **Workshop-App (Guided Start):** https://etroxtaran.github.io/CCF-ai-workshop/
- **Workshop-Hub (Alle Themen-Module):** https://etroxtaran.github.io/CCF-ai-workshop/#/hub
- **Trainer-Bühne (Tageslicht-Stage):** https://etroxtaran.github.io/CCF-ai-workshop/#/beamer

> [!TIP]
> **Kein Setup nötig — läuft auf jedem Windows-PC mit Browser + KI (Zero-Install):**
> - **Repository nicht auschecken nötig:** Du brauchst **kein Node.js, kein Python, kein Git und keine Admin-Rechte**. Öffne einfach https://etroxtaran.github.io/CCF-ai-workshop/ im Browser neben deinem KI-Tool (Langdock, ChatGPT, Claude.ai, M365 Copilot oder Gemini) — oder nutze ohne KI-Abo den eingebauten Faktenprüfer & Ergebnis-Validator direkt im Browser.
> - **Desktop & Ordner / IDE ohne Git:** Lade die Übungs-Dateien per 1-Klick-Download als **`.md`** oder **`.zip`** direkt in der Workshop-App herunter (Windows: Rechtsklick → *Alle extrahieren…*) und öffne den gewünschten Ordner.
> - **Node.js 18+ wird NUR benötigt**, falls du optional den lokalen `stdio`-MCP-Server (`mcp-server/server.mjs`) in einer CLI/IDE starten oder das Offline-Backup (`start-workshop.bat` / `start-beamer.bat`, alternativ mit Python 3.7+ Fallback) lokal hosten möchtest.

---

## 10-Sekunden-Einstieg nach Rolle

| Rolle | Direktlink / Einstieg | Wofür gedacht? |
|---|---|---|
| **Teilnehmende (Live-Workshop)** | [Workshop-App starten](https://etroxtaran.github.io/CCF-ai-workshop/) | Ziel × Werkzeug wählen, Aha-Kern durchlaufen, Praxis-Ergebnis validieren & als `.md`/`.json` mitnehmen |
| **Trainer / Moderation** | [Trainer-Bühne (`#/beamer`)](https://etroxtaran.github.io/CCF-ai-workshop/#/beamer) · [PRESENTER_RUNBOOK.md](PRESENTER_RUNBOOK.md) | 45-Minuten-Regie (30/45/60/90 Min. skalierbar), Live-Demo-Reveal, QR-Join, Speaker Notes (`P`), Lösungen |
| **Selbstlernende / Gruppen** | [aufgaben.md](aufgaben.md) · [Workshop-Hub (`#/hub`)](https://etroxtaran.github.io/CCF-ai-workshop/#/hub) | Eigenständiger Durchlauf mit L1 (*Tierwelt*, 100 % öffentlich) oder L2 (*Kernbank 2026*, 100 % synthetisch) |
| **Modul-Autor:innen & Devs** | [CONTRIBUTING_MODULE.md](CONTRIBUTING_MODULE.md) · [TOPICS_BACKLOG.md](TOPICS_BACKLOG.md) | Neues Modul anlegen, `build_modules.mjs` ausführen und gesamte Testpyramide lokal prüfen |

---

## 4 Ziele × 4 Werkzeuge im Überblick

| | Web-Chat (ChatGPT, Claude.ai, Langdock, M365 Copilot, Gemini) | Desktop & Ordner (Claude Desktop / Cowork, Projects, Gems, Langdock Assistants) | IDE & Editor (Google Antigravity, Cursor, Windsurf, VS Code Copilot) | Code-Agent (Claude Code, Codex CLI, Gemini CLI, OpenCode) |
|---|---|---|---|---|
| **Besser Prompten** | Copy-Paste-Methodenpakete (`<= 7.500` Zeichen) + Gegenprobe | Vergleich mit `stufe-1-chaos/` vs. `stufe-2-skills-guardrails/` bzw. Assistant/Project-Regeln | Editor-Chat mit `@`/Workspace-Dateien & Guardrails | CLI-Prompt + Regeldatei `AGENTS.md` / `CLAUDE.md` |
| **App bauen** | Strukturierte UI-/Architektur-Prompts ohne Halluzination | Spezifikation + Abnahmekriterien im Projektordner | Komponente + Tests direkt im Editor mit Repo-Regeln | End-to-End-Build, Lint & Tests über Terminal-Agent |
| **Präsentation bauen** | Storyline, Folien-Skript & Einwände mit Quellenbeleg | Folien-Briefing gegen lokale Faktenbasis prüfen | Marp-/Slidev-/Deck-Markdown + Review im Editor | Generator-Skripte & Layout-Checks automatisch prüfen |
| **KI im Alltag** | Wiederverwendbare Prompt-Schablonen für Mails & Protokolle | Lokales Projektpaket oder Knowledge Folder + persönliche Regeln | Workspace-Snippets & Review-Checkliste im Editor | Wiederkehrende Workflows + MCP-Wissensabruf |

In jedem Werkzeug steht in der App die **Kurztext-Hilfe** bereit (optional erweiterbar durch modulbezogene Audiodateien unter `public/audio/<modulId>/<clipId>.mp3`). Hinweise zur sauberen Trennung der Übungsstufen über alle IDEs, CLIs und Cloud-Hubs findest du im [Isolations-Leitfaden (`docs/ISOLATION_GUIDE.md`)](docs/ISOLATION_GUIDE.md).

---

## Live-Module im Hub (`#/hub`)

| Modul-ID | Level | Datenbasis | Fokus |
|---|---|---|---|
| `prompt-werkstatt-tierwelt` | `L1` | 68 **100 % öffentliche** Wikipedia-Artikel (Tierwelt & Ökosysteme) | Einstieg ohne Vorkenntnisse: Zero-Shot → CO-STAR, Few-Shot & RISEN, 3 Stufen, Fangfragen, Obsidian-Vault |
| `context-engineering-projekt` | `L2` | 10 **100 % synthetische** Projektdokumente (*Kernbank 2026*, null Echtdaten) | Projektalltag für PL, BA, Betrieb & Dev: SLAs, Runbooks, ADRs, Widerspruchserkennung & Regelwerk |

*(Weitere Themenideen pflegen wir in [TOPICS_BACKLOG.md](TOPICS_BACKLOG.md).)*

---

## Ergebnis-Validierung & Take-away

Jeder Durchlauf endet nicht mit „fertig geklickt“, sondern mit nachprüfbarer Qualität:
1. **Ergebnis-Validator:** KI-Antwort einfügen und automatisch auf Quellen-Zitate, fehlende Belege (`nicht belegt`) und Widersprüche (z. B. `2 Stunden` vs. `4 Stunden` oder `Squalen`) gegen den echten Korpus prüfen.
2. **Definition of Done (Ziel-Rubrik):** Konkrete Checkliste passend zum gewählten Ziel abhaken.
3. **4-Säulen-Regelwerk:** Eigenes `AGENTS.md` / Projekt-Regelwerk mit Live-Qualitätsscore prüfen (`Rolle & Scope`, `Quellen & Belege`, `Nicht-Wissen`, `Format`).
4. **1-Klick-Export:** Fertiges Paket als Markdown (`.md`) oder JSON (`.json`) lokal herunterladen — zero Tracking, 100 % im Browser.

---

## Lokaler Start (Offline-Backup)

> **Hinweis:** Dieser Abschnitt ist **nur** als Offline-Notfallbackup (z. B. für den Trainer-Laptop, falls das Raum-WLAN GitHub Pages blockiert) oder für lokale Builds/MCP-Entwicklung gedacht — Teilnehmende nutzen einfach direkt die GitHub-Pages-URL oben ohne Installation.

Das Git-Repository verwendet den Branch **`main`**. Alle statischen Assets für den Workshop sind vorkompiliert:

```bash
# Windows (Workshop-App bzw. Trainer-Bühne)
start-workshop.bat
start-beamer.bat

# macOS / Linux
./start-workshop.sh
./start-beamer.sh
```

Direkt über Node.js (Port `3777`):

```bash
node workshop-ui/server.mjs
# Workshop-App  : http://127.0.0.1:3777/
# Workshop-Hub  : http://127.0.0.1:3777/#/hub
# Trainer-Bühne : http://127.0.0.1:3777/#/beamer
```

---

## Ordnerstruktur im Repository

- `workshop-ui/` — React/Vite Workshop-App, Hub (`#/hub`), Trainer-Bühne (`#/beamer`) & statischer Backup-Server
- `modules/` — Deklarative Modul-Pakete (`prompt-werkstatt-tierwelt/`, `context-engineering-projekt/`)
- `shared/` — Abhängigkeitsfreie Korpus- & Ergebnis-Validierungs-Engines (`corpus-engine.mjs`, `output-validator.mjs`)
- `mcp-server/` — Abhängigkeitsfreier stdio-MCP-Server (`--module <slug>`) & Multi-CLI-Setup-Helfer (`setup-client.mjs`)
- `stufe-1-chaos/`, `stufe-2-skills-guardrails/`, `stufe-3-obsidian-vault/` — Drei aufeinander aufbauende L1-Übungsumgebungen
- `presentation/` — PowerPoint-Offline-Backup (`CCF_HandsOn_Prompt_Werkstatt.pptx`)
- `scripts/`, `tests/` — Export-, Build-, Link-, Python-, Unit-, Integration- & Playwright-E2E-Verifikation
- `docs/ISOLATION_GUIDE.md` — 8-Tool-Isolations-Matrix, 1-Zeilen-Rezept für Stufe 1 & Cloud-SaaS vs. lokales `stdio`-MCP
- `docs/adr/` — Architecture Decision Records (`0001` bis `0006`)

---

## Build & Verifikation

```bash
# 1. Legacy-Daten exportieren, Module bauen & UI kompilieren
python scripts/export_ui_data.py
node scripts/build_modules.mjs
cd workshop-ui && npx tsc -b --noEmit && npm run build && cd ..

# 2. Modul-Verträge, Links, Launcher & Gesamtrepository prüfen
node scripts/build_modules.mjs --check
node scripts/validate_modules.mjs
node scripts/check_links_and_scripts.mjs
python scripts/verify_workshop.py

# 3. Unit- & Integration-Tests (node:test)
node --test tests/unit/*.test.mjs tests/integration/*.test.mjs

# 4. E2E- & Barrierefreiheitstests (Playwright + axe-core)
cd workshop-ui && npm run test:e2e && cd ..
```

---

## Lizenz & Datenschutz-Hinweis

Dieses Repository enthält **ausschließlich 100 % öffentliche Daten** (öffentliche Wikipedia-Artikel in L1) sowie **100 % fiktive/synthetische Beispieldaten** (*Kernbank 2026* in L2). Es enthält **keinerlei interne, personenbezogene oder vertrauliche Daten**.
