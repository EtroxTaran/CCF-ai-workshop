# Blind Review Report: Module Hub (`#/hub`)

## 1. Scenario & Environment Metadata

| Attribute | Local Environment | Live Environment |
|---|---|---|
| **Route URL** | `http://127.0.0.1:3777/#/hub` | `https://etroxtaran.github.io/CCF-ai-workshop/#/hub` |
| **Browser Context** | Fresh `browser.newContext()` per viewport (clean storage & cookies) | Fresh `browser.newContext()` per viewport (clean storage & cookies) |
| **Viewports Tested** | Desktop `1440×900`, Mobile `390×844` | Desktop `1440×900`, Mobile `390×844` |
| **Runtime Telemetry** | `0` console errors, `0` warnings, `0` page errors, `0` HTTP `>= 400` responses, `0` failed requests | `0` console errors, `0` warnings, `0` page errors, `0` HTTP `>= 400` responses, `0` failed requests |
| **Document Title & Lang** | `Prompt-Werkstatt · virtual7 CCF Clustertag` (`<html lang="de">`) | `Prompt-Werkstatt · virtual7 CCF Clustertag` (`<html lang="de">`) |

**Blind Integrity Confirmation:** This review relies exclusively on rendered DOM text, computed layout geometry, and interactive browser observations from an unprepared participant perspective. No repository source files, trainer guides, or test files were read, and no existing workshop files were modified.

---

## 2. 5-Point Rubric Assessment

### (a) Initial Orientation

Opening `#/hub` immediately communicates that the page is a modular AI workshop library backed by safe example data. The hero displays the eyebrow `"Erweiterbare Lernplattform · 100 % öffentliche / synthetische Daten"` above the heading `"Wähle dein Workshop-Modul"`, followed by two active module cards (`L1` and `L2`) and an expansion roadmap section. No onboarding tour or modal opens automatically on `#/hub` (unlike `#/`, which launches `"Kurze Orientierungstour"` after roughly one second).

Three orientation gaps affect first-time participants arriving directly on `#/hub`:

- **No Hub-level Help or Level Legend:** The header shows the `virtual7` logo, `"Workshop-Hub · Modulare Themenbibliothek"`, and a `"Standard-Workshop"` button (`#/m/prompt-werkstatt-tierwelt`), while `Hilfe`, `Nachweise` / `To-do`, and a standalone `Beamer` link are absent. Because the filter pills only say `"Alle Level"`, `"L1"`, `"L2"`, and `"L3"`, an unprepared user has no plain-language explanation of what `L1` versus `L2` versus `L3` means before entering a module.
- **Duplicate L1 Entry Ambiguity:** The top-right `"Standard-Workshop"` link points to `#/m/prompt-werkstatt-tierwelt`, whereas the L1 card's `"Modul starten"` button points to `#/`. Both routes open the exact same L1 workshop, yet nothing on `#/hub` tells a newcomer that the `L1` card is the `"Standard-Workshop"`.
- **Mobile Header Overflow (`390×844`):** On both Local and Live at `390×844`, `<header>` is fixed at `56px` height, forcing `"Workshop-Hub · Modulare Themenbibliothek"` into a `117.78px`-wide column that wraps onto 3 lines (`60px` tall, `y: -2.5` to `57.5`) and protrudes outside the header bar. Beside it, `"Standard-Workshop"` (`<a>`, `h-8`, `32px` height, `scrollHeight: 31`, `clientHeight: 30`) squeezes its inner `<span>` (`65.625px` wide) onto 2 lines (`32px` height, `scrollHeight: 32`, `clientHeight: 32`).

### (b) Step-by-Step Clarity

On desktop (`1440×900`), the page follows a clear top-to-bottom sequence: hero banner, filter bar, active module cards with `"Modul starten"` and `"Trainer-Bühne"` links, and the `"Nächste Themen-Ideen & eigenes Modul beisteuern"` roadmap section. Per-module progress tracking works cleanly and stays isolated between L1 and L2.

However, three interaction pitfalls prevent a first-time user from proceeding smoothly without external guidance:

