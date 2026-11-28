# Milestone M4 Blind Review: L2 (`context-engineering-projekt`) Initial Entry, Global Chrome, Modals & Steps 01–03 (Local vs. Live)

## 1. Executive Summary

**Readiness Verdict: Not ready for unguided, unprepared L2 (*Kernbank 2026*) participants without fixing shared L1 *Tierwelt* copy leakage, broken Step 01/03 instructions, and an outdated GitHub Pages deployment.**

From fresh, unauthenticated browser sessions on both Local (`http://127.0.0.1:3777/`) and Live (`https://etroxtaran.github.io/CCF-ai-workshop/`), the L2 module *Context Engineering · Projekt & Betrieb* is **technically stable and payload-clean**: all tested routes load with **0 console errors, 0 uncaught page errors, and 0 HTTP `>= 400` responses**; responsive layouts at `390×844` have **0 horizontal overflow**; and every inspected clipboard pack and `.md` download (`fokus-dokumente-10.md`, `alle-10-dokumente-wissensbasis.md`, `methoden-kompakt-texte.md`, `fokus-korpus-10-artikel.md`, `betrieb-sla-runbook.md`, `planung-risiken-migration.md`) contains **100 % authentic *Kernbank 2026* content with zero L1 *Tierwelt* leakage inside the payloads**.

However, an unprepared participant reading the rendered German UI encounters four critical blockers/high-severity obstacles:
1. **Stale Live Deployment & Pervasive L1 *Tierwelt* Leakage (Blocker on Live; High on Local):** GitHub Pages (`Live`) serves an older 3-tool build (`To-do 0/7`, no Goals, no `Übersetzungsmatrix`, no `Tool-Matrix`, no Langdock) that leaks L1 *Tierwelt* strings across Steps 01–03 and `Hilfe` (`arktis.md … korallenriff.md`, `korallenbleiche.md`, `„18 € Eintritt für Schneeleoparden“`, `„Erzähl mir was über Eisbären“`, `Frage + 38-Zähne-Text`, `(Arktis + Riff)`, `Wissensbasis (68 Artikel)`, `10 öffentliche Artikel`, `stufe-1-chaos/`, `stufe-2-skills-guardrails/`, wrong npm package `@opencode/cli`), and sends Stage 3 `Desktop & Ordner` / `Code-Agent` users into `corpus/` (which lacks `AGENTS.md` and `_index.md`). Even on the newer **Local** build, L1 leakage persists in Step 01 (`auf allen 68 Artikeln`, `68-Artikel-Faktenprüfer`, `Wikipedia-Artikel`, `Q3 (Schneeleopard) + Q4 (38 Zähne)`, `stufe-1-chaos → stufe-2 → stufe-3`), Step 02 (`Steinkorallen`, `search_wildlife_vault`, `erfundene Eintrittspreise`), Step 03 (`10 Fokus-Artikel`, `Artikel-Pakete`, `10-Artikel-Wissens-Graph`, `alle 68 Bände`), and `Hilfe -> Tool-Matrix` (`stufe-2/`, `cd stufe-3-obsidian-vault`).
2. **Broken Instruction-to-UI Parity & Raw Markdown in Step 03 (High, Local & Live):** Stage 1–3 instruction boxes render literal `**...**` asterisks (`Öffne einen **neuen Chat**`, `**Isolations-Hinweis:**`) and direct participants to click `**Kompakt-Paket kopieren**` — a button label that does not exist in Step 03 (actual labels: `Kompakt-Texte kopieren`, `Regeln + Texte kopieren`, `Regeln + Kompakt-Index + Texte`).
3. **Duplicate L2 Folder Paths & Contradictory Duration Math (High/Medium):** Local Step 01 and `Hilfe -> Schnellstart & .md` repeat `modules/context-engineering-projekt/` identically as two alternatives (`modules/context-engineering-projekt/ oder modules/context-engineering-projekt/`), while `Ablaufplan` displays broken sums (`23 + 23 = 46 Min.` under `45 Min.`, `16 + 15 = 31` under `30 Min.`, `46 + 45 = 91` under `90 Min.`) and Live leaves all phase durations hardcoded at `5+10+15+30 = 60 Min.` across every preset.
4. **Touch/Click Accessibility & Destructive Reset UX (Medium, Local & Live):** Step 01/02/03 inline glossary chips (`Prompt?`, `.md-Datei?`, `Git vs. ZIP?`, `CO-STAR?`, etc.) and `Methode erklärt` only open on hover (`click` yields no DOM change), blocking tap/mobile users; and `"Fortschritt zurücksetzen"` wipes all `localStorage` immediately without confirmation.

---

## 2. Scenario & Environment Metadata

| Attribute | Local Environment | Live Environment |
|---|---|---|
| **Base & Entry Route (Step 01)** | `http://127.0.0.1:3777/#/m/context-engineering-projekt` | `https://etroxtaran.github.io/CCF-ai-workshop/#/m/context-engineering-projekt` |
| **Step 02 Route** | `http://127.0.0.1:3777/#/m/context-engineering-projekt/methods` | `https://etroxtaran.github.io/CCF-ai-workshop/#/m/context-engineering-projekt/methods` |
| **Step 03 Route** | `http://127.0.0.1:3777/#/m/context-engineering-projekt/stages` | `https://etroxtaran.github.io/CCF-ai-workshop/#/m/context-engineering-projekt/stages` |
| **Browser Isolation** | Fresh Playwright `chromium-1255` `browser.newContext()` per run (`acceptDownloads: true`, `clipboard-read` / `clipboard-write` granted) | Fresh Playwright `chromium-1255` `browser.newContext()` per run (`acceptDownloads: true`, `clipboard-read` / `clipboard-write` granted) |
| **Viewports Tested** | Desktop `1440×900` & Mobile `390×844` | Desktop `1440×900` & Mobile `390×844` |
| **Console / Page / Network Errors** | `0` console errors, `0` uncaught `pageerror`s, `0` failed requests, `0` HTTP `>= 400` responses | `0` console errors, `0` uncaught `pageerror`s, `0` failed requests, `0` HTTP `>= 400` responses |
| **Initial `localStorage` (`v7-workshop:context-engineering-projekt:state-v1`)** | `{"toolMode":"web","goalId":"prompting","durationPreset":45,"setupConfirmed":false,"methodsExplored":false,"debugSolved":false,"outputValidations":{},"rubricChecked":{},"rulebookPassed":false,"gates":{"gate-setup":false,"gate-methods":false,"gate-debug":false,"gate-validator":false,"gate-rubric":false,"gate-rulebook":false},"checked":{},"reflections":{},"showAllQuestions":false}` | `{"toolMode":"web","checked":{},"reflections":{},"showAllQuestions":false}` |
| **Initial `sessionStorage` (`v7-workshop:context-engineering-projekt:session-v1`)** | `{"step":"start","activeStageIdx":0}` (on entry) | `{"step":"start","activeStageIdx":0}` (on entry) |
| **Post-Tour `localStorage` Key** | `v7-ccf-tour-seen-v1` = `"1"` | `v7-ccf-tour-seen-v1` = `"1"` |
| **Deep-Link Tour Behavior** | Opening `#/m/context-engineering-projekt` launches `Kurze Orientierungstour`; deep-linking directly to `.../methods` or `.../stages` does not block with the tour modal (`initialDialog: null`). | Same (`initialDialog: null` on direct `.../methods` or `.../stages` deep links). |

---

## 3. 5-Point Rubric Assessment

### 3.1 Initial Entry, Onboarding Tour, Global Chrome, Modals & Mobile (`390×844`)

- **(a) Initial Orientation:**
  - **Local:** First-time entry at `#/m/context-engineering-projekt` immediately presents the 4-step spotlight modal `Kurze Orientierungstour` (`Orientierung · 1 / 4` to `4 / 4`), a clear module header (`Context Engineering · Projekt & Betrieb`), badge `L2 · 45 Min. · 100 % synthetische Projektdaten`, and the 4-step sidebar (`23 MIN. GEMEINSAMER AHA-KERN` for Steps `01`–`03`, `23 MIN. ZIEL-LABOR` for Step `04`, plus active summary `Web-Chat`, `Besseres Prompting`, `10 Projekt-Dokumente`). However, the top-right Beamer link is icon-only (`text: ""`, `36×36px`, `aria-label="Zur Trainer-Bühne wechseln"`), giving sighted participants no visible label before hovering.
  - **Live:** Immediately creates an orientation contradiction: the header subtitle refers to `10 synthetischen Dokumenten (Kernbank 2026)`, yet the badge states `L2 · 30 Min. · 100 % öffentliche Daten` and the sidebar states `10 öffentliche Artikel` alongside `15 MIN. GEMEINSAMER AHA-KERN` + `30 MIN. FREIER PRAXIS-PFAD`.

- **(b) Step-by-Step Clarity:**
  - The 4-step onboarding tour navigates smoothly forward (`Weiter`), backward (`Zurück`), skip (`Überspringen`), and complete (`Verstanden`), and reopens via `Hilfe` -> `Tour starten`.
  - **Local `Nachweise 0/6` Modal Friction:** Displays `"Echte Qualitäts-Nachweise statt bloßer Klicks — Ziel: Besseres Prompting."` with 6 items (`1. Ziel & Werkzeug gewählt` .. `6. Eigene Hausregel validiert`). All 6 status checkboxes are `disabled: true` without any `"Automatisch geprüft"` badge explaining why clicking them does nothing; only `"Öffnen →"` is interactive.
  - **Local `Hilfe -> Schnellstart & .md` Path Duplication & Button Ambiguity:** Instructs `"In Claude Cowork / VS Code / Cursor einen Ordner öffnen: modules/context-engineering-projekt/corpus, modules/context-engineering-projekt, modules/context-engineering-projekt."` — repeating the exact same path twice makes it look as if two different folders were meant. Furthermore, showing two buttons `"10 Fokus-Dokumente (.md)"` (`8,682` bytes) and `"Alle 10 Dokumente (.md)"` (`9,629` bytes) inside a 10-document module creates unnecessary confusion about which file to download.
  - **`Hilfe -> FAQ` Label Drift (Local & Live):** FAQ #6 tells participants `"Klicke im Tab „Schnellstart & .md“ auf „Alle Ordner als ZIP laden“"`, whereas the actual button reads `"Alle Workshop-Ordner als ZIP laden"`.
  - **Mobile (`390×844`) Context Loss:** Neither Local nor Live provides a mobile sidebar drawer. Because `<aside>` is hidden (`0×0`) and header pills collapse to short labels/icons (`Web | Ordner | IDE | CLI | Hub-icon | ?-icon | 0/6 | Beamer-icon` on Local), mobile participants lose visibility of the module title and their active Goal (`Besseres Prompting`) once scrolled past the hero.

