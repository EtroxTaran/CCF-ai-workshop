#!/usr/bin/env node
/**
 * Build modular static JSON bundles for every module under modules/<slug>/ into
 * workshop-ui/public/modules/<slug>/{data.json,searchIndex.json} + catalog.json.
 *
 * Usage:
 *   node scripts/build_modules.mjs
 *   node scripts/build_modules.mjs --check   # exits non-zero if generated files are stale
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "../shared/corpus-engine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MODULES_DIR = path.join(ROOT, "modules");
const OUT_ROOT = path.join(ROOT, "workshop-ui", "public", "modules");
const LEGACY_DATA_PATH = path.join(ROOT, "scripts", "legacy-export", "workshopData.json");
const LEGACY_INDEX_PATH = path.join(ROOT, "scripts", "legacy-export", "searchIndex.json");

const checkMode = process.argv.includes("--check");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeOrCheckFile(filePath, nextContent, diffs) {
  if (checkMode) {
    if (!fs.existsSync(filePath)) {
      diffs.push(`Missing generated file: ${path.relative(ROOT, filePath)}`);
      return;
    }
    const existing = fs.readFileSync(filePath, "utf8");
    if (existing !== nextContent) {
      diffs.push(`Stale generated file: ${path.relative(ROOT, filePath)}`);
    }
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, nextContent, "utf8");
}

function loadAudioGuides(modDir, spec) {
  if (!spec.audioScriptsFile) return spec.audioGuides || {};
  const audioPath = path.join(modDir, spec.audioScriptsFile);
  if (!fs.existsSync(audioPath)) return spec.audioGuides || {};
  const raw = readJson(audioPath);
  const out = {};
  for (const [id, entry] of Object.entries(raw)) {
    out[id] = {
      title: entry.title || id,
      durationLabel: entry.durationLabel || "0:20",
      transcript: entry.transcript || entry.tts || "",
    };
  }
  return out;
}

function cleanInlineMarkdown(text) {
  return String(text || "")
    .replace(/^[-*+]\s+/, "")
    .replace(/\[\[[^\]|#]+(?:#[^\]|]*)?\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractSummary(body) {
  const lines = String(body || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("---") && !l.startsWith("|"));
  return cleanInlineMarkdown(lines[0] || "").slice(0, 260);
}

function extractKeyPoints(body) {
  return String(body || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- ") || /^\d+\.\s/.test(l))
    .slice(0, 6)
    .map((l) => cleanInlineMarkdown(l.replace(/^-\s+|^\d+\.\s+/, "").trim()));
}

function extractWikilinks(body) {
  const matches = String(body || "").match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
  return [...new Set(matches.map((w) => w.slice(2, -2).split("|")[0].trim()).filter(Boolean))];
}

function buildDeclarativeCorpus(modDir, spec) {
  const corpusDir = path.join(modDir, "corpus");
  if (!fs.existsSync(corpusDir)) {
    throw new Error(`Module '${spec.id}' missing corpus/ directory`);
  }

  const excludedFiles = new Set(["_index.md", "agents.md", "claude.md", "gemini.md"]);
  const files = fs
    .readdirSync(corpusDir)
    .filter((f) => f.toLowerCase().endsWith(".md") && !excludedFiles.has(f.toLowerCase()))
    .sort();

  const vaultArticles = [];
  const searchIndex = {};

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(corpusDir, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const titleMatch = body.match(/^#\s+(.+)$/m);
    const title = meta.title || (titleMatch ? titleMatch[1].trim() : slug);
    const category = meta.category || spec.taxonomy?.categories?.[0]?.id || "dokument";
    const group = meta.group || meta.habitat || "Allgemein";
    const summary = meta.summary || extractSummary(body);
    const keyPoints = extractKeyPoints(body);
    const related = extractWikilinks(body);

    vaultArticles.push({
      slug,
      title,
      category,
      habitat: group,
      group,
      status: meta.status || "aktiv",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      summary,
      related,
      source_file: `corpus/${file}`,
      key_points: keyPoints,
    });
    searchIndex[slug] = body.trim();
  }

  const starterSlugs = Array.isArray(spec.starterSlugs) && spec.starterSlugs.length
    ? spec.starterSlugs
    : vaultArticles.slice(0, 12).map((a) => a.slug);

  const starterArticles = starterSlugs
    .map((s) => vaultArticles.find((a) => a.slug === s))
    .filter(Boolean)
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      habitat: a.group || a.habitat,
      group: a.group || a.habitat,
      content: searchIndex[a.slug] || a.summary,
    }));

  // Generate compact _index.md grouped by category
  const catDefs = spec.taxonomy?.categories || [];
  const lines = [`# Inhaltsverzeichnis · ${spec.title}`, ""];
  for (const cat of catDefs) {
    const matching = vaultArticles.filter((a) => a.category === cat.id);
    if (!matching.length) continue;
    lines.push(`## ${cat.plural || cat.label}`);
    for (const a of matching) {
      lines.push(`- [[${a.slug}|${a.title}]] (${a.group || a.habitat}) — ${a.summary.slice(0, 100)}`);
    }
    lines.push("");
  }
  const leftovers = vaultArticles.filter((a) => !catDefs.some((c) => c.id === a.category));
  if (leftovers.length) {
    lines.push("## Weitere Dokumente");
    for (const a of leftovers) {
      lines.push(`- [[${a.slug}|${a.title}]] (${a.group || a.habitat})`);
    }
    lines.push("");
  }
  const indexMd = lines.join("\n").trim();

  // Build compact express packages under 6,500 chars
  function compactExcerpt(art, maxLen = 460) {
    const clean = (searchIndex[art.slug] || art.summary).replace(/\n{3,}/g, "\n\n").trim();
    const cut = clean.length > maxLen ? `${clean.slice(0, maxLen).trim()}…` : clean;
    return `=== ${art.slug}.md (${art.title}) ===\n${cut}\n[Quelle: ${art.slug}.md]`;
  }

  const allCompact = starterArticles.map((a) => compactExcerpt(a, Math.min(460, Math.floor(4600 / Math.max(starterArticles.length, 1))))).join("\n\n");
  const methodsSources = starterArticles.slice(0, 6).map((a) => `${a.slug}.md`);
  const stagesSources = starterArticles.map((a) => `${a.slug}.md`);

  const expressPackages = [
    {
      id: "methods",
      title: spec.expressConfig?.methodsTitle || `Kompakt-Paket · ${spec.domainLabel || spec.title}`,
      description:
        spec.expressConfig?.methodsDescription ||
        "Kompakte Textauszüge mit (datei.md)-Quellenmarkern für schnelle Web-Chat-Tests.",
      charCount: allCompact.length,
      promptHeaderTemplate:
        "{{PROMPT}}\n\n---\nWICHTIG — NUR DIE FOLGENDEN DOKUMENTE NUTZEN:\n" +
        "Kein externes Vorwissen ergänzen. Jede Angabe mit (datei.md) belegen; fehlende Fakten mit „[Nicht in Quelle]“ markieren.\n\n" +
        "{{TEXTS}}",
      sources: methodsSources,
      content: allCompact,
    },
    {
      id: "stages-focus",
      title: spec.expressConfig?.stagesTitle || `Fokus-Paket · ${starterArticles.length} Projektdateien`,
      description:
        spec.expressConfig?.stagesDescription ||
        "Vollständig kompakte Sammlung für Stufe 1–3 & Praxis-Pfade im Web-Chat.",
      charCount: allCompact.length,
      promptHeaderTemplate: "{{PROMPT}}\n\n---\nDOKUMENTE:\n\n{{TEXTS}}",
      sources: stagesSources,
      content: allCompact,
    },
  ];

  // Read skills from modules/<slug>/skills/*/SKILL.md
  const skillsDir = path.join(modDir, "skills");
  const skills = [];
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillFile = path.join(skillsDir, entry.name, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        skills.push({
          name: entry.name,
          content: fs.readFileSync(skillFile, "utf8"),
        });
      }
    }
  }

  return { vaultArticles, starterArticles, searchIndex, indexMd, expressPackages, skills };
}

