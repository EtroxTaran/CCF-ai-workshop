#!/usr/bin/env node
/**
 * Validate every module under modules/<slug>/ against structural invariants,
 * [[Wikilink]] integrity, and declarative positive/trap claim checks using
 * shared/corpus-engine.mjs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchCorpus, verifyClaim } from "../shared/corpus-engine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MODULES_DIR = path.join(ROOT, "modules");
const PUBLIC_MODULES_DIR = path.join(ROOT, "workshop-ui", "public", "modules");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const EXPECTED_PRESETS = [30, 45, 60, 90];
const REQUIRED_MCP_KEYS = [
  "claudeCode",
  "claudeDesktop",
  "openCode",
  "geminiCli",
  "antigravity",
  "codex",
  "vscode",
  "cursor",
  "windsurf",
  "setupCommand",
  "applyUserCommand",
];
const JSON_MCP_KEYS = [
  "claudeCode",
  "claudeDesktop",
  "openCode",
  "geminiCli",
  "antigravity",
  "vscode",
  "cursor",
  "windsurf",
];
const USER_ONLY_MCP_KEYS = ["antigravity", "claudeDesktop", "windsurf"];
const PERSONAL_PATH_RE = new RegExp(
  "(?:[a-z]:[/\\\\]us" + "ers[/\\\\]|/us" + "ers/|/home/)",
  "i"
);
const L1_LEAKAGE_TERMS = [
  "arktis",
  "steinkorallen",
  "korallenbleiche",
  "schneeleopard",
  "eisbär",
  "38 zähne",
  "stufe-1-chaos",
  "stufe-2-skills-guardrails",
  "stufe-3-obsidian-vault",
  "68 artikel",
  "68 dateien",
  "search_wildlife_vault",
  "verify_claim_against_corpus",
  "read_vault_article",
  "quellen-recherche",
  "fakten-pruefer",
  "wikipedia-artikel",
];

function presetsEqual(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);
}

function checkNoFileTokenInCopyables(obj, labelPrefix, slug, errors) {
  const fields = [];
  for (const m of obj.promptMethods || []) {
    if (m.prompt) fields.push([`${labelPrefix}.promptMethods.${m.id}.prompt`, m.prompt]);
  }
  for (const pp of obj.praxisPaths || []) {
    for (const [mode, entry] of Object.entries(pp.promptsByMode || {})) {
      if (entry?.prompt) fields.push([`${labelPrefix}.praxisPaths.${pp.id}.${mode}.prompt`, entry.prompt]);
      if (entry?.label) fields.push([`${labelPrefix}.praxisPaths.${pp.id}.${mode}.label`, entry.label]);
    }
  }
  for (const tb of obj.transferBridge || []) {
    if (tb.starterPrompt) fields.push([`${labelPrefix}.transferBridge.${tb.role}.starterPrompt`, tb.starterPrompt]);
  }
  for (const tq of obj.testQuestions || []) {
    if (tq.webChatPrompt) fields.push([`${labelPrefix}.testQuestions.${tq.id}.webChatPrompt`, tq.webChatPrompt]);
  }
  for (const ep of obj.expressPackages || []) {
    if (ep.content) fields.push([`${labelPrefix}.expressPackages.${ep.id}.content`, ep.content]);
  }
  if (obj.chatRulesTemplate) {
    fields.push([`${labelPrefix}.chatRulesTemplate`, obj.chatRulesTemplate]);
  }
  for (const [fieldName, value] of fields) {
    if (/#file:/i.test(String(value))) {
      errors.push(`${slug}: forbidden '#file:' token in copyable field ${fieldName}`);
    }
  }
}

function main() {
  const errors = [];
  const summary = [];

  const catalogPath = path.join(PUBLIC_MODULES_DIR, "catalog.json");
  if (!fs.existsSync(catalogPath)) {
    console.error("VALIDATION FAILED: Missing workshop-ui/public/modules/catalog.json. Run node scripts/build_modules.mjs first.");
    process.exit(1);
  }
  const catalog = readJson(catalogPath);
  if (!Array.isArray(catalog.modules) || catalog.modules.length === 0) {
    errors.push("catalog.json has zero modules");
  }

  const modDirs = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(MODULES_DIR, d.name, "module.json")));

  if (modDirs.length < 1) {
    errors.push("No modules/*/module.json found");
  }

  for (const dir of modDirs) {
    const slug = dir.name;
    const spec = readJson(path.join(MODULES_DIR, slug, "module.json"));
    const dataPath = path.join(PUBLIC_MODULES_DIR, slug, "data.json");
    const indexPath = path.join(PUBLIC_MODULES_DIR, slug, "searchIndex.json");

    if (!fs.existsSync(dataPath) || !fs.existsSync(indexPath)) {
      errors.push(`${slug}: missing built data.json or searchIndex.json`);
      continue;
    }

    const data = readJson(dataPath);
    const searchIndex = readJson(indexPath);

    // Core schema completeness
    if (!data.meta?.title) errors.push(`${slug}: missing meta.title`);
    if (!Array.isArray(data.steps) || data.steps.length < 3) errors.push(`${slug}: expected >= 3 steps`);
    if (!Array.isArray(data.promptMethods) || data.promptMethods.length < 2) errors.push(`${slug}: expected >= 2 promptMethods`);
    if (!Array.isArray(data.stages) || data.stages.length < 2) errors.push(`${slug}: expected >= 2 stages`);
    if (!Array.isArray(data.testQuestions) || data.testQuestions.length < 2) errors.push(`${slug}: expected >= 2 testQuestions`);
    if (!Array.isArray(data.praxisPaths) || data.praxisPaths.length < 1) errors.push(`${slug}: expected >= 1 praxisPaths`);
    if (!Array.isArray(data.transferBridge) || data.transferBridge.length < 1) errors.push(`${slug}: expected >= 1 transferBridge roles`);

    // Duration presets parity ([30, 45, 60, 90])
    const catEntry = (catalog.modules || []).find((m) => m.id === slug);
    if (!presetsEqual(spec.durationPresets, EXPECTED_PRESETS)) {
      errors.push(`${slug}: module.json durationPresets must equal ${JSON.stringify(EXPECTED_PRESETS)}, got ${JSON.stringify(spec.durationPresets)}`);
    }
    if (!presetsEqual(data.durationPresets, EXPECTED_PRESETS)) {
      errors.push(`${slug}: data.json durationPresets must equal ${JSON.stringify(EXPECTED_PRESETS)}, got ${JSON.stringify(data.durationPresets)}`);
    }
    if (!presetsEqual(catEntry?.durationPresets, EXPECTED_PRESETS)) {
      errors.push(`${slug}: catalog.json durationPresets must equal ${JSON.stringify(EXPECTED_PRESETS)}, got ${JSON.stringify(catEntry?.durationPresets)}`);
    }

    // 9-client mcpConfigs contract in built data.json
    const mcpCfg = data.mcpConfigs || {};
    for (const key of REQUIRED_MCP_KEYS) {
      if (typeof mcpCfg[key] !== "string" || !mcpCfg[key].trim()) {
        errors.push(`${slug}: data.json missing mcpConfigs.${key}`);
      }
    }
    for (const jsonKey of JSON_MCP_KEYS) {
      if (typeof mcpCfg[jsonKey] === "string" && mcpCfg[jsonKey].trim()) {
        try {
          JSON.parse(mcpCfg[jsonKey]);
        } catch (err) {
          errors.push(`${slug}: data.json mcpConfigs.${jsonKey} invalid JSON: ${err.message}`);
        }
      }
    }
    if (typeof mcpCfg.codex === "string" && (!mcpCfg.codex.includes("[mcp_servers.") || !mcpCfg.codex.includes("server.mjs"))) {
      errors.push(`${slug}: data.json mcpConfigs.codex missing [mcp_servers.*] or server.mjs`);
    }
    for (const uKey of USER_ONLY_MCP_KEYS) {
      const val = String(mcpCfg[uKey] || "");
      if (!val.includes("/ABSOLUTE/PATH/TO/")) {
        errors.push(`${slug}: data.json mcpConfigs.${uKey} must use portable /ABSOLUTE/PATH/TO/ placeholder`);
      }
      if (PERSONAL_PATH_RE.test(val)) {
        errors.push(`${slug}: data.json mcpConfigs.${uKey} contains personal filesystem path`);
      }
    }
    if (typeof mcpCfg.cursor === "string" && !mcpCfg.cursor.includes("${workspaceFolder}/mcp-server/server.mjs")) {
      errors.push(`${slug}: data.json mcpConfigs.cursor must reference \${workspaceFolder}/mcp-server/server.mjs`);
    }

    // Zero #file: in copyable prompt/label fields (never blocking descriptive UI comparison tips)
    checkNoFileTokenInCopyables(data, "data", slug, errors);
    checkNoFileTokenInCopyables(spec, "spec", slug, errors);

    // Express pack sanity check + keyword coverage
    for (const pack of data.expressPackages || []) {
      if (!pack.content || pack.content.length < 600) {
        errors.push(`${slug}: expressPackage '${pack.id}' too short (${pack.content?.length || 0})`);
      }
      if (pack.content.length > 7500) {
        errors.push(`${slug}: expressPackage '${pack.id}' exceeds 7500 char ceiling (${pack.content.length})`);
      }
    }
    if (Array.isArray(spec.expressConfig?.methodsKeywords) && spec.expressConfig.methodsKeywords.length > 0) {
      const methodsPack = (data.expressPackages || [])[0];
      const lowerText = String(methodsPack?.content || "").toLowerCase();
      for (const kw of spec.expressConfig.methodsKeywords) {
        if (!lowerText.includes(String(kw).toLowerCase())) {
          errors.push(`${slug}: expressPackage[0] missing configured methodsKeyword '${kw}'`);
        }
      }
    }

    // Wikilink & taxonomy slug integrity check across vaultArticles
    const vaultSlugs = new Set((data.vaultArticles || []).map((a) => a.slug));
    if (vaultSlugs.size === 0) {
      errors.push(`${slug}: 0 vaultArticles found`);
    }
    for (const art of data.vaultArticles || []) {
      if (!searchIndex[art.slug]) {
        errors.push(`${slug}: searchIndex.json missing body for '${art.slug}'`);
      }
      if (spec.source === "declarative" && (!Array.isArray(art.tags) || art.tags.length === 0)) {
        errors.push(`${slug}: declarative article '${art.slug}' has empty tags (check YAML frontmatter)`);
      }
      for (const relTarget of art.related || []) {
        if (!vaultSlugs.has(relTarget)) {
          errors.push(`${slug}: broken [[${relTarget}]] link in '${art.slug}'`);
        }
      }
    }

    for (const step of data.taxonomy?.ragWalkSteps || []) {
      if (!vaultSlugs.has(step.slug)) {
        errors.push(`${slug}: ragWalkSteps references unknown slug '${step.slug}'`);
      }
    }
    for (const pack of data.stagePackSpecs?.packs || []) {
      for (const s of pack.slugs || []) {
        if (!vaultSlugs.has(s)) {
          errors.push(`${slug}: stagePackSpecs '${pack.id}' references unknown slug '${s}'`);
        }
      }
    }
    for (const s of spec.starterSlugs || []) {
      if (!vaultSlugs.has(s)) {
        errors.push(`${slug}: starterSlugs references unknown slug '${s}'`);
      }
    }
    for (const tq of data.testQuestions || []) {
      for (const doc of tq.targetDocs || []) {
        if (doc === "AGENTS.md" || doc === "_index.md") continue;
        const docSlug = doc.replace(/\.md$/, "");
        if (!vaultSlugs.has(docSlug)) {
          errors.push(`${slug}: testQuestion '${tq.id}' references unknown targetDoc '${doc}'`);
        }
      }
    }

    if (spec.source === "declarative") {
      const modRoot = path.join(MODULES_DIR, slug);
      const reqFiles = [
        "_index.md",
        "AGENTS.md",
        "CLAUDE.md",
        "GEMINI.md",
        ".mcp.json",
        ".cursor/mcp.json",
        ".github/copilot-instructions.md",
        "opencode.json",
        ".gemini/settings.json",
        ".codex/config.toml",
        ".vscode/mcp.json",
      ];
      for (const reqFile of reqFiles) {
        if (!fs.existsSync(path.join(modRoot, reqFile))) {
          errors.push(`${slug}: missing generated on-disk file modules/${slug}/${reqFile}`);
        }
      }

      const cursorPath = path.join(modRoot, ".cursor", "mcp.json");
      if (fs.existsSync(cursorPath)) {
        try {
          const cursorObj = JSON.parse(fs.readFileSync(cursorPath, "utf8"));
          const serverKey = `workshop-${slug}`;
          if (!cursorObj?.mcpServers?.[serverKey]) {
            errors.push(`${slug}: modules/${slug}/.cursor/mcp.json missing mcpServers.${serverKey}`);
          }
        } catch (err) {
          errors.push(`${slug}: modules/${slug}/.cursor/mcp.json invalid JSON: ${err.message}`);
        }
      }

      for (const scopeDoc of ["AGENTS.md", ".github/copilot-instructions.md"]) {
        const p = path.join(modRoot, scopeDoc);
        if (fs.existsSync(p)) {
          const txt = fs.readFileSync(p, "utf8");
          if (!txt.includes("Scope-Override")) {
            errors.push(`${slug}: modules/${slug}/${scopeDoc} missing Scope-Override header`);
          }
        }
      }

      const expectedStage3Folder = `modules/${slug}`;
      if (spec.stages?.[2]?.folder !== expectedStage3Folder) {
        errors.push(`${slug}: module.json stages[2].folder must be '${expectedStage3Folder}', got '${spec.stages?.[2]?.folder}'`);
      }
      if (data.stages?.[2]?.folder !== expectedStage3Folder) {
        errors.push(`${slug}: data.json stages[2].folder must be '${expectedStage3Folder}', got '${data.stages?.[2]?.folder}'`);
      }
      if (!fs.existsSync(path.join(ROOT, expectedStage3Folder))) {
        errors.push(`${slug}: stages[2].folder '${expectedStage3Folder}' does not exist on disk`);
      }
    }

    // Post-build L2/non-default module leakage guard against L1 wildlife/legacy strings
    if (spec.id !== "prompt-werkstatt-tierwelt") {
      const serializedDataLow = JSON.stringify(data).toLowerCase();
      for (const term of L1_LEAKAGE_TERMS) {
        if (serializedDataLow.includes(term)) {
          errors.push(`${slug}: L1/wildlife leakage detected in built data.json: '${term}'`);
        }
      }
    }

    // Run declarative verification assertions via shared/corpus-engine.mjs
    const articles = (data.vaultArticles || []).map((a) => ({
      ...a,
      body: searchIndex[a.slug] || a.summary || "",
    }));

    const v = spec.verify || {};
    for (const spot of v.spotSearches || []) {
      const hits = searchCorpus(articles, spot.query, 5);
      if (!hits.length || hits[0].slug !== spot.expectedTopSlug) {
        errors.push(
          `${slug}: spotSearch '${spot.query}' expected top='${spot.expectedTopSlug}', got='${hits[0]?.slug}'`
        );
      }
    }
    for (const claim of v.positiveClaims || []) {
      const res = verifyClaim(articles, claim);
      if (res.status !== "belegt") {
        errors.push(`${slug}: positiveClaim failed (${res.status}): ${claim}`);
      }
    }
    for (const contra of v.contradictionClaims || []) {
      const res = verifyClaim(articles, contra);
      if (res.status !== "widerspruch") {
        errors.push(`${slug}: contradictionClaim expected 'widerspruch', got '${res.status}': ${contra}`);
      }
    }
    for (const trap of v.negativeTraps || []) {
      const res = verifyClaim(articles, trap);
      if (res.status !== "nicht_belegt" || (res.evidence || []).length !== 0) {
        errors.push(
          `${slug}: negativeTrap expected nicht_belegt with 0 evidence, got ${res.status} (${(res.evidence || []).length})`
        );
      }
    }

    summary.push(
      `${slug} [${data.level || "L1"}]: ${vaultSlugs.size} articles, 0 broken wikilinks, ${(v.spotSearches || []).length} searches, ${(v.contradictionClaims || []).length} contradiction(s), ${(v.negativeTraps || []).length} trap(s) passed`
    );
  }

  if (errors.length) {
    console.error("MODULE VALIDATION FAILED:\n - " + errors.join("\n - "));
    process.exit(1);
  }

  console.log("ALL MODULES VALIDATED CLEANLY!");
  for (const line of summary) {
    console.log("  -", line);
  }
}

main();