- **(c) Human-Readability & Wording:**
  - **Destructive Instant Reset (Local & Live):** Clicking `"Fortschritt zurücksetzen"` in `Nachweise 0/6` or `To-do 0/7` wipes all `localStorage` progress immediately with zero confirmation dialog (`confirmDialogMessage: null`).
  - **Local `Hilfe -> Glossar (21)` & `Tool-Matrix` Leakage:** `Glossar` mixes L1 and L2 (`"z. B. 68 öffentliche Tierwelt-Artikel oder 10 synthetische Projektdokumente"`, `"statt alle 68 Bände gleichzeitig auf den Tisch zu kippen"`, `"Stufen-Ordner"`), while `Tool-Matrix` hardcodes L1 folder names (`"Entpackter Stufen-Ordner (z. B. stufe-2/ oder stufe-3/)"`, `"cd stufe-3-obsidian-vault"`, `"Scope-Override pro Stufen-Workspace"`).
  - **Live `Hilfe -> Glossar (19)` & `FAQ (7)` Leakage:** Unadapted L1 *Tierwelt* copy throughout (`"Erzähl mir was über Eisbären"`, `"18 € Eintritt für Schneeleoparden"`, `"[[anemonenfische]]"`, `"[[seeanemonen]]"`, `"Wissensbasis (68 Artikel)"`, `"68-Artikel-Faktenprüfer"`, `"alle-68-artikel-wissensbasis.md"`, `"stufe-1-chaos, stufe-2-skills-guardrails oder stufe-3-obsidian-vault"`).

- **(d) Interactive Elements, Prompts & Embedded Checks:**
  - Tour buttons (`Weiter`, `Zurück`, `Überspringen`, `Verstanden`, `Hilfe -> Tour starten`) all work cleanly and persist `v7-ccf-tour-seen-v1: "1"`.
  - `Hilfe` tabs (`Schnellstart & .md`, `Glossar`, `FAQ`, plus `Tool-Matrix` on Local) switch cleanly; FAQ accordions expand cleanly; Local `Tool-Matrix` filter switches between `"Passend zu meinem Modus (Web-Chat)"` (`5 von 17 Einträgen · 13 Ziel-Tools`) and `"Alle 13 Tools"` (`17 von 17 Einträgen`).
  - Both `Hilfe` `.md` downloads (`fokus-dokumente-10.md` = `8,682` B; `alle-10-dokumente-wissensbasis.md` = `9,629` B) contain valid UTF-8 *Kernbank 2026* Markdown (`hasTierwelt: false`, `hasKernbank: true`).
  - `"Alle Workshop-Ordner als ZIP laden"` (`https://github.com/EtroxTaran/CCF-ai-workshop/archive/refs/heads/main.zip`) returns HTTP `200` (`application/zip`, `CCF-ai-workshop-main.zip`).
  - Checklist `"Öffnen →"` jump links close the modal and route directly (e.g., Local item 3 -> `step: "stages"`; Live item 3 -> `step: "methods"`).
  - Mobile (`390×844`) fits cleanly (`docScrollWidth: 390`, `overflowX: false`), header `56px` fits on one row, decorative hero SVG is clipped cleanly by `overflow-x: hidden`, `Hilfe` opens full-bleed (`389px`), and the fixed bottom 4-tab bar works (`Ziel & Tool | Methoden | 3 Stufen | Ziel-Labor` on Local; `Einstieg | Methoden | 3 Stufen | Praxis-Pfade` on Live).

- **(e) Local vs. Live Parity (Entry, Chrome & Modals):**
  - Header tool pills: 4 (`Web-Chat`, `Desktop`, `IDE`, `CLI-Agent`) on Local vs. 3 (`Web-Chat`, `Desktop & Ordner`, `Code-Agent`) on Live.
  - Progress modal: `Nachweise 0/6` (gate-driven, disabled checkboxes) on Local vs. `To-do 0/7` (manually checkable checkboxes) on Live.
  - `Hilfe` modal: `Glossar (21)`, `FAQ (8)`, `Tool-Matrix`, and Langdock link on Local vs. `Glossar (19)`, `FAQ (7)`, no `Tool-Matrix`, and no Langdock on Live.
  - Sidebar framing: `23 Min. gemeinsamer Aha-Kern` + `23 Min. Ziel-Labor` + `10 Projekt-Dokumente` on Local vs. `15 Min. gemeinsamer Aha-Kern` + `30 Min. freier Praxis-Pfad` + `10 öffentliche Artikel` on Live.

---

### 3.2 Step 01 (`01 · Ziel & Werkzeug wählen` Local / `01 · Einstieg & Werkzeug-Hilfe` Live)

- **(a) Initial Orientation:**
  - **Local:** Hero `"Vom ungefilterten Chat zum verlässlichen KI-System."` + `"Vorher vs. Nachher"` (`TESTFRAGE · „Vertragsstrafe & Cloud-Anbieter für Krypto-Wallet?“`: `Ohne Regeln` `2 % pro Woche bei AWS` vs. `Mit Regeln` `[Nicht in Quelle]` + `RTO: 4 Std. · RPO: 15 Min. (sla-betriebsmodell.md)`) establishes the banking context immediately. Step 01 cleanly sequences `1 · DEIN ZIEL FÜR HEUTE WÄHLEN` (4 Goals) -> `2 · DEIN WERKZEUG WÄHLEN` (4 Tools) -> `SCHRITT 1B` -> 3-step visual walkthrough -> `Ablaufplan`.
  - **Live:** Omits Goals completely (`1 · WERKZEUG-HILFE WÄHLEN` with 3 Tools) and shows contradictory `100 % öffentliche Daten` / `10 Fokus-Artikel` / `10 Öffentliche Artikel` KPIs.

- **(b) Step-by-Step Clarity:**
  - **No Audio Guide Present:** Neither Local nor Live renders `"Einstieg in 20 Sekunden erklärt"` or any `<audio>` element (`audioEls: []`, `speechSpeaking: false`). Only a text-toggle bar (`"Einstieg in Modul 2 (Kernbank 2026)"` + `"Kurztext-Hilfe"` / `"Kurztext lesen"`) expands a 1-sentence intro blurb.
  - **Hover-Only Inline Glossary Chips (`Prompt?`, `.md-Datei?`, `Git vs. ZIP?`):** Styled as underlined buttons with info icons, yet clicking/tapping produces `tooltips: []` and zero DOM change (`htmlLenBefore: 60477`, `afterClick.len: 60477`) because they use hover-only Radix Tooltips. Touch/mobile (`390×844`) and click-oriented desktop users get no feedback. (`Welches Werkzeug passt zu mir?` on Local does expand an inline 4-line guide on click.)
  - **`Web-Chat` `.md` Card Ambiguity:** `"Projekt-Dokumente als .md-Datei"` next to `"Kurztext-Hilfe"` looks like a download button, yet clicking it only toggles a 1-sentence blurb; users must open `"Alle Begriffe & FAQ öffnen"` -> `Hilfe` modal to actually download `.md` files.
  - **Duplicate & Undefined Paths (`IDE & Editor`, `CLI Code-Agent` on Local):** `IDE & Editor` says `"Öffne immer einen einzelnen Stufen-Ordner (z. B. modules/context-engineering-projekt/ oder modules/context-engineering-projekt/)"` and references `"Built-in Preview & Tests direkt unter sandbox/ prüfen"` / `"sandbox/app.html"` without explaining what `sandbox/` is or when it is created. `CLI Code-Agent` says `"Regeln & Skills ohne MCP: cd modules/context-engineering-projekt. Vernetzter Vault mit MCP: cd modules/context-engineering-projekt."` — identical commands for two distinct modes.
  - **Live `Desktop & Ordner` Contradiction:** The 3-step diagram shows `📁 modules/context-engineering-projekt/ ├── docs/ (10 Dateien)`, while the adjacent prose and `Punkt 1` tell participants to open `stufe-2-skills-guardrails/` (an L1 folder that has no `docs/`).

