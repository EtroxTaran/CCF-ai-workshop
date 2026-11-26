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
const LEGACY_DATA_PATH = path.join(ROOT, "workshop-ui", "src", "data", "workshopData.json");
const LEGACY_INDEX_PATH = path.join(ROOT, "workshop-ui", "src", "data", "searchIndex.json");

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

function extractSummary(body) {
  const lines = String(body || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("---") && !l.startsWith("|"));
  return (lines[0] || "").slice(0, 260);
}

function extractKeyPoints(body) {
  return String(body || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- ") || /^\d+\.\s/.test(l))
    .slice(0, 6)
    .map((l) => l.replace(/^-\s+|^\d+\.\s+/, "").trim());
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

  const files = fs
    .readdirSync(corpusDir)
    .filter((f) => f.endsWith(".md") && f !== "_index.md")
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
  function compactExcerpt(art, maxLen = 520) {
    const clean = (searchIndex[art.slug] || art.summary).replace(/\n{3,}/g, "\n\n").trim();
    const cut = clean.length > maxLen ? `${clean.slice(0, maxLen).trim()}…` : clean;
    return `=== ${art.slug}.md (${art.title}) ===\n${cut}\n[Quelle: ${art.slug}.md]`;
  }

  const allCompact = starterArticles.map((a) => compactExcerpt(a, Math.min(540, Math.floor(5400 / Math.max(starterArticles.length, 1))))).join("\n\n");
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
  const serverArg = isDefault ? "./mcp-server/server.mjs" : "./mcp-server/server.mjs";
  return {
    claudeCode: JSON.stringify(
      {
        mcpServers: {
          "workshop-vault": {
            command: "node",
            args: isDefault ? [serverArg] : [serverArg, "--module", moduleId],
          },
        },
      },
      null,
      2
    ),
    openCode: JSON.stringify(
      {
        $schema: "https://opencode.ai/config.json",
        mcp: {
          "workshop-vault": {
            type: "local",
            command: isDefault ? ["node", serverArg] : ["node", serverArg, "--module", moduleId],
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
          "workshop-vault": {
            command: "node",
            args: isDefault ? [serverArg] : [serverArg, "--module", moduleId],
          },
        },
      },
      null,
      2
    ),
    codex: `[mcp_servers.workshop-vault]\ncommand = "node"\nargs = ${JSON.stringify(
      isDefault ? [serverArg] : [serverArg, "--module", moduleId]
    )}`,
    vscode: JSON.stringify(
      {
        servers: {
          "workshop-vault": {
            type: "stdio",
            command: "node",
            args: isDefault
              ? ["${workspaceFolder}/mcp-server/server.mjs"]
              : ["${workspaceFolder}/mcp-server/server.mjs", "--module", moduleId],
          },
        },
      },
      null,
      2
    ),
    cursor: JSON.stringify(
      {
        mcpServers: {
          "workshop-vault": {
            command: "node",
            args: isDefault
              ? ["${workspaceFolder}/mcp-server/server.mjs"]
              : ["${workspaceFolder}/mcp-server/server.mjs", "--module", moduleId],
          },
        },
      },
      null,
      2
    ),
    setupCommand: `node mcp-server/setup-client.mjs --client all --scope user${flag}`,
    applyUserCommand: `node mcp-server/setup-client.mjs --client claude --scope user --apply${flag}`,
  };
}

function enrichStagesForDeclarative(spec, corpusBundle, legacyData) {
  const modeNotesFor = (stageId, folder) => ({
    web: {
      headline: `Web-Chat · ${stageId.toUpperCase()} testen`,
      steps: [
        "Öffne einen **neuen Chat** im Browser (+ Neuer Chat).",
        "Klicke auf **Kompakt-Paket kopieren** und füge es ein (warte auf die Bestätigung).",
        "Stelle danach die Testfragen unten oder klicke auf **Frage + Texte komplett**.",
      ],
      commandOrAction: "Kompakt-Paket kopieren",
    },
    desktop: {
      headline: `Desktop & Ordner · ${folder}`,
      steps: [
        `Öffne den entpackten Ordner **${folder}** in Claude Cowork — oder lade die \`.md\`-Dateien in ein ChatGPT/Claude Projekt.`,
        "Bei **Projects**: füge `AGENTS.md` (aus *Dateien & Pakete*) in die Projekt-Anweisungen ein.",
        "Stelle nacheinander die Fokus-Fragen inklusive Fangfrage 3.",
      ],
      commandOrAction: `Ordner: ${folder}`,
    },
    agent: {
      headline: `Code-Agent · ${folder}`,
      steps: [
        `Starte dein CLI-Werkzeug im Projektordner und aktiviere ggf. \`--module ${spec.id}\` für den MCP-Server.`,
        "Prüfe, wie sich Guardrails, Skills und `_index.md` von Stufe 1 zu Stufe 3 verändern.",
      ],
      commandOrAction: `node mcp-server/server.mjs --module ${spec.id}`,
    },
  });

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

function buildModulePayload(modDir, spec, legacyData, legacyIndex) {
  const audioGuides = loadAudioGuides(modDir, spec);

  if (spec.source === "legacy-export") {
    const merged = {
      ...legacyData,
      moduleId: spec.id,
      level: spec.level || "L1",
      durationPresets: spec.durationPresets || [30, 60, 90],
      taxonomy: spec.taxonomy,
      eventOverlay: spec.eventOverlay,
      audioGuides,
      guardrailDebugChallenge: spec.guardrailDebugChallenge,
      animatics: spec.animatics || legacyData.animatics,
      labPresets: spec.labPresets,
      stagePackSpecs: spec.stagePackSpecs,
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
  const stages = enrichStagesForDeclarative(spec, corpus, legacyData);

  const phases =
    spec.phases ||
    [
      {
        id: "setup",
        number: 1,
        phaseGroup: "aha-kern",
        timeRange: "Start · 5 Min.",
        durationMin: 5,
        title: "Einstieg & Werkzeug-Hilfe",
        subtitle: spec.title,
        beamerHeadline: `${spec.title} · Einstieg`,
        modeCues: legacyData.phases[0].modeCues,
        activeQuestionId: "q3",
        keyTakeaway: "Werkzeug wählen und direkt im ersten sauberen Chatfenster starten.",
      },
      {
        id: "methods",
        number: 2,
        phaseGroup: "aha-kern",
        timeRange: "Aha 1 · 10 Min.",
        durationMin: 10,
        title: "Prompt-Methoden & Regeln",
        subtitle: "Zero-Shot vs. CO-STAR, Few-Shot & RISEN",
        beamerHeadline: "Prompt-Struktur & Steuerungsebenen",
        modeCues: legacyData.phases[1].modeCues,
        activeQuestionId: "q1",
        keyTakeaway: "Klare Struktur + Quellenpflicht schlägt vage Einzeiler sofort.",
      },
      {
        id: "stages",
        number: 3,
        phaseGroup: "aha-kern",
        timeRange: "Aha 2 · 15 Min.",
        durationMin: 15,
        title: "3 Stufen, Debug & Fangfrage",
        subtitle: "Kaputte Regeln reparieren + Negativtest",
        beamerHeadline: "Stufe 1 → 2 → 3 & Eigene Leitplanken",
        modeCues: legacyData.phases[2].modeCues,
        activeQuestionId: "q3",
        keyTakeaway: "Eine gute Leitplanke verhindert Halluzinationen und Lücken-Erfindungen.",
      },
      {
        id: "paths",
        number: 4,
        phaseGroup: "praxis-pfad",
        timeRange: "Praxis · 30 Min.",
        durationMin: 30,
        title: "Praxis-Pfade & Regel-Werkbank",
        subtitle: "Faktencheck, Briefing oder eigene AGENTS.md bauen",
        beamerHeadline: "Vom Übungsprojekt direkt in die eigene Arbeit",
        modeCues: legacyData.phases[3].modeCues,
        activeQuestionId: "q2",
        keyTakeaway: spec.eventOverlay?.outroBanner || "Eigene Regeln immer mit einer Fangfrage testen.",
      },
    ];

  const data = {
    moduleId: spec.id,
    level: spec.level || "L2",
    durationPresets: spec.durationPresets || [30, 60, 90],
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
      { id: "chk-stages", stepId: "stages", label: "Mini-Debug gelöst & Fangfrage / RTO-Test geprüft" },
      { id: "chk-reflect", stepId: "stages", label: "Beobachtung per Reflexions-Pill festgehalten" },
      { id: "chk-path", stepId: "paths", label: "Praxis-Pfad oder Dokument-Faktenprüfer ausgeführt" },
      { id: "chk-transfer", stepId: "paths", label: "Eigene Regel gebaut oder Rolle in Transfer-Brücke gewählt" },
    ],
    reflectionPills: spec.reflectionPills || [
      { id: "ref-guessed", label: "KI hat geraten", hint: "In Stufe 1 wurden fehlende Projektklauseln aus Vorwissen ergänzt." },
      { id: "ref-rejected", label: "Regel hat gestoppt", hint: "Ab Stufe 2 greifen die Leitplanken und melden [Nicht in Quelle]." },
      { id: "ref-linked", label: "Querverweise genutzt", hint: "In Stufe 3 verknüpft _index.md automatisch ADR, Runbook & SLA." },
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
      articleCount: corpus.vaultArticles.length,
      complianceNote:
        spec.meta?.complianceNote ||
        "100 % synthetische / öffentliche Beispieldaten — keine echten Kunden- oder Personendaten.",
      pagesUrl:
        spec.meta?.pagesUrl ||
        `https://etroxtaran.github.io/CCF-ai-workshop/#/m/${spec.id}`,
      repoUrl: spec.meta?.repoUrl || legacyData.meta.repoUrl,
    },
    steps: spec.steps || legacyData.steps,
    toolModes: spec.toolModes || legacyData.toolModes,
    openCodeHelp: spec.openCodeHelp || legacyData.openCodeHelp,
    phases,
    promptComparisonTask: spec.promptComparisonTask,
    promptMethods: spec.promptMethods,
    architectureLayers: spec.architectureLayers || legacyData.architectureLayers,
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
    const { data, searchIndex } = buildModulePayload(modDir, spec, legacyData, legacyIndex);
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
      durationPresets: spec.durationPresets || [30, 60, 90],
      articleCount: data.vaultArticles.length,
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
