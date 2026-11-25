# Aufgabenblatt: Hands-on Prompt-Werkstatt (60 Minuten · 11:00–12:00 Uhr)

> **Wichtig vorab:** Alle Dateien in diesem Workshop sind **100 % öffentliche Daten** (Wikipedia-Artikel zu Tierwelt & Ökosystemen).
> Öffnet in eurer Gruppe (2–4 Personen) die **Workshop-App**:
> - **Online (empfohlen):** https://etroxtaran.github.io/CCF-ai-workshop/
> - **Lokales Offline-Backup:** `start-workshop.bat` (Windows) oder `./start-workshop.sh` (macOS/Linux) → `http://127.0.0.1:3777/`
>
> In Schritt `01` wählt ihr über die umschaltbare **Werkzeug-Hilfe** einfach eure gewohnte Arbeitsweise – das Lernziel ist für alle identisch:
> - **Web-Chat** (Claude.ai, ChatGPT, Copilot): ~5.500-Zeichen-Kompakt-Pakete (Prompt immer oben) oder 1-Klick-`.md`-Download; Artifacts/Canvas für Praxis-Pfad 2 & 3. *(Kein eigenes KI-Abo? Aufklappbare Hilfe zu **OpenCode + OpenRouter** in Schritt 01 nutzen!)*
> - **Desktop & Ordner** (Claude Cowork, ChatGPT Projects): Repository (`Branch main`) direkt als Ordner öffnen.
> - **Code-Agent** (Claude Code, Codex, Gemini CLI, OpenCode, VS Code): Nacheinander `stufe-1-chaos/`, `stufe-2-skills-guardrails/` und `stufe-3-obsidian-vault/` öffnen (optional mit lokalem MCP-Server `mcp-server/server.mjs`).

---

## Ablauf im Überblick (11:00–12:00 Uhr · ca. 45 Min. Netto-Hands-on)

| Zeit | Dauer | Phase | Worauf achten? |
|---|---|---|---|
| 11:00–11:10 | 10 Min. | **Einstieg & Werkzeug-Hilfe (App Schritt 01)** | Kurze Demo über die **Trainer-Bühne (`#/beamer`)**, Workshop-App öffnen, Werkzeug-Hilfe wählen. |
| 11:10–11:25 | 15 Min. | **Phase 1: Gemeinsamer Aha-Kern (Schritte 02 & 03)** | 1 Prompt-Vergleich + 5 Steuerungsebenen + `Stufe 1 → 2 → 3` mit Fokus-Fragen (inkl. Fangfrage & `38 Zähne`-Test). |
| 11:25–11:55 | 30 Min. | **Phase 2: Freier Praxis-Pfad & Transfer-Brücke (Schritt 04)** | 1 von 3 zielorientierten Praxis-Pfaden frei wählen + abschließend die **4-Rollen CCF-Transfer-Brücke** durchgehen. |
| 11:55–12:00 | 5 Min. | **Debrief im Plenum (`#/beamer` Outro)** | Handzeichen-Auswertung an der Trainer-Bühne & 3 Kernaussagen mit in den Nachmittag (13:00 Uhr) nehmen. |

---

## Teil 1: Aha-Kern 1 — Prompt-Methoden-Labor (App Schritt 02)

Testet diese **identische Kernfrage** gegen unsere Wissensbasis und vergleicht in der Side-by-Side-Vorschau Struktur, Verlässlichkeit und Nutzbarkeit (in der App steht der Prompt im Kopierpaket **immer oben**, wahlweise als **Kompakt-Paket ~5.500 Zeichen**, **Nur Prompt** oder **Texte als `.md` laden** mit `(datei.md)`-Quellenmarkern). Wählt zu **Zero-Shot** mindestens eine Struktur-Methode zum Vergleich:

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

## Teil 2: Aha-Kern 2 — Die 3 Stufen & Testfragen (App Schritt 03)

Erlebt dieselben Fragen nacheinander in **Stufe 1 (`stufe-1-chaos/`)**, **Stufe 2 (`stufe-2-skills-guardrails/`)** und **Stufe 3 (`stufe-3-obsidian-vault/`)** und haltet eure Beobachtung direkt per Selbst-Reflexions-Pill in der App fest.