- **(c) Human-Readability & Wording:**
  - **Broken `Ablaufplan` Arithmetic & Nested Parentheses (Local & Live):**
    - Local `30 Min.`: `(4 Phasen · 30 Min. (16 Min. Aha-Kern + 15 Min. Ziel-Labor))` -> `16 + 15 = 31 ≠ 30`; phase footers `3+5+8+15 = 31`, while phase top badges stay hardcoded at `5 / 10 / 15 / 30 Min.`
    - Local `45 Min.` (default): `(4 Phasen · 45 Min. (23 Min. Aha-Kern + 23 Min. Ziel-Labor))` -> `23 + 23 = 46 ≠ 45`; footers `4+8+11+23 = 46`, badges still `5 / 10 / 15 / 30 Min.`
    - Local `60 Min.`: `30 + 30 = 60`; footers `5+10+15+30 = 60` (only exact preset).
    - Local `90 Min.`: `46 + 45 = 91 ≠ 90`; footers `8+15+23+45 = 91`, badges still `5 / 10 / 15 / 30 Min.`
    - Live header: `"Ablaufplan ansehen (4 Phasen · 30 Min. (Flexibel (30 / 60 / 90 Min.)))"` (triple nested parentheses), and toggling `30 / 60 / 90 Min.` changes only the header — phase durations stay hardcoded at `5+10+15+30 = 60 Min.`
  - **L1 *Tierwelt* Copy Leakage (Local & Live):** Local `CLI Code-Agent` card (`"auf allen 68 Artikeln"`), `Kein eigenes KI-Abo?` (`"68-Artikel-Faktenprüfer"`, `"Alle 68 Dateien sind 100 % öffentliche Wikipedia-Artikel"`), and `Ablaufplan` Phase 2 (`"Wandere im Terminal durch stufe-1-chaos → stufe-2 → stufe-3 und prüfe Q3 (Schneeleopard) + Q4 (38 Zähne)."`). Live leaks all of these plus `stufe-3-obsidian-vault`, `verify_claim_against_corpus`, `search_wildlife_vault`, `read_vault_article`, and `alle-10-artikel-wissensbasis.md`.
  - **Wrong npm Package on Live:** `"npm install -g @opencode/cli && opencode"` (Live) vs. `"npm install -g opencode-ai && opencode"` (Local).

- **(d) Interactive Elements, Prompts & Embedded Checks:**
  - `Ohne Regeln` (`1 / 2`) vs. `Mit Regeln` (`2 / 2`): Switches cleanly on both Local and Live.
  - 4 Goals (Local): Clicking `Besseres Prompting`, `Anwendung bauen`, `Präsentationen bauen`, `KI im Arbeitsalltag` updates `localStorage.goalId`, sets `setupConfirmed: true` and `gates["gate-setup"]: true`, and updates the sidebar summary.
  - Tool cards & 3-step walkthroughs (`1`..`3`): Switching tools updates `SCHRITT 1B` and `Punkt 1..3` captions cleanly on both Local and Live (provider badges like `ChatGPT`, `Claude.ai`, `Langdock` are static labels).
  - Verified clipboard copy buttons:
    - Local `IDE & Editor` (`"code-Befehl kopieren"`): `code modules/context-engineering-projekt`
    - Local `CLI Code-Agent` (`"Befehl kopieren"`): `npm install -g opencode-ai && opencode`
    - Local `CLI Code-Agent` (`"MCP-Setup kopieren"`): `node mcp-server/setup-client.mjs --client all --scope user --dry-run --module context-engineering-projekt`
    - Live `Code-Agent` (`"Befehl kopieren"`): `npm install -g @opencode/cli && opencode`
    - Live `Code-Agent` (`"MCP-Setup kopieren"`): `node mcp-server/setup-client.mjs --client all --scope user --module context-engineering-projekt` (no `--dry-run`)
  - Verified `.md` downloads in Step 01: Local `Desktop & Projects` (`"Alle 10 Dokumente (.md)"`) -> `alle-10-dokumente-wissensbasis.md` (`9,629` B, *Kernbank 2026*); Live `Desktop & Ordner` (`"Alle 10 Artikel (.md)"`) -> `alle-10-artikel-wissensbasis.md` (`9,629` B, *Kernbank 2026* content despite L1 `"artikel"` filename).
  - `Kein eigenes KI-Abo?` accordion: Present on Local (`Web-Chat` & `CLI Code-Agent`) and Live (`Code-Agent` only).

- **(e) Local vs. Live Parity (Step 01):**
  - Goals: 4 on Local; 0 on Live.
  - Tools: 4 (`IDE & Editor` separated) on Local; 3 on Live.
  - Duration default & presets: `45 Min.` (`Selbstlernen / 30 / 45 / 60 / 90`) on Local; `30 Min.` (`Selbstlernen / 30 / 60 / 90`) on Live.
  - Langdock links & `Kein eigenes KI-Abo?` under `Web-Chat`: Present on Local; absent on Live.
  - CLI command & `.md` filename: `opencode-ai` + `--dry-run` + `alle-10-dokumente-wissensbasis.md` on Local; `@opencode/cli` + no `--dry-run` + `alle-10-artikel-wissensbasis.md` on Live.

---

### 3.3 Step 02 (`02 · Aha-Kern 1: Prompt-Methoden` — `#/m/context-engineering-projekt/methods`)

- **(a) Initial Orientation:**
  - **Local:** Displays `SCHRITT 02 · AHA-KERN 1` — `Prompt-Methoden & Steuerungs-Ebenen`, active sidebar summary `Web-Chat | Besseres Prompting | 10 Projekt-Dokumente`, 5 glossary chips, 20-second guide toggle (`Vom vagen Prompt zum Risiko-Briefing`), 4-click walkthrough, 4 prompt methods (`1 · Zero-Shot` to `4 · RISEN + CoT`), `Chat-Basis-Regeln` / `AGENTS.md`, 5-layer control stack, `Kontext-Tank`, and `Übersetzungsmatrix`.
  - **Live:** Older build displays 3 tools, `To-do 0/7`, `SCHRITT 02 · AHA-KERN 1 (CA. 7 MIN.)`, `10 öffentliche Artikel`, and omits `Übersetzungsmatrix` completely.

- **(b) Step-by-Step Clarity:**
  - The 4-step Web-Chat flow (`01 Kopieren` -> `02 Neuer Chat` -> `03 Einfügen` -> `04 Prüfen`) is structurally clear, **but UI labels contradict actual controls and clipboard outputs**:
    1. **Character-Count Mismatches (Local & Live):** Local Kurzanleitung & button state `Kompakt-Paket (~5.700 Zeichen)`, while actual copied lengths are `5.930` (Zero-Shot), `6.547` (CO-STAR), `6.530` (Few-Shot), and `6.583` (RISEN + CoT). On Live, Kurzanleitung states `(~5.500 Zeichen)` while the button on the same screen states `(~6.000 Zeichen)`, and actual copied lengths are `6.738`–`7.391` chars.
    2. **Ghost Button Label in Tool Hints (Local & Live):** Switching to `Desktop` (`Desktop & Ordner` on Live) instructs `"oder per „Nur Prompt“ / „Texte als .md laden“ testen."` No button is named `Texte als .md laden`; the actual button reads `6 Kompakt-Texte (.md)`.
    3. **L1 Folder Paths in Tool Hints (Live only):** `Desktop & Ordner` instructs `"Du kannst entweder den Ordner stufe-1-chaos/docs/ direkt ansprechen..."` and `Code-Agent` instructs `"im Ordner stufe-1-chaos/..."`.

- **(c) Human-Readability & Wording:**
  - **Shared L1 *Tierwelt* Leakage (BOTH Local & Live):**
    - 5-Layer Stack Layer 1 (`1 · User-Prompt`, `KONKRET IM WORKSHOP`): `„Fasse mir die Folgen für Steinkorallen aus diesen Dateien zusammen.“`
    - 5-Layer Stack Layer 5 (`5 · Tools & MCP`, `KONKRET IM WORKSHOP`): `` `search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article`. ``
    - `Kontext-Tank` & `WARUM STUFE 3 DAS PROBLEM LÖST`: `"Nachricht 2: Erste lange Artikel-Texte kommen dazu."` and `"_index.md lädt nur die 2–3 passenden Artikel nach."` (`Artikel` instead of `Projekt-Dokumente`).
    - Glossary chip `Halluzination?`: Local reads `"Sie nennt selbstbewusst erfundene Eintrittspreise oder Vertragsstrafen"` (leftover `Eintrittspreise` from L1 zoo context); Live reads `"„18 € Eintritt für Schneeleoparden“"`.
  - **Live-Only L1 *Tierwelt* Leakage (Step 02):**
    - `01 Kopieren` walkthrough: `"Zwischenablage: Prompt oben + 6 Artikel (arktis.md … korallenriff.md)"` (Local fixed to `rfp-kernbank-2026.md … sla-betriebsmodell.md`).
    - `04 Prüfen` walkthrough: `"(arktis.md) oder (korallenbleiche.md)"` and `"mit (arktis.md) & [Nicht in Quelle]"` (Local fixed to `rfp-kernbank-2026.md` / `sla-betriebsmodell.md`).
    - `1 · Zero-Shot` (`Methode erklärt`): `"Beispiel: „Erzähl mir was über Eisbären“"` (Local fixed to `„Erzähl mir was dazu“`).
    - `Desktop & Ordner` / `Code-Agent` hints & `AGENTS.md` modal: `stufe-1-chaos/docs/`, `stufe-1-chaos/`, `aus stufe-2-skills-guardrails/`.
  - **Zero-Shot Misleading Green Checkmarks (BOTH Local & Live):** Under `1 · Zero-Shot` -> `Saubere Ziel-Struktur`, the failure baseline card renders green checkmarks `✓ 0 konkrete Kennzahlen` and `✓ 0 Datei-Belege`, visually signaling success on an error state (`Fließtext ohne Belege`).
  - **`Übersetzungsmatrix` Count Terminology (Local):** Heading/button say `alle 13 Ziel-Tools` / `Alle 13 Tools` while the subheader says `5 von 17 Einträgen · 13 Ziel-Tools` and expanding shows 17 rows.

