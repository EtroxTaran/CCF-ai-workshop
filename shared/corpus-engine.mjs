/**
 * Pure ESM corpus search and claim verification engine (zero dependencies, zero node:* imports).
 * Shared source of truth for mcp-server/server.mjs and mirrored by workshop-ui/src/lib/offlineSearch.ts.
 */

export const STOPWORDS = new Set([
  "aber", "alle", "allem", "allen", "aller", "alles", "also", "auch", "auf", "aus",
  "bei", "beim", "beide", "beiden", "besitzen", "besitzt", "bestehen", "besteht",
  "bietet", "bieten", "bis", "bist", "bleiben", "bleibt", "bzw", "circa", "dabei",
  "dadurch", "dafuer", "dafür", "dagegen", "daher", "damit", "danach", "dann",
  "darauf", "daraus", "darin", "darum", "das", "dass", "dazu", "dein", "deine", "dem",
  "den", "denn", "der", "deren", "des", "dessen", "deshalb", "die", "dies", "diese",
  "diesem", "diesen", "dieser", "dieses", "doch", "dort", "durch", "ein", "eine", "einem",
  "einen", "einer", "eines", "einige", "einmal", "enthaelt", "enthalten", "erhoben",
  "erklaere", "etwa", "etwas", "euch", "euer", "eure", "findet", "finden", "fuer",
  "für", "ganz", "geben", "gegen", "genau", "gibt", "gilt", "gelten", "haben",
  "hat", "hatte", "hatten", "haengen", "heisst", "heissen", "heute", "hier",
  "hierdurch", "hinter", "hoch", "ihm", "ihn", "ihnen", "ihr", "ihre", "ihrem",
  "ihren", "ihrer", "immer", "indem", "infolge", "innen", "ins", "ist", "jaehrlich",
  "jaehrlichen", "jede", "jedem", "jeden", "jeder", "jedes", "jedoch", "jetzt",
  "kann", "kein", "keine", "keinem", "keinen", "keiner", "koennen", "können",
  "kommen", "kommt", "konnte", "kostet", "kosten", "korpus", "lassen", "laut",
  "leben", "lebt", "lebte", "lebten", "liegen", "liegt", "machen", "macht", "mehr",
  "mehrere", "mein", "meine", "mit", "muss", "muessen", "müssen", "nach", "nachdem",
  "neben", "nein", "nenne", "nennen", "nennt", "nicht", "nichts", "nimmt", "nehmen",
  "noch", "nun", "nur", "nutzen", "nutzt", "oder", "ohne", "pro", "pruefe", "pruefen",
  "rund", "sagen", "sagt", "sehr", "sein", "seine", "seinem", "seinen", "seiner",
  "seit", "selbst", "sich", "sie", "sind", "sobald", "sodass", "sofern", "solche",
  "solchen", "soll", "sollen", "sollte", "sondern", "sonst", "sowie", "spielen",
  "spielt", "stehen", "steht", "ueber", "über", "um", "und", "uns", "unser", "unsere",
  "unter", "vergleiche", "viel", "viele", "vielen", "vom", "von", "vor", "vorkommen",
  "vorkommt", "waehrend", "während", "wann", "war", "waren", "warum", "was", "wegen",
  "weil", "weit", "weiter", "welche", "welchem", "welchen", "welcher", "welches",
  "weniger", "wenn", "wer", "werden", "weshalb", "wie", "wieder", "wieso", "will",
  "wird", "wir", "wobei", "wofuer", "wofür", "woher", "wohin", "wurde", "wurden",
  "zaehlen", "zaehlt", "zeigen", "zeigt", "zudem", "zum", "zur", "zusammen", "zwar",
  "zwischen", "aktuell", "aktuelle", "aktuellen", "aktueller", "dokument",
  "dokumente", "dokumenten", "artikel", "artikeln", "datei", "dateien", "frage",
  "antwort", "stufe", "track", "beleg", "belegt", "quelle", "quellen",
]);

