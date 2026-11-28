# Leitfaden: Stufen- & Tool-Isolation (`ISOLATION_GUIDE.md`)

> **Warum Isolation?** Im Workshop durchlaufen Teilnehmende bewusst getrennte Reifegrade (**Stufe 1 Chaos** → **Stufe 2 Guardrails & Skills** → **Stufe 3 Wissens-Vault + MCP**). Wenn ein KI-Tool beim Start aus einem Unterordner automatisch Regeln oder MCP-Konfigurationen aus dem Repository-Root nachlädt, verwischt der Lerneffekt zwischen den Stufen.

---

## 1. Isolations-Matrix über alle 8 IDE- & CLI-Tools

| Tool | Workspace-Scoping vs. Git-Root-Upward-Walk | Gelesene Regel-/Skill-/MCP-Dateien | Verhalten in Stufe 1 / Stufe 2 / Stufe 3 & L2 |
|---|---|---|---|
| **VS Code + GitHub Copilot** | Lädt `.github/copilot-instructions.md` des **geöffneten Workspace-Ordners**; löst `@AGENTS.md`-Verweise nicht automatisch auf | `.github/copilot-instructions.md`, `.vscode/mcp.json` | Immer **Unterordner** (`stufe-1-chaos/`, `stufe-2-skills-guardrails/`, `stufe-3-obsidian-vault/`, `modules/context-engineering-projekt/`) als eigenes Fenster öffnen. Stufe 2 hat bewusst **keine** `.vscode/mcp.json` |
| **Cursor** | Bevorzugt Workspace-Root; sucht bei geöffnetem Repo-Root nach Root-Regeln & `.cursor/` | `AGENTS.md`, `.cursor/rules/*`, `.cursor/mcp.json` | Unterordner als Workspace öffnen; `.cursor/mcp.json` liegt nur im Root, in `stufe-3-obsidian-vault/` und im L2-Modul (**nicht** in Stufe 2) |
| **Google Antigravity** | Workspace-basiertes Scoping auf geöffneten Ordner; globale MCPs liegen im User-Profil | `AGENTS.md`, `GEMINI.md`, `.agents/skills/`, `~/.gemini/config/mcp_config.json` | Unterordner einzeln öffnen; `Scope-Override` in `AGENTS.md` übersteuert Root-Regeln. Für Stufe 1/2 globales MCP temporär deaktivieren (`Additional Options (...) > MCP Servers`) |
| **Windsurf** | Workspace-Regeln auf geöffnetem Ordner; MCP ist global user-scoped | `AGENTS.md`, `.windsurfrules`, `~/.codeium/windsurf/mcp_config.json` | Unterordner als Workspace öffnen; globales MCP während Stufe 1 & 2 deaktiviert lassen |
| **Claude Code** | **Git-Root-Upward-Walk!** Lädt `CLAUDE.md` & `.mcp.json` ggf. vom Git-Root aufwärts bis ins aktuelle `cwd` | `CLAUDE.md` (`@AGENTS.md`), `.claude/skills/`, `.mcp.json` | Immer im Ziel-Unterordner starten (`cd stufe-2-skills-guardrails`) und frische Session beginnen. Stufe 2 enthält bewusst keine `.mcp.json`; bei hartem Stufe-1-Test Rezept in Abschnitt 2 nutzen |
| **Codex CLI** | **Git-Root-Upward-Walk** für `AGENTS.md` bis `cwd` (höchste Spezifität gewinnt); `.codex/config.toml` pro vertrauenswürdigem Projekt oder User-Config | `AGENTS.md`, `.agents/skills/`, `.codex/config.toml` | Im Stufen-Ordner starten (`cd stufe-2-skills-guardrails`); `Scope-Override` überschreibt Root-Regeln. Für Stufe 1 außerhalb des Repos testen, falls Root-`AGENTS.md` mitgeladen wird |
| **Gemini CLI** | **Git-Root-Upward-Walk** für `GEMINI.md`; lädt `.gemini/settings.json` im `cwd` und User-Config | `GEMINI.md` (`@AGENTS.md`), `.agents/skills/`, `.gemini/settings.json` | Im Stufen-Ordner starten; Stufe 2 hat keine `.gemini/settings.json`. User-MCP ggf. erst ab Stufe 3 aktivieren |
| **OpenCode** | Lädt `AGENTS.md` und `opencode.json` primär aus aktuellem Projekt-/Arbeitsverzeichnis (ggf. bis Git-Root) | `AGENTS.md`, `.agents/skills/`, `opencode.json` | Per `cd stufe-1-chaos` → `cd ../stufe-2-skills-guardrails` → `cd ../stufe-3-obsidian-vault` mit frischem Start (`/exit`) wechseln |

