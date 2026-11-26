import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, Layers } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { ContextWindowAnimatic } from "@/components/guidance/ContextWindowAnimatic";
import { GlossaryTip } from "@/components/guidance/GlossaryTip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ArchitectureLayer, ToolMode } from "@/types/workshop";

interface ArchitectureLayerStackProps {
  layers: ArchitectureLayer[];
  chatRulesTemplate: string;
  toolMode: ToolMode;
  agentsMdTemplate?: string;
  onCopyTemplate?: () => void;
}

export function ArchitectureLayerStack({
  layers,
  chatRulesTemplate,
  toolMode,
  agentsMdTemplate,
  onCopyTemplate,
}: ArchitectureLayerStackProps) {
  const prefersReduced = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState<number>(2);
  const active = layers[activeIdx] || layers[0];
  const usesRepoAgents = toolMode !== "web" && Boolean(agentsMdTemplate);
  const activeTemplate = usesRepoAgents ? agentsMdTemplate! : chatRulesTemplate;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            <Layers className="h-3.5 w-3.5" />
            <span>Steuerungs-Ebenen &amp; Kontext-Fenster</span>
            <GlossaryTip id="priming" label="Priming?" />
            {toolMode !== "web" && <GlossaryTip id="agents-md" label="AGENTS.md?" />}
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            5 Steuerungs-Ebenen auf einen Blick
          </h3>
          <p className="editorial-measure text-sm text-muted-foreground">
            {toolMode === "web"
              ? "In Web-Chats gelten Regeln nur für das aktuelle Fenster — dauerhafte System-Regeln halten Quellenpflicht und Format auch in langen Verläufen stabil."
              : toolMode === "desktop"
                ? "In Claude Cowork lädt AGENTS.md automatisch aus dem entpackten Ordner; in ChatGPT / Claude.ai Projects fügst du die Regeln einmal in die Projekt-Anweisungen ein."
                : "Code-Agent kombiniert AGENTS.md, Skills und MCP-Werkzeuge zu einem verlässlichen Projekt-System."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton
            text={activeTemplate}
            label={usesRepoAgents ? "AGENTS.md (Stufe 2) kopieren" : "Chat-Basis-Regeln kopieren"}
            toastMessage={
              usesRepoAgents
                ? "AGENTS.md (Stufe 2) in Zwischenablage kopiert"
                : "Chat-Basis-Regeln in Zwischenablage kopiert"
            }
            variant="secondary"
            onCopy={onCopyTemplate}
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <Eye className="h-3.5 w-3.5" />
                <span>{usesRepoAgents ? "System-Regel ansehen" : "Regeltext ansehen"}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {usesRepoAgents
                    ? "AGENTS.md System-Regel (Stufe 2)"
                    : "Chat-Basis-Regeln (am Chat-Start senden)"}
                </SheetTitle>
                <SheetDescription>
                  {usesRepoAgents ? (
                    toolMode === "desktop" ? (
                      <>
                        In Claude Cowork greift diese Regel automatisch aus{" "}
                        <code>stufe-2-skills-guardrails/</code>. In ChatGPT oder Claude.ai Projects
                        kopierst du den Text einmal in die Projekt-Anweisungen.
                      </>
                    ) : (
                      <>
                        Diese Datei steuert dein Werkzeug automatisch im Ordner{" "}
                        <code>stufe-2-skills-guardrails/</code>.
                      </>
                    )
                  ) : (
                    <>
                      Öffne einen neuen Chat im Web-Chat, füge zuerst diesen Text ein und sende
                      danach deine Texte und Fragen.
                    </>
                  )}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-4">
                <CopyButton
                  text={activeTemplate}
                  label={usesRepoAgents ? "AGENTS.md kopieren" : "Basis-Regeln kopieren"}
                  variant="default"
                  onCopy={onCopyTemplate}
                />
                <pre className="whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                  {activeTemplate}
                </pre>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Interactive Split: Left Stack / Right Inspector */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-6">
          {[...layers].reverse().map((layer, revIdx) => {
            const realIdx = layers.length - 1 - revIdx;
            const isSelected = realIdx === activeIdx;
            const powerPct = (realIdx + 1) * 20;
            return (
              <button
                key={layer.layer}
                type="button"
                onClick={() => setActiveIdx(realIdx)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "translate-x-1 border-brand-lime bg-secondary/50 shadow-sm"
                    : "bg-card hover:bg-muted/50"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground">{layer.layer}</div>
                  <div className="text-xs leading-snug text-muted-foreground">{layer.analogy}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                    <div
                      className="h-full rounded-full bg-brand-lime"
                      style={{ width: `${powerPct}%` }}
                    />
                  </div>
                  <span className="num-tabular font-mono text-[11px] font-semibold text-muted-foreground">
                    {powerPct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.layer}
              initial={prefersReduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: prefersReduced ? 0 : 0.15 }}
              className="flex h-full flex-col justify-between gap-4 rounded-2xl border bg-card p-6"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="lime">Ebene {activeIdx + 1} von 5</Badge>
                  <span className="text-xs font-medium text-brand-ink">{active.analogy}</span>
                </div>
                <h4 className="text-xl font-bold">{active.layer}</h4>

                <div className="divide-y rounded-xl border bg-muted/25">
                  <div className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Lebensdauer
                    </span>
                    <span className="text-sm font-medium text-foreground sm:text-right">
                      {active.persistence}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Durchsetzung
                    </span>
                    <span className="text-sm font-medium text-foreground sm:text-right">
                      {active.authority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border-l-4 border-l-brand-lime bg-muted/40 p-4">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Konkret im Workshop
                </div>
                <p className="wrap-safe text-sm leading-relaxed text-foreground">{active.example}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Embedded Context Window Animatic */}
      <ContextWindowAnimatic onResetChat={onCopyTemplate} />
    </div>
  );
}
