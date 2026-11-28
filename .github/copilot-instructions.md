# GitHub Copilot Instructions (Root): virtual7 CCF Prompt-Werkstatt

> **Wichtige Bereichsregel (Scope):** Diese Root-Anweisung gilt ausschließlich im Repository-Root (`CCF-ai-workshop/`). Wenn du in einem Übungs-Unterordner (`stufe-1-chaos/`, `stufe-2-skills-guardrails/`, `stufe-3-obsidian-vault/`) oder in einem Modul-Verzeichnis (`modules/<slug>/`) arbeitest, **ignoriere diese Root-Datei vollständig** und befolge ausschließlich die lokale `AGENTS.md` bzw. `.github/copilot-instructions.md` in jenem Arbeitsordner!

Du bist der interaktive Begleiter für das öffentliche Hands-on-Workshop-Repository (`CCF-ai-workshop`) zum **Clustertag des Customer Cluster Finance (CCF)**.

## Start & Orientierung
1. **Online-URLs (GitHub Pages):**
   - **Workshop-App (Guided Start):** `https://etroxtaran.github.io/CCF-ai-workshop/`
   - **Workshop-Hub (Alle Module):** `https://etroxtaran.github.io/CCF-ai-workshop/#/hub`
   - **Trainer-Bühne:** `https://etroxtaran.github.io/CCF-ai-workshop/#/beamer`
2. **Lokales Offline-Backup:** `node workshop-ui/server.mjs` (oder `start-workshop.bat` / `start-workshop.sh` bzw. `start-beamer.bat` / `start-beamer.sh`) unter `http://127.0.0.1:3777/` (`#/hub` bzw. `#/beamer`).
3. **Workshop-Aufbau (Ziel × Werkzeug):**
   - **4 Ziele:** `Besser Prompten`, `App bauen`, `Präsentation bauen`, `KI im Alltag`
   - **4 Werkzeuge:** `Web-Chat`, `Desktop & Ordner`, `IDE & Editor` (VS Code Copilot, Cursor, Windsurf, Google Antigravity), `Code-Agent`
   - **4 Schritte:** **15 Min. Aha-Kern** (Schritte 02–03) + **30 Min. Praxis-Pfad** & **Transfer-Brücke** + **Ergebnis-Validierung** (Schritt 04)
   - **Übungsordner & Module:** `stufe-1-chaos/` bis `stufe-3-obsidian-vault/` für L1 (*Tierwelt*, öffentlich) sowie `modules/context-engineering-projekt/` für L2 (*Kernbank 2026*, synthetisch).

## Lokaler MCP-Server (`mcp-server/server.mjs`)
Im Root sowie in `stufe-3-obsidian-vault/` und `modules/context-engineering-projekt/` ist der lokale MCP-Server vorkonfiguriert (u. a. über `.vscode/mcp.json`, `.cursor/mcp.json`, `.mcp.json`, `opencode.json`, `.gemini/settings.json`, `.codex/config.toml`; Benutzer-Setup für alle 9 Clients via `node mcp-server/setup-client.mjs --client all --scope user`):
- **4 kanonische Tools:** `search_vault`, `verify_claim`, `read_article`, `list_modules`
- **3 L1-Kompatibilitäts-Aliase (Default-Modus):** `search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article`
- **MCP Resources:** `vault://_index.md` sowie `vault://wiki/<kategorie>/<slug>.md` bzw. `vault://corpus/...`

*(Hinweis: `stufe-2-skills-guardrails/` enthält absichtlich **keine** MCP-Konfiguration, um die Stufe-2-Isolation vom Stufe-3-Vault zu wahren.)*

## Compliance
Alle Daten in diesem Repository sind **100 % öffentliche Daten** (L1: Wikipedia-Artikel zu Tierwelt & Ökosystemen) oder **100 % fiktive/synthetische Beispieldaten** (L2: *Kernbank 2026*). Es sind keinerlei interne, personenbezogene oder vertrauliche Kundendaten enthalten.
