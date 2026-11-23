# Workshop MCP Server (`workshop-wildlife`)

Ein **komplett abhängigkeitsfreier** Node.js-MCP-Server (`>= 18`), der über `stdio` (JSON-RPC 2.0) drei Werkzeuge bereitstellt:

1. **`search_wildlife_vault`** — Sucht gezielt im strukturierten Vault (`stufe-3-obsidian-vault/wiki/`) und liefert `[[Wikilinks]]` + Textauszüge.
2. **`verify_claim_against_corpus`** — Prüft Aussagen auf Belege vs. Lücken im lokalen Korpus.
3. **`send_to_beamer`** — Speichert eine Frage/KI-Antwort als JSON in `live-questions/` **und** sendet sie bei erreichbarem LAN-Server live auf den Beamer (`/beamer`).

## Schnelltest per Terminal

```bash
node mcp-server/submit-question.mjs --team "Tisch 1" --question "Wie überwintern Alpenmurmeltiere?" --stage "Stufe 3"
```

## Einbindung in KI-Tools

Im Repository-Root liegt bereits eine fertige [`.mcp.json`](../.mcp.json) für Claude Code.
Weitere Vorlagen findest du in `mcp-config-examples/`:
- `claude-code.mcp.json`
- `gemini-cli.settings.json`
- `codex.config.toml`
- `vscode-cursor.mcp.json`

Wenn der Beamer-Server im Raum auf der IP des Trainers läuft (z. B. `192.168.178.42`), setze einfach die Umgebungsvariable `BEAMER_URL=http://192.168.178.42:3777/api/submissions` oder gib `beamer_url` direkt beim Tool-Aufruf an.
