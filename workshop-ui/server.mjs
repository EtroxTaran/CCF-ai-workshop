#!/usr/bin/env node
/**
 * Zero-dependency Workshop & Beamer Regie Server (Node.js >= 18 ESM).
 * - Serves prebuilt React + shadcn/ui SPA from workshop-ui/dist/
 * - Real-time SSE feed for /beamer
 * - Deterministic corpus verification + optional live LLM evaluator
 * - Watches live-questions/, optional GitHub public issues, optional git pull
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(__dirname, "dist");
const WIKI_ROOT = path.join(REPO_ROOT, "stufe-3-obsidian-vault", "wiki");
const LIVE_DIR = path.join(REPO_ROOT, "live-questions");

const PORT = Number(process.env.PORT || 3777);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

const STOPWORDS = new Set([
  "aber", "alle", "allem", "allen", "aller", "alles", "also", "auch", "auf", "aus",
  "bei", "beim", "beide", "beiden", "bis", "bist", "dabei", "dadurch", "dafuer",
  "dafür", "dagegen", "daher", "damit", "danach", "dann", "darauf", "daraus", "darin",
  "darum", "dass", "dazu", "dein", "deine", "dem", "den", "denn", "der", "deren",
  "des", "dessen", "deshalb", "die", "dies", "diese", "diesem", "diesen", "dieser",
  "dieses", "doch", "dort", "durch", "eine", "einem", "einen", "einer", "eines",
  "einige", "einmal", "etwa", "etwas", "euch", "euer", "eure", "fuer", "für", "ganz",
  "gegen", "genau", "gibt", "haben", "hat", "hatte", "hatten", "hier", "hinter",
  "ihm", "ihn", "ihnen", "ihr", "ihre", "ihrem", "ihren", "ihrer", "immer", "indem",
  "infolge", "innen", "ins", "ist", "jede", "jedem", "jeden", "jeder", "jedes",
  "jedoch", "jetzt", "kann", "kein", "keine", "keinem", "keinen", "keiner", "koennen",
  "können", "konnte", "lassen", "laut", "mehr", "mein", "meine", "mit", "muss",
  "muessen", "müssen", "nach", "nachdem", "neben", "nein", "nicht", "nichts", "noch",
  "nun", "nur", "oder", "ohne", "sehr", "sein", "seine", "seinem", "seinen", "seiner",
  "seit", "selbst", "sich", "sie", "sind", "sobald", "sodass", "sofern", "solche",
  "solchen", "soll", "sollen", "sollte", "sondern", "sonst", "sowie", "ueber", "über",
  "um", "und", "uns", "unser", "unsere", "unter", "viel", "viele", "vielen", "vom",
  "von", "vor", "waehrend", "während", "wann", "war", "waren", "warum", "was", "wegen",
  "weil", "weit", "weiter", "welche", "welchem", "welchen", "welcher", "welches",
  "wenn", "wer", "werden", "wie", "wieder", "wieso", "will", "wird", "wir", "wobei",
  "wofuer", "wofür", "woher", "wohin", "wurde", "wurden", "zudem", "zum", "zur",
  "zwar", "zwischen", "aktuell", "aktuelle", "werden", "welcher"
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function tokenize(text) {
  const norm = normalize(text);
  const raw = norm.match(/[a-z0-9]{3,}/g) || [];
  return [...new Set(raw.filter((t) => !STOPWORDS.has(t)))];
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: content };
  const meta = {};
  let currentKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim().replace(/^"(.*)"$/, "$1");
      meta[currentKey] = val === "" ? [] : val;
    } else if (currentKey && line.trim().startsWith("- ")) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      meta[currentKey].push(line.trim().slice(2).trim());
    }
  }
  return { meta, body: m[2] };
}

function loadCorpus() {
  const articles = [];
  if (!fs.existsSync(WIKI_ROOT)) return articles;
  for (const sub of ["lebensraeume", "tierarten", "konzepte"]) {
    const dir = path.join(WIKI_ROOT, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { meta, body } = parseFrontmatter(raw);
      articles.push({
        slug,
        title: meta.title || slug,
        category: meta.category || sub.slice(0, -1),
        habitat: meta.habitat || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        source_file: meta.source_file || `raw/${slug}.md`,
        rel_path: `wiki/${sub}/${file}`,
        body,
        normTitle: normalize(meta.title || slug),
        normBody: normalize(body),
      });
    }
  }
  return articles;
}

const CORPUS = loadCorpus();

function extractSnippet(body, tokens) {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("---") && !l.startsWith("> **Kategorie"));
  let best = lines[0] || "";
  let bestScore = -1;
  for (const line of lines) {
    const nl = normalize(line);
    let sc = 0;
    for (const t of tokens) {
      if (nl.includes(t)) sc += t.length;
    }
    if (sc > bestScore) {
      bestScore = sc;
      best = line;
    }
  }
  return best.length > 280 ? best.slice(0, 277) + "..." : best;
}

function searchCorpus(query, limit = 5) {
  const tokens = tokenize(query);
  const normQ = normalize(query).trim();
  const scored = [];
  for (const art of CORPUS) {
    let score = 0;
    const matchedTokens = [];
    if (normQ && art.normTitle.includes(normQ)) score += 30;
    for (const tok of tokens) {
      let hit = false;
      if (art.normTitle.includes(tok) || art.slug.includes(tok)) {
        score += 14;
        hit = true;
      }
      if (art.normBody.includes(tok)) {
        score += 5;
        hit = true;
      }
      if (art.tags.some((t) => normalize(t).includes(tok))) {
        score += 4;
        hit = true;
      }
      if (hit) matchedTokens.push(tok);
    }
    if (score > 0) {
      scored.push({
        slug: art.slug,
        title: art.title,
        wikilink: `[[${art.slug}|${art.title}]]`,
        rel_path: art.rel_path,
        source_file: art.source_file,
        snippet: extractSnippet(art.body, tokens),
        matched_tokens: matchedTokens,
        score,
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.min(Math.max(Number(limit) || 5, 1), 15));
}

function evaluateDeterministic(question, aiAnswer) {
  const tokens = tokenize(question);
  const matches = searchCorpus(question, 4);
  const covered = new Set();
  for (const m of matches.slice(0, 3)) {
    for (const t of m.matched_tokens) covered.add(t);
  }
  const ratio = tokens.length ? covered.size / tokens.length : 0;

  let status = "nicht_belegt";
  let statusLabel = "Nicht im Korpus gefunden – mögliche Fangfrage!";
  if (matches.length > 0 && ratio >= 0.55 && matches[0].score >= 12) {
    status = "belegt";
    statusLabel = "Starke Abdeckung in den lokalen Artikeln – Belege verfügbar.";
  } else if (matches.length > 0 && ratio >= 0.25 && matches[0].score >= 7) {
    status = "teilweise";
    statusLabel = "Teilweise Themenbezug gefunden – Detailabgleich empfohlen.";
  }

  const ans = String(aiAnswer || "");
  const answerHasCitation = /(\.md\b|\[\[[^\]]+\]\]|docs\/|raw\/|wiki\/)/i.test(ans);
  const answerHasGuardrailRefusal =
    /(nicht in den (vorliegenden )?dokumenten|nicht enthalten|keine information|nicht belegt)/i.test(ans);

  return {
    status,
    statusLabel,
    matchedRatio: Number(ratio.toFixed(2)),
    isLikelyTrap: status === "nicht_belegt",
    answerHasCitation,
    answerHasGuardrailRefusal,
    evidence: matches.slice(0, 3),
    llmProvider: null,
    llmComment: null,
  };
}

function detectLlmMode() {
  if (process.env.OPENAI_API_KEY) return "OpenAI Live + Korpus-Prüfer";
  if (process.env.ANTHROPIC_API_KEY) return "Anthropic Live + Korpus-Prüfer";
  if (process.env.GEMINI_API_KEY) return "Gemini Live + Korpus-Prüfer";
  if (process.env.OLLAMA_MODEL) return `Ollama (${process.env.OLLAMA_MODEL}) + Korpus-Prüfer`;
  if (process.env.WORKSHOP_EVAL_CMD) return "Lokale CLI + Korpus-Prüfer";
  return "Deterministischer Korpus-Prüfer (100 % offline-sicher)";
}

async function runOptionalLlmEvaluation(question, aiAnswer, evaluation) {
  const snippets = evaluation.evidence
    .map((e) => `- ${e.source_file}: ${e.snippet}`)
    .join("\n") || "(keine Treffer im Korpus)";
  const prompt = `Du bist ein knapper Workshop-Faktenprüfer. Bewerte in 2 deutschen Sätzen, ob diese Frage im Korpus belegt ist und ob die Antwort sauber bleibt.\nFrage: ${question}\nAntwort: ${aiAnswer || "(noch keine)"}\nKorpus-Status: ${evaluation.status}\nBelege:\n${snippets}`;

  try {
    if (process.env.OPENAI_API_KEY) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 180,
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (r.ok) {
        const j = await r.json();
        evaluation.llmProvider = "OpenAI";
        evaluation.llmComment = j.choices?.[0]?.message?.content?.trim() || null;
      }
    } else if (process.env.ANTHROPIC_API_KEY) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
          max_tokens: 180,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(7000),
      });
      if (r.ok) {
        const j = await r.json();
        evaluation.llmProvider = "Anthropic";
        evaluation.llmComment = j.content?.[0]?.text?.trim() || null;
      }
    } else if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(7000),
        }
      );
      if (r.ok) {
        const j = await r.json();
        evaluation.llmProvider = "Gemini";
        evaluation.llmComment = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
      }
    } else if (process.env.OLLAMA_MODEL) {
      const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
      const r = await fetch(`${host}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.OLLAMA_MODEL, prompt, stream: false }),
        signal: AbortSignal.timeout(9000),
      });
      if (r.ok) {
        const j = await r.json();
        evaluation.llmProvider = `Ollama:${process.env.OLLAMA_MODEL}`;
        evaluation.llmComment = j.response?.trim() || null;
      }
    }
  } catch {
    // Graceful fallback: deterministic check remains intact
  }
}

function getLanUrls() {
  const candidates = [];
  const ifaces = os.networkInterfaces();
  for (const entries of Object.values(ifaces)) {
    for (const addr of entries || []) {
      if (addr.family === "IPv4" && !addr.internal) {
        const ip = addr.address;
        let prio = 3;
        if (ip.startsWith("192.168.")) prio = 0;
        else if (ip.startsWith("10.")) prio = 1;
        else if (ip.startsWith("172.")) prio = 2;
        candidates.push({ prio, url: `http://${ip}:${PORT}/` });
      }
    }
  }
  candidates.sort((a, b) => a.prio - b.prio);
  const urls = candidates.map((c) => c.url);
  return urls.length ? urls : [`http://127.0.0.1:${PORT}/`];
}

const state = {
  submissions: [],
  seenIds: new Set(),
  seenFiles: new Set(),
  seenIssues: new Set(),
  demoCursor: 0,
  config: {
    joinUrl: getLanUrls()[0],
    githubRepo: process.env.GITHUB_REPO || "",
    githubLabel: process.env.GITHUB_LABEL || "workshop-question",
    gitAutoPull: process.env.GIT_AUTO_PULL === "1",
  },
  sseClients: new Set(),
};

function broadcastSubmissions() {
  const payload = `event: submissions\ndata: ${JSON.stringify({ items: state.submissions })}\n\n`;
  for (const res of state.sseClients) {
    try {
      res.write(payload);
    } catch {
      state.sseClients.delete(res);
    }
  }
}

async function addSubmission(raw, persistFile = false) {
  const id = String(raw.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  if (state.seenIds.has(id)) return null;
  state.seenIds.add(id);

  const question = String(raw.question || "").trim();
  const aiAnswer = String(raw.ai_answer || "").trim();
  const evaluation = evaluateDeterministic(question, aiAnswer);
  await runOptionalLlmEvaluation(question, aiAnswer, evaluation);

  const item = {
    id,
    created_at: raw.created_at || new Date().toISOString(),
    team: String(raw.team || "Unbekanntes Team").trim(),
    track: String(raw.track || "Track A"),
    stage: String(raw.stage || "Stufe 2"),
    method: String(raw.method || "Frei"),
    question,
    ai_answer: aiAnswer,
    source: String(raw.source || "web-ui"),
    pinned: Boolean(raw.pinned),
    sample: Boolean(raw.sample),
    evaluation,
  };

  if (persistFile && !raw.sample) {
    fs.mkdirSync(LIVE_DIR, { recursive: true });
    const safeName = `${Date.now()}-${id.replace(/[^a-zA-Z0-9_-]/g, "")}.json`;
    state.seenFiles.add(safeName);
    fs.writeFileSync(path.join(LIVE_DIR, safeName), JSON.stringify(item, null, 2), "utf8");
  }

  state.submissions.unshift(item);
  broadcastSubmissions();
  return item;
}

function scanLiveQuestionsDir() {
  if (!fs.existsSync(LIVE_DIR)) return;
  for (const file of fs.readdirSync(LIVE_DIR)) {
    if (!file.endsWith(".json") || state.seenFiles.has(file)) continue;
    state.seenFiles.add(file);
    try {
      const content = JSON.parse(fs.readFileSync(path.join(LIVE_DIR, file), "utf8"));
      void addSubmission({ ...content, source: content.source || "file-watcher" }, false);
    } catch {
      // ignore malformed JSON files
    }
  }
}

async function pollGithubIssues() {
  const repo = state.config.githubRepo.trim();
  if (!repo || !repo.includes("/")) return;
  const label = encodeURIComponent(state.config.githubLabel || "workshop-question");
  const url = `https://api.github.com/repos/${repo}/issues?state=open&labels=${label}&per_page=20`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "virtual7-ccf-workshop-server",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return;
    const issues = await res.json();
    if (!Array.isArray(issues)) return;
    for (const iss of issues) {
      const key = `gh-${iss.number}`;
      if (state.seenIssues.has(key)) continue;
      state.seenIssues.add(key);
      const body = String(iss.body || "");
      const teamMatch = body.match(/team:\s*(.+)/i);
      const stageMatch = body.match(/stage:\s*(.+)/i);
      const methodMatch = body.match(/method:\s*(.+)/i);
      await addSubmission(
        {
          id: key,
          created_at: iss.created_at,
          team: teamMatch ? teamMatch[1].trim() : iss.user?.login || `GitHub #${iss.number}`,
          track: "GitHub Issue",
          stage: stageMatch ? stageMatch[1].trim() : "Stufe 2",
          method: methodMatch ? methodMatch[1].trim() : "Frei",
          question: iss.title.replace(/^\[Workshop\]\s*/i, ""),
          ai_answer: body.slice(0, 600),
          source: "github",
        },
        false
      );
    }
  } catch {
    // ignore transient network errors
  }
}

