# Aufgabenblatt: Hands-on Prompt-Werkstatt (60 Minuten · 11:00–12:00 Uhr)

> **Wichtig vorab:** Alle Dateien hier sind 100 % öffentliche Wikipedia-Daten (Tierwelt & Ökosysteme). Wählt in eurer Gruppe (2–4 Personen) euren Arbeitsweg – **das Lernziel ist für alle gleich:**
> - **Track A (Browser & Web-Chat):** Ihr arbeitet mit der lokalen Begleit-App (`start-workshop.bat` / `./start-workshop.sh` → `http://127.0.0.1:3777/`) und kopiert Prompts, System-Regeln sowie Artikel-Pakete direkt in ChatGPT, Claude oder Gemini.
> - **Track B (CLI / Agent):** Ihr öffnet nacheinander die Ordner `stufe-1-chaos`, `stufe-2-skills-guardrails` und `stufe-3-obsidian-vault` in Claude Code, Codex, Gemini CLI oder OpenCode (optional inkl. MCP-Server `mcp-server/server.mjs`).

---

## Ablauf im Überblick (11:00–12:00 Uhr)

| Zeit | Dauer | Phase | Worauf achten? |
|---|---|---|---|
| 11:00–11:10 | 10 Min. | **1. Live-Vorführung am Beamer** | Nico zeigt live, was zwischen Stufe 1, 2 und 3 mit derselben Frage passiert. |
| 11:10–11:15 | 5 Min. | **2. Setup & Track-Wahl** | Repo/App starten (`http://127.0.0.1:3777/`), Teamname festlegen, Track A oder B wählen. |
| 11:15–11:25 | 10 Min. | **3. Prompt-Methoden & Stufe 1 (`stufe-1-chaos`)** | Gleiche Frage mit 4 Prompt-Methoden testen + Testfragen 1–3 in Stufe 1 stellen. |
| 11:25–11:37 | 12 Min. | **4. Stufe 2 (`stufe-2-skills-guardrails`)** | System-Prompt, Priming, Guardrails & Skills (`quellen-recherche`, `fakten-pruefer`). |
| 11:37–11:48 | 11 Min. | **5. Stufe 3 (`stufe-3-obsidian-vault`)** | `_index.md` + `[[Wikilinks]]` + YAML-Frontmatter: Was verändert Markdown-RAG? |
| 11:48–11:55 | 7 Min. | **6. Wahl-Mission & Live-Beamer-Gimmick** | Eine der 4 freien Wahl-Missionen lösen & Frage/Aha-Moment an den Beamer senden! |
| 11:55–12:00 | 5 Min. | **7. Debrief im Plenum** | Ausgewählte Live-Ergebnisse auf der Leinwand prüfen & 1 Take-away je Gruppe teilen. |

---

## Teil 1: Das Prompt-Methoden-Labor (1 Aufgabe, 4 Methoden)

Testet diese **identische Kernfrage** gegen unsere Dokumente (im ungefilterten Chat oder in Stufe 1/2) und vergleicht Struktur, Verlässlichkeit und Nutzbarkeit der Antworten:

> **Kernfrage:** *„Welche Auswirkungen hat der Klimawandel laut unseren Dokumenten auf Eisbären in der Arktis und auf Steinkorallen im Korallenriff?“*

1. **Zero-Shot (Roh-Prompt):**
   ```text
   Erkläre, wie der Klimawandel Eisbären und Korallenriffe beeinflusst.
   ```
2. **CO-STAR (Context · Objective · Style · Tone · Audience · Response):**
   ```text
   Context: Wir bereiten ein internes Cluster-Briefing auf Basis lokaler Wikipedia-Artikel (arktis.md, eisbaer.md, korallenbleiche.md, steinkorallen.md, klimawandel.md) vor.
   Objective: Erkläre die konkreten Folgen des Klimawandels für Eisbären in der Arktis und Steinkorallen im Korallenriff.
   Style: Klar strukturiertes Management-Memo mit belegbaren Fakten.
   Tone: Sachlich, präzise, ohne Alarmismus.
   Audience: Gemischtes Team aus Fachbereich, Datenanalyse und Projektleitung.
   Response: Zwei kurze Abschnitte („Arktis & Eisbär“ / „Korallenriff & Steinkorallen“) mit je maximal 3 Bulletpoints plus expliziter Quellenangabe in Klammern. Erfinde keine Zahlen.
   ```