function buildMcpConfigsForModule(moduleId, isDefault) {
  const flag = isDefault ? "" : ` --module ${moduleId}`;
  const serverKey = isDefault ? "workshop-wildlife" : `workshop-${moduleId}`;
  const serverArg = "./mcp-server/server.mjs";
  const vsArg = "${workspaceFolder}/mcp-server/server.mjs";
  const absArg = "/ABSOLUTE/PATH/TO/CCF-ai-workshop/mcp-server/server.mjs";
  const argsList = isDefault ? [serverArg] : [serverArg, "--module", moduleId];
  const vsArgsList = isDefault ? [vsArg] : [vsArg, "--module", moduleId];
  const absArgsList = isDefault ? [absArg] : [absArg, "--module", moduleId];
  const userStdioJson = JSON.stringify(
    {
      mcpServers: {
        [serverKey]: {
          command: "node",
          args: absArgsList,
        },
      },
    },
    null,
    2
  );
  return {
    claudeCode: JSON.stringify(
      {
        mcpServers: {
          [serverKey]: {
            command: "node",
            args: argsList,
          },
        },
      },
      null,
      2
    ),
    claudeDesktop: userStdioJson,
    openCode: JSON.stringify(
      {
        $schema: "https://opencode.ai/config.json",
        mcp: {
          [serverKey]: {
            type: "local",
            command: ["node", ...argsList],
            enabled: true,
          },
        },
      },
      null,
      2
    ),
    geminiCli: JSON.stringify(
      {
        mcpServers: {
          [serverKey]: {
            command: "node",
            args: argsList,
          },
        },
      },
      null,
      2
    ),
    antigravity: userStdioJson,
    codex: `[mcp_servers.${serverKey}]\ncommand = "node"\nargs = ${JSON.stringify(argsList)}`,
    vscode: JSON.stringify(
      {
        servers: {
          [serverKey]: {
            type: "stdio",
            command: "node",
            args: vsArgsList,
          },
        },
      },
      null,
      2
    ),
    cursor: JSON.stringify(
      {
        mcpServers: {
          [serverKey]: {
            command: "node",
            args: vsArgsList,
          },
        },
      },
      null,
      2
    ),
    windsurf: userStdioJson,
    setupCommand: `node mcp-server/setup-client.mjs --client all --scope user --dry-run${flag}`,
    applyUserCommand: `node mcp-server/setup-client.mjs --client all --scope user${flag}`,
  };
}

