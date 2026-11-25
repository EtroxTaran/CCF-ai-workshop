# Prompt-Werkstatt · virtual7 CCF Clustertag (Hands-on)

> **Vom Roh-Prompt zum verlässlichen KI-System:** Ein 45-minütiges Netto-Hands-on (im 60-Minuten-Slot 11:00–12:00 Uhr) im 2-Phasen-Aufbau (**15 Min. gemeinsamer Aha-Kern** + **30 Min. freier Praxis-Pfad**) mit einer **Wissensbasis aus 68 öffentlichen Wikipedia-Artikeln** zu Tierwelt & Ökosystemen – ohne Docker, ohne Vektordatenbank, **100 % öffentliche Daten**.

---

## Direkt starten: GitHub Pages (empfohlen) & Offline-Backup

- **Primär (Zero-Install HTTPS über GitHub Pages):**
  - **Workshop-App:** https://etroxtaran.github.io/CCF-ai-workshop/
  - **Trainer-Bühne:** https://etroxtaran.github.io/CCF-ai-workshop/#/beamer
- **Lokales Offline-Backup (falls ohne Internet oder für `Desktop & Ordner` / `Code-Agent`):**
  - **Repository klonen (Branch `main`):**
    ```bash
    git clone -b main https://github.com/EtroxTaran/CCF-ai-workshop.git
    ```
  - **Windows:** Doppelklick auf `start-workshop.bat` → `http://127.0.0.1:3777/`
  - **macOS / Linux:** `./start-workshop.sh` → `http://127.0.0.1:3777/`
  - **Über deinen KI-Agenten (`Code-Agent`):** Öffne diesen Ordner in Claude Code, Codex, Gemini CLI, OpenCode oder VS Code und sage: *„Starte die Workshop-App für mich.“*

> **Hinweis:** `workshop-ui/dist/` liegt bereits fertig gebaut vor – du brauchst **kein `npm install`**. `start-workshop.bat`/`.sh` und `start-beamer.bat`/`.sh` nutzen `workshop-ui/server.mjs` und greifen ohne Node.js automatisch auf Python `http.server` zurück.

### Was die Workshop-App (4 Schritte) bietet
- **`01 · Einstieg & Werkzeug-Hilfe`**: Umschaltbar zwischen `Web-Chat`, `Desktop & Ordner` und `Code-Agent` (inkl. kompakter Hilfe *„Kein eigenes KI-Abo? → OpenCode + OpenRouter“*), `HeroBeforeAfterAnimatic`, `ToolHotspotGuide` und 15s-Spotlight-Tour über `?`.
- **`02 · Aha-Kern 1: Prompt-Methoden`**: Vergleich Zero-Shot vs. `CO-STAR`, `Few-Shot` und `RISEN + CoT` mit kompakten Kopierpaketen (~5.500 Zeichen, Prompt immer oben, `(datei.md)`-Quellenmarker, `.md`-Download), Side-by-Side-Ergebnisvorschau, `WebChatWorkflowPlayer` sowie den 5 Steuerungsebenen inkl. `ContextWindowAnimatic`.
- **`03 · Aha-Kern 2: 3 Stufen & Wissen`**: Experiment über `Stufe 1 → 2 → 3` mit je 2 Fokus-Fragen (+ Toggle *„Alle 4 Fragen anzeigen“*), Fangfrage (`Schneeleopard`), Q4-`38 Zähne`-Schalter, `GuardrailShieldAnimatic`, `Stage3AgentWalkPlayer`, interaktivem Obsidian-Wissensgraph auf Stufe 3, aktiver Selbst-Reflexion und Checklisten-Drawer.
- **`04 · Praxis-Pfade & Transfer`**: 3 zielorientierte Praxis-Pfade inkl. eingebautem **68-Artikel-Faktenprüfer & Such-Lab**, `McpPacketAnimatic` sowie der abschließenden **4-Rollen CCF-Transfer-Brücke**.

---

## Aufbau: 2 Phasen (45 Min. Hands-on) & Werkzeug-Hilfe

Alle Teilnehmenden durchlaufen zunächst gemeinsam denselben **Aha-Kern** und wählen danach nach inhaltlichem Ziel ihren **Praxis-Pfad** – ohne Entwickler-vs.-Anfänger-Schubladen:

