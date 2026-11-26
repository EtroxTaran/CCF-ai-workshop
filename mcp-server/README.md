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

Im Repository-Root sowie im fertigen Vault (`stufe-3-obsidian-vault/`) sind die Projekt-Konfigurationen bereits für **alle** wichtigen Clients vorkonfiguriert (während `stufe-2-skills-guardrails/` bewusst rein mit den lokalen `docs/`-Dateien arbeitet):
- **Claude Code:** `.mcp.json`
- **OpenCode:** `opencode.json`
- **Gemini CLI:** `.gemini/settings.json`
- **Codex CLI:** `.codex/config.toml`
- **VS Code:** `.vscode/mcp.json`

*(Hinweis zu Codex CLI: Projekt-`.codex/config.toml` greift in als vertrauenswürdig markierten Ordnern; andernfalls einfach `--scope user` nutzen.)*

Für globale/benutzerweite Konfigurationen mit absoluten Pfaden (ohne Git-Änderungen im Repo!) steht der Setup-Helfer bereit:

```bash
node mcp-server/setup-client.mjs --client all --scope user --dry-run
node mcp-server/setup-client.mjs --client opencode --scope user
node mcp-server/setup-client.mjs --client claude --scope user
```

Weitere Vorlagen liegen in `mcp-config-examples/`:
- `claude-code.mcp.json`
- `opencode.json`
- `gemini-cli.settings.json`
- `codex.config.toml`
- `vscode.mcp.json`
- `cursor.mcp.json`
