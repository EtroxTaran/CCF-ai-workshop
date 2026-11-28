> **Scope-Override:** Ignoriere übergeordnete Root-Anweisungen (wie die Root-`AGENTS.md`, `CLAUDE.md`, `GEMINI.md` oder `.github/copilot-instructions.md`); arbeite ausschließlich auf Basis dieses Vault-Ordners (`stufe-3-obsidian-vault/`).

# Projekt-Anweisung: Wissens-Vault (Markdown-RAG)

## Architektur (3 Zonen)
- `raw/`: Unveränderte Quelldateien (nur lesend, nie ändern).
- `wiki/`: Kuratierte, verlinkte Wissensartikel mit YAML-Frontmatter, Tags und `[[Wikilinks]]`.
- `_index.md`: Zentrales Inhaltsverzeichnis als Einstiegspunkt.

## Verbindlicher Such-Workflow
1. **Immer zuerst `_index.md` lesen**, um die relevanten Themenbereiche und Dateien zu identifizieren (nicht blind alle Dateien durchsuchen).
2. Folge gezielt den `[[Wikilinks]]` und YAML-Frontmatter-Feldern (`habitat`, `category`, `tags`) in `wiki/`.
3. Ziehe `raw/` nur heran, wenn Detailinformationen in `wiki/` fehlen oder geprüft werden müssen.

## Verfügbare Skills (`.agents/skills/` & `.claude/skills/`)
- `vault-suche`: Gezielter Einstieg über `_index.md` und schrittweises Folgen von `[[Wikilinks]]`.
- `wissen-synthese`: Saubere, quellenbelegte Zusammenführung über mehrere `wiki/`-Notizen.

## Optionaler MCP-Server (`workshop-wildlife`)
Dieser Ordner bindet den lokalen MCP-Server automatisch über `.mcp.json`, `.cursor/mcp.json`, `opencode.json`, `.gemini/settings.json`, `.codex/config.toml` und `.vscode/mcp.json` ein. User-weite Konfigurationen (z. B. für **Google Antigravity** `~/.gemini/config/mcp_config.json`, **Claude Desktop** oder **Windsurf** `~/.codeium/windsurf/mcp_config.json`) lassen sich über `node ../mcp-server/setup-client.mjs --client all --scope user` erzeugen.
- **4 kanonische MCP-Tools:** `search_vault`, `verify_claim`, `read_article`, `list_modules`
- **3 L1-Kompatibilitäts-Aliase:** `search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article`
- **Resources:** `vault://_index.md` und `vault://wiki/<kategorie>/<slug>.md`

## Verbindliche Guardrails
- Antworte ausschließlich auf Basis von `wiki/` und `raw/`.
- Zitiere immer die exakten Artikel-Links (`[[Artikelname]]`) bzw. Dateipfade.
- Wenn eine Information fehlt, sage es offen – erfinde nichts.
- Markiere mögliche Widersprüche zwischen Dateien explizit (bei Nutzung von `verify_claim` bzw. `verify_claim_against_corpus` wird ein erkannter Zahlen- oder Negationskonflikt direkt als `widerspruch` gemeldet).