1. **15 Min. gemeinsamer Aha-Kern (Schritte 02 & 03):** Prompt-Methoden vergleichen und an den 3 Stufen (inkl. Fangfrage) erleben, warum Leitplanken und verknüpftes Wissen Halluzinationen verhindern.
2. **30 Min. freier Praxis-Pfad & Transfer-Brücke (Schritt 04):**
   - **Pfad 1 · Recherche & Fakten-System:** Querverbindungs-Synthese, Fakten-Audit gegen den Eisbär-Mythos, 68-Artikel-In-Browser-Faktenprüfer & Such-Lab sowie optional lokaler MCP-Server (`Code-Agent`).
   - **Pfad 2 · Präsentation, Animatic & Übersichtsseite:** Fertige Rezepte für interaktive HTML-Übersichtsseiten / Animatics in **Claude Artifacts** oder **ChatGPT Canvas** sowie ein 5-Folien-Management-Briefing mit Lückenblock.
   - **Pfad 3 · Kleine interaktive App bauen:** Fertige Rezepte für ein Tierwelt-Fakten-Quiz oder Ökosystem-Vergleichs-Dashboard mit strikter Quellen-Bindung (`[Nicht in Quelle]`).
   - **4-Rollen CCF-Transfer-Brücke:** Musterübertragung für *Kunden & Projekte*, *Fachkonzept & Daten*, *Betrieb & Datenbanken* und *Entwicklung & Architektur* (ohne vertrauliche Daten).

Über die umschaltbare **Werkzeug-Hilfe** passt sich die Workshop-App jederzeit an eure Arbeitsweise an:
- **`Web-Chat`** (Claude.ai, ChatGPT, Copilot): ~5.500-Zeichen-Kompakt-Pakete mit Prompt oben, `.md`-Upload sowie Artifacts/Canvas.
- **`Desktop & Ordner`** (Claude Cowork, ChatGPT Projects): Ausgecheckten Workshop-Ordner direkt öffnen.
- **`Code-Agent`** (Claude Code, Codex, Gemini CLI, OpenCode, VS Code): Nacheinander `stufe-1-chaos/`, `stufe-2-skills-guardrails/` und `stufe-3-obsidian-vault/` im Terminal/IDE öffnen und optional den lokalen MCP-Server nutzen.

---

## Die 3 Projekt-Stufen & Repository-Struktur

| Stufe | Ordner | Was steckt drin? | Was erleben wir? |
|---|---|---|---|
| **Stufe 1** | `stufe-1-chaos/` | Minimaler Prompt (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`) + 68 flache `.md`-Dateien in `docs/` | **Ungefilterter Chat:** Halluzinationen, fehlende Quellen, vage Antworten |
| **Stufe 2** | `stufe-2-skills-guardrails/` | Klare Guardrails + 2 Skills (`quellen-recherche`, `fakten-pruefer`) + `docs/` + Multi-CLI (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.agents/skills/`, `.claude/skills/`, `.mcp.json`) | **Leitplanken & Skills:** Quellenpflicht, ehrliches „nicht enthalten“, Q4-Kontext-Test (`38 Zähne`) |
| **Stufe 3** | `stufe-3-obsidian-vault/` | `_index.md` (**zentrales Inhaltsverzeichnis**) + `wiki/` (YAML-Frontmatter + `[[Wikilinks]]`) + `raw/` (nur lesend) + Vault-Skills (`vault-suche`, `wissen-synthese`) + Multi-CLI & `.mcp.json` | **Markdown-RAG:** Strukturierte Navigation über Inhaltsverzeichnis, Verknüpfungen & Wissens-Graph |

