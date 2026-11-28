# Neues Themen-Modul beisteuern (`CONTRIBUTING_MODULE.md`)

Die Workshop-Plattform ist modular aufgebaut (`modules/<slug>/`). Jedes Modul erzeugt automatisch einen eigenen **Workshop-Einstieg** im Hub (`#/hub`), ein durchsuchbares UI-Datenpaket unter `workshop-ui/public/modules/<slug>/`, on-disk Übungsdateien (`_index.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, MCP-Configs) sowie einen eigenen **MCP-Server-Endpunkt** (`--module <slug>`).

---

## Schnellstart (in 5 Minuten)

1. **Neues Modul-Gerüst erzeugen:**
   ```bash
   node scripts/new_topic.mjs --slug mein-thema --title "Mein Themen-Modul" --level L2
   ```
   Dadurch entsteht `modules/mein-thema/` inkl. `module.json`, `corpus/`-Beispielartikeln sowie vorbereiteten Vorlagen für `praxisPaths` (`web`, `desktop`, `ide`, `agent`), `contradictionClaims` und `expressConfig.methodsKeywords`.

2. **Eigene Wissensbasis (Markdown) unter `modules/mein-thema/corpus/` ablegen:**
   - Jede `.md`-Datei sollte YAML-Frontmatter enthalten:
     ```yaml
     ---
     title: Dokumenttitel
     category: Kategorie-Name
     tags: [begriff-1, begriff-2]
     slug: datei-slug
     ---
     ```
   - Verwende klare `[[Wikilinks]]` zwischen verwandten Artikeln.
   - **Compliance-Regel:** Nur **100 % öffentliche** oder **100 % synthetische** Daten einchecken — niemals vertrauliche oder personenbezogene Daten.

3. **`module.json` ausfüllen & Build ausführen:**
   - Achte darauf, dass alle `ragWalkSteps`, `stagePackSpecs` (`starterSlugs`), `expressConfig.goodTokens` und `contradictionClaims` auf reale Slugs/Fakten im eigenen Korpus verweisen.
   - Prüfe `praxisPaths` für alle **4 Werkzeuge** (`web`, `desktop`, `ide`, `agent`).
   - Danach generieren & validieren:
     ```bash
     node scripts/build_modules.mjs
     node scripts/validate_modules.mjs
     node scripts/build_modules.mjs --check
     ```

4. **MCP-Server & UI lokal testen:**
   ```bash
   # MCP-Server gezielt für dein neues Modul testen
   node mcp-server/server.mjs --module mein-thema
   node mcp-server/setup-client.mjs --client all --module mein-thema --scope user --dry-run

   # Workshop-UI lokal bauen & prüfen
   cd workshop-ui && npx tsc -b --noEmit && npm run build && cd ..
   ```

5. **Vollständige Verifikations-Suite vor dem Pull Request ausführen:**
   ```bash
   node scripts/check_links_and_scripts.mjs
   node --test tests/unit/*.test.mjs tests/integration/*.test.mjs
   python scripts/verify_workshop.py
   cd workshop-ui && npm run test:e2e && cd ..
   ```

---

## Pflicht-Verträge (`scripts/validate_modules.mjs`)

Jedes Modul wird automatisiert gegen folgende Verträge geprüft:
- **Gültige Modul-ID:** Kleinbuchstaben + Bindestrich (`^[a-z0-9][a-z0-9-]*$`).
- **Vollständige `toolModes`:** Alle 4 Modi (`web`, `desktop`, `ide`, `agent`) müssen definiert sein (oder über `toolModes` bereitstehen).
- **Ehrliche Fangfragen & Widersprüche:** Mindestens 1 nicht belegbarer Claim (`expectedStatus: "nicht_belegt"`) und idealerweise konkrete `contradictionClaims` (`expectedStatus: "widerspruch"`), die `verifyClaim()` deterministisch bestätigt.
- **Referenz-Integrität:** Alle in `ragWalkSteps`, `stagePackSpecs` und `verificationClaims` referenzierten Slugs und `targetDocs` müssen im Korpus existieren.
- **On-Disk Sync:** Nach `build_modules.mjs` dürfen weder `_index.md` noch `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` noch `workshop-ui/public/modules/` von der Moduldefinition abweichen (`--check` Exit 0).
- **Designentscheidungen:** Siehe `docs/adr/0001` bis `docs/adr/0006`.
