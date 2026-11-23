# Prompt-Werkstatt · virtual7 CCF Clustertag (Hands-on)

> **Vom ungefilterten Chat zum verlässlichen KI-System:** Ein 60-minütiges, tool-agnostisches Hands-on-Labor mit 68 öffentlichen Wikipedia-Artikeln (Tierwelt & Ökosysteme) – ohne Docker, ohne Vektordatenbank, 100 % konform zur virtual7 KI-Richtlinie.

---

## 1-Klick-Start (Empfohlen für alle)

Nach dem Auschecken/Herunterladen einfach starten:
- **Windows:** Doppelklick auf `start-workshop.bat`
- **macOS / Linux:** `./start-workshop.sh`
- **Oder über deinen KI-Agenten (Track B):** Öffne diesen Ordner in Claude Code, Codex, Gemini CLI oder OpenCode und sage: *„Starte die Workshop-UI für mich.“*

Das öffnet deine **interaktive Workshop-Begleit-UI (shadcn/ui)** im Browser unter `http://127.0.0.1:3777/` mit:
- **Schritt-für-Schritt-Fortschrittstracker** (inkl. Checkliste im Browser)
- **Prompt-Methoden-Labor** (gleiche Frage in Zero-Shot, CO-STAR, Few-Shot & RISEN + Chain-of-Thought mit 1-Klick-Copy)
- **System-Prompt vs. Priming vs. User-Prompt**
- **Stufe 1 → Stufe 2 → Stufe 3** (inkl. 1-Klick-Copy-Paketen für Web-Chats & interaktivem Vault-Explorer)
- **Tools & MCP-Playground** + **„An den Beamer senden“-Gimmick**

> **Hinweis:** Die UI liegt bereits fertig gebaut in `workshop-ui/dist/` vor – du brauchst **kein `npm install`**. Falls kein Node.js installiert ist, nutzen `start-workshop.bat`/`.sh` automatisch Python als Fallback.

---

## Zwei Wege durch den Workshop („Für jeden etwas“)

Es geht nicht um „Technik vs. Nicht-Technik“ – alle erleben dieselben Prinzipien, wählen aber das Werkzeug, das zu ihrem Alltag passt:

- **Track A · Browser & Web-Chat** (z. B. ChatGPT, Claude, Gemini, Langdock-Demo-Stil):
  - Nutze die lokalen UI-Karten unter `http://127.0.0.1:3777/`, kopiere System-Prompts, Skills und ausgewählte Quelldateien per Klick in deinen Browser-Chat und schicke dein Ergebnis per Button auf die Leinwand.
- **Track B · Terminal, IDE & Code-Agent** (z. B. Claude Code, OpenAI Codex, Gemini CLI, OpenCode):
  - Öffne nacheinander `stufe-1-chaos/`, `stufe-2-skills-guardrails/` und `stufe-3-obsidian-vault/` als Arbeitsverzeichnis, teste dieselben 4 Fragen und binde optional den mitgelieferten MCP-Server (`mcp-server/server.mjs`) ein.

---

## Die 3 Projekt-Stufen im Überblick

| Stufe | Ordner | Was steckt drin? | Was erleben wir? |
|---|---|---|---|
| **Stufe 1** | `stufe-1-chaos/` | Minimaler Prompt (`AGENTS.md`) + 68 flache `.md`-Dateien in `docs/` | **Ungefilterter Chat:** Halluzinationen, fehlende Quellen, vage Antworten |
| **Stufe 2** | `stufe-2-skills-guardrails/` | Klare Guardrails + 2 Skills (`quellen-recherche`, `fakten-pruefer`) + `docs/` | **Harness & Leitplanken:** Quellenpflicht, ehrliches „nicht enthalten“ |
| **Stufe 3** | `stufe-3-obsidian-vault/` | `_index.md` (MOC) + `wiki/` (Frontmatter + `[[Wikilinks]]`) + `raw/` + Vault-Skills | **Markdown-RAG:** Strukturierte Navigation über Index & Wissens-Graph |

Zusätzlich im Repository:
- **`mcp-server/`**: Abhängigkeitsfreier Node-MCP-Server (`search_wildlife_vault`, `verify_claim_against_corpus`, `send_to_beamer`) inkl. `.mcp.json` im Root.
- **`live-questions/`**: Eingang für Live-Fragen & KI-Ergebnisse der Teams für den Beamer.
- **`presentation/`**: Foliensatz im virtual7-Master (`CCF_HandsOn_Prompt_Werkstatt.pptx`).
- **`aufgaben.md`** & **`LOESUNGEN_TRAINER.md`**: Vollständiges Aufgabenblatt und verifizierte Musterlösungen inkl. 10-Minuten-Demo-Leitfaden.

---

## Für Trainer / Moderator (Beamer-Ansicht)

1. Starte `start-beamer.bat` (Windows) oder `./start-beamer.sh` (macOS/Linux) bzw. `node workshop-ui/server.mjs`.
2. Öffne auf dem Beamer **`http://127.0.0.1:3777/beamer`**.
3. Teile den Teilnehmenden im WLAN deine **LAN-URL** (wird beim Start im Terminal und in den Beamer-Einstellungen angezeigt) oder konfiguriere in den Beamer-Einstellungen optional ein öffentliches GitHub-Repo für den **Issue-Watcher** (Dual-Modus).
4. Optional für Live-KI-Auswertung auf dem Beamer: Hinterlege einen API-Key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`) oder `OLLAMA_MODEL` als Umgebungsvariable – ohne Key greift automatisch der ausfallsichere deterministische Korpus-Prüfer.

---

## Reproduzierbarer Datenkorpus

Alle 68 Artikel stammen aus der deutschsprachigen Wikipedia (Tierwelt & Ökosysteme: 5 Lebensräume, 48 Tierarten, 15 ökologische Konzepte) und wurden mit `scripts/fetch_corpus.py` und `scripts/build_vault.py` erzeugt:

```bash
python scripts/fetch_corpus.py
python scripts/build_vault.py
python scripts/verify_workshop.py
```
