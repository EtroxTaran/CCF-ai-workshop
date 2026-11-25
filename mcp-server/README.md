# Workshop MCP Server (`workshop-wildlife`)

Ein **komplett abhängigkeitsfreier** Node.js-MCP-Server (`>= 18`), der über `stdio` (JSON-RPC 2.0) die gemeinsame Korpus-Engine (`../shared/corpus-engine.mjs`) nutzt und **3 Tools** sowie **MCP-Resources** bereitstellt:

## Tools
1. **`search_wildlife_vault`** — Durchsucht den strukturierten Vault (`stufe-3-obsidian-vault/wiki/`, mit Datei-`mtime`-Cache) und liefert `[[Wikilinks]]`, Treffer-Scores und Textauszüge.
2. **`verify_claim_against_corpus`** — Prüft Aussagen gegen alle 68 lokalen Artikel und deckt unbelegte Behauptungen bzw. Fangfragen (inkl. strengem Rauschfilter) auf.
3. **`read_vault_article`** — Liest den vollständigen Markdown-Inhalt eines Artikels oder von `_index` anhand von Slug, Titel, `[[Wikilink]]` oder relativem Pfad.

## MCP Resources (`resources/list` & `resources/read`)
- `vault://_index.md` — Zentrale Übersichtskarte des Obsidian-Vaults.
- `vault://wiki/<kategorie>/<slug>.md` — Alle 68 kuratierten Wiki-Artikel.

## Einbindung in KI-Tools

Im Repository-Root (`.mcp.json`), in `.vscode/mcp.json` sowie in `stufe-2-skills-guardrails/.mcp.json` und `stufe-3-obsidian-vault/.mcp.json` liegen bereits fertige Projekt-Konfigurationen.

Für globale/benutzerweite oder absolute Pfade steht der Setup-Helfer bereit:

```bash
node mcp-server/setup-client.mjs --client all --dry-run
node mcp-server/setup-client.mjs --client claude --scope user
```

Weitere Vorlagen liegen in `mcp-config-examples/`:
- `claude-code.mcp.json`
- `gemini-cli.settings.json`
- `codex.config.toml`
- `vscode-cursor.mcp.json`
