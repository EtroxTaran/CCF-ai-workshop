import { useEffect, useState } from "react";
import { FolderOpen, Globe, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolMode } from "@/types/workshop";

export interface ToolHotspotGuideProps {
  toolMode: ToolMode;
  className?: string;
}

interface HotspotItem {
  id: number;
  label: string;
  detail: string;
  xPct: number;
  yPct: number;
}

interface ModeGuideSpec {
  webpFilename: string;
  title: string;
  subtitle: string;
  hotspots: HotspotItem[];
}

const MODE_GUIDES: Record<ToolMode, ModeGuideSpec> = {
  web: {
    webpFilename: "web-chat.webp",
    title: "Web-Chat · Klick-Anleitung in 3 Schritten",
    subtitle: "ChatGPT, Claude.ai oder Microsoft Copilot direkt im Browser — keine Installation.",
    hotspots: [
      {
        id: 1,
        label: "Neuen Chat öffnen",
        detail: "Starte immer mit „+ Neuer Chat“, damit vorherige Nachrichten deine Regeln nicht verwässern.",
        xPct: 16,
        yPct: 24,
      },
      {
        id: 2,
        label: "Kompakt-Paket einfügen (Strg+V)",
        detail: "Der Prompt steht ganz oben, alle benötigten Artikel mit (datei.md)-Tag direkt darunter.",
        xPct: 54,
        yPct: 72,
      },
      {
        id: 3,
        label: "Quellen (datei.md) prüfen",
        detail: "Jede Aussage braucht einen Dateinamen in Klammern oder den Hinweis [Nicht in Quelle].",
        xPct: 68,
        yPct: 40,
      },
    ],
  },
  desktop: {
    webpFilename: "desktop-folder.webp",
    title: "Desktop & Ordner · Arbeitsweise ohne Terminal",
    subtitle: "Claude Cowork oder ChatGPT Projects direkt auf den Workshop-Ordnern.",
    hotspots: [
      {
        id: 1,
        label: "Workshop-Ordner wählen (stufe-2 / stufe-3)",
        detail: "Wähle den jeweiligen Stufen-Ordner — die KI liest nicht nur 1 Datei, sondern das gesamte Setup.",
        xPct: 20,
        yPct: 30,
      },
      {
        id: 2,
        label: "AGENTS.md lädt automatisch",
        detail: "Die Projekt-Regeln und Skills greifen im Hintergrund, ohne dass du sie neu kopieren musst.",
        xPct: 55,
        yPct: 25,
      },
      {
        id: 3,
        label: "Testfrage stellen",
        detail: "Stelle Fragen 1–4 aus Schritt 03 und prüfe, ob Fangfrage 3 sauber abgelehnt wird.",
        xPct: 64,
        yPct: 72,
      },
    ],
  },
  agent: {
    webpFilename: "code-agent.webp",
    title: "Code-Agent · Terminal & IDE Setup",
    subtitle: "Claude Code, Codex, Gemini CLI, OpenCode oder VS Code mit AGENTS.md + MCP.",
    hotspots: [
      {
        id: 1,
        label: "cd stufe-2-skills-guardrails",
        detail: "Wechsle in den gewünschten Stufen-Ordner (stufe-1, stufe-2 oder stufe-3).",
        xPct: 24,
        yPct: 28,
      },
      {
        id: 2,
        label: "AGENTS.md + .mcp.json aktiv",
        detail: "CLIs laden AGENTS.md / CLAUDE.md / GEMINI.md sowie .mcp.json automatisch aus dem Ordner.",
        xPct: 62,
        yPct: 32,
      },
      {
        id: 3,
        label: "MCP-Tool verify_claim_against_corpus prüfen",
        detail: "Teste in Stufe 3 oder Pfad 1 direkte Tool-Aufrufe gegen alle 68 Artikel.",
        xPct: 56,
        yPct: 70,
      },
    ],
  },
};

