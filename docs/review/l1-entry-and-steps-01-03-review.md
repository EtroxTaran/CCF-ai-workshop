# Blind Unprepared-Participant Review: L1 Entry, Global Chrome & Steps 01–03

**Module Scope:** L1 (*Prompt-Werkstatt · virtual7 CCF Clustertag*, *Tierwelt* corpus) — Initial Entry, Onboarding Tour, Global Chrome, Modals, and Steps `01`–`03`  
**Environments Reviewed:**
- **Local:** `http://127.0.0.1:3777/`
- **Live (GitHub Pages):** `https://etroxtaran.github.io/CCF-ai-workshop/`  
**Evaluation Paradigm:** Strictly blind, unprepared-participant end-to-end walkthrough from fresh `browser.newContext()` sessions (clean cookies, `localStorage`, and `sessionStorage`), judging only rendered UI text, controls, clipboard payloads, and downloaded files. No internal source code (`workshop-ui/`, `mcp-server/`, `modules/`, `stufe-*/`), trainer guides (`PRESENTER_RUNBOOK.md`, `LOESUNGEN_TRAINER.md`), or test files were inspected.

---

## 1. Scenario & Environment Metadata

### 1.1 Routes & URLs Tested

| Route / Path | Local URL | Live URL | Route Parity (`main.innerText` / `body.innerText`, clean load) |
|---|---|---|---|
| Root / Step 01 | `http://127.0.0.1:3777/` | `https://etroxtaran.github.io/CCF-ai-workshop/` | Baseline: `main.innerText` `4,161` Local / `2,907` Live (`body.innerText`: `4,506` / `3,241`) |
| Module-prefixed Step 01 | `http://127.0.0.1:3777/#/m/prompt-werkstatt-tierwelt` | `https://etroxtaran.github.io/CCF-ai-workshop/#/m/prompt-werkstatt-tierwelt` | `EXACT_MATCH` vs `/` on both Local and Live (`0` errors) |
| Step 02 (`Prompt-Methoden`) | `http://127.0.0.1:3777/#/methods` | `https://etroxtaran.github.io/CCF-ai-workshop/#/methods` | Baseline: `main.innerText` `5,320` Local / `5,250` Live (`body.innerText`: `5,665` / `5,584`) |
| Module-prefixed Step 02 | `http://127.0.0.1:3777/#/m/prompt-werkstatt-tierwelt/methods` | `https://etroxtaran.github.io/CCF-ai-workshop/#/m/prompt-werkstatt-tierwelt/methods` | `EXACT_MATCH` vs `#/methods` on both Local and Live (`0` errors) |
| Step 03 (`3 Stufen & Wissen`) | `http://127.0.0.1:3777/#/stages` | `https://etroxtaran.github.io/CCF-ai-workshop/#/stages` | Baseline: `main.innerText` `4,711` Local / `4,726` Live (`body.innerText`: `5,056` / `5,060`) |
| Module-prefixed Step 03 | `http://127.0.0.1:3777/#/m/prompt-werkstatt-tierwelt/stages` | `https://etroxtaran.github.io/CCF-ai-workshop/#/m/prompt-werkstatt-tierwelt/stages` | `EXACT_MATCH` vs `#/stages` on both Local and Live (`0` errors) |

### 1.2 Fresh Browser Context, Viewports & Telemetry

- **Fresh Context State (`browser.newContext()` with clean storage/cookies & granted clipboard/download permissions):**
  - **Initial HTTP Status:** `200` on both Local and Live.
  - **Initial `localStorage["v7-ccf-workshop-state-v3"]`:**
    - Local: `{"toolMode":"web","goalId":"prompting","durationPreset":45,"setupConfirmed":false,"methodsExplored":false,"debugSolved":false,"outputValidations":{},"rubricChecked":{},"rulebookPassed":false,"gates":{"gate-setup":false,"gate-methods":false,"gate-debug":false,"gate-validator":false,"gate-rubric":false,"gate-rulebook":false},"checked":{},"reflections":{},"showAllQuestions":false}`
    - Live: `{"toolMode":"web","checked":{},"reflections":{},"showAllQuestions":false}`
  - **Initial `localStorage["v7-ccf-tour-seen-v1"]`:** Absent on initial load; set to `"1"` upon clicking `Verstanden` or `Überspringen`.
  - **Initial `sessionStorage["v7-ccf-workshop-session-v2"]`:** `{"step":"start","activeStageIdx":0}` on both Local and Live.
- **Viewports Tested:**
  - **Desktop (`1440×900`):** `scrollWidth: 1440 === innerWidth: 1440` across all routes (Local & Live); zero horizontal overflow.
  - **Mobile (`390×844`):** `scrollWidth: 390 === innerWidth: 390` across all routes (Local & Live); zero clipped elements; `Hilfe` and `Nachweise`/`To-do` modals fit cleanly at `390×844` (`scrollWidth: 389`).
- **Runtime Error Telemetry:** `0` console errors, `0` console warnings, `0` uncaught page errors, and `0` failed network requests / HTTP `>= 400` responses across all tested routes on both Local and Live.

### 1.3 Verified Download & Clipboard Payloads