- **(d) Interactive Elements, Prompts & Embedded Checks:**
  - Glossary chips (`CO-STAR?`, `Guardrails?`, `Prompt?`, `Halluzination?`, `Priming?`) and `Methode erklärt` open clearly on **hover**, but `click` alone produces `clickDiff: []`.
  - `Vom vagen Prompt zum Risiko-Briefing` / `Kurztext-Hilfe` (`Kurztext lesen`), `Abspielen`/`Pause`, and `01 Kopieren`..`04 Prüfen` all operate cleanly.
  - All 4 methods (`1 · Zero-Shot`, `2 · CO-STAR`, `3 · Few-Shot`, `4 · RISEN + CoT`) and all interactive element pills (`Aufgabe (1 Satz)`, `Context`..`Response`, `Aufgabe`/`Beispiel 1`/`Beispiel 2`/`Ziel-Zeilen`, `Role`..`Narrowing`) toggle `aria-pressed` and highlight `Fokus: <Element>`.
  - **Clipboard & `.md` Payloads Verified Clean (*Kernbank 2026*):**
    - `Nur Prompt` & `Kompakt-Paket` across all 4 methods copy 100 % L2 *Kernbank 2026* prompts, rules, and 6 texts (`rfp-kernbank-2026.md` .. `datenschutz-leitlinie.md`).
    - `6 Kompakt-Texte (.md)` downloads `methoden-kompakt-texte.md` (`5,977` B Local / `6,793` B Live), header `# Kompakt-Paket · Projekt, SLA & Governance`, zero L1 content.
  - `Chat-Basis-Regeln kopieren` / `Regeltext ansehen` and `AGENTS.md (Stufe 2) kopieren` / `System-Regel ansehen` work cleanly (`# Projekt-Leitplanken · Kernbank 2026`, `rfp-risiko-pruefer`, `runbook-check`).
  - 5-Layer Stack (`1`..`5`) and `Kontext-Tank` (`+ Nachricht senden (1/5)`..`(5/5)` advancing `18% -> 42% -> 68% -> 90% VERDRÄNGT! -> 100% VERDRÄNGT!`, `#1`–`#5` jump buttons, `+ Neuer Chat` reset to `18%`) work cleanly.
  - Local `Übersetzungsmatrix` expands cleanly (`5` filtered rows -> `17` rows across 13 target tools); absent on Live.
  - Mobile `390×844`: `0` horizontal overflow (`scrollWidth: 390`), `0` clipped buttons.

- **(e) Local vs. Live Parity (Step 02):**
  - Live lacks `IDE` tool split, `Übersetzungsmatrix`, and `rfp-kernbank-2026.md` / `sla-betriebsmodell.md` walkthrough fixes; leaks `arktis.md`, `korallenriff.md`, `korallenbleiche.md`, `Eisbären`, `Schneeleoparden`, `stufe-1-chaos/`, `stufe-2-skills-guardrails/`; and shows divergent character estimates (`5.500` vs `6.000`, actual `6.738`–`7.391`).

---

### 3.4 Step 03 (`03 · Aha-Kern 2: 3 Stufen & Wissen` — `#/m/context-engineering-projekt/stages`)

- **(a) Initial Orientation:**
  - **Local & Live:** Clear progression across `Stufe 1 → Stufe 2 → Stufe 3`, `FANGFRAGE-SCHUTZ IM ABLAUF · FRAGE 3` (`Krypto-Wallet`), `Mini-Debug`, `LIVE-VORSCHAU · FRAGE 4`, `2 Fokus-Fragen` (expandable to 4), `KURZE SELBST-REFLEXION`, and `Vorschau auf Stufe 3: Interaktiver 10-Artikel-Wissens-Graph`. Live carries `CA. 8 MIN.`, `Kurztext lesen`, `To-do 0/7`, and `10 öffentliche Artikel`.

- **(b) Step-by-Step Clarity:**
  - **Raw Unrendered `**...**` Markdown (BOTH Local & Live):** Stage 1–3 instruction boxes print literal asterisks: `Öffne einen **neuen Chat** im Browser (+ Neuer Chat).`, `Klicke auf **Kompakt-Paket kopieren** und füge es ein (warte auf die Bestätigung).`, `Stelle danach die Testfragen unten oder klicke auf **Frage + Texte komplett**.`, `**Isolations-Hinweis:**`, `**modules/context-engineering-projekt/corpus**`, and `**Assistants/Projects/Gems**:` / `**Projects**:`.
  - **Instruction vs. Button Label Mismatch (BOTH Local & Live):** Instructions in Stages 1, 2, and 3 tell users to click `**Kompakt-Paket kopieren**`, while the actual buttons read `Kompakt-Texte kopieren (~5.800 Z.)` (Stage 1), `Regeln + Texte kopieren (~6.400 Z.)` (Stage 2), and `Regeln + Kompakt-Index + Texte (~7.200 Z.)` (Stage 3).
  - **Broken Stage 3 Folder Path on Live (`Desktop & Ordner` & `Code-Agent`):** Live instructs Stage 3 participants to open `modules/context-engineering-projekt/corpus/` (`DESKTOP & ORDNER · MODULES/CONTEXT-ENGINEERING-PROJEKT/CORPUS`), which lacks `AGENTS.md` and `_index.md` — breaking Stage 3's core objective (fixed on Local to `modules/context-engineering-projekt/`).
  - **`Nachweise 0/6` vs. `Kurze Selbst-Reflexion` Disconnect (Local):** Marking all 3 `Selbst-Reflexion` pills (`3/3 markiert`) updates `To-do` (`0/7 -> 1/7`) on Live, but leaves `Nachweise 0/6` at `0/6` on Local (`Nachweise` only increments when `Mini-Debug` is solved -> `1/6`, `17 %`), with no UI note stating that `Selbst-Reflexion` is optional and not counted toward `Nachweise`.

- **(c) Human-Readability & Wording:**
  - **Shared L1 Terminology (`Artikel` & `68 Bände`, BOTH Local & Live):** Buttons (`10 Fokus-Artikel (.md)` -> `fokus-korpus-10-artikel.md`; Desktop `Alle 10 (.md)` -> `alle-10-artikel-wissensbasis.md` vs. modal `alle-10-dokumente-wissensbasis.md`), headings (`10-Artikel-Wissens-Graph`, `VERKNÜPFTE ARTIKEL (QUERVERWEISE)`), modal tab (`Artikel-Pakete`), copied prompt headers (`Lies die folgenden 10 Fokus-Artikel still ein`, `Turn 2: Fokus-Artikel`, `PASSENDE ARTIKEL:`), and `Markdown-RAG?` chip (`"statt alle 68 Bände gleichzeitig auf den Tisch zu kippen"`).
  - **Live-Only Severe L1 *Tierwelt* Leakage (Step 03):**
    - Focus Q04 button: `Frage + 38-Zähne-Text` (Local fixed to `Frage + Test-Ausschnitt`).
    - `Alle Texte & Regeln` modal (Stage 1): `~6.499 Zeichen · alle 10 Fokus-Dateien (Arktis + Riff)` (Local fixed to `~5.700 Zeichen · alle 10 Fokus-Dateien`).
    - `Wissensbasis?` chip: `Wissensbasis (68 Artikel)` — `Unsere Sammlung aus 68 öffentlichen deutschen Wikipedia-Artikeln zu Tierwelt & Lebensräumen.` (Local fixed to `Wissensbasis (Korpus)`).
  - **Minor Duplicated Filename Citation (BOTH Local & Live):** `Live-Vorschau` reads `„Laut dem vorliegenden Dokument (sla-betriebsmodell.md) gilt der Wert 2 Stunden (sla-betriebsmodell.md).“`

- **(d) Interactive Elements, Prompts & Embedded Checks:**
  - **Stage Cards & Tool Mode Switching (`4` tools Local × 3 stages; `3` tools Live × 3 stages):** All update instructions, `Fokus-Dateien`, and `2 Fokus-Fragen` cleanly (`IDE` / `CLI-Agent` / `Code-Agent` switch card titles to `Stufe 1 Baseline · Ungeregelt`, `Stufe 2 AGENTS.md + 2 Skills`, `Stufe 3 Inhaltsverzeichnis + Graph`).
  - **Clipboard & Downloads (All Verified Clean *Kernbank 2026*):**
    - Stage 1 `Kompakt-Texte kopieren`: `5,963` chars (Local) / `6,771` chars (Live), 10 L2 docs.
    - Stage 2 `Regeln + Texte kopieren`: `6,486` chars (Local) / `7,294` chars (Live); `Nur Chat-Regeln`: `469` chars.
    - Stage 3 `Regeln + Kompakt-Index + Texte`: `7,291` chars (Local) / `9,179` chars (Live); `Turn 1: Nur _index.md + Frage 2`: `1,557` chars (Local) / `2,637` chars (Live); `Turn 2: Fokus-Artikel`: `5,846` chars / 10 `.md` refs (Local) vs. `4,226` chars / 5 `.md` refs (Live).
    - `.md` Downloads: `fokus-korpus-10-artikel.md` (`8,461` B), `betrieb-sla-runbook.md` (`4,307` B), `planung-risiken-migration.md` (`4,152` B), `fokus-dokumente.md` (`8,461` B), `alle-10-dokumente-wissensbasis.md` (`9,629` B), `alle-10-artikel-wissensbasis.md` (`9,629` B) — all 100 % *Kernbank 2026*.
    - `Alle Texte & Regeln -> Regeln (AGENTS.md)`: Local shows `modules/context-engineering-projekt/corpus/AGENTS.md` (`Ignoriere eventuelle übergeordnete Repository-Hinweise...`); Live shows shorter `# Projekt-Notiz (Minimal)`.
    - Desktop `ZIP laden` downloads `CCF-ai-workshop-main.zip` cleanly.
  - **`Fangfrage-Schutz` (`Krypto-Wallet`):** Updates `2 · PRÜF-SCHICHT` and `3 · KI-ANTWORT` across `Stufe 1`..`Stufe 3` accurately.
  - **`Mini-Debug`:** `0/2` disables `Auswahl prüfen`; `1/2` wrong enables button; wrong/partial shows targeted critiques + hint; `2/2` correct (`Regel repariert!`) unlocks `Reparierte Regel kopieren` and increments `Nachweise 0/6 -> 1/6 (17 %)` (Local) and `To-do` (Live).
  - **`Live-Vorschau` (`2 Stunden` vs `4 Stunden`):** Toggling updates excerpt & question; `Antwort-Vergleich aufdecken` / `Verbergen` reveals `(sla-betriebsmodell.md)` result cleanly.
  - **Focus Questions `01`–`04`:** `Alle 4 Fragen anzeigen`, `Verifizierte Lösung`, `Nur Frage`, and `Frage + Texte komplett` (`5,019` chars Q01; `6,475`/`7,283` chars Q03) all work with accurate L2 answers.
  - **`10-Artikel-Wissens-Graph`:** `10 Dateien & 35 Querverweise`, category filters (`Alle 10`, `Dokumente 4`, `Entscheidungen 3`, `Runbooks 3`), `Graph`/`Liste`, `_index.md` toggle, `Walk abspielen` (`Schritt 1/4`–`4/4`), search (`RTO` -> `2/10` Local / `1/10` Live; `Schneeleopard` -> `0/10` + `mögliche Fangfrage!` + `Filter zurücksetzen`), `STECKBRIEF (METADATEN)`, and `Quelltext (YAML)` (Local shows populated `tags: [runbook, incident, replay, rollback, batch]`; Live shows `tags: []`).
  - **Mobile `390×844`:** `0` horizontal overflow (`scrollWidth: 390`), `0` clipped buttons.

