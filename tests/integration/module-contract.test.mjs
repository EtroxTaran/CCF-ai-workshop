import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EXPECTED_PRESETS = [30, 45, 60, 90];
const REQUIRED_MCP_CONFIG_KEYS = [
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

function collectCopyableTexts(data) {
  const texts = [];
  for (const m of data.promptMethods || []) {
    if (m.prompt) texts.push(["promptMethods", m.prompt]);
  }
  for (const pp of data.praxisPaths || []) {
    for (const [mode, val] of Object.entries(pp.promptsByMode || {})) {
      if (val?.prompt) texts.push([`praxisPaths.${pp.id}.${mode}.prompt`, val.prompt]);
      if (val?.label) texts.push([`praxisPaths.${pp.id}.${mode}.label`, val.label]);
    }
  }
  for (const tb of data.transferBridge || []) {
    if (tb.starterPrompt) texts.push([`transferBridge.${tb.role}.starterPrompt`, tb.starterPrompt]);
  }
  for (const tq of data.testQuestions || []) {
    if (tq.webChatPrompt) texts.push([`testQuestions.${tq.id}.webChatPrompt`, tq.webChatPrompt]);
  }
  for (const ep of data.expressPackages || []) {
    if (ep.content) texts.push([`expressPackages.${ep.id}.content`, ep.content]);
  }
  if (data.chatRulesTemplate) {
    texts.push(["chatRulesTemplate", data.chatRulesTemplate]);
  }
  return texts;
}

test("build_modules --check and validate_modules pass cleanly", () => {
  const buildCheck = execFileSync(process.execPath, ["scripts/build_modules.mjs", "--check"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.match(buildCheck, /MODULES_UP_TO_DATE/);

  const valOut = execFileSync(process.execPath, ["scripts/validate_modules.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.match(valOut, /ALL MODULES VALIDATED CLEANLY/);
});

test("live modules, built data.json, catalog.json, and stage/module instructions satisfy T1/T2/T6/T10 contracts", () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(ROOT, "workshop-ui", "public", "modules", "catalog.json"), "utf8")
  );

  for (const slug of ["prompt-werkstatt-tierwelt", "context-engineering-projekt"]) {
    const spec = JSON.parse(
      fs.readFileSync(path.join(ROOT, "modules", slug, "module.json"), "utf8")
    );
    const data = JSON.parse(
      fs.readFileSync(path.join(ROOT, "workshop-ui", "public", "modules", slug, "data.json"), "utf8")
    );
    const catEntry = (catalog.modules || []).find((m) => m.id === slug);

    assert.deepEqual(spec.durationPresets, EXPECTED_PRESETS, `${slug}/module.json durationPresets`);
    assert.deepEqual(data.durationPresets, EXPECTED_PRESETS, `${slug}/data.json durationPresets`);
    assert.deepEqual(catEntry?.durationPresets, EXPECTED_PRESETS, `catalog ${slug} durationPresets`);

    // All 11 mcpConfigs keys present in built data.json
    for (const key of REQUIRED_MCP_CONFIG_KEYS) {
      assert.ok(
        typeof data.mcpConfigs?.[key] === "string" && data.mcpConfigs[key].trim().length > 0,
        `${slug}/data.json missing mcpConfigs.${key}`
      );
    }

    // Zero #file: in copyable prompt/label fields (excluding toolModes/modeCues/modeNotes)
    for (const [fieldPath, txt] of collectCopyableTexts(data)) {
      assert.equal(
        /#file:/i.test(txt),
        false,
        `${slug}/data.json ${fieldPath} must not contain #file:`
      );
    }
  }

  // L2 stages[2].folder points to module root
  const l2Spec = JSON.parse(
    fs.readFileSync(path.join(ROOT, "modules", "context-engineering-projekt", "module.json"), "utf8")
  );
  const l2Data = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "workshop-ui", "public", "modules", "context-engineering-projekt", "data.json"),
      "utf8"
    )
  );
  assert.equal(l2Spec.stages?.[2]?.folder, "modules/context-engineering-projekt");
  assert.equal(l2Data.stages?.[2]?.folder, "modules/context-engineering-projekt");

  // Scope-Override headers on stage 2, stage 3, and L2 AGENTS.md & .github/copilot-instructions.md
  for (const relPath of [
    "stufe-2-skills-guardrails/AGENTS.md",
    "stufe-2-skills-guardrails/.github/copilot-instructions.md",
    "stufe-3-obsidian-vault/AGENTS.md",
    "stufe-3-obsidian-vault/.github/copilot-instructions.md",
    "modules/context-engineering-projekt/AGENTS.md",
    "modules/context-engineering-projekt/.github/copilot-instructions.md",
  ]) {
    const content = fs.readFileSync(path.join(ROOT, relPath), "utf8");
    assert.match(content, /Scope-Override/, `${relPath} missing Scope-Override header`);
  }
});