| Location & Trigger | File / Clipboard Payload | Local Metric | Live Metric |
|---|---|---|---|
| `Hilfe` → `Schnellstart & .md`: `12 Fokus-Dokumente (.md)` | `fokus-dokumente-12.md` | `61,816` bytes (valid Markdown) | `61,816` bytes (valid Markdown) |
| `Hilfe` → `Schnellstart & .md`: `Alle 68 Dokumente (.md)` | `alle-68-dokumente-wissensbasis.md` | `327,851` bytes (valid Markdown) | `327,851` bytes (valid Markdown) |
| Step 01 (`Desktop`): `Alle 68 Dokumente (.md)` / `Alle 68 Artikel (.md)` | `alle-68-dokumente-wissensbasis.md` (Local) / `alle-68-artikel-wissensbasis.md` (Live) | `327,851` bytes | `327,851` bytes |
| `Hilfe` & Step 01 (`Desktop`): `Alle Workshop-Ordner als ZIP laden` / `Alle Ordner (.zip)` / `ZIP laden` | `CCF-ai-workshop-main.zip` (`https://github.com/EtroxTaran/CCF-ai-workshop/archive/refs/heads/main.zip`) | HTTP `200`; `2,266,710` bytes (`540` ZIP entries) | HTTP `200`; `2,266,710` bytes (`540` ZIP entries) |
| Step 01 (`IDE & Editor`): `code-Befehl kopieren` | `code stufe-3-obsidian-vault` | `27` chars | N/A (absent on Live) |
| Step 01 (`CLI Code-Agent` / `Code-Agent`): `Befehl kopieren` | `npm install -g opencode-ai && opencode` (Local) vs `npm install -g @opencode/cli && opencode` (Live) | `38` chars (`opencode-ai`) | `40` chars (`@opencode/cli`) |
| Step 01 (`CLI Code-Agent`): `MCP-Setup kopieren` | `node mcp-server/setup-client.mjs --client all --scope user --dry-run` | `68` chars | N/A (absent on Live) |
| Step 02 (`1 · Zero-Shot`): `Nur Prompt` / `Kompakt-Paket` | Prompt only (`68` chars) / Prompt + `6` `=== *.md ===` blocks | `68` / `5,417` chars | `68` / `5,417` chars |
| Step 02 (`2 · CO-STAR`): `Nur Prompt` / `Kompakt-Paket` | 6-line CO-STAR prompt / Prompt + `6` blocks | `6,072` chars (`Kompakt-Paket`) | `6,072` chars (`Kompakt-Paket`) |
| Step 02 (`3 · Few-Shot`): `Nur Prompt` / `Kompakt-Paket` | Instruction + 2 examples + task / Prompt + `6` blocks | `6,085` chars (`Kompakt-Paket`) | `6,085` chars (`Kompakt-Paket`) |
| Step 02 (`4 · RISEN + CoT`): `Nur Prompt` / `Kompakt-Paket` | `Role:`..`Narrowing:` / Prompt + `6` blocks | `6,131` chars (`Kompakt-Paket`) | `6,131` chars (`Kompakt-Paket`) |
| Step 02: `6 Kompakt-Texte (.md)` | `methoden-kompakt-texte.md` (`# Express-Paket 1 · Klimawandel in Arktis & Korallenriff`) | `5,581` bytes | `5,581` bytes |
| Step 02: `Chat-Basis-Regeln kopieren` | `VERBINDLICHE CHAT-REGELN...` (4 rules) | `596` chars | `596` chars |
| Step 03 (`Stufe 1`): `Kompakt-Texte kopieren (~5.900 Z.)` | Header claiming `12 Fokus-Artikel` + `10` `=== *.md ===` blocks | `5,934` chars | `5,934` chars |
| Step 03 (`Stufe 1`): `12 Fokus-Artikel (.md)` | `fokus-korpus-12-artikel.md` (`12` full articles incl. `Alpenmurmeltier`, `Winterschlaf`) | `61,576` bytes | `61,576` bytes |
| Step 03 (`Stufe 2`): `Regeln + Texte kopieren (~6.500 Z.)` (Local) / `Regeln + Texte kopieren (~6.700 Z.)` (Live) / `Nur Chat-Regeln` | Rules + `10` compact texts / Rules only | `6,584` / `596` chars | `6,584` / `596` chars |
| Step 03 (`Stufe 3`): `Regeln + Kompakt-Index + Texte` | Rules + `_index` + compact texts | `7,522` chars | `8,822` chars |
| Step 03 (`Stufe 3`): `Turn 1: Nur _index.md + Frage 2` | `_index` + Question 2 | `1,947` chars | `3,247` chars |
| Step 03 (`Stufe 3`): `Turn 2: Fokus-Artikel` | Condensed summaries (Local) vs full Wikipedia articles (Live) | `3,489` chars | **`29,024` chars** |
| Step 03 (`Desktop`): `cd` command chip (`IDE`/`CLI-Agent`) | `cd stufe-1-chaos` | `16` chars | `16` chars |
| Step 03 Focus Questions (`Q01`–`Q04`): `Frage + Texte komplett` / `Frage + Test-Ausschnitt` (Local) / `Frage + 38-Zähne-Text` (Live) | `Q01` Stage 1 (`2,508` Local vs **`19,414`** Live), Stage 2/3 (`3,115` Local vs **`20,021`** Live); `Q02` Stage 1 (`3,780` Local vs **`29,315`** Live), Stage 2/3 (`4,387` Local vs **`29,922`** Live); `Q03` Stage 1 (`6,006` Local & Live), Stage 2/3 (`6,613` Local & Live); `Q04` (`246` chars / `244` LF-normalized incl. `REGEL:` prefix, `38 Zähne`) | `Q01`: `2,508` / `3,115`; `Q02`: `3,780` / `4,387`; `Q03`: `6,006` / `6,613`; `Q04`: `246` chars (`244` LF) | `Q01`: **`19,414`** / **`20,021`**; `Q02`: **`29,315`** / **`29,922`**; `Q03`: `6,006` / `6,613`; `Q04`: `246` chars (`244` LF) |

---

## 2. 5-Point Rubric Assessment

### Section A: Initial Entry, Onboarding Tour, Global Chrome, `Hilfe`, `Nachweise`/`To-do` & Route Parity

- **(a) Initial Orientation:**
  - **Strong desktop entry:** Opening `/` in a fresh context launches the 4-step `Kurze Orientierungstour` modal (`Orientierung · 1 / 4` to `4 / 4`), introducing Goal × Tool switching (`1 · Ziel & Werkzeug wählen` on Local; `1 · Wie arbeitest du heute?` on Live), the 4-step arc (`2 · Workshop in 4 klaren Schritten`), milestone tracking (`3 · Echte Ergebnis-Nachweise` on Local; `3 · Dein Fortschritt & Checkliste` on Live), and glossary/FAQ access (`4 · Hilfe, Glossar & FAQ`).
  - **Header icon ambiguity:** In the top-right header on both Local and Live, the trainer-stage link (`#/beamer`) renders as an icon-only `<a>` (`text: ""`, `aria-label="Zur Trainer-Bühne wechseln"`, `title="Zur Trainer-Bühne (#/beamer)"`, `36×36` on desktop). An unprepared participant has no visible label explaining what that icon does and can accidentally leave the participant workflow.
  - **Compressed mobile header & bottom nav (`390×844`):** On mobile, the sidebar step list (`01 · ...`–`04 · ...`) disappears and is replaced by a fixed bottom `<nav aria-label="Mobile Navigation">` with shortened labels lacking step numbers (`Ziel & Tool`, `Methoden`, `3 Stufen`, `Ziel-Labor` on Local; `Einstieg`, `Methoden`, `3 Stufen`, `Praxis-Pfade` on Live). Meanwhile, `Module`, `Hilfe`, and `Beamer` become unlabeled icons (`32×32` to `34×32`), `Nachweise 0/6` / `To-do 0/7` collapses to `0/6` / `0/7`, and tool pills shrink to `Web`, `Ordner`, `IDE`, `CLI` (`31–52×34`, yielding `20` touch targets `< 36px` tall on Local and `17` on Live).
- **(b) Step-by-Step Clarity:**
  - Tour navigation (`Weiter`, `Zurück`, `Überspringen`, `Verstanden`) is self-explanatory and persists `localStorage["v7-ccf-tour-seen-v1"] = "1"` so participants are not repeatedly interrupted; `Tour starten` inside `Hilfe` reliably restarts it.
  - Inside `Nachweise` (Local) and `To-do` (Live), each item provides an `Öffnen →` jump button directly to the relevant step, making self-navigation clear. However, `Fortschritt zurücksetzen` triggers an immediate wipe with zero confirmation (`confirmDialogMsg: null`), returning the user to `#/` and `0/6` / `0/7` on a single accidental tap.
