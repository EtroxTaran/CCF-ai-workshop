import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Bot, Cpu, Network, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ToolMode } from "@/types/workshop";

export interface McpPacketAnimaticProps {
  activeHop?: number;
  mode?: "search" | "verify";
  toolMode?: ToolMode;
  compact?: boolean;
  projectorMode?: boolean;
  triggerPulse?: number;
  onRunAnimation?: () => void;
  className?: string;
}

export function McpPacketAnimatic({
  activeHop: controlledHop,
  mode = "search",
  toolMode = "web",
  compact = false,
  projectorMode = false,
  triggerPulse,
  onRunAnimation,
  className,
}: McpPacketAnimaticProps) {
  const prefersReduced = useReducedMotion();
  const [internalHop, setInternalHop] = useState<number>(0);
  const [inspectorView, setInspectorView] = useState<"klartext" | "json">(
    toolMode === "agent" ? "json" : "klartext"
  );

  const activeHop = typeof controlledHop === "number" ? controlledHop : internalHop;

  useEffect(() => {
    setInspectorView(toolMode === "agent" ? "json" : "klartext");
  }, [toolMode]);

  useEffect(() => {
    if (!triggerPulse) return;
    runInternalDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerPulse]);

  function runInternalDemo() {
    onRunAnimation?.();
    if (typeof controlledHop === "number") return;
    if (prefersReduced) {
      setInternalHop(4);
      return;
    }
    setInternalHop(1);
    window.setTimeout(() => setInternalHop(2), 200);
    window.setTimeout(() => setInternalHop(3), 420);
    window.setTimeout(() => setInternalHop(4), 640);
    window.setTimeout(() => setInternalHop(0), 1800);
  }

  const stations = [
    {
      hop: 1,
      icon: Bot,
      title: "1 · Frage / App",
      desc: toolMode === "agent" ? "Code-Agent / IDE" : "Workshop-App oder Chat",
    },
    {
      hop: 2,
      icon: Network,
      title: "2 · MCP-Protokoll",
      desc: "Standardisiertes JSON-RPC 2.0",
    },
    {
      hop: 3,
      icon: Cpu,
      title: "3 · Werkzeug-Server",
      desc: "mcp-server/server.mjs (3 Tools)",
    },
    {
      hop: 4,
      icon: BookOpen,
      title: "4 · 68 Artikel",
      desc: mode === "verify" ? "Beleg / Fangfrage prüfen" : "Korpus-Treffer + [[Wikilinks]]",
    },
  ];

  const klartextPayload =
    mode === "verify"
      ? `Anfrage: „Prüfe Behauptung gegen 68 Artikel“\nErgebnis: Status + Textbeleg (source_file)`
      : `Anfrage: „Suche: Anemonenfische Symbiose“\nErgebnis: 2 Treffer · [[anemonenfische]], [[symbiose]]`;

  const jsonPayload =
    mode === "verify"
      ? `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": { "name": "verify_claim_against_corpus", "arguments": { "claim": "..." } }\n}`
      : `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": { "name": "search_wildlife_vault", "arguments": { "query": "Anemonenfische Symbiose" } }\n}`;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card space-y-4",
        compact ? "p-3.5" : "p-5",
        projectorMode && "border-2 border-[#0B0F0A]/25 p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div
            className={cn(
              "font-semibold uppercase tracking-[0.08em] text-brand-ink",
              projectorMode ? "text-sm" : "text-xs"
            )}
          >
            MCP-Datenfluss (USB-C für KI-Werkzeuge)
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground">
              Statt ganze Ordner manuell zu kopieren, ruft die KI genau das passende Prüf-Werkzeug auf.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border bg-muted p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setInspectorView("klartext")}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                inspectorView === "klartext"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Klartext
            </button>
            <button
              type="button"
              onClick={() => setInspectorView("json")}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                inspectorView === "json"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              JSON-RPC
            </button>
          </div>

          {typeof controlledHop !== "number" && (
            <Button type="button" size="sm" variant="outline" onClick={runInternalDemo}>
              <Play className="h-3.5 w-3.5" />
              <span>Paket senden</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Connected Stations */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stations.map((node) => {
          const Icon = node.icon;
          const lit = activeHop === node.hop;
          const passed = activeHop > node.hop;
          return (
            <div
              key={node.hop}
              className={cn(
                "relative rounded-xl border p-3.5 transition-all",
                lit
                  ? "lime-glow border-brand-lime bg-secondary/80 ring-1 ring-brand-lime"
                  : passed
                    ? "border-brand-lime/50 bg-secondary/35"
                    : "bg-muted/25",
                projectorMode && "border-2 p-4"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 font-display font-bold",
                    projectorMode ? "text-base" : "text-sm"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      lit || passed ? "text-brand-ink" : "text-muted-foreground"
                    )}
                  />
                  <span>{node.title}</span>
                </span>
                {lit && !prefersReduced && (
                  <motion.span
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1.15 }}
                    transition={{ duration: 0.25 }}
                    className="h-2.5 w-2.5 rounded-full bg-[#A9C23F]"
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className={cn("text-muted-foreground", projectorMode ? "text-sm" : "text-xs")}>
                {node.desc}
              </p>
              {node.hop < 4 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -right-2.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border text-[11px] font-bold lg:flex",
                    lit || passed
                      ? "border-brand-lime bg-brand-lime text-brand-obsidian"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Klartext vs JSON-RPC Inspector */}
      <pre
        className={cn(
          "overflow-x-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-3 font-mono leading-relaxed text-foreground",
          projectorMode ? "text-sm" : "text-xs"
        )}
      >
        {inspectorView === "klartext" ? klartextPayload : jsonPayload}
      </pre>
    </div>
  );
}
