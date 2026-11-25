import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Download, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { WebChatWorkflowPlayer } from "@/components/guidance/WalkthroughPlayers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExpressPackage, PromptMethod, ToolMode } from "@/types/workshop";

interface PromptMethodComparatorProps {
  task: string;
  methods: PromptMethod[];
  toolMode: ToolMode;
  expressPackage: ExpressPackage;
  onCopyPrompt?: () => void;
}

const ANATOMY_KEYS = [
  "Context",
  "Objective",
  "Style",
  "Tone",
  "Audience",
  "Response",
  "Beispiel 1",
  "Beispiel 2",
  "Aufgabe",
  "Role",
  "Instructions",
  "Steps",
  "End Goal",
  "Narrowing",
];

function matchComponentKey(line: string): string | null {
  for (const key of ANATOMY_KEYS) {
    if (line.startsWith(`${key}:`)) return key;
  }
  return null;
}

const SHORT_TAB_LABELS: Record<string, { title: string; sub: string }> = {
  "zero-shot": { title: "1 · Zero-Shot", sub: "Baseline" },
  costar: { title: "2 · CO-STAR", sub: "Business" },
  "few-shot": { title: "3 · Few-Shot", sub: "Schema" },
  "risen-cot": { title: "4 · RISEN + CoT", sub: "Analyse" },
};

