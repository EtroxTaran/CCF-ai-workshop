# LOESUNGEN_TRAINER — Verifizierte Musterlösungen & Regie-Leitfaden

> **Nur für Trainer / Moderation (Nico Rimmele).** Alle Antworten wurden direkt gegen die erzeugte 68-Artikel-**Wissensbasis** (`100 % öffentliche Daten`) geprüft.

---

## 1. Regie-Leitfaden & 2-Phasen-Moderation (11:00–12:00 Uhr)

Steuere den kompletten Workshop ohne Alt-Tab-Wechsel direkt über die statische **Trainer-Bühne (`#/beamer`)**:
- **Online-URL (Primär):** `https://etroxtaran.github.io/CCF-ai-workshop/#/beamer`
- **Offline-Backup:** `start-beamer.bat` (Windows) oder `./start-beamer.sh` (macOS/Linux) → `http://127.0.0.1:3777/#/beamer`
- **Backup-Foliensatz:** `presentation/CCF_HandsOn_Prompt_Werkstatt.pptx` (6 schlanke Folien, `>= 22 pt`)

### Ablauf auf der Trainer-Bühne (`#/beamer`)
1. **Brücke schlagen (1 Min.):** Rückgriff auf die Vormittags-Umfrage (`n = 47`: 57 % wünschen sich Prompt-Training, 62 % ohne Agent-Erfahrung, 66 % bei RAG unsicher) – alles heute an **100 % öffentlichen Daten** erlebbar.
2. **Keynote-Demo (`#/beamer` Modus `2: Demo`, schrittweiser Reveal mit `Space`/`N`):**
   - Zeige am Beamer zuerst **Zero-Shot vs. CO-STAR / Few-Shot / RISEN** sowie die **5 Steuerungsebenen**.
   - Enthülle danach schrittweise **`Stufe 1 → Stufe 2 → Stufe 3`**:
     - *Stufe 1 (`stufe-1-chaos`):* Frage 3 (Fangfrage: *Schneeleoparden im Schweizerischen Nationalpark*) → Modell rät/spekuliert aus Vorwissen.
     - *Stufe 2 (`stufe-2-skills-guardrails`):* Guardrail-Schild greift → *„Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“* Dazu **Frage 4 (`38 Zähne`-Schalter)** als Beweis für Kontext-Priorisierung.
     - *Stufe 3 (`stufe-3-obsidian-vault`):* **Frage 2 (Symbiose + Korallenbleiche)** im eingebetteten, projektor-großen **`ObsidianKnowledgeGraph`** (`_index.md` → `[[anemonenfische]]` → `[[seeanemonen]]` → `[[symbiose]]` → `[[steinkorallen]]` → `[[korallenbleiche]]`) plus **`McpPacketAnimatic`**.
3. **QR-Einstieg (`#/beamer` Modus `3: QR Join`):**
   - Kontrastreicher QR-Code auf `https://etroxtaran.github.io/CCF-ai-workshop/` plus `git clone -b main https://github.com/EtroxTaran/CCF-ai-workshop.git`.
   - Hinweis an die Gruppen: In Schritt `01` einfach die passende **Werkzeug-Hilfe** (`Web-Chat`, `Desktop & Ordner`, `Code-Agent` + aufklappbare *OpenCode + OpenRouter*-Hilfe) wählen.
4. **Hands-on-Steuerung (`#/beamer` Modus `1: Stage`):**
   - **15 Min. gemeinsamer Aha-Kern** (Schritte 02 & 03, 2 Fokus-Fragen pro Stufe + Fangfrage)
   - **30 Min. freier Praxis-Pfad** (Schritt 04: 1. Recherche & Fakten-System inkl. 68-Artikel-Faktenprüfer & MCP, 2. Präsentation/Animatic/Übersichtsseite in Artifacts/Canvas, 3. Kleine interaktive App bauen) + **4-Rollen CCF-Transfer-Brücke**.
   - Riesen-Countdown steuern; optional stumm vorbelegten Bühnen-Gong per Taste **`M`** aktivieren (Signal bei `01:00` und `00:00`).
5. **Debrief (`#/beamer` Modus `4: Outro`, 11:55–12:00 Uhr):**
   - 3 moderierte Handzeichen-Impulse + 3 Kernaussagen + Ausblick auf **„13:00 Uhr Unit-Programm & World Café“**.

---

## 2. Verifizierte Musterlösungen zu den 4 Testfragen

### Frage 1 — Detailfrage (1 Datei)
**Frage:** *„Warum gefriert das Fell des Eisbären nicht, welche Hautfarbe hat ein ausgewachsener Eisbär darunter, und wie viele Zähne besitzt er?“*