export function normalize(text) {
  return String(text || "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

export function stemDe(word) {
  if (word.length < 6) return word;
  return word.replace(/(?:ern|em|en|er|es|e|n|s|t)$/, "");
}

export function wordsMatch(word, tok) {
  if (word === tok) return true;
  if (tok.length >= 6 && word.length >= 6 && stemDe(word) === stemDe(tok)) return true;
  if (tok.length >= 5 && word.startsWith(tok) && word.length - tok.length <= 2) return true;
  if (word.length >= 5 && tok.startsWith(word) && tok.length - word.length <= 2) return true;
  return false;
}

export function matchesWordSet(wordSet, wordList, tok) {
  if (wordSet.has(tok)) return true;
  for (const w of wordList) {
    if (wordsMatch(w, tok)) return true;
  }
  return false;
}

export function tokenize(text) {
  const norm = normalize(text);
  const rawTokens = norm.match(/[a-z0-9]{3,}/g) || [];
  return [...new Set(rawTokens.filter((t) => !/^\d+$/.test(t) && !STOPWORDS.has(t)))];
}

export function parseFrontmatter(markdown) {
  const content = String(markdown || "");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const metaLines = match[1].split(/\r?\n/);
  const meta = {};
  let currentKey = null;
  for (const line of metaLines) {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const rawVal = kv[2].trim();
      const val = rawVal.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      if (rawVal === "") {
        meta[currentKey] = [];
      } else {
        meta[currentKey] = val;
      }
    } else if (currentKey && line.trim().startsWith("- ")) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      const itemVal = line.trim().slice(2).trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
      meta[currentKey].push(itemVal);
    }
  }
  return { meta, body: match[2] };
}

const DEFAULT_CATEGORY_DIRS = {
  lebensraum: "lebensraeume",
  tierart: "tierarten",
  konzept: "konzepte",
};

function categoryDir(category, categoryDirMap = DEFAULT_CATEGORY_DIRS) {
  if (categoryDirMap && Object.prototype.hasOwnProperty.call(categoryDirMap, category)) {
    return categoryDirMap[category];
  }
  return String(category || "artikel").toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "artikel";
}