### Besonderheit L2 (`modules/context-engineering-projekt/`)
- L2 nutzt die **Single-Cartridge-Architektur** gemäß [ADR-0005](adr/0005-modular-topic-hub.md) ohne 3-fache Kopie der 10 Korpus-Dateien.
- **Stufe 1** arbeitet direkt auf `modules/context-engineering-projekt/corpus/` (ohne Guardrails/Skills); **Stufe 2** und **Stufe 3** arbeiten auf `modules/context-engineering-projekt/` (mit `AGENTS.md`, `skills/`, `_index.md` und ab Stufe 3 mit MCP).
- Alle Stufen- und Modul-`AGENTS.md` tragen ab Stufe 2 (sowie in `stufe-1-chaos/AGENTS.md`) einen expliziten **Scope-Override**-Hinweis, damit übergeordnete Root-Hinweise ignoriert werden.

---

## 2. 1-Zeilen-Rezept für harte Stufe-1-Isolation (außerhalb des Git-Repos)

Wenn ein CLI- oder IDE-Agent wegen eines **Git-Root-Upward-Walks** in `stufe-1-chaos/` dennoch Regeln oder MCP-Konfigurationen aus dem Repo-Root erbt, hilft ein sauberer Ordner **außerhalb des Git-Repositories** (oder direkt ein frischer **Web-Chat**):

```bash
# macOS / Linux (L1 Stufe 1 komplett isoliert außerhalb des Git-Repos)
rm -rf /tmp/ccf-stufe1 && cp -r stufe-1-chaos/docs /tmp/ccf-stufe1 && cd /tmp/ccf-stufe1
```

```powershell
# Windows PowerShell (L1 Stufe 1 komplett isoliert außerhalb des Git-Repos)
Remove-Item -Recurse -Force "$env:TEMP\ccf-stufe1" -ErrorAction SilentlyContinue; Copy-Item -Recurse .\stufe-1-chaos\docs "$env:TEMP\ccf-stufe1"; Set-Location "$env:TEMP\ccf-stufe1"
```

*(Für L2 analog `modules/context-engineering-projekt/corpus/` statt `stufe-1-chaos/docs` kopieren — oder in einem neutralen Web-Chat nur die heruntergeladenen Kompakt-Texte ohne Regeln einfügen.)*

---

## 3. Cloud-SaaS (Langdock, ChatGPT Web, Claude.ai Web, M365 Copilot) vs. lokales `stdio`-MCP

- **Kein lokales `stdio`-MCP im Browser:** Cloud-SaaS-Plattformen wie **Langdock**, **ChatGPT Web**, **Claude.ai Web** und **M365 Copilot** laufen in der Cloud und können keinen lokalen Prozess (`node mcp-server/server.mjs`) per `stdio` auf dem Teilnehmenden-Laptop starten.
- **Saubere Stufen-Isolation in Cloud-Hubs:**
  - **Stufe 1:** Frischer Standard-Chat, nur die Kompakt-Texte einfügen (keine System-Instructions).
  - **Stufe 2:** Neuer Chat oder **Assistant / Project / Gem** mit den 4-Säulen-Regeln im **System-Prompt / Assistant Instructions** und hochgeladenen `.md`-Dateien im **Knowledge Folder**.
  - **Stufe 3:** `_index.md` + `wiki/`-Paket bzw. alle 68 Artikel in den **Knowledge Folder** legen — oder (falls organisatorisch freigeschaltet) ein **Remote MCP (Streamable HTTP / SSE)** bzw. den eingebauten **In-Browser-Faktenprüfer** in Schritt 04 der Workshop-App nutzen.

---

Siehe auch: [README.md](../README.md) · [AGENTS.md](../AGENTS.md) · [PRESENTER_RUNBOOK.md](../PRESENTER_RUNBOOK.md)
