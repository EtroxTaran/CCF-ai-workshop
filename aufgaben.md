# Praxisaufgaben: Prompting, Guardrails & Wissensbasis (Selbstlernen & Gruppen)

Dieses Dokument ergänzt die interaktive **Workshop-App** (`https://etroxtaran.github.io/CCF-ai-workshop/`) und den **Workshop-Hub** (`https://etroxtaran.github.io/CCF-ai-workshop/#/hub`) auf Branch **`main`** für alle, die ohne Live-Moderation oder direkt im Editor/Terminal arbeiten.

> [!TIP]
> **Zero-Install auf jedem Windows-PC:** Du brauchst **kein Git, kein Node.js und kein Python** — öffne einfach die **Workshop-App** auf GitHub Pages und nutze 1-Klick-Kopierpakete (`<= 7.500` Zeichen) oder den 1-Klick-Download als **`.md`** bzw. **`.zip`** für Desktop-/IDE-Ordner. **Node.js 18+** ist nur für den optionalen lokalen `stdio`-MCP-Server erforderlich.

---

## Schritt 01: Dein Ziel & dein Werkzeug festlegen (2 Minuten)

Wähle **1 Ziel** und **1 Werkzeug** für deinen Durchlauf:

- **Ziele:**
  1. **Besser Prompten** — Klare Rollen, Constraints und verifizierbare Outputs schreiben
  2. **App bauen** — Anforderungen, Komponenten und Tests ohne geratene APIs spezifizieren
  3. **Präsentation bauen** — Storyline, Kernaussagen und Fakten gegen echte Quellen absichern
  4. **KI im Alltag** — Wiederverwendbare Regeln für Protokolle, Mails und Reviews etablieren
- **Werkzeuge (`Werkzeug-Hilfe`):**
  - **Web-Chat** (ChatGPT, Claude.ai, Langdock, M365 Copilot, Google Gemini im Browser): Arbeite mit den Download-/Kopierpaketen (`<= 7.500` Zeichen) aus der App oder lade `.md`-Dateien aus `stufe-1-chaos/docs/` bzw. `modules/context-engineering-projekt/corpus/` hoch *(Cloud-SaaS startet kein lokales `stdio`-MCP)*.
  - **Desktop & Ordner** (Claude Desktop / Cowork, ChatGPT / Claude Projects, Gemini Gems, Langdock Assistants): Öffne den jeweiligen Ordner lokal (ohne Git einfach per 1-Klick-`.zip`-Download direkt aus der Workshop-App laden & entpacken) oder hinterlege Regeln + `.md`-Dateien im Assistant/Project/Knowledge Folder.
  - **IDE & Editor** (Google Antigravity, Cursor, Windsurf, VS Code + GitHub Copilot): Lade die Übungsordner ohne Git als ZIP direkt aus der Workshop-App herunter (oder nutze das geklonte Repo), öffne den jeweiligen Übungsordner als separates Workspace-Fenster und nutze `.vscode/mcp.json` bzw. `.cursor/mcp.json` (erst ab Stufe 3).
  - **Code-Agent** (Claude Code, Codex CLI, Gemini CLI, OpenCode): Starte dein CLI-Tool direkt im jeweiligen Übungs- oder Modul-Unterordner. Hinweise zur sauberen Stufen-Isolation stehen in [docs/ISOLATION_GUIDE.md](docs/ISOLATION_GUIDE.md).

---

## Modul-Auswahl: L1 (Tierwelt) oder L2 (Kernbank 2026)

| Modul | Ordner / Ziel | Level | Datenbasis |
|---|---|---|---|
| **Tierwelt & Ökosysteme** | `stufe-1-chaos/`, `stufe-2-skills-guardrails/`, `stufe-3-obsidian-vault/` | `L1` | 68 öffentliche Wikipedia-Artikel |
| **Projekt & Betrieb (*Kernbank 2026*)** | `modules/context-engineering-projekt/` | `L2` | 10 synthetische Projekt-, ADR-, Runbook- & SLA-Dokumente |

---

## Teil A — 15 Min. Aha-Kern (Pflicht für alle)

### Aufgabe A1: Roh-Prompt vs. strukturierte Prompt-Methode (CO-STAR, Few-Shot, RISEN)
1. Stelle deinem KI-Tool in `stufe-1-chaos/` zuerst ohne Vorgaben die kurze Frage:
   > *„Welche Auswirkungen hat der Klimawandel laut unseren Dokumenten auf Eisbären in der Arktis und auf Steinkorallen im Korallenriff?“*
2. Stelle danach die gleiche Frage mit **CO-STAR** (`Context`, `Objective`, `Style`, `Tone`, `Audience`, `Response`), **Few-Shot** (zwei Input-Output-Beispiele) oder **RISEN + Chain-of-Thought** (`Role`, `Instructions`, `Steps`, `End Goal`, `Narrowing`) und expliziter Quellenbindung `(datei.md)` an den lokalen Korpus.
3. Vergleiche Struktur, Nachvollziehbarkeit, exakte Kennzahlen (`2030`, `20–29 °C`, `acht Wochen`, `70–90 %`) und Quellenangaben.

