import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
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
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  Link2,
  List,
  Minus,
  Network,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Square,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { VaultArticle } from "@/types/workshop";

const RAG_WALK_STEPS: { slug: string; note: string }[] = [
  {
    slug: "anemonenfische",
    note: "Start · [[anemonenfische]]: Geringer Sialinsäure-Anteil schützt vor Nesselzellen",
  },
  {
    slug: "seeanemonen",
    note: "Sprung 1/5 · [[seeanemonen]]: 7 von 10 Symbioseanemonen in Stichodactylidae",
  },
  {
    slug: "symbiose",
    note: "Sprung 2/5 · [[symbiose]]: Ektosymbiose (Clownfisch) vs. Endosymbiose (Koralle)",
  },
  {
    slug: "steinkorallen",
    note: "Sprung 3/5 · [[steinkorallen]]: Riffbildung bei 20–29 °C mit Zooxanthellen",
  },
  {
    slug: "korallenbleiche",
    note: "Sprung 4/5 · [[korallenbleiche]]: Ab ~29 °C Abstoßung, Tod binnen ~8 Wochen",
  },
  {
    slug: "korallenriff",
    note: "Sprung 5/5 · [[korallenriff]]: Synthese komplett · 70–90 % Wellenschutz",
  },
];

export interface ObsidianKnowledgeGraphProps {
  articles: VaultArticle[];
  vaultIndexMarkdown?: string;
  projectorMode?: boolean;
  externalSelectedSlug?: string;
  onSelectArticle?: (article: VaultArticle) => void;
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

function normSearch(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

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

export function ObsidianKnowledgeGraph({
  articles,
  vaultIndexMarkdown,
  projectorMode = false,
  externalSelectedSlug,
  onSelectArticle,
}: ObsidianKnowledgeGraphProps) {
  const prefersReduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"graph" | "list" | "index">("graph");
  const [selectedSlug, setSelectedSlug] = useState<string>("anemonenfische");
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>(["anemonenfische"]);
  const [zoom, setZoom] = useState<number>(1);
  const [showRawYaml, setShowRawYaml] = useState<boolean>(false);
  const [ragWalkIdx, setRagWalkIdx] = useState<number | null>(null);
  const [ragWalkPlaying, setRagWalkPlaying] = useState<boolean>(false);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});
  const draggingSlugRef = useRef<string | null>(null);
  const movedDuringDragRef = useRef<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const bySlug = useMemo(() => {
    const map = new Map<string, VaultArticle>();
    for (const a of articles) map.set(a.slug, a);
    return map;
  }, [articles]);

  useEffect(() => {
    if (!externalSelectedSlug) return;
    const art = bySlug.get(externalSelectedSlug);
    if (!art) return;
    setRagWalkPlaying(false);
    setSelectedSlug(externalSelectedSlug);
    setTrail((prev) =>
      prev[prev.length - 1] === externalSelectedSlug
        ? prev
        : [...prev.slice(-4), externalSelectedSlug]
    );
  }, [externalSelectedSlug, bySlug]);

  useEffect(() => {
    if (ragWalkIdx === null) return;
    const step = RAG_WALK_STEPS[ragWalkIdx];
    if (step) {
      setSelectedSlug(step.slug);
      setTrail(RAG_WALK_STEPS.slice(0, ragWalkIdx + 1).map((s) => s.slug));
      const art = bySlug.get(step.slug);
      if (art) onSelectArticle?.(art);
    }
    if (!ragWalkPlaying) return;
    const timer = window.setTimeout(
      () => {
        if (ragWalkIdx + 1 < RAG_WALK_STEPS.length) {
          setRagWalkIdx(ragWalkIdx + 1);
        } else {
          setRagWalkPlaying(false);
        }
      },
      prefersReduced ? 2200 : 1600
    );
    return () => window.clearTimeout(timer);
  }, [ragWalkIdx, ragWalkPlaying, prefersReduced, bySlug, onSelectArticle]);

