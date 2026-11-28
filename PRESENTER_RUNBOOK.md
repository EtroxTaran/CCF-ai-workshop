# Presenter Runbook · virtual7 CCF KI-Workshop

> **Zweck:** Das vollständige, durchgetestete Bühnen- & Moderations-Handbuch für diesen Workshop. Jede:r Moderator:in — auch beim allerersten Durchlauf — kann damit ein **30-, 45/60- oder 90-Minuten-Format** souverän durchführen und echte Workshop-Ergebnisse validieren.

---

## 1. Format-Varianten auf einen Blick

| Format | Empfohlene Aufteilung | Einsatzszenario | Einstellung in der Trainer-Bühne (`#/beamer`) |
|---|---|---|---|
| **Express (30 Min.)** | 6 Min. Demo + 10 Min. Aha-Kern + 12 Min. Ziel-Labor + 2 Min. Debrief | Kurze Team-Sessions / Lunch-&-Learn | Zahnrad (`Overlay`) → Dauer-Preset **30 Min.** |
| **Standard (45–60 Min., CCF Clustertag)** | 10 Min. Keynote-Demo + 15 Min. Aha-Kern + 30 Min. Ziel-Labor + 5 Min. Debrief | Haupt-Workshop im Cluster / Unit-Tag | Standard **60 Min.** (oder **45 Min.**) |
| **Deep-Dive (90 Min.)** | 12 Min. Demo + 20 Min. Aha-Kern + 45 Min. Ziel-Labor + 13 Min. Ergebnis-Review | Fokus-Training für Projektteams (inkl. L2 Modul) | Zahnrad (`Overlay`) → Dauer-Preset **90 Min.** |

---

## 2. T-30 / T-10 / T-0 Pre-Flight Checkliste

### T-30 Minuten (Vorbereitung)
1. **Online-URLs testen:**
   - Workshop-App (L1 Standard): `https://etroxtaran.github.io/CCF-ai-workshop/`
   - Workshop-Hub (alle Module): `https://etroxtaran.github.io/CCF-ai-workshop/#/hub`
   - Trainer-Bühne (Beamer): `https://etroxtaran.github.io/CCF-ai-workshop/#/beamer`
   - L2 Praxis-Modul: `https://etroxtaran.github.io/CCF-ai-workshop/#/m/context-engineering-projekt/beamer`
2. **Offline-Backup testen (falls Raum-WLAN / Zscaler hakt):**
   - Windows: Doppelklick auf `start-beamer.bat` (bzw. `start-workshop.bat`).
   - macOS / Linux: `./start-beamer.sh` (bzw. `./start-workshop.sh`).
   - Prüfe `http://127.0.0.1:3777/#/beamer` (und in Modus `3: QR Join` den Umschalter **Lokal / Offline-LAN**!).
3. **Backup-Präsentation bereitlegen:** `presentation/CCF_HandsOn_Prompt_Werkstatt.pptx` öffnen.
4. **Sauberes Git für Live-CLI-Demos (falls du Code-Agent live zeigst):**
   - `git status` prüfen — `stufe-2-skills-guardrails/docs/eisbaer.md` muss auf **42 Zähne** stehen!

### T-10 Minuten (Am Beamer)
1. **Beleuchtung prüfen (`T`-Taste):** Standard ist der kontrastreiche **Tageslicht-Modus**. In abgedunkelten Räumen einmal **`T`** drücken.
2. **Ton & Bühnen-Gong prüfen (`M`-Taste):** Die Trainer-Bühne startet **aus Sicherheitsgründen immer stumm** (`Stumm (M)` — auch nach jedem Reload!). Falls gewünscht, einmal **`M`** drücken und Raum-Lautsprecher testen.
3. **Live-Session Overlay konfigurieren (Zahnrad-Icon oben rechts):**
   - `Cluster / Gruppe` (z. B. `Customer Cluster Finance (CCF)`)
   - `Zeitfenster` (z. B. `11:00–12:00 Uhr`)
   - `Dauer-Preset` (`30`, `45`, `60` oder `90 Min.` — skaliert alle Timer proportional!)
   - `Raum / Call-Hinweis` & `Abschluss-Banner` (z. B. `13:00 Uhr Unit-Programm & World Café`)