function runGitPullIfEnabled() {
  if (!state.config.gitAutoPull) return;
  execFile("git", ["pull", "--ff-only"], { cwd: REPO_ROOT, timeout: 8000 }, () => {
    scanLiveQuestionsDir();
  });
}

const DEMO_POOL = [
  {
    team: "Tisch 1 · Polarfuchs",
    track: "Track A (Browser/Chat)",
    stage: "Stufe 2",
    method: "RISEN + CoT",
    question: "Warum gefriert das Fell des Eisbären nicht und wie viele Zähne hat er?",
    ai_answer: "Das Fell ist von Squalen-freiem Eisbärentalg überzogen, der Wasser abperlen lässt; ausgewachsene Eisbären haben schwarze Haut und 42 Zähne (docs/eisbaer.md).",
    source: "demo",
  },
  {
    team: "Tisch 3 · Korallenriff",
    track: "Track B (CLI/Agent)",
    stage: "Stufe 3",
    method: "Vault-Suche + MCP",
    question: "Welcher Symbiose-Typ liegt bei Anemonenfischen vs. Steinkorallen vor und wann droht Korallenbleiche?",
    ai_answer: "Clownfisch/Anemone = Ektosymbiose ([[symbiose]]), Steinkoralle/Zooxanthellen = Endosymbiose. Ab ca. 29 °C Wärmestress droht Ausbleichen; ohne Rückkehr binnen acht Wochen sterben Korallen ([[korallenbleiche]]).",
    source: "mcp",
  },
  {
    team: "Tisch 4 · Alpenblick",
    track: "Track A (Browser/Chat)",
    stage: "Stufe 2",
    method: "Guardrail-Test",
    question: "Wie viele Schneeleoparden leben im Schweizerischen Nationalpark und wie hoch sind die Eintrittspreise in Euro?",
    ai_answer: "Diese Information ist in den vorliegenden Dokumenten nicht enthalten.",
    source: "demo",
  },
];

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  res.end(JSON.stringify(data));
}