test("new_topic.mjs scaffolds a complete valid module skeleton into an isolated temp root", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ccf-new-topic-"));
  try {
    execFileSync(
      process.execPath,
      [
        "scripts/new_topic.mjs",
        "--slug",
        "smoke-thema",
        "--title",
        "Smoke-Test Thema",
        "--level",
        "L2",
        "--out-root",
        tmpRoot,
      ],
      { cwd: ROOT, encoding: "utf8" }
    );

    const modJsonPath = path.join(tmpRoot, "smoke-thema", "module.json");
    assert.equal(fs.existsSync(modJsonPath), true);
    const modJsonRaw = fs.readFileSync(modJsonPath, "utf8");
    assert.equal(/#file:/i.test(modJsonRaw), false, "new_topic.mjs scaffold must not contain #file:");
    const modJson = JSON.parse(modJsonRaw);
    assert.equal(modJson.id, "smoke-thema");
    assert.deepEqual(modJson.durationPresets, EXPECTED_PRESETS);
    assert.equal(modJson.stages?.[2]?.folder, "modules/smoke-thema");
    assert.ok(Array.isArray(modJson.praxisPaths) && modJson.praxisPaths.length >= 1);
    const promptsByMode = modJson.praxisPaths[0].promptsByMode || {};
    for (const mode of ["web", "desktop", "ide", "agent"]) {
      assert.ok(promptsByMode[mode]?.prompt, `Missing promptsByMode.${mode}`);
    }
    assert.ok(Array.isArray(modJson.verify?.contradictionClaims) && modJson.verify.contradictionClaims.length >= 1);
    assert.equal(fs.existsSync(path.join(tmpRoot, "smoke-thema", "corpus", "einstieg-ueberblick.md")), true);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("L1/L2 regression contracts: zero L1 leaks in L2, sequential q1..q4 phases, .git repoUrl, and clean graph summaries", () => {
  const l1Data = JSON.parse(
    fs.readFileSync(path.join(ROOT, "workshop-ui", "public", "modules", "prompt-werkstatt-tierwelt", "data.json"), "utf8")
  );
  const l2Data = JSON.parse(
    fs.readFileSync(path.join(ROOT, "workshop-ui", "public", "modules", "context-engineering-projekt", "data.json"), "utf8")
  );

  // M1-BEAMER-07: Sequential q1..q4 in phases
  assert.deepEqual(
    (l1Data.phases || []).map((p) => p.activeQuestionId),
    ["q1", "q2", "q3", "q4"]
  );
  assert.deepEqual(
    (l2Data.phases || []).map((p) => p.activeQuestionId),
    ["q1", "q2", "q3", "q4"]
  );

  // M1-BEAMER-09: repoUrl ends with .git
  assert.match(l2Data.meta?.repoUrl || "", /\.git$/);

  // M4-04: Zero raw ** in L2 vaultArticle summaries
  for (const art of l2Data.vaultArticles || []) {
    assert.equal(/\*\*/.test(art.summary || ""), false, `L2 summary for ${art.slug} contains raw '**'`);
  }

  // M4-01/02/03: Zero L1 leakage terms in serialized L2 data.json
  const l2Raw = JSON.stringify(l2Data).toLowerCase();
  for (const term of [
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
  ]) {
    assert.equal(l2Raw.includes(term), false, `L2 data.json must not leak L1 term: ${term}`);
  }
});