function syncDeclarativeOnDiskArtifacts(modDir, spec, corpus, diffs) {
  const moduleId = spec.id;
  const serverKey = `workshop-${moduleId}`;
  const relServer = "../../mcp-server/server.mjs";
  const vsServer = "${workspaceFolder}/../../mcp-server/server.mjs";
  const relArgs = [relServer, "--module", moduleId];
  const vsArgs = [vsServer, "--module", moduleId];

  writeOrCheckFile(path.join(modDir, "_index.md"), corpus.indexMd + "\n", diffs);

  const skillList = corpus.skills.map((s) => `- \`${s.name}\``).join("\n") || "- (keine lokalen Skills definiert)";
  const baseRules =
    spec.stages?.[2]?.agentsMd ||
    spec.stages?.[1]?.agentsMd ||
    `# Leitplanken · ${spec.title}\n\n1. Nutze nur lokale Dateien.\n2. Belege jede Aussage mit (datei.md).\n3. Markiere Lücken zwingend als „[Nicht in Quelle]“.`;
  const agentsMd = [
    `> **Scope-Override:** Ignoriere übergeordnete Root-Anweisungen (wie die Root-\`AGENTS.md\`, \`CLAUDE.md\`, \`GEMINI.md\` oder \`.github/copilot-instructions.md\`); arbeite ausschließlich auf Basis dieses Modul-Ordners (\`modules/${moduleId}/\`).`,
    "",
    baseRules.trim(),
    "",
    "## Bereichsregel & Werkzeuge (Lokal)",
    `- **Scope:** Diese Datei gilt für das Themen-Modul \`${moduleId}\` unter \`modules/${moduleId}/\`.`,
    "- Starte komplexe Suchen immer mit `_index.md` und folge den `[[Wikilinks]]` unter `corpus/`.",
    `- **Lokaler MCP-Server (\`${serverKey}\`):** Konfiguriert über \`.mcp.json\`, \`.cursor/mcp.json\`, \`opencode.json\`, \`.gemini/settings.json\`, \`.codex/config.toml\` und \`.vscode/mcp.json\` (User-Setup für alle 9 Clients inkl. Google Antigravity, Claude Desktop & Windsurf per \`node ../../mcp-server/setup-client.mjs --client all --scope user --module ${moduleId}\`). Kanonische Tools: \`search_vault\`, \`verify_claim\`, \`read_article\`, \`list_modules\`.`,
    "",
    "## Verfügbare Skills",
    skillList,
    "",
  ].join("\n");

  writeOrCheckFile(path.join(modDir, "AGENTS.md"), agentsMd, diffs);
  writeOrCheckFile(path.join(modDir, "CLAUDE.md"), "@AGENTS.md\n", diffs);
  writeOrCheckFile(path.join(modDir, "GEMINI.md"), "@AGENTS.md\n", diffs);

  const copilotInstructionsMd = [
    `# GitHub Copilot Instructions · ${spec.title}`,
    "",
    `> **Scope-Override:** Ignoriere übergeordnete Repository-Anweisungen im Root; befolge ausschließlich die Regeln dieses Themen-Moduls (\`modules/${moduleId}/\`) sowie die lokale \`AGENTS.md\`.`,
    "",
    baseRules.trim(),
    "",
    "## Wissensbasis & Werkzeuge (Lokal)",
    "- Starte komplexe Suchen immer mit `_index.md` und folge den `[[Wikilinks]]` unter `corpus/`.",
    `- **Lokaler MCP-Server (\`${serverKey}\`):** Konfiguriert in \`.vscode/mcp.json\`, \`.cursor/mcp.json\`, \`.mcp.json\`, \`opencode.json\`, \`.gemini/settings.json\` und \`.codex/config.toml\` (\`search_vault\`, \`verify_claim\`, \`read_article\`, \`list_modules\`).`,
    "",
    "## Verfügbare Skills",
    skillList,
    "",
  ].join("\n");
  writeOrCheckFile(path.join(modDir, ".github", "copilot-instructions.md"), copilotInstructionsMd, diffs);

  for (const sk of corpus.skills) {
    const cleanSkill = sk.content.replace(/\r\n/g, "\n").trimEnd() + "\n";
    writeOrCheckFile(path.join(modDir, ".agents", "skills", sk.name, "SKILL.md"), cleanSkill, diffs);
    writeOrCheckFile(path.join(modDir, ".claude", "skills", sk.name, "SKILL.md"), cleanSkill, diffs);
  }

  writeOrCheckFile(
    path.join(modDir, ".mcp.json"),
    JSON.stringify({ mcpServers: { [serverKey]: { command: "node", args: relArgs } } }, null, 2) + "\n",
    diffs
  );
  writeOrCheckFile(
    path.join(modDir, ".cursor", "mcp.json"),
    JSON.stringify({ mcpServers: { [serverKey]: { command: "node", args: vsArgs } } }, null, 2) + "\n",
    diffs
  );
  writeOrCheckFile(
    path.join(modDir, "opencode.json"),
    JSON.stringify(
      {
        $schema: "https://opencode.ai/config.json",
        mcp: { [serverKey]: { type: "local", command: ["node", ...relArgs], enabled: true } },
      },
      null,
      2
    ) + "\n",
    diffs
  );
  writeOrCheckFile(
    path.join(modDir, ".gemini", "settings.json"),
    JSON.stringify({ mcpServers: { [serverKey]: { command: "node", args: relArgs } } }, null, 2) + "\n",
    diffs
  );
  writeOrCheckFile(
    path.join(modDir, ".codex", "config.toml"),
    `[mcp_servers.${serverKey}]\ncommand = "node"\nargs = ${JSON.stringify(relArgs)}\n`,
    diffs
  );
  writeOrCheckFile(
    path.join(modDir, ".vscode", "mcp.json"),
    JSON.stringify({ servers: { [serverKey]: { type: "stdio", command: "node", args: vsArgs } } }, null, 2) + "\n",
    diffs
  );
}

