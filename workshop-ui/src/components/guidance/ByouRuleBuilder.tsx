import { useMemo, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TransferBridgeRole } from "@/types/workshop";

const RISK_TEMPLATES = [
  {
    id: "facts",
    label: "Erfundene Zahlen / Fristen",
    rule: "Nutze ausschließlich Zahlen, Beträge und Daten aus den bereitgestellten Unterlagen — niemals schätzen.",
    trap: "Stelle dem Chat anschließend absichtlich eine Frage nach einer Kennzahl, die NICHT in deinen Notizen steht, und prüfe auf „[Nicht in Quelle]“.",
  },
  {
    id: "gaps",
    label: "Stillschweigende Lücken",
    rule: "Fehlt eine Angabe (z. B. Zuständigkeit, Budget oder Termin), schreibe sichtbar „[Noch klären]“ statt die Lücke zu überspielen.",
    trap: "Lasse eine wichtige Information bewusst aus deinen Stichpunkten weg und prüfe, ob „[Noch klären]“ sauber erscheint.",
  },
  {
    id: "format",
    label: "Unerwünschter Roman statt Tabelle/Liste",
    rule: "Gib maximal 5 knappe Bulletpoints im Schema „Punkt | Verantwortlich | Quelle“ aus.",
    trap: "Schicke einen langen Fließtext hinein und prüfe, ob die Antwort trotzdem im Schema bleibt.",
  },
];

export interface ByouRuleBuilderProps {
  rolePresets: TransferBridgeRole[];
  onCopyOutput?: () => void;
}

export function ByouRuleBuilder({ rolePresets, onCopyOutput }: ByouRuleBuilderProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(rolePresets[0]?.id || "custom");
  const [taskGoal, setTaskGoal] = useState<string>(
    rolePresets[0]?.ccfUseCase?.split(".")[0] || "Meeting-Notizen strukturiert zusammenfassen"
  );
  const [selectedRiskId, setSelectedRiskId] = useState<string>("facts");
  const [customGap, setCustomGap] = useState<string>(
    "Wie hoch ist das Sonderbudget für die Weihnachtsfeier im nächsten Quartal?"
  );

  const selectedRole = rolePresets.find((r) => r.id === selectedRoleId) || rolePresets[0];
  const selectedRisk = RISK_TEMPLATES.find((r) => r.id === selectedRiskId) || RISK_TEMPLATES[0];

  const generatedAgentsMd = useMemo(() => {
    const roleLabel = selectedRole?.roles || "Mein Arbeitsbereich";
    return [
      `# Arbeits-Regel · ${roleLabel}`,
      "",
      `Ziel: ${taskGoal.trim() || "Unterlagen präzise und belegt auswerten."}`,
      "",
      "## Verbindliche Leitplanken",
      `1. ${selectedRisk.rule}`,
      "2. Nenne bei jeder Aussage die exakte Quelle aus dem Dokument.",
      "3. Kein allgemeines Vorwissen beimischen; Lücken mit „[Nicht in Quelle]“ markieren.",
    ].join("\n");
  }, [selectedRole, taskGoal, selectedRisk]);

  const generatedTrapTest = useMemo(() => {
    return `${generatedAgentsMd}\n\n---\nSELBSTTEST (FANGFRAGE):\n${customGap.trim() || selectedRisk.trap}`;
  }, [generatedAgentsMd, customGap, selectedRisk]);

  return (
    <section className="rounded-2xl border border-brand-lime/45 bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Eigene Regel &amp; Fangfrage bauen (für Montagmorgen)</span>
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Baue deine erste eigene Hausregel in 30 Sekunden
          </h3>
          <p className="text-xs text-muted-foreground">
            Statt nur Vorlagen zu kopieren: Kombiniere deine Rolle, Aufgabe und größte Fehlerquelle
            zu einer testbaren <code>AGENTS.md</code> / Projekt-Anweisung.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[11px]">
          <ShieldCheck className="h-3 w-3 text-emerald-600" />
          <span>Nur öffentliche / anonymisierte Infos!</span>
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">1. Bereich wählen</label>
          <select
            value={selectedRoleId}
            onChange={(e) => {
              const nextId = e.target.value;
              setSelectedRoleId(nextId);
              const found = rolePresets.find((r) => r.id === nextId);
              if (found) {
                setTaskGoal(found.ccfUseCase.split(" — ")[0].slice(0, 140));
              }
            }}
            className="h-9 w-full rounded-lg border bg-background px-2.5 text-xs text-foreground"
          >
            {rolePresets.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">2. Größtes Risiko</label>
          <select
            value={selectedRiskId}
            onChange={(e) => setSelectedRiskId(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-2.5 text-xs text-foreground"
          >
            {RISK_TEMPLATES.map((rk) => (
              <option key={rk.id} value={rk.id}>
                {rk.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">3. Test-Fangfrage (Negativtest)</label>
          <Input
            value={customGap}
            onChange={(e) => setCustomGap(e.target.value)}
            className="h-9 text-xs"
            placeholder="Frage nach etwas, das sicher fehlt…"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Was soll die KI tun? (ohne vertrauliche Namen/Zahlen)
        </label>
        <Textarea
          value={taskGoal}
          onChange={(e) => setTaskGoal(e.target.value)}
          rows={2}
          className="text-xs"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border bg-muted/35 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground">
              Deine fertige Hausregel (AGENTS.md / Projekt-Anweisung)
            </span>
            <CopyButton
              text={generatedAgentsMd}
              label="Regel kopieren"
              variant="default"
              onCopy={onCopyOutput}
            />
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground">
            {generatedAgentsMd}
          </pre>
        </div>

        <div className="space-y-2 rounded-xl border border-brand-lime/40 bg-secondary/25 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground">
              Regel + Fangfrage zum Sofort-Test
            </span>
            <CopyButton
              text={generatedTrapTest}
              label="Test komplett kopieren"
              variant="secondary"
              onCopy={onCopyOutput}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{selectedRisk.trap}</p>
          <div className="rounded-lg border bg-card p-2.5 font-mono text-[11px] text-foreground">
            {customGap || selectedRisk.trap}
          </div>
        </div>
      </div>
    </section>
  );
}
