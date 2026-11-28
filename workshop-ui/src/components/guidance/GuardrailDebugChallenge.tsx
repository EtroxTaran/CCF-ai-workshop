import { useState } from "react";
import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GuardrailDebugChallengeSpec } from "@/types/workshop";

export interface GuardrailDebugChallengeProps {
  challenge: GuardrailDebugChallengeSpec;
  initialSolved?: boolean;
  onSolved?: () => void;
}

export function GuardrailDebugChallenge({
  challenge,
  initialSolved = false,
  onSolved,
}: GuardrailDebugChallengeProps) {
  const correctIds = challenge.options.filter((o) => o.isCorrect).map((o) => o.id);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialSolved ? correctIds : []
  );
  const [checkedResult, setCheckedResult] = useState<boolean>(initialSolved);

  const isSolved =
    initialSolved ||
    (checkedResult &&
      selectedIds.length === correctIds.length &&
      correctIds.every((id) => selectedIds.includes(id)));

  function toggleOption(id: string) {
    setCheckedResult(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function verifySelection() {
    setCheckedResult(true);
    const matchesAll =
      selectedIds.length === correctIds.length &&
      correctIds.every((id) => selectedIds.includes(id));
    if (matchesAll) {
      onSolved?.();
    }
  }

  return (
    <section className="rounded-2xl border border-brand-lime/45 bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            <Wrench className="h-3.5 w-3.5" />
            <span>Aktiv mitdenken · Selbst-Test</span>
          </div>
          <h3 className="font-display text-base font-bold text-foreground sm:text-lg">
            {challenge.title}
          </h3>
          <p className="text-xs text-muted-foreground">{challenge.subtitle}</p>
        </div>
        <Badge variant={isSolved ? "success" : "outline"} className="text-[11px]">
          {isSolved ? "Regel repariert!" : `${selectedIds.length}/${correctIds.length} gewählt`}
        </Badge>
      </div>

      <div className="rounded-xl border border-rose-500/35 bg-rose-500/5 p-3">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
          Fehlerhafte Basis-Regel
        </div>
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
          {challenge.brokenRule}
        </pre>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {challenge.options.map((opt) => {
          const picked = selectedIds.includes(opt.id);
          const showVerdict = checkedResult && picked;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOption(opt.id)}
              aria-pressed={picked}
              className={cn(
                "flex flex-col justify-between gap-1.5 rounded-xl border p-3 text-left text-xs transition-colors",
                picked
                  ? showVerdict
                    ? opt.isCorrect
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-rose-500 bg-rose-500/10"
                    : "border-brand-lime bg-secondary/60"
                  : "bg-muted/25 hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-2 font-medium text-foreground">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border font-mono text-[10px] font-bold",
                    picked
                      ? "border-brand-lime bg-brand-lime text-brand-obsidian"
                      : "border-muted-foreground/40 bg-card"
                  )}
                >
                  {picked ? "✓" : ""}
                </span>
                <span>{opt.text}</span>
              </div>
              {showVerdict && (
                <div
                  className={cn(
                    "pl-6 text-[11px] leading-snug",
                    opt.isCorrect
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-rose-700 dark:text-rose-300"
                  )}
                >
                  {opt.reason}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          onClick={verifySelection}
          disabled={selectedIds.length === 0}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Auswahl prüfen</span>
        </Button>

        {checkedResult && !isSolved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Tipp: Es fehlen genau {correctIds.length} Regeln zur Quellenpflicht &amp; Lücken-Markierung.
            </span>
          </span>
        )}
      </div>

      {isSolved && (
        <div className="space-y-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Geprüfte &amp; vollständige Projekt-Regel:
            </span>
            <CopyButton
              text={challenge.fixedRule}
              label="Reparierte Regel kopieren"
              variant="default"
            />
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
            {challenge.fixedRule}
          </pre>
        </div>
      )}
    </section>
  );
}