export function PromptMethodComparator({
  task,
  methods,
  toolMode,
  expressPackage,
  onCopyPrompt,
}: PromptMethodComparatorProps) {
  const prefersReduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string>(methods[1]?.id || methods[0]?.id);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [pinnedPart, setPinnedPart] = useState<string | null>(null);

  const active = useMemo(
    () => methods.find((m) => m.id === selectedId) || methods[0],
    [methods, selectedId]
  );

  // Prompt ALWAYS at the very top of the copied bundle!
  const compactBundle = useMemo(
    () =>
      expressPackage.promptHeaderTemplate
        .replace("{{PROMPT}}", active.prompt)
        .replace("{{TEXTS}}", expressPackage.content),
    [expressPackage, active.prompt]
  );

  function downloadTextsMd() {
    const mdContent = [
      `# ${expressPackage.title}`,
      "",
      `Quellen: ${expressPackage.sources.map((s) => `(${s})`).join(", ")}`,
      "",
      expressPackage.content,
    ].join("\n");
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "methoden-kompakt-texte.md";
    a.click();
    URL.revokeObjectURL(url);
    onCopyPrompt?.();
  }

  const activeHighlight = pinnedPart ?? hoveredPart;
  const promptLines = useMemo(() => active.prompt.split("\n"), [active.prompt]);

  function isLineHighlighted(line: string, key: string | null): boolean {
    if (!activeHighlight) return false;
    const normPart = activeHighlight.toLowerCase();
    if (key && normPart.includes(key.toLowerCase())) return true;
    if (normPart.includes("beispiele") && (key === "Beispiel 1" || key === "Beispiel 2")) return true;
    if (normPart.includes("cot") && (key === "Steps" || line.toLowerCase().includes("schritt"))) return true;
    if (normPart.includes("aufgabe")) return key === "Aufgabe" || promptLines.length === 1;
    return false;
  }

  function isTargetLineHighlighted(line: string): boolean {
    if (!activeHighlight) return false;
    const normPart = activeHighlight.toLowerCase();
    const normLine = line.toLowerCase();
    if (normPart.includes("response") || normPart.includes("format") || normPart.includes("schema")) {
      return normLine.includes("|") || normLine.includes("arktis") || normLine.includes("korallen") || normLine.includes("quelle");
    }
    if (normPart.includes("narrowing") || normPart.includes("regel") || normPart.includes("lücke")) {
      return normLine.includes("[nicht in quelle]") || normLine.includes("fehlt");
    }
    if (normPart.includes("context") || normPart.includes("objective") || normPart.includes("goal")) {
      return normLine.includes(".md");
    }
    if (normPart.includes("beispiel")) {
      return normLine.includes("|") || normLine.includes("29") || normLine.includes("2030");
    }
    return true;
  }

  const structuredLines = useMemo(
    () => active.structuredComparison.excerpt.split("\n").filter(Boolean),
    [active.structuredComparison.excerpt]
  );

  return (
    <div className="space-y-5">
      {/* Mode-aware guidance */}
      <div className="rounded-2xl border border-brand-lime/40 bg-secondary/45 px-4 py-3 text-xs leading-relaxed text-foreground">
        {toolMode === "web" ? (
          <>
            <strong className="text-brand-ink">Web-Chat Kurzanleitung: </strong>
            Wähle eine Methode und klicke auf <strong>„Kompakt-Paket (~5.500 Zeichen)“</strong> —
            dein Prompt steht ganz oben, alle 6 Quelltexte mit <code>(datei.md)</code> direkt darunter.
          </>
        ) : toolMode === "desktop" ? (
          <>
            <strong className="text-brand-ink">Desktop &amp; Ordner Hinweis: </strong>
            Du kannst entweder den Ordner <code>stufe-1-chaos/docs/</code> direkt ansprechen oder
            per <strong>„Nur Prompt“</strong> / <strong>„Texte als .md laden“</strong> testen.
          </>
        ) : (
          <>
            <strong className="text-brand-ink">Code-Agent Hinweis: </strong>
            Kopiere per <strong>„Nur Prompt“</strong> direkt in deine CLI/IDE im Ordner{" "}
            <code>stufe-1-chaos/</code> oder lade das kompakte Testpaket als <code>.md</code>.
          </>
        )}
      </div>

      {/* Shared Benchmark Task + Source Tags */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
              1 Aufgabe · 4 Schreibweisen im Test
            </div>
            <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
              „{task}“
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0 self-start sm:self-center"
            onClick={downloadTextsMd}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Texte als .md laden</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-medium text-muted-foreground">Enthaltene Quellen:</span>
          {expressPackage.sources.map((src) => (
            <span
              key={src}
              className="rounded-md border bg-card px-2 py-0.5 font-mono text-[11px] text-brand-ink"
            >
              ({src})
            </span>
          ))}
        </div>
      </div>

      <WebChatWorkflowPlayer toolMode={toolMode} />

      {/* 4-Method Segmented Switcher */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border bg-muted/60 p-1.5 sm:grid-cols-4">
        {methods.map((m) => {
          const isActive = m.id === active.id;
          const short = SHORT_TAB_LABELS[m.id] || { title: m.name, sub: m.badge };
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelectedId(m.id);
                setHoveredPart(null);
                setPinnedPart(null);
              }}
              className={`relative min-w-0 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors sm:text-sm ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="prompt-method-pill"
                  transition={
                    prefersReduced
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                  className="absolute inset-0 rounded-lg bg-card shadow-sm ring-1 ring-border"
                />
              )}
              <span className="relative z-10 block font-semibold leading-tight">{short.title}</span>
              <span className="relative z-10 mt-0.5 block text-[11px] text-muted-foreground">
                {short.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Animated Method Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: prefersReduced ? 0 : 0.16 }}
          className="card-elevated overflow-hidden rounded-2xl border bg-card"
        >
          {/* Method Header + 3 Actions */}
          <div className="space-y-3 border-b p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{active.name}</h3>
                  <Badge variant="secondary">{active.badge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{active.bestFor}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton
                  text={compactBundle}
                  label="Kompakt-Paket (~5.500 Zeichen)"
                  toastMessage={`Prompt (oben) + Kompakt-Texte (${active.name}) kopiert`}
                  variant="default"
                  onCopy={onCopyPrompt}
                />
                <CopyButton
                  text={active.prompt}
                  label="Nur Prompt"
                  toastMessage={`${active.name} (nur Prompt) in Zwischenablage kopiert`}
                  variant="outline"
                  onCopy={onCopyPrompt}
                />
                <Button type="button" size="sm" variant="secondary" onClick={downloadTextsMd}>
                  <Download className="h-3.5 w-3.5" />
                  <span>Texte als .md laden</span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">
                Bausteine (klicken/fahren zeigt Wirkung in der Ziel-Struktur):
              </span>
              {active.components.map((comp) => {
                const isPinned = pinnedPart === comp;
                const isHot = activeHighlight === comp;
                return (
                  <button
                    key={comp}
                    type="button"
                    aria-pressed={isPinned}
                    onMouseEnter={() => setHoveredPart(comp)}
                    onMouseLeave={() => setHoveredPart(null)}
                    onClick={() => setPinnedPart((prev) => (prev === comp ? null : comp))}
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      isHot
                        ? "border-brand-lime bg-brand-lime font-semibold text-brand-obsidian"
                        : "bg-muted/60 text-foreground hover:bg-secondary"
                    }`}
                  >
                    {comp}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formatted Structural Prompt Canvas */}
          <div className="bg-muted/25 p-5">
            <div className="space-y-1.5 rounded-xl border bg-card p-4 font-mono text-xs leading-relaxed sm:text-[13px]">
              {promptLines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                const key = matchComponentKey(line);
                const hot = isLineHighlighted(line, key);
                const rest = key ? line.slice(key.length + 1).trimStart() : line;
                return (
                  <div
                    key={i}
                    className={`wrap-safe rounded-md px-2 py-1 transition-colors ${
                      hot ? "bg-secondary ring-1 ring-brand-lime/70" : ""
                    }`}
                  >
                    {key ? (
                      <>
                        <span className="mr-2 inline-block rounded bg-secondary px-1.5 py-0.5 font-semibold text-brand-ink">
                          {key}:
                        </span>
                        <span className="whitespace-pre-wrap text-foreground">{rest}</span>
                      </>
                    ) : (
                      <span className="whitespace-pre-wrap text-foreground">{line}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strength / Risk Summary */}
          <div className="grid gap-4 border-t bg-muted/15 px-5 py-3.5 text-sm md:grid-cols-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold">Stärke: </span>
                <span className="text-muted-foreground">{active.strength}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold">Grenze: </span>
                <span className="text-muted-foreground">{active.risk}</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Output Comparison: Unstrukturierter Fließtext vs. Saubere Ziel-Struktur */}
          <div className="space-y-3 border-t p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-brand-ink">
                <Sparkles className="h-3.5 w-3.5" />
                Ausgabe-Vergleich: Unstrukturierter Fließtext vs. Saubere Ziel-Struktur
              </div>
              {activeHighlight && (
                <span className="rounded-full bg-brand-lime px-2 py-0.5 font-mono text-[10px] font-bold text-brand-obsidian">
                  Fokus: {activeHighlight}
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Left: Unstrukturierter Fließtext */}
              <div className="space-y-2.5 rounded-xl border border-rose-300/60 bg-rose-50/50 p-4 text-xs dark:border-rose-500/30 dark:bg-rose-500/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-rose-800 dark:text-rose-300">
                    Unstrukturierter Fließtext
                  </span>
                  <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:text-rose-200">
                    {active.unstructuredComparison.label}
                  </span>
                </div>
                <p className="leading-relaxed text-foreground/90">
                  {active.unstructuredComparison.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {active.unstructuredComparison.issues.map((issue) => (
                    <span
                      key={issue}
                      className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Saubere Ziel-Struktur with animated line mapping */}
              <div className="space-y-2.5 rounded-xl border border-[#A9C23F]/60 bg-secondary/30 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-brand-ink">Saubere Ziel-Struktur</span>
                  <Badge variant="lime" className="font-mono text-[10px]">
                    {active.structuredComparison.formatTag}
                  </Badge>
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {active.structuredComparison.label}
                </div>
                <div className="space-y-1 rounded-lg border bg-card p-2.5 font-mono text-[11px] leading-relaxed">
                  {structuredLines.map((line, idx) => {
                    const mapped = isTargetLineHighlighted(line);
                    return (
                      <motion.div
                        key={`${active.id}-${idx}`}
                        animate={
                          mapped && !prefersReduced
                            ? { x: [0, 3, 0] }
                            : { x: 0 }
                        }
                        transition={{ duration: prefersReduced ? 0 : 0.25 }}
                        className={`wrap-safe rounded px-1.5 py-0.5 transition-colors ${
                          mapped
                            ? "bg-secondary/90 ring-1 ring-brand-lime/70 font-medium text-foreground"
                            : "text-foreground/85"
                        }`}
                      >
                        {line}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {active.structuredComparison.highlights.map((hl) => (
                    <span
                      key={hl}
                      className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300"
                    >
                      ✓ {hl}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