4. **Vollbild & Notizen (`F` & `P`):** Mit **`F`** Vollbild aktivieren. Bei Bedarf **`P`** für die eigene Sprechernotiz-Leiste oder **`?`** für die Tastenkürzel-Übersicht drücken.

### T-0 (Start)
- Mode **`3: QR Join`** auf den Beamer legen, während die Teilnehmenden ankommen.
- Ansage: *„Öffnet den Link am Laptop — idealerweise im Browser neben eurem KI-Chat (ChatGPT, Claude, Langdock, Gemini oder Copilot) bzw. eurer IDE (Antigravity, Cursor, Windsurf, VS Code).“*

---

## 3. Exakte Beamer-Choreografie (Klicks & Tastenkürzel)

| Taste / Klick | Wirkung in `#/beamer` | Wann einsetzen? |
|---|---|---|
| **`1` · `2` · `3` · `4`** | Wechselt zwischen **Stage**, **Demo**, **QR Join**, **Outro** | Haupt-Modi auf der Bühne |
| **`Shift + 1` bis `Shift + 5`** | Springt in **Demo** direkt zu: `1: Stufe 1→2→3`, `2: 4 Prompt-Methoden`, `3: 5 Ebenen`, `4: Wissens-Graph`, `5: MCP-Fluss` | In Phase 1 (Keynote-Demo) ohne Mausklick wechseln! |
| **`Space` / `N`** | In **Stage**: Timer Start/Pause. In **Demo**: Nächste Stufe/Methode/Ebene aufdecken | Progressive Enthüllung live moderieren |
| **`←` / `→`** | Vorherige / Nächste Workshop-Phase (`1..4`) | Phasen-Wechsel inkl. neuem Timer |
| **`+` / `R`** | `+1 Minute` hinzufügen / aktuellen Phasen-Timer zurücksetzen | Puffer geben oder Etappe neu starten |
| **`S`** | Öffnet/schließt die **verifizierte Lösung** der aktiven Testfrage in `Stage` | Auflösung nach dem Aha-Kern |
| **`P` / `?`** | Sprechernotizen-Leiste (`P`) / Alle Tastenkürzel (`?`) | Eigene Moderations-Hilfe live |
| **`T` / `M` / `F`** | Tageslicht ↔ Dunkel (`T`), Gong Stumm/Aktiv (`M`), Vollbild (`F`) | Raum-Anpassung |

> [!TIP]
> **Wichtig bei `Demo → Stufe 1 → 2 → 3`:**
> - `Demo` öffnet standardmäßig auf Tab `Stufe 1 → 2 → 3` mit Frage `q3` (Schneeleopard / Krypto-Wallet) und `q4Mutated = true` (`38 Zähne` bzw. `2 Stunden RTO`).
> - Nach 3× `Space` auf einer Frage springt der nächste `Space`-Druck automatisch in der Reihenfolge `q3 → q4 → q2 → q1` weiter.

---

## 4. Minuten-Skript & Gruppen-Moderation (60-Min.-Standard)

### Minute 00–10 · Phase 1: Keynote-Demo (`1` → `2` Demo)
1. **Min. 00–02 (`3: QR Join` → `1: Stage`):** Kurz einordnen: *„Kein Theorie-Vortrag, sondern direkt ausprobieren. Alle Daten sind 100 % öffentlich/synthetisch — keine Kundendaten.“*
2. **Min. 02–05 (`2: Demo` → `Shift+2` Prompt-Methoden → `Shift+3` 5 Ebenen):**
   - Zeige an der ersten Aufgabe: *Zero-Shot* rät und hat kein Format; *CO-STAR* und *RISEN+CoT* erzwingen Struktur und `(datei.md)`-Quellen.
   - Blende 2–3 Ebenen in `5 Ebenen` auf (`Space`): Warum normale Chat-Wünsche im langen Verlauf vergessen werden, System-Regeln (`AGENTS.md`) aber bleiben.
