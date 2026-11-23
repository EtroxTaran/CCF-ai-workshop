#!/usr/bin/env node
/**
 * Zero-dependency CLI helper to submit a question/finding to live-questions/ and/or the Beamer server.
 * Usage:
 *   node mcp-server/submit-question.mjs --team "Tisch 2" --question "Warum schützt Anemonenschleim?" --stage "Stufe 3"
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const LIVE_DIR = path.join(REPO_ROOT, "live-questions");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.team || !args.question) {
  console.error("Verwendung: node mcp-server/submit-question.mjs --team \"Teamname\" --question \"Deine Frage\" [--answer \"...\"] [--stage \"Stufe 3\"] [--method \"CO-STAR\"] [--url \"http://BEAMER-IP:3777/api/submissions\"]");
  process.exit(1);
}

fs.mkdirSync(LIVE_DIR, { recursive: true });
const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");
const slug = args.team.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "team";
const filename = `${stamp}-${slug}.json`;
const filePath = path.join(LIVE_DIR, filename);

const payload = {
  id: `cli-${stamp}-${slug}`,
  created_at: now.toISOString(),
  team: args.team,
  track: args.track || "Track B (CLI)",
  stage: args.stage || "Stufe 3",
  method: args.method || "Frei",
  question: args.question,
  ai_answer: args.answer || "",
  source: "cli",
};

fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
console.log(`Gespeichert in live-questions/${filename}`);

const url = args.url || process.env.BEAMER_URL || "http://127.0.0.1:3777/api/submissions";
try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000),
  });
  if (res.ok) {
    console.log(`Erfolgreich live an den Beamer gesendet (${url}).`);
  } else {
    console.log(`Beamer HTTP ${res.status} — lokale Datei liegt bereit.`);
  }
} catch {
  console.log(`Kein Beamer-Server unter ${url} erreichbar — Datei liegt in live-questions/ bereit.`);
}
