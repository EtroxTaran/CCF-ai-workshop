import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Pause, Play, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnimaticSpecs } from "@/types/workshop";

export interface HeroBeforeAfterAnimaticProps {
  spec?: AnimaticSpecs["heroBeforeAfter"];
  articleCount?: number;
  className?: string;
}

const DEFAULT_HERO_SPEC: NonNullable<AnimaticSpecs["heroBeforeAfter"]> = {
  trapQuestion: "„Schneeleopard im Nationalpark & Eintrittspreis?“",
  unfilteredLabel: "Ohne Regeln (Halluzination)",
  unfilteredAnswer:
    "„Im Schweizerischen Nationalpark leben geschätzt 15–20 Schneeleoparden; der Eintritt kostet 18 € pro Tag.“",
  unfilteredTag: "Erfunden!",
  guardedLabel: "Mit Regeln & Wissen (Belegt)",
  guardedAnswer: "„Nicht in den vorliegenden Dokumenten enthalten.“",
  guardedTag: "Guardrail aktiv",
  factsAnswer: "Belegt: Eisbär hat 42 Zähne (eisbaer.md)",
  factsTag: "68 Artikel",
};

export function HeroBeforeAfterAnimatic({
  spec,
  articleCount = 68,
  className,
}: HeroBeforeAfterAnimaticProps) {
  const s = spec || DEFAULT_HERO_SPEC;
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<"before" | "after">(() => (prefersReduced ? "after" : "before"));
  const [playing, setPlaying] = useState<boolean>(() => !prefersReduced);

  useEffect(() => {
    if (prefersReduced) {
      setPlaying(false);
    }
  }, [prefersReduced]);

  useEffect(() => {
    if (!playing || prefersReduced) return;
    const id = window.setInterval(() => {
      setPhase((prev) => (prev === "before" ? "after" : "before"));
    }, 2500);
    return () => window.clearInterval(id);
  }, [playing, prefersReduced]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#232B20] bg-[#111610]/95 p-4 text-[#F2F4EE] shadow-lg backdrop-blur-sm",
        className
      )}
    >
      {/* Header & Controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#A9C23F]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Vorher vs. Nachher</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded-lg border border-[#232B20] bg-[#0B0F0A] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setPhase("before");
              }}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                phase === "before"
                  ? "bg-rose-500/20 text-rose-300"
                  : "text-[#9FA998] hover:text-[#F2F4EE]"
              )}
            >
              Ohne Regeln
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setPhase("after");
              }}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                phase === "after"
                  ? "bg-[#A9C23F] font-semibold text-[#0B0F0A]"
                  : "text-[#9FA998] hover:text-[#F2F4EE]"
              )}
            >
              Mit Regeln
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Animation pausieren" : "Animation abspielen"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#232B20] bg-[#0B0F0A] text-[#A9C23F] hover:border-[#A9C23F]"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Question Pill */}
      <div className="mb-3 rounded-xl border border-[#232B20] bg-[#0B0F0A] px-3 py-2 text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#9FA998]">
          Testfrage ·{" "}
        </span>
        <span className="font-medium text-[#F2F4EE]">{s.trapQuestion}</span>
      </div>

      {/* Animated Before / After Card */}
      <AnimatePresence mode="wait">
        {phase === "before" ? (
          <motion.div
            key="before"
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="space-y-2.5 rounded-xl border border-rose-500/45 bg-rose-950/30 p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {s.unfilteredLabel}
              </span>
              <span
                className={cn(
                  "rounded-full bg-rose-500/25 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-200",
                  !prefersReduced && "animate-pulse"
                )}
              >
                {s.unfilteredTag}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#F2F4EE]/90">{s.unfilteredAnswer}</p>
            <div className="text-[11px] text-rose-200/80">
              Klingt selbstsicher — steht aber in keinem der {articleCount} Dokumente.
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="after"
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="space-y-2.5 rounded-xl border border-[#A9C23F]/50 bg-[#1B2419]/85 p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A9C23F]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {s.guardedLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#A9C23F] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0B0F0A]">
                <CheckCircle2 className="h-3 w-3" />
                {s.guardedTag}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#F2F4EE]">{s.guardedAnswer}</p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="rounded-md border border-[#A9C23F]/40 bg-[#0B0F0A] px-2 py-0.5 font-mono text-[10px] text-[#A9C23F]">
                {s.factsAnswer}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar Indicator */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-[#9FA998]">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#232B20]">
          <motion.div
            key={`${phase}-${playing}`}
            initial={{ width: "0%" }}
            animate={{ width: playing && !prefersReduced ? "100%" : phase === "after" ? "100%" : "50%" }}
            transition={{
              duration: playing && !prefersReduced ? 2.5 : 0,
              ease: "linear",
            }}
            className={cn(
              "h-full rounded-full",
              phase === "before" ? "bg-rose-400" : "bg-[#A9C23F]"
            )}
          />
        </div>
        <span className="num-tabular font-mono">{phase === "before" ? "1 / 2" : "2 / 2"}</span>
      </div>
    </div>
  );
}