function enrichStagesForDeclarative(spec, corpusBundle) {
  const modeNotesFor = (stageId, folder) => {
    const isStage1 = stageId === "stufe-1";
    const webButtonLabel =
      stageId === "stufe-1"
        ? "Kompakt-Texte kopieren"
        : stageId === "stufe-2"
          ? "Regeln + Texte kopieren"
          : "Regeln + Kompakt-Index + Texte";
    return {
      web: {
        headline: `Web-Chat · ${stageId.toUpperCase()} testen`,
        steps: [
          "Öffne einen **neuen Chat** im Browser (+ Neuer Chat).",
          `Klicke auf **${webButtonLabel}** und füge es ein (warte auf die Bestätigung).`,
          "Stelle danach die Testfragen unten oder klicke auf **Frage + Texte komplett**.",
          ...(isStage1
            ? [
                "**Isolations-Hinweis:** Teste Stufe 1 im Web-Chat oder kopiere `corpus/` außerhalb des Repos, damit Root-`AGENTS.md` / `.github/copilot-instructions.md` nicht unbemerkt greifen.",
              ]
            : []),
        ],
        commandOrAction: webButtonLabel,
      },
      desktop: {
        headline: `Desktop & Projects · ${folder}`,
        steps: [
          `Öffne den entpackten Ordner **${folder}** in Claude Cowork — oder lade die \`.md\`-Dateien in Langdock Assistants, ChatGPT/Claude Projects bzw. Gemini Gems.`,
          "Bei **Assistants/Projects/Gems**: füge `AGENTS.md` (aus *Dateien & Pakete*) in die Projekt-Anweisungen ein.",
          "Stelle nacheinander die Fokus-Fragen inklusive Fangfrage 3.",
        ],
        commandOrAction: `Ordner: ${folder}`,
      },
      ide: {
        headline: `IDE & Editor · ${folder}`,
        steps: [
          isStage1
            ? `Öffne \`${folder}/\` (für echte Stufe-1-Isolation außerhalb des Repos kopieren, damit Root-\`AGENTS.md\` / \`.github/copilot-instructions.md\` nicht greifen) in Google Antigravity, Cursor, Windsurf oder VS Code.`
            : `Öffne \`${folder}/\` als Workspace in Google Antigravity, Cursor, Windsurf oder VS Code (\`AGENTS.md\`, \`_index.md\`, \`.cursor/mcp.json\` & \`.vscode/mcp.json\` liegen direkt dort).`,
          "Referenziere Dateien gezielt (`@` in Antigravity/Cursor/Windsurf, `#file:` in VS Code Copilot) und teste die Fangfrage + Q4.",
        ],
        commandOrAction: `Workspace: ${folder}/`,
      },
      agent: {
        headline: `CLI Code-Agent · ${folder}`,
        steps: [
          isStage1
            ? `Starte dein CLI-Werkzeug in \`${folder}/\` (für echte Stufe-1-Isolation auf einer Kopie außerhalb des Repos, damit Root-\`AGENTS.md\` nicht greift).`
            : `Starte dein CLI-Werkzeug direkt in \`${folder}/\` (oder starte den MCP-Server mit \`--module ${spec.id}\`).`,
          "Prüfe, wie sich Guardrails, Skills und `_index.md` von Stufe 1 zu Stufe 3 verändern.",
        ],
        commandOrAction: `cd ${folder}`,
      },
    };
  };

  return (spec.stages || []).map((st, idx) => {
    const skillsForStage = idx === 0 ? [] : corpusBundle.skills;
    return {
      ...st,
      indexMd: idx === 2 ? corpusBundle.indexMd : undefined,
      skills: skillsForStage,
      modeNotes: st.modeNotes || modeNotesFor(st.id, st.folder),
    };
  });
}

function buildDeclarativeSteps() {
  return [
    {
      id: "start",
      num: "01",
      label: "01 · Ziel & Werkzeug wählen",
      short: "Ziel & Tool",
      phaseGroup: "aha-kern",
      phaseLabel: "Orientierung (2 Min.)",
    },
    {
      id: "methods",
      num: "02",
      label: "02 · Aha-Kern 1: Prompt-Methoden",
      short: "Methoden",
      phaseGroup: "aha-kern",
      phaseLabel: "15 Min. gemeinsamer Aha-Kern",
    },
    {
      id: "stages",
      num: "03",
      label: "03 · Aha-Kern 2: 3 Stufen & Wissen",
      short: "3 Stufen",
      phaseGroup: "aha-kern",
      phaseLabel: "15 Min. gemeinsamer Aha-Kern",
    },
    {
      id: "paths",
      num: "04",
      label: "04 · Ziel-Labor & Ergebnis-Check",
      short: "Ziel-Labor",
      phaseGroup: "praxis-pfad",
      phaseLabel: "30 Min. Ziel-Labor & Validierung",
    },
  ];
}

