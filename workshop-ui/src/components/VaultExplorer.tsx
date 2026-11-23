import { useMemo, useState } from "react";
import { ArrowRight, Link2, Network, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VaultArticle } from "@/types/workshop";

interface VaultExplorerProps {
  articles: VaultArticle[];
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "Alle (68)",
  lebensraum: "Lebensräume (5)",
  tierart: "Tierarten (48)",
  konzept: "Konzepte (15)",
};

export function VaultExplorer({ articles }: VaultExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedSlug, setSelectedSlug] = useState<string>("anemonenfische");
  const [trail, setTrail] = useState<string[]>(["anemonenfische"]);

  const bySlug = useMemo(() => {
    const map = new Map<string, VaultArticle>();
    for (const a of articles) map.set(a.slug, a);
    return map;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.habitat.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [articles, category, query]);

  const selected = bySlug.get(selectedSlug) ?? articles[0];

  function jumpTo(slug: string) {
    if (!bySlug.has(slug)) return;
    setSelectedSlug(slug);
    setTrail((prev) => [...prev.slice(-5), slug]);
  }

  return (
    <Card className="border-v7-green/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4 text-v7-greenDark" />
              Interaktiver Vault- & Wikilink-Explorer (Stufe 3 live erleben)
            </CardTitle>
            <CardDescription>
              Navigiere wie ein Markdown-RAG-Agent über Kategorien, YAML-Frontmatter und echte{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">[[Wikilinks]]</code>.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={category === key ? "default" : "outline"}
                onClick={() => setCategory(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen (z. B. Eisbär, Korallen, Symbiose...)"
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[320px] rounded-lg border bg-muted/20 p-2">
            <div className="space-y-1.5">
              {filtered.map((art) => (
                <button
                  key={art.slug}
                  type="button"
                  onClick={() => jumpTo(art.slug)}
                  className={`flex w-full items-start justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    art.slug === selected.slug
                      ? "border-primary bg-secondary/70 font-medium"
                      : "border-transparent bg-card hover:border-border hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div>{art.title}</div>
                    <div className="text-xs text-muted-foreground">{art.habitat}</div>
                  </div>
                  <Badge variant="outline" className="text-[11px]">
                    {art.category}
                  </Badge>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Keine Artikel für „{query}“ gefunden.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/15 p-4 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>Pfad:</span>
            {trail.map((step, i) => {
              const node = bySlug.get(step);
              return (
                <span key={`${step}-${i}`} className="inline-flex items-center gap-1">
                  {i > 0 && <ArrowRight className="h-3 w-3" />}
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(step)}
                    className="rounded bg-background px-1.5 py-0.5 font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    [[{node?.slug || step}]]
                  </button>
                </span>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-lg font-bold">{selected.title}</h4>
              <Badge variant="secondary">{selected.status}</Badge>
            </div>

            <div className="rounded-lg border bg-card p-3 font-mono text-xs text-muted-foreground">
              <div>---</div>
              <div>title: "{selected.title}"</div>
              <div>category: {selected.category}</div>
              <div>habitat: "{selected.habitat}"</div>
              <div>status: "{selected.status}"</div>
              <div>source_file: "{selected.source_file}"</div>
              <div>tags: [{selected.tags.join(", ")}]</div>
              <div>---</div>
            </div>

            <p className="text-sm leading-relaxed">{selected.summary}</p>

            {selected.key_points.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {selected.key_points.slice(0, 3).map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            )}

            <div className="pt-1">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Link2 className="h-3.5 w-3.5 text-v7-greenDark" />
                Klickbare [[Wikilinks]] (Sprung im Wissens-Graph)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selected.related.map((relSlug) => {
                  const target = bySlug.get(relSlug);
                  if (!target) return null;
                  return (
                    <Button
                      key={relSlug}
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => jumpTo(relSlug)}
                      className="h-7 text-xs"
                    >
                      [[{target.slug}|{target.title}]]
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
