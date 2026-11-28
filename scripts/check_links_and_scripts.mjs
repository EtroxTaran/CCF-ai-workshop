#!/usr/bin/env node
/**
 * L0 Verification:
 * 1. Validates all internal relative Markdown links across workshop documentation.
 * 2. Validates launcher line endings (.sh LF + optional bash -n, .bat CRLF).
 * 3. Guards against stale hardcoded presenter names or broken /beamer paths (without #/beamer).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DOC_FILES = [
  "README.md",
  "AGENTS.md",
  "CONTEXT.md",
  "aufgaben.md",
  "LOESUNGEN_TRAINER.md",
  "PRESENTER_RUNBOOK.md",
  "CONTRIBUTING_MODULE.md",
  "TOPICS_BACKLOG.md",
  "mcp-server/README.md",
  "docs/ISOLATION_GUIDE.md",
  ".github/copilot-instructions.md",
  "stufe-1-chaos/AGENTS.md",
  "stufe-2-skills-guardrails/AGENTS.md",
  "stufe-2-skills-guardrails/.github/copilot-instructions.md",
  "stufe-3-obsidian-vault/AGENTS.md",
  "stufe-3-obsidian-vault/.github/copilot-instructions.md",
  "modules/context-engineering-projekt/AGENTS.md",
  "modules/context-engineering-projekt/.github/copilot-instructions.md",
];

const docsDir = path.join(ROOT, "docs");
if (fs.existsSync(docsDir)) {
  const walkDocs = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDocs(full);
      else if (entry.name.endsWith(".md")) {
        const rel = path.relative(ROOT, full).replace(/\\/g, "/");
        if (!DOC_FILES.includes(rel)) DOC_FILES.push(rel);
      }
    }
  };
  walkDocs(docsDir);
}

const errors = [];
const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;

for (const relDoc of DOC_FILES) {
  const fullDoc = path.join(ROOT, relDoc);
  if (!fs.existsSync(fullDoc)) {
    errors.push(`Missing expected doc file: ${relDoc}`);
    continue;
  }
  const text = fs.readFileSync(fullDoc, "utf8");
  const stripped = text.replace(/```[\s\S]*?```/g, "");

  if (/\bNico\s+Rimmele\b/i.test(stripped)) {
    errors.push(`${relDoc}: contains hardcoded old presenter name`);
  }
  if (/https:\/\/etroxtaran\.github\.io\/CCF-ai-workshop\/beamer\b/i.test(stripped)) {
    errors.push(`${relDoc}: bare /beamer GitHub Pages URL without #/beamer`);
  }

  for (const match of stripped.matchAll(linkRe)) {
    const rawTarget = match[1].trim();
    if (
      !rawTarget ||
      rawTarget.startsWith("#") ||
      /^(https?:|mailto:|tel:)/i.test(rawTarget)
    ) {
      continue;
    }
    const targetPathOnly = rawTarget.split("#")[0].split("?")[0];
    if (!targetPathOnly) continue;
    const resolved = path.resolve(path.dirname(fullDoc), targetPathOnly);
    if (!fs.existsSync(resolved)) {
      errors.push(`${relDoc}: broken relative link target -> ${rawTarget}`);
    }
  }
}

for (const shRel of ["start-workshop.sh", "start-beamer.sh"]) {
  const shPath = path.join(ROOT, shRel);
  if (!fs.existsSync(shPath)) {
    errors.push(`Missing launcher: ${shRel}`);
    continue;
  }
  const raw = fs.readFileSync(shPath, "utf8");
  if (raw.includes("\r")) {
    errors.push(`${shRel}: must use LF line endings, found CR (\\r)`);
  }
  try {
    execFileSync("bash", ["-n", shRel], { cwd: ROOT, stdio: "pipe" });
  } catch (err) {
    // Only fail if bash actually ran and reported a syntax error (ignore ENOENT on minimal Windows).
    if (err?.code !== "ENOENT") {
      errors.push(`${shRel}: bash -n syntax check failed: ${err?.stderr?.toString() || err.message}`);
    }
  }
}

for (const batRel of ["start-workshop.bat", "start-beamer.bat"]) {
  const batPath = path.join(ROOT, batRel);
  if (!fs.existsSync(batPath)) {
    errors.push(`Missing launcher: ${batRel}`);
    continue;
  }
  const raw = fs.readFileSync(batPath, "utf8");
  const lines = raw.split("\n");
  // Ignore empty trailing element after final CRLF
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].endsWith("\r")) {
      errors.push(`${batRel}:${i + 1}: expected CRLF line ending`);
      break;
    }
  }
}

// Isolation guide links from core docs
for (const docWithIsolationLink of [
  "README.md",
  "AGENTS.md",
  "aufgaben.md",
  "PRESENTER_RUNBOOK.md",
]) {
  const p = path.join(ROOT, docWithIsolationLink);
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, "utf8");
    if (!raw.includes("docs/ISOLATION_GUIDE.md")) {
      errors.push(`${docWithIsolationLink}: missing link to docs/ISOLATION_GUIDE.md`);
    }
  }
}

// Scope-Override headers on stage 2, stage 3, and L2 module instructions
for (const scopedFile of [
  "stufe-2-skills-guardrails/AGENTS.md",
  "stufe-2-skills-guardrails/.github/copilot-instructions.md",
  "stufe-3-obsidian-vault/AGENTS.md",
  "stufe-3-obsidian-vault/.github/copilot-instructions.md",
  "modules/context-engineering-projekt/AGENTS.md",
  "modules/context-engineering-projekt/.github/copilot-instructions.md",
]) {
  const p = path.join(ROOT, scopedFile);
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, "utf8");
    if (!raw.includes("Scope-Override")) {
      errors.push(`${scopedFile}: missing Scope-Override header`);
    }
  }
}

// Root AGENTS.md & .github/copilot-instructions.md must remain spoiler-free
for (const rootInstr of ["AGENTS.md", ".github/copilot-instructions.md"]) {
  const p = path.join(ROOT, rootInstr);
  if (fs.existsSync(p)) {
    const low = fs.readFileSync(p, "utf8").toLowerCase();
    for (const spoiler of ["schneeleopard", "krypto-wallet"]) {
      if (low.includes(spoiler)) {
        errors.push(`${rootInstr}: spoiler leak (${spoiler}) must not appear in root instructions`);
      }
    }
  }
}

// Zero #file: tokens in copyable prompt files
const copyablePromptFiles = [
  "workshop-ui/src/data/goalTracks.ts",
  "scripts/new_topic.mjs",
  "aufgaben.md",
];
const modulesDir = path.join(ROOT, "modules");
if (fs.existsSync(modulesDir)) {
  for (const entry of fs.readdirSync(modulesDir, { withFileTypes: true })) {
    if (entry.isDirectory() && fs.existsSync(path.join(modulesDir, entry.name, "module.json"))) {
      copyablePromptFiles.push(`modules/${entry.name}/module.json`);
    }
  }
}
for (const relFile of copyablePromptFiles) {
  const p = path.join(ROOT, relFile);
  if (!fs.existsSync(p)) {
    errors.push(`Missing copyable prompt source file: ${relFile}`);
    continue;
  }
  const raw = fs.readFileSync(p, "utf8");
  if (/#file:/i.test(raw)) {
    errors.push(`${relFile}: forbidden '#file:' token in copyable prompt file`);
  }
}

if (errors.length > 0) {
  console.error("CHECK_LINKS_AND_SCRIPTS FAILED:");
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}

console.log(`CHECK_LINKS_AND_SCRIPTS_OK (${DOC_FILES.length} docs + 4 launchers verified)`);
