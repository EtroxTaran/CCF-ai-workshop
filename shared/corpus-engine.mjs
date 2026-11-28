/**
 * Pure ESM corpus search and claim verification engine (zero dependencies, zero node:* imports).
 * Shared source of truth for mcp-server/server.mjs, build/validation scripts, and workshop-ui/src/lib/offlineSearch.ts.
 */

export const STOPWORDS = new Set([
  // German stopwords
  "aber", "alle", "allem", "allen", "aller", "alles", "also", "auch", "auf", "aus",
  "ausgeloest", "ausloesen", "ausloest",
  "bei", "beim", "beide", "beiden", "beschrieben", "besitzen", "besitzt", "bestehen", "besteht", "betraegt", "beträgt", "betragen",
  "bietet", "bieten", "bis", "bist", "bleiben", "bleibt", "bzw", "circa", "dabei",
  "dadurch", "dafuer", "dafür", "dagegen", "daher", "damit", "danach", "dann",
  "darauf", "daraus", "darin", "darum", "das", "dass", "dazu", "dauert", "dauern", "dauerte", "dein", "deine", "dem",
  "den", "denn", "der", "deren", "des", "dessen", "deshalb", "die", "dies", "diese",
  "diesem", "diesen", "dieser", "dieses", "doch", "dort", "durch", "ein", "eine", "einem",
  "einen", "einer", "eines", "einige", "einmal", "enthaelt", "enthalten", "erfolgt", "erforderlich", "erhoben",
  "erklaere", "etwa", "etwas", "euch", "euer", "eure", "findet", "finden", "fuer",
  "für", "ganz", "geben", "gegen", "genannt", "genau", "genutzt", "gestartet", "gibt", "gilt", "gelten", "haben",
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
  "spielt", "startet", "stehen", "steht", "ueber", "über", "um", "und", "uns", "unser", "unsere",
  "unter", "vereinbart", "vergleiche", "verwendet", "viel", "viele", "vielen", "vom", "von", "vor", "vorkommen",
  "vorkommt", "waehrend", "während", "wann", "war", "waren", "warum", "was", "wegen",
  "weil", "weit", "weiter", "welche", "welchem", "welchen", "welcher", "welches",
  "weniger", "wenn", "wer", "werden", "weshalb", "wie", "wieder", "wieso", "will",
  "wird", "wir", "wobei", "wofuer", "wofür", "woher", "wohin", "wurde", "wurden",
  "zaehlen", "zaehlt", "zeigen", "zeigt", "zudem", "zum", "zur", "zusammen", "zwar",
  "zwischen", "aktuell", "aktuelle", "aktuellen", "aktueller", "dokument",
  "dokumente", "dokumenten", "artikel", "artikeln", "datei", "dateien", "frage",
  "antwort", "stufe", "track", "beleg", "belegt", "quelle", "quellen",
  // English stopwords
  "about", "above", "across", "after", "again", "against", "all", "almost", "alone",
  "along", "already", "also", "although", "always", "among", "and", "another", "any",
  "anyone", "anything", "approx", "are", "around", "because", "been", "before", "being",
  "below", "between", "both", "but", "can", "cannot", "could", "did", "does", "doing",
  "done", "down", "during", "each", "either", "else", "enough", "etc", "even", "ever",
  "every", "few", "for", "from", "further", "get", "gets", "got", "had", "has", "have",
  "having", "her", "here", "hers", "herself", "him", "himself", "his", "how", "however",
  "into", "its", "itself", "just", "keep", "keeps", "known", "knows", "less", "like",
  "made", "make", "makes", "many", "may", "might", "more", "most", "much", "must",
  "need", "needs", "neither", "never", "new", "none", "nor", "not", "now", "off",
  "often", "once", "one", "only", "other", "others", "our", "ours", "out", "over",
  "own", "part", "per", "perhaps", "put", "quite", "rather", "really", "same", "say",
  "says", "seem", "seems", "several", "shall", "she", "should", "show", "shows",
  "since", "some", "someone", "something", "source", "sources", "such", "take", "takes",
  "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there",
  "these", "they", "this", "those", "though", "through", "thus", "too", "under",
  "until", "upon", "use", "used", "uses", "using", "very", "want", "was", "way",
  "were", "what", "whatever", "when", "where", "whereas", "whether", "which", "while",
  "who", "whom", "whose", "why", "will", "with", "within", "without", "would", "you",
  "your", "yours",
]);