function buildDeclarativeToolModes(spec, docCount, folders) {
  return [
    {
      id: "web",
      label: "Web-Chat",
      shortLabel: "Web-Chat",
      badge: "Kein Setup nötig",
      summary: `Direkt im Browser (ChatGPT, Claude.ai, Langdock, Google Gemini, M365 Copilot) mit 1-Klick-Kopierpaketen zu allen ${docCount} Dokumenten.`,
      examples: ["ChatGPT", "Claude.ai", "Langdock", "Google Gemini", "M365 Copilot"],
      workflowHint:
        "Nutze die 1-Klick-Kopierpakete (Prompt steht ganz oben) oder lade einzelne .md-Dateien hoch. Cloud-Hubs können keinen lokalen stdio-MCP-Server starten — nutze dort Knowledge Folder oder unseren Browser-Faktenprüfer.",
      noInstallRequired: true,
    },
    {
      id: "desktop",
      label: "Desktop & Projects",
      shortLabel: "Desktop & Projects",
      badge: "Ohne Terminal",
      summary: `Öffne ${folders.stage3}/ lokal in Claude Cowork — oder lade die ${docCount} .md-Dateien in Langdock Assistants, ChatGPT/Claude Projects bzw. Gemini Gems.`,
      examples: ["Langdock Assistants", "Claude Cowork (Ordner)", "ChatGPT / Claude Projects", "Gemini Gems"],
      workflowHint: `Ohne Git: ZIP laden & entpacken → in Claude Cowork ${folders.stage3}/ wählen oder in Assistants/Projects/Gems die lokale AGENTS.md + .md-Dateien hinterlegen.`,
      noInstallRequired: false,
    },
    {
      id: "ide",
      label: "IDE & Editor",
      shortLabel: "IDE & Editor",
      badge: "Antigravity / Cursor / VS Code",
      summary: `Arbeite direkt im Editor (Google Antigravity, Cursor, Windsurf, VS Code + GitHub Copilot) mit Workspace-Regeln in ${folders.stage3}/ und gezielten Datei-Referenzen (@ / #file:).`,
      examples: ["Google Antigravity", "Cursor", "Windsurf", "VS Code + GitHub Copilot"],
      workflowHint: `Öffne ${folders.stage3}/ als Workspace im Editor und referenziere Dateien gezielt (@ in Antigravity/Cursor/Windsurf, #file: in VS Code Copilot).`,
      noInstallRequired: false,
    },
    {
      id: "agent",
      label: "CLI Code-Agent",
      shortLabel: "CLI Code-Agent",
      badge: "Terminal + MCP",
      summary: `Arbeite im Terminal mit autonomen Agenten, AGENTS.md, Skills und lokalem MCP-Server (search_vault, verify_claim, read_article) auf allen ${docCount} Dokumenten.`,
      examples: ["Claude Code", "Codex CLI", "Gemini CLI", "OpenCode"],
      workflowHint: `Starte dein CLI-Werkzeug direkt in ${folders.stage3}/ (oder mit --module ${spec.id}) — Regeln, Skills & MCP laden dort lokal.`,
      noInstallRequired: false,
    },
  ];
}

function buildDeclarativeOpenCodeHelp(spec, docCount, complianceNote, repoUrl) {
  return {
    title: "Kein eigenes KI-Abo? Kostenlos im Browser oder lokal mit OpenCode",
    summary: `Auch ohne bezahltes KI-Abo kannst du sofort alles mitmachen — am schnellsten über kostenlose Browser-Chats, Langdock und unseren eingebauten ${docCount}-Dokumente-Faktenprüfer.`,
    steps: [
      `Am einfachsten im Browser: ChatGPT Free, Claude Free, Langdock, Gemini oder M365 Copilot nutzen — oder unseren ${docCount}-Dokumente-Faktenprüfer in Schritt 04 direkt ohne Login testen.`,
      `Optional fürs Terminal (OpenCode + OpenRouter): Repository klonen (git clone -b main ${repoUrl}), in modules/${spec.id}/ wechseln und OpenCode starten.`,
      `Datenschutz-Hinweis: Alle ${docCount} Dokumente in ${spec.title} erfüllen: ${complianceNote}`,
    ],
    commandSnippet: "npm install -g opencode-ai && opencode",
    note: "Tipp: Falls kein globales npm gewünscht ist, klappt oft auch npx opencode-ai@latest — im geöffneten OpenCode einfach /connect eingeben und OpenRouter wählen.",
  };
}