- **Non-Functional Goal Filter Bar (Local):** Local renders five Goal buttons (`"Alle Ziele"`, `"Besseres Prompting"`, `"Anwendung bauen"`, `"Präsentationen bauen"`, `"KI im Arbeitsalltag"`). Selecting any specific Goal updates `aria-pressed="true"`, yet all `4 × 5 = 20` Level × Goal combinations leave the visible modules, card count, `localStorage` (`{}`), and `"Modul starten"` URLs (`#/` and `#/m/context-engineering-projekt`) unchanged. Launching L1 or L2 after selecting `"Präsentationen bauen"` still opens `"Besseres Prompting"`, creating a silent no-op trap.
- **Silent `L3` Empty State:** Clicking `"L3"` on either Local or Live changes the count label to `"0 aktive(s) Modul(e) verfügbar"` and leaves an empty `<section>` (`""`) with no explanation and no `"Alle Level anzeigen"` reset button. Directly beneath that void sits an idea card badged `"L3 · Idee"`, tempting confused users to click it.
- **Unmarked Trainer CTA:** On both module cards, `"Trainer-Bühne"` sits next to `"Modul starten"` without a role qualifier such as `(Moderation)` or `(Für Trainer)`, inviting unprepared attendees to open the presenter timer stage by mistake.

### (c) Human-Readability & Wording

Core card descriptions and durations are concise, but several exact German UI strings hurt readability for non-technical business participants:

- **Mechanical Count Label Grammar:** The count readout renders `"2 aktive(s) Modul(e) verfügbar"`, `"1 aktive(s) Modul(e) verfügbar"`, and `"0 aktive(s) Modul(e) verfügbar"`. The bracketed `(s)` and `(e)` read like an unfinished template rather than natural German prose.
- **Developer Jargon in Participant Copy:** Under `"MODULARER AUSBAU · THEMEN AUF WUNSCH"`, the subtitle reads: `"Jedes weitere Thema lebt als eigener 1-Ordner-Baustein unter modules/<slug>/ (node scripts/new_topic.mjs) — ganz ohne Umbau der Oberfläche."` Repository paths and Node CLI commands distract non-technical CCF participants on the main hub.
- **Redundant L2 Card Tag:** The L2 card metadata reads `"30 / 45 / 60 / 90 Min."` followed by tags `"Level 2"`, `"AGENTS.md"`, `"Skills"`, `"Runbooks"`. The `"Level 2"` tag repeats the top-left `"L2"` badge instead of naming a topic like L1's `"Prompting"`, `"CO-STAR"`, `"Guardrails"`, and `"Obsidian-Vault"`.
- **Cross-Route Module Title Drift:** L1 is titled `"Prompt-Werkstatt · Verlässliche KI-Systeme"` on `#/hub`, `"Standard-Workshop"` in the Hub header, `"Prompt-Werkstatt · virtual7 CCF Clustertag"` in the document `<title>`, and `"[L1] Tierwelt & Ökosysteme"` in the Local Beamer switcher. Likewise, L2 is `"Context Engineering · Projekt & Betrieb"` on `#/hub` versus `"[L2] Projekt, SLA & Governance"` in Local Beamer.
- **Unexplained Technical Terms Without Glossary Access:** Badges and tags across `#/hub` introduce `"Zero-Install"`, `"CO-STAR"`, `"Guardrails"`, `"Obsidian-Vault"`, `"Context Engineering"`, `"AGENTS.md"`, `"Skills"`, `"Runbooks"`, `"MCP-Tools"`, `"Prompt-Injection-Lab"`, and `"Evals"` without any Hub-level `"Hilfe"` modal or tooltip.

### (d) Interactive Elements, Prompts & Embedded Checks

Every active navigation link and Level filter button executed cleanly with zero console or HTTP errors, while several controls showed missing accessibility attributes or misleading affordances:

