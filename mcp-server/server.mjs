#!/usr/bin/env node
/**
 * Pure Node.js (>=18) MCP Server (stdio JSON-RPC 2.0) for the virtual7 CCF KI-Workshop.
 * Zero external npm dependencies.
 *
 * Tools:
 *  - search_wildlife_vault
 *  - verify_claim_against_corpus
 *  - read_vault_article
 *
 * Resources:
 *  - vault://_index.md
 *  - vault://wiki/<category_dir>/<slug>.md
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import {
  normalize,
  parseFrontmatter,
  searchCorpus,
  verifyClaim,
} from "../shared/corpus-engine.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_MODULE_ID = "prompt-werkstatt-tierwelt";

function resolveModuleArg(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--module" && i + 1 < argv.length) {
      return String(argv[i + 1]).trim();
    }
    if (arg.startsWith("--module=")) {
      return arg.slice("--module=".length).trim();
    }
  }
  return String(process.env.WORKSHOP_MODULE || DEFAULT_MODULE_ID).trim() || DEFAULT_MODULE_ID;
}

const ACTIVE_MODULE_ID = resolveModuleArg(process.argv.slice(2));
const MODULES_DIR = path.join(REPO_ROOT, "modules");
const ACTIVE_MODULE_DIR = path.join(MODULES_DIR, ACTIVE_MODULE_ID);
const ACTIVE_MODULE_SPEC = (() => {
  const p = path.join(ACTIVE_MODULE_DIR, "module.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
})();

const IS_DEFAULT_MODULE = ACTIVE_MODULE_ID === DEFAULT_MODULE_ID;
const VAULT_ROOT = IS_DEFAULT_MODULE
  ? path.join(REPO_ROOT, "stufe-3-obsidian-vault")
  : ACTIVE_MODULE_DIR;
const WIKI_ROOT = path.join(VAULT_ROOT, "wiki");
const CORPUS_ROOT = path.join(ACTIVE_MODULE_DIR, "corpus");
const INDEX_PATH = path.join(VAULT_ROOT, "_index.md");

const fileCache = new Map();
let cachedArticles = [];
let cachedIndex = null;

function extractHeadingTitle(body, fallback) {
  const m = String(body || "").match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function collectActiveFiles() {
  const found = [];
  if (!IS_DEFAULT_MODULE) {
    if (fs.existsSync(CORPUS_ROOT)) {
      for (const entry of fs.readdirSync(CORPUS_ROOT, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          found.push({
            fullPath: path.join(CORPUS_ROOT, entry.name),
            relPath: `corpus/${entry.name}`,
            defaultCategory: ACTIVE_MODULE_SPEC?.taxonomy?.categories?.[0]?.id || "dokument",
            slug: entry.name.replace(/\.md$/, ""),
          });
        } else if (entry.isDirectory()) {
          const subDir = path.join(CORPUS_ROOT, entry.name);
          for (const subFile of fs.readdirSync(subDir)) {
            if (!subFile.endsWith(".md")) continue;
            found.push({
              fullPath: path.join(subDir, subFile),
              relPath: `corpus/${entry.name}/${subFile}`,
              defaultCategory: ACTIVE_MODULE_SPEC?.taxonomy?.categories?.[0]?.id || entry.name,
              slug: subFile.replace(/\.md$/, ""),
            });
          }
        }
      }
    }
    return found;
  }

  if (fs.existsSync(WIKI_ROOT)) {
    const subdirs = fs
      .readdirSync(WIKI_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const sub of subdirs) {
      const dir = path.join(WIKI_ROOT, sub);
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".md")) continue;
        found.push({
          fullPath: path.join(dir, file),
          relPath: `wiki/${sub}/${file}`,
          defaultCategory:
            sub === "lebensraeume" ? "lebensraum" : sub === "tierarten" ? "tierart" : "konzept",
          slug: file.replace(/\.md$/, ""),
        });
      }
    }
  }
  if (found.length > 0) return found;

  // Fallback roots if wiki/ is unavailable
  const fallbackRoots = [
    { dir: path.join(VAULT_ROOT, "raw"), prefix: "raw" },
    { dir: path.join(REPO_ROOT, "stufe-1-chaos", "docs"), prefix: "docs" },
  ];
  for (const fb of fallbackRoots) {
    if (!fs.existsSync(fb.dir)) continue;
    for (const file of fs.readdirSync(fb.dir)) {
      if (!file.endsWith(".md")) continue;
      found.push({
        fullPath: path.join(fb.dir, file),
        relPath: `${fb.prefix}/${file}`,
        defaultCategory: "konzept",
        slug: file.replace(/\.md$/, ""),
      });
    }
    if (found.length > 0) break;
  }
  return found;
}

function buildArticleRecord(entryMeta, rawMarkdown) {
  const { meta, body } = parseFrontmatter(rawMarkdown);
  const slug = entryMeta.slug;
  const title = meta.title || extractHeadingTitle(body, slug);
  const wikilinks = [
    ...new Set(
      (body.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || []).map((w) =>
        w.slice(2, -2).split("|")[0].trim()
      )
    ),
  ];

  return {
    slug,
    title,
    category: meta.category || entryMeta.defaultCategory,
    group: meta.group || meta.habitat || "",
    habitat: meta.habitat || meta.group || "",
    status: meta.status || "",
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    source_file: meta.source_file || entryMeta.relPath || `raw/${slug}.md`,
    rel_path: entryMeta.relPath,
    wikilinks,
    body,
    rawMarkdown,
  };
}

function loadVaultArticles() {
  const activeFiles = collectActiveFiles();
  const activeSet = new Set(activeFiles.map((f) => f.fullPath));
  let dirty = false;

  for (const key of fileCache.keys()) {
    if (!activeSet.has(key)) {
      fileCache.delete(key);
      dirty = true;
    }
  }

  for (const item of activeFiles) {
    let st;
    try {
      st = fs.statSync(item.fullPath);
    } catch {
      continue;
    }
    const existing = fileCache.get(item.fullPath);
    if (!existing || existing.mtimeMs !== st.mtimeMs || existing.size !== st.size) {
      const rawMarkdown = fs.readFileSync(item.fullPath, "utf8");
      const article = buildArticleRecord(item, rawMarkdown);
      fileCache.set(item.fullPath, {
        mtimeMs: st.mtimeMs,
        size: st.size,
        article,
        rawMarkdown,
      });
      dirty = true;
    }
  }

  if (dirty || cachedArticles.length !== fileCache.size) {
    cachedArticles = [...fileCache.values()]
      .map((e) => e.article)
      .sort((a, b) => a.rel_path.localeCompare(b.rel_path));
  }

  return cachedArticles;
}

function loadVaultIndex() {
  if (fs.existsSync(INDEX_PATH)) {
    const st = fs.statSync(INDEX_PATH);
    if (!cachedIndex || cachedIndex.mtimeMs !== st.mtimeMs || cachedIndex.size !== st.size) {
      const content = fs.readFileSync(INDEX_PATH, "utf8");
      cachedIndex = {
        mtimeMs: st.mtimeMs,
        size: st.size,
        content,
      };
    }
    return cachedIndex.content;
  }
  if (!IS_DEFAULT_MODULE) {
    const articles = loadVaultArticles();
    const lines = [
      `# Inhaltsverzeichnis: ${ACTIVE_MODULE_SPEC?.title || ACTIVE_MODULE_ID}`,
      "",
      `Aktives Modul: \`${ACTIVE_MODULE_ID}\` (${articles.length} Dokumente)`,
      "",
    ];
    for (const art of articles) {
      lines.push(`- [[${art.slug}|${art.title}]] (${art.category}) — ${art.rel_path}`);
    }
    return lines.join("\n");
  }
  cachedIndex = null;
  return null;
}

function listModules() {
  const modules = [];
  if (fs.existsSync(MODULES_DIR)) {
    for (const entry of fs.readdirSync(MODULES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const specPath = path.join(MODULES_DIR, entry.name, "module.json");
      if (!fs.existsSync(specPath)) continue;
      try {
        const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
        modules.push({
          id: spec.id || entry.name,
          title: spec.title || entry.name,
          level: spec.level || "",
          domainLabel: spec.domainLabel || "",
          isDefault: Boolean(spec.isDefault),
        });
      } catch {
        // skip unreadable module.json
      }
    }
  }
  return {
    active_module: ACTIVE_MODULE_ID,
    modules,
  };
}

function searchVault(query, category, limit = 5) {
  const articles = loadVaultArticles();
  const matches = searchCorpus(articles, query, { category, limit });
  return {
    query,
    total_articles: articles.length,
    matches,
  };
}

function readVaultArticle(rawSlug) {
  const raw = String(rawSlug || "").trim();
  if (!raw) {
    throw new Error("Parameter 'slug' fehlt.");
  }

  // Strip [[wikilink|label]], leading folder prefixes, and .md suffix
  let clean = raw
    .replace(/^\[\[/, "")
    .replace(/\]\]$/, "")
    .split("|")[0]
    .trim();
  const lowerClean = clean.toLowerCase();

  if (lowerClean === "_index" || lowerClean === "_index.md" || lowerClean === "index" || lowerClean === "vault://_index.md") {
    const indexContent = loadVaultIndex();
    if (indexContent === null) {
      throw new Error("_index.md wurde im Vault nicht gefunden.");
    }
    return {
      slug: "_index",
      title: "Vault-Index (_index.md)",
      category: "index",
      habitat: "",
      status: "aktiv",
      tags: [],
      rel_path: "_index.md",
      source_file: "_index.md",
      uri: "vault://_index.md",
      wikilink: "[[_index]]",
      related_wikilinks: [],
      content: indexContent,
    };
  }

  const normalizedSlugPart = clean
    .replace(/^vault:\/\//i, "")
    .replace(/^wiki\/[^/]+\//i, "")
    .replace(/^corpus\//i, "")
    .replace(/^raw\//i, "")
    .replace(/^docs\//i, "")
    .replace(/\.md$/i, "");

  const articles = loadVaultArticles();
  const normTarget = normalize(normalizedSlugPart);

  const found =
    articles.find((a) => a.rel_path === clean) ||
    articles.find((a) => a.slug === normalizedSlugPart) ||
    articles.find((a) => normalize(a.slug) === normTarget) ||
    articles.find((a) => normalize(a.title) === normTarget);

  if (!found) {
    const suggestions = searchCorpus(articles, normalizedSlugPart, 3);
    const sugText = suggestions.length
      ? ` Meintest du: ${suggestions.map((s) => `${s.slug} (${s.title})`).join(", ")}?`
      : "";
    throw new Error(`Artikel '${raw}' nicht im Vault gefunden.${sugText}`);
  }

  return {
    slug: found.slug,
    title: found.title,
    category: found.category,
    habitat: found.habitat,
    status: found.status,
    tags: found.tags,
    rel_path: found.rel_path,
    source_file: found.source_file,
    uri: `vault://${found.rel_path}`,
    wikilink: `[[${found.slug}|${found.title}]]`,
    related_wikilinks: found.wikilinks.slice(0, 8).map((s) => `[[${s}]]`),
    content: found.rawMarkdown,
  };
}

function listResources() {
  const resources = [];
  const indexContent = loadVaultIndex();
  if (indexContent !== null) {
    resources.push({
      uri: "vault://_index.md",
      name: "_index.md",
      title: "Vault-Index (Kategorien & Einstieg)",
      description: "Zentrale Übersichtskarte des Obsidian-Vaults nach Lebensräumen, Tierarten und Konzepten.",
      mimeType: "text/markdown",
    });
  }

  const articles = loadVaultArticles();
  for (const art of articles) {
    resources.push({
      uri: `vault://${art.rel_path}`,
      name: `${art.slug}.md`,
      title: art.title,
      description: `[[${art.slug}|${art.title}]] (${art.category}${art.habitat ? " · " + art.habitat : ""})`,
      mimeType: "text/markdown",
    });
  }
  return resources;
}

function readResource(uri) {
  const rawUri = String(uri || "").trim();
  if (!rawUri.startsWith("vault://")) {
    return null;
  }
  const rel = rawUri.slice("vault://".length);
  if (!rel || rel.includes("..") || rel.includes("\\") || rel.includes("\0") || path.isAbsolute(rel)) {
    return { invalidTraversal: true };
  }

  if (rel === "_index.md") {
    const text = loadVaultIndex();
    if (text === null) return null;
    return { uri: rawUri, mimeType: "text/markdown", text };
  }

  const articles = loadVaultArticles();
  const art = articles.find((a) => a.rel_path === rel);
  if (!art) return null;

  return {
    uri: `vault://${art.rel_path}`,
    mimeType: "text/markdown",
    text: art.rawMarkdown,
  };
}

const CATEGORY_ENUM = IS_DEFAULT_MODULE
  ? ["lebensraum", "tierart", "konzept"]
  : Array.isArray(ACTIVE_MODULE_SPEC?.taxonomy?.categories) &&
      ACTIVE_MODULE_SPEC.taxonomy.categories.length > 0
    ? ACTIVE_MODULE_SPEC.taxonomy.categories.map((c) => c.id)
    : undefined;

const CATEGORY_SCHEMA = CATEGORY_ENUM
  ? {
      type: "string",
      enum: CATEGORY_ENUM,
      description: "Optionaler Filter auf Kategorie.",
    }
  : {
      type: "string",
      description: "Optionaler Filter auf Kategorie.",
    };

const SEARCH_INPUT_SCHEMA = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "Suchbegriff oder Frage.",
    },
    category: CATEGORY_SCHEMA,
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 15,
      default: 5,
      description: "Maximale Anzahl Treffer (Standard: 5).",
    },
  },
  required: ["query"],
};

const VERIFY_INPUT_SCHEMA = {
  type: "object",
  properties: {
    claim: {
      type: "string",
      description: "Die zu prüfende Aussage oder Faktenbehauptung.",
    },
  },
  required: ["claim"],
};

const READ_INPUT_SCHEMA = {
  type: "object",
  properties: {
    slug: {
      type: "string",
      description: "Artikel-Slug (z. B. '_index', '[[slug]]' oder relativer Pfad).",
    },
  },
  required: ["slug"],
};

const TOOLS = [
  {
    name: "search_vault",
    description: `Durchsucht die Wissensbasis des aktiven Moduls (${ACTIVE_MODULE_ID}) und liefert [[Wikilinks]] sowie Textauszüge.`,
    inputSchema: SEARCH_INPUT_SCHEMA,
  },
  {
    name: "verify_claim",
    description: `Prüft eine Aussage gegen alle lokalen Dokumente des aktiven Moduls (${ACTIVE_MODULE_ID}) und deckt unbelegte Behauptungen auf.`,
    inputSchema: VERIFY_INPUT_SCHEMA,
  },
  {
    name: "read_article",
    description: "Liest den vollständigen Markdown-Inhalt eines Dokuments (oder '_index') anhand von Slug, Titel, [[Wikilink]] oder relativem Pfad.",
    inputSchema: READ_INPUT_SCHEMA,
  },
  {
    name: "list_modules",
    description: "Listet alle verfügbaren Workshop-Module unter modules/ und markiert das aktive Modul.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "search_wildlife_vault",
    description:
      "Kompatibilitäts-Alias für search_vault: Durchsucht die Wissensbasis und liefert [[Wikilinks]] sowie Textauszüge.",
    inputSchema: SEARCH_INPUT_SCHEMA,
  },
  {
    name: "verify_claim_against_corpus",
    description:
      "Kompatibilitäts-Alias für verify_claim: Prüft eine Aussage gegen alle lokalen Artikel im Korpus.",
    inputSchema: VERIFY_INPUT_SCHEMA,
  },
  {
    name: "read_vault_article",
    description:
      "Kompatibilitäts-Alias für read_article: Liest den vollständigen Markdown-Inhalt eines Artikels (oder '_index').",
    inputSchema: READ_INPUT_SCHEMA,
  },
];

function writeMessage(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function handleRequest(req) {
  const { id, method, params } = req;

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
          capabilities: { tools: {}, resources: {} },
          serverInfo: {
            name: "virtual7-ccf-workshop-mcp",
            version: "1.1.0",
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
      if (toolName === "search_vault" || toolName === "search_wildlife_vault") {
        if (!args.query) throw new Error("Parameter 'query' fehlt.");
        data = searchVault(args.query, args.category, args.limit);
      } else if (toolName === "verify_claim" || toolName === "verify_claim_against_corpus") {
        if (!args.claim) throw new Error("Parameter 'claim' fehlt.");
        data = verifyClaim(loadVaultArticles(), args.claim);
      } else if (toolName === "read_article" || toolName === "read_vault_article") {
        data = readVaultArticle(args.slug);
      } else if (toolName === "list_modules") {
        data = listModules();
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

    if (method === "resources/list") {
      writeMessage({
        jsonrpc: "2.0",
        id,
        result: { resources: listResources() },
      });
      return;
    }

    if (method === "resources/templates/list") {
      writeMessage({
        jsonrpc: "2.0",
        id,
        result: { resourceTemplates: [] },
      });
      return;
    }

    if (method === "resources/read") {
      const uri = params?.uri;
      if (!uri) {
        writeMessage({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Parameter 'uri' fehlt." },
        });
        return;
      }
      const resData = readResource(uri);
      if (!resData || resData.invalidTraversal) {
        writeMessage({
          jsonrpc: "2.0",
          id,
          error: { code: -32002, message: `Resource nicht gefunden oder ungültig: ${uri}` },
        });
        return;
      }
      writeMessage({
        jsonrpc: "2.0",
        id,
        result: {
          contents: [resData],
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
