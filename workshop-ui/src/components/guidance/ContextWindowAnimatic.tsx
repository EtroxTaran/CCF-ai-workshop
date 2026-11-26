import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, MessageSquarePlus, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AnimaticSpecs } from "@/types/workshop";

export interface ContextWindowAnimaticProps {
  className?: string;
  spec?: AnimaticSpecs["contextWindow"];
  onResetChat?: () => void;
}

const STEPS = [
  {
    msgCount: 1,
    fillPct: 18,
    ruleStatus: "voll aktiv",
    displaced: false,
    note: "Nachricht 1: Deine Chat-Regeln stehen ganz oben im Kontext — die KI hält sich exakt daran.",
  },
  {
    msgCount: 2,
    fillPct: 42,
    ruleStatus: "aktiv",
    displaced: false,
    note: "Nachricht 2: Erste lange Artikel-Texte kommen dazu. Die Regeln sind noch gut sichtbar.",
  },
  {
    msgCount: 3,
    fillPct: 68,
    ruleStatus: "gerät aus dem Fokus",
    displaced: false,
    note: "Nachricht 3: Mehr Rohdaten füllen den Verlauf. Das Modell gewichtet den neuen Text stärker.",
  },
  {
    msgCount: 4,
    fillPct: 90,
    ruleStatus: "verblasst",
    displaced: true,
    note: "Nachricht 4: Regel-Block rutscht in die Verdrängungszone — erste Halluzinationen drohen.",
  },
  {
    msgCount: 5,
    fillPct: 100,
    ruleStatus: "verdrängt / vergessen",
    displaced: true,
    note: "Nachricht 5: 332 KB Rohdaten überfluten das Fenster! Lösung: + Neuer Chat oder AGENTS.md + Index.",
  },
];

export function ContextWindowAnimatic({ className, spec, onResetChat }: ContextWindowAnimaticProps) {
  const prefersReduced = useReducedMotion();
  const [stepIdx, setStepIdx] = useState<number>(0);
  const rawLabel = spec?.rawLabel || "332 KB Rohdaten";
  const indexLabel = spec?.indexLabel || "~17 KB Index (_index.md)";
  const articleCountLabel = spec?.articleCountLabel || "Alle 68 Dateien";
  const current =
    stepIdx === STEPS.length - 1
      ? {
          ...STEPS[stepIdx],
          note: `Nachricht 5: ${rawLabel} überfluten das Fenster! Lösung: + Neuer Chat oder AGENTS.md + Index.`,
        }
      : STEPS[stepIdx] || STEPS[0];

  function handleNextMessage() {
    setStepIdx((prev) => Math.min(STEPS.length - 1, prev + 1));
  }

  function handleReset() {
    setStepIdx(0);
    onResetChat?.();
  }

  return (
    <div className={cn("rounded-2xl border bg-card p-5 space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            Kontext-Tank · Warum lange Chats Regeln vergessen
          </div>
          <p className="text-xs text-muted-foreground">
            Klicke auf <strong>„+ Nachricht senden“</strong> und beobachte, wie große Textmengen
            deine Chat-Regeln verdrängen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            onClick={handleNextMessage}
            disabled={stepIdx >= STEPS.length - 1}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>+ Nachricht senden ({current.msgCount}/5)</span>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span>+ Neuer Chat</span>
          </Button>
        </div>
      </div>

      {/* Interactive Context Tank */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 rounded-xl border bg-muted/30 p-4 lg:col-span-7">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Chat-Verlauf (Kontext-Fenster)</span>
            <span
              className={cn(
                "num-tabular rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold",
                current.displaced
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                  : "bg-secondary text-brand-ink"
              )}
            >
              {current.fillPct}% belegt · Regel {current.ruleStatus}
            </span>
          </div>

          {/* Visual Stack inside Tank */}
          <div className="space-y-2 rounded-xl border bg-background p-3">
            {/* Pinned Chat Rule Block */}
            <motion.div
              animate={{
                opacity: current.displaced ? 0.38 : 1,
                scale: current.displaced ? 0.985 : 1,
              }}
              transition={{ duration: prefersReduced ? 0 : 0.25 }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs",
                current.displaced
                  ? "border-dashed border-rose-400 bg-rose-50/70 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300"
                  : "border-[#A9C23F] bg-[#EEF3D8] text-[#0B0F0A]"
              )}
            >
              <span className="inline-flex items-center gap-1.5 font-semibold">
                {current.displaced ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>Chat-Regel: „Nur aus Quellen zitieren, niemals raten“</span>
              </span>
              <span className="shrink-0 font-mono text-[10px] font-bold uppercase">
                {current.displaced ? "Verdrängt!" : "Aktiv"}
              </span>
            </motion.div>

            {/* Growing Raw-Text Payload Bar */}
            <div className="space-y-1">
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={false}
                  animate={{ width: `${current.fillPct}%` }}
                  transition={{ duration: prefersReduced ? 0 : 0.3, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    current.fillPct >= 90
                      ? "bg-rose-500"
                      : current.fillPct >= 65
                        ? "bg-amber-500"
                        : "bg-[#A9C23F]"
                  )}
                />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{current.note}</p>
            </div>
          </div>

          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, idx) => (
              <button
                key={s.msgCount}
                type="button"
                onClick={() => setStepIdx(idx)}
                className={cn(
                  "flex-1 rounded-md border py-1 font-mono text-[11px] font-semibold transition-colors",
                  idx === stepIdx
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                #{s.msgCount}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison: 332 KB Rohdaten vs. ~17 KB Index (_index.md) */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/25 p-4 lg:col-span-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Warum Stufe 3 das Problem löst
          </div>

          <div className="space-y-2.5">
            <div className="rounded-xl border border-rose-300/60 bg-rose-50/50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
              <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
                <span>Stufe 1/2 · Roh-Dump</span>
                <span className="num-tabular font-mono">{rawLabel}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-rose-200/70 dark:bg-rose-950">
                <div className="h-full w-full rounded-full bg-rose-500" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {articleCountLabel} auf einmal verstopfen das Kontext-Fenster.
              </p>
            </div>

            <div className="rounded-xl border border-[#A9C23F]/60 bg-secondary/45 p-3">
              <div className="flex items-center justify-between text-xs font-bold text-brand-ink">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Stufe 3 · Vault + AGENTS.md
                </span>
                <span className="num-tabular font-mono">{indexLabel}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[6%] min-w-[10px] rounded-full bg-[#A9C23F]" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                <code>AGENTS.md</code> bleibt dauerhaft oben gepinnt; <code>_index.md</code> lädt
                nur die 2–3 passenden Artikel nach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