- **Level & Goal Filters:** On Local, all 4 Level buttons (`"Alle Level"`, `"L1"`, `"L2"`, `"L3"`) and all 5 Goal buttons toggle `aria-pressed="true"/"false"` reliably. On Live, Goal buttons are absent and all 4 Level buttons omit `aria-pressed` (`null`). Across all 20 Local Level × Goal combinations, Goal selection produced zero filtering or URL/storage state transfer.
- **Module Cards, Links & Progress Persistence:** All 5 internal hash destinations loaded cleanly:
  - `"Standard-Workshop"` (`#/m/prompt-werkstatt-tierwelt`) and L1 `"Modul starten"` (`#/`) both load L1 (`"Vom ungefilterten Chat zum verlässlichen KI-System."`).
  - L1 `"Trainer-Bühne"` (`#/beamer`) and L2 `"Trainer-Bühne"` (`#/m/context-engineering-projekt/beamer`) open their respective presenter views.
  - L2 `"Modul starten"` (`#/m/context-engineering-projekt`) loads L2 (`"Context Engineering · Projekt & Betrieb"`), though its main H1 still reads `"Vom ungefilterten Chat zum verlässlichen KI-System."`.
  - Progress bars start at `"Dein Fortschritt in diesem Modul 0 %"` and persist per module: completing 1 of 6 gates (`Nachweise 1/6`) in L1 updates L1 on `#/hub` to `17 %` on Local (`L2` remains `0 %`), while completing 1 of 7 checklist items (`To-do 1/7`) in L1 updates L1 to `14 %` on Live (`L2` remains `0 %`). However, even after progress updates (`17 %` / `14 %`), `<div role="progressbar">` keeps `aria-valuenow: null` and `data-state="indeterminate"` on both builds (though `aria-valuemin="0"` and `aria-valuemax="100"` are already set on both, and Local already sets `aria-label="Fortschritt"` whereas Live has `aria-label: null`).
- **Non-Clickable Idea Cards:** The 3 cards (`"L1–L2 · Idee"` `"Office, Protokolle & Events mit KI"`, `"L2–L3 · Idee"` `"KI-Sicherheit & Prompt-Injection-Lab"`, `"L3 · Idee"` `"Eigene MCP-Tools & automatisierte Evals"`) are static `<div>` elements (`cursor: auto`, 0 links/buttons). Clicking them yields `urlChanged: false` and `bodyChanged: false`, with no badge or note clarifying that they are unimplemented proposals.
- **External Issue Link (`"Thema vorschlagen"`):** Uses `href="https://github.com/EtroxTaran/CCF-ai-workshop/issues/new?title=Neues+Workshop-Thema:+"`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label: null`, and icons `lucide-folder-plus` + `lucide-external-link` (`12×12px`, `aria-hidden="true"`). While an external-link icon is present, the link still omits `aria-label` and gives no visible text warning that it opens an external GitHub issue form requiring an account in a new tab.
- **Mobile `390×844` vs. Desktop `1440×900` Layout:** Both viewports maintain `scrollWidth === clientWidth` (`390 === 390` and `1440 === 1440`) with no horizontal page overflow, and Local's mobile Goal pills wrap cleanly across two rows (`y: 472.75` and `500.75`) without clipping. Only the `<header>` overflows vertically on mobile as detailed in Section 2(a).

### (e) Local vs. Live Parity

The live GitHub Pages deployment serves an older build than the local server (`http://127.0.0.1:3777/#/hub`), creating five concrete parity gaps:

