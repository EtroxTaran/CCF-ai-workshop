import { searchCorpus, verifyClaim } from "@shared/corpus-engine.mjs";
import type {
  CorpusSearchIndex,
  EvidenceMatch,
  StarterArticle,
  VaultArticle,
  VerifyClaimResult,
} from "@/types/workshop";

const EMPTY_STARTER_ARTICLES: StarterArticle[] = [];
const EMPTY_INDEX: CorpusSearchIndex = {};

function mergeArticlesWithIndex(
  vaultArticles: VaultArticle[],
  starterArticles: StarterArticle[] = EMPTY_STARTER_ARTICLES,
  corpusIndex: CorpusSearchIndex = EMPTY_INDEX
): Record<string, unknown>[] {
  const starterMap = new Map(starterArticles.map((s) => [s.slug, s]));
  return vaultArticles.map((art) => {
    const starter = starterMap.get(art.slug);
    const body = corpusIndex[art.slug] || starter?.content || art.summary || "";
    return {
      slug: art.slug,
      title: art.title,
      category: art.category,
      habitat: art.habitat || art.group || "",
      group: art.group || art.habitat || "",
      status: art.status,
      tags: art.tags || [],
      summary: art.summary || "",
      key_points: art.key_points || [],
      related: art.related || [],
      source_file: art.source_file || `raw/${art.slug}.md`,
      body,
    };
  });
}

/** Search module articles using the shared ESM corpus engine (zero duplication). */
export function offlineSearchVault(
  query: string,
  vaultArticles: VaultArticle[],
  starterArticles: StarterArticle[] = EMPTY_STARTER_ARTICLES,
  limit = 5,
  corpusIndex: CorpusSearchIndex = EMPTY_INDEX
): EvidenceMatch[] {
  const articles = mergeArticlesWithIndex(vaultArticles, starterArticles, corpusIndex);
  return searchCorpus(articles, query, limit).map((m) => ({
    slug: m.slug,
    title: m.title,
    wikilink: m.wikilink,
    rel_path: m.rel_path || `${m.category}/${m.slug}.md`,
    source_file: m.source_file || `raw/${m.slug}.md`,
    snippet: m.snippet,
    matched_tokens: m.matched_tokens,
    score: m.score,
  }));
}

/** Verify a claim against all module articles via the shared ESM corpus engine. */
export function offlineVerifyClaim(
  claim: string,
  vaultArticles: VaultArticle[],
  starterArticles: StarterArticle[] = EMPTY_STARTER_ARTICLES,
  corpusIndex: CorpusSearchIndex = EMPTY_INDEX
): VerifyClaimResult {
  const articles = mergeArticlesWithIndex(vaultArticles, starterArticles, corpusIndex);
  const res = verifyClaim(articles, claim);
  return {
    status: res.status,
    label: res.confidence_label,
    evidence: (res.evidence || []).map((ev) => ({
      slug: ev.slug,
      title: ev.title,
      wikilink: ev.wikilink,
      rel_path: `${ev.category}/${ev.slug}.md`,
      source_file: `raw/${ev.slug}.md`,
      snippet: ev.snippet,
      matched_tokens: ev.matched_tokens,
      score: ev.score,
    })),
  };
}