- **(c) Human-Readability & Wording:**
  - The German tone across the tour, `Hilfe` modal, `Glossar (21)`, and `FAQ (8)` uses accessible everyday analogies (`Markdown`, `SCQA`, `Halluzination`).
  - Two wording contradictions occur in `Hilfe`:
    1. In Local `Hilfe` → `Tool-Matrix`, the header reads `"Konzept → Dein Tool (5 von 17 Einträgen · 13 Ziel-Tools)"` (or `"17 von 17 Einträgen · 13 Ziel-Tools"` when `Alle 13 Tools` is selected) while actually rendering **17** distinct tool cards.
    2. In `Hilfe` → `FAQ`, the text instructs `"Klicke im Tab „Schnellstart & .md“ auf „Alle Ordner als ZIP laden“"`, whereas the actual button label is `"Alle Workshop-Ordner als ZIP laden"`.
- **(d) Interactive Elements, Modals & Downloads:**
  - All `Hilfe` tabs (`Tour starten`, `Schnellstart & .md`, `Glossar (21)`, `FAQ (8)`, `Tool-Matrix` on Local; `Tour starten`, `Schnellstart & .md`, `Glossar (19)`, `FAQ (7)` on Live) switch cleanly.
  - `12 Fokus-Dokumente (.md)` (`61,816` bytes), `Alle 68 Dokumente (.md)` (`327,851` bytes), and `Alle Workshop-Ordner als ZIP laden` (`CCF-ai-workshop-main.zip`, `2,266,710` bytes, `540` entries) all download intact.
  - `Nachweise` starts at `0/6` (`0 %`) on Local with 6 quality-gate milestones (`1. Ziel & Werkzeug gewählt` through `6. Eigene Hausregel validiert`) and advances to `1/6` (`17 %`) when clicking `Weiter zu Schritt 02: Prompt-Methoden`. Live's `To-do 0/7` (`0 %`) uses 7 checklist items and advances to `1/7` (`14 %`).
  - `#/m/prompt-werkstatt-tierwelt` renders 100% identically to `/` on both Local and Live.
- **(e) Local vs. Live Parity:**
  - Major build drift in global chrome and modals: Local exposes `4` header tool pills (`Web-Chat`, `Desktop`, `IDE`, `CLI-Agent`), `Nachweise 0/6`, `Hilfe` `Glossar (21)`, `FAQ (8)`, and `Tool-Matrix`, plus `Langdock`. Live exposes an older `3`-tool build (`Web-Chat`, `Desktop & Ordner`, `Code-Agent`), `To-do 0/7`, `Glossar (19)`, `FAQ (7)`, no `Tool-Matrix`, and no `Langdock`.

---

### Section B: Step 01 (`01 · Ziel & Werkzeug wählen` / `01 · Einstieg & Werkzeug-Hilfe`)

- **(a) Initial Orientation:**
  - Local opens with a clear framing banner (`L1 · 45 Min. · 100 % öffentliche Daten`, `Vom ungefilterten Chat zum strukturierten KI-System`), 4 KPI tiles (`45 Min. Zeit-Format`, `12 Fokus-Dokumente`, `68 Öffentliche Artikel`, `0 Vertrauliche Daten`), an immediate `VORHER VS. NACHHER` hallucination contrast, and an explicit two-part onboarding selector (`1 · DEIN ZIEL FÜR HEUTE WÄHLEN` with `4 Ziele verfügbar` and `2 · DEIN WERKZEUG WÄHLEN`).
  - Live omits the entire `1 · DEIN ZIEL FÜR HEUTE WÄHLEN` section, displays `30 Min. Zeit-Format` in the KPIs, and jumps directly to `1 · WERKZEUG-HILFE WÄHLEN`.
- **(b) Step-by-Step Clarity:**
  - **`Web-Chat`** is the clearest path: `SCHRITT 1B · KOSTENLOSEN KI-CHAT IM 2. BROWSER-TAB ÖFFNEN`, `.md` explanation, and the `1 → 2 → 3` visual walkthrough (`Neuen Chat öffnen` → `Kompakt-Paket einfügen (Strg+V)` → `Quellen (datei.md) prüfen`) let any novice start without trainer help.
  - **`Desktop & Projects`** gives clear ZIP extraction instructions (`Windows: Rechtsklick → „Alle extrahieren…“`), `Alle Ordner (.zip)`, and `Alle 68 Dokumente (.md)`, but instructs participants to `"kopiere die Regeln in die Assistant-/Projekt-Anweisungen"` before Step 02/03 explains where those rules live.
  - **`IDE & Editor`** (Local only) has friction for beginners: clicking `"code-Befehl kopieren"` copies `"code stufe-3-obsidian-vault"` without showing the copied command in the UI or updating the button label to `"Kopiert!"`, assumes the user uses VS Code (`code` CLI) rather than Cursor/Windsurf/Antigravity, assumes the terminal is already inside the unzipped repository folder, and references `"sandbox/"` in the walkthrough without defining it.
  - **`CLI Code-Agent` / `Code-Agent`**: Local expands `Kein eigenes KI-Abo?` by default with valid commands (`npm install -g opencode-ai && opencode` and `node mcp-server/setup-client.mjs --client all --scope user --dry-run`) and references `verify_claim`. On Live, clicking `"Befehl kopieren"` under `Code-Agent` copies **`npm install -g @opencode/cli && opencode`**, directly contradicting the tip two lines below (`npx opencode-ai@latest`).
  - **Schedule Accordion (`Ablaufplan ansehen`)** undermines timing trust on both Local and Live due to inconsistent math and hardcoded wall-clock hours (`11:00–12:00`).
- **(c) Human-Readability & Wording:**
  - **Schedule arithmetic & wall-clock contradictions:**
    - Local header reads `"Ablaufplan ansehen (4 Phasen · 45 Min. (19 Min. Aha-Kern + 27 Min. Ziel-Labor))"` (`19 + 27 = 46`, phases `8 + 11 + 23 + 4 = 46 Min.`), yet KPI says `45 Min.` and expanded wall-clock labels still display `11:00–11:10`, `11:10–11:25`, `11:25–11:55`, `11:55–12:00` (`60 Min.`). The same hardcoded `11:00–12:00` wall-clock timestamps appear inside the `30 Min.` (`13 + 18 = 31 Min.`) and `90 Min.` (`38 + 53 = 91 Min.`) presets. Only `Selbstlernen` cleanly avoids wall-clock numbers (`Eigenes Tempo (ohne Uhrzeit)`).
    - Live KPI states `"30 Min. Zeit-Format"`, while `Ablaufplan ansehen` header states `"30 Min. (45 Min. Hands-on (15 Min. Aha-Kern + 30 Min. Praxis-Pfad))"` and expanded `30 Min.` phases sum to `10 + 15 + 30 + 5 = 60 Min.` (`11:00–12:00`), with no `45 Min.` preset button.
  - **Outdated 3-tool prose in Local Step 01:** The short text still reads `"ChatGPT oder Claude. Hier oben wählst du nur aus, ob du im Browser arbeitest (Web-Chat), einen entpackten Ordner öffnest oder im Terminal entwickelst"`, omitting `IDE & Editor` as well as `Langdock`, `Gemini`, and `Copilot`. `Desktop & Projects` also says `"Komplettdatei (.md)"` whereas the button says `"Alle 68 Dokumente (.md)"`.