- **(e) Local vs. Live Parity (Step 03):**
  - Live leaks `Frage + 38-Zähne-Text`, `(Arktis + Riff)`, `Wissensbasis (68 Artikel)`, points Stage 3 Desktop/Code-Agent to `corpus/` instead of `modules/context-engineering-projekt/`, truncates `Turn 2: Fokus-Artikel` to 5 `.md` refs (`4,226` vs `5,846` chars), returns `1/10` vs `2/10` on `RTO` graph search with empty `tags: []`, and diverges in `To-do` scoring (`Selbst-Reflexion` counts on Live, not on Local `Nachweise`).

---

## 4. Dedicated Local vs. Live Parity Matrix

| Surface / Dimension | Local (`http://127.0.0.1:3777/`) | Live (`https://etroxtaran.github.io/CCF-ai-workshop/`) | Parity Verdict / Impact |
|---|---|---|---|
| **Entry Goals & Tools** | **4 Goals** (`Besseres Prompting`, `Anwendung bauen`, `Präsentationen bauen`, `KI im Arbeitsalltag`) × **4 Tools** (`Web-Chat`, `Desktop`, `IDE`, `CLI-Agent`) | **0 Goals**; **3 Tools** (`Web-Chat`, `Desktop & Ordner`, `Code-Agent`) | **Major Parity Gap** — Live is an older pre-4×4 build |
| **Duration Default & Presets** | `45 Min.` default (`Selbstlernen / 30 / 45 / 60 / 90`); phases scale (`23+23=46` bug) | `30 Min.` default (`Selbstlernen / 30 / 60 / 90`); phases hardcoded `5+10+15+30=60` | **Parity Gap & Arithmetic Bug** on both |
| **Sidebar & Hero Data Label** | `L2 · 45 Min. · 100 % synthetische Projektdaten`, `10 Projekt-Dokumente` | `L2 · 30 Min. · 100 % öffentliche Daten`, `10 öffentliche Artikel`, `10 Fokus-Artikel` | **Live Bug** — contradicts synthetic banking corpus |
| **Progress Tracker** | `Nachweise 0/6` (read-only gate checks; `Mini-Debug` -> `1/6`; `Selbst-Reflexion` excluded) | `To-do 0/7` (manual checkboxes enabled; `Selbst-Reflexion` + `Mini-Debug` -> `2/7`) | **Scoring & UX Divergence** |
| **`Hilfe` Modal & Chat Links** | `Glossar (21)`, `FAQ (8)`, `Tool-Matrix` (17 rows / 13 tools), **Langdock** included | `Glossar (19)`, `FAQ (7)`, **no `Tool-Matrix`**, **no Langdock** | **Feature & Enterprise Tool Gap** on Live |
| **Step 01 `OpenCode` & MCP Setup** | `npm install -g opencode-ai && opencode`; `--dry-run` included | `npm install -g @opencode/cli && opencode` (wrong package); no `--dry-run` | **Live Functional Bug** |
| **Step 01 `.md` Download Button** | `Alle 10 Dokumente (.md)` -> `alle-10-dokumente-wissensbasis.md` (`9,629` B) | `Alle 10 Artikel (.md)` -> `alle-10-artikel-wissensbasis.md` (`9,629` B) | **Live L1 Filename/Label Leakage** |
| **Step 02 `Übersetzungsmatrix`** | Present (`5 von 17 Einträgen · 13 Ziel-Tools`) | **Absent** | **Feature Missing on Live** |
| **Step 02 Walkthrough & Tool Hints** | `rfp-kernbank-2026.md`, `sla-betriebsmodell.md`, `modules/context-engineering-projekt/corpus/` | `arktis.md … korallenriff.md`, `korallenbleiche.md`, `stufe-1-chaos/docs/`, `stufe-2-skills-guardrails/` | **Blocker L1 Leakage on Live** |
| **Step 02 5-Layer Stack (`1` & `5`)** | `Steinkorallen` & `search_wildlife_vault` | `Steinkorallen` & `search_wildlife_vault` | **Shared L1 Leakage on Both** |
| **Step 02 `Kompakt-Paket` Estimate** | Label `~5.700 Zeichen` (actual `5,930`–`6,583`) | Kurzanleitung `~5.500` vs. button `~6.000` (actual `6,738`–`7,391`) | **Mismatch on Both (worse on Live)** |
| **Step 03 Stage 3 Desktop/Agent Path** | `modules/context-engineering-projekt/` | `modules/context-engineering-projekt/corpus/` (missing `AGENTS.md` & `_index.md`) | **Live Functional Blocker** |
| **Step 03 Q04, Modal & Glossary** | `Frage + Test-Ausschnitt`, `alle 10 Fokus-Dateien`, `Wissensbasis (Korpus)` | `Frage + 38-Zähne-Text`, `(Arktis + Riff)`, `Wissensbasis (68 Artikel)` | **Blocker L1 Leakage on Live** |
| **Step 03 `Turn 2` Clip & Graph YAML** | `5,846` chars (10 `.md` refs); `RTO` search `2/10`; YAML `tags` populated | `4,226` chars (5 `.md` refs); `RTO` search `1/10`; YAML `tags: []` | **Live Index/Metadata Gap** |

---

## 5. Exhaustive L1 *Tierwelt* Copy Leakage Audit

### 5.1 Confirmed Clean Payloads (No L1 Leakage)

Before listing UI copy leaks, direct inspection of all downloaded files and copied prompts confirms that **the actual *Kernbank 2026* knowledge-base content and prompt payloads are clean** on both Local and Live:
- `Hilfe` downloads: `fokus-dokumente-10.md` (`8,682` B), `alle-10-dokumente-wissensbasis.md` (`9,629` B).
- Step 01 download: `alle-10-dokumente-wissensbasis.md` (`9,629` B, Local) and `alle-10-artikel-wissensbasis.md` (`9,629` B, Live — *Kernbank 2026* content despite L1 filename).
- Step 02 clipboard & download: `Nur Prompt`, `Kompakt-Paket` (all 4 methods), `Chat-Basis-Regeln`, `AGENTS.md (Stufe 2)`, and `methoden-kompakt-texte.md` (`5,977` B Local / `6,793` B Live).
- Step 03 clipboard & downloads: Stage 1–3 copies, Focus Q01–Q04 copies, `fokus-korpus-10-artikel.md` (`8,461` B), `betrieb-sla-runbook.md` (`4,307` B), `planung-risiken-migration.md` (`4,152` B), `fokus-dokumente.md` (`8,461` B), and `alle-10-dokumente-wissensbasis.md` (`9,629` B).

### 5.2 UI Copy Leakage Inventory (`Local & Live Shared`, `Local Only`, `Live Only`)