- **Exakte Quelle:** `stufe-1-chaos/docs/eisbaer.md` (bzw. `stufe-2-skills-guardrails/docs/eisbaer.md`, `stufe-3-obsidian-vault/wiki/tierarten/eisbaer.md`, `raw/eisbaer.md`)
- **Verifizierte Lösung:**
  1. **Kein Gefrieren des Fells:** Das Fell ist mit einer Schicht aus **Eisbärentalg** überzogen – einem lipidbasierten Sekret aus Triglyceriden, freien Fettsäuren, Wachsen und weiteren Lipiden. Anders als menschlicher Talg fehlt ihm **Squalen**; durch die hydrophoben Eigenschaften perlt Wasser ab bzw. verdunstet schnell, sodass kein stabiler Wasserfilm für die Eisnukleation entsteht. (Die äußeren Fellhaare sind zudem hohl und transparent, nicht weiß.)
  2. **Hautfarbe darunter:** Ausgewachsene Eisbären haben eine **schwarze Haut** (bei Babys noch rosa), darunter liegt eine **5 bis 10 Zentimeter** dicke Fettschicht.
  3. **Zähne:** Wie die meisten Bären besitzt der Eisbär **42 Zähne**.

---

### Frage 2 — Querverbindungs-Frage (4+ verknüpfte Dateien)
**Frage:** *„Vergleiche die Symbiose zwischen Anemonenfischen und Seeanemonen mit der Symbiose zwischen Steinkorallen und Zooxanthellen: Wie schützen sich Anemonenfische vor Nesselzellen, welcher Symbiose-Typ liegt jeweils räumlich vor, und was passiert bei starker Erwärmung im Korallenriff?“*

- **Exakte Quellen:**
  - `anemonenfische.md` (`[[anemonenfische|Anemonenfische]]`)
  - `seeanemonen.md` (`[[seeanemonen|Seeanemonen]]`)
  - `symbiose.md` (`[[symbiose|Symbiose]]`)
  - `steinkorallen.md` (`[[steinkorallen|Steinkorallen]]`)
  - `korallenbleiche.md` (`[[korallenbleiche|Korallenbleiche]]`)
  - `korallenriff.md` (`[[korallenriff|Korallenriff]]`)
- **Verifizierte Lösung:**
  1. **Schutz vor Nesselzellen (`anemonenfische.md`):** Anemonenfische schützen sich durch eine Schleimhaut mit nur **geringem Anteil an Sialinsäuren** – denselben Mechanismus, mit dem sich Seeanemonen vor Selbstvernesselung schützen. Die Anemone bietet Schutz vor Raubfischen, während die Fische die Anemone gegen Fressfeinde (z. B. Falter- oder Feilenfische) verteidigen. Laut `seeanemonen.md` zählen 7 von 10 Symbioseanemonen zur Familie *Stichodactylidae*.
  2. **Räumlicher Symbiose-Typ (`symbiose.md`):**
     - Clownfische & Seeanemonen = **Ektosymbiose** (die Partner bleiben körperlich getrennt).
     - Zooxanthellen in riffbildenden Steinkorallen = **Endosymbiose** (der Symbiont wird in den Körper/die Zellen des Wirts aufgenommen).
  3. **Wirkung starker Erwärmung (`steinkorallen.md`, `korallenbleiche.md`, `korallenriff.md`):**
     - Riffbildende Steinkorallen brauchen i. d. R. **20 °C bis 29 °C** Wassertemperatur (`steinkorallen.md`). Zooxanthellen liefern per Photosynthese bis zu **90 %** der Nährstoffe (`korallenbleiche.md`).
     - Bei zu hoher Wassertemperatur (z. B. ab **29 °C** bei *Oculina patagonica*) verlieren Zooxanthellen die Photosynthesefähigkeit (**Photoinhibition**), es entsteht oxidativer Stress und die Korallen stoßen die Zooxanthellen ab (**Korallenbleiche**).
     - Kehren die Zooxanthellen nicht innerhalb von etwa **acht Wochen** zurück, sterben die Korallen ab (`korallenbleiche.md`).
- **Stufen-Vergleich:**
  - *Stufe 1:* Nennt oft Teile davon aus dem Vortraining, verwechselt/vermischt Begriffe, liefert keine Dateinamen.
  - *Stufe 2:* Muss viele Dateien in `docs/` per Stichwort durchsuchen; wenn sauber gearbeitet, komplette Quellenangaben.
  - *Stufe 3:* `_index.md` führt direkt zu den verlinkten Artikeln; `[[Wikilinks]]` verbinden automatisch `anemonenfische` ↔ `seeanemonen` ↔ `symbiose` ↔ `steinkorallen` ↔ `korallenbleiche`.

---

### Frage 3 — Fangfrage / Negativtest (NICHT im Korpus!)
**Frage:** *„Wie hoch ist der aktuelle Bestand an Schneeleoparden im Schweizerischen Nationalpark und welche jährlichen Tourismus-Eintrittspreise in Euro werden dort zum Artenschutz erhoben?“*

- **Nachweis in der Wissensbasis (automatisch geprüft):**
  - `schneeleopard`: **0 Treffer** in allen 68 Dateien.
  - `schweizerischer nationalpark`: **0 Treffer** in allen 68 Dateien.
  - `eintrittspreis`: **0 Treffer** in allen 68 Dateien.
  - *(Hinweis: Im Artikel `korallenbleiche.md` steht nur der Jahresumsatz des weltweiten Riff-Tourismus mit 9,6 Mrd. Dollar; zu einem Schweizer Nationalpark oder Schneeleoparden gibt es null Einträge.)*