- **(d) Interactive Elements, Prompts & Embedded Checks:**
  - **`VORHER VS. NACHHER` toggle:** Cleanly switches `1 / 2` (`Ohne Regeln (Halluzination)` — `15–20 Schneeleoparden; der Eintritt kostet 18 € pro Tag`) ↔ `2 / 2` (`Mit Regeln & Wissen (Belegt)` — `Nicht in den vorliegenden Dokumenten enthalten` + `Eisbär hat 42 Zähne (eisbaer.md)`).
  - **20s Explainer:** `Einstieg in 20 Sekunden erklärt` and `Kurztext-Hilfe` sit side by side as if offering Audio vs. Text, yet `audioElements: []` (no `<audio>` tag in DOM) and clicking either opens the same 2-sentence inline summary (`Kurztext schließen` on Local; `Text ausblenden` on Live).
  - **Inline Glossary Chips:** `Prompt?`, `.md-Datei?`, and `Git vs. ZIP?` are hover/focus `[role="tooltip"]` buttons (`data-state="closed"`). Clicking/tapping without hovering opens nothing (`dlgCount: 0`), whereas `Welches Werkzeug passt zu mir?` (Local) opens a helpful inline 4-line guide and `Alle Begriffe & FAQ öffnen` opens `Hilfe`.
  - **External Chat Links (`SCHRITT 1B`):** Local renders 5 valid `target="_blank" rel="noopener noreferrer"` links (`chatgpt.com`, `claude.ai`, `app.langdock.com`, `gemini.google.com`, `copilot.microsoft.com`). Live renders 4 links (omitting Langdock).
- **(e) Local vs. Live Parity:**
  - Live lacks the 4 Goals (`Besseres Prompting`, `Anwendung bauen`, `Präsentationen bauen`, `KI im Arbeitsalltag`), lacks `IDE & Editor`, lacks `Langdock`, lacks `Welches Werkzeug passt zu mir?`, uses `30 Min.` vs `45 Min.` default, copies broken `@opencode/cli` instead of `opencode-ai`, and mixes `30 Min.` / `45 Min.` / `60 Min.` in the schedule.

---

### Section C: Step 02 (`02 · Aha-Kern 1: Prompt-Methoden`)

- **(a) Initial Orientation:**
  - Page opens cleanly with the active goal/tool context badge, step header (`SCHRITT 02 · AHA-KERN 1`), 6 helper chips (`CO-STAR?`, `Guardrails?`, `Prompt?`, `Halluzination?`, `Priming?`, `Methode erklärt`), 20s explainer, and the `Web-Chat Ablauf in 4 Klicks` visual strip.
  - Switching the global tool selector adapts the Step 02 guidance cleanly per mode: `IDE` and `CLI-Agent` (Local) / `Code-Agent` (Live) hide the 4-click Web-Chat animatic completely, all non-Web-Chat modes adapt the `STEUERUNGS-EBENEN` rules callout (`AGENTS.md` / `Projects` / `Gems` / `Skills` + `MCP`: e.g., `"In Claude Cowork lädt AGENTS.md automatisch aus dem entpackten Ordner; in ChatGPT / Claude.ai Projects oder Gemini Gems fügst du die Regeln einmal in die Projekt-Anweisungen ein."`, `"In Google Antigravity, Cursor, Windsurf & VS Code steuern AGENTS.md..."`, `"CLI Code-Agent kombiniert AGENTS.md, Skills und MCP-Werkzeuge..."`), and `Desktop` / `Desktop & Ordner` intentionally labels its optional browser fallback `"Alternativer Web-Chat-Test in 4 Klicks"`.
- **(b) Step-by-Step Clarity:**
  - For `Web-Chat`, the 4-click flow (`01 Kopieren` → `02 Neuer Chat` → `03 Einfügen` → `04 Prüfen`) is crisp and intuitive.
  - Minor friction comes from:
    1. Glossary chips and `Methode erklärt` failing to open on click/tap (hover-only).
    2. Static character counts and hint-to-button label mismatches: on Local, Web-Chat prose cites `"Kompakt-Paket (~5.300 Zeichen)"` (matching the button label, though `CO-STAR`/`Few-Shot`/`RISEN + CoT` actually copy `6,072`–`6,131` chars), while the `Desktop` hint line cites `"Texte als .md laden"` (actual button: `"6 Kompakt-Texte (.md)"`). On Live, Web-Chat prose cites `"Kompakt-Paket (~5.500 Zeichen)"`, directly contradicting Live's actual button label `"Kompakt-Paket (~6.000 Zeichen)"`.
- **(c) Human-Readability & Wording:**
  - The explanations of `Zero-Shot`, `CO-STAR`, `Few-Shot`, `RISEN + CoT`, the 5 control layers (`1 · User-Prompt` 20% → `5 · Tools & MCP` 100%), and the `Kontext-Tank` forgetting curve are clear, concrete, and tailored to business participants.
  - **Table label contradiction in `Übersetzungsmatrix „Konzept → Dein Tool“` (Local only):** Both the accordion header (`"Übersetzungsmatrix „Konzept → Dein Tool“ (alle 13 Ziel-Tools entlang der 5 Ebenen)"`), the filter button (`"Alle 13 Tools"`), and the expanded header (`"17 von 17 Einträgen · 13 Ziel-Tools"`) state **13** tools while displaying **17** distinct tool rows (`ChatGPT (Web)` through `Gemini CLI`).
- **(d) Interactive Elements, Prompts & Embedded Checks:**
  - **4-Click Animatic:** `01 Kopieren`–`04 Prüfen` and `Abspielen` auto-advance reliably.
  - **4 Prompt Methods (`Zero-Shot`, `CO-STAR`, `Few-Shot`, `RISEN + CoT`):** `Nur Prompt` and `Kompakt-Paket` copy exact prompts + 6 `=== *.md ===` articles (`5,417` / `6,072` / `6,085` / `6,131` chars), trigger the confirmation toast (`"Kopiert — Prompt (oben) + Kompakt-Texte (...) kopiert"`), and update `Nachweise` (`0/6` → `1/6`) / `To-do` (`0/7` → `1/7`). `6 Kompakt-Texte (.md)` downloads `methoden-kompakt-texte.md` (`5,581` bytes).
  - **CO-STAR Pills:** Clicking `Context`, `Objective`, `Style`, `Tone`, `Audience`, `Response` toggles `aria-pressed="true"` and highlights the matching preview line.
  - **`Chat-Basis-Regeln` & Modal:** `Chat-Basis-Regeln kopieren` copies the 4-rule `596`-char block; `Regeltext ansehen` opens the modal with the full text and `Basis-Regeln kopieren`.
  - **5-Layer Stack & `Kontext-Tank`:** Clicking layers `1`–`5` updates `LEBENSDAUER`, `DURCHSETZUNG`, `KONKRET IM WORKSHOP`. `Kontext-Tank` advances `18%` (`#1 AKTIV`) → `42%` → `68%` → `90%` (`#4 VERDRÄNGT!`) → `100%` (`#5 VERDRÄNGT!`), jumps via `#1`–`#5`, and resets cleanly via `+ Neuer Chat`.
  - **`Übersetzungsmatrix` (Local):** Filters cleanly between `Passend zu meinem Modus (Web-Chat)` (`5 von 17`) and `Alle 13 Tools` (`17 von 17`).