| Audit # | Scope | Location | Exact Leaked German UI Quote | Expected L2 (*Kernbank 2026*) Replacement |
|---|---|---|---|---|
| **L-01** | **Local & Live Shared** | Step 01 `CLI Code-Agent` / `Code-Agent` card & `Kein eigenes KI-Abo?` | `"…auf allen 68 Artikeln."`, `"68-Artikel-Faktenprüfer"`, `"Alle 68 Dateien sind 100 % öffentliche Wikipedia-Artikel ohne interne oder personenbezogene Daten."` | `"…auf allen 10 Projekt-Dokumenten."`, `"10-Dokumente-Faktenprüfer"`, `"Alle 10 Dateien sind 100 % synthetische Projektdokumente (Kernbank 2026) ohne interne oder personenbezogene Daten."` |
| **L-02** | **Local & Live Shared** | Step 01 `Ablaufplan` (`CLI Code-Agent` / `Code-Agent` Phase 2) | `"Wandere im Terminal durch stufe-1-chaos → stufe-2 → stufe-3 und prüfe Q3 (Schneeleopard) + Q4 (38 Zähne)."` | Module-specific L2 terminal task (`modules/context-engineering-projekt/`, `Krypto-Wallet`-Fangfrage, `RTO 4 Std.`). |
| **L-03** | **Local & Live Shared** | Step 02 5-Layer Stack (Layer 1 & Layer 5 `KONKRET IM WORKSHOP`) | Layer 1: `„Fasse mir die Folgen für Steinkorallen aus diesen Dateien zusammen.“` / Layer 5: `` `search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article`. `` | Layer 1: `„Fasse mir die Risiken und RTO-Ziele aus diesen Dateien zusammen.“` / Layer 5: `` `search_vault`, `verify_claim`, `read_article`. `` |
| **L-04** | **Local & Live Shared** | Step 02 `Kontext-Tank` & `WARUM STUFE 3 DAS PROBLEM LÖST` | `"Nachricht 2: Erste lange Artikel-Texte kommen dazu."`, `"_index.md lädt nur die 2–3 passenden Artikel nach."` | `"Dokument-Texte"` / `"2–3 passenden Projekt-Dokumente"`. |
| **L-05** | **Local & Live Shared** | Step 03 Buttons, Headings, Modal, Prompts & `Markdown-RAG?` | `"10 Fokus-Artikel (.md)"` (`fokus-korpus-10-artikel.md`), `"alle-10-artikel-wissensbasis.md"`, `"Artikel-Pakete"`, `"10-Artikel-Wissens-Graph"`, `"VERKNÜPFTE ARTIKEL (QUERVERWEISE)"`, `"PASSENDE ARTIKEL:"`, `"Lies die folgenden 10 Fokus-Artikel still ein"`, `"statt alle 68 Bände gleichzeitig auf den Tisch zu kippen"` | `"Projekt-Dokumente"` / `"10 Fokus-Dokumente (.md)"` / `"Dokument-Pakete"` / `"10-Dokumente-Wissens-Graph"` / `"10 Bände"`. |
| **L-06** | **Local Only** | Step 01 `IDE`, `CLI` & `Hilfe -> Schnellstart` | `"Stufen-Ordner"`, `"modules/context-engineering-projekt/ oder modules/context-engineering-projekt/"`, `"modules/context-engineering-projekt/corpus, modules/context-engineering-projekt, modules/context-engineering-projekt"` | `"Modul-Ordner"` with single path `modules/context-engineering-projekt/` (and `corpus/` explained once). |
| **L-07** | **Local Only** | `Hilfe -> Tool-Matrix` & `Glossar (21)` | `"Entpackter Stufen-Ordner (z. B. stufe-2/ oder stufe-3/)"`, `"cd stufe-3-obsidian-vault"`, `"Scope-Override pro Stufen-Workspace"`, `"Guardrails im Stufen-Ordner"` | `modules/context-engineering-projekt/` when L2 is active. |
| **L-08** | **Local Only** | Step 02 `Halluzination?` chip | `"erfundene Eintrittspreise oder Vertragsstrafen"` | `"erfundene Budgets oder Vertragsstrafen"` (remove leftover zoo/park `Eintrittspreise`). |
| **L-09** | **Live Only** | Sidebar, Hero KPIs & Step 01 `Desktop & Ordner` | `"10 öffentliche Artikel"`, `"L2 · 30 Min. · 100 % öffentliche Daten"`, `"10 Fokus-Artikel"`, `"10 Öffentliche Artikel"`, `"Alle 10 Artikel (.md)"` (`alle-10-artikel-wissensbasis.md`), `"z. B. stufe-2-skills-guardrails/ als Ordner öffnen"` | `"10 Projekt-Dokumente"`, `"100 % synthetische Projektdaten"`, `"Alle 10 Dokumente (.md)"`, `modules/context-engineering-projekt/`. |
| **L-10** | **Live Only** | Step 01 `Code-Agent` & `Ablaufplan` Phase 3 + `Hilfe` (`Glossar`/`FAQ`) | `"Wechsle in stufe-1-chaos/, stufe-2-skills-guardrails/ oder stufe-3-obsidian-vault/"`, `"$ cd stufe-3-obsidian-vault"`, `"verify_claim_against_corpus"`, `"search_wildlife_vault"`, `"read_vault_article"`, `"Erzähl mir was über Eisbären"`, `"18 € Eintritt für Schneeleoparden"`, `"[[anemonenfische]]"`, `"[[seeanemonen]]"`, `"Wissensbasis (68 Artikel)"`, `"alle-68-artikel-wissensbasis.md"` | Updated L2 *Kernbank 2026* strings & canonical MCP tools (`search_vault`, `verify_claim`, `read_article`). |
| **L-11** | **Live Only** | Step 02 Walkthrough, Hints, `Zero-Shot` & `AGENTS.md` modal | `"6 Artikel (arktis.md … korallenriff.md)"`, `"(korallenbleiche.md)"`, `"„Erzähl mir was über Eisbären“"`, `"„18 € Eintritt für Schneeleoparden“"`, `"stufe-1-chaos/docs/"`, `"stufe-1-chaos/"`, `"aus stufe-2-skills-guardrails/"` | `rfp-kernbank-2026.md … sla-betriebsmodell.md`, `modules/context-engineering-projekt/` (already fixed on Local). |
| **L-12** | **Live Only** | Step 03 Q04 Button, `Alle Texte & Regeln`, `Wissensbasis?` | `"Frage + 38-Zähne-Text"`, `"alle 10 Fokus-Dateien (Arktis + Riff)"`, `"Wissensbasis (68 Artikel) — Unsere Sammlung aus 68 öffentlichen deutschen Wikipedia-Artikeln zu Tierwelt & Lebensräumen."` | `"Frage + Test-Ausschnitt"`, `"alle 10 Fokus-Dateien"`, `"Wissensbasis (Korpus)"` (already fixed on Local). |

---

## 6. Unified Structured Findings & Actionable Adaptations (`M4-01`..`M4-23`)

*(Reconciles and deduplicates `m4_explorer_1` (`M4-01`..`M4-14`) and `m4_explorer_2` (`M4S23-01`..`M4S23-09`) with zero dropped observations.)*

