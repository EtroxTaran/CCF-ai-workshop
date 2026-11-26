# Neues Thema zum Workshop-Hub hinzufügen (1-Ordner-Anleitung)

> **Ziel:** Neue Themen, Fachbereiche oder Übungssets lassen sich in **einem einzigen Ordner unter `modules/<slug>/`** anlegen — ganz ohne Änderungen an React-Komponenten, Verifier-Skripten oder `vite.config.ts`.

---

## Schnellstart in 3 Minuten

1. **Neuen Modul-Ordner automatisch anlegen:**
   ```bash
   node scripts/new_topic.mjs --slug mein-thema --title "Mein Thema Praxis" --level L2
   ```
   Dadurch entsteht `modules/mein-thema/` mit:
   - `module.json` (Metadaten, Fragen, Methoden, Rollen, Tests)
   - `corpus/` (deine Markdown-Wissensdateien `.md` — **100 % öffentlich / synthetisch, keine Kundendaten!**)
   - `skills/` (optional eigene `SKILL.md`-Arbeitsanweisungen)
   - `audio-scripts.json` (optional Einlesetexte für Voice-Guides)

2. **Eigene `.md`-Dateien in `modules/<slug>/corpus/` legen:**
   Jede Datei bekommt oben 5 Zeilen YAML-Metadaten (Frontmatter):
   ```markdown
   ---
   title: Sprechender Dokumenttitel
   category: dokument
   group: Bereich A
   tags: [begriff1, begriff2]
   ---

   Dein Klartext-Inhalt mit optionalen Querverweisen wie [[anderer-dateiname]].
   ```

3. **Modul-Paket bauen & automatisch prüfen lassen:**
   ```bash
   node scripts/build_modules.mjs
   node scripts/validate_modules.mjs
   ```
   `build_modules.mjs` erzeugt automatisch das Inhaltsverzeichnis `_index.md`, die Suchindizes und aktualisiert `workshop-ui/public/modules/catalog.json`.
   `validate_modules.mjs` prüft alle Links (`[[Wikilinks]]`), deine positiven Beleg-Tests sowie deine negativen Fangfragen.

4. **Lokal ansehen oder per Pull Request teilen:**
   - Öffne die App (`npm run dev` in `workshop-ui/` oder `node workshop-ui/server.mjs` nach `npm run build`) und rufe `#/hub` bzw. `#/m/<slug>` auf.
   - Reiche einen Pull Request ein — `.github/workflows/ci.yml` prüft automatisch Schema, Fangfragen und Build.