- **(e) Local vs. Live Parity:**
  - Live runs the older 3-tool build, lacks `Übersetzungsmatrix „Konzept → Dein Tool“`, uses `To-do 0/7` and `15+30 Min.` framing, labels buttons `Kompakt-Paket (~6.000 Zeichen)` while prose says `~5.500 Zeichen`, omits Gemini in `Schritt 2` (`"ChatGPT, Claude oder Copilot"` vs Local `"ChatGPT, Claude, Gemini oder Copilot"`), and uses `stufe-1-chaos/docs/` in the Desktop hint instead of `stufe-1-chaos/`.

---

### Section D: Step 03 (`03 · Aha-Kern 2: 3 Stufen & Wissen`)

- **(a) Initial Orientation:**
  - Strong conceptual layout (`Stufe 1: Chaos (Ohne Regeln)` → `Stufe 2: Klare Regeln & Skills (Harness)` → `Stufe 3: Vernetztes Wissen (Markdown-RAG)`), clear badge context, and 25s guide (`Das 3-Stufen-Experiment in 25 Sekunden`).
  - Under `Desktop` / `Desktop & Ordner`, `"Ordner öffnen: stufe-1-chaos/"` is rendered as a non-interactive `<span>` styled identically to neighboring clickable chips (`ZIP laden`, `Regeln kopieren (Projects)`), misleading participants into clicking it.
- **(b) Step-by-Step Clarity:**
  - The core 3-stage experiment, `Fangfrage-Schutz im Ablauf`, `Mini-Debug (2 Min.)`, `38/42 Zähne` comparison, and 4 Focus Questions with hidden `Verifizierte Lösung (nach dem Testen öffnen)` create an effective discovery loop.
  - Four clarity rough edges slow down self-guided learners:
    1. **10 vs. 12 focus-article contradiction:** Stage 1 renders `10` `Fokus-Dateien:` badges (`arktis.md`..`korallenriff.md`), and clicking `Kompakt-Texte kopieren (~5.900 Z.)` copies `5,934` chars whose prompt header says `"Lies die folgenden 12 Fokus-Artikel still ein..."` while embedding only **10** `=== *.md ===` blocks. Meanwhile, `12 Fokus-Artikel (.md)` downloads `61,576` bytes containing **12** full articles (`alpenmurmeltier.md` & `winterschlaf.md` included), and `Alle Texte & Regeln (2)` calls the compact bundle `"Alle 10 Fokus-Dateien"` (`~5.700 Zeichen` Local / `~5.749 Zeichen` Live) and the `.md` file `"~60.451 Zeichen"`.
    2. **`38/42 Zähne` toggle vs. Question `04`:** Toggling `Original: 42 Zähne` updates the preview snippet and `Antwort-Vergleich aufdecken`, but Question `04` (`Frage + Test-Ausschnitt` / `Frage + 38-Zähne-Text`, initially hidden behind `Alle 4 Fragen anzeigen`) always copies `38 Zähne`.
    3. **`Kurze Selbst-Reflexion (1 Klick)` disconnect (Local):** Toggling all 3 pills (`KI hat geraten`, `Regel hat abgelehnt`, `Belege sauber verknüpft`) changes `0/3 markiert` → `3/3 markiert`, yet leaves Local `Nachweise` unchanged (whereas Live advances `To-do 1/7` → `2/7`).
    4. **Knowledge Graph walk numbering & typo:** Header reads `"Wie Stufe 3 gezielt navigiert (Frage 2 · Korallenriff-Kette (6 Artikel))"` (with a double closing parenthesis `))` typo), buttons say `Schritt 1/4`..`Schritt 4/4`, while `Schritt 3/4` displays `Sprung 1/5 · [[seeanemonen]]` and `Schritt 4/4` displays `Sprung 2/5 · [[symbiose]]`.
- **(c) Human-Readability & Wording:**
  - Feedback in `Mini-Debug` and the 4 focus-question `Worauf achten:` hints are sharp, concise, and pedagogically sound.
  - Hover-only glossary chips (`Guardrails?`, `Wissensbasis?`, `Markdown-RAG?`) share the same click-to-close friction as Steps 01–02.
- **(d) Interactive Elements, Prompts & Embedded Checks:**
  - **Stage 1–3 Cards across Tools:** All copy buttons, `Alle Texte & Regeln (2)` modal, `12 Fokus-Artikel (.md)` (`61,576` bytes), `ZIP laden` (`CCF-ai-workshop-main.zip`), `Alle 68 (.md)` (`alle-68-artikel-wissensbasis.md`), and `cd stufe-1-chaos`..`stufe-3-obsidian-vault` copy chips (`IDE`/`CLI-Agent`) function without errors.
  - **`Fangfrage-Schutz im Ablauf`:** `Stufe 1` / `Stufe 2` / `Stufe 3` stepper accurately updates `2 · PRÜF-SCHICHT` and `3 · KI-ANTWORT`.
  - **`Mini-Debug (2 Min.)`:** Wrong distractor pair yields targeted rejection reasons (`"Schätzwerte erzeugen Halluzinationen..."`, `"Stilregel — schützt nicht..."`, `"Tipp: Es fehlen genau 2 Regeln..."`); correct pair yields `"Regel repariert!"`, exposes `Reparierte Regel kopieren`, and marks Local `Nachweise` item `3. Guardrail-Debug gelöst`.
  - **`38/42 Zähne` & 4 Focus Questions:** `Alle 4 Fragen anzeigen` reveals `01`–`04`; all 4 `Verifizierte Lösung` panels open cleanly; `Q01`–`Q04` copy valid prompts/bundles.
  - **Knowledge Graph (`Interaktive Wissenskarte · 68 Dateien & 221 Querverweise`):** Filters (`Alle 68` `68/68`, `Räume 5` `5/68`, `Konzepte 15` `15/68`, `Arten 48` `48/68`), `Suchpfad` search, `Graph` / `Liste` toggle, node inspection (`STECKBRIEF (METADATEN)`, `[[Seeanemonen]]`), and `Quelltext (YAML)` (`source_file: "raw/anemonenfische.md"`, `tags: [tierart, fisch, korallenriff]`) all work cleanly.