3. **Min. 05–08 (`Shift+1` Stufe 1→2→3):**
   - Spiele **Frage 3 (Fangfrage)** mit `Space`, `Space`, `Space`: Stufe 1 halluziniert, Stufe 2 lehnt ehrlich mit `[Nicht in Quelle]` ab, Stufe 3 beweist die Lücke über `_index.md`.
   - Zeige kurz **Frage 4 (`38 Zähne` / `2h RTO`)** mit dem Test-Schalter (`q4Mutated`), damit alle sehen: *Lokales Dokument schlägt Trainingswissen!*
4. **Min. 08–10 (`Shift+4` Wissens-Graph → `Shift+5` MCP-Fluss → `3: QR Join`):**
   - Kurzer Blick in Graph & MCP, dann Übergang: *„Jetzt seid ihr dran! Wählt zuerst in Schritt 01 euer **Ziel** (Prompting, App bauen, Präsentation, KI-Alltag) und euer **Werkzeug** (Web-Chat inkl. Langdock, Desktop & Projects, IDE/Editor inkl. Antigravity oder CLI Code-Agent).“*

### Minute 10–25 · Phase 2: Gemeinsamer Aha-Kern (`1: Stage`, Phase 2)
- **Gruppenbildung (falls sinnvoll):** Tandems (2er-Gruppen) sind ideal! Wer kein eigenes KI-Konto hat, setzt sich zu jemandem mit Konto — oder nutzt den eingebauten In-Browser-Faktenprüfer.
- **Min. 10–17 (`Schritt 02`):** Alle testen mindestens Zero-Shot vs. CO-STAR (Web-Chat: `Kompakt-Paket kopieren`, Prompt steht oben!).
- **Min. 17–25 (`Schritt 03`):** Alle spielen Stufe 1 → 2 → 3 durch, lösen die **Mini-Debug-Challenge** (2 fehlende Leitplanken finden) und testen Fangfrage 3 + Test-Ausschnitt 4.
- **Roaming-Check:** Gehe herum und frage: *„Habt ihr einen frischen Chat gestartet? Hat eure KI die Fangfrage wirklich mit `[Nicht in Quelle]` abgelehnt?“*

### Minute 25–55 · Phase 3: Ziel-Labor & Ergebnis-Validierung (`1: Stage`, Phase 3)
- Teilnehmende arbeiten jetzt im gewählten **Ziel × Werkzeug**-Pfad (`Schritt 04`):
  - **Ziel 1 · Besseres Prompting:** Struktur-Prompt → Adversarial Critique → Output-Validator.
  - **Ziel 2 · Anwendung bauen:** 1-Seiten-Spec + 3 Tests → Prototyp (Artifacts/Canvas/HTML/IDE/CLI) → Edge-Case-Check & Output-Validator.
  - **Ziel 3 · Präsentationen bauen:** SCQA-Action-Titles → 5-Folien-Blueprint mit Visuals & Sprechernotizen → Executive-Critique & Output-Validator.
  - **Ziel 4 · KI im Arbeitsalltag:** Dokument-zu-Aktionen-Pipeline → Entwurfs-Redlining/Faktencheck → Eigene `AGENTS.md` / Regel-Werkbank.
- **Wichtigste Trainer-Ansage bei Min. 48:**
  *„Kopiert euer fertiges KI-Ergebnis jetzt in Schritt 04 in den **Output-Validator**, hakt eure **Ziel-Rubrik** ab und ladet euer **Takeaway-Kit (.md)** herunter!“*

### Minute 55–60 · Phase 4: Debrief & Ergebnis-Validierung (`4: Outro`)
1. Wechsle auf **`4: Outro`**.
2. **Live-Ergebnis-Check (2–3 Min.):** Frage gezielt nach Ergebnissen aus verschiedenen Zielen:
   - *„Wer hat im Output-Validator 4/4 grün geschafft?“*
   - *„Wer zeigt kurz in 30 Sekunden seine App-Spec / sein Folien-Deck / seine eigene Hausregel?“*
3. **Montagmorgen-Anker (1 Min.):** Takeaway-Kit (`.md`) + geprüfte Regel + eigene Fangfrage mitnehmen — und auf das **L2 Modul (`context-engineering-projekt`) im Hub (`#/hub`)** für die nächste Vertiefung hinweisen.

