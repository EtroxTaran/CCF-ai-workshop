# Workshop MCP Server (`workshop-wildlife` / modulare Wissensbasen)

Ein **komplett abhängigkeitsfreier** Node.js-MCP-Server (`>= 18`), der über `stdio` (JSON-RPC 2.0) die gemeinsame Korpus-Engine (`../shared/corpus-engine.mjs`) nutzt und **4 kanonische Tools** (plus **3 L1-Kompatibilitäts-Aliase** im Default-Modus) sowie **MCP-Resources** bereitstellt — standardmäßig für L1 (`prompt-werkstatt-tierwelt` in `stufe-3-obsidian-vault/wiki/`), per `--module <slug>` für jedes beliebige Modul unter `modules/<slug>/`.

## Start & Modulwahl

```bash
# Standard: L1 Tierwelt (stufe-3-obsidian-vault) — liefert 7 Tools (4 kanonisch + 3 L1-Aliase)
node mcp-server/server.mjs

# Nur die 4 kanonischen Tools in tools/list (empfohlen für neue Clients / L2-Parität)
node mcp-server/server.mjs --canonical-only
# oder via Umgebungsvariable:
WORKSHOP_MCP_CANONICAL_ONLY=1 node mcp-server/server.mjs

# Gezielt für ein anderes Modul (z. B. L2 Kernbank 2026) — liefert automatisch die 4 kanonischen Tools
node mcp-server/server.mjs --module context-engineering-projekt
# oder via Umgebungsvariable:
WORKSHOP_MODULE=context-engineering-projekt node mcp-server/server.mjs
```

Ungültige oder unbekannte `--module`-Slugs brechen sofort mit Exit-Code `1` und klarer Fehlermeldung auf `stderr` ab. Außerdem unterstützt jedes Tool optional den Parameter `"module": "<slug>"` pro Aufruf, sodass ein Client dynamisch und modulübergreifend abfragen kann (auch auf einer L1-Instanz, z. B. `search_vault({ query: "SEPA", module: "context-engineering-projekt", category: "runbook" })`).

## Tools (4 Kanonische Tools + 3 L1-Aliase)

Alle Tools tragen Read-Only-MCP-`annotations` (`readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`). `tools/call` akzeptiert unabhängig vom Modus immer alle 7 Tool-Namen.

### Kanonische Tools (`tools/list` in L2 & mit `--canonical-only` / `WORKSHOP_MCP_CANONICAL_ONLY=1`)
1. **`search_vault`** — Durchsucht den aktiven Korpus (oder ein per `module` gewähltes Modul, mit Datei-`mtime`-Cache) und liefert `[[Wikilinks]]`, Treffer-Scores und Textauszüge. Optionaler `category`-Filter (kein starrer Enum-Lock; bei 0 Treffern mit Kategoriefilter liefert die Antwort `available_categories`).
2. **`verify_claim`** — Prüft Aussagen gegen alle lokalen Dokumente des gewählten Moduls, erkennt unbelegte Behauptungen (`nicht_belegt`), teilweise Abdeckung (`teilweise`), belegte Aussagen (`belegt`) und Zahlen-/Negations-Widersprüche (`widerspruch` inkl. `mismatch_reasons`).
3. **`read_article`** — Liest den vollständigen Markdown-Inhalt eines Dokuments oder von `_index` anhand von Slug, Titel, `[[Wikilink]]` oder relativem Pfad (inkl. Schutz vor Path-Traversal).
4. **`list_modules`** — Listet alle verfügbaren Module unter `modules/` inklusive `categories` pro Modul und markiert das aktive Modul.

### L1-Kompatibilitäts-Aliase (zusätzlich in `tools/list` im L1-Default-Modus)
- **`search_wildlife_vault`** → Alias für `search_vault`
- **`verify_claim_against_corpus`** → Alias für `verify_claim`
- **`read_vault_article`** → Alias für `read_article`

## MCP Resources (`resources/list` & `resources/read`)
- `vault://_index.md` — Zentrale Übersichtskarte des aktiven Moduls / Obsidian-Vaults.
- `vault://wiki/<kategorie>/<slug>.md` bzw. `vault://corpus/...` — Alle Artikel des aktiven Moduls (`AGENTS.md`, `CLAUDE.md` und `GEMINI.md` werden defensiv aus dem Korpus-Scan ausgeschlossen).

