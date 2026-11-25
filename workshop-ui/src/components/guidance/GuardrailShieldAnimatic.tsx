import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Network, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuardrailShieldAnimaticProps {
  activeStageIdx: number;
  onSelectStage?: (idx: number) => void;
  className?: string;
}

const STAGE_TRACKS = [
  {
    idx: 0,
    label: "Stufe 1 · Ohne Regeln",
    shieldTitle: "Kein Schutzschild",
    shieldDesc: "Keine Quellenpflicht — Modell füllt Wissenslücke aus dem Training.",
    outcomeTitle: "Halluzination: „18 € Eintritt · ~15–20 Schneeleoparden“",
    outcomeDesc: "Plausibel klingende Zahlen — komplett erfunden.",
    tone: "rose" as const,
  },
  {
    idx: 1,
    label: "Stufe 2 · Klare Regeln",
    shieldTitle: "Guardrail-Schild aktiv",
    shieldDesc: "Regel #3: ‚Fehlt ein Fakt in den Dateien, antworte exakt: Nicht enthalten.‘",
    outcomeTitle: "„Nicht in den vorliegenden Dokumenten enthalten.“",
    outcomeDesc: "Erfundene Antwort sauber gestoppt.",
    tone: "lime" as const,
  },
  {
    idx: 2,
    label: "Stufe 3 · Regeln + _index.md",
    shieldTitle: "Schild + _index.md-Prüfung",
    shieldDesc: "1 Blick ins Inhaltsverzeichnis statt 68 Dateien zu durchsuchen.",
    outcomeTitle: "„Index bestätigt: 0 Artikel zu Schneeleopard.“",
    outcomeDesc: "Sofortige Absage mit vollständiger Transparenz.",
    tone: "emerald" as const,
  },
];

export function GuardrailShieldAnimatic({
  activeStageIdx,
  onSelectStage,
  className,
}: GuardrailShieldAnimaticProps) {
  const prefersReduced = useReducedMotion();
  const active = STAGE_TRACKS[activeStageIdx] || STAGE_TRACKS[0];
  const isBlocked = active.idx >= 1;

  return (
    <div className={cn("rounded-2xl border bg-card p-5 space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            Fangfrage-Schutz im Ablauf · Frage 3 (Schneeleopard)
          </div>
          <p className="text-xs text-muted-foreground">
            Schalte zwischen Stufe 1, 2 und 3 um und verfolge, wie die Regel die Fangfrage abfängt.
          </p>
        </div>

        <div className="inline-flex flex-wrap rounded-xl border bg-muted p-1 text-xs">
          {STAGE_TRACKS.map((st) => (
            <button
              key={st.idx}
              type="button"
              onClick={() => onSelectStage?.(st.idx)}
              className={cn(
                "rounded-lg px-2.5 py-1 font-medium transition-colors",
                st.idx === active.idx
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Stufe {st.idx + 1}
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
          <div className="text-xs font-bold text-foreground">
            „Schneeleoparden im Nationalpark &amp; 18 € Eintritt?“
          </div>
          <p className="text-[11px] text-muted-foreground">
            Begriff <em>Schneeleopard</em> existiert in keiner der 68 Dateien.
          </p>
        </div>

        {/* Node 2: Guardrail Shield */}
        <div
          className={cn(
            "relative rounded-xl border p-3.5 space-y-1.5 transition-colors",
            active.idx === 0
              ? "border-dashed border-rose-400 bg-rose-50/60 dark:bg-rose-500/10"
              : "border-[#A9C23F] bg-secondary/50"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              2 · Prüf-Schicht
            </span>
            {active.idx === 0 ? (
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            ) : active.idx === 1 ? (
              <ShieldCheck className="h-4 w-4 text-brand-ink" />
            ) : (
              <Network className="h-4 w-4 text-brand-ink" />
            )}
          </div>
          <div className="text-xs font-bold text-foreground">{active.shieldTitle}</div>
          <p className="text-[11px] text-muted-foreground">{active.shieldDesc}</p>

          {!prefersReduced && (
            <motion.div
              key={active.idx}
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
            active.idx === 0
              ? "border-rose-400 bg-rose-50/70 dark:bg-rose-500/15"
              : "border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-500/10"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              3 · KI-Antwort
            </span>
            {active.idx === 0 ? (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div
            className={cn(
              "text-xs font-bold",
              active.idx === 0
                ? "text-rose-800 dark:text-rose-300"
                : "text-emerald-900 dark:text-emerald-300"
            )}
          >
            {active.outcomeTitle}
          </div>
          <p className="text-[11px] text-muted-foreground">{active.outcomeDesc}</p>
        </div>
      </div>
    </div>
  );
}
