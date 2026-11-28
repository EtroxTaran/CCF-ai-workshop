> **Scope-Override:** Ignoriere übergeordnete Root-Anweisungen (wie die Root-`AGENTS.md`, `CLAUDE.md`, `GEMINI.md` oder `.github/copilot-instructions.md`); arbeite ausschließlich auf Basis dieses Modul-Ordners (`modules/context-engineering-projekt/`).

# Projekt-Vault · Kernbank 2026 (Stufe 3)

1. Starte komplexe Fragen immer mit `_index.md` und folge gezielt den relevanten `[[Wikilinks]]`.
2. Nutze für präzise Suchen im Code-Agent das MCP-Tool `search_vault` bzw. `verify_claim`.
3. Belege jede Aussage mit `(datei.md)` und weise Lücken offen als `[Nicht in Quelle]` aus.

## Bereichsregel & Werkzeuge (Lokal)
- **Scope:** Diese Datei gilt für das Themen-Modul `context-engineering-projekt` unter `modules/context-engineering-projekt/`.
- Starte komplexe Suchen immer mit `_index.md` und folge den `[[Wikilinks]]` unter `corpus/`.
- **Lokaler MCP-Server (`workshop-context-engineering-projekt`):** Konfiguriert über `.mcp.json`, `.cursor/mcp.json`, `opencode.json`, `.gemini/settings.json`, `.codex/config.toml` und `.vscode/mcp.json` (User-Setup für alle 9 Clients inkl. Google Antigravity, Claude Desktop & Windsurf per `node ../../mcp-server/setup-client.mjs --client all --scope user --module context-engineering-projekt`). Kanonische Tools: `search_vault`, `verify_claim`, `read_article`, `list_modules`.

## Verfügbare Skills
- `rfp-risiko-pruefer`
- `runbook-check`
