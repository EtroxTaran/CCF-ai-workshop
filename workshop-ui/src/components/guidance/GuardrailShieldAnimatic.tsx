import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Network, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnimaticSpecs } from "@/types/workshop";

export interface GuardrailShieldAnimaticProps {
  activeStageIdx: number;
  onSelectStage?: (idx: number) => void;
  spec?: AnimaticSpecs["guardrailShield"];
  articleCount?: number;
  className?: string;
}

const DEFAULT_SPEC: NonNullable<AnimaticSpecs["guardrailShield"]> = {
  claimText: "„Schneeleoparden im Nationalpark & 18 € Eintritt?“",
  stages: [
    {
      id: "stufe-1",
      stageLabel: "Stufe 1 · Ohne Regeln",
      subtitle: "Kein Schutzschild — Modell füllt Wissenslücke aus dem Training.",
      blocked: false,
      responseText: "Halluzination: „18 € Eintritt · ~15–20 Schneeleoparden“",
      badge: "Ungefiltert",
    },
    {
      id: "stufe-2",
      stageLabel: "Stufe 2 · Klare Regeln",
      subtitle: "Guardrail-Schild aktiv — ‚Fehlt ein Fakt, antworte exakt: Nicht enthalten.‘",
      blocked: true,
      responseText: "„Nicht in den vorliegenden Dokumenten enthalten.“",
      badge: "Gestoppt",
    },
    {
      id: "stufe-3",
      stageLabel: "Stufe 3 · Regeln + _index.md",
      subtitle: "1 Blick ins Inhaltsverzeichnis statt alle Dateien zu durchsuchen.",
      blocked: true,
      responseText: "„Index bestätigt: 0 Artikel zu Schneeleopard.“",
      badge: "Verifiziert",
    },
  ],
};

export function GuardrailShieldAnimatic({
  activeStageIdx,
  onSelectStage,
  spec,
  articleCount = 68,
  className,
}: GuardrailShieldAnimaticProps) {
  const prefersReduced = useReducedMotion();
  const s = spec || DEFAULT_SPEC;
  const active = s.stages[activeStageIdx] || s.stages[0];
  const isBlocked = active.blocked;

  return (
    <div className={cn("rounded-2xl border bg-card p-5 space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            Fangfrage-Schutz im Ablauf · Frage 3
          </div>
          <p className="text-xs text-muted-foreground">
            Schalte zwischen Stufe 1, 2 und 3 um und verfolge, wie die Regel die Fangfrage abfängt.
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-xl border bg-muted p-1 text-xs">
          {s.stages.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStage?.(idx)}
              className={cn(
                "rounded-lg px-2.5 py-1 font-medium transition-colors",
                idx === activeStageIdx
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Stufe {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Node Animated Track */}
      <div className="relative grid gap-3 lg:grid-cols-3 lg:items-stretch">
        {/* Node 1: Query */}
        <div className="rounded-xl border bg-muted/35 p-3.5 space-y-1.5">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            1 · Eingabe (Fangfrage)
          </div>
          <div className="text-xs font-bold text-foreground">{s.claimText}</div>
          <p className="text-[11px] text-muted-foreground">
            Dieses Thema existiert in keiner der {articleCount} Dateien.
          </p>
        </div>

        {/* Node 2: Guardrail Shield */}
        <div
          className={cn(
            "relative rounded-xl border p-3.5 space-y-1.5 transition-colors",
            !isBlocked
              ? "border-dashed border-rose-400 bg-rose-50/60 dark:bg-rose-500/10"
              : "border-[#A9C23F] bg-secondary/50"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              2 · Prüf-Schicht
            </span>
            {!isBlocked ? (
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            ) : activeStageIdx === 1 ? (
              <ShieldCheck className="h-4 w-4 text-brand-ink" />
            ) : (
              <Network className="h-4 w-4 text-brand-ink" />
            )}
          </div>
          <div className="text-xs font-bold text-foreground">{active.stageLabel}</div>
          <p className="text-[11px] text-muted-foreground">{active.subtitle}</p>

          {!prefersReduced && (
            <motion.div
              key={activeStageIdx}
              initial={{ x: "-10%", opacity: 0.4 }}
              animate={{ x: "100%", opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "pointer-events-none mt-1 h-1.5 w-8 rounded-full",
                isBlocked ? "bg-[#A9C23F]" : "bg-rose-500"
              )}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Node 3: Output */}
        <div
          className={cn(
            "rounded-xl border p-3.5 space-y-1.5",
            !isBlocked
              ? "border-rose-400 bg-rose-50/70 dark:bg-rose-500/15"
              : "border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-500/10"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              3 · KI-Antwort
            </span>
            {!isBlocked ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div
            className={cn(
              "text-xs font-bold",
              !isBlocked
                ? "text-rose-800 dark:text-rose-300"
                : "text-emerald-900 dark:text-emerald-300"
            )}
          >
            {active.responseText}
          </div>
          <p className="text-[11px] text-muted-foreground">{active.badge}</p>
        </div>
      </div>
    </div>
  );
}