Zusätzlich im Repository:
- **`shared/corpus-engine.mjs`**: Gemeinsame Such-, Normalisierungs- und Verifikations-Engine (mit verschärftem Rauschfilter), genutzt vom MCP-Server und gespiegelt im In-Browser-Faktenprüfer über alle 68 Artikel.
- **`mcp-server/`**: Abhängigkeitsfreier lokaler Node-MCP-Server (`search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article` sowie MCP-Resources `_index.md` und `wiki/`), vorkonfiguriert in `.mcp.json`, `stufe-2-skills-guardrails/.mcp.json`, `stufe-3-obsidian-vault/.mcp.json` und `.vscode/mcp.json` (plus `mcp-server/setup-client.mjs` für optionale absolute Pfade).
- **`presentation/`**: Schlanker **6-Folien-Backup-Foliensatz** (`CCF_HandsOn_Prompt_Werkstatt.pptx`, Typografie `>= 22 pt`), erzeugbar über `scripts/build_presentation.py` (`--master` / `PPTX_MASTER_PATH` oder eingebautem virtual7-Daylight-Fallback).
- **`.github/workflows/deploy-pages.yml`**: Automatisches statisches GitHub-Pages-Deployment von `workshop-ui/dist/` auf Push nach `main`.
- **`CONTEXT.md` & `docs/adr/`**: Verbindliches Glossar (`0001`–`0004` Architekturentscheidungen).
- **`aufgaben.md` & `LOESUNGEN_TRAINER.md`**: Teilnehmer-Aufgabenblatt und verifizierte Musterlösungen inkl. Regie-Leitfaden für die Trainer-Bühne.

---

## Für Trainer / Moderator (Trainer-Bühne)

1. **Primär online:** Öffne auf dem Projektor **`https://etroxtaran.github.io/CCF-ai-workshop/#/beamer`**.
2. **Offline-Backup:** Starte `start-beamer.bat` (Windows) oder `./start-beamer.sh` (macOS/Linux) → öffnet automatisch **`http://127.0.0.1:3777/#/beamer`**.
3. **Daylight-Single-Surface-Bühne:** Heller Tageslicht-Standard (`#FAFAF8` / `#0B0F0A` / `#A9C23F`) ohne schmale Seitenleiste mit 4 Modi:
   - `1` **Stage:** Riesen-Countdown (stoppt automatisch bei `00:00`), zentrale Bühnen-Visualisierung, 10m-Lesbarkeit.
   - `2` **Demo:** Schrittweiser Keynote-Reveal (`Space`/`N`) für Prompt-Methoden, 5 Steuerungsebenen, `Stufe 1 → 2 → 3` (inkl. Fangfrage & Q4 `38 Zähne`), eingebetteter `ObsidianKnowledgeGraph` und `McpPacketAnimatic`.
   - `3` **QR Join:** Kontrastreicher QR-Code auf `https://etroxtaran.github.io/CCF-ai-workshop/` + `git clone`-Zeile.
   - `4` **Outro:** 3 moderierte Handzeichen-Impulse + 3 Kernaussagen + Ausblick auf „13:00 Uhr Unit-Programm & World Café“.
4. **Tastaturkürzel auf `#/beamer`:** `1–4` (Modi), `T` (Tageslicht/Dunkel umschalten), `M` (Bühnen-Gong stumm/an — per Default stumm, Signal bei `01:00` und `00:00`; null Audio auf Teilnehmer-Laptops), `S` (Verifizierte Lösung im Modus `Stage` öffnen/schließen), `Space`/`N` (`Stage`: Timer Start/Pause per `Space`, `Demo`: schrittweiser Reveal per `Space`/`N`), `←/→` (Etappen wechseln).
5. **Backup-Präsentation:** `presentation/CCF_HandsOn_Prompt_Werkstatt.pptx` (6 Backup-Folien mit Sprechernotizen).

---

## Reproduzierbare Wissensbasis & Compliance

Alle 68 Artikel der **Wissensbasis** stammen aus der deutschsprachigen Wikipedia (Tierwelt & Ökosysteme: 5 Lebensräume, 48 Tierarten, 15 ökologische Konzepte) und wurden mit `scripts/fetch_corpus.py`, `scripts/build_vault.py` und `scripts/export_ui_data.py` erzeugt:

```bash
python scripts/fetch_corpus.py
python scripts/build_vault.py
python scripts/export_ui_data.py
python scripts/verify_workshop.py
```

**Hinweis zur Compliance (`100 % öffentliche Daten`):** Alle Inhalte dieses Repositories sind ausschließlich öffentliche Wikipedia-Artikel. Es sind keinerlei interne, personenbezogene oder vertrauliche Kundendaten enthalten.