- **(e) Local vs. Live Parity:**
  - **Critical clipboard bloat on Live:** Live embeds full uncondensed Wikipedia articles in Step 03 Stage 3 `Turn 2: Fokus-Artikel` (**`29,024` chars** vs Local `3,489` chars) and Focus Questions `Q01` Stage 1 (**`19,414` chars** vs Local `2,508` chars) / Stage 2 & 3 (**`20,021` chars** vs Local `3,115` chars) and `Q02` Stage 1 (**`29,315` chars** vs Local `3,780` chars — the single largest Stage 1 Focus-Question payload) / Stage 2 & 3 (**`29,922` chars** vs Local `4,387` chars), plus longer Stage 3 `Regeln + Kompakt-Index + Texte` (`8,822` vs `7,522` chars) and `Turn 1` (`3,247` vs `1,947` chars). Meanwhile, `Q03` stays identical (`6,006` Stage 1; `6,613` Stage 2/3) and `Q04` copies `246` chars (`244` LF-normalized) on both environments. This bloat risks Web-Chat truncation and early context-window saturation for live-URL participants.
  - Live also reflects the older 3-tool chrome (`To-do 0/7` counting `Selbst-Reflexion`, `Desktop & Ordner`, `Code-Agent`, `Kurztext lesen`).

---

## 3. Consolidated Structured Findings & Actionable Adaptations