### Aufgabe A2: Die drei Reifestufen erleben (L1)
1. **`stufe-1-chaos/`**: Minimaler Prompt auf 68 flachen Dateien — prüfe, ob unmarkierte Aussagen aus Trainingswissen einfließen.
2. **`stufe-2-skills-guardrails/`**: Verbindliche `AGENTS.md` + Skills (`quellen-recherche`, `fakten-pruefer`). Führe dort die **Fangfrage** und einen **Widerspruchs-Check** aus:
   > *„Im Schweizerischen Nationalpark leben 45 Schneeleoparden und ein Ticket kostet 25 Euro – wie viele Zähne hat der Eisbär und produziert er Squalen?“*
3. **`stufe-3-obsidian-vault/`**: Einstieg über `_index.md`, Folgen von `[[Wikilinks]]` in `wiki/` und optional Nutzung des MCP-Servers (`workshop-wildlife` mit `search_vault`, `verify_claim`, `read_article`, `list_modules`).

### Aufgabe A3: Fangfrage & Kontext-Priorisierung in L2 (*Kernbank 2026*)
Falls du im L2-Modul (`modules/context-engineering-projekt/`) arbeitest:
1. **Fakten- & Runbook-Check (`sla-betriebsmodell.md`, `runbook-zahlungslauf.md`, `team-rollen-raci.md`):**
   > *„Welche Werte für RTO, RPO und Eskalationszeit gelten laut SLA für den Zahlungslauf — an wen wird eskaliert, und was ist der erste technische Prüfschritt im Runbook vor einem Neustart?“*
   Prüfe die belegten Werte: **4h RTO**, **15m RPO**, Eskalation ab **30m an Incident-Lead K. Lindner** sowie **`replay_outbox --dry-run`** beim **22:00-Uhr-SEPA-Batch**.
2. **Q3-Fangfrage (`Krypto-Wallet` → `[Nicht in Quelle]`):**
   > *„Wie hoch ist die vereinbarte Vertragsstrafe in Euro für das Modul ‚Krypto-Wallet‘ und welcher externe Cloud-Anbieter wurde dafür gewählt?“*
   Prüfe, ob die KI sauber mit **`[Nicht in Quelle]`** ablehnt, statt branchenübliche Vertragsstrafen zu erfinden.
3. **Q4-Mutationstest (`4h → 2h`):** Ändere in `sla-betriebsmodell.md` testweise `4 Stunden` auf `2 Stunden` (bzw. nutze den Test-Auszug in Schritt 03) und prüfe, ob die KI treu **`2 Stunden (sla-betriebsmodell.md)`** statt `4 Stunden` meldet (danach wieder `4 Stunden` herstellen!).

---

## Teil B — 30 Min. Praxis-Pfad (Dein Ziel-Labor)

Wähle in Schritt 04 der Workshop-App dein gewähltes Ziel:
- **Besser Prompten:** Baue dein eigenes Few-Shot-/Chain-of-Thought-/Prompt-Chaining-Paket mit Abbruchkriterium bei fehlender Quelle.
- **App bauen:** Erstelle einen Umsetzungsplan inkl. Testplan ausschließlich auf Basis der belegten Spezifikation (z. B. `runbook` + `adr` im L2-Modul) — ohne erfundene Endpoints.
- **Präsentation bauen:** Formuliere 5 Kernaussagen inkl. Beleg-Link (`[[Slug]]`) und mindestens einer offenen Wissenslücke als Risiko-Folie.
- **KI im Alltag:** Erstelle in der **Regelwerk-Werkstatt** deine eigene 4-Säulen-Projektdatei (`AGENTS.md`, `Langdock / Projects / Gems` Custom Instructions oder IDE-Regeln) mit klarem Scope, Quellenregel, Nicht-Wissen-Regel und Ausgabeformat.

---

## Teil C — Ergebnis-Validierung & Take-away (5 Minuten)

1. Kopiere das letzte Ergebnis deiner KI in Schritt 04 in den **Ergebnis-Validator** der Workshop-App (Tab *„KI-Ergebnis prüfen“*).
2. Überprüfe:
   - Wurden mindestens 2 belegte Quellen zitiert?
   - Wurden nicht belegte Claims ehrlich markiert statt geraten?
   - Wurden Widersprüche (`widerspruch`) erkannt?
3. Hake deine **Definition-of-Done-Checkliste** für dein Ziel ab.
4. Klicke auf **„Workshop-Ergebnis (.md)“** oder **„(.json)“**, um dein persönliches Prompt-, Regelwerk- und Prüfpaket zu sichern.