function slugifyTitle(title) {
  return normalize(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "artikel";
}

function extractHeadingTitle(body) {
  const m = String(body || "").match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function extractWikilinks(text) {
  const matches = String(text || "").match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
  return [...new Set(matches.map((w) => w.slice(2, -2).split("|")[0].trim()).filter(Boolean))];
}

const articleIndexCache = new WeakMap();

function buildIndexedArticle(rawInput) {
  let artObj;
  if (typeof rawInput === "string") {
    const { meta, body } = parseFrontmatter(rawInput);
    const title = meta.title || extractHeadingTitle(body) || "Artikel";
    const slug = meta.slug || slugifyTitle(title);
    const category = meta.category || "konzept";
    artObj = {
      slug,
      title,
      category,
      habitat: meta.habitat || "",
      status: meta.status || "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      source_file: meta.source_file || `raw/${slug}.md`,
      rel_path: meta.rel_path || `wiki/${categoryDir(category)}/${slug}.md`,
      body,
    };
  } else if (
    rawInput &&
    typeof rawInput === "object" &&
    typeof rawInput.body !== "string" &&
    (typeof rawInput.markdown === "string" || typeof rawInput.raw === "string" || typeof rawInput.rawMarkdown === "string")
  ) {
    const md = rawInput.markdown ?? rawInput.rawMarkdown ?? rawInput.raw;
    const { meta, body } = parseFrontmatter(md);
    const title = rawInput.title || meta.title || extractHeadingTitle(body) || rawInput.slug || "Artikel";
    const slug = rawInput.slug || meta.slug || slugifyTitle(title);
    const category = rawInput.category || meta.category || "konzept";
    artObj = {
      ...rawInput,
      slug,
      title,
      category,
      habitat: rawInput.habitat ?? meta.habitat ?? "",
      status: rawInput.status ?? meta.status ?? "",
      tags: Array.isArray(rawInput.tags) ? rawInput.tags : (Array.isArray(meta.tags) ? meta.tags : []),
      source_file: rawInput.source_file || meta.source_file || `raw/${slug}.md`,
      rel_path: rawInput.rel_path || meta.rel_path || `wiki/${categoryDir(category)}/${slug}.md`,
      body,
    };
  } else {
    const src = rawInput && typeof rawInput === "object" ? rawInput : {};
    const title = src.title || extractHeadingTitle(src.body || "") || src.slug || "Artikel";
    const slug = src.slug || slugifyTitle(title);
    const category = src.category || "konzept";
    artObj = {
      ...src,
      slug,
      title,
      category,
      habitat: src.habitat || "",
      status: src.status || "",
      tags: Array.isArray(src.tags) ? src.tags : [],
      source_file: src.source_file || `raw/${slug}.md`,
      rel_path: src.rel_path || `wiki/${categoryDir(category)}/${slug}.md`,
      body: typeof src.body === "string" ? src.body : "",
    };
  }

  const keyPoints = Array.isArray(artObj.key_points) ? artObj.key_points : [];
  const searchableBody = [artObj.summary, ...keyPoints, artObj.body].filter(Boolean).join("\n");
  const snippetBody = artObj.body || [artObj.summary, ...keyPoints].filter(Boolean).join("\n");
  const wikilinks = Array.isArray(artObj.wikilinks)
    ? artObj.wikilinks
    : Array.isArray(artObj.related)
      ? artObj.related
      : extractWikilinks(searchableBody);

  const normTitle = normalize(artObj.title);
  const normBody = normalize(searchableBody);
  const titleWords = [...new Set([...(normTitle.match(/[a-z0-9]{2,}/g) || []), ...artObj.slug.split("-").filter(Boolean)])];
  const bodyWords = [...new Set(normBody.match(/[a-z0-9]{2,}/g) || [])];
  const tagWords = [...new Set(artObj.tags.flatMap((t) => normalize(t).match(/[a-z0-9]{2,}/g) || []))];

  return {
    slug: artObj.slug,
    title: artObj.title,
    category: artObj.category,
    habitat: artObj.habitat,
    group: artObj.group || artObj.habitat || "",
    status: artObj.status,
    tags: artObj.tags,
    source_file: artObj.source_file,
    rel_path: artObj.rel_path,
    summary: artObj.summary || "",
    wikilinks,
    body: searchableBody,
    snippetBody,
    normTitle,
    titleWords,
    titleWordSet: new Set(titleWords),
    bodyWords,
    bodyWordSet: new Set(bodyWords),
    tagWords,
    tagWordSet: new Set(tagWords),
  };
}

function prepareArticle(input) {
  if (input && typeof input === "object") {
    let cached = articleIndexCache.get(input);
    if (!cached) {
      cached = buildIndexedArticle(input);
      articleIndexCache.set(input, cached);
    }
    return cached;
  }
  return buildIndexedArticle(input);
}

export function extractSnippet(body, queryTokens = [], maxLen = 280) {
  const tokens = Array.isArray(queryTokens) ? queryTokens : [];
  const limitLen = Number.isFinite(maxLen) && maxLen > 20 ? Math.floor(maxLen) : 280;
  const lines = String(body || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !l.startsWith("#") &&
        !l.startsWith("---") &&
        !l.startsWith("> **Kategorie") &&
        !l.startsWith("*(Hinweis:") &&
        !l.startsWith("Quelle:")
    );

  let bestLine = lines[0] || "";
  let bestScore = -1;
  let firstMatchIdx = -1;

  for (const line of lines) {
    const nl = normalize(line);
    const lineWords = nl.match(/[a-z0-9]{2,}/g) || [];
    let score = 0;
    let earliest = Infinity;
    for (const tok of tokens) {
      if (lineWords.some((w) => wordsMatch(w, tok))) {
        score += tok.length;
        const pos = nl.indexOf(tok.slice(0, Math.min(5, tok.length)));
        if (pos >= 0 && pos < earliest) earliest = pos;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestLine = line;
      firstMatchIdx = earliest === Infinity ? -1 : earliest;
    }
  }

  if (bestLine.length <= limitLen) return bestLine;
  const anchor = firstMatchIdx >= 0 ? firstMatchIdx : 0;
  const lead = Math.floor(limitLen * 0.27);
  const windowSize = limitLen - 5;
  let start = Math.max(0, anchor - lead);
  if (start > 0) {
    const nextSpace = bestLine.indexOf(" ", start);
    if (nextSpace > 0 && nextSpace < anchor) start = nextSpace + 1;
  }
  let end = Math.min(bestLine.length, start + windowSize);
  if (end < bestLine.length) {
    const prevSpace = bestLine.lastIndexOf(" ", end);
    if (prevSpace > start + Math.floor(limitLen * 0.5)) end = prevSpace;
  }
  return `${start > 0 ? "…" : ""}${bestLine.slice(start, end)}${end < bestLine.length ? "…" : ""}`;
}

function scoreCorpus(articles, query, options = {}) {
  const preparedAll = Array.isArray(articles) ? articles.map(prepareArticle) : [];
  const category = typeof options.category === "string" ? options.category.trim() : "";
  const filtered = category
    ? preparedAll.filter(
        (a) =>
          a.category === category ||
          normalize(a.habitat) === normalize(category) ||
          normalize(a.group) === normalize(category)
      )
    : preparedAll;

  const tokens = tokenize(query);
  const normQuery = normalize(query).trim();
  if (!tokens.length && !normQuery) return [];

  const total = filtered.length || 1;
  const docFreq = new Map();
  for (const tok of tokens) {
    let df = 0;
    for (const art of filtered) {
      if (
        matchesWordSet(art.titleWordSet, art.titleWords, tok) ||
        matchesWordSet(art.bodyWordSet, art.bodyWords, tok)
      ) {
        df += 1;
      }
    }
    docFreq.set(tok, df);
  }

  const scored = [];
  for (const art of filtered) {
    let score = 0;
    let hasTitleHit = false;
    const matchedTokens = [];

    if (normQuery && art.normTitle === normQuery) {
      score += 36;
      hasTitleHit = true;
    }

    for (const tok of tokens) {
      let hit = false;
      if (matchesWordSet(art.titleWordSet, art.titleWords, tok)) {
        score += 16;
        hasTitleHit = true;
        hit = true;
      }
      if (matchesWordSet(art.bodyWordSet, art.bodyWords, tok)) {
        const df = docFreq.get(tok) || 1;
        score += Math.round(4 + Math.log((total + 1) / (df + 1)) * 2);
        hit = true;
      }
      if (matchesWordSet(art.tagWordSet, art.tagWords, tok)) {
        score += 5;
        hit = true;
      }
      if (hit) matchedTokens.push(tok);
    }

    const minTokensOk = tokens.length <= 1 || hasTitleHit || matchedTokens.length >= 2;
    if (score > 0 && minTokensOk) {
      const snippet = extractSnippet(
        art.snippetBody,
        matchedTokens.length ? matchedTokens : tokens
      );
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
        hasTitleHit,
        score,
        snippet: snippet || art.summary,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function searchCorpus(articles, query, limitOrOptions = 5) {
  const isOpts = limitOrOptions && typeof limitOrOptions === "object";
  const rawLimit = isOpts ? limitOrOptions.limit : limitOrOptions;
  const limit = Math.min(Math.max(Number(rawLimit) || 5, 1), 15);
  const options = isOpts ? limitOrOptions : {};

  return scoreCorpus(articles, query, options)
    .slice(0, limit)
    .map(({ hasTitleHit: _ignored, ...rest }) => rest);
}

export function verifyClaim(articles, claim) {
  const prepared = Array.isArray(articles) ? articles.map(prepareArticle) : [];
  const tokens = tokenize(claim);
  const scored = scoreCorpus(articles, claim);

  if (!tokens.length || !scored.length) {
    return {
      claim,
      status: "nicht_belegt",
      confidence_label:
        "Keine Treffer in der Wissensbasis gefunden (mögliche Fangfrage oder fehlende Quelle).",
      matched_token_ratio: 0,
      evidence: [],
    };
  }

  const covered = new Set();
  for (const m of scored.slice(0, 3)) {
    for (const t of m.matched_tokens) covered.add(t);
  }
  const ratio = covered.size / tokens.length;
  const specificTokens = tokens.filter((t) => t.length >= 6);
  const missingSpecific = specificTokens.filter((t) => !covered.has(t));
  const missingSpecificRatio = specificTokens.length
    ? missingSpecific.length / specificTokens.length
    : 0;
  const missingInCorpus = tokens.filter(
    (tok) =>
      !prepared.some(
        (art) =>
          matchesWordSet(art.titleWordSet, art.titleWords, tok) ||
          matchesWordSet(art.bodyWordSet, art.bodyWords, tok) ||
          matchesWordSet(art.tagWordSet, art.tagWords, tok)
      )
  );
  const top = scored[0];
  const topRatio = top.matched_tokens.length / tokens.length;

  let status = "nicht_belegt";
  let confidence_label =
    "Keine ausreichenden Belege in der Wissensbasis gefunden – mögliche Fangfrage!";

  if (
    missingInCorpus.length === 0 &&
    ratio >= 0.55 &&
    top.score >= 14 &&
    (top.hasTitleHit || topRatio >= 0.35) &&
    (topRatio >= 0.55 || ratio >= 0.8) &&
    missingSpecificRatio <= 0.45
  ) {
    status = "belegt";
    confidence_label =
      "Starke Abdeckung in den lokalen Artikeln – Belege verfügbar.";
  } else if (
    ratio >= 0.4 &&
    (top.hasTitleHit || top.matched_tokens.length >= 2) &&
    missingSpecificRatio <= 0.45
  ) {
    status = "teilweise";
    confidence_label =
      missingInCorpus.length > 0
        ? `Begriffe nicht in der Wissensbasis gefunden (${missingInCorpus.join(", ")}) — mögliche Fangfrage!`
        : "Teilweise Themenbezug gefunden — Detailabgleich empfohlen.";
  }

  const rawEvidence =
    status === "nicht_belegt"
      ? top.hasTitleHit
        ? scored.slice(0, 2)
        : []
      : scored.slice(0, 3);

  const evidence = rawEvidence
    .filter((m, i) => i === 0 || m.hasTitleHit || (top && m.score >= top.score * 0.45))
    .map(({ hasTitleHit: _ignored, ...rest }) => rest);

  return {
    claim,
    status,
    confidence_label,
    matched_token_ratio: Number(ratio.toFixed(2)),
    evidence,
  };
}
