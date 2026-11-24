import { useState } from "react";
import { Network, ShieldAlert, ShieldCheck } from "lucide-react";
import { StageMiniDiagram } from "@/components/StageMiniDiagram";
import { Badge } from "@/components/ui/badge";

type DemoQuestionKey = "q3" | "q2";

const DEMO_SCENARIOS: Record<
  DemoQuestionKey,
  {
    label: string;
    question: string;
    stages: {
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
    }[];
  }
> = {
  q3: {
    label: "Frage 3 · Fangfrage (Negativtest)",
    question:
      "„Wie hoch ist der aktuelle Bestand an Schneeleoparden im Schweizerischen Nationalpark und welche Eintrittspreise in Euro werden erhoben?“",
    stages: [
      {
        num: "01",
        variant: "chaos",
        title: "Stufe 1 · Chaos",
        folder: "stufe-1-chaos/",
        statusBadge: "Halluzinations-Risiko",
        badgeVar: "danger",
        stripe: "border-t-rose-500",
        output:
          "„Im Schweizerischen Nationalpark gibt es schätzungsweise 15–20 Schneeleoparden. Der Eintrittspreis beträgt rund 18 Euro pro Erwachsenem…“",
        highlightNote: "Erfindet oder füllt aus Vorwissen – 0 Treffer im lokalen Korpus!",
        isGood: false,
      },
      {
        num: "02",
        variant: "harness",
        title: "Stufe 2 · Harness",
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
        title: "Stufe 3 · Obsidian-Vault",
        folder: "stufe-3-obsidian-vault/",
        statusBadge: "Geprüft & belegt",
        badgeVar: "success",
        stripe: "border-t-brand-lime",
        output:
          "„Index-Prüfung (_index.md) zeigt: Kein Artikel zu Schneeleopard oder Nationalpark-Preisen im Vault. Keine Lücke überdeckt.“",
        highlightNote: "Schneller Negativ-Beweis über _index.md statt 68 Dateien zu raten.",
        isGood: true,
      },
    ],
  },
  q2: {
    label: "Frage 2 · Querverbindung (4+ Dateien)",
    question:
      "„Wie schützen sich Anemonenfische vor Nesselzellen, welcher Symbiose-Typ liegt jeweils vor, und was droht bei Erwärmung im Korallenriff?“",
    stages: [
      {
        num: "01",
        variant: "chaos",
        title: "Stufe 1 · Chaos",
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
        title: "Stufe 2 · Harness",
        folder: "stufe-2-skills-guardrails/",
        statusBadge: "Mit Quellen · Suchaufwand",
        badgeVar: "warning",
        stripe: "border-t-amber-500",
        output:
          "„Geringer Sialinsäure-Anteil schützt vor Vernesselung (docs/anemonenfische.md). Ab ~29 °C droht Ausbleichen binnen acht Wochen (docs/korallenbleiche.md).“",
        highlightNote: "Saubere Quellenpflicht, muss aber viele lose Dateien in docs/ durchkämmen.",
        isGood: true,
      },
      {
        num: "03",
        variant: "vault",
        title: "Stufe 3 · Obsidian-Vault",
        folder: "stufe-3-obsidian-vault/",
        statusBadge: "Graph-Synthese",
        badgeVar: "success",
        stripe: "border-t-brand-lime",
        output:
          "„[[anemonenfische]] = Ektosymbiose ([[symbiose]]), [[steinkorallen]] + Zooxanthellen = Endosymbiose. Wärmestress ≥ 29 °C → Photoinhibition → Tod nach ca. acht Wochen ([[korallenbleiche]]).“",
        highlightNote: "_index.md + [[Wikilinks]] verknüpfen exakt alle 4+ relevanten Artikel.",
        isGood: true,
      },
    ],
  },
};

export function BeamerDemoSimulator() {
  const [scenarioKey, setScenarioKey] = useState<DemoQuestionKey>("q3");
  const scenario = DEMO_SCENARIOS[scenarioKey];

  return (
    <div className="flex flex-1 flex-col justify-between gap-3 xl:my-auto xl:max-h-[600px]">
      <div className="flex flex-col gap-2.5 rounded-2xl border bg-card/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-ink">
            {scenario.label}
          </div>
          <p className="font-display text-sm font-semibold leading-snug text-foreground sm:text-base">
            {scenario.question}
          </p>
        </div>

        <div className="inline-flex shrink-0 rounded-xl border bg-muted p-1">
          <button
            type="button"
            onClick={() => setScenarioKey("q3")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              scenarioKey === "q3"
                ? "bg-brand-lime text-brand-obsidian"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Frage 3 · Fangfrage
          </button>
          <button
            type="button"
            onClick={() => setScenarioKey("q2")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              scenarioKey === "q2"
                ? "bg-brand-lime text-brand-obsidian"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Frage 2 · Querverbindung
          </button>
        </div>
      </div>

      <div className="grid flex-1 gap-3.5 md:grid-cols-3">
        {scenario.stages.map((col) => (
          <div
            key={col.num}
            className={`card-elevated flex flex-col justify-between rounded-2xl border border-t-4 ${col.stripe} bg-card p-4`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="num-tabular font-mono text-2xl font-extrabold text-muted-foreground/45">
                  {col.num}
                </span>
                <Badge variant={col.badgeVar}>{col.statusBadge}</Badge>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold sm:text-xl">{col.title}</h3>
                <code className="text-xs text-muted-foreground">{col.folder}</code>
              </div>

              <div className="rounded-xl border bg-muted/30 px-3 py-1">
                <StageMiniDiagram variant={col.variant} />
              </div>

              <div
                className={`rounded-xl border p-3 text-[13px] leading-snug ${
                  col.isGood
                    ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
                    : "border-rose-500/30 bg-rose-500/10 text-foreground"
                }`}
              >
                {col.output}
              </div>
            </div>

            <div className="mt-2.5 flex items-start gap-2 border-t pt-2.5 text-xs leading-snug text-muted-foreground">
              {col.variant === "chaos" ? (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              ) : col.variant === "harness" ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-brand-lime" />
              )}
              <span>{col.highlightNote}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
