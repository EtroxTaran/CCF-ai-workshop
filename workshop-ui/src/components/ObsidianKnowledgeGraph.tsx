import { useMemo, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { ArrowRight, Link2, List, Minus, Network, Plus, RotateCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { VaultArticle } from "@/types/workshop";

interface ObsidianKnowledgeGraphProps {
  articles: VaultArticle[];
}

interface GraphNode extends SimulationNodeDatum {
  slug: string;
  title: string;
  category: VaultArticle["category"];
  habitat: string;
  degree: number;
  x: number;
  y: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const WIDTH = 760;
const HEIGHT = 500;

const HABITAT_ANCHORS: Record<string, { x: number; y: number }> = {
  Arktis: { x: WIDTH * 0.25, y: HEIGHT * 0.24 },
  Korallenriff: { x: WIDTH * 0.77, y: HEIGHT * 0.25 },
  "Tropischer Regenwald": { x: WIDTH * 0.80, y: HEIGHT * 0.72 },
  Alpen: { x: WIDTH * 0.22, y: HEIGHT * 0.75 },
  Savanne: { x: WIDTH * 0.50, y: HEIGHT * 0.84 },
  Übergreifend: { x: WIDTH * 0.50, y: HEIGHT * 0.48 },
};

function getSlug(endpoint: string | GraphNode): string {
  return typeof endpoint === "string" ? endpoint : endpoint.slug;
}

function nodeColor(category: VaultArticle["category"]): string {
  if (category === "lebensraum") return "#A9C23F";
  if (category === "konzept") return "#34D399";
  return "#CBD5C0";
}

function nodeBaseRadius(node: GraphNode): number {
  if (node.category === "lebensraum") return 11;
  if (node.category === "konzept") return 7.5;
  return 4.5 + Math.min(3, node.degree * 0.28);
}

export function ObsidianKnowledgeGraph({ articles }: ObsidianKnowledgeGraphProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const [selectedSlug, setSelectedSlug] = useState<string>("anemonenfische");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>(["anemonenfische"]);
  const [zoom, setZoom] = useState<number>(1);
  const [showRawYaml, setShowRawYaml] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const bySlug = useMemo(() => {
    const map = new Map<string, VaultArticle>();
    for (const a of articles) map.set(a.slug, a);
    return map;
  }, [articles]);

  // Compute deterministic settled force layout once for the 68 vault nodes
  const { layoutNodes, layoutLinks, neighborsMap } = useMemo(() => {
    const slugSet = new Set(articles.map((a) => a.slug));
    const edgeSeen = new Set<string>();
    const rawLinks: GraphLink[] = [];
    const degreeCount = new Map<string, number>();
    const adj = new Map<string, Set<string>>();

    for (const a of articles) adj.set(a.slug, new Set());

    for (const a of articles) {
      for (const target of a.related) {
        if (!slugSet.has(target) || target === a.slug) continue;
        const pair = a.slug < target ? `${a.slug}::${target}` : `${target}::${a.slug}`;
        if (edgeSeen.has(pair)) continue;
        edgeSeen.add(pair);
        rawLinks.push({ source: a.slug, target });
        degreeCount.set(a.slug, (degreeCount.get(a.slug) || 0) + 1);
        degreeCount.set(target, (degreeCount.get(target) || 0) + 1);
        adj.get(a.slug)?.add(target);
        adj.get(target)?.add(a.slug);
      }
    }

    const nodes: GraphNode[] = articles.map((a) => {
      const anchor = HABITAT_ANCHORS[a.habitat] || HABITAT_ANCHORS["Übergreifend"];
      return {
        slug: a.slug,
        title: a.title,
        category: a.category,
        habitat: a.habitat,
        degree: degreeCount.get(a.slug) || 1,
        x: anchor.x + ((a.slug.charCodeAt(0) % 7) - 3) * 14,
        y: anchor.y + ((a.slug.charCodeAt(a.slug.length - 1) % 7) - 3) * 14,
      };
    });

    const sim = forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(rawLinks)
          .id((d) => d.slug)
          .distance((l) => {
            const s = getSlug(l.source);
            const t = getSlug(l.target);
            const sCat = bySlug.get(s)?.category;
            const tCat = bySlug.get(t)?.category;
            return sCat === "lebensraum" || tCat === "lebensraum" ? 56 : 40;
          })
          .strength(0.32)
      )
      .force("charge", forceManyBody().strength(-90))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "x",
        forceX<GraphNode>((d) => (HABITAT_ANCHORS[d.habitat] || HABITAT_ANCHORS["Übergreifend"]).x).strength(0.08)
      )
      .force(
        "y",
        forceY<GraphNode>((d) => (HABITAT_ANCHORS[d.habitat] || HABITAT_ANCHORS["Übergreifend"]).y).strength(0.08)
      )
      .force("collide", forceCollide<GraphNode>((d) => nodeBaseRadius(d) + 8))
      .stop();

    for (let i = 0; i < 150; i += 1) {
      sim.tick();
    }

    // Clamp cleanly inside SVG viewBox margin
    for (const n of nodes) {
      n.x = Math.max(36, Math.min(WIDTH - 36, n.x));
      n.y = Math.max(32, Math.min(HEIGHT - 32, n.y));
    }

    return { layoutNodes: nodes, layoutLinks: rawLinks, neighborsMap: adj };
  }, [articles, bySlug]);

  const counts = useMemo(
    () => ({
      all: articles.length,
      lebensraum: articles.filter((a) => a.category === "lebensraum").length,
      konzept: articles.filter((a) => a.category === "konzept").length,
      tierart: articles.filter((a) => a.category === "tierart").length,
    }),
    [articles]
  );

  const matchingSlugs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = new Set<string>();
    for (const a of articles) {
      if (category !== "all" && a.category !== category) continue;
      if (
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.habitat.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        matched.add(a.slug);
      }
    }
    return matched;
  }, [articles, category, query]);

  const filteredList = useMemo(
    () => articles.filter((a) => matchingSlugs.has(a.slug)),
    [articles, matchingSlugs]
  );

  const selected = bySlug.get(selectedSlug) ?? articles[0];
  const focusSlug = hoveredSlug || selectedSlug;
  const focusNeighbors = neighborsMap.get(focusSlug) || new Set<string>();
  const isFiltering = query.trim().length > 0 || category !== "all";

  function selectNode(slug: string) {
    if (!bySlug.has(slug)) return;
    setSelectedSlug(slug);
    setTrail((prev) => (prev[prev.length - 1] === slug ? prev : [...prev.slice(-4), slug]));
  }

  const viewW = WIDTH / zoom;
  const viewH = HEIGHT / zoom;
  const viewX = (WIDTH - viewW) / 2;
  const viewY = (HEIGHT - viewH) / 2;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#232B20] bg-[#0B0F0A] text-[#F2F4EE] shadow-xl">
      {/* Top Graph Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[#232B20] bg-[#111610] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#A9C23F]/15 text-[#A9C23F]">
            <Network className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-bold text-[#F2F4EE] sm:text-base">
              Obsidian Wissens-Graph · {articles.length} Artikel &amp; {layoutLinks.length} Verknüpfungen
            </div>
            <div className="text-xs text-[#9FA998]">
              Hover hebt Nachbarn hervor · Klick springt über <code>[[Wikilinks]]</code>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[190px] flex-1 sm:w-56 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9FA998]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Knoten / Lebensraum suchen…"
              className="h-8 border-[#232B20] bg-[#0B0F0A] pl-8 text-xs text-[#F2F4EE] placeholder:text-[#737C6D]"
            />
          </div>

          <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-[#232B20] bg-[#0B0F0A] p-0.5">
            {[
              { id: "all", label: `Alle ${counts.all}` },
              { id: "lebensraum", label: `Räume ${counts.lebensraum}` },
              { id: "konzept", label: `Konzepte ${counts.konzept}` },
              { id: "tierart", label: `Arten ${counts.tierart}` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategory(f.id)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  category === f.id
                    ? "bg-[#A9C23F] text-[#0B0F0A]"
                    : "text-[#9FA998] hover:text-[#F2F4EE]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-lg border border-[#232B20] bg-[#0B0F0A] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                viewMode === "graph" ? "bg-[#1B2419] text-[#A9C23F]" : "text-[#9FA998]"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                viewMode === "list" ? "bg-[#1B2419] text-[#A9C23F]" : "text-[#9FA998]"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: 8-col Interactive Graph/List + 4-col Inspector */}
      <div className="grid lg:grid-cols-12">
        <div className="relative min-w-0 lg:col-span-8">
          {viewMode === "graph" ? (
            <div className="relative h-[360px] w-full bg-[radial-gradient(circle_at_50%_45%,rgba(169,194,63,0.07),transparent_65%)] sm:h-[460px] lg:h-[510px]">
              {/* Legend + Zoom Controls */}
              <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2 text-[11px] text-[#9FA998]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#232B20] bg-[#111610]/90 px-2.5 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#A9C23F]" />
                  Lebensraum
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#232B20] bg-[#111610]/90 px-2.5 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                  Konzept
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#232B20] bg-[#111610]/90 px-2.5 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-[#CBD5C0]" />
                  Tierart
                </span>
              </div>

              <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-[#232B20] bg-[#111610]/90 p-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.2).toFixed(2))))}
                  className="rounded p-1.5 text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE]"
                  title="Herauszoomen"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded p-1.5 text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE]"
                  title="Zoom zurücksetzen"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))))}
                  className="rounded p-1.5 text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE]"
                  title="Heranzoomen"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <svg
                ref={svgRef}
                viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
                className="h-full w-full select-none"
                role="img"
                aria-label="Interaktiver Obsidian Wissens-Graph"
              >
                {/* Edges */}
                <g>
                  {layoutLinks.map((link, idx) => {
                    const s = link.source as GraphNode;
                    const t = link.target as GraphNode;
                    const touchesFocus = s.slug === focusSlug || t.slug === focusSlug;
                    const matchesFilter =
                      !isFiltering || (matchingSlugs.has(s.slug) && matchingSlugs.has(t.slug));
                    let stroke = "rgba(159, 169, 152, 0.20)";
                    let strokeWidth = 0.9;
                    let opacity = matchesFilter ? 0.85 : 0.08;

                    if (touchesFocus) {
                      stroke = "#A9C23F";
                      strokeWidth = 1.8;
                      opacity = 0.95;
                    } else if (hoveredSlug) {
                      opacity = 0.06;
                    }

                    return (
                      <line
                        key={idx}
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        style={{ transition: "opacity 160ms ease, stroke 160ms ease" }}
                      />
                    );
                  })}
                </g>

                {/* Nodes */}
                <g>
                  {layoutNodes.map((node) => {
                    const isSelected = node.slug === selectedSlug;
                    const isHovered = node.slug === hoveredSlug;
                    const isNeighbor = focusNeighbors.has(node.slug);
                    const matchesFilter = matchingSlugs.has(node.slug);

                    const dimByHover = hoveredSlug !== null && !isHovered && !isNeighbor;
                    const dimByFilter = isFiltering && !matchesFilter;
                    const opacity = dimByFilter ? 0.1 : dimByHover ? 0.16 : 1;

                    const r = nodeBaseRadius(node) + (isSelected || isHovered ? 2 : 0);
                    const showLabel =
                      isSelected ||
                      isHovered ||
                      isNeighbor ||
                      node.category === "lebensraum" ||
                      (isFiltering && matchesFilter && matchingSlugs.size <= 16);

                    return (
                      <g
                        key={node.slug}
                        transform={`translate(${node.x}, ${node.y})`}
                        onMouseEnter={() => setHoveredSlug(node.slug)}
                        onMouseLeave={() => setHoveredSlug(null)}
                        onClick={() => selectNode(node.slug)}
                        style={{ cursor: "pointer", opacity, transition: "opacity 160ms ease" }}
                      >
                        {(isSelected || node.category === "lebensraum") && (
                          <circle
                            r={r + 4.5}
                            fill="none"
                            stroke="#A9C23F"
                            strokeOpacity={isSelected ? 0.85 : 0.25}
                            strokeWidth={isSelected ? 2 : 1}
                          />
                        )}
                        <circle
                          r={r}
                          fill={isSelected ? "#A9C23F" : nodeColor(node.category)}
                        />
                        {showLabel && (
                          <text
                            x={r + 5}
                            y={3.5}
                            fill={isSelected || isHovered ? "#FFFFFF" : "#D3DACD"}
                            fontSize={node.category === "lebensraum" ? 11.5 : 10}
                            fontWeight={isSelected || node.category === "lebensraum" ? 700 : 500}
                            fontFamily="Inter, system-ui, sans-serif"
                            style={{ pointerEvents: "none" }}
                          >
                            {node.title}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          ) : (
            <div className="h-[360px] overflow-y-auto p-3 sm:h-[460px] lg:h-[510px]">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {filteredList.map((art) => {
                  const isSel = art.slug === selected.slug;
                  return (
                    <button
                      key={art.slug}
                      type="button"
                      onClick={() => selectNode(art.slug)}
                      className={`flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        isSel
                          ? "border-[#A9C23F] bg-[#1B2419] text-[#F2F4EE]"
                          : "border-[#232B20] bg-[#111610] text-[#D3DACD] hover:border-[#3A4634]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{art.title}</div>
                        <div className="truncate text-[11px] text-[#9FA998]">{art.habitat}</div>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#232B20] px-2 py-0.5 text-[10px] text-[#9FA998]">
                        {art.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 4-col Obsidian Article Inspector */}
        <div className="flex min-w-0 flex-col justify-between gap-4 border-t border-[#232B20] bg-[#111610] p-5 lg:col-span-4 lg:border-l lg:border-t-0">
          <div className="space-y-4">
            {/* Breadcrumb Trail */}
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto text-[11px] text-[#9FA998]">
              <span className="shrink-0 uppercase tracking-wider">Pfad:</span>
              {trail.map((step, i) => {
                const n = bySlug.get(step);
                return (
                  <span key={`${step}-${i}`} className="inline-flex shrink-0 items-center gap-1">
                    {i > 0 && <ArrowRight className="h-3 w-3 text-[#586B12]" />}
                    <button
                      type="button"
                      onClick={() => setSelectedSlug(step)}
                      className="rounded bg-[#171E15] px-1.5 py-0.5 font-mono text-[#D3DACD] hover:text-[#A9C23F]"
                    >
                      {n?.title || step}
                    </button>
                  </span>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="lime" className="text-[11px]">
                  {selected.category}
                </Badge>
                <span className="text-xs text-[#9FA998]">{selected.habitat}</span>
              </div>
              <h4 className="wrap-safe font-display text-xl font-bold text-[#F2F4EE]">
                {selected.title}
              </h4>
            </div>

            {/* Clean Structured Frontmatter Grid (toggleable raw YAML) */}
            <div className="rounded-xl border border-[#232B20] bg-[#0B0F0A] p-3 text-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#9FA998]">
                  Frontmatter-Metadaten
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawYaml((s) => !s)}
                  className="font-mono text-[10px] text-[#A9C23F] hover:underline"
                >
                  {showRawYaml ? "Strukturiert" : "Raw YAML"}
                </button>
              </div>
              {showRawYaml ? (
                <pre className="overflow-x-auto whitespace-pre font-mono text-[11px] text-[#CBD5C0]">
                  {[
                    "---",
                    `title: "${selected.title}"`,
                    `category: ${selected.category}`,
                    `habitat: "${selected.habitat}"`,
                    `status: "${selected.status}"`,
                    `source_file: "${selected.source_file}"`,
                    `tags: [${selected.tags.join(", ")}]`,
                    "---",
                  ].join("\n")}
                </pre>
              ) : (
                <div className="grid grid-cols-[54px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 text-[11px]">
                  <div className="text-[#9FA998]">Status</div>
                  <div className="font-medium text-[#F2F4EE]">{selected.status}</div>
                  <div className="text-[#9FA998]">Quelle</div>
                  <div className="truncate font-mono text-[#A9C23F]" title={selected.source_file}>
                    {selected.source_file}
                  </div>
                  <div className="text-[#9FA998]">Tags</div>
                  <div className="font-mono text-[#CBD5C0]">{selected.tags.join(" · ")}</div>
                </div>
              )}
            </div>

            <p className="text-xs leading-relaxed text-[#D3DACD]">{selected.summary}</p>
          </div>

          {/* Concise Clickable [[Wikilinks]] */}
          <div className="space-y-2 border-t border-[#232B20] pt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9FA998]">
              <Link2 className="h-3.5 w-3.5 text-[#A9C23F]" />
              Verknüpfte [[Wikilinks]]
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.related.map((relSlug) => {
                const target = bySlug.get(relSlug);
                if (!target) return null;
                return (
                  <button
                    key={relSlug}
                    type="button"
                    onClick={() => selectNode(relSlug)}
                    className="wrap-safe rounded-lg border border-[#232B20] bg-[#171E15] px-2.5 py-1 text-left font-mono text-[11px] font-medium text-[#A9C23F] transition-colors hover:border-[#A9C23F] hover:bg-[#1B2419]"
                  >
                    [[{target.title}]]
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
