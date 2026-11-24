import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Send, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PromptMethod } from "@/types/workshop";

interface PromptMethodComparatorProps {
  task: string;
  methods: PromptMethod[];
  track: "A" | "B";
  arcticAndReefBundle: string;
  onShareMethod: (methodName: string, promptTask: string) => void;
  onCopyPrompt?: () => void;
}

interface OutputSimulationProps {
  methodId: string;
}

function OutputSimulationPreview({ methodId }: OutputSimulationProps) {
  if (methodId === "zero-shot") {
    return (
      <div className="space-y-2 rounded-xl border border-rose-300/60 bg-rose-50/60 p-3 text-xs dark:border-rose-500/30 dark:bg-rose-500/10">
        <p className="leading-relaxed text-foreground/90">
          „Der Klimawandel bedroht Eisbären durch schmelzendes Packeis und Korallenriffe durch Erwärmung
          der Ozeane. Besonders stark betroffen sind Jungtiere und tropische Arten weltweit…“
        </p>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-500/20 dark:text-rose-300">
            Ohne Quellenbeleg
          </span>
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-500/20 dark:text-rose-300">
            Trainingswissen vermischt
          </span>
        </div>
      </div>
    );
  }

  if (methodId === "costar") {
    return (
      <div className="space-y-2 rounded-xl border bg-muted/40 p-3 text-xs">
        <div className="font-semibold text-foreground">Arktis &amp; Eisbär</div>
        <div className="flex items-start gap-1.5 text-muted-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />
          <span>
            Arktischer Ozean könnte ab 2030 im Sommer eisfrei sein{" "}
            <code className="text-brand-ink">(arktis.md)</code>.
          </span>
        </div>
        <div className="pt-0.5 font-semibold text-foreground">Korallenriff &amp; Steinkorallen</div>
        <div className="flex items-start gap-1.5 text-muted-foreground">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />
          <span>
            Ab ~29 °C Abstoßung der Zooxanthellen{" "}
            <code className="text-brand-ink">(korallenbleiche.md)</code>.
          </span>
        </div>
      </div>
    );
  }

  if (methodId === "few-shot") {
    return (
      <div className="space-y-1.5 rounded-xl border bg-muted/40 p-3 font-mono text-[11px]">
        <div className="wrap-safe rounded bg-card px-2 py-1">
          <span className="font-semibold text-brand-ink">Arktis</span> | Eisbär | Ab 2030 eisfreie
          Sommer möglich | eisbaer.md
        </div>
        <div className="wrap-safe rounded bg-card px-2 py-1">
          <span className="font-semibold text-brand-ink">Korallenriff</span> | Steinkorallen | Bleiche
          ab ~29 °C, Tod nach 8 Wochen | korallenbleiche.md
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border text-[11px]">
      <div className="grid grid-cols-3 bg-muted/70 px-2.5 py-1.5 font-semibold text-foreground">
        <span>Bereich</span>
        <span>Belegter Befund</span>
        <span>Quelle</span>
      </div>
      <div className="grid grid-cols-3 border-t px-2.5 py-1.5 text-muted-foreground">
        <span className="font-medium text-foreground">Eisbär</span>
        <span>Gewichtsverlust im Sommer</span>
        <span className="font-mono text-brand-ink">eisbaer.md</span>
      </div>
      <div className="grid grid-cols-3 border-t px-2.5 py-1.5 text-muted-foreground">
        <span className="font-medium text-foreground">Schutzbudget</span>
        <span className="font-mono text-amber-700 dark:text-amber-300">[Nicht in Quelle]</span>
        <span>—</span>
      </div>
    </div>
  );
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
  track,
  arcticAndReefBundle,
  onShareMethod,
  onCopyPrompt,
}: PromptMethodComparatorProps) {
  const [selectedId, setSelectedId] = useState<string>(methods[1]?.id || methods[0]?.id);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [pinnedPart, setPinnedPart] = useState<string | null>(null);

  const active = useMemo(
    () => methods.find((m) => m.id === selectedId) || methods[0],
    [methods, selectedId]
  );

  const combinedTrackAPack = useMemo(
    () => `${arcticAndReefBundle}\n\n---\n\nMEIN AUFTRAG (ANHAND DER TEXTE OBEN):\n${active.prompt}`,
    [arcticAndReefBundle, active.prompt]
  );

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

  return (
    <div className="space-y-5">
      {track === "A" && (
        <div className="rounded-2xl border border-brand-lime/40 bg-secondary/45 px-4 py-3 text-xs leading-relaxed text-foreground">
          <strong className="text-brand-ink">Kurzanleitung für deinen Browser-Chat (z. B. ChatGPT, Claude, Gemini): </strong>
          1. Öffne deinen KI-Chat in einem neuen Tab → 2. Wähle unten eine Schreibweise und klicke auf{" "}
          <strong>„Texte + Prompt kopieren“</strong> → 3. Mit <code>Strg+V</code> (Mac: <code>⌘+V</code>) dort einfügen &amp; absenden.
        </div>
      )}

      {/* Shared Benchmark Task Callout */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            1 Aufgabe · 4 Schreibweisen im Test
          </div>
          <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
            „{task}“
          </p>
        </div>
        {track === "A" && (
          <div className="shrink-0">
            <CopyButton
              text={arcticAndReefBundle}
              label="Nur Hintergrund-Texte kopieren"
              toastMessage="Hintergrund-Texte (Arktis & Korallen) in Zwischenablage kopiert"
              variant="secondary"
            />
          </div>
        )}
      </div>

      {/* 4-Method Segmented Switcher (2x2 on narrow mobile, 4-col on sm+) */}
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
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="card-elevated overflow-hidden rounded-2xl border bg-card"
        >
          {/* Method Header + Anatomy Pills */}
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
                {track === "A" && (
                  <CopyButton
                    text={combinedTrackAPack}
                    label="Texte + Prompt kopieren"
                    toastMessage={`Texte + ${active.name} in Zwischenablage kopiert`}
                    variant="default"
                    onCopy={onCopyPrompt}
                  />
                )}
                <CopyButton
                  text={active.prompt}
                  label={track === "A" ? "Nur Prompt kopieren" : "Prompt kopieren"}
                  toastMessage={`${active.name} in Zwischenablage kopiert`}
                  variant={track === "A" ? "outline" : "default"}
                  onCopy={onCopyPrompt}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-muted-foreground">
                Bausteine (klicken zum Markieren):
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
                        ? "border-brand-lime bg-brand-lime text-brand-obsidian font-semibold"
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
                      hot ? "bg-secondary ring-1 ring-brand-lime/60" : ""
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

          {/* Strength / Risk + Expected Output Form */}
          <div className="grid gap-4 border-t p-5 md:grid-cols-2 md:divide-x">
            <div className="space-y-2.5 text-sm">
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

            <div className="space-y-2.5 md:pl-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-brand-ink">
                <Sparkles className="h-3.5 w-3.5" />
                Simulierte KI-Antwortform
              </div>
              <OutputSimulationPreview methodId={active.id} />
              <div className="flex justify-end pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-brand-ink"
                  onClick={() => onShareMethod(active.name, task)}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Optional: Ergebnis im Raum teilen</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
