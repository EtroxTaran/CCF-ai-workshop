import { useEffect, useId, useMemo, useState } from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateRulebook, type RulebookFormat } from "@/lib/outputValidator";
import type { ToolMode, TransferBridgeRole } from "@/types/workshop";

const FORMAT_OPTIONS: { id: RulebookFormat; label: string; hint: string }[] = [
  {
    id: "agents-md",
    label: "AGENTS.md / CLI",
    hint: "Für Claude Code, Codex CLI, OpenCode & Gemini CLI",
  },
  {
    id: "custom-instructions",
    label: "Langdock / Projects / Gems",
    hint: "Für Langdock Assistants, ChatGPT / Claude Projects & Gemini Gems",
  },
  {
    id: "ide-rules",
    label: "Antigravity / Cursor / Windsurf / VS Code",
    hint: "Für Workspace-Regeln (.agents/rules / .github/copilot-instructions.md)",
  },
];

function defaultFormatForToolMode(mode?: ToolMode): RulebookFormat {
  if (mode === "web" || mode === "desktop") return "custom-instructions";
  if (mode === "ide") return "ide-rules";
  return "agents-md";
}

const RISK_TEMPLATES = [
  {
    id: "facts",
    label: "Erfundene Zahlen / Fristen",
    rule: "Nutze ausschließlich Zahlen, Beträge und Daten aus den bereitgestellten Unterlagen — kein Vorwissen ergänzen.",
    trap: "Stelle dem Chat anschließend absichtlich eine Frage nach einer Kennzahl, die NICHT in deinen Notizen steht, und prüfe auf „[Nicht in Quelle]“.",
  },
  {
    id: "gaps",
    label: "Stillschweigende Lücken",
    rule: "Nutze ausschließlich Informationen aus den vorliegenden Dateien (kein Vorwissen). Fehlt eine Angabe, schreibe sichtbar „[Nicht in Quelle]“ bzw. „[Noch klären]“.",
    trap: "Lasse eine wichtige Information bewusst aus deinen Stichpunkten weg und prüfe, ob „[Nicht in Quelle]“ sauber erscheint.",
  },
  {
    id: "format",
    label: "Unerwünschter Roman statt Tabelle/Liste",
    rule: "Nutze ausschließlich die beigefügten Unterlagen (kein Vorwissen) und gib maximal 5 knappe Bulletpoints im Schema „Punkt | Verantwortlich | Quelle“ aus.",
    trap: "Schicke einen langen Fließtext hinein und prüfe, ob die Antwort trotzdem im Schema bleibt.",
  },
];