export function stripMarkdownAndCitations(text) {
  return String(text || "")
    // Remove URLs before citation stripping
    .replace(/https?:\/\/[^\s)>\]]+/gi, " ")
    // Remove parenthesized citations containing .md filenames: (eisbaer.md), (wiki/tierarten/eisbaer.md), (Quelle: ...)
    .replace(/\([^)\n]*\.md[^)\n]*\)/gi, " ")
    // Remove single-bracketed .md citations: [eisbaer.md]
    .replace(/\[[^\]\n]*\.md[^\]\n]*\]/gi, " ")
    // Remove explicit Quelle:/Source: .md lists
    .replace(/\b(?:quellen?|sources?)\s*:\s*(?:[a-z0-9_/-]+\.md)(?:\s*[,;]\s*(?:[a-z0-9_/-]+\.md))*/gi, " ")
    // Remove path-prefixed .md paths like wiki/tierarten/eisbaer.md or corpus/runbook-zahlungslauf.md
    .replace(/(?<![:/a-z0-9_-])(?:[a-z0-9_-]+\/)+[a-z0-9_-]+\.md\b/gi, " ")
    // Remove bare .md filenames like eisbaer.md
    .replace(/\b[a-z0-9_-]+\.md\b/gi, " ")
    // Unwrap wikilinks with alias [[slug#anchor|alias]] -> alias; strip bare [[slug]] / [[slug#anchor]]
    .replace(/\[\[[^\]|\n#]+(?:#[^\]|\n]*)?\|([^\]\n]+)\]\]/g, " $1 ")
    .replace(/\[\[[^\]\n]+\]\]/g, " ")
    // Unwrap markdown links [label](url) -> label
    .replace(/\[([^\]\n]+)\]\([^)\n]+\)/g, " $1 ")
    // Strip inline code backticks & emphasis markers without inserting spaces (preserves "`2` h" -> "2 h", "**42**" -> "42")
    .replace(/`+/g, "")
    .replace(/\*{1,3}|__|~~/g, "")
    // Strip leading markdown headings / blockquotes / list bullets
    .replace(/^[ \t]{0,3}(?:#{1,6}\s+|>\s?|[-*+]\s+)/gm, "")
    // Collapse horizontal whitespace while keeping line breaks
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

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
  const cleanScalar = (raw) => {
    const trimmed = String(raw || "").trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
      return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  };
  for (const line of metaLines) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const rawVal = kv[2].trim();
      if (rawVal === "") {
        meta[currentKey] = [];
      } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
        const inner = rawVal.slice(1, -1).trim();
        meta[currentKey] = inner
          ? inner
              .split(",")
              .map((part) => cleanScalar(part))
              .filter(Boolean)
          : [];
      } else {
        meta[currentKey] = cleanScalar(rawVal);
      }
    } else if (currentKey && line.trim().startsWith("- ")) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      const itemVal = cleanScalar(line.trim().slice(2));
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

  const unitDims = new Set();
  for (const w of [...titleWords, ...bodyWords]) {
    const d = UNIT_TOKEN_DIMENSION.get(w);
    if (d) unitDims.add(d);
  }
  const articleFacts = extractNumberFacts(`${artObj.title}\n${searchableBody}`);
  for (const f of articleFacts) {
    if (f.dimension) unitDims.add(f.dimension);
    if (Number.isFinite(f.canonicalValue)) {
      if (Math.abs(f.canonicalValue) >= 1e9) unitDims.add("scale:billion");
      else if (Math.abs(f.canonicalValue) >= 1e6) unitDims.add("scale:million");
    }
  }

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
    unitDims,
    articleFacts,
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

    let hasNonUnitHit = false;
    const unitMatchedTokens = [];
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
      if (hit) {
        matchedTokens.push(tok);
        if (!UNIT_TOKEN_DIMENSION.has(tok)) hasNonUnitHit = true;
      } else {
        const unitDim = UNIT_TOKEN_DIMENSION.get(tok);
        if (unitDim && art.unitDims?.has(unitDim)) {
          unitMatchedTokens.push(tok);
        }
      }
    }

    if (unitMatchedTokens.length > 0 && (hasNonUnitHit || tokens.every((t) => UNIT_TOKEN_DIMENSION.has(t)))) {
      for (const tok of unitMatchedTokens) {
        score += 4;
        matchedTokens.push(tok);
      }
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
        group: art.group,
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

const NEGATION_MARKERS = new Set([
  // German negation markers
  "kein", "keine", "keinen", "keiner", "keinem", "keines",
  "nicht", "ohne", "fehlt", "fehlen", "fehlte", "fehlten", "niemals", "nie",
  "verbietet", "verboten", "untersagt", "ausgeschlossen", "frei",
  // English negation markers
  "no", "not", "never", "without", "lack", "lacks", "lacking",
  "absent", "absence", "cannot", "can't", "cant", "don't", "doesn't",
  "didn't", "isn't", "aren't", "wasn't", "weren't", "won't",
  "wouldn't", "couldn't", "shouldn't", "hasn't", "haven't",
  "neither", "nor", "none", "forbidden", "prohibited", "excluded",
  "missing", "unable",
]);

const NUMBER_WORD_MAP = {
  null: "0",
  zero: "0",
  eins: "1",
  zwei: "2",
  two: "2",
  drei: "3",
  three: "3",
  vier: "4",
  four: "4",
  fuenf: "5",
  five: "5",
  sechs: "6",
  six: "6",
  sieben: "7",
  seven: "7",
  acht: "8",
  eight: "8",
  neun: "9",
  nine: "9",
  zehn: "10",
  ten: "10",
  elf: "11",
  eleven: "11",
  zwoelf: "12",
  twelve: "12",
  dreizehn: "13",
  thirteen: "13",
  vierzehn: "14",
  fourteen: "14",
  fuenfzehn: "15",
  fifteen: "15",
  sechzehn: "16",
  sixteen: "16",
  siebzehn: "17",
  seventeen: "17",
  achtzehn: "18",
  eighteen: "18",
  neunzehn: "19",
  nineteen: "19",
  zwanzig: "20",
  twenty: "20",
  dreissig: "30",
  thirty: "30",
  vierzig: "40",
  forty: "40",
  fuenfzig: "50",
  fifty: "50",
  sechzig: "60",
  sixty: "60",
  siebzig: "70",
  seventy: "70",
  achtzig: "80",
  eighty: "80",
  neunzig: "90",
  ninety: "90",
  hundert: "100",
  hundred: "100",
};

const NUMBER_WORD_RX = new RegExp(
  `\\b(${Object.keys(NUMBER_WORD_MAP).join("|")})\\b`,
  "g"
);

function replaceNumberWords(normText) {
  return String(normText || "")
    .replace(
      /\bone(?=\s+(?:hour|hours|hr|hrs|minute|minutes|min|week|weeks|day|days|month|months|year|years|tooth|teeth|percent)\b)/g,
      "1"
    )
    .replace(NUMBER_WORD_RX, (w) => NUMBER_WORD_MAP[w] ?? w);
}

function normalizeNumberToken(raw) {
  return String(raw || "")
    .replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2")
    .replace(",", ".");
}

const UNIT_DIMENSION_GROUPS = {
  duration: [
    "h", "hr", "hrs", "hour", "hours", "std", "stunde", "stunden",
    "stuendig", "stuendige", "stuendigen", "stuendiger",
    "min", "minute", "minuten", "minutes",
    "minuetig", "minuetige", "minuetigen", "minuetiger",
    "tag", "tage", "tagen", "day", "days",
    "taegig", "taegige", "taegigen", "taegiger",
    "woche", "wochen", "week", "weeks",
  ],
  percent: ["prozent", "percent", "pct"],
  celsius: ["celsius", "grad", "gradc", "gradcelsius"],
  eur: ["euro", "euros", "eur"],
  usd: ["dollar", "dollars", "usd"],
  km: ["km", "kilometer", "kilometern", "kilometers"],
  cm: ["cm", "zentimeter", "zentimetern", "centimeter", "centimeters"],
  meters: ["meter", "metern", "meters"],
  kg: ["kg", "kilogramm", "kilogram", "kilograms"],
  months: ["monat", "monate", "monaten", "month", "months"],
  years: ["jahr", "jahre", "jahren", "year", "years"],
  clock: ["uhr"],
  "count:teeth": ["zaehne", "zahn", "teeth", "tooth"],
  "scale:million": ["mio", "million", "millions", "millionen"],
  "scale:billion": ["mrd", "milliarde", "milliarden", "billion", "billions", "billionen"],
};

const TEMPORAL_DIMENSIONS = new Set(["duration", "months", "years"]);

const UNIT_TOKEN_DIMENSION = new Map();
for (const [dim, toks] of Object.entries(UNIT_DIMENSION_GROUPS)) {
  for (const tok of toks) {
    UNIT_TOKEN_DIMENSION.set(tok, dim);
  }
}

function classifyUnit(rawUnit) {
  const u = String(rawUnit || "").replace(/\s+/g, "").replace(/\.$/, "").toLowerCase();
  if (!u) return { dimension: null, multiplier: 1, canonicalUnitTokens: [] };
  if (
    u === "h" ||
    u === "hr" ||
    u === "hrs" ||
    u === "hour" ||
    u === "hours" ||
    u === "std" ||
    u === "stunde" ||
    u === "stunden" ||
    /^stuendig(?:e[nr]?)?$/.test(u)
  ) {
    return { dimension: "duration", multiplier: 60, canonicalUnitTokens: ["stunden", "minuten"] };
  }
  if (
    u === "m" ||
    u === "min" ||
    u === "minute" ||
    u === "minuten" ||
    u === "minutes" ||
    /^minuetig(?:e[nr]?)?$/.test(u)
  ) {
    return { dimension: "duration", multiplier: 1, canonicalUnitTokens: ["minuten", "stunden"] };
  }
  if (
    u === "tag" ||
    u === "tage" ||
    u === "tagen" ||
    u === "day" ||
    u === "days" ||
    /^taegig(?:e[nr]?)?$/.test(u)
  ) {
    return { dimension: "duration", multiplier: 1440, canonicalUnitTokens: ["tage"] };
  }
  if (u === "woche" || u === "wochen" || u === "week" || u === "weeks") {
    return { dimension: "duration", multiplier: 10080, canonicalUnitTokens: ["wochen"] };
  }
  if (u === "%" || u === "prozent" || u === "percent" || u === "pct") {
    return { dimension: "percent", multiplier: 1, canonicalUnitTokens: ["prozent"] };
  }
  if (u === "°c" || u === "°celsius" || u === "gradc" || u === "gradcelsius" || u === "grad" || u === "celsius") {
    return { dimension: "celsius", multiplier: 1, canonicalUnitTokens: ["celsius"] };
  }
  if (u === "€" || u === "euro" || u === "euros" || u === "eur") {
    return { dimension: "eur", multiplier: 1, canonicalUnitTokens: ["euro"] };
  }
  if (u === "dollar" || u === "dollars" || u === "usd") {
    return { dimension: "usd", multiplier: 1, canonicalUnitTokens: ["dollar"] };
  }
  if (u === "km" || u === "kilometer" || u === "kilometern" || u === "kilometers") {
    return { dimension: "km", multiplier: 1, canonicalUnitTokens: ["kilometer"] };
  }
  if (u === "cm" || u === "zentimeter" || u === "zentimetern" || u === "centimeter" || u === "centimeters") {
    return { dimension: "cm", multiplier: 1, canonicalUnitTokens: ["zentimeter"] };
  }
  if (u === "meter" || u === "metern" || u === "meters") {
    return { dimension: "meters", multiplier: 1, canonicalUnitTokens: ["meter"] };
  }
  if (u === "kg" || u === "kilogramm" || u === "kilogram" || u === "kilograms") {
    return { dimension: "kg", multiplier: 1, canonicalUnitTokens: ["kilogramm"] };
  }
  if (u === "monat" || u === "monate" || u === "monaten" || u === "month" || u === "months") {
    return { dimension: "months", multiplier: 1, canonicalUnitTokens: ["monate"] };
  }
  if (u === "jahr" || u === "jahre" || u === "jahren" || u === "year" || u === "years") {
    return { dimension: "years", multiplier: 1, canonicalUnitTokens: ["jahre"] };
  }
  if (u === "zaehne" || u === "zahn" || u === "teeth" || u === "tooth") {
    return { dimension: "count:teeth", multiplier: 1, canonicalUnitTokens: ["zaehne"] };
  }
  return { dimension: null, multiplier: 1, canonicalUnitTokens: [] };
}

function extractNumberFacts(text) {
  const norm = replaceNumberWords(normalize(stripMarkdownAndCitations(text)));
  const facts = [];
  const chars = [...norm];
  const maskSpan = (start, len) => {
    for (let i = start; i < start + len && i < chars.length; i++) {
      chars[i] = " ";
    }
  };

  // 1a. Clock times with colon: 22:00, 22:00 Uhr, 02:00, 10:30 pm
  const clockColonRx = /(?<![a-z0-9-:])(\d{1,2}):(\d{2})(?:\s*(uhr|h|am|pm))?\b/g;
  let cm;
  while ((cm = clockColonRx.exec(norm)) !== null) {
    let hh = Number.parseInt(cm[1], 10);
    const mm = Number.parseInt(cm[2], 10);
    const meridiem = (cm[3] || "").toLowerCase();
    if (hh <= 23 && mm <= 59) {
      if (meridiem === "pm" && hh < 12) hh += 12;
      if (meridiem === "am" && hh === 12) hh = 0;
      const hhStr = String(hh).padStart(2, "0");
      const mmStr = String(mm).padStart(2, "0");
      const after = norm.slice(cm.index, Math.min(norm.length, cm.index + cm[0].length + 24));
      const afterTokens = (after.match(/[a-z]{3,}/g) || []).filter((t) => !STOPWORDS.has(t));
      facts.push({
        raw: `${cm[1]}:${cm[2]}`,
        num: `clock:${hhStr}:${mmStr}`,
        dimension: "clock",
        canonicalValue: hh * 60 + mm,
        unitTokens: [...new Set(["uhr", ...afterTokens])],
      });
      maskSpan(cm.index, cm[0].length);
    }
  }

  // 1b. Clock times without colon: "22 Uhr", "2 Uhr"
  const afterColonMask = chars.join("");
  const clockUhrRx = /(?<![a-z0-9-:])(\d{1,2})\s+uhr\b/g;
  while ((cm = clockUhrRx.exec(afterColonMask)) !== null) {
    const hh = Number.parseInt(cm[1], 10);
    if (hh <= 23) {
      const hhStr = String(hh).padStart(2, "0");
      const after = afterColonMask.slice(
        cm.index,
        Math.min(afterColonMask.length, cm.index + cm[0].length + 24)
      );
      const afterTokens = (after.match(/[a-z]{3,}/g) || []).filter((t) => !STOPWORDS.has(t));
      facts.push({
        raw: cm[0].trim(),
        num: `clock:${hhStr}:00`,
        dimension: "clock",
        canonicalValue: hh * 60,
        unitTokens: [...new Set(["uhr", ...afterTokens])],
      });
      maskSpan(cm.index, cm[0].length);
    }
  }

  // 2. General numbers + optional scale + unit + trailing context tokens
  const remaining = chars.join("");
  const rx =
    /(?<![a-z]-)(?<![a-z0-9])((?:(?<!\d)-)?\d+(?:[.,]\d+)?)(?:\s*(mio\.?|millions?|millionen?|mrd\.?|milliarden?|billions?|billionen?))?(?:[\s-]*((?:°\s*celsius|°\s*c|grad\s*celsius|grad\s*c|grad|celsius|prozent|percent|pct|stunden?|stuendig(?:e[nr]?)?|std\.?|hours?|hrs?|hr|h|minuten?|minuetig(?:e[nr]?)?|minutes?|min\.?|wochen?|weeks?|tage?n?|taegig(?:e[nr]?)?|days?|monate?n?|months?|jahre?n?|years?|zaehne|zahn|teeth|tooth|events?|euros?|eur|dollars?|usd|kilometern?|kilometers?|km|centimeters?|zentimetern?|zentimeter|cm|meters?|metern?|kilogramm|kilograms?|kg)(?![a-z])|%|€)|(?<=\d)(m)(?![a-z])|[\s-]+(m)(?![a-z]))?(?:[\s-]+([a-z]{3,}))?/g;
  const generalFacts = [];
  let m;
  while ((m = rx.exec(remaining)) !== null) {
    const num = normalizeNumberToken(m[1]);
    const baseVal = Number.parseFloat(num);
    const scaleRaw = (m[2] || "").replace(/\.$/, "").toLowerCase();
    const hasScale = Boolean(scaleRaw);
    let scale = 1;
    if (scaleRaw.startsWith("mio") || scaleRaw.startsWith("million")) scale = 1e6;
    else if (scaleRaw.startsWith("mrd") || scaleRaw.startsWith("milliarde") || scaleRaw.startsWith("billion")) {
      scale = 1e9;
    }

    let unitMeta;
    if (m[4]) {
      unitMeta = { dimension: "duration", multiplier: 1, canonicalUnitTokens: ["minuten", "stunden"] };
    } else if (m[5]) {
      unitMeta = { dimension: "meters", multiplier: 1, canonicalUnitTokens: ["meter"] };
    } else {
      unitMeta = classifyUnit(m[3] || "");
    }
    const { dimension, multiplier, canonicalUnitTokens } = unitMeta;
    const canonicalValue = Number.isFinite(baseVal) ? baseVal * scale * multiplier : Number.NaN;

    const after = remaining.slice(m.index, Math.min(remaining.length, m.index + m[0].length + 24));
    const rawAfterTokens = (after.match(/[a-z]{3,}/g) || []).filter((t) => !STOPWORDS.has(t));
    const unitTokens = [...new Set([...canonicalUnitTokens, ...rawAfterTokens])];

    const numScalePrefix = m[0].match(
      /^(-?\d+(?:[.,]\d+)?)(?:\s*(?:mio\.?|millions?|millionen?|mrd\.?|milliarden?|billions?|billionen?))?/i
    );
    const anchorEndIdx = m.index + (numScalePrefix ? numScalePrefix[0].length : m[1].length);

    let hasNonUnitLabel = false;
    if (!dimension) {
      const postNumSlice = remaining.slice(anchorEndIdx, Math.min(remaining.length, anchorEndIdx + 24));
      const sameClausePost = postNumSlice.split(/[.!?,;:\r\n]/)[0] || "";
      const prePrepPost =
        sameClausePost.split(
          /\b(?:bei|beim|in|im|am|an|auf|aus|unter|vom|von|zu|zum|zur|with|from|on|at|among|bis|to|und|and|oder|or)\b/
        )[0] || "";
      const postClauseWords = prePrepPost.match(/[a-z]{3,}/g) || [];
      hasNonUnitLabel = postClauseWords.some(
        (t) =>
          !STOPWORDS.has(t) &&
          !UNIT_TOKEN_DIMENSION.has(t) &&
          !/^(?:bis|to|und|and|oder|or|pro|per|je|von|aus|mit|bei|in|am|an|auf|ab|ca)$/.test(t)
      );
    }

    generalFacts.push({
      raw: m[1],
      num,
      dimension,
      canonicalValue,
      unitTokens,
      _hasNonUnitLabel: hasNonUnitLabel,
      _startIdx: m.index,
      _anchorEndIdx: anchorEndIdx,
      _baseVal: baseVal,
      _scale: scale,
      _hasScale: hasScale,
      _multiplier: multiplier,
      _canonicalUnitTokens: canonicalUnitTokens,
    });
  }

  // Propagate trailing unit/dimension (and scale if absent) backward across numeric range connectors
  for (let i = generalFacts.length - 1; i >= 1; i--) {
    const curr = generalFacts[i];
    const prev = generalFacts[i - 1];
    if (prev.dimension !== null || !curr.dimension || curr.dimension === "clock") continue;
    const between = remaining.slice(prev._anchorEndIdx, curr._startIdx);
    if (/^\s*(?:bis|to|und|and|[-–])\s*$/i.test(between)) {
      const effectiveScale = prev._hasScale ? prev._scale : curr._scale;
      prev.dimension = curr.dimension;
      prev._hasNonUnitLabel = false;
      prev._scale = effectiveScale;
      prev._multiplier = curr._multiplier;
      prev._canonicalUnitTokens = curr._canonicalUnitTokens;
      prev.canonicalValue = Number.isFinite(prev._baseVal)
        ? prev._baseVal * effectiveScale * curr._multiplier
        : Number.NaN;
      prev.unitTokens = [...new Set([...curr._canonicalUnitTokens, ...prev.unitTokens])];
    }
  }

  for (const gf of generalFacts) {
    facts.push({
      raw: gf.raw,
      num: gf.num,
      dimension: gf.dimension,
      canonicalValue: gf.canonicalValue,
      unitTokens: gf.unitTokens,
      hasNonUnitLabel: Boolean(gf._hasNonUnitLabel && !gf.dimension),
    });
  }
  return facts;
}

const ABBREV_DOT_RX =
  /\b(ca|bzw|std|approx|etc|dr|prof|nr|abs|art|vgl|ggf|max|min|inkl|exkl|sog|vs|mio|mrd|tsd|tel|fig|tab|kap|usw|evtl|mind)\.(?=\s)/gi;
const SPACED_ABBREV_RX = /\b([zdusvoei])\.(\s*)([bhaeoügem])\./gi;
const ORDINAL_MONTH_RX =
  /\b(\d{1,2})\.(?=\s+(?:januar|februar|m[aä]rz|april|mai|juni|juli|august|september|oktober|november|dezember|january|february|march|may|june|july|october|december|lebensjahr|jahrhundert)\b)/gi;

function splitSentences(text) {
  const SENTINEL = "\u0000";
  const protectedText = String(text || "")
    .replace(SPACED_ABBREV_RX, (_, a, sp, b) => `${a}${SENTINEL}${sp}${b}${SENTINEL}`)
    .replace(ABBREV_DOT_RX, (_, abbr) => `${abbr}${SENTINEL}`)
    .replace(ORDINAL_MONTH_RX, (_, d) => `${d}${SENTINEL}`);

  return protectedText
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((s) => s.replace(/\u0000/g, ".").trim())
    .filter(Boolean);
}

function isPositiveCountWord(w) {
  if (!w) return false;
  if (/^\d+$/.test(w)) return Number.parseInt(w, 10) > 0;
  return (
    Object.prototype.hasOwnProperty.call(NUMBER_WORD_MAP, w) &&
    NUMBER_WORD_MAP[w] !== "0"
  );
}

function hasNegationInClause(normSentence, term) {
  const clauses = String(normSentence || "").split(/[,;:]+/);
  for (const clause of clauses) {
    const words = clause.match(/[a-z0-9']+/g) || [];
    for (let i = 0; i < words.length; i++) {
      if (wordsMatch(words[i], term)) {
        const start = Math.max(0, i - 6);
        const end = Math.min(words.length, i + 5);
        for (let j = start; j < end; j++) {
          if (!NEGATION_MARKERS.has(words[j])) continue;
          // Guard against positive-count attributive adjective negation (e.g. "fünf nicht einziehbaren Krallen")
          if (
            (words[j] === "nicht" || words[j] === "not") &&
            j > 0 &&
            j + 1 < i &&
            isPositiveCountWord(words[j - 1])
          ) {
            continue;
          }
          return true;
        }
      }
    }
  }
  return false;
}

function clauseHasNegationForFact(normSentence, cf) {
  const rawNum = normalize(String(cf.raw || "")).replace(/\s+/g, " ").trim();
  const clauses = String(normSentence || "").split(/[,;:]+/);
  for (const clause of clauses) {
    const words = clause.match(/[a-z0-9']+/g) || [];
    if (!words.some((w) => NEGATION_MARKERS.has(w))) continue;
    const hasNum = rawNum && clause.includes(rawNum.split(" ")[0]);
    const hasUnitTok = cf.unitTokens.some((u) => words.some((w) => wordsMatch(w, u)));
    const hasMatchedFact = extractNumberFacts(clause).some((sf) => factsMatch(cf, sf));
    if (hasNum || hasUnitTok || hasMatchedFact) return true;
  }
  return false;
}

function factsMatch(cf, sf) {
  if (cf.dimension && sf.dimension) {
    if (cf.dimension !== sf.dimension) return false;
    if (Number.isFinite(cf.canonicalValue) && Number.isFinite(sf.canonicalValue)) {
      return Math.abs(cf.canonicalValue - sf.canonicalValue) < 1e-6;
    }
    return cf.num === sf.num;
  }
  if (cf.dimension && !sf.dimension && sf.hasNonUnitLabel) return false;
  if (!cf.dimension && sf.dimension && cf.hasNonUnitLabel) return false;
  if (cf.num === sf.num) return true;
  if (
    !cf.dimension &&
    !sf.dimension &&
    Number.isFinite(cf.canonicalValue) &&
    Number.isFinite(sf.canonicalValue)
  ) {
    return Math.abs(cf.canonicalValue - sf.canonicalValue) < 1e-6;
  }
  return false;
}

function buildSurfaceTokenMap(text) {
  const map = new Map();
  const rawWords = String(text || "").normalize("NFC").match(/[\p{L}\p{N}]{3,}/gu) || [];
  for (const raw of rawWords) {
    const norm = normalize(raw);
    if (norm && !map.has(norm)) {
      map.set(norm, raw);
    }
  }
  return map;
}

function detectContradictions(claim, preparedEvidenceArticles) {
  const reasons = [];
  if (!preparedEvidenceArticles.length) return reasons;

  const cleanClaim = stripMarkdownAndCitations(claim);
  const surfaceMap = buildSurfaceTokenMap(cleanClaim);
  const toSurface = (tok) => surfaceMap.get(tok) || tok;
  const claimNorm = normalize(cleanClaim);
  const claimNumbers = extractNumberFacts(cleanClaim);
  const claimTokens = tokenize(cleanClaim);
  const combinedEvidenceText = stripMarkdownAndCitations(
    preparedEvidenceArticles.map((a) => `${a.title}\n${a.body}`).join("\n")
  );
  const evidenceSentences = splitSentences(combinedEvidenceText);
  const evidenceAllFacts = extractNumberFacts(combinedEvidenceText);

  const nonUnitClaimTokens = claimTokens.filter((t) => !UNIT_TOKEN_DIMENSION.has(t));
  const hasEvidenceTitleHit = preparedEvidenceArticles.some(
    (a) =>
      (claimNorm && a.normTitle === claimNorm) ||
      claimTokens.some((t) => matchesWordSet(a.titleWordSet, a.titleWords, t))
  );

  // 1. Numeric contradiction check (contextual per sentence, not global document existence)
  for (const cf of claimNumbers) {
    const contextTokens = cf.unitTokens.length ? cf.unitTokens : claimTokens;
    const relevantSents = evidenceSentences.filter((s) => {
      const ns = normalize(s);
      const sFacts = extractNumberFacts(s);
      if (!sFacts.length) return false;
      const sWords = ns.match(/[a-z0-9]{3,}/g) || [];
      const tokenOverlap = contextTokens.some((tok) => sWords.some((w) => wordsMatch(w, tok)));
      const dimOverlap =
        Boolean(cf.dimension) &&
        sFacts.some(
          (sf) =>
            sf.dimension === cf.dimension ||
            (TEMPORAL_DIMENSIONS.has(cf.dimension) && TEMPORAL_DIMENSIONS.has(sf.dimension))
        ) &&
        claimTokens.some((t) => sWords.some((w) => wordsMatch(w, t)));
      return tokenOverlap || dimOverlap;
    });
    if (relevantSents.length > 0) {
      const foundFacts = relevantSents.flatMap((s) => extractNumberFacts(s));
      // Require strong context match: either a shared unit/dimension in the same sentence, or >=2 claim tokens in that sentence
      const rawStrongMatchSents = relevantSents.filter((s) => {
        const sWords = normalize(s).match(/[a-z0-9]{3,}/g) || [];
        const sFacts = extractNumberFacts(s);
        const unitMatch =
          cf.unitTokens.some((u) => sWords.some((w) => wordsMatch(w, u))) ||
          (Boolean(cf.dimension) && sFacts.some((sf) => sf.dimension === cf.dimension));
        const claimHits = claimTokens.filter((t) => sWords.some((w) => wordsMatch(w, t))).length;
        return unitMatch || claimHits >= 2;
      });
      const topicStrongMatchSents =
        nonUnitClaimTokens.length > 0
          ? rawStrongMatchSents.filter((s) => {
              const sWords = normalize(s).match(/[a-z0-9]{3,}/g) || [];
              return nonUnitClaimTokens.some((t) => sWords.some((w) => wordsMatch(w, t)));
            })
          : [];
      if (
        nonUnitClaimTokens.length > 0 &&
        topicStrongMatchSents.length === 0 &&
        !hasEvidenceTitleHit
      ) {
        continue;
      }
      const strongMatchSents =
        topicStrongMatchSents.length > 0 ? topicStrongMatchSents : rawStrongMatchSents;
      if (strongMatchSents.length > 0) {
        const strongFacts = strongMatchSents.flatMap((s) => extractNumberFacts(s));
        const sameDimFacts = cf.dimension
          ? strongFacts.filter((sf) => sf.dimension === cf.dimension)
          : [];
        const compatibleFacts = cf.dimension
          ? strongFacts.filter((sf) => sf.dimension === cf.dimension || !sf.dimension)
          : strongFacts;
        const crossTemporalFacts =
          cf.dimension && TEMPORAL_DIMENSIONS.has(cf.dimension)
            ? strongFacts.filter(
                (sf) =>
                  sf.dimension &&
                  TEMPORAL_DIMENSIONS.has(sf.dimension) &&
                  sf.dimension !== cf.dimension
              )
            : [];
        const comparePool =
          sameDimFacts.length > 0
            ? sameDimFacts
            : crossTemporalFacts.length > 0
              ? crossTemporalFacts
              : compatibleFacts;
        const matched = comparePool.some((sf) => factsMatch(cf, sf));
        const hasExactEvidenceMatch =
          comparePool === crossTemporalFacts &&
          evidenceAllFacts.some((sf) => sf.dimension === cf.dimension && factsMatch(cf, sf));
        if (comparePool.length && !matched && !hasExactEvidenceMatch) {
          const display = [...new Set(comparePool.map((f) => f.raw))].slice(0, 3);
          reasons.push(
            `Zahlen-Widerspruch: Behauptung nennt „${cf.raw}“, Quelle nennt stattdessen ${display.join(", ")}.`
          );
        }
      } else {
        const compatibleFound = cf.dimension
          ? foundFacts.filter((sf) => sf.dimension === cf.dimension || !sf.dimension)
          : foundFacts;
        const anyMatch = evidenceAllFacts.some((sf) => factsMatch(cf, sf));
        if (compatibleFound.length && !anyMatch) {
          const display = [...new Set(compatibleFound.map((f) => f.raw))].slice(0, 3);
          reasons.push(
            `Zahlen-Widerspruch: Behauptung nennt „${cf.raw}“, Quelle nennt stattdessen ${display.join(", ")}.`
          );
        }
      }
    }
  }

  // 2. Bidirectional polarity / negation contradiction check
  const claimHasNeg = (claimNorm.match(/[a-z0-9']+/g) || []).some((w) => NEGATION_MARKERS.has(w));
  if (!claimHasNeg) {
    const specificTerms = claimTokens.filter((t) => t.length >= 6);
    for (const term of specificTerms) {
      const termSents = evidenceSentences.filter((s) => {
        const words = normalize(s).match(/[a-z0-9]{3,}/g) || [];
        return words.some((w) => wordsMatch(w, term));
      });
      if (termSents.length > 0 && termSents.every((s) => hasNegationInClause(normalize(s), term))) {
        reasons.push(
          `Verneinungs-Widerspruch: Die Quelle verneint ausdrücklich „${toSurface(term)}“ (z. B. durch „kein“ / „Fehlen von“ / „nicht“).`
        );
        break;
      }
    }
  } else {
    // 2a. Negated numeric claim against positive source fact
    let negatedFactContra = false;
    for (const cf of claimNumbers) {
      if (!clauseHasNegationForFact(claimNorm, cf)) continue;
      const matchedNumSents = evidenceSentences.filter((s) => {
        const sFacts = extractNumberFacts(s);
        if (!sFacts.some((sf) => factsMatch(cf, sf))) return false;
        const sWords = normalize(s).match(/[a-z0-9]{3,}/g) || [];
        const unitMatch =
          cf.unitTokens.some((u) => sWords.some((w) => wordsMatch(w, u))) ||
          (Boolean(cf.dimension) && sFacts.some((sf) => sf.dimension === cf.dimension));
        const claimHits = claimTokens.filter((t) => sWords.some((w) => wordsMatch(w, t))).length;
        return unitMatch || claimHits >= 1;
      });
      if (
        matchedNumSents.length > 0 &&
        !matchedNumSents.some((s) => clauseHasNegationForFact(normalize(s), cf))
      ) {
        reasons.push(
          `Verneinungs-Widerspruch: Die Behauptung verneint „${cf.raw}“, obwohl die Quelle dies positiv belegt.`
        );
        negatedFactContra = true;
        break;
      }
    }

    // 2b. Negated concept/predicate claim against positive source evidence (evaluated independently per negated clause)
    if (!negatedFactContra && reasons.length === 0) {
      const SUBJECT_BEFORE_NEGATION_TRIGGERS = new Set([
        "fehlt", "fehlen", "fehlte", "fehlten",
        "missing", "absent",
      ]);
      const CONTRAST_PREFIX_RX =
        /^(?:im\s+(?:gegensatz|unterschied|vergleich)\s+zu|anders\s+als|unlike|contrary\s+to|in\s+contrast\s+to|compared\s+(?:to|with)|as\s+opposed\s+to)\b/;
      const PREP_PREFIX_RX =
        /^(?:bei|beim|in|im|am|an|auf|aus|unter|vom|von|fuer|gegen|mit|durch|ueber|vor|zwischen|nach|seit|trotz|waehrend|wegen|on|at|from|for|with|among|by|during|despite)\b/;
      const PREP_WORD_RX =
        /^(?:bei|beim|in|im|am|an|auf|aus|unter|vom|von|zu|zum|zur|fuer|gegen|mit|durch|ueber|vor|zwischen|nach|seit|trotz|waehrend|wegen|on|at|from|for|with|among|by|during|despite|of|to)$/;
      const POSTPONED_SUBJ_DET_RX =
        /^(?:ein|eine|einen|der|die|das|kein|keine|a|an|the|no)$/;
      const NOMINAL_DET_BEFORE_RX = /^(?:das|ein|the|an|a)$/;
      const NOMINAL_PREP_AFTER_RX = /^(?:von|of)$/;

      for (const clause of claimNorm.split(/[,;:]+|\b(?:und|and|oder|or|aber|but|sondern|while|whereas)\b/)) {
        const words = clause.match(/[a-z0-9']+/g) || [];
        const afterNegTokens = [];
        const beforeNegTokens = [];
        const subjectBeforeNegTokens = [];
        const postponedSubjectTokens = [];
        let prioritizeSubjectBeforeNeg = false;
        for (let i = 0; i < words.length; i++) {
          if (!NEGATION_MARKERS.has(words[i])) continue;
          for (let j = i + 1; j < Math.min(words.length, i + 7); j++) {
            for (const tok of claimTokens) {
              if (wordsMatch(words[j], tok) && !afterNegTokens.includes(tok)) {
                afterNegTokens.push(tok);
              }
            }
          }
          for (let j = Math.max(0, i - 5); j < i; j++) {
            for (const tok of claimTokens) {
              if (wordsMatch(words[j], tok) && !beforeNegTokens.includes(tok)) {
                beforeNegTokens.push(tok);
              }
            }
          }
          if (SUBJECT_BEFORE_NEGATION_TRIGGERS.has(words[i])) {
            const prefixStr = words.slice(0, i).join(" ");
            const prevWord = words[i - 1] || "";
            const nextWord = words[i + 1] || "";
            const afterWords = words.slice(i + 1);
            const isNominalized =
              NOMINAL_DET_BEFORE_RX.test(prevWord) && NOMINAL_PREP_AFTER_RX.test(nextWord);
            const isContrastOrPrepPrefix =
              CONTRAST_PREFIX_RX.test(prefixStr) || PREP_PREFIX_RX.test(prefixStr);

            let detIdx = -1;
            for (let k = 0; k < afterWords.length; k++) {
              if (
                POSTPONED_SUBJ_DET_RX.test(afterWords[k]) &&
                (k === 0 || !PREP_WORD_RX.test(afterWords[k - 1]))
              ) {
                detIdx = k;
                break;
              }
            }
            if (detIdx >= 0) {
              for (let k = detIdx + 1; k < afterWords.length; k++) {
                if (PREP_WORD_RX.test(afterWords[k])) break;
                for (const tok of claimTokens) {
                  if (wordsMatch(afterWords[k], tok) && !postponedSubjectTokens.includes(tok)) {
                    postponedSubjectTokens.push(tok);
                  }
                }
              }
            }

            if (!isNominalized && !isContrastOrPrepPrefix) {
              for (let j = Math.max(0, i - 5); j < i; j++) {
                for (const tok of claimTokens) {
                  if (wordsMatch(words[j], tok) && !subjectBeforeNegTokens.includes(tok)) {
                    subjectBeforeNegTokens.push(tok);
                  }
                }
              }
              const beforeHasNomDet = POSTPONED_SUBJ_DET_RX.test(words[0] || "");
              if (
                subjectBeforeNegTokens.length > 0 &&
                (beforeHasNomDet || (!POSTPONED_SUBJ_DET_RX.test(nextWord) && postponedSubjectTokens.length === 0))
              ) {
                prioritizeSubjectBeforeNeg = true;
              }
            }
          }
        }

        const clauseFocus =
          prioritizeSubjectBeforeNeg
            ? [...new Set([...subjectBeforeNegTokens, ...afterNegTokens])]
            : postponedSubjectTokens.length > 0
              ? [...new Set([...postponedSubjectTokens, ...afterNegTokens])]
              : afterNegTokens.length > 0
                ? afterNegTokens
                : beforeNegTokens;
        if (!clauseFocus.length) continue;

        let clauseContradiction = false;
        for (const term of clauseFocus) {
          const termSents = evidenceSentences.filter((s) => {
            const sWords = normalize(s).match(/[a-z0-9]{3,}/g) || [];
            return sWords.some((w) => wordsMatch(w, term));
          });
          if (!termSents.length) continue;

          const multiTokenSents = termSents.filter((s) => {
            const sWords = normalize(s).match(/[a-z0-9]{3,}/g) || [];
            return claimTokens.some((other) => other !== term && sWords.some((w) => wordsMatch(w, other)));
          });
          const targetSents = multiTokenSents.length > 0 ? multiTokenSents : termSents;
          const negSents = targetSents.filter((s) => hasNegationInClause(normalize(s), term));
          if (negSents.length > 0) {
            const isEntityTitleToken = preparedEvidenceArticles.some((a) =>
              matchesWordSet(a.titleWordSet, a.titleWords, term)
            );
            const hasUnalignedAfterNeg =
              isEntityTitleToken &&
              afterNegTokens.some(
                (other) =>
                  other !== term &&
                  !negSents.some((s) => {
                    const sWords = normalize(s).match(/[a-z0-9]{3,}/g) || [];
                    return sWords.some((w) => wordsMatch(w, other));
                  })
              );
            if (hasUnalignedAfterNeg) {
              continue;
            }
            // Source already negates this focus term — this negated clause aligns with source; proceed to next clause
            break;
          }
          reasons.push(
            `Verneinungs-Widerspruch: Die Behauptung verneint „${toSurface(term)}“, obwohl die Quelle dies positiv belegt.`
          );
          clauseContradiction = true;
          break;
        }
        if (clauseContradiction) break;
      }
    }
  }

  return reasons;
}

function verifySingleClaim(articles, prepared, cleanClaim, originalClaim) {
  const surfaceMap = buildSurfaceTokenMap(cleanClaim);
  const toSurface = (tok) => surfaceMap.get(tok) || tok;
  const tokens = tokenize(cleanClaim);
  const claimFacts = extractNumberFacts(cleanClaim);
  const scored = scoreCorpus(articles, cleanClaim);

  if (!tokens.length || !scored.length) {
    return {
      claim: originalClaim,
      status: "nicht_belegt",
      confidence_label:
        "Keine Treffer in der Wissensbasis gefunden (mögliche Fangfrage oder fehlende Quelle).",
      matched_token_ratio: 0,
      mismatch_reasons: [],
      evidence: [],
    };
  }

  const top = scored[0];
  const topPrepared = prepared.find((a) => a.slug === top.slug);
  const topScoredPrepared = scored
    .slice(0, 3)
    .map((m) => prepared.find((a) => a.slug === m.slug))
    .filter(Boolean);

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
  const missingInCorpus = tokens.filter((tok) => {
    const literalHit = prepared.some(
      (art) =>
        matchesWordSet(art.titleWordSet, art.titleWords, tok) ||
        matchesWordSet(art.bodyWordSet, art.bodyWords, tok) ||
        matchesWordSet(art.tagWordSet, art.tagWords, tok)
    );
    if (literalHit) return false;
    const unitDim = UNIT_TOKEN_DIMENSION.get(tok);
    if (unitDim && topScoredPrepared.some((art) => art.unitDims?.has(unitDim))) {
      return false;
    }
    if (Object.prototype.hasOwnProperty.call(NUMBER_WORD_MAP, tok)) {
      const numStr = NUMBER_WORD_MAP[tok];
      const numVal = Number(numStr);
      if (
        topScoredPrepared.some(
          (art) =>
            art.articleFacts?.some(
              (f) => String(f.num) === numStr || f.canonicalValue === numVal
            ) || art.bodyWordSet?.has(numStr)
        )
      ) {
        return false;
      }
    }
    return true;
  });
  const topRatio = top.matched_tokens.length / tokens.length;
  const topFactMatched =
    claimFacts.length > 0 &&
    Boolean(topPrepared) &&
    claimFacts.some((cf) => topPrepared.articleFacts.some((sf) => factsMatch(cf, sf)));

  const specificRatioOk =
    missingSpecificRatio <= 0.45 ||
    (specificTokens.length <= 1 &&
      ratio >= 0.75 &&
      (topFactMatched ||
        missingInCorpus.every((t) => STOPWORDS.has(t) || UNIT_TOKEN_DIMENSION.has(t))));

  let status = "nicht_belegt";
  let confidence_label =
    "Keine ausreichenden Belege in der Wissensbasis gefunden – mögliche Fangfrage!";

  if (
    missingInCorpus.length === 0 &&
    ratio >= 0.55 &&
    (top.score >= 14 || (topFactMatched && ratio >= 0.8)) &&
    (top.hasTitleHit || topRatio >= 0.35) &&
    (topRatio >= 0.55 || ratio >= 0.8) &&
    specificRatioOk
  ) {
    status = "belegt";
    confidence_label =
      "Starke Abdeckung in den lokalen Artikeln – Belege verfügbar.";
  } else if (
    ratio >= 0.4 &&
    (top.hasTitleHit || top.matched_tokens.length >= 2) &&
    specificRatioOk
  ) {
    status = "teilweise";
    confidence_label =
      missingInCorpus.length > 0
        ? `Begriffe nicht in der Wissensbasis gefunden (${missingInCorpus.map(toSurface).join(", ")}) — mögliche Fangfrage!`
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

  let mismatch_reasons = [];
  const nonUnitMatchedCount = top.matched_tokens.filter(
    (t) => !UNIT_TOKEN_DIMENSION.has(t)
  ).length;
  const isWeakNonEntityMatch =
    !top.hasTitleHit && missingSpecificRatio > 0.45 && nonUnitMatchedCount < 2;
  const canCheckContradictions =
    scored.length > 0 &&
    !isWeakNonEntityMatch &&
    (status === "belegt" ||
      status === "teilweise" ||
      top.hasTitleHit ||
      (top.matched_tokens.length >= 2 && ratio >= 0.4) ||
      (claimFacts.length >= 1 && top.matched_tokens.length >= 1 && ratio >= 0.5));

  if (canCheckContradictions) {
    const candidateSlugs = [...new Set([...evidence.map((ev) => ev.slug), ...scored.slice(0, 3).map((s) => s.slug)])];
    const evPrepared = candidateSlugs
      .map((slug) => prepared.find((a) => a.slug === slug))
      .filter(Boolean);
    mismatch_reasons = detectContradictions(cleanClaim, evPrepared);
    if (mismatch_reasons.length > 0) {
      status = "widerspruch";
      confidence_label = `Widerspruch zur Quelle erkannt: ${mismatch_reasons[0]}`;
      if (evidence.length === 0) {
        const fallbackEv = scored
          .slice(0, 2)
          .map(({ hasTitleHit: _ignored, ...rest }) => rest);
        return {
          claim: originalClaim,
          status,
          confidence_label,
          matched_token_ratio: Number(ratio.toFixed(2)),
          mismatch_reasons,
          evidence: fallbackEv,
        };
      }
    }
  }

  return {
    claim: originalClaim,
    status,
    confidence_label,
    matched_token_ratio: Number(ratio.toFixed(2)),
    mismatch_reasons,
    evidence,
  };
}

export function verifyClaim(articles, claim) {
  const prepared = Array.isArray(articles) ? articles.map(prepareArticle) : [];
  const cleanClaim = stripMarkdownAndCitations(claim);
  const lines = cleanClaim
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return verifySingleClaim(articles, prepared, cleanClaim, claim);
  }

  const STATUS_PRIORITY = {
    widerspruch: 3,
    nicht_belegt: 2,
    teilweise: 1,
    belegt: 0,
  };
  const lineResults = lines.map((line) => verifySingleClaim(articles, prepared, line, line));
  let worstResult = lineResults[0];
  for (const r of lineResults) {
    if ((STATUS_PRIORITY[r.status] ?? 0) > (STATUS_PRIORITY[worstResult.status] ?? 0)) {
      worstResult = r;
    }
  }

  const mismatch_reasons = [
    ...new Set(lineResults.flatMap((r) => r.mismatch_reasons || [])),
  ];
  const evMap = new Map();
  for (const r of lineResults) {
    for (const ev of r.evidence || []) {
      const existing = evMap.get(ev.slug);
      if (!existing) {
        evMap.set(ev.slug, {
          ...ev,
          matched_tokens: [...(ev.matched_tokens || [])],
        });
      } else {
        existing.score = Math.max(existing.score || 0, ev.score || 0);
        existing.matched_tokens = [
          ...new Set([
            ...(existing.matched_tokens || []),
            ...(ev.matched_tokens || []),
          ]),
        ];
      }
    }
  }
  const evidence = [...evMap.values()].sort((a, b) => (b.score || 0) - (a.score || 0));
  const avgRatio =
    lineResults.reduce((sum, r) => sum + (Number(r.matched_token_ratio) || 0), 0) /
    lineResults.length;

  return {
    claim,
    status: worstResult.status,
    confidence_label:
      worstResult.status === "widerspruch" && mismatch_reasons.length > 0
        ? `Widerspruch zur Quelle erkannt: ${mismatch_reasons[0]}`
        : worstResult.confidence_label,
    matched_token_ratio: Number(avgRatio.toFixed(2)),
    mismatch_reasons,
    evidence,
  };
}