| ID | Severity | Scope / Location | Exact German UI Quote / Observed State | Participant Friction | Recommended Adaptation |
|---|---|---|---|---|---|
| `M2-01` | **High** | Live · Step 01 (`Code-Agent`) | `"Befehl kopieren"` → clipboard `npm install -g @opencode/cli && opencode`; tip two lines below: `"npx opencode-ai@latest"` | Live participants copying the CLI setup command receive a broken/wrong npm package (`@opencode/cli`) that directly contradicts the tip below it. | Redeploy Live from the current Local build (or update Live's copied command to `npm install -g opencode-ai && opencode`). |
| `M2-02` | **High** | Live vs. Local · Step 03 (`Stufe 3`, `Frage 01` & `Frage 02`) | Live `Q02` Stage 1 copies `29,315` chars (vs Local `3,780`) & Stage 2/3 copies `29,922` chars (vs Local `4,387`); Live `Q01` Stage 1 copies `19,414` chars (vs Local `2,508`) & Stage 2/3 copies `20,021` chars (vs Local `3,115`); Live `Turn 2: Fokus-Artikel` copies `29,024` chars (vs Local `3,489`); Live `Regeln + Kompakt-Index + Texte (~8.000 Z.)` copies `8,822` chars (vs Local `7,522`) | Live embeds full uncondensed Wikipedia texts in Stage 3, `Q01`, and `Q02`, exceeding comfortable Web-Chat paste sizes and risking silent truncation or context overflow. | Redeploy GitHub Pages from the current Local compact-summary build so Stage 3, `Q01`, and `Q02` payloads stay within `~2.5k–7.5k` chars. |
| `M2-03` | **High** | Local & Live · Step 01 (`Ablaufplan ansehen`) | Local KPI: `"45 Min. Zeit-Format"` vs `"Ablaufplan ansehen (4 Phasen · 45 Min. (19 Min. Aha-Kern + 27 Min. Ziel-Labor))"` (`8+11+23+4 = 46 Min.`) & wall-clock `"11:00–11:10 ... 11:55–12:00"` (`60 Min.`) shown for `30/45/60/90 Min.` presets. Live KPI: `"30 Min."` vs `"30 Min. (45 Min. Hands-on (15 Min. Aha-Kern + 30 Min. Praxis-Pfad))"` & `10+15+30+5 = 60 Min.` | Arithmetic mismatches (`45` vs `46` vs `11:00–12:00`; Live `30` vs `45` vs `60`) confuse timeboxing for self-paced and live-workshop participants. | Make `Aha-Kern + Ziel-Labor === total` (`12+18 = 30`, `18+27 = 45`, `37+53 = 90`), compute wall-clock timestamps dynamically (or show them only for `60 Min.`), and redeploy Live. |
| `M2-04` | **High** | Live vs. Local · Global & Steps `01`–`03` | Live has 3 tools (`Web-Chat`, `Desktop & Ordner`, `Code-Agent`), no 4 Goals, `To-do 0/7`, `30 Min.`/`15+30 Min.`, `Glossar (19)`/`FAQ (7)`, no `Tool-Matrix`, no `Langdock`, and lacks Step 02 `Übersetzungsmatrix` | Unprepared participants opening `etroxtaran.github.io/CCF-ai-workshop/` see a materially older workshop structure that diverges from Local and trainer materials. | Build and publish the current Local app to `gh-pages` so Live and Local share identical goals, tools, modals, and payloads. |
| `M2-05` | **High** | Local & Live · Steps `01`, `02` & `03` (Glossary & Method Chips) | Step 01: `Prompt?`, `.md-Datei?`, `Git vs. ZIP?`; Step 02: `CO-STAR?`, `Guardrails?`, `Prompt?`, `Halluzination?`, `Priming?`, `Methode erklärt`; Step 03: `Guardrails?`, `Wissensbasis?`, `Markdown-RAG?` (`data-state="closed"` on click) | Styled as `<button>` elements with `?`/`(i)` cues, yet bound only to hover tooltips — clicking/tapping dismisses or does nothing, leaving mobile users and desktop clickers without definitions. | Convert all glossary/method chips to click-toggling Popover/Disclosure controls that open on click/tap as well as hover/focus. |
| `M2-06` | **Medium** | Local & Live · Header (Desktop & Mobile `390×844`) | Desktop Beamer `<a>` (`#/beamer`) has `text: ""` (`title="Zur Trainer-Bühne (#/beamer)"`). Mobile `390×844`: `Module` (`32×32`), `Hilfe` (`34×32`), `Beamer` (`32×32`), `Web`/`Ordner`/`IDE`/`CLI` (`31–52×34`) have `< 36px` height & no text labels | Participants can accidentally open the trainer stage via the unlabeled icon or struggle to recognize `Module`/`Hilfe` on mobile; touch targets fall under 44×44px guidelines. | Add a visible label (`Bühne`) or move the Beamer link to `Module`/footer; enlarge mobile header buttons to `>= 40px` or group secondary actions in a mobile menu. |
| `M2-07` | **Medium** | Local & Live · `Nachweise` / `To-do` Modal | `"Fortschritt zurücksetzen"` (`confirmDialogMsg: null`) | A single click/tap immediately erases all progress, reflections, and validated gates without warning and jumps back to Step 01. | Require an explicit confirmation step (inline two-step `"Wirklich zurücksetzen?"` or confirm dialog) before clearing state. |
| `M2-08` | **Medium** | Local · `Hilfe` → `Tool-Matrix` & Step 02 `Übersetzungsmatrix` | `"Übersetzungsmatrix „Konzept → Dein Tool“ (alle 13 Ziel-Tools entlang der 5 Ebenen)"`, `"Alle 13 Tools"`, `"Konzept → Dein Tool (17 von 17 Einträgen · 13 Ziel-Tools)"` | Both locations promise **13** tools while rendering **17** distinct tool rows/cards (`ChatGPT (Web)` through `Gemini CLI`). | Align labels to `17 Ziel-Tools` / `Alle 17 Tools` (or clarify `13 Plattformen · 17 Einträge`). |
| `M2-09` | **Medium** | Local · Step 01 (`IDE & Editor`) | Button `"code-Befehl kopieren"` copies `"code stufe-3-obsidian-vault"` with no command preview and no `"Kopiert!"` label update; walkthrough cites `"sandbox/"` | Non-VS-Code users (Antigravity/Cursor/Windsurf) and users not already `cd`'d into the unzipped folder get an unexplained `code` command; `"sandbox/"` is undefined in Step 01. | Show `code stufe-3-obsidian-vault` inline, add `"Kopiert!"` feedback plus a note for Cursor/Windsurf/Antigravity, and clarify `"sandbox/"` (e.g., `"Ziel-Ordner ab Schritt 04"`). |
| `M2-10` | **Medium** | Local & Live · Step 01 & Step 02/03 (20s/25s Explainers) | Step 01: `"Einstieg in 20 Sekunden erklärt"` + `"Kurztext-Hilfe"`; Step 02: `"Prompt-Methoden in 20 Sekunden erklärt"` + `"Kurztext-Hilfe"`; Step 03: `"Das 3-Stufen-Experiment in 25 Sekunden"` + `"Kurztext-Hilfe"` (`audioElements: []`) | Two adjacent controls look like separate Audio vs. Text options, yet no `<audio>` element exists and both toggle the same short text (with TTS silent/unavailable in many environments). | Label clearly as `"Vorlesen (20 Sek.)"` when speech synthesis is available or merge into a single `"Kurz-Einstieg (20 Sek.)"` toggle. |
| `M2-11` | **Medium** | Local & Live · Step 03 (`Stufe 1` + Modal) | `Fokus-Dateien:` (`10` pills) vs clipboard `"Lies die folgenden 12 Fokus-Artikel still ein..."` (`10` blocks, `5,934` chars) vs modal `"Alle 10 Fokus-Dateien"` (`~5.700 Zeichen` Local / `~5.749` Live) vs button `~5.900 Z.` vs `.md` `"~60.451 Zeichen"` (`61,576` bytes, `12` articles) | Mixing `10` vs `12` articles and inconsistent char/byte estimates confuses participants checking whether files were cut off. | Change the clipboard header to `"Lies die folgenden 10 Fokus-Artikel..."` (or include `alpenmurmeltier.md` & `winterschlaf.md`) and compute displayed char/byte counts dynamically. |
| `M2-12` | **Medium** | Local & Live · Step 02 (`Kompakt-Paket` buttons & hints) | Local Web-Chat prose & buttons: `"Kompakt-Paket (~5.300 Zeichen)"` (while copying `5,417`–`6,131` chars); `Desktop` hint cites `"Texte als .md laden"` (button: `"6 Kompakt-Texte (.md)"`); Live Web-Chat prose `"„Kompakt-Paket (~5.500 Zeichen)“"` vs Live button `"Kompakt-Paket (~6.000 Zeichen)"` | Static character counts diverge from actual clipboard sizes (`CO-STAR`..`RISEN` are `6,072`–`6,131` chars), Live's prose contradicts its own button (`~5.500` vs `~6.000`), and the `Desktop` hint names `"Texte als .md laden"` instead of `"6 Kompakt-Texte (.md)"`. | Render method-specific character counts (`~5.400`–`~6.100 Z.`) and align Web-Chat and Desktop hint text to exact button labels. |
| `M2-13` | **Medium** | Local & Live · Step 03 (`Desktop` / `Desktop & Ordner`) | `"Ordner öffnen: stufe-1-chaos/"` (`<span>`) beside `"ZIP laden"` (`<a>`) & `"Regeln kopieren (Projects)"` (`<button>`) | Styled identically to an action chip, causing participants to click `"Ordner öffnen: stufe-1-chaos/"` expecting a folder picker or copy toast. | Style distinctly as a read-only path badge (`Ziel-Ordner: stufe-1-chaos/`) or make clicking copy the path with toast feedback. |
| `M2-14` | **Low** | Local · Step 03 (`Kurze Selbst-Reflexion`) | `"0/3 markiert"` → `"3/3 markiert"` leaves `Nachweise 1/6` unchanged (vs Live `To-do 1/7` → `2/7`) | Marking all 3 reflection pills has no effect on Local's `Nachweise` progress, making the block feel disconnected from completion tracking. | Clarify `"Optionaler Selbst-Check (ohne Nachweis-Pflicht)"` or link it to a `Nachweise` milestone. |
| `M2-15` | **Low** | Local & Live · Step 03 (`LIVE-VORSCHAU · FRAGE 4`) | `"Original: 42 Zähne"` toggle vs Question `04` (`"Frage + Test-Ausschnitt"` / `"Frage + 38-Zähne-Text"`, always `38 Zähne`) | Toggling `Original: 42 Zähne` in the preview does not update Question `04`, and `Q04` is initially collapsed behind `Alle 4 Fragen anzeigen`. | Sync Question `04` with the `38/42 Zähne` toggle or clarify `"Beispiel-Prompt unten nutzt fest 38 Zähne"`. |
| `M2-16` | **Low** | Local & Live · Step 03 (`Wissens-Graph` Walk) | `"Wie Stufe 3 gezielt navigiert (Frage 2 · Korallenriff-Kette (6 Artikel))"` · buttons `"Schritt 1/4"`..`"Schritt 4/4"` · body `"Sprung 1/5"` / `"Sprung 2/5"` | Double closing parenthesis `))` typo in the header plus three different denominators (`6 Artikel`, `1/4..4/4`, `1/5..2/5`) disorient learners following the guided path. | Fix the double `))` typo (`(Frage 2 · Korallenriff-Kette, 6 Artikel)`) and standardize to one consistent step count across header, buttons, and jump cards (`Schritt 1/4`..`4/4`). |
| `M2-17` | **Low** | Local & Live · `Hilfe` → `FAQ` vs `Schnellstart & .md` | FAQ: `"Klicke im Tab „Schnellstart & .md“ auf „Alle Ordner als ZIP laden“"` vs button `"Alle Workshop-Ordner als ZIP laden"` | Minor wording mismatch when participants scan for the exact button text. | Update FAQ text to `"Alle Workshop-Ordner als ZIP laden"`. |
| `M2-18` | **Low** | Local · Step 01 (`Web-Chat` Short Text & `Desktop & Projects`) | Short text: `"ChatGPT oder Claude. Hier oben wählst du nur aus, ob du im Browser arbeitest (Web-Chat), einen entpackten Ordner öffnest oder im Terminal entwickelst"`; `Desktop & Projects`: `"Komplettdatei (.md)"` vs `"Alle 68 Dokumente (.md)"` | Omits `IDE & Editor`, `Langdock`, `Gemini`, `Copilot`, and references rules before Step 02/03 introduces them. | Mention all 4 tool modes & all 5 Web-Chat providers, match `"Alle 68 Dokumente (.md)"`, and note `"Regeln folgen in Schritt 02/03"`. |
| `M2-19` | **Low** | Local & Live · Mobile `390×844` Bottom Nav | `<nav aria-label="Mobile Navigation">` labels: `"Ziel & Tool"`, `"Methoden"`, `"3 Stufen"`, `"Ziel-Labor"` (Local) / `"Einstieg"`, `"Methoden"`, `"3 Stufen"`, `"Praxis-Pfade"` (Live) | Drops step numbers (`01`–`04`) shown on desktop, making verbal trainer cues (`"Geht in Schritt 02"`) slightly harder to match on phones. | Prefix compact step numbers (`01 · Ziel`, `02 · Methoden`, `03 · Stufen`, `04 · Labor`). |
| `M2-20` | **Low** | Live vs. Local · Step 02 (`4-Klicks` & `Desktop` Hint) | Live `Schritt 2`: `"ChatGPT, Claude oder Copilot"` (Local includes `Gemini`); Live `Desktop` hint: `stufe-1-chaos/docs/` (Local: `stufe-1-chaos/`) | Live omits Gemini in Step 02 despite listing it in Step 01 and adds an inconsistent `/docs/` suffix. | Sync Live with the current Local build. |

---

## 4. Coverage Matrix

| Area / Route / Feature | Local (`127.0.0.1:3777`) | Live (`etroxtaran.github.io`) | Viewports Tested | Telemetry & Payload Status |
|---|---|---|---|---|
| `/` (Entry & Step 01) | Exercised | Exercised | `1440×900`, `390×844` | `200`, `0` errors, `0` overflow |
| `#/m/prompt-werkstatt-tierwelt` (Route Parity) | Exercised (`EXACT_MATCH` vs `/`) | Exercised (`EXACT_MATCH` vs `/`) | `1440×900` | `200`, `0` errors |
| Onboarding Tour (`Orientierung · 1/4–4/4`, `Weiter`, `Zurück`, `Überspringen`, `Verstanden`, `Tour starten`) | Exercised | Exercised | `1440×900` | Persists `v7-ccf-tour-seen-v1 = "1"` |
| Global Header & Mobile Nav (`390×844`), Beamer icon (`#/beamer`), Tool Pills | Exercised (4 pills) | Exercised (3 pills) | `1440×900`, `390×844` | `0` overflow; `< 36px` mobile targets logged (`M2-06`) |
| `Hilfe` Modal (`Tour starten`, `Schnellstart & .md`, `Glossar`, `FAQ`, `Tool-Matrix` Local) | Exercised (all 5 tabs) | Exercised (all 4 tabs) | `1440×900`, `390×844` | `fokus-dokumente-12.md` (`61,816` B), `alle-68-dokumente-wissensbasis.md` (`327,851` B), ZIP (`2,266,710` B) |
| `Nachweise 0/6` (Local) / `To-do 0/7` (Live) & `Fortschritt zurücksetzen` | Exercised | Exercised | `1440×900`, `390×844` | Progression + unconfirmed reset verified (`M2-07`) |
| Step 01: Hero KPIs, `VORHER VS. NACHHER` (`1/2 ↔ 2/2`), 20s Explainer, Glossary Chips | Exercised | Exercised | `1440×900`, `390×844` | Hover-only chips logged (`M2-05`); no `<audio>` (`M2-10`) |
| Step 01: 4 Goals (`Besseres Prompting`, `Anwendung bauen`, `Präsentationen bauen`, `KI im Arbeitsalltag`) | Exercised (all 4) | Verified absent on Live | `1440×900` | Parity delta logged (`M2-04`) |
| Step 01: Tool Modes (`Web-Chat`, `Desktop & Projects`/`Desktop & Ordner`, `IDE & Editor` Local, `CLI Code-Agent`/`Code-Agent`) + `SCHRITT 1B` Links/Commands/Downloads | Exercised (all 4 Local, all 3 Live) | Exercised (all 3) | `1440×900` | Local `opencode-ai` vs Live `@opencode/cli` (`M2-01`), `code stufe-3-obsidian-vault` (`M2-09`) |
| Step 01: `Ablaufplan ansehen` (`Selbstlernen`, `30 Min.`, `45 Min.` Local, `60 Min.`, `90 Min.`) | Exercised (all 5 presets) | Exercised (all 4 presets) | `1440×900` | Arithmetic & wall-clock mismatches logged (`M2-03`) |
| Step 02 (`#/methods` & `#/m/prompt-werkstatt-tierwelt/methods`): Glossary Chips, 20s Explainer, 4-Click Animatic | Exercised (both routes) | Exercised (both routes) | `1440×900`, `390×844` | Route parity `EXACT_MATCH`; `0` errors |
| Step 02: All 4 Prompt Methods (`Zero-Shot`, `CO-STAR`, `Few-Shot`, `RISEN + CoT`), CO-STAR Pills, `.md` Download | Exercised (clipboard + `.md`) | Exercised (clipboard + `.md`) | `1440×900` | `68` / `5,417`–`6,131` chars; `methoden-kompakt-texte.md` (`5,581` B); hint mismatch (`M2-12`) |
| Step 02: `Chat-Basis-Regeln` + Modal, 5-Layer Stack (`1–5`), `Kontext-Tank` (`#1–#5` & `+ Neuer Chat`), `Übersetzungsmatrix` (Local) | Exercised (all controls & 17 rows) | Exercised (all controls except absent matrix) | `1440×900` | `596`-char rules; `13` vs `17` matrix mismatch (`M2-08`) |
| Step 03 (`#/stages` & `#/m/prompt-werkstatt-tierwelt/stages`): Glossary Chips, 25s Explainer, Stage 1–3 Cards across Tool Modes | Exercised (both routes, all tools) | Exercised (both routes, all tools) | `1440×900`, `390×844` | `fokus-korpus-12-artikel.md` (`61,576` B); `10` vs `12` (`M2-11`); non-interactive `<span>` (`M2-13`); Live `29,024`-char bloat (`M2-02`) |
| Step 03: `Fangfrage-Schutz`, `Mini-Debug (2 Min.)` (wrong & right pairs), `38/42 Zähne` Toggle, 4 Focus Questions (`01–04`) + Verified Solutions | Exercised | Exercised | `1440×900` | Live `Q01` (`19,414`/`20,021`) & `Q02` (`29,315`/`29,922`) bloat (`M2-02`); `Q03` (`6,006`/`6,613`); `Q04` (`246` chars / `244` LF; `M2-15`) |
| Step 03: `Kurze Selbst-Reflexion (1 Klick)` & 68-Article Knowledge Graph (`Alle 68`, `Räume 5`, `Konzepte 15`, `Arten 48`, Search, `Graph`/`Liste`, Walk, YAML) | Exercised | Exercised | `1440×900`, `390×844` | `Nachweise` vs `To-do` delta (`M2-14`); walk `"Korallenriff-Kette (6 Artikel))"` & `Schritt 3/4` vs `Sprung 1/5` (`M2-16`) |