function buildDeclarativePhases(spec, docCount, folders, skillNames) {
  const skillSummary = skillNames.length ? skillNames.join(", ") : "lokale Skills";
  return [
    {
      id: "setup",
      number: 1,
      phaseGroup: "aha-kern",
      timeRange: "Start",
      durationMin: 5,
      title: `Einstieg & Kontext (${spec.title})`,
      subtitle: `${docCount} Dokumente · Ziel & Werkzeug wählen`,
      beamerHeadline: `${spec.title} · Einstieg & Werkzeugwahl`,
      modeCues: {
        web: `Öffne einen sauberen Browser-Chat und nutze die Kompakt-Pakete zu ${spec.title} (${docCount} Dokumente).`,
        desktop: `Öffne ${folders.stage3}/ in Claude Cowork oder lade die ${docCount} .md-Dateien in Projects/Assistants.`,
        ide: `Öffne ${folders.stage3}/ als Editor-Workspace und referenziere Dateien per @ bzw. Datei-Referenz.`,
        agent: `Starte in ${folders.stage3}/ — AGENTS.md, Skills (${skillSummary}) und MCP (search_vault, verify_claim, read_article) greifen dort lokal.`,
      },
      activeQuestionId: "q1",
      keyTakeaway: "Werkzeug wählen und direkt im ersten sauberen Kontext starten.",
    },
    {
      id: "methods",
      number: 2,
      phaseGroup: "aha-kern",
      timeRange: "Aha 1",
      durationMin: 10,
      title: "Prompt-Methoden & Regeln",
      subtitle: "Zero-Shot vs. CO-STAR, Few-Shot & RISEN",
      beamerHeadline: "Prompt-Struktur & Steuerungsebenen",
      modeCues: {
        web: `Vergleiche Zero-Shot mit CO-STAR und Few-Shot auf den ${docCount} Dokumenten von ${spec.title}.`,
        desktop: `Nutze die Unterlagen aus ${folders.stage1}/ für strukturierte Tabellen- und Briefing-Outputs.`,
        ide: `Teste im Editor-Chat strukturierte Prompts gegen ${folders.stage3}/ mit exakter (datei.md)-Quellenpflicht.`,
        agent: "Prüfe mit search_vault und read_article, wie strukturierte Prompts Querverweise zwischen Dokumenten nutzen.",
      },
      activeQuestionId: "q2",
      keyTakeaway: "Klare Struktur + Quellenpflicht schlägt vage Einzeiler sofort.",
    },
    {
      id: "stages",
      number: 3,
      phaseGroup: "aha-kern",
      timeRange: "Aha 2",
      durationMin: 15,
      title: "3 Stufen, Debug & Fangfrage",
      subtitle: "Kaputte Regeln reparieren + Negativtest",
      beamerHeadline: "Stufe 1 → 2 → 3 & Eigene Leitplanken",
      modeCues: {
        web: "Teste zuerst ohne Regeln (Stufe 1), danach mit Schutzregeln (Stufe 2/3) und prüfe die Fangfrage auf [Nicht in Quelle].",
        desktop: `Vergleiche ${folders.stage1}/ (ohne Regeln) gegen ${folders.stage3}/ (mit AGENTS.md & ${skillSummary}).`,
        ide: `Referenziere ${folders.stage3}/AGENTS.md und _index.md und prüfe das Fangfrage-Verhalten.`,
        agent: "Nutze verify_claim auf die Fangfrage und vergleiche Stufe 1 (ohne Guardrail) mit Stufe 2/3 (AGENTS.md + _index.md).",
      },
      activeQuestionId: "q3",
      keyTakeaway: "Eine gute Leitplanke verhindert Halluzinationen und markiert Lücken ehrlich mit [Nicht in Quelle].",
    },
    {
      id: "paths",
      number: 4,
      phaseGroup: "praxis-pfad",
      timeRange: "Praxis",
      durationMin: 30,
      title: "Ziel-Labor & Regel-Werkbank",
      subtitle: "Faktencheck, Briefing oder eigene AGENTS.md bauen",
      beamerHeadline: "Vom Übungsprojekt direkt in die eigene Arbeit",
      modeCues: {
        web: "Wähle dein Ziel im Ziel-Labor, prüfe das Ergebnis im Output-Validator und baue deine eigene Team-Regel.",
        desktop: `Nutze ${folders.stage3}/ als Datenbasis für Checkliste, Briefing oder eigene Regel-Werkbank.`,
        ide: `Validiere dein Ergebnis aus ${folders.stage1}/ im Output-Validator und sichere eine wiederverwendbare AGENTS.md.`,
        agent: "Nutze search_vault, verify_claim und read_article für dein Audit und teste deine eigene Regel gegen eine Fangfrage.",
      },
      activeQuestionId: "q4",
      keyTakeaway: spec.eventOverlay?.outroBanner || "Eigene Regeln immer mit einer Fangfrage testen.",
    },
  ];
}

function buildDeclarativeArchitectureLayers(spec, folders, skillNames) {
  const skillsDisplay = skillNames.length
    ? skillNames.map((n) => `Skill \`${n}\``).join(" + ")
    : "lokale Prüf-Skills";
  return [
    {
      layer: "1 · User-Prompt",
      analogy: "Der konkrete Arbeitsauftrag im Modul-Alltag",
      persistence: "Gilt nur für genau diese eine Nachricht",
      authority: "Niedrig – vergisst Projekt-Vorgaben bei langen Chats schnell",
      example: `„Fasse die wichtigsten Vorgaben und Risiken aus ${spec.title} mit (datei.md)-Beleg zusammen.“`,
    },
    {
      layer: "2 · Priming (im Chat)",
      analogy: "Kurzes Briefing zu Gesprächsbeginn",
      persistence: "Gilt für den laufenden Chatverlauf",
      authority: "Mittel – richtet Ton, Glossar und Zielbild sauber aus",
      example: `Vorab-Instruktion im Chat auf Basis von AGENTS.md in ${folders.stage3}/, bevor die Detailfrage folgt.`,
    },
    {
      layer: "3 · System-Prompt / AGENTS.md",
      analogy: "Die Stellenbeschreibung & Hausordnung",
      persistence: "Dauerhaft über alle Aufgaben im Modul-Ordner aktiv",
      authority: "Hoch – übersteuert lockere User-Prompts bei Konflikten",
      example: `Verbindliche Guardrails: Nur Dateien aus ${folders.stage1}/ nutzen, (datei.md) zitieren, Lücken als [Nicht in Quelle] melden.`,
    },
    {
      layer: "4 · Harness (Skills + Guardrails)",
      analogy: "Das Sicherheitsgeschirr & Standard-Playbook",
      persistence: "Wiederverwendbare Abläufe pro Aufgabentyp",
      authority: "Sehr hoch – erzwingt Recherche-Schritte & Gegenprüfung",
      example: `${skillsDisplay} prüfen Antworten vor der Ausgabe.`,
    },
    {
      layer: "5 · Tools & MCP",
      analogy: "Werkzeuge, Indizes & geprüfte Schnittstellen",
      persistence: "Standardisiertes Protokoll (Model Context Protocol)",
      authority: "Direkte Aktion statt reinem Text-Raten",
      example: "`search_vault`, `verify_claim`, `read_article`, `list_modules`.",
    },
  ];
}