| ID | Severity | Env | Route / Step | Exact German UI Quote | Participant Friction Explanation | Concrete Recommended Adaptation |
|---|---|---|---|---|---|---|
| **M4-01** | **Blocker** | Live | Steps 02 & 03 (`methods`, `stages`) | `"Zwischenablage: Prompt oben + 6 Artikel (arktis.md … korallenriff.md)"`, `"(korallenbleiche.md)"`, `"stufe-1-chaos/docs/"`, `"stufe-2-skills-guardrails/"`, `"„18 € Eintritt für Schneeleoparden“"`, `"„Erzähl mir was über Eisbären“"`, `"Wissensbasis (68 Artikel)"`, `"(Arktis + Riff)"`, `"Frage + 38-Zähne-Text"`, `"10 öffentliche Artikel"` | Live GitHub Pages is severely out of date: 9+ L1 *Tierwelt* strings leak across Step 02 & Step 03, actively misleading participants on folder paths, filenames, and test prompts, while missing `Übersetzungsmatrix` and YAML `tags`. | Rebuild and redeploy GitHub Pages from the updated build, and add a post-build assertion verifying zero L1 keywords (`arktis`, `korallen`, `schneeleopard`, `eisbär`, `zähne`, `stufe-1-chaos`, `68 Artikel`) appear in `#/m/context-engineering-projekt/*`. |
| **M4-02** | **High** | Local & Live | Step 01 (`CLI Code-Agent` / `Code-Agent`, `Ablaufplan`) | `"auf allen 68 Artikeln"`, `"Q3 (Schneeleopard) + Q4 (38 Zähne)"`, `"Alle 68 Dateien sind 100 % öffentliche Wikipedia-Artikel"`, `"68-Artikel-Faktenprüfer"`, `"Wandere im Terminal durch stufe-1-chaos → stufe-2 → stufe-3"` | L2 participants working on *Kernbank 2026* (10 synthetic banking docs) are told they have 68 Wikipedia articles and wildlife quiz targets, breaking credibility before Step 02 begins. | Parameterize all Step 01 `CLI Code-Agent`, `Kein eigenes KI-Abo?`, and `Ablaufplan` Phase 2/3 strings from active module metadata (`10 Projekt-Dokumente`, `modules/context-engineering-projekt/`, L2 questions). |
| **M4-03** | **High** | Local & Live | Step 02 (5-Layer Stack L1 & L5) | Layer 1: `"„Fasse mir die Folgen für Steinkorallen aus diesen Dateien zusammen.“"` / Layer 5: `` "`search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article`." `` | L2 participants see *Steinkorallen* and L1 wildlife MCP aliases instead of canonical L2 MCP tools (`search_vault`, `verify_claim`, `read_article`), risking failed tool calls in CLI/IDE agents. | Parameterize Layer 1 & Layer 5 `KONKRET IM WORKSHOP` examples per module: Layer 1 -> `„Fasse mir die Risiken und RTO-Ziele aus diesen Dateien zusammen.“`; Layer 5 -> `` `search_vault`, `verify_claim`, `read_article` ``. |
| **M4-04** | **High** | Local & Live | Step 03 (Stage Instruction Box) | `"Öffne einen **neuen Chat** im Browser (+ Neuer Chat)."`, `"Klicke auf **Kompakt-Paket kopieren**"`, `"**Isolations-Hinweis:**"`, `"**modules/context-engineering-projekt/corpus**"` | Literal `**...**` Markdown renders unparsed in the UI, and every stage tells participants to click `Kompakt-Paket kopieren` even though no Step 03 button carries that label (`Kompakt-Texte kopieren`, `Regeln + Texte kopieren`, `Regeln + Kompakt-Index + Texte`). | Parse `**...**` spans into `<strong>` (or strip raw asterisks) and dynamically interpolate the exact active button label for Stages 1, 2, and 3. |
| **M4-05** | **High** | Local | Step 01 (`IDE & Editor`, `CLI Code-Agent`), `Hilfe -> Schnellstart` | `"modules/context-engineering-projekt/ oder modules/context-engineering-projekt/"`, `"Regeln & Skills ohne MCP: cd modules/context-engineering-projekt. Vernetzter Vault mit MCP: cd modules/context-engineering-projekt."`, `"modules/context-engineering-projekt/corpus, modules/context-engineering-projekt, modules/context-engineering-projekt"` | Repeating the exact same path twice/three times for two different options looks like a broken template and leaves participants unsure which directory to open. | Replace multi-stage L1 folder arrays with L2-specific copy naming a single folder `modules/context-engineering-projekt/` (noting `corpus/` holds the 10 `.md` docs and MCP is preconfigured in the module root). |
| **M4-06** | **High** | Live | `Hilfe`, Sidebar, Step 01 (`Desktop & Ordner`, `Code-Agent`, `Ablaufplan`) | `"10 öffentliche Artikel"`, `"alle-68-artikel-wissensbasis.md"`, `"alle-10-artikel-wissensbasis.md"`, `"stufe-2-skills-guardrails/"`, `"search_wildlife_vault, verify_claim_against_corpus, read_vault_article"`, `"18 € Eintritt für Schneeleoparden"` | Live omits Local's 4 Goals, 4th tool (`IDE`), Langdock links, and `Tool-Matrix`, while leaking L1 *Tierwelt* paths, filenames, and wildlife examples across `Hilfe` and Step 01. | Redeploy Live from the updated Local build and rename `alle-10-artikel-wissensbasis.md` -> `alle-10-dokumente-wissensbasis.md`. |
| **M4-07** | **High** | Live | Step 01 (`Code-Agent` -> `Kein eigenes KI-Abo?`) | `"npm install -g @opencode/cli && opencode"` | `@opencode/cli` is the wrong npm package name (Local uses `opencode-ai`), so participants copying this command fail installation, and the MCP setup command lacks `--dry-run`. | Update Live to `"npm install -g opencode-ai && opencode"` and include `--dry-run` in the MCP setup command (matching Local). |
| **M4-08** | **High** | Live | Step 03 (Stage 3 `Desktop & Ordner` & `Code-Agent`) | `"DESKTOP & ORDNER · MODULES/CONTEXT-ENGINEERING-PROJEKT/CORPUS"` (`"Ordner öffnen: modules/context-engineering-projekt/corpus/"`) | Sends Stage 3 Desktop and Code-Agent participants into `corpus/`, which lacks `AGENTS.md` and `_index.md`, directly breaking Stage 3's learning objective on Live. | Ensure Live deployment includes the Local fix pointing Stage 2 and Stage 3 to `modules/context-engineering-projekt/` rather than `corpus/`. |
| **M4-09** | **Medium** | Local & Live | Step 01 (`Ablaufplan ansehen`) | Local: `"45 Min. (23 Min. Aha-Kern + 23 Min. Ziel-Labor)"`, `"Start · 5 Min."` vs. `"4 Min."` (`4+8+11+23=46`); Live: `"30 Min. (Flexibel (30 / 60 / 90 Min.))"` with static `5+10+15+30=60` | Arithmetic contradictions (`23+23=46` under `45 Min.`, `16+15=31` under `30 Min.`, `46+45=91` under `90 Min.`), conflicting top badges vs. phase footers, nested parentheses, and Live's non-updating phase durations erode trust. | Make phase minutes sum to exact preset (`30`: `3+5+7+15`, `45`: `4+8+11+22`, `90`: `8+15+22+45`), sync top badges with phase footers, and flatten nested parentheses (`45 Min. · 23 Min. Aha-Kern + 22 Min. Ziel-Labor`). |
| **M4-10** | **Medium** | Local & Live | Steps 01, 02 & 03 (Inline `?` Glossary Chips & `Methode erklärt`) | `"Prompt?"`, `".md-Datei?"`, `"Git vs. ZIP?"`, `"CO-STAR?"`, `"Guardrails?"`, `"Halluzination?"`, `"Priming?"`, `"Methode erklärt"` (`data-state="closed"`, `clickDiff: []` on click) | Styled as clickable underlined buttons with info icons, yet Radix Tooltip only responds to hover — clicking/tapping on desktop or mobile (`390×844`) produces zero response. | Switch from hover-only Tooltip to click-accessible Popover (supporting both hover and tap/click toggle) on all `?` glossary chips and `Methode erklärt`. |
| **M4-11** | **Medium** | Local & Live | Global Chrome (`Nachweise 0/6` / `To-do 0/7`) | `"Fortschritt zurücksetzen"` | Clicking `"Fortschritt zurücksetzen"` wipes all `localStorage` state, validations, and reflections immediately without any confirmation dialog. | Add a confirmation step (`window.confirm` or inline `"Wirklich zurücksetzen?"`) before clearing progress. |
| **M4-12** | **Medium** | Local | Global Chrome (`Nachweise 0/6`) & Step 03 (`Kurze Selbst-Reflexion`) | `"Echte Qualitäts-Nachweise statt bloßer Klicks"` + 6 `disabled: true` checkboxes; Step 03 `3/3 markiert` leaves `Nachweise 0/6` unchanged | Participants try clicking the 6 checkboxes in `Nachweise` and get no response or `"Automatisch geprüft"` label; additionally, completing all 3 `Selbst-Reflexion` pills in Step 03 leaves `Nachweise 0/6` at `0/6` (unlike Live `To-do 0/7 -> 1/7`) with no explanation that reflection is optional. | Replace disabled checkboxes with explicit status pills (`Offen` / `Automatisch nachgewiesen`) and add a small note under `Kurze Selbst-Reflexion` (`Optional — zählt nicht zu den 6 Nachweisen`). |
| **M4-13** | **Medium** | Local | `Hilfe -> Tool-Matrix` | `"Entpackter Stufen-Ordner (z. B. stufe-2/ oder stufe-3/)"`, `"cd stufe-3-obsidian-vault"`, `"Scope-Override pro Stufen-Workspace"` | Hardcodes L1 `stufe-*/` directory names inside L2 (`modules/context-engineering-projekt/`). | Parameterize `Tool-Matrix` path examples per active module slug (`modules/context-engineering-projekt/` when in L2). |
| **M4-14** | **Medium** | Local & Live | `Hilfe -> Schnellstart & .md` & `FAQ` | Buttons: `"10 Fokus-Dokumente (.md)"` (`8,682` B) & `"Alle 10 Dokumente (.md)"` (`9,629` B); FAQ #6: `"auf „Alle Ordner als ZIP laden“"` vs. `"Alle Workshop-Ordner als ZIP laden"` | Offering two buttons both claiming `"10 Dokumente"` in a 10-doc module causes unnecessary confusion, and FAQ #6 cites an inaccurate button label. | In 10-doc modules, show a single `"Alle 10 Projekt-Dokumente (.md)"` button (or clearly distinguish `"Kompakt"` vs. `"Inkl. Steckbrief"`), and align FAQ #6 to `"Alle Workshop-Ordner als ZIP laden"`. |
| **M4-15** | **Medium** | Local & Live | Step 02 (`Kurzanleitung`, Button Labels & Tool Hints) | Local: `"Kompakt-Paket (~5.700 Zeichen)"` (actual `5,930`–`6,583`); Live: `"~5.500 Zeichen"` vs. `"~6.000 Zeichen"` (actual `6,738`–`7,391`); Desktop/IDE/CLI hint: `"„Texte als .md laden“"` | Contradictory character counts (especially Live `5.500` vs. `6.000` on the same screen) and referencing a nonexistent `"Texte als .md laden"` button confuse unprepared users. | Compute or align the displayed `~X Zeichen` estimate to actual copied length (`~6.500 Zeichen`) and update tool hints to `"6 Kompakt-Texte (.md)"`. |
| **M4-16** | **Medium** | Local & Live | Step 03 (Buttons, Headings, Modal, Prompts & `Markdown-RAG?`) | `"10 Fokus-Artikel (.md)"`, `"fokus-korpus-10-artikel.md"`, `"alle-10-artikel-wissensbasis.md"`, `"Artikel-Pakete"`, `"10-Artikel-Wissens-Graph"`, `"PASSENDE ARTIKEL:"`, `"Lies die folgenden 10 Fokus-Artikel still ein"`, `"alle 68 Bände"` | `"Artikel"` (Wikipedia articles from L1) and `"68 Bände"` leak inconsistently alongside `"Projekt-Dokumente"` (`fokus-dokumente.md` vs. `fokus-korpus-10-artikel.md`). | Parameterize the unit noun per module (`Artikel` for L1, `Dokumente` / `Projekt-Dokumente` for L2) across buttons, modal tabs, filenames, prompt headers, and `Markdown-RAG?` (`10 Bände`). |
| **M4-17** | **Medium** | Local & Live | Step 02 (`1 · Zero-Shot` Comparison & Local `Halluzination?`) | `"✓ 0 konkrete Kennzahlen"` / `"✓ 0 Datei-Belege"`; Local `Halluzination?`: `"erfundene Eintrittspreise oder Vertragsstrafen"` | Green checkmarks (`✓`) visually signal success on Zero-Shot's negative failure baseline; `Eintrittspreise` in Local `Halluzination?` is a leftover L1 zoo/park reference. | Replace `✓` with `✗` or `–` on the Zero-Shot failure bullets, and change Local `Halluzination?` to `"erfundene Budgets oder Vertragsstrafen"`. |
| **M4-18** | **Low** | Local | Step 02 (`Übersetzungsmatrix`) | `"alle 13 Ziel-Tools"` / `"5 von 17 Einträgen · 13 Ziel-Tools"` / `"Alle 13 Tools"` (expands to 17 rows) | Mixing `13 Ziel-Tools` and `17 Einträgen` without explanation is mildly confusing when toggling `"Alle 13 Tools"` renders 17 rows. | Relabel the button to `"Alle 17 Einträge (13 Tools)"` or explain that grouped tools count toward 17 matrix entries. |
| **M4-19** | **Low** | Local & Live | Step 02 (`Kontext-Tank`) & Step 03 (`Live-Vorschau`) | `"„Laut dem vorliegenden Dokument (sla-betriebsmodell.md) gilt der Wert 2 Stunden (sla-betriebsmodell.md).“"`; `Kontext-Tank`: `"Artikel-Texte"` / `"Artikel"` | `(sla-betriebsmodell.md)` appears twice in a single sentence; `Kontext-Tank` retains L1 `"Artikel"` wording. | Deduplicate `(sla-betriebsmodell.md)` to appear once at the end of the sentence, and generalize `"Artikel"` in `Kontext-Tank` to `"Dokumente"`. |
| **M4-20** | **Low** | Local & Live | Global Header (Top-Right Beamer Link) | Icon-only `<a href="#/m/context-engineering-projekt/beamer" aria-label="Zur Trainer-Bühne wechseln">` (`text: ""`) | Sighted participants cannot tell what the projector icon does before hovering. | Add a subtle `Beamer` text label on desktop (`lg:`) matching `Module` and `Hilfe`. |
| **M4-21** | **Low** | Local & Live | Step 01 (`.md` Info Card & Intro Toggle) | `"Einstieg in Modul 2 (Kernbank 2026)"` + `"Kurztext-Hilfe"`; `"Projekt-Dokumente als .md-Datei"` | In `Web-Chat`, `"Projekt-Dokumente als .md-Datei"` looks like a download button but only toggles a 1-sentence blurb (`Kurztext-Hilfe`), and there is no `<audio>` guide despite intro-guide expectations. | Style `"Projekt-Dokumente als .md-Datei"` as plain heading text (keeping only `"Kurztext-Hilfe"` as the toggle) and place a direct `.md` download button inside that card. |
| **M4-22** | **Low** | Local | Step 01 (`IDE & Editor`) | `"Built-in Preview & Tests direkt unter sandbox/ prüfen"`, `"für sandbox/app.html"` | Beginners opening `modules/context-engineering-projekt/` are told to inspect `sandbox/app.html` in Step 01 without explanation of what `sandbox/` is or when it is created. | Clarify `"sandbox/app.html (wird in Schritt 04 erstellt bzw. getestet)"` so beginners do not search for a missing file in Step 01. |
| **M4-23** | **Low** | Local & Live | Mobile `390×844` (Header & Context Visibility) | Header collapses to `Web | Ordner | IDE | CLI | 0/6`; desktop `<aside>` hidden (`0×0`) | Mobile participants have no drawer or persistent indicator showing the active module title or selected Goal once scrolled past the hero. | Render a compact active Module + Goal pill above Step 01 content on `<lg` viewports. |

