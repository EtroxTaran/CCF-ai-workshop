import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardPaste,
  Code2,
  FileSearch,
  FolderOpen,
  MessageSquarePlus,
  Network,
  Pause,
  Play,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolMode } from "@/types/workshop";

export interface WebChatWorkflowPlayerProps {
  toolMode?: ToolMode;
  sourceCount?: number;
  approxCharsLabel?: string;
  sampleSources?: string[];
  className?: string;
}

export function WebChatWorkflowPlayer({
  toolMode = "web",
  sourceCount = 6,
  approxCharsLabel = "~5.500 Zeichen",
  sampleSources = ["arktis.md", "korallenbleiche.md"],
  className,
}: WebChatWorkflowPlayerProps) {
  const prefersReduced = useReducedMotion();
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  const sA = sampleSources[0] || "quelle-1.md";
  const sB = sampleSources[1] || sA;
  const steps = [
    {
      num: 1,
      title: "Kopieren",
      short: "Kompakt-Paket",
      icon: ClipboardCheck,
      detail: `Klicke auf „Kompakt-Paket (${approxCharsLabel})“ — dein Prompt steht ganz oben, alle ${sourceCount} Quelltexte direkt darunter.`,
      preview: `Zwischenablage: Prompt oben + ${sourceCount} Dateien (${sA} … ${sB})`,
    },
    {
      num: 2,
      title: "Neuer Chat",
      short: "Sauberer Start",
      icon: MessageSquarePlus,
      detail:
        "Öffne in ChatGPT, Claude, Gemini oder Copilot einen frischen Chat (+ Neuer Chat), damit alte Nachrichten nicht stören.",
      preview: "Browser-Tab · + Neuer Chat geöffnet (Kontext 0 %)",
    },
    {
      num: 3,
      title: "Einfügen",
      short: "Strg+V / ⌘+V",
      icon: ClipboardPaste,
      detail: `Füge das Paket mit Strg+V (Mac: ⌘+V) ein — durch die kompakten ${approxCharsLabel} wird nichts abgeschnitten.`,
      preview: `Eingabe: Context + Objective + Response + [${sourceCount} Quelltexte]`,
    },
    {
      num: 4,
      title: "Prüfen",
      short: "Quellen-Check",
      icon: CheckCircle2,
      detail: `Kontrolliere, ob hinter jedem Fakt ein Dateiname wie (${sA}) oder (${sB}) steht.`,
      preview: `Ausgabe: Strukturierte Liste mit (${sA}) & [Nicht in Quelle]`,
    },
  ];

  useEffect(() => {
    if (!playing || prefersReduced) return;
    const id = window.setInterval(() => {
      setStepIdx((prev) => (prev + 1) % steps.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [playing, prefersReduced, steps.length]);

  const active = steps[stepIdx] || steps[0];
  const Icon = active.icon;

  return (
    <div className={cn("rounded-xl border bg-muted/30 p-3.5 space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          {toolMode === "web" ? (
            <ClipboardCheck className="h-3.5 w-3.5 text-brand-ink" />
          ) : toolMode === "desktop" ? (
            <FolderOpen className="h-3.5 w-3.5 text-brand-ink" />
          ) : toolMode === "ide" ? (
            <Code2 className="h-3.5 w-3.5 text-brand-ink" />
          ) : (
            <Terminal className="h-3.5 w-3.5 text-brand-ink" />
          )}
          <span>
            {toolMode === "web"
              ? "Web-Chat Ablauf in 4 Klicks"
              : toolMode === "desktop"
                ? "Alternativer Web-Chat-Test in 4 Klicks"
                : toolMode === "ide"
                  ? "Prompt-Ablauf im Editor (Antigravity / Cursor / Windsurf / VS Code) in 4 Schritten"
                  : "Prompt-Transfer in 4 Schritten"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Ablauf pausieren" : "Ablauf abspielen"}
          className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          <span>{playing ? "Pause" : "Abspielen"}</span>
        </button>
      </div>

      {/* 4 Stepper Pills */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {steps.map((s, idx) => {
          const isCurrent = idx === stepIdx;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                setPlaying(false);
                setStepIdx(idx);
              }}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                isCurrent
                  ? "border-brand-lime bg-secondary/75 text-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="font-mono text-[10px] font-bold text-brand-ink">0{s.num}</div>
              <div className="truncate text-xs font-semibold">{s.title}</div>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.num}
          initial={prefersReduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: prefersReduced ? 0 : 0.16 }}
          className="flex flex-col gap-1.5 rounded-lg border bg-card px-3 py-2.5 text-xs"
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Icon className="h-3.5 w-3.5 shrink-0 text-brand-ink" />
            <span>
              Schritt {active.num}: {active.title} ({active.short})
            </span>
          </div>
          <p className="text-muted-foreground">{active.detail}</p>
          <div className="rounded bg-muted/60 px-2 py-1 font-mono text-[11px] text-brand-ink">
            {active.preview}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export interface Stage3AgentWalkPlayerProps {
  onSelectSlug?: (slug: string) => void;
  steps?: { slug: string; note: string }[];
  walkLabel?: string;
  articleCount?: number;
  className?: string;
}

const DEFAULT_STAGE3_STEPS = [
  {
    num: 1,
    title: "Lies _index.md",
    detail:
      "Statt alle 68 Dateien (332 KB) zu durchsuchen, öffnet die KI zuerst das kompakte Inhaltsverzeichnis _index.md (~17 KB).",
    chips: [] as string[],
  },
  {
    num: 2,
    title: "Folge [[anemonenfische]] → [[seeanemonen]]",
    detail:
      "Das Verzeichnis verweist direkt auf Anemonenfische & Seeanemonen: Schleimschicht mit wenig Sialinsäure schützt vor Nesselzellen.",
    chips: ["anemonenfische", "seeanemonen"],
  },
  {
    num: 3,
    title: "Folge [[symbiose]] → [[korallenbleiche]]",
    detail:
      "Über [[Wikilinks]] springt der Pfad weiter zu Symbiose, Steinkorallen und Korallenbleiche (ab ~29 °C, Tod nach ~8 Wochen).",
    chips: ["symbiose", "steinkorallen", "korallenbleiche"],
  },
  {
    num: 4,
    title: "Synthese mit Belegen",
    detail:
      "Die Antwort verknüpft den Schutz des Clownfisches mit der Temperatur-Empfindlichkeit des Riffs — mit exakter Quellenkette.",
    chips: ["korallenriff"],
  },
];

export function Stage3AgentWalkPlayer({
  onSelectSlug,
  steps,
  walkLabel,
  articleCount = 68,
  className,
}: Stage3AgentWalkPlayerProps) {
  const prefersReduced = useReducedMotion();
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  const stage3Steps =
    steps && steps.length > 0
      ? [
          {
            num: 1,
            title: "Lies _index.md",
            detail: `Statt alle ${articleCount} Dateien einzeln zu durchsuchen, öffnet die KI zuerst das kompakte Inhaltsverzeichnis _index.md.`,
            chips: [] as string[],
          },
          ...steps.slice(0, 3).map((st, i) => ({
            num: i + 2,
            title: `Folge [[${st.slug}]]`,
            detail: st.note.replace(/^(Start|Sprung\s+\d+\/\d+)\s*·\s*/i, "").trim(),
            chips: [st.slug],
          })),
        ]
      : DEFAULT_STAGE3_STEPS;

  useEffect(() => {
    if (!playing || prefersReduced) return;
    const id = window.setInterval(() => {
      setStepIdx((prev) => (prev + 1) % stage3Steps.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [playing, prefersReduced, stage3Steps.length]);

  const active = stage3Steps[stepIdx] || stage3Steps[0];

  return (
    <div className={cn("rounded-2xl border bg-card p-4 space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-brand-ink" />
          <span className="font-display text-sm font-bold text-foreground">
            Wie Stufe 3 gezielt navigiert ({walkLabel || "Frage 2 · Korallenriff-Kette"})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-1 rounded-lg border bg-muted/50 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{playing ? "Pause" : "Walk abspielen"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {stage3Steps.map((s, idx) => (
          <button
            key={s.num}
            type="button"
            onClick={() => {
              setPlaying(false);
              setStepIdx(idx);
              if (s.chips[0]) onSelectSlug?.(s.chips[0]);
            }}
            className={cn(
              "rounded-xl border px-3 py-2 text-left transition-colors",
              idx === stepIdx
                ? "border-brand-lime bg-secondary/70 text-foreground"
                : "bg-muted/25 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="font-mono text-[10px] font-bold text-brand-ink">
              Schritt {s.num}/{stage3Steps.length}
            </div>
            <div className="truncate text-xs font-semibold">{s.title}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <FileSearch className="h-4 w-4 shrink-0 text-brand-ink" />
          <span>{active.title}</span>
        </div>
        <p className="leading-relaxed text-muted-foreground">{active.detail}</p>
        {active.chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-muted-foreground">Im Graph markieren:</span>
            {active.chips.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => onSelectSlug?.(slug)}
                className="rounded-md border border-brand-lime/50 bg-card px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-ink hover:bg-secondary"
              >
                [[{slug}]]
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