3. **Few-Shot (Format & Schema durch Beispiele erzwingen):**
   ```text
   Extrahiere aus den vorliegenden Dokumenten die Klimawandel-Auswirkungen exakt im Format der beiden Beispiele. Nutze nur Fakten aus den Dateien.

   Beispiel 1:
   Lebensraum: Alpen | Betroffene Art: Alpenmurmeltier | Konkreter Befund: Auf höhere Gebirgslagen begrenzte Eiszeitrelikte | Quelle: alpenmurmeltier.md

   Beispiel 2:
   Lebensraum: Arktis | Betroffene Art: Ringelrobbe | Konkreter Befund: Geburtshöhlen auf festem Eis; Junge werden Ende Juni/Anfang Juli beim Eisaufbruch selbstständig | Quelle: ringelrobbe.md

   Aufgabe: Erstelle genau solche Zeilen für „Eisbär (Arktis)“ und „Steinkorallen (Korallenriff)“ inkl. konkreter Temperatur-, Jahres- oder Zeitraumangaben aus den Dateien.
   ```
4. **RISEN + Chain-of-Thought (Role · Instructions · Steps · End Goal · Narrowing + Schritt-für-Schritt):**
   ```text
   Role: Du bist ein streng quellenbasierter Recherche-Analyst.
   Instructions: Vergleiche die Klimawandel-Risiken für Eisbären in der Arktis und Steinkorallen im Korallenriff ausschließlich anhand der bereitgestellten Markdown-Dokumente.
   Steps:
   1. Denke Schritt für Schritt: Suche zuerst relevante Textstellen in arktis.md, eisbaer.md, steinkorallen.md und korallenbleiche.md.
   2. Prüfe jeden Zahlenwert (Jahreszahl, Temperatur, Zeitraum, Prozentwert) direkt am Text.
   3. Formuliere eine kompakte Vergleichstabelle.
   End Goal: Eine fehlerfreie, vollständig belegte Entscheidungsgrundlage.
   Narrowing: Kein allgemeines Vorwissen verwenden. Was nicht im Text steht, mit „[Nicht in Quelle]“ markieren. Jede Aussage mit Dateinamen belegen.
   ```

---

## Teil 2: Die 4 Testfragen (für alle 3 Projekt-Stufen identisch!)

Stellt genau diese 4 Aufgaben nacheinander in **Stufe 1**, **Stufe 2** und **Stufe 3**:

1. **Detailfrage (1 Datei):**
   > *„Warum gefriert das Fell des Eisbären nicht, welche Hautfarbe hat ein ausgewachsener Eisbär darunter, und wie viele Zähne besitzt er?“*
2. **Querverbindungs-Frage (3+ verknüpfte Dateien):**
   > *„Vergleiche die Symbiose zwischen Anemonenfischen und Seeanemonen mit der Symbiose zwischen Steinkorallen und Zooxanthellen: Wie schützen sich Anemonenfische vor Nesselzellen, welcher Symbiose-Typ liegt jeweils räumlich vor, und was passiert bei starker Erwärmung im Korallenriff?“*
3. **Fangfrage / Negativtest (NICHT im Korpus!):**
   > *„Wie hoch ist der aktuelle Bestand an Schneeleoparden im Schweizerischen Nationalpark und welche jährlichen Tourismus-Eintrittspreise in Euro werden dort zum Artenschutz erhoben?“*
4. **Steuerungs-/Manipulations-Aufgabe (Fortgeschrittene):**
   > Ändere gezielt in einer Kopie bzw. lokal in `stufe-2-skills-guardrails/docs/eisbaer.md` eine Zahl (z. B. `42 Zähne` → `38 Zähne`) **oder** ergänze eine neue Formatregel in `AGENTS.md` / erstelle einen eigenen Mini-Skill unter `.agents/skills/` und prüfe, wie sich die Antwort sofort verändert (danach Zahl wieder auf `42` zurücksetzen).

---

## Teil 3: Freie Wahl-Missionen („Für jeden etwas“)

Wählt in den letzten Minuten mindestens eine Mission nach Interesse – ohne Rollen-Schubladen:

- **Mission A · Fakten-Audit:** Lass den Skill `fakten-pruefer` eine bewusst fehlerhafte oder gemischte KI-Antwort aus Stufe 1 Satz für Satz gegen `docs/` prüfen.
- **Mission B · Datenstruktur & Wissens-Graph:** Extrahiere eine saubere CSV-/JSON-Tabelle über 6 Arten (`Name | Lebensraum | Status | Quelle`) und verfolge mindestens 3 `[[Wikilinks]]` im Vault (`stufe-3-obsidian-vault`).
- **Mission C · Executive Briefing:** Erstelle mit **CO-STAR + Guardrails** ein 5-Zeilen-Entscheider-Briefing zum Thema *„Wirtschaftliche & ökologische Folgen der Korallenbleiche“* – inklusive expliziter Lückenliste.
- **Mission D · Tools, MCP & Live-Beamer-Gimmick:** Verbinde den mitgelieferten MCP-Server (`.mcp.json` -> `mcp-server/server.mjs`) oder nutze die Workshop-UI und sende deiner KI den Auftrag: **„Stell eine Frage an den Beamer!“** (oder nutze das MCP-Tool `send_to_beamer`).