**Fokus-Empfehlung für den 15-Minuten-Aha-Kern** (in der App sind pro Stufe 2 Fokus-Fragen vorgewählt; über *„Alle 4 Fragen anzeigen“* sind jederzeit alle sichtbar):
- **Stufe 1 (`stufe-1-chaos/`):** Fokus auf **Frage 3 (Fangfrage)** + **Frage 1 (Detailfrage)**.
- **Stufe 2 (`stufe-2-skills-guardrails/`):** Fokus auf **Frage 3 (Fangfrage)** + **Frage 4 (`42 → 38 Zähne`-Test)**.
- **Stufe 3 (`stufe-3-obsidian-vault/`):** Fokus auf **Frage 2 (Querverbindung über `_index.md` & `[[Wikilinks]]`)** + interaktiven Wissens-Graph.

1. **Frage 1 · Detailfrage (1 Datei):**
   > *„Warum gefriert das Fell des Eisbären nicht, welche Hautfarbe hat ein ausgewachsener Eisbär darunter, und wie viele Zähne besitzt er?“*
2. **Frage 2 · Querverbindungs-Frage (4+ verknüpfte Dateien):**
   > *„Vergleiche die Symbiose zwischen Anemonenfischen und Seeanemonen mit der Symbiose zwischen Steinkorallen und Zooxanthellen: Wie schützen sich Anemonenfische vor Nesselzellen, welcher Symbiose-Typ liegt jeweils räumlich vor, und was passiert bei starker Erwärmung im Korallenriff?“*
3. **Frage 3 · Fangfrage / Negativtest (NICHT in der Wissensbasis!):**
   > *„Wie hoch ist der aktuelle Bestand an Schneeleoparden im Schweizerischen Nationalpark und welche jährlichen Tourismus-Eintrittspreise in Euro werden dort zum Artenschutz erhoben?“*
4. **Frage 4 · Steuerungs-/Manipulations-Aufgabe (`38 Zähne`-Test):**
   > Nutzt den interaktiven **`38 Zähne`-Schalter** in Schritt 03 der Workshop-App (oder ändert lokal in `stufe-2-skills-guardrails/docs/eisbaer.md` testweise `42 Zähne` → `38 Zähne` bzw. ergänzt eine Formatregel in `AGENTS.md`) und prüft, ob die KI strikt dem lokalen Kontext folgt (lokale Änderung danach wieder auf `42` zurücksetzen).

---

## Teil 3: Praxis-Pfade (30 Min.) & 4-Rollen Transfer-Brücke (App Schritt 04)

Wählt in den zweiten 30 Minuten frei **einen der 3 zielorientierten Praxis-Pfade**:

1. **Pfad 1 · Recherche & Fakten-System:**
   - Nutzt den eingebauten **68-Artikel-Faktenprüfer & Such-Lab** direkt in der Workshop-App (testet z. B. `walross`, `alpensteinbock`, Eisbär-Fakten vs. Fangfrage) und zerlegt fehlerhafte Antworten mit `fakten-pruefer`.
   - In der Arbeitsweise **`Code-Agent`** bindet ihr zusätzlich den lokalen MCP-Server (`mcp-server/server.mjs`, bereits in `.mcp.json` / `.vscode/mcp.json` konfiguriert) mit `search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article` und den MCP-Resources (`_index.md`, `wiki/`) ein.
2. **Pfad 2 · Präsentation, Animatic & Übersichtsseite:**
   - Nutzt die fertigen 1-Klick-Rezepte in Schritt 04 für eine interaktive HTML-Übersichtsseite / Animatic in **Claude Artifacts** oder **ChatGPT Canvas** (inkl. Design- und Animations-Leitplanken) sowie ein 5-Folien-Management-Briefing zur Korallenbleiche mit expliziter Lückenliste.
3. **Pfad 3 · Kleine interaktive App bauen:**
   - Nutzt die fertigen Rezepte für ein Tierwelt-Fakten-Quiz oder ein Ökosystem-Vergleichs-Dashboard (als Artifact/Canvas oder lokal via `Desktop & Ordner` / `Code-Agent`) mit strikter Quellen-Bindung (`[Nicht in Quelle]`).

### Abschluss: 4-Rollen CCF-Transfer-Brücke
Übertragt zum Schluss in Schritt 04 die erlebten Muster (ohne vertrauliche Daten) auf typische CCF-Alltagssituationen:
- **Kunden & Projekte** (Angebote, Kundenbriefings, Projektstatus mit Lückenblock)
- **Fachkonzept & Daten** (Anforderungsanalyse, Glossar- und Feldmapping-Prüfung)
- **Betrieb & Datenbanken** (Runbooks, Incident-Checklisten, Konfigurations-Guardrails)
- **Entwicklung & Architektur** (`AGENTS.md`, Projekt-Skills, verknüpfte Wissensbasis & lokales MCP)
