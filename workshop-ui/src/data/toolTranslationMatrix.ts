import type { ToolMode } from "@/types/workshop";

export interface ToolTranslationRow {
  id: string;
  toolName: string;
  groupLabel: string;
  toolMode: ToolMode;
  systemRole: string;
  rulesGuardrails: string;
  knowledgeContext: string;
  toolsMcp: string;
  verification: string;
}

export type ToolTranslationEntry = ToolTranslationRow;

export function buildToolTranslationMatrix(stageFolders?: {
  stufe1?: string;
  stufe2?: string;
  stufe3?: string;
}): ToolTranslationRow[] {
  const stage2 = stageFolders?.stufe2 || "stufe-2-skills-guardrails";
  const stage3 = stageFolders?.stufe3 || "stufe-3-obsidian-vault";
  const isUnifiedModule = Boolean(
    stageFolders?.stufe2 && stageFolders.stufe2 === stageFolders.stufe3
  );

  const coworkKnowledge = isUnifiedModule
    ? `Entpackter Modul-Ordner (${stage3}/)`
    : stageFolders?.stufe2 || stageFolders?.stufe3
      ? `Entpackter Stufen-Ordner (z. B. ${stage2}/ oder ${stage3}/)`
      : "Entpackter Stufen-Ordner (z. B. stufe-2/ oder stufe-3/)";

  const antigravityGuardrails = isUnifiedModule
    ? ".agents/skills/ + Scope-Override pro Modul-Workspace"
    : ".agents/skills/ + Scope-Override pro Stufen-Workspace";

  const claudeCodeKnowledge = `cd ${stage3} + Einstieg über _index.md`;

  const codexGuardrails = isUnifiedModule
    ? ".agents/skills/ + Scope-Override pro Modul-Workspace"
    : ".agents/skills/ + Scope-Override pro Stufen-Ordner";

  const opencodeGuardrails = isUnifiedModule
    ? ".agents/skills/ + Guardrails im Modul-Ordner"
    : ".agents/skills/ + Guardrails im Stufen-Ordner";

  return [
    // Gruppe 1: Web-Chats & Enterprise-Hubs
    {
      id: "chatgpt-web",
      toolName: "ChatGPT (Web)",
      groupLabel: "Web-Chats & Enterprise-Hubs",
      toolMode: "web",
      systemRole: "Custom Instructions oder Priming-Absatz am Chat-Start",
      rulesGuardrails: "Verbindliche Chat-Regeln + „[Nicht in Quelle]“ am Chat-Start",
      knowledgeContext: "Kompakt-Paket (<= 7.500 Z.) oder .md-Datei per „+“ hochladen",
      toolsMcp: "Canvas & Web-Suche (kein lokales stdio-MCP im Browser)",
      verification: "Fangfrage + Output-Validator in Schritt 04",
    },
    {
      id: "claude-web",
      toolName: "Claude.ai (Web)",
      groupLabel: "Web-Chats & Enterprise-Hubs",
      toolMode: "web",
      systemRole: "Stil-Vorgabe oder System-Briefing in Nachricht 1",
      rulesGuardrails: "Quellenpflicht (datei.md) + Lücken-Verbot am Chat-Start",
      knowledgeContext: "Kompakt-Paket (<= 7.500 Z.) oder .md-Upload",
      toolsMcp: "Artifacts & Remote Connectors (kein lokales stdio-MCP)",
      verification: "Fangfrage + Output-Validator in Schritt 04",
    },
    {
      id: "langdock-web",
      toolName: "Langdock",
      groupLabel: "Web-Chats & Enterprise-Hubs",
      toolMode: "web",
      systemRole: "System-Prompt / Prompt-Vorlage im sicheren Firmen-Chat",
      rulesGuardrails: "Strikte Quellenbindung + „[Nicht in Quelle]“ in Chat-Regeln",
      knowledgeContext: "Kompakt-Paket einfügen oder .md-Dateien im Chat anhängen",
      toolsMcp: "Langdock Integrations & Remote MCP (kein lokales stdio-MCP)",
      verification: "Fangfrage + Output-Validator in Schritt 04",
    },
    {
      id: "m365-copilot",
      toolName: "M365 Copilot",
      groupLabel: "Web-Chats & Enterprise-Hubs",
      toolMode: "web",
      systemRole: "Rolle & Ziel im Prompt-Header (Work- vs. Web-Kontext)",
      rulesGuardrails: "Explizite Quellenpflicht + Verbot von Trainingswissen",
      knowledgeContext: "Hochgeladene .md-Dateien oder M365-Dokumente",
      toolsMcp: "Graph Connectors / Copilot Studio (kein lokales stdio-MCP)",
      verification: "Manuelle Belegprüfung + Output-Validator",
    },
    {
      id: "gemini-web",
      toolName: "Google Gemini",
      groupLabel: "Web-Chats & Enterprise-Hubs",
      toolMode: "web",
      systemRole: "Rollen- & Format-Briefing zu Gesprächsbeginn",
      rulesGuardrails: "Anti-Raten-Regeln + „[Nicht in Quelle]“ am Chat-Start",
      knowledgeContext: "Kompakt-Paket oder .md-Datei über „+“ hochladen",
      toolsMcp: "Canvas & Google Extensions (kein lokales stdio-MCP)",
      verification: "Fangfrage + Output-Validator in Schritt 04",
    },

    // Gruppe 2: Desktop & Projects
    {
      id: "claude-desktop-cowork",
      toolName: "Claude Desktop / Cowork",
      groupLabel: "Desktop & Projects",
      toolMode: "desktop",
      systemRole: "Ordner-Anweisung + globale Desktop-Instruktion",
      rulesGuardrails: "AGENTS.md / CLAUDE.md + Skills direkt aus dem Ordner",
      knowledgeContext: coworkKnowledge,
      toolsMcp: "Lokaler stdio-MCP über claude_desktop_config.json",
      verification: "verify_claim + Fangfrage direkt im Ordner-Chat",
    },
    {
      id: "projects-chatgpt-claude",
      toolName: "ChatGPT / Claude Projects",
      groupLabel: "Desktop & Projects",
      toolMode: "desktop",
      systemRole: "Dauerhafte Project Instructions (System-Prompt)",
      rulesGuardrails: "Quellenpflicht & Lückenmarker fest in Instructions",
      knowledgeContext: "Project Knowledge (.md-Gesamtpaket einmal hochladen)",
      toolsMcp: "Canvas / Artifacts & Remote Connectors (kein lokales stdio-MCP)",
      verification: "Fangfrage gegen Knowledge-Files + Output-Validator",
    },
    {
      id: "gemini-gems",
      toolName: "Gemini Gems",
      groupLabel: "Desktop & Projects",
      toolMode: "desktop",
      systemRole: "Gem-Systemanweisung als dauerhafte Rolle",
      rulesGuardrails: "Quellenpflicht & „[Nicht in Quelle]“ in Gem-Regeln",
      knowledgeContext: "Hochgeladene .md-Dateien im Gem-Wissensbereich",
      toolsMcp: "Canvas & Workspace-Tools (kein lokales stdio-MCP)",
      verification: "Fangfrage + Output-Validator in Schritt 04",
    },
    {
      id: "langdock-assistants",
      toolName: "Langdock Assistants",
      groupLabel: "Desktop & Projects",
      toolMode: "desktop",
      systemRole: "Assistant Instructions (dauerhafter System-Prompt)",
      rulesGuardrails: "Verbindliche Leitplanken fest im Assistant gespeichert",
      knowledgeContext: "Langdock Knowledge Folder mit kuratiertem .md-Korpus",
      toolsMcp: "Langdock Actions & Remote MCP (kein lokales stdio-MCP)",
      verification: "Fangfrage gegen Knowledge Folder + Output-Validator",
    },

    // Gruppe 3: Agentic IDEs & Editoren
    {
      id: "google-antigravity",
      toolName: "Google Antigravity",
      groupLabel: "Agentic IDEs & Editoren",
      toolMode: "ide",
      systemRole: "AGENTS.md / GEMINI.md + Plan-/Execute-Modus",
      rulesGuardrails: antigravityGuardrails,
      knowledgeContext: "@-Dateireferenz, _index.md & [[Wikilinks]]",
      toolsMcp:
        "Lokaler stdio-MCP (~/.gemini/config/mcp_config.json / Additional Options > MCP Servers)",
      verification: "Built-in Preview, verify_claim & Output-Validator",
    },
    {
      id: "cursor",
      toolName: "Cursor",
      groupLabel: "Agentic IDEs & Editoren",
      toolMode: "ide",
      systemRole: "AGENTS.md + .cursor/rules/",
      rulesGuardrails: "Workspace-Guardrails + .agents/skills/ im Projektordner",
      knowledgeContext: "@-Dateireferenz (@AGENTS.md, @_index.md)",
      toolsMcp: "Lokaler stdio-MCP über .cursor/mcp.json",
      verification: "verify_claim, Terminal-Tests & Output-Validator",
    },
    {
      id: "windsurf",
      toolName: "Windsurf",
      groupLabel: "Agentic IDEs & Editoren",
      toolMode: "ide",
      systemRole: "AGENTS.md + .windsurf/rules/",
      rulesGuardrails: "Workspace-Leitplanken & Workflows pro Ordner",
      knowledgeContext: "@-Dateireferenz + _index.md im Workspace",
      toolsMcp: "Lokaler stdio-MCP (~/.codeium/windsurf/mcp_config.json)",
      verification: "Cascade-Prüfung, verify_claim & Output-Validator",
    },
    {
      id: "vscode-copilot",
      toolName: "VS Code + GitHub Copilot",
      groupLabel: "Agentic IDEs & Editoren",
      toolMode: "ide",
      systemRole: ".github/copilot-instructions.md + AGENTS.md",
      rulesGuardrails: "Instruktionen im Workspace + .agents/skills/",
      knowledgeContext: "Gezielte Dateireferenz (#file:AGENTS.md, #file:_index.md)",
      toolsMcp: "Lokaler stdio-MCP über .vscode/mcp.json",
      verification: "Live Preview, verify_claim & Output-Validator",
    },

    // Gruppe 4: CLI Code-Agents
    {
      id: "claude-code",
      toolName: "Claude Code",
      groupLabel: "CLI Code-Agents",
      toolMode: "agent",
      systemRole: "CLAUDE.md / AGENTS.md im aktuellen Arbeitsordner",
      rulesGuardrails: ".claude/skills/ + .agents/skills/ + Scope-Override",
      knowledgeContext: claudeCodeKnowledge,
      toolsMcp: "Lokaler stdio-MCP über .mcp.json (search_vault, verify_claim)",
      verification: "verify_claim + automatisierte Test-Suites",
    },
    {
      id: "codex-cli",
      toolName: "Codex CLI",
      groupLabel: "CLI Code-Agents",
      toolMode: "agent",
      systemRole: "AGENTS.md im Workspace-Verzeichnis",
      rulesGuardrails: codexGuardrails,
      knowledgeContext: "Gezieltes Lesen über _index.md & [[Wikilinks]]",
      toolsMcp: "Lokaler stdio-MCP über .codex/config.toml",
      verification: "verify_claim + Shell-Checks",
    },
    {
      id: "opencode",
      toolName: "OpenCode",
      groupLabel: "CLI Code-Agents",
      toolMode: "agent",
      systemRole: "AGENTS.md + Modellwahl via /connect (z. B. OpenRouter)",
      rulesGuardrails: opencodeGuardrails,
      knowledgeContext: "Ordner-Kontext + _index.md-Navigation",
      toolsMcp: "Lokaler stdio-MCP über opencode.json",
      verification: "verify_claim + Node-/Python-Prüfskripte",
    },
    {
      id: "gemini-cli",
      toolName: "Gemini CLI",
      groupLabel: "CLI Code-Agents",
      toolMode: "agent",
      systemRole: "GEMINI.md / AGENTS.md im Arbeitsverzeichnis",
      rulesGuardrails: ".agents/skills/ + Scope-Override im Ordner",
      knowledgeContext: "_index.md & [[Wikilinks]] gezielt verfolgen",
      toolsMcp: "Lokaler stdio-MCP über .gemini/settings.json",
      verification: "verify_claim + Output-Validator",
    },
  ];
}

export const TOOL_TRANSLATION_MATRIX: ToolTranslationRow[] = buildToolTranslationMatrix();