  function clientToSvg(clientX: number, clientY: number): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const mapped = pt.matrixTransform(ctm.inverse());
    return {
      x: Math.max(24, Math.min(WIDTH - 24, mapped.x)),
      y: Math.max(24, Math.min(HEIGHT - 24, mapped.y)),
    };
  }

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
      .force("charge", forceManyBody().strength(-120))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "x",
        forceX<GraphNode>((d) => (HABITAT_ANCHORS[d.habitat] || HABITAT_ANCHORS["Übergreifend"]).x).strength(0.08)
      )
      .force(
        "y",
        forceY<GraphNode>((d) => (HABITAT_ANCHORS[d.habitat] || HABITAT_ANCHORS["Übergreifend"]).y).strength(0.08)
      )
      .force("collide", forceCollide<GraphNode>((d) => nodeBaseRadius(d) + 14))
      .stop();

    for (let i = 0; i < 150; i += 1) {
      sim.tick();
    }

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
    const qRaw = query.trim().toLowerCase();
    const qNorm = normSearch(query.trim());
    const matched = new Set<string>();
    for (const a of articles) {
      if (category !== "all" && a.category !== category) continue;
      if (
        !qRaw ||
        a.title.toLowerCase().includes(qRaw) ||
        normSearch(a.title).includes(qNorm) ||
        a.slug.toLowerCase().includes(qRaw) ||
        a.habitat.toLowerCase().includes(qRaw) ||
        normSearch(a.habitat).includes(qNorm) ||
        a.summary.toLowerCase().includes(qRaw) ||
        normSearch(a.summary).includes(qNorm) ||
        a.tags.some((t) => t.toLowerCase().includes(qRaw) || normSearch(t).includes(qNorm))
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

  const walkedSlugs = useMemo(
    () =>
      ragWalkIdx !== null
        ? new Set(RAG_WALK_STEPS.slice(0, ragWalkIdx + 1).map((x) => x.slug))
        : null,
    [ragWalkIdx]
  );

  const selected = bySlug.get(selectedSlug) ?? articles[0];
  const focusSlug = hoveredSlug || selectedSlug;
  const focusNeighbors = neighborsMap.get(focusSlug) || new Set<string>();
  const isFiltering = query.trim().length > 0 || category !== "all";

  const visibleLabelSlugs = useMemo(() => {
    const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const visible = new Set<string>();

    const priorityScore = (n: GraphNode) => {
      if (n.slug === hoveredSlug) return 6;
      if (n.slug === selectedSlug) return 5;
      if (walkedSlugs?.has(n.slug)) return 4;
      if (n.category === "lebensraum") return 3;
      if (focusNeighbors.has(n.slug)) return 2;
      if (isFiltering && matchingSlugs.has(n.slug) && matchingSlugs.size <= 16) return 1;
      return 0;
    };

    const candidates = layoutNodes
      .map((n) => ({ n, prio: priorityScore(n) }))
      .filter((c) => c.prio > 0)
      .sort((a, b) => b.prio - a.prio);

    for (const { n, prio } of candidates) {
      const nx = dragPositions[n.slug]?.x ?? n.x;
      const ny = dragPositions[n.slug]?.y ?? n.y;
      const r = nodeBaseRadius(n) + (n.slug === selectedSlug || n.slug === hoveredSlug ? 2 : 0);
      const labelW = Math.max(26, n.title.length * 6.3 + 8);
      const box = { x1: nx + r + 4, y1: ny - 8, x2: nx + r + 4 + labelW, y2: ny + 7 };
      const collides =
        prio < 5 &&
        placed.some((p) => !(box.x2 < p.x1 || box.x1 > p.x2 || box.y2 < p.y1 || box.y1 > p.y2));
      if (!collides) {
        visible.add(n.slug);
        placed.push(box);
      }
    }
    return visible;
  }, [layoutNodes, dragPositions, selectedSlug, hoveredSlug, walkedSlugs, focusNeighbors, isFiltering, matchingSlugs]);

  function resetFilters() {
    setQuery("");
    setCategory("all");
  }

  function selectNode(slug: string) {
    const art = bySlug.get(slug);
    if (!art) return;
    setSelectedSlug(slug);
    setTrail((prev) => (prev[prev.length - 1] === slug ? prev : [...prev.slice(-4), slug]));
    onSelectArticle?.(art);
  }

  function handlePlayPause() {
    setViewMode("graph");
    if (ragWalkIdx === null) {
      setRagWalkIdx(0);
      setRagWalkPlaying(true);
      return;
    }
    if (ragWalkPlaying) {
      setRagWalkPlaying(false);
    } else {
      if (ragWalkIdx >= RAG_WALK_STEPS.length - 1) setRagWalkIdx(0);
      setRagWalkPlaying(true);
    }
  }

  function handlePrevStep() {
    setViewMode("graph");
    setRagWalkPlaying(false);
    setRagWalkIdx((i) => (i === null ? 0 : Math.max(0, i - 1)));
  }

  function handleNextStep() {
    setViewMode("graph");
    setRagWalkPlaying(false);
    setRagWalkIdx((i) => (i === null ? 0 : Math.min(RAG_WALK_STEPS.length - 1, i + 1)));
  }

  const viewW = WIDTH / zoom;
  const viewH = HEIGHT / zoom;
  const viewX = (WIDTH - viewW) / 2;
  const viewY = (HEIGHT - viewH) / 2;

  const canvasHeightClass = projectorMode
    ? "h-[400px] sm:h-[500px] lg:h-[580px]"
    : "h-[360px] sm:h-[460px] lg:h-[510px]";

  return (
    <div className="overflow-hidden rounded-2xl border border-[#232B20] bg-[#0B0F0A] text-[#F2F4EE] shadow-xl">
      {/* Top Graph Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[#232B20] bg-[#111610] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#A9C23F]/15 text-[#A9C23F]">
            <Network className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div
              className={`font-display font-bold text-[#F2F4EE] ${
                projectorMode ? "text-lg sm:text-xl" : "text-sm sm:text-base"
              }`}
            >
              Interaktive Wissenskarte · {articles.length} Artikel &amp; {layoutLinks.length} Querverweise
            </div>
            <div className="text-xs text-[#9FA998]">
              Klick auf einen Kreis folgt Verknüpfungen · Ziehen bewegt Knoten
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* RAG Walk Controls: Play/Pause + Prev + Next + Stop + 68 Dateien vs. 5 Sprünge */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-[#232B20] bg-[#0B0F0A] p-1">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                ragWalkPlaying
                  ? "bg-[#A9C23F] text-[#0B0F0A]"
                  : "bg-[#1B2419] text-[#A9C23F] hover:bg-[#243021]"
              }`}
            >
              {ragWalkPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>
                {ragWalkPlaying ? "Pause" : ragWalkIdx !== null ? "Weiter" : "Suchpfad"}
              </span>
            </button>
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={ragWalkIdx === 0}
              aria-label="Vorheriger Schritt"
              title="Vorheriger Schritt"
              className="inline-flex h-9 w-8 items-center justify-center rounded-md text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              disabled={ragWalkIdx !== null && ragWalkIdx >= RAG_WALK_STEPS.length - 1}
              aria-label="Nächster Schritt"
              title="Nächster Schritt"
              className="inline-flex h-9 w-8 items-center justify-center rounded-md text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {ragWalkIdx !== null && (
              <button
                type="button"
                onClick={() => {
                  setRagWalkPlaying(false);
                  setRagWalkIdx(null);
                }}
                aria-label="Suchpfad zurücksetzen"
                title="Suchpfad zurücksetzen"
                className="inline-flex h-9 w-8 items-center justify-center rounded-md text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE]"
              >
                <Square className="h-3 w-3" />
              </button>
            )}
          </div>

          <span className="num-tabular shrink-0 rounded-lg border border-[#A9C23F]/40 bg-[#1B2419] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#A9C23F]">
            {articles.length} Dateien vs. 5 Sprünge
            {ragWalkIdx !== null ? ` · ${ragWalkIdx}/5` : ""}
          </span>

          <div className="relative min-w-[190px] flex-1 sm:w-52 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9FA998]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Artikel / Habitat suchen…"
              className="h-9 border-[#232B20] bg-[#0B0F0A] pl-8 pr-16 text-xs text-[#F2F4EE] placeholder:text-[#737C6D]"
            />
            <span className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#9FA998]">
              {filteredList.length}/{articles.length}
            </span>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Suche zurücksetzen"
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[#9FA998] hover:text-[#F2F4EE]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-[#232B20] bg-[#0B0F0A] p-1">
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
                className={`min-h-[36px] shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  category === f.id
                    ? "bg-[#A9C23F] text-[#0B0F0A]"
                    : "text-[#9FA998] hover:text-[#F2F4EE]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-lg border border-[#232B20] bg-[#0B0F0A] p-1">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                viewMode === "graph" ? "bg-[#1B2419] text-[#A9C23F]" : "text-[#9FA998]"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                viewMode === "list" ? "bg-[#1B2419] text-[#A9C23F]" : "text-[#9FA998]"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Liste</span>
            </button>
            {vaultIndexMarkdown && (
              <button
                type="button"
                onClick={() => setViewMode("index")}
                className={`inline-flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1 font-mono text-xs font-medium ${
                  viewMode === "index" ? "bg-[#1B2419] text-[#A9C23F]" : "text-[#9FA998]"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>_index.md</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split: 8-col Interactive Graph/List/Index + 4-col Inspector */}
      <div className="grid lg:grid-cols-12">
        <div className="relative min-w-0 lg:col-span-8">
          <div
            className={
              viewMode === "graph"
                ? `relative w-full bg-[radial-gradient(circle_at_50%_45%,rgba(169,194,63,0.07),transparent_65%)] ${canvasHeightClass}`
                : "hidden"
            }
          >
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
                className="inline-flex h-10 w-10 items-center justify-center rounded text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE]"
                title="Herauszoomen"
                aria-label="Herauszoomen"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE]"
                title="Zoom zurücksetzen"
                aria-label="Zoom zurücksetzen"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))))}
                className="inline-flex h-10 w-10 items-center justify-center rounded text-[#9FA998] hover:bg-[#1B2419] hover:text-[#F2F4EE]"
                title="Heranzoomen"
                aria-label="Heranzoomen"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <svg
              ref={svgRef}
              viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
              className="h-full w-full select-none touch-none"
              role="img"
              aria-label="Interaktiver Obsidian Wissens-Graph"
              onPointerMove={(e) => {
                const slug = draggingSlugRef.current;
                if (!slug) return;
                const pt = clientToSvg(e.clientX, e.clientY);
                if (!pt) return;
                movedDuringDragRef.current = true;
                setDragPositions((prev) => ({ ...prev, [slug]: pt }));
              }}
              onPointerUp={() => {
                draggingSlugRef.current = null;
              }}
              onPointerLeave={() => {
                draggingSlugRef.current = null;
              }}
            >
              <defs>
                <filter id="v7-lime-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Edges */}
              <g>
                {layoutLinks.map((link, idx) => {
                  const s = link.source as GraphNode;
                  const t = link.target as GraphNode;
                  const sx = dragPositions[s.slug]?.x ?? s.x;
                  const sy = dragPositions[s.slug]?.y ?? s.y;
                  const tx = dragPositions[t.slug]?.x ?? t.x;
                  const ty = dragPositions[t.slug]?.y ?? t.y;

                  const inRagWalk =
                    walkedSlugs !== null && walkedSlugs.has(s.slug) && walkedSlugs.has(t.slug);
                  const touchesFocus = s.slug === focusSlug || t.slug === focusSlug;
                  const matchesFilter =
                    !isFiltering || (matchingSlugs.has(s.slug) && matchingSlugs.has(t.slug));
                  let stroke = "rgba(159, 169, 152, 0.20)";
                  let strokeWidth = 0.9;
                  let opacity = matchesFilter ? 0.85 : 0.08;

                  if (inRagWalk || touchesFocus) {
                    stroke = "#A9C23F";
                    strokeWidth = inRagWalk ? 2.2 : 1.8;
                    opacity = 0.95;
                  } else if (hoveredSlug || ragWalkIdx !== null) {
                    opacity = 0.07;
                  }

                  return (
                    <line
                      key={idx}
                      x1={sx}
                      y1={sy}
                      x2={tx}
                      y2={ty}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      opacity={opacity}
                      filter={inRagWalk ? "url(#v7-lime-glow)" : undefined}
                      style={{ transition: "opacity 160ms ease, stroke 160ms ease" }}
                    />
                  );
                })}
              </g>

              {/* Nodes */}
              <g>
                {layoutNodes.map((node) => {
                  const nx = dragPositions[node.slug]?.x ?? node.x;
                  const ny = dragPositions[node.slug]?.y ?? node.y;
                  const isWalked = walkedSlugs !== null && walkedSlugs.has(node.slug);
                  const isSelected = node.slug === selectedSlug;
                  const isHovered = node.slug === hoveredSlug;
                  const isNeighbor = focusNeighbors.has(node.slug);
                  const matchesFilter = matchingSlugs.has(node.slug);

                  const dimByWalk = ragWalkIdx !== null && !isWalked && !isNeighbor;
                  const dimByHover = hoveredSlug !== null && !isHovered && !isNeighbor;
                  const dimByFilter = isFiltering && !matchesFilter;
                  const opacity = dimByFilter ? 0.1 : dimByWalk ? 0.14 : dimByHover ? 0.16 : 1;

                  const r = nodeBaseRadius(node) + (isSelected || isHovered ? 2 : 0);
                  const showLabel = visibleLabelSlugs.has(node.slug);
                  const baseFontSize = node.category === "lebensraum" ? 11.5 : 10;

                  return (
                    <g
                      key={node.slug}
                      transform={`translate(${nx}, ${ny})`}
                      onMouseEnter={() => setHoveredSlug(node.slug)}
                      onMouseLeave={() => setHoveredSlug(null)}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        draggingSlugRef.current = node.slug;
                        movedDuringDragRef.current = false;
                      }}
                      onClick={() => {
                        if (movedDuringDragRef.current) return;
                        setRagWalkPlaying(false);
                        setRagWalkIdx(null);
                        selectNode(node.slug);
                      }}
                      style={{ cursor: "grab", opacity, transition: "opacity 160ms ease" }}
                    >
                      {(isSelected || isWalked || node.category === "lebensraum") && (
                        <circle
                          r={r + 4.5}
                          fill="none"
                          stroke="#A9C23F"
                          strokeOpacity={isSelected || isWalked ? 0.9 : 0.25}
                          strokeWidth={isSelected || isWalked ? 2 : 1}
                          filter={isSelected || isWalked ? "url(#v7-lime-glow)" : undefined}
                        />
                      )}
                      <circle
                        r={r}
                        fill={isSelected || isWalked ? "#A9C23F" : nodeColor(node.category)}
                      />
                      {showLabel && (
                        <text
                          x={r + 5}
                          y={3.5}
                          fill={isSelected || isHovered || isWalked ? "#FFFFFF" : "#D3DACD"}
                          fontSize={projectorMode ? baseFontSize + 2 : baseFontSize}
                          fontWeight={isSelected || isWalked || node.category === "lebensraum" ? 700 : 500}
                          fontFamily="Inter, system-ui, sans-serif"
                          style={{
                            pointerEvents: "none",
                            paintOrder: "stroke",
                            stroke: "#0B0F0A",
                            strokeWidth: 3.5,
                            strokeLinejoin: "round",
                          }}
                        >
                          {node.title}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {isFiltering && matchingSlugs.size === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <div className="rounded-2xl border border-[#232B20] bg-[#111610]/95 px-5 py-4 text-center shadow-xl">
                  <div className="font-display text-sm font-bold text-[#F2F4EE]">
                    0 Treffer im Wissens-Graph
                  </div>
                  <p className="mt-1 text-xs text-[#9FA998]">
                    Keine Artikel für „{query || category}“ gefunden (mögliche Fangfrage!).
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 rounded-lg bg-[#A9C23F] px-3 py-1.5 text-xs font-semibold text-[#0B0F0A]"
                  >
                    Filter zurücksetzen
                  </button>
                </div>
              </div>
            )}

            {ragWalkIdx !== null && RAG_WALK_STEPS[ragWalkIdx] && (
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[calc(100%-8.5rem)] rounded-xl border border-[#A9C23F]/50 bg-[#111610]/95 px-3 py-2 text-xs font-medium text-[#F2F4EE] shadow-lg">
                {RAG_WALK_STEPS[ragWalkIdx].note}
              </div>
            )}
          </div>

          <div
            className={
              viewMode === "list"
                ? `overflow-y-auto p-3 ${canvasHeightClass}`
                : "hidden"
            }
          >
            {filteredList.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#232B20] p-6 text-center">
                <div className="font-display text-sm font-bold text-[#F2F4EE]">0 Treffer gefunden</div>
                <p className="max-w-sm text-xs text-[#9FA998]">
                  Kein Artikel im {articles.length}-Dateien-Vault passt zu „{query || category}“.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-1 rounded-lg bg-[#A9C23F] px-3 py-1.5 text-xs font-semibold text-[#0B0F0A]"
                >
                  Filter zurücksetzen
                </button>
              </div>
            ) : (
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
            )}
          </div>

          {vaultIndexMarkdown && (
            <div
              className={
                viewMode === "index"
                  ? `overflow-y-auto p-4 ${canvasHeightClass}`
                  : "hidden"
              }
            >
              <pre className="whitespace-pre-wrap break-words rounded-xl border border-[#232B20] bg-[#111610] p-4 font-mono text-xs leading-relaxed text-[#D3DACD]">
                {vaultIndexMarkdown}
              </pre>
            </div>
          )}
        </div>

        {/* Right 4-col Obsidian Article Inspector */}
        <div className="flex min-w-0 flex-col justify-between gap-4 border-t border-[#232B20] bg-[#111610] p-5 lg:col-span-4 lg:border-l lg:border-t-0">
          <div className="space-y-4">
            {/* Breadcrumb Trail */}
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#9FA998]">
              <span className="shrink-0 uppercase tracking-wider">Pfad:</span>
              {trail.map((step, i) => {
                const n = bySlug.get(step);
                return (
                  <span key={`${step}-${i}`} className="inline-flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => selectNode(step)}
                      className="rounded bg-[#171E15] px-1.5 py-0.5 font-mono text-[#D3DACD] hover:text-[#A9C23F]"
                    >
                      {n?.title || step}
                    </button>
                    {i < trail.length - 1 && <ArrowRight className="h-3 w-3 text-[#586B12]" />}
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
              <h4
                className={`wrap-safe font-display font-bold text-[#F2F4EE] ${
                  projectorMode ? "text-2xl" : "text-xl"
                }`}
              >
                {selected.title}
              </h4>
            </div>

            {/* Clean Structured Frontmatter Grid (fixed gap-3 + shrink-0!) */}
            <div className="rounded-xl border border-[#232B20] bg-[#0B0F0A] p-3 text-xs">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#9FA998]">
                  Steckbrief (Metadaten)
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawYaml((s) => !s)}
                  className="shrink-0 font-mono text-[10px] text-[#A9C23F] hover:underline"
                >
                  {showRawYaml ? "Übersicht" : "Quelltext (YAML)"}
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
                  <div className="break-all font-mono text-[#A9C23F]">{selected.source_file}</div>
                  <div className="text-[#9FA998]">Tags</div>
                  <div className="font-mono text-[#CBD5C0]">{selected.tags.join(" · ")}</div>
                </div>
              )}
            </div>

            <p
              className={`leading-relaxed text-[#D3DACD] ${
                projectorMode ? "text-sm" : "text-xs"
              }`}
            >
              {selected.summary}
            </p>
          </div>

          {/* Concise Clickable Links */}
          <div className="space-y-2 border-t border-[#232B20] pt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9FA998]">
              <Link2 className="h-3.5 w-3.5 text-[#A9C23F]" />
              Verknüpfte Artikel (Querverweise)
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
