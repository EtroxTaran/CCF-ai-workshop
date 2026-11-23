#!/usr/bin/env node
/**
 * Pure Node.js (>=18) MCP Server (stdio JSON-RPC 2.0) for the virtual7 CCF KI-Workshop.
 * Zero external npm dependencies.
 *
 * Tools:
 *  - search_wildlife_vault
 *  - verify_claim_against_corpus
 *  - send_to_beamer
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const WIKI_ROOT = path.join(REPO_ROOT, "stufe-3-obsidian-vault", "wiki");
const LIVE_DIR = path.join(REPO_ROOT, "live-questions");

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
  "zwar", "zwischen"
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
  const rawTokens = norm.match(/[a-z0-9]{3,}/g) || [];
  return [...new Set(rawTokens.filter((t) => !STOPWORDS.has(t)))];
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const metaLines = match[1].split(/\r?\n/);
  const meta = {};
  let currentKey = null;
  for (const line of metaLines) {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const val = kv[2].trim().replace(/^"(.*)"$/, "$1");
      if (val === "") {
        meta[currentKey] = [];
      } else {
        meta[currentKey] = val;
      }
    } else if (currentKey && line.trim().startsWith("- ")) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      meta[currentKey].push(line.trim().slice(2).trim());
    }
  }
  return { meta, body: match[2] };
}

function loadVaultArticles() {
  const articles = [];
  if (!fs.existsSync(WIKI_ROOT)) return articles;
  const subdirs = ["lebensraeume", "tierarten", "konzepte"];
  for (const sub of subdirs) {
    const dir = path.join(WIKI_ROOT, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const { meta, body } = parseFrontmatter(raw);
      const slug = file.replace(/\.md$/, "");
      const wikilinks = [...new Set((body.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || []).map((w) => w.slice(2, -2).split("|")[0]))];
      articles.push({
        slug,
        title: meta.title || slug,
        category: meta.category || sub.slice(0, -1),
        habitat: meta.habitat || "",
        status: meta.status || "",
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        source_file: meta.source_file || `raw/${slug}.md`,
        rel_path: `wiki/${sub}/${file}`,
        wikilinks,
        body,
        normTitle: normalize(meta.title || slug),
        normBody: normalize(body),
      });
    }
  }
  return articles;
}

function extractBestSnippet(body, tokens) {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("---") && !l.startsWith("> **Kategorie"));
  let bestLine = lines[0] || "";
  let bestScore = -1;
  for (const line of lines) {
    const nl = normalize(line);
    let score = 0;
    for (const tok of tokens) {
      if (nl.includes(tok)) score += tok.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestLine = line;
    }
  }
  return bestLine.length > 320 ? bestLine.slice(0, 317) + "..." : bestLine;
}

function searchVault(query, category, limit = 5) {
  const articles = loadVaultArticles();
  const tokens = tokenize(query);
  const normQuery = normalize(query).trim();
  const filtered = category
    ? articles.filter((a) => a.category === category || normalize(a.habitat) === normalize(category))
    : articles;

  const scored = [];
  for (const art of filtered) {
    let score = 0;
    const matchedTokens = [];
    if (normQuery && art.normTitle.includes(normQuery)) score += 30;
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
        category: art.category,
        habitat: art.habitat,
        status: art.status,
        rel_path: art.rel_path,
        source_file: art.source_file,
        wikilink: `[[${art.slug}|${art.title}]]`,
        related_wikilinks: art.wikilinks.slice(0, 5).map((s) => `[[${s}]]`),
        matched_tokens: matchedTokens,
        score,
        snippet: extractBestSnippet(art.body, tokens),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return {
    query,
    total_articles: articles.length,
    matches: scored.slice(0, Math.min(Math.max(Number(limit) || 5, 1), 15)),
  };
}

function verifyClaim(claim) {
  const tokens = tokenize(claim);
  const results = searchVault(claim, null, 5);
  const top = results.matches;

  if (!tokens.length || !top.length) {
    return {
      claim,
      status: "nicht_belegt",
      confidence_label: "Keine Treffer im Tierwelt-Korpus gefunden (mögliche Fangfrage oder fehlende Quelle).",
      matched_token_ratio: 0,
      evidence: [],
    };
  }

  const covered = new Set();
  for (const m of top.slice(0, 3)) {
    for (const t of m.matched_tokens) covered.add(t);
  }
  const ratio = covered.size / tokens.length;
  let status = "nicht_belegt";
  let confidence_label = "Nicht ausreichend im Korpus belegt.";
  if (ratio >= 0.55 && top[0].score >= 12) {
    status = "belegt";
    confidence_label = "Starke Übereinstimmung mit lokalen Vault-Artikeln — bitte genaue Passage prüfen.";
  } else if (ratio >= 0.25 && top[0].score >= 7) {
    status = "teilweise";
    confidence_label = "Teilweise Themenbezug gefunden — Detailaussage gegen Zitat prüfen.";
  }

  return {
    claim,
    status,
    confidence_label,
    matched_token_ratio: Number(ratio.toFixed(2)),
    evidence: top.slice(0, 3).map((m) => ({
      wikilink: m.wikilink,
      rel_path: m.rel_path,
      source_file: m.source_file,
      snippet: m.snippet,
      matched_tokens: m.matched_tokens,
    })),
  };
}

async function sendToBeamer(args) {
  const question = String(args.question || "").trim();
  const team = String(args.team || "").trim();
  if (!question || !team) {
    throw new Error("Die Felder 'question' und 'team' sind erforderlich.");
  }

  fs.mkdirSync(LIVE_DIR, { recursive: true });
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  const slug = normalize(team)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "team";
  const filename = `${stamp}-${slug}.json`;
  const filePath = path.join(LIVE_DIR, filename);

  const payload = {
    id: `mcp-${stamp}-${slug}`,
    created_at: now.toISOString(),
    team,
    track: args.track || "Track B (MCP)",
    stage: args.stage || "Stufe 3",
    method: args.method || "RISEN + CoT",
    question,
    ai_answer: args.ai_answer || "",
    source: "mcp",
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");

  const targetUrl = args.beamer_url || process.env.BEAMER_URL || "http://127.0.0.1:3777/api/submissions";
  let liveDelivered = false;
  let liveNote = "";

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      liveDelivered = true;
      liveNote = `Live an Beamer zugestellt (${targetUrl}).`;
    } else {
      liveNote = `Beamer antwortete mit HTTP ${res.status} — Frage lokal unter live-questions/${filename} gespeichert.`;
    }
  } catch {
    liveNote = `Kein lokaler Beamer-Server unter ${targetUrl} erreichbar — Frage in live-questions/${filename} abgelegt (bereit für Ordner-Watcher oder Git-Push).`;
  }

  return {
    ok: true,
    saved_file: `live-questions/${filename}`,
    live_delivered: liveDelivered,
    message: liveNote,
    submission: payload,
  };
}

const TOOLS = [
  {
    name: "search_wildlife_vault",
    description:
      "Durchsucht den strukturierten Obsidian-Vault (stufe-3-obsidian-vault/wiki/) nach Lebensräumen, Tierarten und ökologischen Konzepten und liefert [[Wikilinks]] sowie Textauszüge.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Suchbegriff oder Frage (z. B. 'Eisbär Ringelrobbe Klimawandel').",
        },
        category: {
          type: "string",
          enum: ["lebensraum", "tierart", "konzept"],
          description: "Optionaler Filter auf Kategorie.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 15,
          default: 5,
          description: "Maximale Anzahl Treffer (Standard: 5).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "verify_claim_against_corpus",
    description:
      "Prüft eine Aussage oder Behauptung gegen alle lokalen Artikel im Tierwelt-Korpus und deckt unbelegte Behauptungen bzw. Fangfragen auf.",
    inputSchema: {
      type: "object",
      properties: {
        claim: {
          type: "string",
          description: "Die zu prüfende Aussage oder Faktenbehauptung.",
        },
      },
      required: ["claim"],
    },
  },
  {
    name: "send_to_beamer",
    description:
      "Sendet eine Workshop-Frage, Beobachtung oder KI-Antwort live auf die Beamer-Leinwand (schreibt in live-questions/ und sendet optional per HTTP an den Beamer-Server).",
    inputSchema: {
      type: "object",
      properties: {
        team: {
          type: "string",
          description: "Name oder Kürzel der Gruppe/Person (z. B. 'Tisch 3 - Polarfuchs').",
        },
        question: {
          type: "string",
          description: "Die gestellte Frage oder das Prompt-Ergebnis für den Beamer.",
        },
        ai_answer: {
          type: "string",
          description: "Optionale Kurzfassung der KI-Antwort oder des Aha-Moments.",
        },
        stage: {
          type: "string",
          description: "Optional: Stufe 1, Stufe 2 oder Stufe 3.",
        },
        method: {
          type: "string",
          description: "Optional: z. B. Zero-Shot, CO-STAR, Few-Shot, RISEN + CoT.",
        },
        track: {
          type: "string",
          description: "Optional: Track A oder Track B.",
        },
        beamer_url: {
          type: "string",
          description: "Optionale URL des Beamer-Servers (z. B. http://192.168.1.50:3777/api/submissions).",
        },
      },
      required: ["team", "question"],
    },
  },
];

function writeMessage(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function handleRequest(req) {
  const { id, method, params } = req;

  // Notifications carry no id and expect no JSON-RPC response
  if (id === undefined || id === null) {
    return;
  }

  try {
    if (method === "initialize") {
      const protocolVersion = params?.protocolVersion || "2024-11-05";
      writeMessage({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion,
          capabilities: { tools: {} },
          serverInfo: {
            name: "virtual7-ccf-workshop-mcp",
            version: "1.0.0",
          },
        },
      });
      return;
    }

    if (method === "ping") {
      writeMessage({ jsonrpc: "2.0", id, result: {} });
      return;
    }

    if (method === "tools/list") {
      writeMessage({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      let data;
      if (toolName === "search_wildlife_vault") {
        if (!args.query) throw new Error("Parameter 'query' fehlt.");
        data = searchVault(args.query, args.category, args.limit);
      } else if (toolName === "verify_claim_against_corpus") {
        if (!args.claim) throw new Error("Parameter 'claim' fehlt.");
        data = verifyClaim(args.claim);
      } else if (toolName === "send_to_beamer") {
        data = await sendToBeamer(args);
      } else {
        writeMessage({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unbekanntes Tool: ${toolName}` },
        });
        return;
      }

      writeMessage({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        },
      });
      return;
    }

    writeMessage({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Methode nicht unterstützt: ${method}` },
    });
  } catch (err) {
    writeMessage({
      jsonrpc: "2.0",
      id,
      result: {
        isError: true,
        content: [{ type: "text", text: `Fehler: ${err.message || String(err)}` }],
      },
    });
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const msg = JSON.parse(trimmed);
    void handleRequest(msg);
  } catch (err) {
    writeMessage({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` },
    });
  }
});
