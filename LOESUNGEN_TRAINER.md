# LOESUNGEN_TRAINER — Verifizierte Musterlösungen & Regie-Leitfaden

> **Nur für Trainer / Moderation (Nico Rimmele).** Alle Antworten wurden direkt gegen den erzeugten 68-Artikel-Korpus geprüft.

---

## 1. Regie-Leitfaden für die 10-Minuten-Live-Vorführung (11:00–11:10 Uhr)

1. **Brücke schlagen (1 Min.):** Kurzer Rückgriff auf eure Vormittags-Umfrage (`n = 47`): 57 % wollen Prompt-Training, 62 % noch ohne Agent-Erfahrung, 66 % bei RAG unsicher – genau das erleben wir jetzt praktisch an 100 % öffentlichen Daten.
2. **Ungefilterter Chat vs. Methode (3 Min.):** Zeige am Beamer im Vergleich, was ein nackter **Zero-Shot**-Prompt liefert (oft vages Weltwissen ohne Quellen), vs. **RISEN + CoT** oder **Few-Shot**.
3. **Stufe 1 → Stufe 2 → Stufe 3 live mit Frage 3 & Frage 2 (5 Min.):**
   - Öffne `stufe-1-chaos` → stelle **Frage 3 (Fangfrage: Schneeleoparden im Schweizerischen Nationalpark)**. Beobachte/zeige: Das Modell versucht zu antworten oder nutzt allgemeines Weltwissen statt sauber abzugrenzen.
   - Wechsle zu `stufe-2-skills-guardrails` → dieselbe Frage! Ergebnis dank `AGENTS.md`: *„Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“*
   - Wechsle zu `stufe-3-obsidian-vault` → stelle **Frage 2 (Symbiose + Korallenbleiche)**. Zeige, wie der Agent zuerst `_index.md` liest und gezielt `[[anemonenfische]]` → `[[seeanemonen]]` → `[[symbiose]]` → `[[steinkorallen]]` → `[[korallenbleiche]]` folgt.
4. **Live-Gimmick anteasern (1 Min.):** Öffne `/beamer`, drücke testweise **„Demo-Frage simulieren“** (oder sende live via MCP `send_to_beamer`), zeige den Timer und den QR-Code / die URL, und starte die Gruppenphase!

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

- **Korpus-Nachweis (automatisch geprüft):**
  - `schneeleopard`: **0 Treffer** in allen 68 Dateien.
  - `schweizerischer nationalpark`: **0 Treffer** in allen 68 Dateien.
  - `eintrittspreis`: **0 Treffer** in allen 68 Dateien.
  - *(Hinweis: Im Artikel `korallenbleiche.md` steht nur der Jahresumsatz des weltweiten Riff-Tourismus mit 9,6 Mrd. Dollar; zu einem Schweizer Nationalpark oder Schneeleoparden gibt es null Einträge.)*
- **Erwartetes Verhalten:**
  - *Stufe 1:* Rät, spekuliert oder erklärt auf Basis von Vorwissen aus dem Internet (obwohl nur lokale Dateien gefragt waren).
  - *Stufe 2 & 3:* Klare Verweigerung laut Guardrail: *„Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“*

---

### Frage 4 — Steuerungs-/Manipulations-Aufgabe
- **Daten-Test (`eisbaer.md`):** Wird `42 Zähne` testweise auf `38 Zähne` geändert, muss Stufe 2/3 bei striktem Guardrail **„38 Zähne“** antworten (mit Quellenverweis `docs/eisbaer.md`) – das beweist, dass das Modell wirklich den lokalen Kontext priorisiert und nicht aus dem Gedächtnis „korrigiert“! **Nach dem Test wieder auf `42 Zähne` zurückstellen.**
- **Regel-/Skill-Test:** Neue Pflichtregel in `AGENTS.md` (z. B. JSON-Ausgabe oder Management-Ampel) zeigt sofortige Steuerbarkeit durch das „Geschirr“ (**Harness**).

---

## 3. Verifizierte Fakten für das Prompt-Methoden-Labor (Klimawandel)
- **Arktis & Eisbär:**
  - `arktis.md`: Der Arktische Ozean könnte nach Prognosen bereits **2030** in den Sommermonaten eisfrei sein; die globale Erwärmung verschiebt die Grenze der Hocharktis langsam weiter nach Norden.
  - `eisbaer.md`: Eisbären verbringen einen großen Teil ihres Lebens auf dem Meereseis; im Sommer wiegen ausgehungerte Eisbären deutlich weniger als während der winterlichen Robbenjagd.
- **Korallenriff & Steinkorallen:**
  - `steinkorallen.md`: Wassertemperatur sollte **20 °C** möglichst nicht unter- und **29 °C** nicht überschreiten.
  - `korallenbleiche.md`: Wärmestress (z. B. Schwelle **29 °C** bei *Oculina patagonica*) führt zu Photoinhibition, oxidativem Stress und Abstoßung der Zooxanthellen; globale Bleichen **1998, 2010, 2016 und 2024**. Ohne Rückkehr innerhalb von ca. **acht Wochen** sterben die Korallen ab. Riffe absorbieren **70 bis 90 %** der Wellenenergie; Jahresumsatz des Riff-Tourismus geschätzt **9,6 Mrd. Dollar**.

---

## 4. Moderationstipps für das Live-Beamer-Gimmick
- Unter `http://127.0.0.1:3777/beamer` erscheinen alle per UI, MCP (`send_to_beamer`), CLI (`submit-question.mjs`), `live-questions/` oder GitHub Issue eingesandten Fragen in Echtzeit.
- Der automatische **Korpus-Prüfer** markiert sofort:
  - **Belegt** (grün) + passende `[[Wikilinks]]` und Original-Ausschnitte
  - **Teilweise** (gelb)
  - **Nicht im Korpus / Fangfrage** (rot/amber) – ideal, um im Debrief live Halluzinationen vs. Guardrails zu zeigen!
- Falls du zusätzlich eine echte KI-Zweitmeinung live auf der Leinwand möchtest, starte den Server mit z. B. `OPENAI_API_KEY=...`, `ANTHROPIC_API_KEY=...`, `GEMINI_API_KEY=...` oder `OLLAMA_MODEL=...`.
