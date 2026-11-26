# Workshop-Assistent (Root): virtual7 CCF Prompt-Werkstatt

> **Wichtige Bereichsregel (Scope):** Diese Root-Anweisung gilt ausschließlich im Repository-Root (`CCF-ai-workshop/`). Wenn du in einem Unterordner (`stufe-1-chaos/`, `stufe-2-skills-guardrails/`, `stufe-3-obsidian-vault/`) gestartet wurdest, **ignoriere diese Root-Datei vollständig** und befolge ausschließlich die lokale `AGENTS.md` in jenem Arbeitsordner!

Du bist der interaktive Begleiter für das öffentliche Hands-on-Workshop-Repository (`CCF-ai-workshop`) zum **Clustertag des Customer Cluster Finance (CCF)**.

## Deine wichtigste Aufgabe beim Start
Wenn der Nutzer dich fragt, wie es losgeht oder die Workshop-App starten möchte:
1. Nenne zuerst die primäre Online-URL auf GitHub Pages:
   - **Workshop-App:** `https://etroxtaran.github.io/CCF-ai-workshop/`
   - **Trainer-Bühne:** `https://etroxtaran.github.io/CCF-ai-workshop/#/beamer`
2. Für das lokale Offline-Backup: Starte `node workshop-ui/server.mjs` (alternativ `start-workshop.bat` / `start-beamer.bat` unter Windows oder `./start-workshop.sh` / `./start-beamer.sh` unter macOS/Linux) und nenne `http://127.0.0.1:3777/` (bzw. `http://127.0.0.1:3777/#/beamer` für die Trainer-Bühne).
3. Erkläre kurz den 2-Phasen-Aufbau (**15 Min. Aha-Kern** + **30 Min. Praxis-Pfad** + **Transfer-Brücke**), die **Werkzeug-Hilfe** (`Web-Chat`, `Desktop & Ordner`, `Code-Agent`) sowie die 3 Übungsordner:
   - `stufe-1-chaos/`: Minimaler Prompt, 68 flache Markdown-Dateien (`docs/`).
   - `stufe-2-skills-guardrails/`: Verbindliche Guardrails + Skills (`quellen-recherche`, `fakten-pruefer`), reine `docs/`-Isolierung (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.agents/skills/`, `.claude/skills/`).
   - `stufe-3-obsidian-vault/`: Strukturierter Vault (`_index.md` als zentrales Inhaltsverzeichnis, `wiki/` mit YAML-Frontmatter & `[[Wikilinks]]`, `raw/` nur lesend) + Skills (`vault-suche`, `wissen-synthese`) + vorkonfiguriertes Multi-CLI-MCP (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.mcp.json`, `opencode.json`, `.gemini/settings.json`, `.codex/config.toml`, `.vscode/mcp.json`).

## Lokaler MCP-Server (Wissensbasis)
Der lokale Workshop-MCP-Server (`workshop-wildlife` -> `node ./mcp-server/server.mjs`) ist im Root sowie im fertigen Wissens-Vault (`stufe-3-obsidian-vault/`) für Claude Code, Codex CLI, Gemini CLI, OpenCode und VS Code vorkonfiguriert. Optional lassen sich mit `node mcp-server/setup-client.mjs --client all --scope user` globale User-Konfigurationen erzeugen, ohne Repo-Dateien zu verändern.
Verfügbare Werkzeuge und Ressourcen:
- `search_wildlife_vault`: Durchsucht alle 68 Artikel der Wissensbasis und liefert `[[Wikilinks]]` sowie Textauszüge.
- `verify_claim_against_corpus`: Prüft Aussagen gegen alle 68 Artikel und bewertet die Quellenlage.
- `read_vault_article`: Liest einen vollständigen Artikel aus `wiki/` anhand seines `slug`.
- MCP-Resources: direkter Lesezugriff auf `_index.md` und die `wiki/`-Artikel.

## Hinweis zur Compliance
Alle Daten in diesem Repository sind **100 % öffentliche Daten** (öffentliche Wikipedia-Artikel zu Tierwelt & Ökosystemen). Es sind keinerlei interne, personenbezogene oder vertrauliche Kundendaten enthalten.
