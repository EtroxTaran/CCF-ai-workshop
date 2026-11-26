import rawSearchIndex from "@/data/searchIndex.json";
import type {
  CorpusSearchIndex,
  EvidenceMatch,
  StarterArticle,
  VaultArticle,
  VerifyClaimResult,
} from "@/types/workshop";

const DEFAULT_CORPUS_INDEX = rawSearchIndex as CorpusSearchIndex;
const EMPTY_STARTER_ARTICLES: StarterArticle[] = [];

const STOPWORDS = new Set([
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

function normalize(text: string): string {
  return String(text || "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function stemDe(word: string): string {
  if (word.length < 6) return word;
  return word.replace(/(?:ern|em|en|er|es|e|n|s|t)$/, "");
}

function wordsMatch(word: string, tok: string): boolean {
  if (word === tok) return true;
  if (tok.length >= 6 && word.length >= 6 && stemDe(word) === stemDe(tok)) return true;
  if (tok.length >= 5 && word.startsWith(tok) && word.length - tok.length <= 2) return true;
  if (word.length >= 5 && tok.startsWith(word) && tok.length - word.length <= 2) return true;
  return false;
}

function matchesWordSet(wordSet: Set<string>, wordList: string[], tok: string): boolean {
  if (wordSet.has(tok)) return true;
  for (const w of wordList) {
    if (wordsMatch(w, tok)) return true;
  }
  return false;
}

function tokenize(text: string): string[] {
  const norm = normalize(text);
  const raw = norm.match(/[a-z0-9]{3,}/g) || [];
  return [...new Set(raw.filter((t) => !/^\d+$/.test(t) && !STOPWORDS.has(t)))];
}

function categoryDir(cat: VaultArticle["category"]): string {
  if (cat === "lebensraum") return "lebensraeume";
  if (cat === "tierart") return "tierarten";
  return "konzepte";
}

function pickCenteredSnippet(candidates: string[], tokens: string[], fallback: string): string {
  let best = fallback;
  let bestScore = -1;
  let firstIdx = -1;

  for (const line of candidates) {
    const clean = line.trim();
    if (
      !clean ||
      clean.startsWith("#") ||
      clean.startsWith("---") ||
      clean.startsWith("> **Kategorie") ||
      clean.startsWith("*(Hinweis:") ||
      clean.startsWith("Quelle:")
    ) {
      continue;
    }
    const nl = normalize(clean);
    const words = nl.match(/[a-z0-9]{2,}/g) || [];
    let sc = 0;
    let earliest = Infinity;
    for (const t of tokens) {
      if (words.some((w) => wordsMatch(w, t))) {
        sc += t.length;
        const pos = nl.indexOf(t.slice(0, Math.min(5, t.length)));
        if (pos >= 0 && pos < earliest) earliest = pos;
      }
    }
    if (sc > bestScore) {
      bestScore = sc;
      best = clean;
      firstIdx = earliest === Infinity ? -1 : earliest;
    }
  }

  if (best.length <= 280) return best;
  const anchor = firstIdx >= 0 ? firstIdx : 0;
  let start = Math.max(0, anchor - 75);
  if (start > 0) {
    const sp = best.indexOf(" ", start);
    if (sp > 0 && sp < anchor) start = sp + 1;
  }
  let end = Math.min(best.length, start + 275);
  if (end < best.length) {
    const sp = best.lastIndexOf(" ", end);
    if (sp > start + 140) end = sp;
  }
  return `${start > 0 ? "…" : ""}${best.slice(start, end)}${end < best.length ? "…" : ""}`;
}

interface IndexedArticle {
  art: VaultArticle;
  snippetLines: string[];
  normTitle: string;
  titleWords: string[];
  titleWordSet: Set<string>;
  bodyWords: string[];
  bodyWordSet: Set<string>;
  tagWords: string[];
  tagWordSet: Set<string>;
}

interface CachedIndexEntry {
  starterArticles: StarterArticle[];
  corpusIndex: CorpusSearchIndex;
  indexed: IndexedArticle[];
}

const indexCache = new WeakMap<VaultArticle[], CachedIndexEntry>();

function getIndexedArticles(
  vaultArticles: VaultArticle[],
  starterArticles: StarterArticle[],
  corpusIndex: CorpusSearchIndex
): IndexedArticle[] {
  const existing = indexCache.get(vaultArticles);
  if (
    existing &&
    existing.starterArticles === starterArticles &&
    existing.corpusIndex === corpusIndex
  ) {
    return existing.indexed;
  }

  const starterMap = new Map(starterArticles.map((s) => [s.slug, s.content]));
  const indexed: IndexedArticle[] = vaultArticles.map((art) => {
    const fullText = corpusIndex[art.slug] || starterMap.get(art.slug) || "";
    const bodyText = [art.summary, ...art.key_points, fullText].filter(Boolean).join("\n");
    const snippetSource = fullText || [art.summary, ...art.key_points].filter(Boolean).join("\n");
    const normTitle = normalize(art.title);
    const normBody = normalize(bodyText);
    const titleWords = [
      ...new Set([...(normTitle.match(/[a-z0-9]{2,}/g) || []), ...art.slug.split("-").filter(Boolean)]),
    ];
    const bodyWords = [...new Set(normBody.match(/[a-z0-9]{2,}/g) || [])];
    const tagWords = [...new Set(art.tags.flatMap((t) => normalize(t).match(/[a-z0-9]{2,}/g) || []))];

    return {
      art,
      snippetLines: snippetSource.split(/\r?\n/),
      normTitle,
      titleWords,
      titleWordSet: new Set(titleWords),
      bodyWords,
      bodyWordSet: new Set(bodyWords),
      tagWords,
      tagWordSet: new Set(tagWords),
    };
  });

  indexCache.set(vaultArticles, { starterArticles, corpusIndex, indexed });
  return indexed;
}

interface InternalMatch extends EvidenceMatch {
  hasTitleHit: boolean;
}

function runInternalSearch(
  query: string,
  vaultArticles: VaultArticle[],
  starterArticles: StarterArticle[],
  limit: number,
  corpusIndex: CorpusSearchIndex
): InternalMatch[] {
  const tokens = tokenize(query);
  const normQ = normalize(query).trim();
  if (!tokens.length && !normQ) return [];

  const indexed = getIndexedArticles(vaultArticles, starterArticles, corpusIndex);
  const total = indexed.length || 1;

  const docFreq = new Map<string, number>();
  for (const tok of tokens) {
    let df = 0;
    for (const item of indexed) {
      if (
        matchesWordSet(item.titleWordSet, item.titleWords, tok) ||
        matchesWordSet(item.bodyWordSet, item.bodyWords, tok)
      ) {
        df += 1;
      }
    }
    docFreq.set(tok, df);
  }

  const scored: InternalMatch[] = [];
  for (const item of indexed) {
    let score = 0;
    let hasTitleHit = false;
    const matchedTokens: string[] = [];

    if (normQ && item.normTitle === normQ) {
      score += 36;
      hasTitleHit = true;
    }

    for (const tok of tokens) {
      let hit = false;
      if (matchesWordSet(item.titleWordSet, item.titleWords, tok)) {
        score += 16;
        hasTitleHit = true;
        hit = true;
      }
      if (matchesWordSet(item.bodyWordSet, item.bodyWords, tok)) {
        const df = docFreq.get(tok) || 1;
        score += Math.round(4 + Math.log((total + 1) / (df + 1)) * 2);
        hit = true;
      }
      if (matchesWordSet(item.tagWordSet, item.tagWords, tok)) {
        score += 5;
        hit = true;
      }
      if (hit) matchedTokens.push(tok);
    }

    const minTokensOk = tokens.length <= 1 || hasTitleHit || matchedTokens.length >= 2;
    if (score > 0 && minTokensOk) {
      scored.push({
        slug: item.art.slug,
        title: item.art.title,
        wikilink: `[[${item.art.slug}|${item.art.title}]]`,
        rel_path: `wiki/${categoryDir(item.art.category)}/${item.art.slug}.md`,
        source_file: item.art.source_file,
        snippet: pickCenteredSnippet(
          item.snippetLines,
          matchedTokens.length ? matchedTokens : tokens,
          item.art.summary
        ),
        matched_tokens: matchedTokens,
        hasTitleHit,
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.min(Math.max(limit || 5, 1), 15));
}

export function offlineSearchVault(
  query: string,
  vaultArticles: VaultArticle[],
  starterArticles: StarterArticle[] = EMPTY_STARTER_ARTICLES,
  limit = 5,
  corpusIndex: CorpusSearchIndex = DEFAULT_CORPUS_INDEX
): EvidenceMatch[] {
  return runInternalSearch(query, vaultArticles, starterArticles, limit, corpusIndex).map(
    ({ hasTitleHit: _ignored, ...rest }) => rest
  );
}

export function offlineVerifyClaim(
  claim: string,
  vaultArticles: VaultArticle[],
  starterArticles: StarterArticle[] = EMPTY_STARTER_ARTICLES,
  corpusIndex: CorpusSearchIndex = DEFAULT_CORPUS_INDEX
): VerifyClaimResult {
  const indexed = getIndexedArticles(vaultArticles, starterArticles, corpusIndex);
  const tokens = tokenize(claim);
  const matches = runInternalSearch(claim, vaultArticles, starterArticles, 5, corpusIndex);

  if (!tokens.length || !matches.length) {
    return {
      status: "nicht_belegt",
      label: "Nicht in der Wissensbasis gefunden – mögliche Fangfrage!",
      evidence: [],
    };
  }

  const covered = new Set<string>();
  for (const m of matches.slice(0, 3)) {
    for (const t of m.matched_tokens || []) covered.add(t);
  }
  const ratio = covered.size / tokens.length;
  const specificTokens = tokens.filter((t) => t.length >= 6);
  const missingSpecific = specificTokens.filter((t) => !covered.has(t));
  const missingSpecificRatio = specificTokens.length
    ? missingSpecific.length / specificTokens.length
    : 0;
  const missingInCorpus = tokens.filter(
    (tok) =>
      !indexed.some(
        (item) =>
          matchesWordSet(item.titleWordSet, item.titleWords, tok) ||
          matchesWordSet(item.bodyWordSet, item.bodyWords, tok) ||
          matchesWordSet(item.tagWordSet, item.tagWords, tok)
      )
  );
  const top = matches[0];
  const topRatio = top ? (top.matched_tokens?.length || 0) / tokens.length : 0;

  let status: VerifyClaimResult["status"] = "nicht_belegt";
  let label = "Nicht in der Wissensbasis gefunden – mögliche Fangfrage!";

  if (
    top &&
    missingInCorpus.length === 0 &&
    ratio >= 0.55 &&
    top.score >= 14 &&
    (top.hasTitleHit || topRatio >= 0.35) &&
    (topRatio >= 0.55 || ratio >= 0.8) &&
    missingSpecificRatio <= 0.45
  ) {
    status = "belegt";
    label = "Starke Abdeckung in den lokalen Artikeln – Belege verfügbar.";
  } else if (
    top &&
    ratio >= 0.4 &&
    (top.hasTitleHit || (top.matched_tokens?.length || 0) >= 2) &&
    missingSpecificRatio <= 0.45
  ) {
    status = "teilweise";
    label =
      missingInCorpus.length > 0
        ? `Begriffe nicht in der Wissensbasis gefunden (${missingInCorpus.join(", ")}) – mögliche Fangfrage!`
        : "Teilweise Themenbezug gefunden – Detailabgleich empfohlen.";
  }

  const rawEvidence =
    status === "nicht_belegt"
      ? top?.hasTitleHit
        ? matches.slice(0, 2)
        : []
      : matches.slice(0, 3);
  const evidenceRaw = rawEvidence.filter(
    (m, idx) => idx === 0 || m.hasTitleHit || (top && m.score >= top.score * 0.45)
  );

  return {
    status,
    label,
    evidence: evidenceRaw.map(({ hasTitleHit: _ignored, ...rest }) => rest),
  };
}