- **Erwartetes Verhalten:**
  - *Stufe 1:* Rät, spekuliert oder erklärt auf Basis von Vorwissen aus dem Internet (obwohl nur lokale Dateien gefragt waren).
  - *Stufe 2 & 3:* Klare Verweigerung laut Guardrail: *„Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“*

---

### Frage 4 — Steuerungs-/Manipulations-Aufgabe (`38 Zähne`-Test)
- **Interaktiv & im Korpus:** Sowohl in **Schritt 03** der Workshop-App als auch in **`#/beamer` (Modus `2: Demo`)** steht ein direkter **`38 Zähne`-Schalter** zur Verfügung.
- **Daten-Test (`eisbaer.md`):** Wird `42 Zähne` testweise auf `38 Zähne` geändert, muss Stufe 2/3 bei striktem Guardrail **„38 Zähne“** antworten (mit Quellenverweis `docs/eisbaer.md`) – das beweist, dass das Modell wirklich den lokalen Kontext priorisiert und nicht aus dem Gedächtnis „korrigiert“! **Nach dem Test lokal wieder auf `42 Zähne` zurückstellen.**
- **Regel-/Skill-Test:** Eine neue Pflichtregel in `AGENTS.md` (z. B. JSON-Ausgabe oder Management-Ampel) zeigt sofortige Steuerbarkeit durch Leitplanken und Skills.

---

## 3. Verifizierte Fakten für das Prompt-Methoden-Labor (Klimawandel)
- **Arktis & Eisbär:**
  - `arktis.md`: Der Arktische Ozean könnte nach Prognosen bereits **2030** in den Sommermonaten eisfrei sein; die globale Erwärmung verschiebt die Grenze der Hocharktis langsam weiter nach Norden.
  - `eisbaer.md`: Eisbären verbringen einen großen Teil ihres Lebens auf dem Meereseis; im Sommer wiegen ausgehungerte Eisbären deutlich weniger als während der winterlichen Robbenjagd.
- **Korallenriff & Steinkorallen:**
  - `steinkorallen.md`: Wassertemperatur sollte **20 °C** möglichst nicht unter- und **29 °C** nicht überschreiten.
  - `korallenbleiche.md`: Wärmestress (z. B. Schwelle **29 °C** bei *Oculina patagonica*) führt zu Photoinhibition, oxidativem Stress und Abstoßung der Zooxanthellen; globale Bleichen **1998, 2010, 2016 und 2024**. Ohne Rückkehr innerhalb von ca. **acht Wochen** sterben die Korallen ab. Riffe absorbieren **70 bis 90 %** der Wellenenergie; Jahresumsatz des Riff-Tourismus geschätzt **9,6 Mrd. Dollar**.

---

## 4. Bedienung der Trainer-Bühne (`#/beamer`) & Backup-Strategie
- **Tageslicht-Standard (`#FAFAF8` / `#0B0F0A` / `#A9C23F`):** Optimiert für helle Seminarräume mit 10-Meter-Lesbarkeit ohne schmale Seitenleiste; Taste **`T`** schaltet bei abgedunkeltem Raum in den Dunkelmodus.
- **4 Modi (`1`–`4`):** `1` **Stage** (Countdown & Etappenfokus), `2` **Demo** (schrittweiser Reveal + `ObsidianKnowledgeGraph` + `McpPacketAnimatic`), `3` **QR Join** (GitHub-Pages-QR + `git clone`), `4` **Outro** (Debrief-Impulse & 13:00-Uhr-Programm).
- **Tastaturkürzel:**
  - `1–4` — Modus wechseln (`Stage`, `Demo`, `QR Join`, `Outro`)
  - `T` — Tageslicht / Dunkelmodus umschalten
  - `M` — Bühnen-Gong stumm / aktiv schalten (per Default stumm; Signal bei `01:00` und `00:00`, null Audio auf Teilnehmer-Laptops)
  - `S` — Im Modus `Stage` die verifizierte Lösung der aktuellen Etappe öffnen/schließen (`Esc` oder `S` schließt wieder)
  - `Space` / `N` — Im Modus `Stage`: Timer Start/Pause (`Space`); im Modus `Demo`: schrittweiser Reveal (`Space`/`N`, inkl. Q4 `38 Zähne`)
  - `←` / `→` — Durch die Workshop-Etappen navigieren
- **Moderation ohne Netzabhängigkeit:** Debrief über 3 kuratierte Handzeichen-Abfragen zu den 3 Praxis-Pfaden (Pfad 1: 68-Artikel-Faktenprüfer & MCP `search_wildlife_vault` / `verify_claim_against_corpus` / `read_vault_article`, Pfad 2: Artifacts/Canvas, Pfad 3: Mini-Apps) und der 4-Rollen `Transfer-Brücke`; als letzter Fallback liegt `presentation/CCF_HandsOn_Prompt_Werkstatt.pptx` (6 Folien, `>= 22 pt`) bereit.
