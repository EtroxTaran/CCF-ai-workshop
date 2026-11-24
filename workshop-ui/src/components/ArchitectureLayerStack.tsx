import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Layers } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
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
import type { ArchitectureLayer } from "@/types/workshop";

interface ArchitectureLayerStackProps {
  layers: ArchitectureLayer[];
  primingTemplate: string;
  track?: "A" | "B";
  trackBAgentsTemplate?: string;
}

export function ArchitectureLayerStack({
  layers,
  primingTemplate,
  track = "A",
  trackBAgentsTemplate,
}: ArchitectureLayerStackProps) {
  const [activeIdx, setActiveIdx] = useState<number>(2); // Default: System-Prompt / AGENTS.md
  const active = layers[activeIdx] || layers[0];
  const isTrackB = track === "B" && Boolean(trackBAgentsTemplate);
  const activeTemplate = isTrackB ? trackBAgentsTemplate! : primingTemplate;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            <Layers className="h-3.5 w-3.5" />
            Steuerungs-Architektur
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            Vom User-Prompt zum verlässlichen KI-System
          </h3>
          <p className="editorial-measure text-sm text-muted-foreground">
            Wähle eine Ebene, um zu sehen, wie Browser-Priming, dauerhafte System-Regeln (AGENTS.md),
            Leitplanken und Werkzeuge (MCP) zusammenspielen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyButton
            text={activeTemplate}
            label={isTrackB ? "AGENTS.md (Stufe 2) kopieren" : "Track A Priming kopieren"}
            toastMessage={isTrackB ? "AGENTS.md (Stufe 2) in Zwischenablage kopiert" : "Priming-Vorlage in Zwischenablage kopiert"}
            variant="secondary"
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                <Eye className="h-3.5 w-3.5" />
                <span>{isTrackB ? "System-Regel ansehen" : "Vorlage ansehen"}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  {isTrackB ? "Track B · AGENTS.md System-Regel (Stufe 2)" : "Track A Priming-Vorlage"}
                </SheetTitle>
                <SheetDescription>
                  {isTrackB ? (
                    <>
                      Diese Datei steuert deinen CLI-Agenten automatisch im Ordner{" "}
                      <code>stufe-2-skills-guardrails/</code>. Für Browser-Chats nutzt Track A alternativ
                      eine Priming-Nachricht.
                    </>
                  ) : (
                    <>
                      Als erste Nachricht im Browser-Chat oder als Custom Instruction einfügen. In Track B
                      übernimmt <code>AGENTS.md</code> diese Rolle automatisch.
                    </>
                  )}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-4">
                <CopyButton
                  text={activeTemplate}
                  label={isTrackB ? "AGENTS.md kopieren" : "Vollständiges Priming kopieren"}
                  variant="default"
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
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
    </div>
  );
}