| Feature / UI Element | Local (`127.0.0.1:3777/#/hub`) | Live (`etroxtaran.github.io/CCF-ai-workshop/#/hub`) | Parity Impact |
|---|---|---|---|
| **Goal Filter Bar** | 5 buttons (`Alle Ziele`, `Besseres Prompting`, `Anwendung bauen`, `Präsentationen bauen`, `KI im Arbeitsalltag`) with `aria-pressed` | **Absent** (only 4 Level buttons rendered) | High — Live hides the 4-goal taxonomy completely |
| **Card Duration Options** | `"30 / 45 / 60 / 90 Min."` on both L1 & L2 | `"30 / 60 / 90 Min."` (missing `45 Min.`) | Medium — Live omits the `45 Min.` preset |
| **Hero Subtitle Copy** | `"…Kurztext-Hilfen, Ergebnis-Prüfung und eine eigene Trainer-Bühne mit — im Browser ohne Installation sowie in Desktop, IDE oder Terminal."` | `"…Audio-Kurzhilfen und eine eigene Trainer-Bühne mit — funktioniert im Browser ohne Installation sowie im Ordner oder Terminal."` | High — Live advertises `Audio-Kurzhilfen` and older tool framing |
| **Level Button `aria-pressed`** | Present (`"true"` / `"false"`) on all 4 buttons | **Omitted** (`null`) on all 4 buttons | Medium — Screen-reader filter state missing on Live |
| **Downstream Progress & L2 Framing** | `Nachweise 0/6` (1 item = `17 %`); L2 destination shows `"10 Projekt-Dokumente"` / `"100 % synthetische Projektdaten"` | `To-do 0/7` (1 item = `14 %`); L2 destination mislabels `"10 öffentliche Artikel"` / `"100 % öffentliche Daten"` | High — Incompatible progress scale and mislabeled L2 data on Live |

---

## 3. Structured Findings & Actionable Adaptations