---

## 7. Complete Coverage Matrix

Every route, viewport, modal, tool mode, method, stage, interactive check, download, and clipboard action within Milestone M4 scope was executed from fresh `browser.newContext()` sessions on both environments:

| Surface / Control | Local (`http://127.0.0.1:3777/`) | Live (`https://etroxtaran.github.io/CCF-ai-workshop/`) | Observed Outcome |
|---|---|---|---|
| **Entry Fresh Load (`#/m/context-engineering-projekt`) + Telemetry** | ✅ Desktop `1440×900` & Mobile `390×844` | ✅ Desktop `1440×900` & Mobile `390×844` | `0` console/page/HTTP errors; `localStorage`/`sessionStorage` verified |
| **Onboarding Tour (`1/4`..`4/4`, `Weiter`, `Zurück`, `Überspringen`, `Verstanden`)** | ✅ All 4 steps + nav + skip | ✅ All 4 steps + nav + skip | Persists `v7-ccf-tour-seen-v1: "1"` |
| **Global Header, Sidebar & Mobile `390×844` Bottom Bar** | ✅ Verified (`overflowX: false`, 4 tools, `Nachweise 0/6`) | ✅ Verified (`overflowX: false`, 3 tools, `To-do 0/7`) | Beamer icon-only; mobile hides `<aside>` |
| **`Hilfe` Modal (`Tour starten`, `Schnellstart & .md`, `Glossar`, `FAQ`, `Tool-Matrix`, `.md` Downloads, ZIP HTTP 200)** | ✅ 4 tabs, 21 glossary, 8 FAQs, 17 matrix rows, 2 `.md` + ZIP | ✅ 3 tabs, 19 glossary, 7 FAQs, 2 `.md` + ZIP | `.md` payloads 100 % *Kernbank 2026*; Live leaks L1 copy |
| **Checklist Modal (`Nachweise 0/6` / `To-do 0/7`, Checkboxes, `Öffnen →`, `Fortschritt zurücksetzen`)** | ✅ 6 disabled checkboxes, jump to `stages`, instant reset | ✅ 7 enabled checkboxes, jump to `methods`, instant reset | Instant reset lacks confirmation dialog |
| **Step 01 Hero, KPIs, `Ohne Regeln` / `Mit Regeln`, Intro Toggle** | ✅ Verified (`Krypto-Wallet`, `RTO: 4 Std.`, no `<audio>`) | ✅ Verified (`Krypto-Wallet`, `RTO: 4 Std.`, no `<audio>`) | Live KPIs leak `10 öffentliche Artikel` |
| **Step 01 Inline Chips (`Prompt?`, `.md-Datei?`, `Git vs. ZIP?`, `Welches Werkzeug passt zu mir?`, `Alle Begriffe & FAQ öffnen`)** | ✅ Hover vs. click verified | ✅ Hover vs. click verified | Hover-only `?` chips ignore clicks/taps |
| **Step 01 Goals (4 on Local) & Tool Cards (`SCHRITT 1B`, Links, Copy, `.md`, 3-Step Walkthroughs, `Kein eigenes KI-Abo?`)** | ✅ 4 Goals + all 4 Tools exercised | ✅ 0 Goals + all 3 Tools exercised | Live wrong `@opencode/cli`; Local duplicate folder paths |
| **Step 01 `Ablaufplan ansehen` All Presets** | ✅ All 5 (`Selbstlernen`, `30`, `45`, `60`, `90`) | ✅ All 4 (`Selbstlernen`, `30`, `60`, `90`) | Arithmetic/nesting bugs on both |
| **Step 02 Fresh Load (`#/m/context-engineering-projekt/methods`) & Telemetry** | ✅ Desktop `1440×900` & Mobile `390×844` | ✅ Desktop `1440×900` & Mobile `390×844` | `0` errors; `overflowX: false` |
| **Step 02 Glossary Chips (`CO-STAR?`, `Guardrails?`, `Prompt?`, `Halluzination?`, `Priming?`), Intro Guide, 4-Click Walkthrough** | ✅ All hover-tested + walkthrough `01`..`04` | ✅ All hover-tested + walkthrough `01`..`04` | Live leaks `arktis.md`, `korallenbleiche.md`, `Schneeleoparden` |
| **Step 02 All 4 Prompt Methods (`Zero-Shot`, `CO-STAR`, `Few-Shot`, `RISEN + CoT`) + Element Pills + `Methode erklärt`** | ✅ All 4 methods + all pills | ✅ All 4 methods + all pills | Zero-Shot green `✓` quirk; Live `Eisbären` tooltip |
| **Step 02 Clipboard (`Nur Prompt`, `Kompakt-Paket`), `.md` Download (`methoden-kompakt-texte.md`), `Chat-Basis-Regeln`, `AGENTS.md`** | ✅ All 4 methods verified | ✅ All 4 methods verified | Clean *Kernbank 2026* payloads; char counts & ghost button label mismatch |
| **Step 02 5-Layer Stack (L1–L5), `Kontext-Tank` (`1/5`..`5/5`, `#1`–`#5`, `+ Neuer Chat`), `Übersetzungsmatrix`, Tool Switching** | ✅ All 5 layers, 5 tank states, 17 matrix rows, 4 tools | ✅ All 5 layers, 5 tank states, 3 tools (`Übersetzungsmatrix` absent) | Shared `Steinkorallen` & `search_wildlife_vault` leakage |
| **Step 03 Fresh Load (`#/m/context-engineering-projekt/stages`) & Telemetry** | ✅ Desktop `1440×900` & Mobile `390×844` | ✅ Desktop `1440×900` & Mobile `390×844` | `0` errors; `overflowX: false` |
| **Step 03 Glossary Chips (`Guardrails?`, `Wissensbasis?`, `Markdown-RAG?`)** | ✅ Hover verified | ✅ Hover verified | Live leaks `Wissensbasis (68 Artikel)` |
| **Step 03 All 3 Stages × All Tool Modes (`Web-Chat`, `Desktop`, `IDE`, `CLI-Agent` / `Code-Agent`) + Clipboard + `.md` + `Alle Texte & Regeln` + `ZIP`** | ✅ 4 tools × 3 stages + all clips/downloads | ✅ 3 tools × 3 stages + all clips/downloads | Raw `**...**` + button mismatch on both; Live Stage 3 `corpus/` path bug & `(Arktis + Riff)` |
| **Step 03 `Fangfrage-Schutz`, `Mini-Debug` (disabled/wrong/partial/correct), `Live-Vorschau` (2h/4h + reveal)** | ✅ All states exercised | ✅ All states exercised | `Mini-Debug` updates `Nachweise`/`To-do`; duplicated `(sla-betriebsmodell.md)` |
| **Step 03 Focus Questions (`01`–`04`), Copy Buttons, `Verifizierte Lösung`, `Selbst-Reflexion`** | ✅ All 4 + clips + solutions + 3/3 pills | ✅ All 4 + clips + solutions + 3/3 pills | Live Q04 leaks `38-Zähne-Text`; Local `Selbst-Reflexion` vs `Nachweise` disconnect |
| **Step 03 `10-Artikel-Wissens-Graph` (`Graph`/`Liste`, Filters, `Walk`, Search `RTO`/`Schneeleopard`, Node + `Quelltext (YAML)`)** | ✅ All controls exercised (`RTO` 2/10, `tags` populated) | ✅ All controls exercised (`RTO` 1/10, `tags: []`) | Clean L2 graph data; `Schneeleopard` -> `0/10` |
