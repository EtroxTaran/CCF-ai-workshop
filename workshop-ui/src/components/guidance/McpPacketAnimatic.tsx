import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Bot, CheckCircle2, Cpu, Network, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ToolMode } from "@/types/workshop";

export interface McpPacketAnimaticProps {
  activeHop?: number;
  mode?: "search" | "verify";
  toolMode?: ToolMode;
  defaultView?: "klartext" | "json";
  compact?: boolean;
  projectorMode?: boolean;
  triggerPulse?: number;
  articleCount?: number;
  spec?: {
    sampleQuery: string;
    sampleWikilinks: string[];
    searchToolName?: string;
    verifyToolName?: string;
  };
  onRunAnimation?: () => void;
  className?: string;
}

export function McpPacketAnimatic({
  activeHop: controlledHop,
  mode = "search",
  toolMode = "web",
  defaultView,
  compact = false,
  projectorMode = false,
  triggerPulse,
  articleCount = 68,
  spec,
  onRunAnimation,
  className,
}: McpPacketAnimaticProps) {
  const sampleQuery = spec?.sampleQuery || "Anemonenfische Symbiose";
  const sampleWikilinks = spec?.sampleWikilinks || ["[[anemonenfische]]", "[[symbiose]]"];
  const searchToolName = spec?.searchToolName || "search_vault";
  const verifyToolName = spec?.verifyToolName || "verify_claim";
  const prefersReduced = useReducedMotion();
  const [internalHop, setInternalHop] = useState<number>(0);
  const [packetStatus, setPacketStatus] = useState<"idle" | "sending" | "done">("idle");
  const [packetCount, setPacketCount] = useState<number>(0);
  const timeoutsRef = useRef<number[]>([]);
  const isTechnicalMode = toolMode === "agent" || toolMode === "ide";
  const [inspectorView, setInspectorView] = useState<"klartext" | "json">(
    defaultView ?? (isTechnicalMode ? "json" : "klartext")
  );

  const activeHop = typeof controlledHop === "number" ? controlledHop : internalHop;

  function clearDemoTimeouts() {
    for (const id of timeoutsRef.current) {
      window.clearTimeout(id);
    }
    timeoutsRef.current = [];
  }

  useEffect(() => {
    return () => clearDemoTimeouts();
  }, []);

  useEffect(() => {
    setInspectorView(defaultView ?? (isTechnicalMode ? "json" : "klartext"));
  }, [defaultView, isTechnicalMode]);

  useEffect(() => {
    clearDemoTimeouts();
    setPacketStatus("idle");
    setPacketCount(0);
    setInternalHop(0);
  }, [mode]);

  useEffect(() => {
    if (!triggerPulse) return;
    runInternalDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerPulse]);

  function runInternalDemo() {
    onRunAnimation?.();
    if (typeof controlledHop === "number") return;
    clearDemoTimeouts();
    if (prefersReduced) {
      setInternalHop(4);
      setPacketStatus("done");
      setPacketCount((c) => c + 1);
      return;
    }
    setPacketStatus("sending");
    setInternalHop(1);
    timeoutsRef.current = [
      window.setTimeout(() => setInternalHop(2), 200),
      window.setTimeout(() => setInternalHop(3), 420),
      window.setTimeout(() => setInternalHop(4), 640),
      window.setTimeout(() => {
        setPacketStatus("done");
        setPacketCount((c) => c + 1);
      }, 900),
      window.setTimeout(() => setInternalHop(0), 1800),
    ];
  }

  const stations = [
    {
      hop: 1,
      icon: Bot,
      title: "1 · Frage / App",
      desc: isTechnicalMode ? "IDE / Code-Agent" : "Workshop-App oder Chat",
    },
    {
      hop: 2,
      icon: Network,
      title: isTechnicalMode ? "2 · MCP-Protokoll" : "2 · Fester Ablaufschritt",
      desc: isTechnicalMode ? "Standardisiertes JSON-RPC 2.0" : "Einheitliches Frage-Antwort-Format",
    },
    {
      hop: 3,
      icon: Cpu,
      title: isTechnicalMode ? "3 · Werkzeug-Server" : "3 · Such- & Prüf-Dienst",
      desc:
        toolMode === "agent"
          ? "mcp-server/server.mjs (Tools)"
          : `Prüft alle ${articleCount} Artikel lokal im Browser`,
    },
    {
      hop: 4,
      icon: BookOpen,
      title: `4 · ${articleCount} Dokumente`,
      desc:
        mode === "verify"
          ? "Beleg / Fangfrage prüfen"
          : toolMode === "agent"
            ? "Wissensbasis-Treffer + [[Wikilinks]]"
            : "Artikel-Treffer + Querverweise",
    },
  ];

  const klartextPayload =
    mode === "verify"
      ? `Anfrage: „Prüfe Behauptung gegen ${articleCount} Dokumente“\nErgebnis: Status + Textbeleg (source_file)`
      : `Anfrage: „Suche: ${sampleQuery}“\nErgebnis: Treffer · ${sampleWikilinks.join(", ")}`;

  const jsonPayload =
    mode === "verify"
      ? `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": { "name": "${verifyToolName}", "arguments": { "claim": "..." } }\n}`
      : `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": { "name": "${searchToolName}", "arguments": { "query": "${sampleQuery}" } }\n}`;

  const klartextResponse =
    mode === "verify"
      ? `Status: belegt (Treffer über ${articleCount} Dokumente)\nBeleg: ${sampleWikilinks[0] || "[[dokument]]"} · Quelle verifiziert · 0 Halluzinationen`
      : `Treffer für „${sampleQuery}“: ${sampleWikilinks.join(", ")}\nGeprüft über ${articleCount} Dokumente · Quelle direkt zitierbar`;

  const jsonResponse =
    mode === "verify"
      ? `{\n  "jsonrpc": "2.0",\n  "result": {\n    "tool": "${verifyToolName}",\n    "status": "belegt",\n    "evidence": ${JSON.stringify(sampleWikilinks)},\n    "hallucinations": 0\n  }\n}`
      : `{\n  "jsonrpc": "2.0",\n  "result": {\n    "tool": "${searchToolName}",\n    "query": "${sampleQuery}",\n    "matches": ${JSON.stringify(sampleWikilinks)},\n    "corpusSize": ${articleCount}\n  }\n}`;

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
          <div
            role="group"
            aria-label="Antwortformat wählen"
            className="inline-flex rounded-lg border bg-muted p-0.5 text-xs"
          >
            <button
              type="button"
              aria-pressed={inspectorView === "klartext"}
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
              aria-pressed={inspectorView === "json"}
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

      {/* Live Demo Status + Persistent Simulated Response */}
      {typeof controlledHop !== "number" && packetStatus !== "idle" && (
        <div
          data-testid="mcp-packet-response"
          className={cn(
            "space-y-2 rounded-xl border p-3.5 transition-colors",
            packetStatus === "done"
              ? "border-emerald-500/45 bg-emerald-500/10"
              : "border-brand-lime/50 bg-secondary/40"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              aria-live="polite"
              variant={packetStatus === "done" ? "success" : "lime"}
              className="text-[11px]"
            >
              {packetStatus === "done" && <CheckCircle2 className="h-3 w-3" />}
              <span>
                {packetStatus === "sending"
                  ? "Sende MCP-Anfrage…"
                  : "Antwort empfangen · Belegt · 0 Halluzinationen"}
              </span>
            </Badge>
            {packetStatus === "done" && packetCount > 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">
                Simulierte Antwort #{packetCount}
              </span>
            )}
          </div>
          {packetStatus === "done" && (
            <pre
              className={cn(
                "overflow-x-auto whitespace-pre-wrap break-words rounded-lg border bg-card p-3 font-mono leading-relaxed text-foreground",
                projectorMode ? "text-sm" : "text-xs"
              )}
            >
              {inspectorView === "klartext" ? klartextResponse : jsonResponse}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