function buildModulePayload(modDir, spec, legacyData, legacyIndex, diffs) {
  const audioGuides = loadAudioGuides(modDir, spec);

  if (spec.source === "legacy-export") {
    const merged = {
      ...legacyData,
      moduleId: spec.id,
      level: spec.level || "L1",
      durationPresets: spec.durationPresets || [30, 45, 60, 90],
      taxonomy: spec.taxonomy,
      eventOverlay: spec.eventOverlay,
      audioGuides,
      guardrailDebugChallenge: spec.guardrailDebugChallenge,
      animatics:
        spec.animatics || legacyData.animatics
          ? { ...(legacyData.animatics || {}), ...(spec.animatics || {}) }
          : undefined,
      labPresets: spec.labPresets,
      stagePackSpecs: spec.stagePackSpecs,
      mcpConfigs: buildMcpConfigsForModule(spec.id, Boolean(spec.isDefault)),
      meta: {
        ...legacyData.meta,
        moduleId: spec.id,
        level: spec.level || "L1",
        domainLabel: spec.domainLabel || "Tierwelt & Ökosysteme",
      },
    };
    return { data: merged, searchIndex: legacyIndex };
  }

  // Declarative module built natively from modules/<slug>/
  const corpus = buildDeclarativeCorpus(modDir, spec);
  syncDeclarativeOnDiskArtifacts(modDir, spec, corpus, diffs);
  const stages = enrichStagesForDeclarative(spec, corpus);
  const docCount = corpus.vaultArticles.length;
  const folders = {
    stage1: spec.stages?.[0]?.folder || `modules/${spec.id}/corpus`,
    stage2: spec.stages?.[1]?.folder || `modules/${spec.id}`,
    stage3: spec.stages?.[2]?.folder || `modules/${spec.id}`,
  };
  const skillNames = corpus.skills.map((s) => s.name);
  const complianceNote =
    spec.meta?.complianceNote ||
    "100 % synthetische / öffentliche Beispieldaten — keine echten Kunden- oder Personendaten.";
  const repoUrl = spec.meta?.repoUrl || legacyData.meta.repoUrl;

  const phases =
    Array.isArray(spec.phases) && spec.phases.length > 0
      ? spec.phases
      : buildDeclarativePhases(spec, docCount, folders, skillNames);

  const data = {
    moduleId: spec.id,
    level: spec.level || "L2",
    durationPresets: spec.durationPresets || [30, 45, 60, 90],
    taxonomy: spec.taxonomy,
    eventOverlay: spec.eventOverlay,
    audioGuides,
    guardrailDebugChallenge: spec.guardrailDebugChallenge,
    animatics: spec.animatics,
    labPresets: spec.labPresets,
    stagePackSpecs: spec.stagePackSpecs,
    checklistItems: spec.checklistItems || [
      { id: "chk-setup", stepId: "start", label: "Arbeitsweise & Projektunterlagen geöffnet" },
      { id: "chk-methods", stepId: "methods", label: "Zero-Shot mit CO-STAR oder Few-Shot verglichen" },
      { id: "chk-rules", stepId: "methods", label: "Steuerungsebenen / Projekt-Regeln kopiert" },
      { id: "chk-stages", stepId: "stages", label: "Mini-Debug gelöst & Fangfrage / Steuerungstest geprüft" },
      { id: "chk-reflect", stepId: "stages", label: "Beobachtung per Reflexions-Pill festgehalten" },
      { id: "chk-path", stepId: "paths", label: "Praxis-Pfad oder Dokument-Faktenprüfer ausgeführt" },
      { id: "chk-transfer", stepId: "paths", label: "Eigene Regel gebaut oder Rolle in Transfer-Brücke gewählt" },
    ],
    reflectionPills: spec.reflectionPills || [
      { id: "ref-guessed", label: "KI hat geraten", hint: "In Stufe 1 wurden fehlende Angaben aus Vorwissen ergänzt." },
      { id: "ref-rejected", label: "Regel hat gestoppt", hint: "Ab Stufe 2 greifen die Leitplanken und melden [Nicht in Quelle]." },
      { id: "ref-linked", label: "Querverweise genutzt", hint: "In Stufe 3 verknüpft _index.md automatisch alle relevanten Dokumente." },
    ],
    meta: {
      moduleId: spec.id,
      level: spec.level || "L2",
      title: spec.title,
      subtitle: spec.subtitle,
      presenter: spec.meta?.presenter || "Trainer-Team",
      cluster: spec.meta?.cluster || spec.eventOverlay?.unitLabel || "Praxis-Lab",
      domainLabel: spec.domainLabel || spec.title,
      timeSlot: spec.meta?.timeSlot || spec.eventOverlay?.timeSlot || "Flexibel",
      articleCount: docCount,
      complianceNote,
      pagesUrl:
        spec.meta?.pagesUrl ||
        `https://etroxtaran.github.io/CCF-ai-workshop/#/m/${spec.id}`,
      repoUrl,
    },
    steps: spec.steps || buildDeclarativeSteps(),
    toolModes: spec.toolModes || buildDeclarativeToolModes(spec, docCount, folders),
    openCodeHelp: spec.openCodeHelp || buildDeclarativeOpenCodeHelp(spec, docCount, complianceNote, repoUrl),
    phases,
    promptComparisonTask: spec.promptComparisonTask,
    promptMethods: spec.promptMethods,
    architectureLayers:
      spec.architectureLayers || buildDeclarativeArchitectureLayers(spec, folders, skillNames),
    chatRulesTemplate: spec.chatRulesTemplate,
    testQuestions: spec.testQuestions,
    stages,
    expressPackages: corpus.expressPackages,
    praxisPaths: spec.praxisPaths,
    transferBridge: spec.transferBridge,
    starterArticles: corpus.starterArticles,
    vaultArticles: corpus.vaultArticles,
    mcpConfigs: buildMcpConfigsForModule(spec.id, Boolean(spec.isDefault)),
  };

  return { data, searchIndex: corpus.searchIndex };
}