### 5-Minuten-Zeitrettungs-Plan (falls es im Termin eng wird)
1. **Sparen in Phase 1 (Demo):** Tab `4` (Wissens-Graph) und `5` (MCP-Fluss) nur 15 Sekunden als Vorschau antippen (`-3 Min.`).
2. **Sparen in Phase 2 (Aha-Kern):** In Schritt 03 direkt Stufe 1 vs. Stufe 2 mit Frage 3 vergleichen und die **Debug-Challenge** gemeinsam im Plenum auflösen (`-3 Min.`).
3. **Niemals kürzen:** Den **Output-Validator + Takeaway-Export** in Phase 3/4! Genau dort entsteht das messbare Workshop-Ergebnis.

---

## 5. Störungs-Playbook (Room Disasters & Sofort-Lösungen)

| Störung im Raum | Sofort-Reaktion |
|---|---|
| **Firmen-VPN / Firewall blockiert ChatGPT oder Claude.ai** | Direkt auf **Microsoft Copilot** (`copilot.microsoft.com`) oder **Google Gemini** (`gemini.google.com`) ausweichen — ODER komplett lokal im eingebauten **Live-Suche & Faktenprüfer + Output-Validator** arbeiten (funktioniert 100 % offline ohne Login). |
| **Teilnehmer:in hat keinen KI-Account** | Sofort als **2er-Tandem** neben jemandem mit Account arbeiten; alternativ den eingebauten Faktenprüfer & die Regel-Werkbank direkt in der Workshop-App nutzen. |
| **KI halluziniert trotzdem auf Stufe 2** *(Nicht-Determinismus!)* | Perfekter Live-Lernmoment! Sage: *„Genau deshalb testen wir im Output-Validator und mit Fangfragen! Schaut, ob ihr einen frischen Chat genutzt habt — und schärft den Prompt mit ‚Kein Vorwissen ergänzen‘ nach.“* |
| **KI lehnt schon auf Stufe 1 ab** *(zu vorsichtiges Modell)* | Moderations-Satz: *„Manche neueren Modelle sind schon vorsichtiger. Der Unterschied zeigt sich sofort bei Zahlen-Änderungen (Q4: 38 Zähne / 2h RTO) und beim Format-Zwang!“* |
| **Microsoft Copilot zeigt kein Artifacts/Canvas-Vorschaufenster** | Im Ziel *Anwendung bauen* / *Präsentation* den erzeugten HTML-Code einfach als `app.html` lokal speichern und im Browser doppelklicken — steht auch direkt in den Werkzeug-Tipps. |
| **Chat schneidet Paket ab („Nachricht zu lang“)** | Alle Kopier-Buttons liefern jetzt automatisch kompakte Auszüge (`<= 7.500` Zeichen); bei noch größerem Bedarf die `.md`-Datei über `+` / 📎 hochladen. |
| **Langdock (Cloud-SaaS): lokales MCP startet nicht** | Cloud-Hubs (Langdock, ChatGPT Web, Claude.ai Web, M365 Copilot) können keinen lokalen `node`-Prozess über `stdio` starten. Nutze stattdessen **Assistant Instructions + Knowledge Folder** (Stufe 2/3) bzw. **Remote MCP (Streamable HTTP/SSE)** oder den eingebauten In-Browser-Faktenprüfer. |
| **Google Antigravity: MCP oder Stufen-Isolation klemmt** | Öffne den gewünschten Stufen-Unterordner direkt als Workspace (`Scope-Override` in `AGENTS.md` / `GEMINI.md` greift dann sauber); lokales MCP liegt unter `~/.gemini/config/mcp_config.json` bzw. `Additional Options (...) > MCP Servers` (`node mcp-server/setup-client.mjs --client antigravity --scope user`). Siehe [docs/ISOLATION_GUIDE.md](docs/ISOLATION_GUIDE.md). |
| **Port `3777` beim Offline-Start schon belegt** | Terminal mit `PORT=3780 node workshop-ui/server.mjs` starten (oder zweiten laufenden Tab schließen). |
| **Windows SmartScreen blockiert `.bat`** | Rechtsklick auf `start-beamer.bat` → *Weitere Informationen → Trotzdem ausführen* oder im Terminal `node workshop-ui/server.mjs` direkt starten. |

