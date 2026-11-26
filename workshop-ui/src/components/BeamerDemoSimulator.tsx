import { Eye, Lock, Network, RefreshCw, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { StageMiniDiagram } from "@/components/StageMiniDiagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnimaticSpecs, TestQuestion } from "@/types/workshop";

export type DemoQuestionKey = "q1" | "q2" | "q3" | "q4";

export interface BeamerDemoSimulatorProps {
  questionKey: DemoQuestionKey;
  onSelectQuestion: (key: DemoQuestionKey) => void;
  /** 0 = Question only, 1 = +Stufe 1, 2 = +Stufe 2, 3 = +Stufe 3 */
  revealStep: number;
  onRevealStepChange: (step: number) => void;
  q4Mutated: boolean;
  onToggleQ4Mutated: () => void;
  questions?: TestQuestion[];
  demoScenarios?: AnimaticSpecs["demoScenarios"];
}

interface StageOutcome {
  num: string;
  variant: "chaos" | "harness" | "vault";
  title: string;
  folder: string;
  statusBadge: string;
  badgeVar: "danger" | "warning" | "success";
  stripe: string;
  output: string;
  highlightNote: string;
  isGood: boolean;
}

interface DemoScenario {
  key: DemoQuestionKey;
  tabLabel: string;
  label: string;
  question: string;
  stages: StageOutcome[];
}

const QUESTION_ORDER: DemoQuestionKey[] = ["q1", "q2", "q3", "q4"];

function buildScenario(
  key: DemoQuestionKey,
  q4Mutated: boolean,
  questions?: TestQuestion[]
): DemoScenario {
  const fromData = questions?.find((q) => q.id === key);

  if (key === "q1") {
    return {
      key: "q1",
      tabLabel: "Frage 1 · Eisbär",
      label: "Frage 1 · Detailfrage (1 Datei)",
      question:
        fromData?.question ||
        "Warum gefriert das Fell des Eisbären nicht, welche Hautfarbe hat ein ausgewachsener Eisbär darunter, und wie viele Zähne besitzt er?",
      stages: [
        {
          num: "01",
          variant: "chaos",
          title: "Stufe 1 · Ohne Regeln (Chaos)",
          folder: "stufe-1-chaos/",
          statusBadge: "Vage · 0 Quellen",
          badgeVar: "danger",
          stripe: "border-t-rose-500",
          output:
            "„Das Fell ist ölig und wasserabweisend. Darunter hat der Eisbär meist dunkle Haut und etwa 40–42 Zähne.“",
          highlightNote: "Ungenaue Schätzung aus Vorwissen — nennt weder Squalen-freien Talg noch eisbaer.md.",
          isGood: false,
        },
        {
          num: "02",
          variant: "harness",
          title: "Stufe 2 · Klare Regeln & Skills",
          folder: "stufe-2-skills-guardrails/",
          statusBadge: "Mit Quelle belegt",
          badgeVar: "warning",
          stripe: "border-t-amber-500",
          output:
            "„Eisbärentalg (ohne Squalen, hydrophob) verhindert Eisbildung. Ausgewachsen: schwarze Haut (Babys rosa), 5–10 cm Fett, 42 Zähne (docs/eisbaer.md).“",
          highlightNote: "Quellenpflicht erzwingt exakte Fachbegriffe und Dateizitat (docs/eisbaer.md).",
          isGood: true,
        },
        {
          num: "03",
          variant: "vault",
          title: "Stufe 3 · Vernetztes Wissen (Vault)",
          folder: "stufe-3-obsidian-vault/",
          statusBadge: "Index-Treffer",
          badgeVar: "success",
          stripe: "border-t-brand-lime",
          output:
            "„[[eisbaer]] (via _index.md → [[arktis]]): Squalen-freier Eisbärentalg, hohle transparente Haare, schwarze Haut, 42 Zähne. Verknüpft: [[nahrungskette]], [[klimawandel]].“",
          highlightNote: "Direkter Sprung über _index.md und sofortige Einordnung in den Lebensraum-Kontext.",
          isGood: true,
        },
      ],
    };
  }

  if (key === "q2") {
    return {
      key: "q2",
      tabLabel: "Frage 2 · Querverbindung",
      label: "Frage 2 · Querverbindung (5+ Dateien)",
      question:
        fromData?.question ||
        "Vergleiche die Symbiose zwischen Anemonenfischen und Seeanemonen mit der Symbiose zwischen Steinkorallen und Zooxanthellen: Wie schützen sich Anemonenfische vor Nesselzellen, welcher Symbiose-Typ liegt jeweils räumlich vor, und was passiert bei starker Erwärmung im Korallenriff?",
      stages: [
        {
          num: "01",
          variant: "chaos",
          title: "Stufe 1 · Ohne Regeln (Chaos)",
          folder: "stufe-1-chaos/",
          statusBadge: "Unvollständig · 0 Quellen",
          badgeVar: "danger",
          stripe: "border-t-rose-500",
          output:
            "„Clownfische haben eine Schleimschicht. Beide Arten leben in Symbiose, und bei Erwärmung bleichen Korallen oft aus.“",
          highlightNote: "Keine Dateinamen, verpasst Ektosymbiose vs. Endosymbiose & 8-Wochen-Frist.",
          isGood: false,
        },
        {
          num: "02",
          variant: "harness",
          title: "Stufe 2 · Klare Regeln & Skills",
          folder: "stufe-2-skills-guardrails/",
          statusBadge: "Belegt · Suchaufwand",
          badgeVar: "warning",
          stripe: "border-t-amber-500",
          output:
            "„Geringer Sialinsäure-Anteil schützt vor Nesselzellen (docs/anemonenfische.md). Ab ~29 °C droht Ausbleichen binnen acht Wochen (docs/korallenbleiche.md).“",
          highlightNote: "Saubere Quellenpflicht, muss aber viele lose Dateien in docs/ einzeln durchsuchen.",
          isGood: true,
        },
        {
          num: "03",
          variant: "vault",
          title: "Stufe 3 · Vernetztes Wissen (Vault)",
          folder: "stufe-3-obsidian-vault/",
          statusBadge: "Graph-Synthese",
          badgeVar: "success",
          stripe: "border-t-brand-lime",
          output:
            "„[[anemonenfische]] = Ektosymbiose ([[symbiose]]), [[steinkorallen]] + Zooxanthellen = Endosymbiose. Wärmestress ≥ 29 °C → Photoinhibition → Tod nach ca. acht Wochen ([[korallenbleiche]]).“",
          highlightNote: "_index.md + [[Wikilinks]] verknüpfen gezielt alle 5+ relevanten Artikel.",
          isGood: true,
        },
      ],
    };
  }

  if (key === "q4") {
    const toothCount = q4Mutated ? "38 Zähne" : "42 Zähne";
    return {
      key: "q4",
      tabLabel: "Frage 4 · Kontext-Check",
      label: "Frage 4 · Steuerungs- & Kontext-Check",
      // Intentionally neutral so "38 Zähne" NEVER appears before Stufe 2/3 is revealed
      question:
        "Kontext-Priorisierung (eisbaer.md): Wie viele Zähne hat der Eisbär laut den vorliegenden Dokumenten?",
      stages: [
        {
          num: "01",
          variant: "chaos",
          title: "Stufe 1 · Ohne Regeln (Chaos)",
          folder: "stufe-1-chaos/",
          statusBadge: "Ignoriert lokalen Kontext",
          badgeVar: "danger",
          stripe: "border-t-rose-500",
          output:
            "„Eisbären besitzen wie die meisten Bären 42 Zähne.“ (Antwortet aus Vortraining ohne die aktuelle Datei zu prüfen.)",
          highlightNote: "Ohne strikte Regel überschreibt das Modell-Gedächtnis lokale Änderungen stillschweigend.",
          isGood: false,
        },
        {
          num: "02",
          variant: "harness",
          title: "Stufe 2 · Klare Regeln & Skills",
          folder: "stufe-2-skills-guardrails/",
          statusBadge: q4Mutated ? "Lokaler Kontext siegt" : "Originalwert aktiv",
          badgeVar: "warning",
          stripe: "border-t-amber-500",
          output: `„Laut der bereitgestellten Datei besitzt der Eisbär ${toothCount} (eisbaer.md).“`,
          highlightNote: q4Mutated
            ? "Verbindlicher Guardrail priorisiert die manipulierte Datei (38 Zähne) vor Vortraining."
            : "Aktuell steht der Originalwert 42 Zähne in eisbaer.md — umschaltbar zum Kontext-Beweis.",
          isGood: true,
        },
        {
          num: "03",
          variant: "vault",
          title: "Stufe 3 · Vernetztes Wissen (Vault)",
          folder: "stufe-3-obsidian-vault/",
          statusBadge: "Beleg + Pfad-Prüfung",
          badgeVar: "success",
          stripe: "border-t-brand-lime",
          output: q4Mutated
            ? "„[[eisbaer]] weist aktuell ausdrücklich 38 Zähne (eisbaer.md) aus — Widerspruch zu Standardwissen wird transparent markiert.“"
            : "„[[eisbaer]] weist 42 Zähne (eisbaer.md) aus — verknüpft mit _index.md und geprüft gegen raw/eisbaer.md.“",
          highlightNote: "Vault-Synthese zitiert exakt die Quelle und macht Abweichungen sofort prüfbar.",
          isGood: true,
        },
      ],
    };
  }

  return {
    key: "q3",
    tabLabel: "Frage 3 · Fangfrage",
    label: "Frage 3 · Fangfrage (Negativtest · 0 Treffer)",
    question:
      fromData?.question ||
      "Wie hoch ist der aktuelle Bestand an Schneeleoparden im Schweizerischen Nationalpark und welche jährlichen Tourismus-Eintrittspreise in Euro werden dort zum Artenschutz erhoben?",
    stages: [
      {
        num: "01",
        variant: "chaos",
        title: "Stufe 1 · Ohne Regeln (Chaos)",
        folder: "stufe-1-chaos/",
        statusBadge: "Halluzinations-Risiko",
        badgeVar: "danger",
        stripe: "border-t-rose-500",
        output:
          "„Im Schweizerischen Nationalpark gibt es schätzungsweise 15–20 Schneeleoparden. Der Eintrittspreis beträgt rund 18 Euro pro Erwachsenem…“",
        highlightNote: "Erfindet oder füllt aus Vorwissen — 0 Treffer in allen 68 Dateien!",
        isGood: false,
      },
      {
        num: "02",
        variant: "harness",
        title: "Stufe 2 · Klare Regeln & Skills",
        folder: "stufe-2-skills-guardrails/",
        statusBadge: "Guardrail greift",
        badgeVar: "warning",
        stripe: "border-t-amber-500",
        output:
          "„Diese Information ist in den vorliegenden Dokumenten nicht enthalten. Weder Schneeleoparden noch Eintrittspreise finden sich in docs/.“",
        highlightNote: "Verbindliche Guardrail-Regel #3 schlägt das Raten zuverlässig.",
        isGood: true,
      },
      {
        num: "03",
        variant: "vault",
        title: "Stufe 3 · Vernetztes Wissen (Vault)",
        folder: "stufe-3-obsidian-vault/",
        statusBadge: "Geprüfter Negativbeweis",
        badgeVar: "success",
        stripe: "border-t-brand-lime",
        output:
          "„Index-Prüfung (_index.md) zeigt in 1 Schritt: Kein Artikel zu Schneeleopard oder Nationalpark-Preisen im Vault. Keine Lücke überdeckt.“",
        highlightNote: "Schneller Negativ-Beweis über _index.md statt 68 Dateien zu raten.",
        isGood: true,
      },
    ],
  };
}

export function BeamerDemoSimulator({
  questionKey,
  onSelectQuestion,
  revealStep,
  onRevealStepChange,
  q4Mutated,
  onToggleQ4Mutated,
  questions,
  demoScenarios,
}: BeamerDemoSimulatorProps) {
  const override = demoScenarios?.[questionKey];
  const fallback = buildScenario(questionKey, q4Mutated, questions);
  const q4Spec = questions?.find((q) => q.id === "q4")?.manipulationCheck;
  const scenario: DemoScenario = override
    ? { key: questionKey, ...override }
    : fallback;

  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      {/* Question Spotlight & Question Selector */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
              {scenario.label}
            </span>
            <Badge variant="outline" className="num-tabular font-mono text-xs">
              Reveal: {Math.min(3, Math.max(0, revealStep))}/3
            </Badge>
          </div>
          <p className="font-display text-[clamp(1.1rem,1.6vw,1.55rem)] font-bold leading-snug text-foreground">
            „{scenario.question}“
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="no-scrollbar inline-flex max-w-full overflow-x-auto rounded-xl border bg-muted p-1">
            {QUESTION_ORDER.map((qKey) => {
              const tabText =
                demoScenarios?.[qKey]?.tabLabel ||
                buildScenario(qKey, q4Mutated, questions).tabLabel;
              const active = questionKey === qKey;
              return (
                <button
                  key={qKey}
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSelectQuestion(qKey);
                  }}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors sm:text-sm ${
                    active
                      ? "bg-brand-lime text-brand-obsidian shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tabText}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            size="sm"
            variant={revealStep < 3 ? "accent" : "outline"}
            onClick={(e) => {
              e.currentTarget.blur();
              if (revealStep < 3) {
                onRevealStepChange(revealStep + 1);
              } else {
                onRevealStepChange(0);
              }
            }}
            className="shrink-0 gap-1.5"
          >
            {revealStep < 3 ? (
              <>
                <Eye className="h-4 w-4" />
                <span>Stufe {revealStep + 1} aufdecken</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Neu verdecken</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Q4 Interactive Context-Prioritization Toggle — ONLY shown once Stufe 2+ is revealed */}
      {questionKey === "q4" && revealStep >= 2 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-lime/50 bg-secondary/40 px-5 py-3">
          <div className="flex items-center gap-2.5 text-base font-semibold text-foreground sm:text-lg">
            <Sparkles className="h-5 w-5 shrink-0 text-brand-ink" />
            <span>
              Live-Kontext-Test in{" "}
              <code className="rounded bg-card px-1.5 py-0.5 font-mono text-sm">
                {q4Spec?.targetFile || "eisbaer.md"}
              </code>
              :{" "}
              <strong className="text-brand-ink">
                {q4Mutated
                  ? `${q4Spec?.mutatedValue || "38 Zähne"} (testweise überschrieben)`
                  : `${q4Spec?.originalValue || "42 Zähne"} (Originalwert)`}
              </strong>
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant={q4Mutated ? "accent" : "outline"}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleQ4Mutated();
            }}
            className="h-auto min-h-9 max-w-full py-1.5 text-center font-semibold"
          >
            Test-Schalter: {q4Spec?.targetFile || "eisbaer.md"} ={" "}
            {q4Spec?.mutatedValue || "38 Zähne"} ↔ {q4Spec?.originalValue || "42 Zähne"}
          </Button>
        </div>
      )}

      {/* Progressive 3-Stage Columns */}
      <div className="grid flex-1 gap-4 md:grid-cols-3">
        {scenario.stages.map((col, idx) => {
          const isRevealed = revealStep >= idx + 1;
          const isNext = revealStep === idx;

          if (!isRevealed) {
            return (
              <button
                key={col.num}
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRevealStepChange(idx + 1);
                }}
                className={`group flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  isNext
                    ? "border-brand-lime bg-secondary/35 hover:bg-secondary/55"
                    : "border-border bg-card/60 opacity-80 hover:border-brand-lime/50 hover:opacity-100"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-card shadow-sm">
                  {isNext ? (
                    <Eye className="h-6 w-6 text-brand-ink" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="num-tabular font-mono text-xs font-bold uppercase tracking-widest text-brand-ink">
                    {col.num} · {col.folder}
                  </div>
                  <div className="font-display text-xl font-bold text-foreground">{col.title}</div>
                  <p className="text-base font-medium text-muted-foreground">
                    {isNext
                      ? `Space / N / Klick: Stufe ${idx + 1} aufdecken`
                      : `Danach: Stufe ${idx + 1} aufdecken`}
                  </p>
                </div>
              </button>
            );
          }

          return (
            <div
              key={col.num}
              className={`card-elevated flex flex-col justify-between rounded-2xl border border-t-4 ${col.stripe} bg-card p-5`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="num-tabular font-mono text-2xl font-extrabold text-muted-foreground/55">
                    {col.num}
                  </span>
                  <Badge variant={col.badgeVar}>{col.statusBadge}</Badge>
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                    {col.title}
                  </h3>
                  <code className="font-mono text-xs text-muted-foreground sm:text-sm">
                    {col.folder}
                  </code>
                </div>

                <div className="rounded-xl border bg-muted/40 px-3 py-1.5">
                  <StageMiniDiagram variant={col.variant} />
                </div>

                <div
                  className={`rounded-xl border p-4 text-base font-medium leading-snug sm:text-lg ${
                    col.isGood
                      ? "border-emerald-600/35 bg-emerald-500/10 text-foreground"
                      : "border-rose-600/35 bg-rose-500/10 text-foreground"
                  }`}
                >
                  {col.output}
                </div>
              </div>

              <div className="mt-3.5 flex items-start gap-2.5 border-t pt-3 text-sm font-medium leading-snug text-muted-foreground sm:text-base">
                {col.variant === "chaos" ? (
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-700 dark:text-rose-400" />
                ) : col.variant === "harness" ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                ) : (
                  <Network className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" />
                )}
                <span>{col.highlightNote}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