function formatTaskGoal(useCase?: string): string {
  const cleaned = String(useCase || "")
    .replace(/`/g, "")
    .trim()
    .replace(/\.+$/, "")
    .trim();
  return cleaned || "Meeting-Notizen strukturiert zusammenfassen";
}

const ROLE_TRAP_QUESTIONS: Record<string, string> = {
  "office-management":
    "Wie hoch ist das Sonderbudget für die Weihnachtsfeier im nächsten Quartal?",
  "office-orga":
    "Wie hoch ist das Sonderbudget für die Weihnachtsfeier im nächsten Quartal?",
  "kunden-projekte":
    "Welche Vertragsstrafe pro Verzugstag wurde für das Q4-Pilotprojekt vereinbart?",
  projektleitung:
    "Welche Vertragsstrafe pro Verzugstag wurde für das Q4-Pilotprojekt vereinbart?",
  "fachkonzept-daten":
    "Welche externe Rating-API-Feldlänge gilt laut Pflichtenheft für das neue Score-Feld?",
  "ba-fachkonzept":
    "Welche externe Rating-API-Feldlänge gilt laut Pflichtenheft für das neue Score-Feld?",
  "betrieb-datenbanken":
    "Welcher konkrete SSH-Port und welches Notfall-Passwort gelten für den Failover-Cluster?",
  "betrieb-runbooks":
    "Welcher konkrete SSH-Port und welches Notfall-Passwort gelten für den Failover-Cluster?",
  "entwicklung-architektur":
    "Welche genaue Signatur-Bibliothek und Key-Rotation-Frist schreibt die fehlende Security-ADR vor?",
  "architektur-dev":
    "Welche genaue Signatur-Bibliothek und Key-Rotation-Frist schreibt die fehlende Security-ADR vor?",
};

function defaultTrapQuestionForRole(role?: TransferBridgeRole): string {
  if (role?.id && ROLE_TRAP_QUESTIONS[role.id]) {
    return ROLE_TRAP_QUESTIONS[role.id];
  }
  const haystack = `${role?.id || ""} ${role?.title || ""}`.toLowerCase();
  if (/office|assistenz|orga|pmo/.test(haystack)) return ROLE_TRAP_QUESTIONS["office-management"];
  if (/projekt|kunden|account/.test(haystack)) return ROLE_TRAP_QUESTIONS["kunden-projekte"];
  if (/fachkonzept|daten|analyse/.test(haystack)) return ROLE_TRAP_QUESTIONS["fachkonzept-daten"];
  if (/betrieb|datenbank|runbook|sla/.test(haystack)) return ROLE_TRAP_QUESTIONS["betrieb-datenbanken"];
  if (/entwicklung|architektur|dev/.test(haystack)) return ROLE_TRAP_QUESTIONS["entwicklung-architektur"];
  return "Welche konkreten Euro-Beträge und Freigabefristen gelten für das nicht dokumentierte Sonderpaket?";
}

export interface ByouRuleBuilderProps {
  rolePresets: TransferBridgeRole[];
  toolMode?: ToolMode;
  onCopyOutput?: () => void;
  onRulebookChange?: (state: {
    agentsMd: string;
    trapQuestion: string;
    passed: boolean;
    format: RulebookFormat;
    formatLabel: string;
  }) => void;
}

export function ByouRuleBuilder({
  rolePresets,
  toolMode,
  onCopyOutput,
  onRulebookChange,
}: ByouRuleBuilderProps) {
  const uid = useId();
  const [ruleFormat, setRuleFormat] = useState<RulebookFormat>(() =>
    defaultFormatForToolMode(toolMode)
  );
  const [formatManuallyChosen, setFormatManuallyChosen] = useState(false);

  useEffect(() => {
    if (!formatManuallyChosen && toolMode) {
      setRuleFormat(defaultFormatForToolMode(toolMode));
    }
  }, [toolMode, formatManuallyChosen]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>(rolePresets[0]?.id || "custom");
  const [taskGoal, setTaskGoal] = useState<string>(() =>
    formatTaskGoal(rolePresets[0]?.ccfUseCase)
  );
  const [selectedRiskId, setSelectedRiskId] = useState<string>("facts");
  const [customGap, setCustomGap] = useState<string>(() =>
    defaultTrapQuestionForRole(rolePresets[0])
  );
  const [gapEditedByUser, setGapEditedByUser] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const selectedRole = rolePresets.find((r) => r.id === selectedRoleId) || rolePresets[0];
  const selectedRisk = RISK_TEMPLATES.find((r) => r.id === selectedRiskId) || RISK_TEMPLATES[0];
  const activeFormatMeta =
    FORMAT_OPTIONS.find((f) => f.id === ruleFormat) || FORMAT_OPTIONS[0];

  const generatedAgentsMd = useMemo(() => {
    const roleLabel = selectedRole?.roles || "Mein Arbeitsbereich";
    const goalText = taskGoal.trim() || "Unterlagen präzise und belegt auswerten.";
    if (ruleFormat === "custom-instructions") {
      return [
        `System- & Assistant-Anweisung (${activeFormatMeta.label}) · ${roleLabel}`,
        "",
        `Aufgabe: ${goalText}`,
        "",
        "Verbindliche Leitplanken für Assistant / Knowledge Folder:",
        `1. ${selectedRisk.rule}`,
        "2. Belege jede Aussage mit dem Dateinamen der Wissensdatei (z. B. datei.md).",
        "3. Kein allgemeines Vorwissen beimischen; fehlende Angaben zwingend mit „[Nicht in Quelle]“ markieren.",
      ].join("\n");
    }
    if (ruleFormat === "ide-rules") {
      return [
        `# Workspace-Regel (.agents/rules / copilot-instructions.md) · ${roleLabel}`,
        "",
        `Scope & Ziel: ${goalText}`,
        "",
        "## Editor- & Agent-Leitplanken",
        `1. ${selectedRisk.rule}`,
        "2. Belege jede Aussage mit dem exakten Workspace-Dateinamen (datei.md).",
        "3. Keine Vermutungen aus Modell-Vorwissen; Lücken zwingend mit „[Nicht in Quelle]“ markieren.",
      ].join("\n");
    }
    return [
      `# Arbeits-Regel (AGENTS.md) · ${roleLabel}`,
      "",
      `Ziel: ${goalText}`,
      "",
      "## Verbindliche Leitplanken",
      `1. ${selectedRisk.rule}`,
      "2. Belege jede Aussage mit dem exakten Dateinamen (datei.md).",
      "3. Kein allgemeines Vorwissen beimischen; Lücken zwingend mit „[Nicht in Quelle]“ markieren.",
    ].join("\n");
  }, [selectedRole, taskGoal, selectedRisk, ruleFormat, activeFormatMeta.label]);

  const ruleValidation = useMemo(
    () => validateRulebook(generatedAgentsMd, customGap, { format: ruleFormat }),
    [generatedAgentsMd, customGap, ruleFormat]
  );

  useEffect(() => {
    onRulebookChange?.({
      agentsMd: generatedAgentsMd,
      trapQuestion: customGap,
      passed: ruleValidation.passed && hasUserInteracted,
      format: ruleFormat,
      formatLabel: activeFormatMeta.label,
    });
  }, [
    generatedAgentsMd,
    customGap,
    ruleValidation.passed,
    hasUserInteracted,
    ruleFormat,
    activeFormatMeta.label,
    onRulebookChange,
  ]);

  const generatedTrapTest = useMemo(() => {
    return `${generatedAgentsMd}\n\n---\nSELBSTTEST (FANGFRAGE):\n${customGap.trim() || selectedRisk.trap}`;
  }, [generatedAgentsMd, customGap, selectedRisk]);

  return (
    <section
      data-testid="byou-rule-builder"
      className="rounded-2xl border border-brand-lime/45 bg-card p-5 space-y-4"
    >
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
            zu einer geprüften <code>AGENTS.md</code> / Projekt-Anweisung.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={ruleValidation.passed ? "success" : "warning"} className="gap-1 text-[11px]">
            {ruleValidation.passed ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <ShieldAlert className="h-3 w-3" />
            )}
            <span>
              {ruleValidation.score}/{ruleValidation.maxScore} Säulen geprüft
            </span>
          </Badge>
          <Badge variant="outline" className="gap-1 text-[11px]">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>Nur öffentliche / anonymisierte Infos!</span>
          </Badge>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/25 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            Zielformat wählen
          </span>
          <span className="text-[11px] text-muted-foreground">{activeFormatMeta.hint}</span>
        </div>
        <div
          data-testid="byou-format-switcher"
          role="group"
          aria-label="Zielformat der Hausregel"
          className="grid gap-1.5 sm:grid-cols-3"
        >
          {FORMAT_OPTIONS.map((opt) => {
            const active = opt.id === ruleFormat;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                data-testid={`byou-format-${opt.id}`}
                onClick={() => {
                  setFormatManuallyChosen(true);
                  setRuleFormat(opt.id);
                  setHasUserInteracted(true);
                }}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                  active
                    ? "border-brand-lime bg-card font-semibold text-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor={`${uid}-role`} className="text-xs font-semibold text-foreground">
            1. Bereich wählen
          </label>
          <select
            id={`${uid}-role`}
            value={selectedRoleId}
            onChange={(e) => {
              const nextId = e.target.value;
              setSelectedRoleId(nextId);
              setHasUserInteracted(true);
              const found = rolePresets.find((r) => r.id === nextId);
              if (found) {
                setTaskGoal(formatTaskGoal(found.ccfUseCase));
                if (!gapEditedByUser) {
                  setCustomGap(defaultTrapQuestionForRole(found));
                }
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
          <label htmlFor={`${uid}-risk`} className="text-xs font-semibold text-foreground">
            2. Größtes Risiko
          </label>
          <select
            id={`${uid}-risk`}
            value={selectedRiskId}
            onChange={(e) => {
              setSelectedRiskId(e.target.value);
              setHasUserInteracted(true);
            }}
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
          <label htmlFor={`${uid}-gap`} className="text-xs font-semibold text-foreground">
            3. Test-Fangfrage (Negativtest)
          </label>
          <Input
            id={`${uid}-gap`}
            value={customGap}
            onChange={(e) => {
              setCustomGap(e.target.value);
              setGapEditedByUser(true);
              setHasUserInteracted(true);
            }}
            className="h-9 text-xs"
            placeholder="Frage nach etwas, das sicher fehlt…"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${uid}-goal`} className="text-xs font-semibold text-foreground">
          Was soll die KI tun? (ohne vertrauliche Namen/Zahlen)
        </label>
        <Textarea
          id={`${uid}-goal`}
          value={taskGoal}
          onChange={(e) => {
            setTaskGoal(e.target.value);
            setHasUserInteracted(true);
          }}
          rows={2}
          className="text-xs"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border bg-muted/35 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground">
              Deine fertige Hausregel ({activeFormatMeta.label})
            </span>
            <CopyButton
              text={generatedAgentsMd}
              label="Regel kopieren"
              variant="default"
              onCopy={() => {
                setHasUserInteracted(true);
                onCopyOutput?.();
              }}
            />
          </div>
          <pre
            data-testid="byou-rule-preview"
            className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground"
          >
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
              onCopy={() => {
                setHasUserInteracted(true);
                onCopyOutput?.();
              }}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{selectedRisk.trap}</p>
          <div className="rounded-lg border bg-card p-2.5 font-mono text-[11px] text-foreground">
            {customGap || selectedRisk.trap}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/25 px-3.5 py-2.5 text-xs">
        <span className="text-muted-foreground">
          {hasUserInteracted && ruleValidation.passed
            ? "Hausregel bestätigt — für Nachweis 6 und Takeaway-Export aktiv."
            : "Passe Rolle, Aufgabe oder Fangfrage an, kopiere die Regel oder bestätige die Vorlage für Nachweis 6."}
        </span>
        <Button
          type="button"
          size="sm"
          variant={hasUserInteracted ? "secondary" : "default"}
          data-testid="byou-confirm-btn"
          onClick={() => setHasUserInteracted(true)}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            {hasUserInteracted
              ? "Für Nachweis 6 übernommen"
              : "Hausregel für Nachweis 6 übernehmen"}
          </span>
        </Button>
      </div>
    </section>
  );
}