| ID | Severity | Route / Element | Exact German UI Quote / Observed State | Participant Friction | Concrete Recommended Change |
|---|---|---|---|---|---|
| `M1-HUB-01` | **High** | `#/hub` Goal Filters (Local) | `"Alle Ziele"`, `"Besseres Prompting"`, `"Anwendung bauen"`, `"Präsentationen bauen"`, `"KI im Arbeitsalltag"` → `"2 aktive(s) Modul(e) verfügbar"`, `localStorage` `{}`, `"Modul starten"` still `#/` & `#/m/context-engineering-projekt` | Participants select a goal expecting filtered modules or goal preselection inside the workshop, yet nothing changes and the launched module still defaults to `"Besseres Prompting"`. | Propagate the selected goal to `"Modul starten"` (via query/hash parameter or `localStorage`) so the opened module starts on that goal (with a hint `"Gewähltes Ziel wird beim Start übernommen"`), or filter/badge cards by supported goals instead of rendering a no-op bar. |
| `M1-HUB-02` | **High** | `#/hub` Mobile Header `390×844` (Local & Live) | `<header>` `56px` high; `"Workshop-Hub · Modulare Themenbibliothek"` wraps to 3 lines (`height: 60px`, `y: -2.5..57.5`); `"Standard-Workshop"` `<a>` (`h-8`, `32px`, `scrollHeight: 31 > clientHeight: 30`) squeezes its inner `<span>` (`65.625px` wide, `32px` high, `scrollHeight: 32, clientHeight: 32`) onto 2 lines | The hub title overflows the top bar vertically and the right-side CTA button cramps onto two lines inside a `32px` control on `390px` viewports. | Show a compact mobile title (`"Workshop-Hub"` below `sm`, full subtitle on `sm+` or allow `min-h-14 py-2`), and add `whitespace-nowrap` or a shorter mobile label (`"L1 starten"`) on the header CTA. |
| `M1-HUB-03` | **High** | `#/hub` Local vs. Live Parity (Live) | Live lacks Goal filter bar, shows `"30 / 60 / 90 Min."`, states `"Audio-Kurzhilfen … im Ordner oder Terminal"`, omits `aria-pressed`, and tracks `To-do 0/7` (`14 %`) instead of `Nachweise 0/6` (`17 %`) | Live GitHub Pages participants see an outdated feature set, incompatible terminology (`Audio-Kurzhilfen`), and mislabeled L2 destination data. | Redeploy GitHub Pages from the current build so Live matches Local across filters, copy, durations, accessibility attributes, and downstream modules. |
| `M1-HUB-04` | **Medium** | `#/hub` `L3` Filter Empty State (Local & Live) | Clicking `"L3"` renders `"0 aktive(s) Modul(e) verfügbar"` above an empty `<section class="grid gap-5 md:grid-cols-2">` (`innerText: ""`) | Selecting `L3` makes all active modules vanish with zero explanation, right above an `"L3 · Idee"` card that looks like a clickable replacement. | Render an explicit empty-state card inside the grid (`"Noch kein aktives L3-Modul veröffentlicht — geplante Themen findest du unten."`) paired with an `"Alle Level anzeigen"` reset button. |
| `M1-HUB-05` | **Medium** | `#/hub` Header vs. L1 Card Route Clarity (Local & Live) | Header `"Standard-Workshop"` (`href="#/m/prompt-werkstatt-tierwelt"`) vs. L1 Card `"Modul starten"` (`href="#/"`) | Two different labels and hash URLs open the exact same L1 module, leaving first-time users unsure which card corresponds to `"Standard-Workshop"`. | Point both links to one canonical L1 route or clarify the label/badge (`"L1 · Standard-Workshop"` on the L1 card and `"L1 Standard-Workshop"` in the header). |
| `M1-HUB-06` | **Medium** | `#/hub` Card CTA Role Clarity (Local & Live) | `"Modul starten"` placed beside `"Trainer-Bühne"` with no role label | Unprepared participants may click `"Trainer-Bühne"` expecting workshop exercises and land on the projector/presenter timer view. | Add a clear role cue on the secondary link, such as `"Trainer-Bühne (Moderation)"` or an explanatory subtitle/tooltip. |
| `M1-HUB-07` | **Medium** | `#/hub` Roadmap Copy Jargon (Local & Live) | `"Jedes weitere Thema lebt als eigener 1-Ordner-Baustein unter modules/<slug>/ (node scripts/new_topic.mjs) — ganz ohne Umbau der Oberfläche."` | Repository directory paths and CLI commands confuse non-technical CCF participants on the public hub. | Replace the main paragraph with plain participant language (`"Neue Themen lassen sich als eigenständige Module ergänzen."`) and move `modules/<slug>/` + `node scripts/new_topic.mjs` into a collapsible `"Für Trainer & Mitwirkende"` note. |
| `M1-HUB-08` | **Medium** | `#/hub` External Link Affordance (Local & Live) | `"Thema vorschlagen"` (`href="https://github.com/EtroxTaran/CCF-ai-workshop/issues/new?title=Neues+Workshop-Thema:+"`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label: null`, `lucide-folder-plus` + `lucide-external-link`) | Despite the small `12×12px` `lucide-external-link` icon (`aria-hidden="true"`), screen readers receive no new-tab announcement (`aria-label: null`) and non-technical participants get no explicit warning that an external GitHub page requiring a login will open. | Keep `lucide-external-link`, add `aria-label="Thema auf GitHub vorschlagen (öffnet in neuem Tab)"`, and display a short visible cue `"GitHub-Issue · neues Tab"`. |
| `M1-HUB-09` | **Medium** | `#/hub` Missing Hub Help & Level Legend (Local & Live) | No `"Hilfe"` button on `#/hub`; filter pills show only `"L1"`, `"L2"`, `"L3"`; tags use `"Zero-Install"`, `"CO-STAR"`, `"Guardrails"`, `"AGENTS.md"`, `"Runbooks"`, `"Evals"` | Direct visitors on `#/hub` cannot open the glossary/FAQ before launching a module and have no definition of `L1`–`L3`. | Add the `"Hilfe"` modal trigger to the Hub header (or a compact legend `"L1 Einstieg · L2 Praxis · L3 Vertiefung"`) and briefly gloss technical tags on hover/help. |
| `M1-HUB-10` | **Medium** | `#/hub` Non-Clickable Idea Cards (Local & Live) | `"L1–L2 · Idee"`, `"L2–L3 · Idee"`, `"L3 · Idee"` rendered as `<div>` cards (`cursor: auto`) directly under the module grid | Styled like interactive cards below active modules, causing participants (especially after filtering `L3`) to click them expecting details. | Add a muted status pill/note `"Vorschau · noch nicht verfügbar"` and visually distinguish idea cards (e.g., dashed border or roadmap list layout). |
| `M1-HUB-11` | **Low** | `#/hub` Count Label Grammar (Local & Live) | `"2 aktive(s) Modul(e) verfügbar"`, `"1 aktive(s) Modul(e) verfügbar"`, `"0 aktive(s) Modul(e) verfügbar"` | Parenthetical pluralization looks unpolished and robotic in German UI copy. | Replace with proper singular/plural branches: `"Keine aktiven Module verfügbar"`, `"1 aktives Modul verfügbar"`, `"2 aktive Module verfügbar"`. |
| `M1-HUB-12` | **Low** | `#/hub` L2 Tag & Cross-Route Naming (Local & Live) | L2 card tags: `"Level 2"`, `"AGENTS.md"`, `"Skills"`, `"Runbooks"`; L1 named `"Prompt-Werkstatt · Verlässliche KI-Systeme"` on Hub vs `"[L1] Tierwelt & Ökosysteme"` in Beamer | `"Level 2"` duplicates the `"L2"` badge instead of naming a topic, and inconsistent module titles across Hub/Beamer disorient users switching views. | Replace `"Level 2"` tag with `"Context Engineering"` or `"Governance"` and harmonize L1/L2 titles across `#/hub`, module headers, and `#/beamer`. |
| `M1-HUB-13` | **Low** | `#/hub` Progressbar & Filter Accessibility (Local & Live) | `<div role="progressbar">` sets `aria-valuemin="0"` and `aria-valuemax="100"` on both builds (and `aria-label="Fortschritt"` on Local, `null` on Live) but keeps `aria-valuenow: null` (`data-state="indeterminate"`) even at `17 %` / `14 %`; Live Level buttons have `aria-pressed: null` | Assistive technologies cannot announce `0 %` / `17 %` / `14 %` progress (nor the progressbar label on Live) or active filter buttons on Live. | Set `aria-valuenow={pct}` (replacing indeterminate state) on both builds, preserve/add `aria-label="Fortschritt in diesem Modul"` (missing on Live), and include `aria-pressed` on Live Level buttons. |

---

## 4. Coverage Matrix

| Area / Control Exercised | Local `1440×900` | Local `390×844` | Live `1440×900` | Live `390×844` | Observed Outcome |
|---|---|---|---|---|---|
| **Fresh Load (`#/hub`) & Telemetry** | ✅ | ✅ | ✅ | ✅ | Clean load, no auto-modal, `0` console/page/HTTP errors |
| **Header (`virtual7`, title, `Standard-Workshop`)** | ✅ | ✅ | ✅ | ✅ | `#/m/prompt-werkstatt-tierwelt` works; mobile `390×844` title & CTA wrap/overflow header |
| **Level Filters (`Alle Level`, `L1`, `L2`, `L3`)** | ✅ | ✅ | ✅ | ✅ | Filters cards (`2`/`1`/`0`); `aria-pressed` present on Local, `null` on Live; `L3` empty `<section>` |
| **Goal Filters (all 20 Level × Goal combos)** | ✅ | ✅ | ✅ (absent) | ✅ (absent) | On Local, `aria-pressed` toggles visually with zero card/URL/`localStorage` effect; absent on Live |
| **L1 Card (`Modul starten` `#/` & `Trainer-Bühne` `#/beamer`)** | ✅ | ✅ | ✅ | ✅ | Both links load target routes cleanly; copy differs (`45 Min.` on Local vs absent on Live) |
| **L2 Card (`Modul starten` `#/m/context-engineering-projekt` & `Trainer-Bühne`)** | ✅ | ✅ | ✅ | ✅ | Both links load cleanly; Live L2 destination mislabels `"10 öffentliche Artikel"` |
| **Per-Module Progress (`0 %` → `17 %` / `14 %`)** | ✅ | — | ✅ | — | L1 gate (`1/6` → `17 %` Local) & checklist (`1/7` → `14 %` Live) persist cleanly; L2 remains `0 %`; `aria-valuenow: null` |
| **3 Non-Clickable Idea Cards** | ✅ | ✅ | ✅ | ✅ | `cursor: auto`, 0 links/buttons; clicking triggers no navigation or DOM change |
| **External Link (`Thema vorschlagen`)** | ✅ | ✅ | ✅ | ✅ | Verified `href`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label: null` |