function healthPayload() {
  return {
    ok: true,
    articleCount: CORPUS.length,
    lanUrls: getLanUrls(),
    port: PORT,
    llmMode: detectLlmMode(),
    githubRepo: state.config.githubRepo,
    githubLabel: state.config.githubLabel,
    gitAutoPull: state.config.gitAutoPull,
    joinUrl: state.config.joinUrl,
  };
}

// Initial scan of live-questions/
scanLiveQuestionsDir();
setInterval(scanLiveQuestionsDir, 3000);
setInterval(() => void pollGithubIssues(), 15000);
setInterval(runGitPullIfEnabled, 20000);

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  const pathname = urlObj.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    });
    res.end();
    return;
  }

  // API endpoints
  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, healthPayload());
    return;
  }

  if (pathname === "/api/submissions" && req.method === "GET") {
    sendJson(res, 200, { items: state.submissions });
    return;
  }

  if (pathname === "/api/submissions" && req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      if (!body.question || !body.team) {
        sendJson(res, 400, { error: "team und question sind Pflichtfelder." });
        return;
      }
      const item = await addSubmission(body, true);
      sendJson(res, 201, { ok: true, item });
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
    return;
  }

  if (pathname === "/api/submissions/demo" && req.method === "POST") {
    const template = DEMO_POOL[state.demoCursor % DEMO_POOL.length];
    state.demoCursor += 1;
    const item = await addSubmission({ ...template, id: `demo-${Date.now()}` }, false);
    sendJson(res, 201, { ok: true, item });
    return;
  }

  if (pathname.startsWith("/api/submissions/") && req.method === "PATCH") {
    const id = decodeURIComponent(pathname.slice("/api/submissions/".length));
    const body = await readJsonBody(req).catch(() => ({}));
    const target = state.submissions.find((s) => s.id === id);
    if (!target) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    if (typeof body.pinned === "boolean") target.pinned = body.pinned;
    if (typeof body.discussed === "boolean") target.discussed = body.discussed;
    broadcastSubmissions();
    sendJson(res, 200, { ok: true, item: target });
    return;
  }

  if (pathname.startsWith("/api/submissions/") && req.method === "DELETE") {
    const id = decodeURIComponent(pathname.slice("/api/submissions/".length));
    state.submissions = state.submissions.filter((s) => s.id !== id);
    broadcastSubmissions();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write(`event: submissions\ndata: ${JSON.stringify({ items: state.submissions })}\n\n`);
    state.sseClients.add(res);
    req.on("close", () => state.sseClients.delete(res));
    return;
  }

  if (pathname === "/api/tools/search" && req.method === "POST") {
    const body = await readJsonBody(req).catch(() => ({}));
    const matches = searchCorpus(body.query || "", body.limit || 5);
    sendJson(res, 200, { query: body.query || "", total_articles: CORPUS.length, matches });
    return;
  }

  if (pathname === "/api/tools/verify" && req.method === "POST") {
    const body = await readJsonBody(req).catch(() => ({}));
    const evaluation = evaluateDeterministic(body.claim || "", "");
    sendJson(res, 200, evaluation);
    return;
  }

  if (pathname === "/api/config" && req.method === "POST") {
    const body = await readJsonBody(req).catch(() => ({}));
    if (typeof body.joinUrl === "string" && body.joinUrl.trim()) {
      state.config.joinUrl = body.joinUrl.trim();
    }
    if (typeof body.githubRepo === "string") {
      state.config.githubRepo = body.githubRepo.trim();
    }
    if (typeof body.githubLabel === "string" && body.githubLabel.trim()) {
      state.config.githubLabel = body.githubLabel.trim();
    }
    if (typeof body.gitAutoPull === "boolean") {
      state.config.gitAutoPull = body.gitAutoPull;
    }
    void pollGithubIssues();
    sendJson(res, 200, { ok: true, health: healthPayload() });
    return;
  }

  // Static files + SPA fallback
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("workshop-ui/dist fehlt. Bitte 'npm run build' in workshop-ui ausführen.");
    return;
  }

  const reqRel = pathname === "/" || pathname === "/beamer" ? "index.html" : pathname.replace(/^\/+/, "");
  let filePath = path.resolve(DIST_DIR, reqRel);
  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "0.0.0.0", () => {
  const lan = getLanUrls();
  console.log("");
  console.log("============================================================");
  console.log("  virtual7 CCF Prompt-Werkstatt Server läuft!");
  console.log("============================================================");
  console.log(`  Teilnehmer-UI (lokal) : http://127.0.0.1:${PORT}/`);
  console.log(`  Beamer-Regie  (lokal) : http://127.0.0.1:${PORT}/beamer`);
  for (const u of lan) {
    console.log(`  LAN-Adresse (Teiln.)  : ${u}`);
    console.log(`  LAN-Adresse (Beamer)  : ${u}beamer`);
  }
  console.log(`  Korpus geladen        : ${CORPUS.length} Vault-Artikel`);
  console.log(`  Prüfmechanismus       : ${detectLlmMode()}`);
  console.log("============================================================");
  console.log("");
});
