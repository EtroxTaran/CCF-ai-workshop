# ADR 0005: Modular Topic Hub, Lazy-Loaded Cartridges & Event Overlay Separation

- **Date:** 2026-11-26
- **Status:** Accepted
- **Context:** The original single-event repository coupled `ParticipantApp.tsx`, `BeamerApp.tsx`, 13 UI components, `mcp-server/server.mjs`, `verify_workshop.py`, and monolithic static imports (`workshopData.json`, `searchIndex.json`) to a single domain (68 German Wikipedia wildlife articles) and a single event (`11:00–12:00`, CCF). Adding a second topic previously required editing ~45+ files and would immediately breach Vite's 500 kB JS chunk budget.

## Decision

1. **Declarative Module Cartridges (`modules/<slug>/`):**
   - Each workshop module lives in a self-contained folder under `modules/<slug>/` with `module.json`, `corpus/`, optional `skills/`, `audio-scripts.json`, and declarative `verify` assertions.
   - `scripts/build_modules.mjs` compiles all modules into lazy-fetchable static assets under `workshop-ui/public/modules/<slug>/{data,searchIndex}.json` plus a ~3 kB `catalog.json` index.
   - `scripts/validate_modules.mjs` validates every module's schema, `[[Wikilinks]]`, positive evidence assertions, and negative trap tests (`nicht_belegt` with 0 evidence) using the shared ESM corpus engine.

2. **Zero Static Corpus JS Chunks:**
   - `ParticipantApp`, `BeamerApp`, `offlineSearch.ts`, and `exportCorpusMd.ts` load module datasets on demand via `fetchModuleData(moduleId)` and `fetchModuleSearchIndex(moduleId)` (`workshop-ui/src/lib/moduleLoader.ts`) instead of static JSON imports.
   - Initial JS bundle size stays constant regardless of how many workshop topics are added.

3. **Single Source of Truth for Engine & Audio Scripts:**
   - `workshop-ui/src/lib/offlineSearch.ts` delegates directly to `shared/corpus-engine.mjs` via `@shared/corpus-engine.mjs` (eliminating the manual 386-line engine duplicate).
   - `scripts/generate_voice_guides.py` reads the same module `audio-scripts.json` payload shipped to `AudioGuideChip.tsx`.

4. **Hash Hub Routing & Backwards Compatibility:**
   - `#/hub` opens `ModuleHubPage` (catalog, per-module completion badge, duration presets, topic backlog).
   - `#/m/<moduleId>` and `#/m/<moduleId>/beamer` launch any module cleanly.
   - Legacy routes (`#/`, `#/methods`, `#/stages`, `#/paths`, `#/beamer`) continue resolving to the default module (`prompt-werkstatt-tierwelt`) so printed QR codes remain valid.

5. **Event Overlay Separation & Pedagogical Hardening:**
   - Modules avoid hardcoded wall-clock schedules or presenter names; live facilitators customize Unit/Cluster title, duration preset (`Selbstlernen / 30 / 60 / 90 Min.`), and Outro banner via an optional Session Overlay in `BeamerApp`.
   - Step 03/04 include active learning checkpoints (`GuardrailDebugChallenge`, hidden Q4 reveal toggle, 2-turn Stage 3 index test, and `ByouRuleBuilder`).

## Consequences
- Adding a new workshop topic is a **1-folder contribution** (`node scripts/new_topic.mjs`) verified automatically by `.github/workflows/ci.yml` without touching React components.
- Committed `workshop-ui/dist/` remains available for offline starters while `.github/workflows/release-offline.yml` generates standalone offline ZIPs on release tags, allowing full removal of committed `dist/` after the Clustertag event if desired.
