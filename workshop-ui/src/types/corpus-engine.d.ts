declare module "@shared/corpus-engine.mjs" {
  export function normalize(text: string): string;
  export function tokenize(text: string): string[];
  export function parseFrontmatter(markdown: string): {
    meta: Record<string, string | string[]>;
    body: string;
  };
  export function extractSnippet(body: string, queryTokens?: string[], maxLen?: number): string;
  export function searchCorpus(
    articles: Record<string, unknown>[],
    query: string,
    limitOrOptions?: number | { limit?: number; category?: string }
  ): Array<{
    slug: string;
    title: string;
    category: string;
    habitat?: string;
    group?: string;
    status?: string;
    rel_path?: string;
    source_file?: string;
    wikilink: string;
    related_wikilinks?: string[];
    matched_tokens?: string[];
    score: number;
    snippet: string;
  }>;
  export function verifyClaim(
    articles: Record<string, unknown>[],
    claim: string
  ): {
    claim: string;
    status: "belegt" | "teilweise" | "nicht_belegt";
    confidence_label: string;
    matched_token_ratio: number;
    evidence: Array<{
      slug: string;
      title: string;
      category: string;
      habitat?: string;
      group?: string;
      wikilink: string;
      matched_tokens?: string[];
      score: number;
      snippet: string;
    }>;
  };
}
