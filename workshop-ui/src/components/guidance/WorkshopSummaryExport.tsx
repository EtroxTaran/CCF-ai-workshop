import { useId } from "react";
import { CheckCircle2, Circle, Download, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { downloadMarkdownFile } from "@/lib/exportCorpusMd";
import type { RulebookFormat } from "@/lib/outputValidator";
import type { GoalId, ToolMode } from "@/types/workshop";

const RULEBOOK_FORMAT_LABELS: Record<RulebookFormat, string> = {
  "agents-md": "AGENTS.md / CLI",
  "custom-instructions": "Langdock / Projects / Gems",
  "ide-rules": "Antigravity / Cursor / Windsurf / VS Code",
};

export interface OutcomeGateStatus {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface WorkshopSummaryExportProps {
  moduleId: string;
  moduleTitle: string;
  goalId: GoalId;
  goalTitle: string;
  toolMode: ToolMode;
  toolLabel: string;
  gates: OutcomeGateStatus[];
  generatedAgentsMd?: string;
  generatedTrapQuestion?: string;
  generatedRuleFormat?: RulebookFormat;
  onResetToStart: () => void;
}

export function WorkshopSummaryExport({
  moduleId,
  moduleTitle,
  goalId,
  goalTitle,
  toolMode,
  toolLabel,
  gates,
  generatedAgentsMd,
  generatedTrapQuestion,
  generatedRuleFormat = "agents-md",
  onResetToStart,
}: WorkshopSummaryExportProps) {
  const headingId = useId();
  const passedCount = gates.filter((g) => g.passed).length;
  const pct = Math.round((passedCount / Math.max(gates.length, 1)) * 100);
  const allCorePassed = passedCount >= Math.max(4, gates.length - 1);
  const ruleFormatLabel = RULEBOOK_FORMAT_LABELS[generatedRuleFormat] || "AGENTS.md / CLI";

  function buildMarkdownKit() {
    const lines = [
      `# Workshop Ergebnis-Nachweis & Takeaway-Kit`,
      "",
      `- **Modul:** ${moduleTitle} (\`${moduleId}\`)`,
      `- **Gewähltes Ziel:** ${goalTitle} (\`${goalId}\`)`,
      `- **Gewähltes Werkzeug:** ${toolLabel} (\`${toolMode}\`)`,
      `- **Zielformat Hausregel:** ${ruleFormatLabel} (\`${generatedRuleFormat}\`)`,
      `- **Erreichte Nachweise:** ${passedCount} / ${gates.length} (${pct} %)`,
      `- **Datenschutz-Hinweis:** 100 % lokal im Browser erzeugt — enthält keine personenbezogenen Daten.`,
      "",
      `## Geprüfte Ergebnis-Nachweise`,
      ...gates.map(
        (g) => `- [${g.passed ? "x" : " "}] **${g.label}** — ${g.detail}`
      ),
      "",
    ];
    if (generatedAgentsMd) {
      lines.push(`## Meine geprüfte Hausregel (${ruleFormatLabel})`, "", "```markdown", generatedAgentsMd.trim(), "```", "");
    }
    if (generatedTrapQuestion) {
      lines.push("## Meine Test-Fangfrage (Negativtest vor Produktiveinsatz)", "", `> ${generatedTrapQuestion.trim()}`, "");
    }
    lines.push(
      "## Montagmorgen-Checkliste",
      "1. Neues Dokument oder Meeting-Notiz vor KI-Nutzung anonymisieren.",
      "2. Klare Struktur (CO-STAR / SCQA / Mini-Spec) + Quellenpflicht vorgeben.",
      "3. Immer eine Fangfrage testen und [Nicht in Quelle] verifizieren.",
      ""
    );
    return lines.join("\n");
  }

  function downloadJsonEvidence() {
    const payload = {
      schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      moduleId,
      moduleTitle,
      goalId,
      goalTitle,
      toolMode,
      passedCount,
      totalGates: gates.length,
      completionPct: pct,
      gates,
      rulebookFormat: generatedRuleFormat,
      rulebookFormatLabel: ruleFormatLabel,
      rulebookPreview: generatedAgentsMd || "",
      trapTestQuestion: generatedTrapQuestion || "",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workshop-nachweis-${moduleId}-${goalId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      data-testid="workshop-summary-export"
      aria-labelledby={headingId}
      className="rounded-2xl border border-brand-lime/50 bg-secondary/35 p-5 space-y-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge aria-live="polite" variant={allCorePassed ? "success" : "outline"}>
              {allCorePassed
                ? "Workshop-Ziel validiert & nachgewiesen!"
                : `Ergebnis-Nachweis: ${passedCount}/${gates.length} erfüllt`}
            </Badge>
            <span className="num-tabular text-xs font-semibold text-brand-ink">
              {pct} % abgeschlossen
            </span>
          </div>
          <h2 id={headingId} className="font-display text-lg font-bold text-foreground">
            Dein Workshop-Ergebnis &amp; Takeaway-Kit
          </h2>
          <p className="text-xs text-muted-foreground">
            Kein bloßes „Weiter-Klicken“: Jeder Punkt wird durch deine echte Prüfung (Debug,
            Output-Validator, Rubrik, Regel-Check) nachgewiesen.
          </p>
        </div>

        <Badge variant="outline" className="gap-1 text-[11px]">
          <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          <span>Lokal · 0 PII</span>
        </Badge>
      </div>

      <Progress value={pct} aria-label="Fortschritt der Ergebnis-Nachweise" />

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {gates.map((g) => (
          <li
            key={g.id}
            className={`flex items-start gap-2 rounded-xl border bg-card p-3 text-xs ${
              g.passed ? "border-emerald-500/40" : "border-border"
            }`}
          >
            {g.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-foreground">{g.label}</div>
              <div className="text-[11px] text-muted-foreground">{g.detail}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            data-testid="export-takeaway-md"
            onClick={() =>
              downloadMarkdownFile(
                `workshop-nachweis-${moduleId}-${goalId}.md`,
                buildMarkdownKit(),
                "Workshop Takeaway-Kit (.md) heruntergeladen!"
              )
            }
          >
            <Download className="h-3.5 w-3.5" />
            <span>Takeaway-Kit (.md) laden</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="export-takeaway-json"
            onClick={downloadJsonEvidence}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Nachweis (.json) laden</span>
          </Button>
        </div>

        <Button type="button" size="sm" variant="ghost" onClick={onResetToStart}>
          Zurück zum Einstieg
        </Button>
      </div>
    </section>
  );
}