## Einbindung in KI-Tools (Alle 9 lokalen Clients)

### 1. Vorkonfigurierte Projekt-Dateien (6 Clients)
Im Repository-Root, im fertigen Vault (`stufe-3-obsidian-vault/`) sowie in modularen Projekt-Ordnern (`modules/context-engineering-projekt/`) sind die Projekt-Konfigurationen vorkonfiguriert *(Hinweis: `stufe-2-skills-guardrails/` bleibt bewusst frei von MCP-Konfigs)*:
- **Claude Code:** `.mcp.json`
- **OpenCode:** `opencode.json`
- **Gemini CLI:** `.gemini/settings.json`
- **Codex CLI:** `.codex/config.toml` *(greift in als vertrauenswürdig markierten Ordnern; andernfalls `--scope user` nutzen)*
- **VS Code Copilot:** `.vscode/mcp.json`
- **Cursor:** `.cursor/mcp.json`

### 2. User-Only-Clients (`--scope user`, 3 Clients)
Diese Desktop-/IDE-Tools laden MCP-Konfigurationen global aus dem Benutzerprofil (und werden bei `setup-client.mjs --scope project --client all` sauber übersprungen bzw. beim Einzelaufruf mit Exit-Code `1` abgewiesen):
- **Google Antigravity:** `~/.gemini/config/mcp_config.json` (UI: `Additional Options (...) > MCP Servers`, Beispiel: [antigravity.mcp_config.json](mcp-config-examples/antigravity.mcp_config.json))
- **Claude Desktop:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows), `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `$XDG_CONFIG_HOME/Claude/claude_desktop_config.json` bzw. `~/.config/Claude/claude_desktop_config.json` (Linux) (Beispiel: [claude-desktop.claude_desktop_config.json](mcp-config-examples/claude-desktop.claude_desktop_config.json))
- **Windsurf:** `~/.codeium/windsurf/mcp_config.json` (Beispiel: [windsurf.mcp_config.json](mcp-config-examples/windsurf.mcp_config.json))

### 3. Setup-Helfer (`setup-client.mjs`)
Für benutzerweite Konfigurationen mit absoluten Pfaden (ohne Git-Änderungen im Repo) richtet der Setup-Helfer alle 9 Clients ein (`claude`, `claude-desktop`, `opencode`, `gemini`, `antigravity`, `codex`, `vscode`, `cursor`, `windsurf`):

```bash
# Dry-Run für alle 9 Clients (L1 Standard: workshop-wildlife)
node mcp-server/setup-client.mjs --client all --scope user --dry-run

# Dry-Run für L2 (workshop-context-engineering-projekt)
node mcp-server/setup-client.mjs --client all --module context-engineering-projekt --scope user --dry-run

# Einzelnen Client global konfigurieren (inkl. optionalem --node-bin für GUI-Apps ohne node im PATH)
node mcp-server/setup-client.mjs --client antigravity --scope user --node-bin execPath
node mcp-server/setup-client.mjs --client claude-desktop --scope user
node mcp-server/setup-client.mjs --client windsurf --scope user
node mcp-server/setup-client.mjs --client cursor --scope user
```

*(Hinweis: `setup-client.mjs` schützt getrackte Projektdateien im Repo inklusive `.cursor/mcp.json` unter `--scope project`, solange kein `--force` übergeben wird.)*

## Cloud-SaaS vs. lokales `stdio`-MCP
Cloud-Hubs und reine Web-Chats (**Langdock**, **ChatGPT Web**, **Claude.ai Web**, **M365 Copilot**) laufen in einer Cloud-Sandbox und können **keinen** lokalen Prozess wie `node mcp-server/server.mjs` über `stdio` starten.

In diesen Werkzeugen nutzt der Workshop stattdessen:
1. **Assistant Instructions / Custom Instructions + Knowledge Folder** (Stufe-2-/Stufe-3-Dateien bzw. die `<= 7.500`-Zeichen-Kompaktpakete aus der Workshop-App),
2. **Remote MCP (Streamable HTTP / SSE) oder Plattform-Integrations** (sofern ein entsprechender Endpunkt im Enterprise-Tenant freigegeben ist),
3. sowie den **eingebauten Browser-Faktenprüfer** in Schritt 04 der Workshop-App.
