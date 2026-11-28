# GitHub Copilot Instructions · Context Engineering · Projekt & Betrieb

> **Scope-Override:** Ignoriere übergeordnete Repository-Anweisungen im Root; befolge ausschließlich die Regeln dieses Themen-Moduls (`modules/context-engineering-projekt/`) sowie die lokale `AGENTS.md`.

# Projekt-Vault · Kernbank 2026 (Stufe 3)

1. Starte komplexe Fragen immer mit `_index.md` und folge gezielt den relevanten `[[Wikilinks]]`.
2. Nutze für präzise Suchen im Code-Agent das MCP-Tool `search_vault` bzw. `verify_claim`.
3. Belege jede Aussage mit `(datei.md)` und weise Lücken offen als `[Nicht in Quelle]` aus.

## Wissensbasis & Werkzeuge (Lokal)
- Starte komplexe Suchen immer mit `_index.md` und folge den `[[Wikilinks]]` unter `corpus/`.
- **Lokaler MCP-Server (`workshop-context-engineering-projekt`):** Konfiguriert in `.vscode/mcp.json`, `.cursor/mcp.json`, `.mcp.json`, `opencode.json`, `.gemini/settings.json` und `.codex/config.toml` (`search_vault`, `verify_claim`, `read_article`, `list_modules`).

## Verfügbare Skills
- `rfp-risiko-pruefer`
- `runbook-check`
