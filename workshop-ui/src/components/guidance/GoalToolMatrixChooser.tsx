import { useState } from "react";
import {
  ArrowRight,
  Check,
  Code2,
  Compass,
  FolderOpen,
  Globe,
  HelpCircle,
  LayoutGrid,
  Presentation,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlossaryTip } from "@/components/guidance/GlossaryTip";
import type { GoalId, GoalTrackSpec, ToolMode, ToolModeSpec } from "@/types/workshop";

const GOAL_ICONS: Record<GoalId, typeof Sparkles> = {
  prompting: Sparkles,
  "app-building": Wrench,
  presentations: Presentation,
  "everyday-ai": Compass,
};

const MODE_ICONS: Record<ToolMode, typeof Globe> = {
  web: Globe,
  desktop: FolderOpen,
  ide: Code2,
  agent: Terminal,
};

export interface GoalToolMatrixChooserProps {
  goalTracks: GoalTrackSpec[];
  selectedGoalId: GoalId;
  onSelectGoal: (id: GoalId) => void;
  toolModes: ToolModeSpec[];
  selectedToolMode: ToolMode;
  onSelectToolMode: (mode: ToolMode) => void;
  onContinue: () => void;
  moduleTitle: string;
}

export function GoalToolMatrixChooser({
  goalTracks,
  selectedGoalId,
  onSelectGoal,
  toolModes,
  selectedToolMode,
  onSelectToolMode,
  onContinue,
  moduleTitle,
}: GoalToolMatrixChooserProps) {
  const [showHelper, setShowHelper] = useState(false);

  return (
    <section
      data-testid="goal-tool-matrix"
      className="space-y-6 rounded-3xl border border-brand-lime/45 bg-card p-5 shadow-sm sm:p-6"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            <Compass className="h-3.5 w-3.5" />
            <span>In 10 Sekunden startklar · Ziel × Werkzeug</span>
          </div>
          <h2 className="font-display text-lg font-extrabold text-foreground sm:text-xl">
            Was möchtest du heute erreichen — und womit arbeitest du?
          </h2>
          <p className="text-xs text-muted-foreground">
            Modul: <strong className="text-foreground">{moduleTitle}</strong> · Du kannst Ziel und
            Werkzeug jederzeit oben wechseln.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#/hub"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-muted/40 px-3 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-brand-ink" />
            <span>Thema im Hub wechseln</span>
          </a>
          <Button type="button" size="sm" onClick={onContinue} data-testid="btn-start-next">
            <span>Weiter zu Schritt 02: Prompt-Methoden</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 1. Goal Selection */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            1 · Dein Ziel für heute wählen (passt Schritt 04 &amp; Ergebnis-Prüfung an)
          </span>
          <Badge variant="outline" className="text-[11px]">
            4 Ziele verfügbar
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {goalTracks.map((track) => {
            const Icon = GOAL_ICONS[track.id];
            const isActive = track.id === selectedGoalId;
            return (
              <button
                key={track.id}
                type="button"
                aria-pressed={isActive}
                data-testid={`goal-card-${track.id}`}
                onClick={() => onSelectGoal(track.id)}
                className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-primary bg-secondary/55 ring-1 ring-primary shadow-sm"
                    : "bg-muted/20 hover:bg-muted/45"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-foreground">
                      <Icon className="h-4 w-4 shrink-0 text-brand-ink" />
                      <span>{track.shortLabel}</span>
                    </span>
                    {isActive && (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {track.audienceHint}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-md border bg-card px-2 py-0.5 text-[10px] font-medium text-brand-ink">
                  {track.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tool Selection (4 Modes) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <span>2 · Dein Werkzeug wählen (passt Klick-, Ordner-, IDE- &amp; CLI-Anleitungen an)</span>
            <GlossaryTip id="prompt" label="Prompt?" />
            {selectedToolMode !== "agent" && selectedToolMode !== "ide" && (
              <GlossaryTip id="markdown" label=".md-Datei?" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowHelper((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{showHelper ? "Auswahlhilfe schließen" : "Welches Werkzeug passt zu mir?"}</span>
          </button>
        </div>

        {showHelper && (
          <div className="grid gap-2 rounded-xl border bg-muted/35 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <strong className="text-foreground">Kein Setup / nur Browser?</strong> →{" "}
              <button
                type="button"
                onClick={() => onSelectToolMode("web")}
                className="font-semibold text-brand-ink underline"
              >
                Web-Chat
              </button>{" "}
              (ChatGPT, Claude, Gemini, Langdock, M365 Copilot)
            </div>
            <div>
              <strong className="text-foreground">Ordner / Projects / Gems?</strong> →{" "}
              <button
                type="button"
                onClick={() => onSelectToolMode("desktop")}
                className="font-semibold text-brand-ink underline"
              >
                Desktop &amp; Projects
              </button>
            </div>
            <div>
              <strong className="text-foreground">VS Code / Cursor / Copilot?</strong> →{" "}
              <button
                type="button"
                onClick={() => onSelectToolMode("ide")}
                className="font-semibold text-brand-ink underline"
              >
                IDE &amp; Editor
              </button>
            </div>
            <div>
              <strong className="text-foreground">Terminal + MCP-Server?</strong> →{" "}
              <button
                type="button"
                onClick={() => onSelectToolMode("agent")}
                className="font-semibold text-brand-ink underline"
              >
                CLI Code-Agent
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {toolModes.map((mode) => {
            const Icon = MODE_ICONS[mode.id] || Globe;
            const isActive = selectedToolMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={isActive}
                data-testid={`tool-card-${mode.id}`}
                onClick={() => onSelectToolMode(mode.id)}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-primary bg-secondary/45 ring-1 ring-primary"
                    : "bg-card hover:bg-muted/40"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                      <Icon className="h-4 w-4 shrink-0 text-brand-ink" />
                      <span>{mode.label}</span>
                    </span>
                    {isActive ? (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {mode.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{mode.summary}</p>
                </div>

                <div className="space-y-1.5 border-t pt-2 text-[10px]">
                  <div className="flex flex-wrap gap-1">
                    {mode.examples.map((ex) => (
                      <span
                        key={ex}
                        className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