function ModeSchematic({
  toolMode,
  activeId,
  onSelect,
}: {
  toolMode: ToolMode;
  activeId: number;
  onSelect: (id: number) => void;
}) {
  if (toolMode === "web") {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-[#FAFAF8] p-4 text-[#1C1F1A] dark:bg-[#0B0F0A] dark:text-[#F2F4EE]">
        <div className="grid gap-3 sm:grid-cols-12">
          <div className="space-y-2 rounded-lg border bg-card p-3 sm:col-span-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Globe className="h-3.5 w-3.5 text-brand-ink" />
              <span>Browser-Chat</span>
            </div>
            <button
              type="button"
              onClick={() => onSelect(1)}
              className={cn(
                "w-full rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors",
                activeId === 1 ? "border-[#A9C23F] bg-[#EEF3D8] text-[#0B0F0A]" : "bg-muted/40"
              )}
            >
              + Neuer Chat
            </button>
            <div className="space-y-1 pt-1 text-[10px] text-muted-foreground">
              <div className="h-2 w-4/5 rounded bg-muted" />
              <div className="h-2 w-3/5 rounded bg-muted" />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-2.5 rounded-lg border bg-card p-3 sm:col-span-8">
            <button
              type="button"
              onClick={() => onSelect(3)}
              className={cn(
                "rounded-lg border p-2.5 text-left text-xs transition-colors",
                activeId === 3 ? "border-[#A9C23F] bg-[#EEF3D8]/70 text-[#0B0F0A]" : "bg-muted/30"
              )}
            >
              <div className="font-semibold">KI-Antwort mit Quellenprüfung</div>
              <div className="mt-1 font-mono text-[11px] text-brand-ink">
                • Eisbär: 42 Zähne (eisbaer.md) · Schneeleopard: [Nicht in Quelle]
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelect(2)}
              className={cn(
                "rounded-lg border border-dashed p-2.5 text-left text-xs transition-colors",
                activeId === 2 ? "border-[#A9C23F] bg-[#EEF3D8] text-[#0B0F0A]" : "bg-muted/25"
              )}
            >
              <span className="font-mono text-[11px] font-semibold">
                Strg+V → Prompt oben + Kompakt-Texte darunter
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (toolMode === "desktop") {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-[#FAFAF8] p-4 text-[#1C1F1A] dark:bg-[#0B0F0A] dark:text-[#F2F4EE]">
        <div className="grid gap-3 sm:grid-cols-12">
          <button
            type="button"
            onClick={() => onSelect(1)}
            className={cn(
              "space-y-1.5 rounded-lg border p-3 text-left text-xs sm:col-span-5",
              activeId === 1 ? "border-[#A9C23F] bg-[#EEF3D8] text-[#0B0F0A]" : "bg-card"
            )}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <FolderOpen className="h-3.5 w-3.5 text-brand-ink" />
              <span>Ordner gewählt</span>
            </div>
            <div className="font-mono text-[11px]">📁 stufe-2-skills-guardrails/</div>
            <div className="font-mono text-[10px] opacity-75">├── docs/ (68 Artikel)</div>
          </button>

          <div className="space-y-2 sm:col-span-7">
            <button
              type="button"
              onClick={() => onSelect(2)}
              className={cn(
                "w-full rounded-lg border p-2.5 text-left text-xs",
                activeId === 2 ? "border-[#A9C23F] bg-[#EEF3D8] text-[#0B0F0A]" : "bg-card"
              )}
            >
              <div className="font-semibold">Projekt-Regeln aktiv (AGENTS.md)</div>
              <div className="font-mono text-[10px] opacity-80">
                Skills: quellen-recherche · fakten-pruefer
              </div>
            </button>
            <button
              type="button"
              onClick={() => onSelect(3)}
              className={cn(
                "w-full rounded-lg border p-2.5 text-left text-xs",
                activeId === 3 ? "border-[#A9C23F] bg-[#EEF3D8] text-[#0B0F0A]" : "bg-card"
              )}
            >
              <div className="font-semibold">Testfrage direkt im Projekt-Chat stellen</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#232B20] bg-[#0B0F0A] p-4 font-mono text-xs text-[#F2F4EE]">
      <div className="mb-2 flex items-center gap-2 text-[11px] text-[#9FA998]">
        <Terminal className="h-3.5 w-3.5 text-[#A9C23F]" />
        <span>Terminal / IDE</span>
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onSelect(1)}
          className={cn(
            "block w-full rounded-lg border px-3 py-2 text-left transition-colors",
            activeId === 1
              ? "border-[#A9C23F] bg-[#1B2419] text-[#A9C23F]"
              : "border-[#232B20] bg-[#111610] text-[#D3DACD]"
          )}
        >
          $ cd stufe-2-skills-guardrails
        </button>
        <button
          type="button"
          onClick={() => onSelect(2)}
          className={cn(
            "block w-full rounded-lg border px-3 py-2 text-left transition-colors",
            activeId === 2
              ? "border-[#A9C23F] bg-[#1B2419] text-[#A9C23F]"
              : "border-[#232B20] bg-[#111610] text-[#D3DACD]"
          )}
        >
          ✓ AGENTS.md / CLAUDE.md / GEMINI.md + .mcp.json geladen
        </button>
        <button
          type="button"
          onClick={() => onSelect(3)}
          className={cn(
            "block w-full rounded-lg border px-3 py-2 text-left transition-colors",
            activeId === 3
              ? "border-[#A9C23F] bg-[#1B2419] text-[#A9C23F]"
              : "border-[#232B20] bg-[#111610] text-[#D3DACD]"
          )}
        >
          → MCP Tool: verify_claim_against_corpus(&quot;Schneeleopard...&quot;) → nicht_belegt
        </button>
      </div>
    </div>
  );
}

export function ToolHotspotGuide({ toolMode, className }: ToolHotspotGuideProps) {
  const spec = MODE_GUIDES[toolMode];
  const [activeId, setActiveId] = useState<number>(1);

  useEffect(() => {
    setActiveId(1);
  }, [toolMode]);

  const availableWebps = typeof __GUIDE_WEBP_FILES__ !== "undefined" ? __GUIDE_WEBP_FILES__ : [];
  const hasWebp = availableWebps.includes(spec.webpFilename);
  const activeHotspot = spec.hotspots.find((h) => h.id === activeId) || spec.hotspots[0];

  return (
    <div className={cn("rounded-2xl border bg-card p-5 space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            {spec.title}
          </div>
          <p className="text-xs text-muted-foreground">{spec.subtitle}</p>
        </div>
        <span className="rounded-full border bg-muted/50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
          1 → 2 → 3
        </span>
      </div>

      {/* Hotspot Pills 1 -> 2 -> 3 */}
      <div className="grid gap-2 sm:grid-cols-3">
        {spec.hotspots.map((h) => {
          const isCurrent = h.id === activeId;
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveId(h.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors",
                isCurrent
                  ? "border-brand-lime bg-secondary/70 font-semibold text-foreground"
                  : "bg-muted/25 text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold",
                  isCurrent ? "bg-[#A9C23F] text-[#0B0F0A]" : "bg-muted text-foreground"
                )}
              >
                {h.id}
              </span>
              <span className="truncate">{h.label}</span>
            </button>
          );
        })}
      </div>

      {/* Visual Frame: Drop-in .webp (ONLY if present on disk) OR zero-404 SVG/HTML schematic */}
      {hasWebp ? (
        <div className="relative overflow-hidden rounded-xl border bg-muted/20">
          <img
            src={`./guides/${spec.webpFilename}`}
            alt={spec.title}
            className="w-full object-cover"
          />
          {spec.hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setActiveId(h.id)}
              style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
              aria-label={`Schritt ${h.id}: ${h.label}`}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0B0F0A] font-mono text-xs font-extrabold shadow-lg transition-transform",
                h.id === activeId
                  ? "scale-110 bg-[#A9C23F] text-[#0B0F0A]"
                  : "bg-white text-[#0B0F0A] hover:scale-105"
              )}
            >
              {h.id}
            </button>
          ))}
        </div>
      ) : (
        <ModeSchematic toolMode={toolMode} activeId={activeId} onSelect={setActiveId} />
      )}

      {/* Active Hotspot Detail */}
      <div className="rounded-xl border border-brand-lime/40 bg-secondary/35 px-3.5 py-2.5 text-xs">
        <span className="font-semibold text-foreground">
          Punkt {activeHotspot.id} · {activeHotspot.label}:{" "}
        </span>
        <span className="text-muted-foreground">{activeHotspot.detail}</span>
      </div>
    </div>
  );
}
