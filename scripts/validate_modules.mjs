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

    // Express pack sanity check
    for (const pack of data.expressPackages || []) {
      if (!pack.content || pack.content.length < 600) {
        errors.push(`${slug}: expressPackage '${pack.id}' too short (${pack.content?.length || 0})`);
      }
      if (pack.content.length > 7500) {
        errors.push(`${slug}: expressPackage '${pack.id}' exceeds 7500 char ceiling (${pack.content.length})`);
      }
    }

    // Wikilink integrity check across vaultArticles
    const vaultSlugs = new Set((data.vaultArticles || []).map((a) => a.slug));
    if (vaultSlugs.size === 0) {
      errors.push(`${slug}: 0 vaultArticles found`);
    }
    for (const art of data.vaultArticles || []) {
      if (!searchIndex[art.slug]) {
        errors.push(`${slug}: searchIndex.json missing body for '${art.slug}'`);
      }
      for (const relTarget of art.related || []) {
        if (!vaultSlugs.has(relTarget)) {
          errors.push(`${slug}: broken [[${relTarget}]] link in '${art.slug}'`);
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
    for (const trap of v.negativeTraps || []) {
      const res = verifyClaim(articles, trap);
      if (res.status !== "nicht_belegt" || (res.evidence || []).length !== 0) {
        errors.push(
          `${slug}: negativeTrap expected nicht_belegt with 0 evidence, got ${res.status} (${(res.evidence || []).length})`
        );
      }
    }

    summary.push(
      `${slug} [${data.level || "L1"}]: ${vaultSlugs.size} articles, 0 broken wikilinks, ${(v.spotSearches || []).length} searches, ${(v.negativeTraps || []).length} trap(s) passed`
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