---

## 6. Vollständige Trainer-Lösungen (Beide Module)

### Modul 1 (L1): `prompt-werkstatt-tierwelt` (68 öffentliche Wikipedia-Artikel)
- **Frage 1 (`eisbaer.md`):** Schwarze Haut unter weißem/transparentem Fell (bei Babys rosa), hohle und transparente Außenhaare, **5–10 cm** dicke Fettschicht, Talg enthält **kein Squalen** (schützt vor Gefrieren), **42 Zähne** (`eisbaer.md`).
- **Frage 2 (`anemonenfische` → `korallenriff`):** Geringer Sialinsäure-Anteil schützt vor Nesselzellen (`anemonenfische.md`, `seeanemonen.md`), Ektosymbiose vs. Endosymbiose (`symbiose.md`), Riffbildung **20–29 °C** (`steinkorallen.md`), Bleiche ab ~29 °C / Tod nach ~8 Wochen sowie **70–90 % Wellenschutz** (`korallenbleiche.md`).
- **Frage 3 (Fangfrage):** **0 Treffer** zu *Schneeleopard* / *Schweizerischer Nationalpark* / *Eintrittspreis* → verbindlich `[Nicht in Quelle]`.
- **Frage 4 (Kontext-Priorisierung):** Testweise `42 Zähne` → `38 Zähne` in `eisbaer.md` (oder über Web-Chat-Test-Ausschnitt) → ab Stufe 2 muss die KI **38 Zähne `(eisbaer.md)`** nennen.
- **Debug-Challenge Lösung:** (1) *Ausschließlich Fakten aus bereitgestellten Dateien — kein Vorwissen*, (2) *Belege mit `(datei.md)` und `[Nicht in Quelle]`*.

### Modul 2 (L2): `context-engineering-projekt` (10 synthetische Projektdokumente „Kernbank 2026“)
- **Frage 1 (`sla-betriebsmodell.md`, `runbook-zahlungslauf.md`):** **RTO 4 Stunden**, **RPO 15 Minuten**, Eskalation nach **30 Minuten** an Incident-Lead K. Lindner (`team-rollen-raci.md`). Erster Runbook-Schritt beim 22:00-Uhr-SEPA-Batch: **`replay_outbox --dry-run`** vor Neustart.
- **Frage 2 (`architektur-entscheidung-01` → `migrationsplan-phase1`):** Transactional Outbox Pattern (`architektur-entscheidung-01.md`), Outbox-Alarm ab **5.000 Events** (`risikoregister-q3.md`), **keine Echtdaten** / 12 Monate Audit-Log (`datenschutz-leitlinie.md`), **14 Tage Dual-Write** vor Go-Live **15.10.2026** mit Rollback-Fenster 04:00 Uhr (`migrationsplan-phase1.md`).
- **Frage 3 (Fangfrage):** **0 Treffer** zu Vertragsstrafe für Modul *„Krypto-Wallet“* oder externem Cloud-Anbieter → verbindlich `[Nicht in Quelle]` (`rfp-kernbank-2026.md` schließt Endkunden-Apps in Phase 1 explizit aus).
- **Frage 4 (Kontext-Priorisierung):** Testweise `4 Stunden` → `2 Stunden` RTO in `sla-betriebsmodell.md` → ab Stufe 2 muss die KI **2 Stunden `(sla-betriebsmodell.md)`** melden.
- **Debug-Challenge Lösung:** (1) *Ausschließlich Zahlen, Fristen und Rollen aus Projekt-Dateien*, (2) *Belege mit `(datei.md)` und `[Nicht in Quelle]`*.

---

Siehe auch: [LOESUNGEN_TRAINER.md](./LOESUNGEN_TRAINER.md) (kompakte Antwort-Referenz) & [README.md](./README.md) (Repo-Einstieg).