function main() {
  if (!fs.existsSync(MODULES_DIR)) {
    throw new Error(`Missing modules directory: ${MODULES_DIR}`);
  }
  const legacyData = readJson(LEGACY_DATA_PATH);
  const legacyIndex = readJson(LEGACY_INDEX_PATH);

  const modEntries = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(MODULES_DIR, d.name, "module.json")))
    .map((d) => {
      const modDir = path.join(MODULES_DIR, d.name);
      const spec = readJson(path.join(modDir, "module.json"));
      return { modDir, spec };
    });

  const catalogEntries = [];
  const diffs = [];

  for (const { modDir, spec } of modEntries) {
    const { data, searchIndex } = buildModulePayload(modDir, spec, legacyData, legacyIndex, diffs);
    const modOutDir = path.join(OUT_ROOT, spec.id);

    writeOrCheckFile(path.join(modOutDir, "data.json"), JSON.stringify(data), diffs);
    writeOrCheckFile(path.join(modOutDir, "searchIndex.json"), JSON.stringify(searchIndex), diffs);

    catalogEntries.push({
      id: spec.id,
      title: spec.title,
      subtitle: spec.subtitle,
      level: spec.level || "L1",
      badge: spec.badge || spec.level || "Modul",
      domainLabel: spec.domainLabel || spec.title,
      durationPresets: spec.durationPresets || [30, 45, 60, 90],
      articleCount: data.vaultArticles.length,
      checklistTotal: 6,
      goals: spec.goals || ["prompting", "app-building", "presentations", "everyday-ai"],
      tags: spec.tags || [],
      isDefault: Boolean(spec.isDefault),
      mcpSupported: spec.mcpSupported !== false,
    });
  }

  catalogEntries.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.level.localeCompare(b.level) || a.title.localeCompare(b.title);
  });

  const defaultMod = catalogEntries.find((m) => m.isDefault) || catalogEntries[0];
  const catalog = {
    generatedAt: new Date().toISOString().slice(0, 10),
    defaultModuleId: defaultMod?.id || "prompt-werkstatt-tierwelt",
    modules: catalogEntries,
  };

  // For --check mode compare ignoring generatedAt date volatility
  const catalogPath = path.join(OUT_ROOT, "catalog.json");
  if (checkMode) {
    if (!fs.existsSync(catalogPath)) {
      diffs.push("Missing generated file: workshop-ui/public/modules/catalog.json");
    } else {
      const existingCat = readJson(catalogPath);
      if (
        existingCat.defaultModuleId !== catalog.defaultModuleId ||
        JSON.stringify(existingCat.modules) !== JSON.stringify(catalog.modules)
      ) {
        diffs.push("Stale catalog entries in workshop-ui/public/modules/catalog.json");
      }
    }
    if (diffs.length) {
      console.error("MODULE CHECK FAILED:\n - " + diffs.join("\n - "));
      process.exit(1);
    }
    console.log(`MODULES_UP_TO_DATE (${catalogEntries.length} modules verified)`);
    return;
  }

  const builtIds = new Set(catalogEntries.map((m) => m.id));
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  for (const entry of fs.readdirSync(OUT_ROOT, { withFileTypes: true })) {
    if (entry.isDirectory() && !builtIds.has(entry.name)) {
      fs.rmSync(path.join(OUT_ROOT, entry.name), { recursive: true, force: true });
    }
  }
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log(
    `Built ${catalogEntries.length} module(s) into workshop-ui/public/modules/: ${catalogEntries
      .map((m) => `${m.id} (${m.articleCount} docs)`)
      .join(", ")}`
  );
}

main();
