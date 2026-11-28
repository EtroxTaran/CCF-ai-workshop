import { useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldAlert, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getValidatorSample,
  validateParticipantOutput,
  type ModuleValidationContext,
  type OutputValidationResult,
} from "@/lib/outputValidator";
import type { GoalId } from "@/types/workshop";

export interface OutputValidatorWidgetProps {
  goalId: GoalId;
  goalTitle: string;
  ctx: ModuleValidationContext;
  savedPassed?: boolean;
  savedScore?: number;
  onValidated: (result: OutputValidationResult) => void;
}

export function OutputValidatorWidget({
  goalId,
  goalTitle,
  ctx,
  savedPassed = false,
  savedScore,
  onValidated,
}: OutputValidatorWidgetProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<OutputValidationResult | null>(null);

  function runCheck(textToCheck = input) {
    const res = validateParticipantOutput(goalId, textToCheck, ctx);
    setResult(res);
    onValidated(res);
  }

  return (
    <section
      data-testid="output-validator"
      className="rounded-2xl border border-brand-lime/45 bg-card p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Ergebnis-Prüfung (Output-Validator · 100 % lokal)</span>
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Prüfe dein KI-Ergebnis für: {goalTitle}
          </h3>
          <p className="text-xs text-muted-foreground">
            Kopiere die Antwort (oder Spec / Folien-Blueprint / HTML-Auszug) aus deinem KI-Tool
            hier hinein. Der Prüfer kontrolliert echte Quellenbelege, Lücken-Ehrlichkeit und
            Ziel-Kriterien — komplett lokal im Browser.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge
            variant={
              result
                ? result.passed
                  ? "success"
                  : "warning"
                : savedPassed
                  ? "success"
                  : "outline"
            }
            className="text-xs"
          >
            {result
              ? `${result.score}/${result.maxScore} Kriterien`
              : savedPassed
                ? `Bestanden (${savedScore ?? "✓"})`
                : "Noch nicht geprüft"}
          </Badge>
          {savedPassed && result && !result.passed && (
            <span className="text-[11px] font-medium text-muted-foreground">
              Nachweis bereits früher erfüllt
            </span>
          )}
        </div>
      </div>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder="Füge hier deine generierte KI-Antwort, Mini-Spezifikation, Folien-Gliederung oder dein Aktionsprotokoll ein…"
        aria-label="KI-Ergebnis zum Prüfen einfügen"
        data-testid="validator-textarea"
        className="font-mono text-xs"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => runCheck(input)}
            data-testid="validator-run-btn"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ergebnis prüfen</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="validator-sample-fail"
            onClick={() => {
              const sample = getValidatorSample(goalId, "fail", ctx);
              setInput(sample);
              runCheck(sample);
            }}
          >
            Schwaches Beispiel testen
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="validator-sample-pass"
            onClick={() => {
              const sample = getValidatorSample(goalId, "pass", ctx);
              setInput(sample);
              runCheck(sample);
            }}
          >
            Starkes Beispiel testen
          </Button>
        </div>
      </div>

      {result && (
        <div
          data-testid="validator-result"
          className={`space-y-3 rounded-xl border p-4 text-xs ${
            result.passed
              ? "border-emerald-500/45 bg-emerald-500/10"
              : "border-amber-500/45 bg-amber-500/10"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
              {result.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-amber-600" />
              )}
              <span>{result.summary}</span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {result.checks.map((c) => {
              const isRequired = Boolean((c as { required?: boolean }).required);
              return (
                <div
                  key={c.id}
                  className={`rounded-lg border bg-card p-3 space-y-1 ${
                    c.passed ? "border-emerald-500/35" : "border-rose-500/35"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      {c.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                      )}
                      <span>{c.label}</span>
                    </div>
                    {isRequired && (
                      <Badge
                        variant="outline"
                        className="shrink-0 px-1.5 py-0 text-[10px] font-medium"
                      >
                        Pflicht
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{c.detail}</p>
                  {!c.passed && c.fixPrompt && (
                    <div className="flex items-center justify-between gap-2 rounded bg-muted/50 px-2 py-1 text-[10px]">
                      <span className="text-foreground">Korrektur-Tipp: {c.fixPrompt}</span>
                      <CopyButton text={c.fixPrompt} label="Tipp" className="h-6 shrink-0 px-2 text-[10px]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {result.nextStepTip && (
            <div className="rounded-lg border bg-card/85 px-3 py-2 text-[11px] text-foreground">
              <span className="font-semibold text-brand-ink">Nächster Schritt: </span>
              <span>{result.nextStepTip}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
