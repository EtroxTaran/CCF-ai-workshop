#!/usr/bin/env node
/**
 * Pure Node.js (>=18) MCP Server (stdio JSON-RPC 2.0) for the virtual7 CCF KI-Workshop.
 * Zero external npm dependencies. Supports multi-module switching via --module <slug>,
 * WORKSHOP_MODULE env var, or optional `module` tool argument.
 *
 * Tools:
 *  - search_vault (alias: search_wildlife_vault)
 *  - verify_claim (alias: verify_claim_against_corpus)
 *  - read_article (alias: read_vault_article)
 *  - list_modules
 *
 * Resources:
 *  - vault://_index.md
 *  - vault://wiki/<category_dir>/<slug>.md (Default module) or vault://corpus/<slug>.md
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
const MODULES_DIR = path.join(REPO_ROOT, "modules");
const DEFAULT_MODULE_ID = "prompt-werkstatt-tierwelt";
const SAFE_SLUG_RE = /^[a-z0-9-]+$/;
const IGNORED_INSTRUCTION_FILES = new Set(["agents.md", "claude.md", "gemini.md"]);

function isIgnoredInstructionFile(filename) {
  return IGNORED_INSTRUCTION_FILES.has(String(filename || "").toLowerCase());
}

function isCanonicalOnlyEnabled(argv, isDefaultModule) {
  if (argv.includes("--canonical-only")) return true;
  const envVal = String(process.env.WORKSHOP_MCP_CANONICAL_ONLY || "").trim().toLowerCase();
  if (envVal === "1" || envVal === "true") return true;
  return !isDefaultModule;
}

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

function assertValidModuleId(rawId) {
  const id = String(rawId || "").trim();
  if (!SAFE_SLUG_RE.test(id)) {
    throw new Error(`Ungültiger Modul-Slug '${id}'. Erlaubt sind nur Kleinbuchstaben, Ziffern und Bindestriche.`);
  }
  const modDir = path.join(MODULES_DIR, id);
  const resolved = path.resolve(modDir);
  if (!resolved.startsWith(path.resolve(MODULES_DIR) + path.sep)) {
    throw new Error(`Ungültiger Modul-Pfad für '${id}'.`);
  }
  if (id !== DEFAULT_MODULE_ID && !fs.existsSync(path.join(resolved, "module.json"))) {
    throw new Error(`Modul '${id}' nicht gefunden unter modules/${id}/module.json.`);
  }
  return id;
}

let ACTIVE_MODULE_ID;
try {
  ACTIVE_MODULE_ID = assertValidModuleId(resolveModuleArg(process.argv.slice(2)));
} catch (err) {
  process.stderr.write(`MCP Server Fehler: ${err.message}\n`);
  process.exit(1);
}

const moduleContexts = new Map();

function getModuleContext(requestedModuleId = ACTIVE_MODULE_ID) {
  const modId = assertValidModuleId(requestedModuleId || ACTIVE_MODULE_ID);
  if (moduleContexts.has(modId)) {
    return moduleContexts.get(modId);
  }
  const moduleDir = path.join(MODULES_DIR, modId);
  const specPath = path.join(moduleDir, "module.json");
  let spec = null;
  if (fs.existsSync(specPath)) {
    try {
      spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    } catch {
      spec = null;
    }
  }
  const isDefault = modId === DEFAULT_MODULE_ID;
  const vaultRoot = isDefault ? path.join(REPO_ROOT, "stufe-3-obsidian-vault") : moduleDir;
  const ctx = {
    id: modId,
    isDefault,
    moduleDir,
    spec,
    vaultRoot,
    wikiRoot: path.join(vaultRoot, "wiki"),
    corpusRoot: path.join(moduleDir, "corpus"),
    indexPath: path.join(vaultRoot, "_index.md"),
    fileCache: new Map(),
    cachedArticles: [],
    cachedIndex: null,
  };
  moduleContexts.set(modId, ctx);
  return ctx;
}

const ACTIVE_CTX = getModuleContext(ACTIVE_MODULE_ID);
const IS_DEFAULT_MODULE = ACTIVE_CTX.isDefault;
const ACTIVE_MODULE_SPEC = ACTIVE_CTX.spec;
const CANONICAL_ONLY = isCanonicalOnlyEnabled(process.argv.slice(2), IS_DEFAULT_MODULE);

function extractHeadingTitle(body, fallback) {
  const m = String(body || "").match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function collectActiveFiles(ctx = ACTIVE_CTX) {
  const found = [];
  if (!ctx.isDefault) {
    if (fs.existsSync(ctx.corpusRoot)) {
      for (const entry of fs.readdirSync(ctx.corpusRoot, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith(".md") && !isIgnoredInstructionFile(entry.name)) {
          found.push({
            fullPath: path.join(ctx.corpusRoot, entry.name),
            relPath: `corpus/${entry.name}`,
            defaultCategory: ctx.spec?.taxonomy?.categories?.[0]?.id || "dokument",
            slug: entry.name.replace(/\.md$/, ""),
          });
        } else if (entry.isDirectory()) {
          const subDir = path.join(ctx.corpusRoot, entry.name);
          for (const subFile of fs.readdirSync(subDir)) {
            if (!subFile.endsWith(".md") || isIgnoredInstructionFile(subFile)) continue;
            found.push({
              fullPath: path.join(subDir, subFile),
              relPath: `corpus/${entry.name}/${subFile}`,
              defaultCategory: ctx.spec?.taxonomy?.categories?.[0]?.id || entry.name,
              slug: subFile.replace(/\.md$/, ""),
            });
          }
        }
      }
    }
    return found;
  }

  if (fs.existsSync(ctx.wikiRoot)) {
    const subdirs = fs
      .readdirSync(ctx.wikiRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const sub of subdirs) {
      const dir = path.join(ctx.wikiRoot, sub);
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".md") || isIgnoredInstructionFile(file)) continue;
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
    { dir: path.join(ctx.vaultRoot, "raw"), prefix: "raw" },
    { dir: path.join(REPO_ROOT, "stufe-1-chaos", "docs"), prefix: "docs" },
  ];
  for (const fb of fallbackRoots) {
    if (!fs.existsSync(fb.dir)) continue;
    for (const file of fs.readdirSync(fb.dir)) {
      if (!file.endsWith(".md") || isIgnoredInstructionFile(file)) continue;
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

function loadVaultArticles(ctx = ACTIVE_CTX) {
  const activeFiles = collectActiveFiles(ctx);
  const activeSet = new Set(activeFiles.map((f) => f.fullPath));
  let dirty = false;

  for (const key of ctx.fileCache.keys()) {
    if (!activeSet.has(key)) {
      ctx.fileCache.delete(key);
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
    const existing = ctx.fileCache.get(item.fullPath);
    if (!existing || existing.mtimeMs !== st.mtimeMs || existing.size !== st.size) {
      const rawMarkdown = fs.readFileSync(item.fullPath, "utf8");
      const article = buildArticleRecord(item, rawMarkdown);
      ctx.fileCache.set(item.fullPath, {
        mtimeMs: st.mtimeMs,
        size: st.size,
        article,
        rawMarkdown,
      });
      dirty = true;
    }
  }

  if (dirty || ctx.cachedArticles.length !== ctx.fileCache.size) {
    ctx.cachedArticles = [...ctx.fileCache.values()]
      .map((e) => e.article)
      .sort((a, b) => a.rel_path.localeCompare(b.rel_path));
  }

  return ctx.cachedArticles;
}

function loadVaultIndex(ctx = ACTIVE_CTX) {
  if (fs.existsSync(ctx.indexPath)) {
    const st = fs.statSync(ctx.indexPath);
    if (!ctx.cachedIndex || ctx.cachedIndex.mtimeMs !== st.mtimeMs || ctx.cachedIndex.size !== st.size) {
      const content = fs.readFileSync(ctx.indexPath, "utf8");
      ctx.cachedIndex = {
        mtimeMs: st.mtimeMs,
        size: st.size,
        content,
      };
    }
    return ctx.cachedIndex.content;
  }
  if (!ctx.isDefault) {
    const articles = loadVaultArticles(ctx);
    const lines = [
      `# Inhaltsverzeichnis: ${ctx.spec?.title || ctx.id}`,
      "",
      `Aktives Modul: \`${ctx.id}\` (${articles.length} Dokumente)`,
      "",
    ];
    for (const art of articles) {
      lines.push(`- [[${art.slug}|${art.title}]] (${art.category}) — ${art.rel_path}`);
    }
    return lines.join("\n");
  }
  ctx.cachedIndex = null;
  return null;
}

function getCategoriesForSpec(spec, articles = null) {
  const fromSpec = Array.isArray(spec?.taxonomy?.categories)
    ? spec.taxonomy.categories
        .map((c) => (typeof c === "string" ? c : c?.id))
        .filter(Boolean)
    : [];
  const fromArticles = Array.isArray(articles)
    ? articles.map((a) => a.category).filter(Boolean)
    : [];
  return [...new Set([...fromSpec, ...fromArticles])];
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
        const id = spec.id || entry.name;
        let categories = getCategoriesForSpec(spec);
        if (categories.length === 0) {
          categories = getCategoriesForSpec(spec, loadVaultArticles(getModuleContext(id)));
        }
        modules.push({
          id,
          title: spec.title || entry.name,
          level: spec.level || "",
          domainLabel: spec.domainLabel || "",
          isDefault: Boolean(spec.isDefault),
          categories,
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

function searchVault(query, category, limit = 5, moduleId = ACTIVE_MODULE_ID) {
  const ctx = getModuleContext(moduleId);
  const articles = loadVaultArticles(ctx);
  const cleanCategory = typeof category === "string" ? category.trim() : "";
  const matches = searchCorpus(articles, query, { category: cleanCategory || undefined, limit });
  const result = {
    module: ctx.id,
    query,
    total_articles: articles.length,
    matches,
  };
  if (matches.length === 0 && cleanCategory) {
    result.available_categories = getCategoriesForSpec(ctx.spec, articles);
  }
  return result;
}

function readVaultArticle(rawSlug, moduleId = ACTIVE_MODULE_ID) {
  const ctx = getModuleContext(moduleId);
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
    const indexContent = loadVaultIndex(ctx);
    if (indexContent === null) {
      throw new Error("_index.md wurde im Vault nicht gefunden.");
    }
    return {
      module: ctx.id,
      slug: "_index",
      title: `Vault-Index (${ctx.spec?.title || ctx.id})`,
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
    .replace(/^corpus\/(?:[^/]+\/)?/i, "")
    .replace(/^raw\//i, "")
    .replace(/^docs\//i, "")
    .replace(/\.md$/i, "");

  const articles = loadVaultArticles(ctx);
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
    throw new Error(`Artikel '${raw}' nicht im Modul '${ctx.id}' gefunden.${sugText}`);
  }

  return {
    module: ctx.id,
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
  const indexContent = loadVaultIndex(ACTIVE_CTX);
  if (indexContent !== null) {
    const desc = IS_DEFAULT_MODULE
      ? "Zentrale Übersichtskarte des Obsidian-Vaults nach Lebensräumen, Tierarten und Konzepten."
      : `Zentrale Übersichtskarte für das Modul „${ACTIVE_MODULE_SPEC?.title || ACTIVE_MODULE_ID}“ (${ACTIVE_MODULE_SPEC?.domainLabel || "Wissensbasis"}).`;
    resources.push({
      uri: "vault://_index.md",
      name: "_index.md",
      title: `Vault-Index (${ACTIVE_MODULE_SPEC?.title || ACTIVE_MODULE_ID})`,
      description: desc,
      mimeType: "text/markdown",
    });
  }

  const articles = loadVaultArticles(ACTIVE_CTX);
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
    const text = loadVaultIndex(ACTIVE_CTX);
    if (text === null) return null;
    return { uri: rawUri, mimeType: "text/markdown", text };
  }

  const articles = loadVaultArticles(ACTIVE_CTX);
  const art = articles.find((a) => a.rel_path === rel);
  if (!art) return null;

  return {
    uri: `vault://${art.rel_path}`,
    mimeType: "text/markdown",
    text: art.rawMarkdown,
  };
}

const CATEGORY_EXAMPLES = IS_DEFAULT_MODULE
  ? ["lebensraum", "tierart", "konzept"]
  : Array.isArray(ACTIVE_MODULE_SPEC?.taxonomy?.categories) &&
      ACTIVE_MODULE_SPEC.taxonomy.categories.length > 0
    ? ACTIVE_MODULE_SPEC.taxonomy.categories.map((c) => c.id).filter(Boolean)
    : [];

const CATEGORY_SCHEMA = {
  type: "string",
  description: CATEGORY_EXAMPLES.length
    ? `Optionaler Filter auf Kategorie oder Bereich (Beispiele im aktiven Modul: ${CATEGORY_EXAMPLES.map((c) => `'${c}'`).join(", ")}; Kategorien anderer Module siehe list_modules).`
    : "Optionaler Filter auf Kategorie oder Bereich (Beispiele z. B. 'lebensraum', 'tierart', 'konzept', 'dokument', 'entscheidung', 'runbook'; siehe list_modules).",
};

const MODULE_PROP = {
  type: "string",
  description: `Optionaler Modul-Slug (Standard: '${ACTIVE_MODULE_ID}'). Siehe list_modules.`,
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
    module: MODULE_PROP,
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
    module: MODULE_PROP,
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
    module: MODULE_PROP,
  },
  required: ["slug"],
};

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const CANONICAL_TOOLS = [
  {
    name: "search_vault",
    description: `Durchsucht die Wissensbasis des aktiven Moduls (${ACTIVE_MODULE_ID}, oder per 'module'-Parameter) und liefert [[Wikilinks]] sowie Textauszüge.`,
    inputSchema: SEARCH_INPUT_SCHEMA,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "verify_claim",
    description: `Prüft eine Aussage gegen alle lokalen Dokumente des aktiven Moduls (${ACTIVE_MODULE_ID}) und deckt unbelegte Behauptungen oder Zahlenwidersprüche auf.`,
    inputSchema: VERIFY_INPUT_SCHEMA,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "read_article",
    description: "Liest den vollständigen Markdown-Inhalt eines Dokuments (oder '_index') anhand von Slug, Titel, [[Wikilink]] oder relativem Pfad.",
    inputSchema: READ_INPUT_SCHEMA,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "list_modules",
    description: "Listet alle verfügbaren Workshop-Module unter modules/ inklusive verfügbarer Kategorien auf und markiert das aktive Modul.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
];

const LEGACY_ALIAS_TOOLS = [
  {
    name: "search_wildlife_vault",
    description:
      "Kompatibilitäts-Alias für search_vault: Durchsucht die Wissensbasis und liefert [[Wikilinks]] sowie Textauszüge.",
    inputSchema: SEARCH_INPUT_SCHEMA,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "verify_claim_against_corpus",
    description:
      "Kompatibilitäts-Alias für verify_claim: Prüft eine Aussage gegen alle lokalen Artikel im Korpus.",
    inputSchema: VERIFY_INPUT_SCHEMA,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: "read_vault_article",
    description:
      "Kompatibilitäts-Alias für read_article: Liest den vollständigen Markdown-Inhalt eines Artikels (oder '_index').",
    inputSchema: READ_INPUT_SCHEMA,
    annotations: READ_ONLY_ANNOTATIONS,
  },
];

const EXPOSED_TOOLS = CANONICAL_ONLY
  ? CANONICAL_TOOLS
  : [...CANONICAL_TOOLS, ...LEGACY_ALIAS_TOOLS];

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
            version: "1.3.0",
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
      writeMessage({ jsonrpc: "2.0", id, result: { tools: EXPOSED_TOOLS } });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        let data;
        if (toolName === "search_vault" || toolName === "search_wildlife_vault") {
          if (!args.query) throw new Error("Parameter 'query' fehlt.");
          data = searchVault(args.query, args.category, args.limit, args.module);
        } else if (toolName === "verify_claim" || toolName === "verify_claim_against_corpus") {
          if (!args.claim) throw new Error("Parameter 'claim' fehlt.");
          const ctx = getModuleContext(args.module);
          data = { module: ctx.id, ...verifyClaim(loadVaultArticles(ctx), args.claim) };
        } else if (toolName === "read_article" || toolName === "read_vault_article") {
          data = readVaultArticle(args.slug, args.module);
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
      } catch (toolErr) {
        writeMessage({
          jsonrpc: "2.0",
          id,
          result: {
            isError: true,
            content: [{ type: "text", text: `Fehler: ${toolErr.message || String(toolErr)}` }],
          },
        });
      }
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
      error: { code: -32603, message: `Interner Fehler: ${err.message || String(err)}` },
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
