import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Compass,
  Eye,
  FolderOpen,
  GitBranch,
  Globe,
  Hand,
  HelpCircle,
  Layers,
  LayoutGrid,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Moon,
  Network,
  Pause,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  BeamerDemoSimulator,
  type DemoQuestionKey,
} from "@/components/BeamerDemoSimulator";
import { CopyButton } from "@/components/CopyButton";
import { McpPacketAnimatic } from "@/components/guidance/McpPacketAnimatic";
import { ObsidianKnowledgeGraph } from "@/components/ObsidianKnowledgeGraph";
import { QrCodeSvg } from "@/components/QrCodeSvg";
import { StageBackdrop } from "@/components/StageBackdrop";
import { Virtual7Logo } from "@/components/Virtual7Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_MODULE_ID, fetchCatalog, fetchModuleData } from "@/lib/moduleLoader";
import { scalePhasesExact } from "../lib/scalePhases";
import {
  isSoundMuted,
  playOneMinuteChime,
  playStageGong,
  setSoundMuted,
  toggleSoundMuted,
  unlockAudioContext,
} from "@/lib/soundFx";
import type {
  BeamerMode,
  EventOverlaySpec,
  ModuleCatalogEntry,
  PhaseItem,
  ToolMode,
  WorkshopDataset,
} from "@/types/workshop";

type DemoSubTab = "stages" | "methods" | "layers" | "graph" | "mcp";

const DEMO_QUESTION_CYCLE: DemoQuestionKey[] = ["q1", "q2", "q3", "q4"];
const DEMO_TAB_ORDER: DemoSubTab[] = ["stages", "methods", "layers", "graph", "mcp"];

const STAGE_MODE_LABELS: Record<BeamerMode, string> = {
  stage: "Bühne (Stage)",
  demo: "Keynote-Demo",
  qr: "QR-Beitritt",
  outro: "Abschluss (Outro)",
};

const DEMO_TAB_LABELS: Record<DemoSubTab, string> = {
  stages: "Stufe 1 → 2 → 3",
  methods: "4 Prompt-Methoden",
  layers: "5 Ebenen",
  graph: "Wissens-Graph",
  mcp: "MCP-Fluss",
};

const TOOL_MODE_CARDS: { id: ToolMode; label: string; icon: typeof Globe }[] = [
  { id: "web", label: "Web-Chat", icon: Globe },
  { id: "desktop", label: "Desktop & Projects", icon: FolderOpen },
  { id: "ide", label: "IDE & Editor", icon: Code2 },
  { id: "agent", label: "CLI Code-Agent", icon: Terminal },
];

const OUTRO_PROMPTS = [
  {
    num: "01",
    title: "Handzeichen · Aha-Kern",
    prompt:
      "Wo war euer größter Aha-Moment: beim Prompt-Struktur-Vergleich (CO-STAR/RISEN), bei der Fangfrage oder beim Live-Kontext-Test?",
  },
  {
    num: "02",
    title: "Handzeichen · Ziel-Labor",
    prompt:
      "Welches Ziel habt ihr im Labor validiert: Prompting, eine eigene App, eine Präsentation oder ein Alltags-Workflow?",
  },
  {
    num: "03",
    title: "Transfer-Brücke · Nächste Woche",
    prompt:
      "Welche geprüfte Regel oder Takeaway-Vorlage nehmt ihr am Montag direkt mit in euren Alltag?",
  },
];

const OUTRO_TAKEAWAYS = [
  {
    title: "Kontext schlägt Magie",
    detail:
      "Dasselbe Modell liefert völlig andere Qualität, sobald Zielgruppe, Format und Quellen klar vorgegeben sind.",
  },
  {
    title: "Guardrails stoppen Halluzinationen",
    detail:
      "Verbindliche Regeln + Quellenpflicht zwingen die KI zu belegbaren Aussagen – oder einem ehrlichen „Nicht enthalten“.",
  },
  {
    title: "Strukturiertes Wissen + schmale Tools skalieren",
    detail:
      "Eine Einstiegskarte (_index.md), Querverweise und gezielte MCP-Werkzeuge ersetzen blindes Suchen.",
  },
];

function renderInlineCode(text: string) {
  const parts = String(text || "").split(/(`[^`]+`)/g);
  return parts.map((part, idx) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={idx} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

function formatMMSS(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatWallClock(): string {
  return (
    new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr"
  );
}

function formatPhasePillLabel(phase: PhaseItem, isScaled: boolean): string {
  let label = (phase.timeRange || "").replace(/\s*·\s*\d+\s*Min\.?/gi, "").trim();
  if (isScaled && /\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/.test(label)) {
    label = "";
  }
  return label
    ? `Phase ${phase.number} · ${label} (${phase.durationMin} Min.)`
    : `Phase ${phase.number} (${phase.durationMin} Min.)`;
}

function cleanLayerLabel(label: string): string {
  return label.replace(/Harness\s*\(Skills\s*\+\s*Guardrails\)/i, "Regeln & Skills");
}

export function BeamerApp({ moduleId = DEFAULT_MODULE_ID }: { moduleId?: string }) {
  const [data, setData] = useState<WorkshopDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setLoadError(null);
    fetchModuleData(moduleId)
      .then((loaded) => {
        if (active) setData(loaded);
      })
      .catch((err) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Modul konnte nicht geladen werden.");
        }
      });
    return () => {
      active = false;
    };
  }, [moduleId]);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <p className="text-lg font-bold text-destructive">{loadError}</p>
        <a
          href="#/hub"
          className="inline-flex h-9 items-center rounded-lg border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Zur Modul-Übersicht (Hub)
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Trainer-Bühne wird geladen…
      </div>
    );
  }

  return <BeamerAppInner key={moduleId} data={data} moduleId={moduleId} />;
}

function BeamerAppInner({
  data,
  moduleId,
}: {
  data: WorkshopDataset;
  moduleId: string;
}) {
  const prefersReduced = useReducedMotion();
  const [darkBeamer, setDarkBeamer] = useState<boolean>(false);
  const [stageMode, setStageMode] = useState<BeamerMode>("stage");

  // Live-Session Overlay (nur in sessionStorage, ueberschreibt keine Repo-Daten)
  const overlayStorageKey = `v7-overlay:${moduleId}`;
  const [overlayOpen, setOverlayOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [speakerNotesOpen, setSpeakerNotesOpen] = useState<boolean>(false);
  const [qrMode, setQrMode] = useState<"online" | "local">("online");
  const [catalogModules, setCatalogModules] = useState<ModuleCatalogEntry[]>([]);

  const baseTotalDuration = useMemo(
    () => data.phases.reduce((sum, p) => sum + p.durationMin, 0) || 60,
    [data.phases]
  );
  const [durationPreset, setDurationPreset] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem(`v7-beamer-duration:${moduleId}`);
      const parsed = saved ? Number(saved) : NaN;
      if (Number.isFinite(parsed) && parsed >= 15) return parsed;
    } catch {
      // ignore
    }
    return baseTotalDuration;
  });

  const scaledPhases = useMemo(
    () => scalePhasesExact(data.phases, durationPreset || baseTotalDuration),
    [data.phases, durationPreset, baseTotalDuration]
  );

  const activeDurationTotal = useMemo(
    () => scaledPhases.reduce((sum, p) => sum + p.durationMin, 0),
    [scaledPhases]
  );

  const ahaGroupMin = useMemo(
    () =>
      scaledPhases
        .filter((p) => p.phaseGroup === "aha-kern")
        .reduce((sum, p) => sum + p.durationMin, 0),
    [scaledPhases]
  );

  const praxisGroupMin = useMemo(
    () =>
      scaledPhases
        .filter((p) => p.phaseGroup === "praxis-pfad")
        .reduce((sum, p) => sum + p.durationMin, 0),
    [scaledPhases]
  );

  useEffect(() => {
    fetchCatalog()
      .then((cat) => setCatalogModules(cat.modules || []))
      .catch(() => undefined);
  }, []);

  const [overlay, setOverlay] = useState<EventOverlaySpec>(() => {
    const defaults: EventOverlaySpec = {
      unitLabel: data.eventOverlay?.unitLabel || data.meta.cluster,
      timeSlot: data.eventOverlay?.timeSlot || data.meta.timeSlot,
      outroBanner: data.eventOverlay?.outroBanner || "13:00 Uhr Unit-Programm & World Café",
      roomHint: data.eventOverlay?.roomHint || "",
    };
    try {
      const saved = sessionStorage.getItem(overlayStorageKey);
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return defaults;
  });

  const updateOverlay = useCallback(
    (patch: Partial<EventOverlaySpec>) => {
      setOverlay((prev) => {
        const next = { ...prev, ...patch };
        try {
          sessionStorage.setItem(overlayStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [overlayStorageKey]
  );

  // Stage Timer & Audio state
  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(scaledPhases[0].durationMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(() => isSoundMuted());
  const [solutionOpen, setSolutionOpen] = useState<boolean>(false);
  const [nowClock, setNowClock] = useState<string>(() => formatWallClock());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Demo progressive Keynote reveal state
  const [demoTab, setDemoTab] = useState<DemoSubTab>("stages");
  const [demoQuestionKey, setDemoQuestionKey] = useState<DemoQuestionKey>("q1");
  const [demoRevealStep, setDemoRevealStep] = useState<number>(0);
  const [q4Mutated, setQ4Mutated] = useState<boolean>(true);
  const [methodRevealCount, setMethodRevealCount] = useState<number>(0);
  const [layerRevealCount, setLayerRevealCount] = useState<number>(1);
  const [mcpMode, setMcpMode] = useState<"search" | "verify">("search");

  const fired60Ref = useRef<boolean>(false);
  const fired0Ref = useRef<boolean>(false);
  const runningRef = useRef<boolean>(running);
  const secondsLeftRef = useRef<number>(secondsLeft);
  runningRef.current = running;
  secondsLeftRef.current = secondsLeft;

  const activePhase = scaledPhases[phaseIdx] || scaledPhases[0];
  const activeQuestion = useMemo(
    () =>
      data.testQuestions.find((q) => q.id === activePhase.activeQuestionId) ||
      data.testQuestions[0],
    [activePhase.activeQuestionId, data.testQuestions]
  );
  const appHref = moduleId === DEFAULT_MODULE_ID ? "#/" : `#/m/${moduleId}`;
  const cleanPagesBase = `${data.meta.pagesUrl.split("#")[0].replace(/\/$/, "")}/`;
  const onlineJoinUrl =
    moduleId === DEFAULT_MODULE_ID ? cleanPagesBase : `${cleanPagesBase}#/m/${moduleId}`;
  const localJoinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname.replace(/\/beamer\/?.*$/, "/")}${appHref}`
      : onlineJoinUrl;
  const joinUrl = qrMode === "local" ? localJoinUrl : onlineJoinUrl;
  const outroPrompts = data.animatics?.outroPrompts || OUTRO_PROMPTS;
  const outroTakeaways = data.animatics?.outroTakeaways || OUTRO_TAKEAWAYS;

  // Keep fullscreen state in sync if user presses Escape
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Sync .dark onto document.documentElement so Radix Dialog/Toaster inherit theme cleanly
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkBeamer);
    return () => {
      root.classList.remove("dark");
    };
  }, [darkBeamer]);

  // Reset sound muted on unmount so returning to #/beamer starts strictly muted
  useEffect(() => {
    setSoundMuted(true);
    setAudioMuted(true);
    return () => {
      setSoundMuted(true);
    };
  }, []);

  // Wall-clock refresh
  useEffect(() => {
    const id = window.setInterval(() => {
      setNowClock(formatWallClock());
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Edge-triggered Web Audio chimes & automatic stop at 00:00
  useEffect(() => {
    if (!running) return;
    if (secondsLeft === 60 && !fired60Ref.current) {
      fired60Ref.current = true;
      if (!audioMuted) {
        playOneMinuteChime();
      }
    }
    if (secondsLeft === 0) {
      if (!fired0Ref.current) {
        fired0Ref.current = true;
        if (!audioMuted) {
          playStageGong();
        }
      }
      setRunning(false);
    }
  }, [running, secondsLeft, audioMuted]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = toggleSoundMuted();
    setAudioMuted(nextMuted);
  }, []);

  const toggleRunning = useCallback(() => {
    if (!runningRef.current) {
      if (!isSoundMuted()) {
        unlockAudioContext();
      }
      if (secondsLeftRef.current <= 0) {
        fired60Ref.current = false;
        fired0Ref.current = false;
        const resetSec = activePhase.durationMin * 60;
        secondsLeftRef.current = resetSec;
        setSecondsLeft(resetSec);
      }
      runningRef.current = true;
      setRunning(true);
    } else {
      runningRef.current = false;
      setRunning(false);
    }
  }, [activePhase.durationMin]);

  const addOneMinute = useCallback(() => {
    setSecondsLeft((prev) => {
      const next = prev + 60;
      if (next > 60) fired60Ref.current = false;
      fired0Ref.current = false;
      return next;
    });
  }, []);

  const resetPhaseTimer = useCallback(() => {
    setRunning(false);
    fired60Ref.current = false;
    fired0Ref.current = false;
    setSecondsLeft(activePhase.durationMin * 60);
  }, [activePhase.durationMin]);

  const goPhase = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(scaledPhases.length - 1, idx));
      setPhaseIdx(clamped);
      setRunning(false);
      fired60Ref.current = false;
      fired0Ref.current = false;
      setSecondsLeft(scaledPhases[clamped].durationMin * 60);
      setSolutionOpen(false);
    },
    [scaledPhases]
  );

  const applyDurationPreset = useCallback(
    (presetMin: number) => {
      setDurationPreset(presetMin);
      try {
        sessionStorage.setItem(`v7-beamer-duration:${moduleId}`, String(presetMin));
      } catch {
        // ignore
      }
      const nextScaled = scalePhasesExact(data.phases, presetMin);
      const scaledMin = nextScaled[phaseIdx]?.durationMin || 10;
      setRunning(false);
      fired60Ref.current = false;
      fired0Ref.current = false;
      setSecondsLeft(scaledMin * 60);
    },
    [data.phases, moduleId, phaseIdx]
  );

  const advanceDemoReveal = useCallback(() => {
    if (demoTab === "stages") {
      if (demoRevealStep < 3) {
        setDemoRevealStep((prev) => Math.min(3, prev + 1));
      } else {
        const curIdx = DEMO_QUESTION_CYCLE.indexOf(demoQuestionKey);
        const nextKey = DEMO_QUESTION_CYCLE[(curIdx + 1) % DEMO_QUESTION_CYCLE.length];
        setDemoQuestionKey(nextKey);
        setDemoRevealStep(1);
      }
      return;
    }
    if (demoTab === "methods") {
      setMethodRevealCount((prev) =>
        prev >= data.promptMethods.length ? 0 : prev + 1
      );
      return;
    }
    if (demoTab === "layers") {
      setLayerRevealCount((prev) =>
        prev >= data.architectureLayers.length ? 1 : prev + 1
      );
    }
  }, [
    data.architectureLayers.length,
    data.promptMethods.length,
    demoQuestionKey,
    demoRevealStep,
    demoTab,
  ]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => undefined);
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => undefined);
    }
  }, []);

  // Global keyboard shortcuts with strict input/dialog/modifier guards
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (overlayOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setOverlayOpen(false);
        }
        return;
      }

      if (shortcutsOpen) {
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault();
          setShortcutsOpen(false);
        }
        return;
      }

      if (solutionOpen) {
        if (e.key === "Escape" || e.key === "s" || e.key === "S") {
          e.preventDefault();
          setSolutionOpen(false);
        }
        return;
      }

      if (e.shiftKey && e.code.startsWith("Digit")) {
        const idx = Number(e.code.replace("Digit", "")) - 1;
        if (idx >= 0 && idx < DEMO_TAB_ORDER.length) {
          e.preventDefault();
          setStageMode("demo");
          setDemoTab(DEMO_TAB_ORDER[idx]);
          return;
        }
      }

      if (e.key === "1") {
        setStageMode("stage");
      } else if (e.key === "2") {
        setStageMode("demo");
      } else if (e.key === "3") {
        setStageMode("qr");
      } else if (e.key === "4") {
        setStageMode("outro");
      } else if (e.key === "t" || e.key === "T") {
        setDarkBeamer((v) => !v);
      } else if (e.key === "m" || e.key === "M") {
        handleToggleMute();
      } else if (e.key === "p" || e.key === "P") {
        setSpeakerNotesOpen((v) => !v);
      } else if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "r" || e.key === "R") {
        resetPhaseTimer();
      } else if (e.key === "+") {
        addOneMinute();
      } else if (e.key === "ArrowRight") {
        goPhase(phaseIdx + 1);
      } else if (e.key === "ArrowLeft") {
        goPhase(phaseIdx - 1);
      } else if ((e.key === "s" || e.key === "S") && stageMode === "stage") {
        e.preventDefault();
        setSolutionOpen((v) => !v);
      } else if (e.code === "Space" || e.key === " " || e.key === "n" || e.key === "N") {
        if (stageMode === "demo") {
          e.preventDefault();
          advanceDemoReveal();
        } else if (stageMode === "stage" && (e.code === "Space" || e.key === " ")) {
          e.preventDefault();
          toggleRunning();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    addOneMinute,
    advanceDemoReveal,
    goPhase,
    handleToggleMute,
    overlayOpen,
    phaseIdx,
    resetPhaseTimer,
    shortcutsOpen,
    solutionOpen,
    stageMode,
    toggleFullscreen,
    toggleRunning,
  ]);

  const totalPhaseSec = Math.max(1, activePhase.durationMin * 60);
  const elapsedPct = Math.min(
    100,
    Math.max(0, ((totalPhaseSec - secondsLeft) / totalPhaseSec) * 100)
  );
  const remainingPct = Math.max(0, Math.min(100, (secondsLeft / totalPhaseSec) * 100));
  const isFinalMinute = secondsLeft > 0 && secondsLeft <= 60;
  const isTimeUp = secondsLeft === 0;
  const rawRepoUrl = (data.meta.repoUrl || "").replace(/\/+$/, "");
  const normalizedRepoUrl = rawRepoUrl.endsWith(".git") ? rawRepoUrl : `${rawRepoUrl}.git`;
  const cloneCommand = `git clone -b main ${normalizedRepoUrl}`;

  // Progress ring geometry
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - remainingPct / 100);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden">
      {/* Slim Trainer Header */}
      <header className="relative flex min-h-14 flex-wrap items-center justify-between gap-2 border-b bg-card/90 px-3 py-2 backdrop-blur-md sm:px-4 lg:h-14 lg:flex-nowrap lg:px-6 lg:py-0">
        {/* Left Brand + Inline Module Switcher */}
        <div className="flex min-w-0 items-center gap-2">
          <Virtual7Logo compact className="text-foreground" />
          <span
            data-testid="beamer-mobile-module-pill"
            className="inline-flex max-w-[165px] items-center gap-1 truncate rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-foreground sm:hidden"
          >
            <span className="font-mono text-brand-ink">[{data.level || "L1"}]</span>
            <span className="truncate">{data.meta.domainLabel || data.meta.title}</span>
          </span>
          {catalogModules.length > 1 ? (
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <select
                aria-label="Aktives Workshop-Modul wechseln"
                value={moduleId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  window.location.hash =
                    nextId === DEFAULT_MODULE_ID ? "#/beamer" : `#/m/${nextId}/beamer`;
                }}
                className="h-8 max-w-[230px] rounded-lg border bg-muted/60 px-2 text-xs font-semibold text-foreground"
              >
                {catalogModules.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.level}] {m.domainLabel || m.title}
                  </option>
                ))}
              </select>
              {overlay.unitLabel && (
                <Badge variant="outline" className="hidden text-[11px] md:inline-flex">
                  {overlay.unitLabel}
                </Badge>
              )}
            </div>
          ) : (
            <span className="hidden truncate text-sm font-semibold tracking-tight text-muted-foreground xl:inline">
              {overlay.unitLabel || data.meta.cluster} · {data.meta.title}
            </span>
          )}
          {overlay.timeSlot && (
            <Badge variant="outline" className="hidden text-[11px] xl:inline-flex">
              {overlay.timeSlot}
            </Badge>
          )}
        </div>

        {/* Center 4-Mode Switcher */}
        <nav
          aria-label="Trainer-Bühne Modi"
          className="no-scrollbar inline-flex max-w-full shrink-0 flex-wrap items-center gap-1 rounded-xl border bg-muted/85 p-1 sm:flex-nowrap sm:overflow-x-auto"
        >
          {(
            [
              { id: "stage", num: "1", label: "Stage" },
              { id: "demo", num: "2", label: "Demo" },
              { id: "qr", num: "3", label: "QR Join" },
              { id: "outro", num: "4", label: "Outro" },
            ] as { id: BeamerMode; num: string; label: string }[]
          ).map((m) => {
            const active = stageMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setStageMode(m.id);
                }}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold transition-colors sm:px-3 ${
                  active
                    ? "bg-brand-lime text-brand-obsidian shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="num-tabular mr-1 font-mono opacity-75">{m.num}</span>
                {m.label}
              </button>
            );
          })}
        </nav>

        {/* Right Compact Stage Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Show compact timer badge ONLY outside Stage mode so Stage giant timer stays the primary MM:SS */}
          {stageMode !== "stage" && (
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                setStageMode("stage");
              }}
              title="Zurück zu Stage-Countdown (1)"
              className={`num-tabular hidden items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold sm:inline-flex ${
                isFinalMinute && running
                  ? "border-rose-600/40 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  : "bg-muted/70 text-foreground"
              }`}
            >
              <span>{formatMMSS(secondsLeft)}</span>
            </button>
          )}

          {/* Phase Stepper */}
          <div className="hidden items-center gap-0.5 rounded-lg border bg-muted/70 p-0.5 md:inline-flex">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={phaseIdx === 0}
              onClick={(e) => {
                e.currentTarget.blur();
                goPhase(phaseIdx - 1);
              }}
              className="h-7 w-7"
              aria-label="Vorherige Phase"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="num-tabular px-1.5 font-mono text-xs font-bold">
              {phaseIdx + 1}/{data.phases.length}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={phaseIdx === data.phases.length - 1}
              onClick={(e) => {
                e.currentTarget.blur();
                goPhase(phaseIdx + 1);
              }}
              className="h-7 w-7"
              aria-label="Nächste Phase"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Audio Mute Toggle (M) */}
          <Button
            type="button"
            size="sm"
            variant={audioMuted ? "outline" : "accent"}
            aria-pressed={!audioMuted}
            aria-label={audioMuted ? "Stumm (M) — Gong einschalten" : "Gong aktiv (M) — stummschalten"}
            onClick={(e) => {
              e.currentTarget.blur();
              handleToggleMute();
            }}
            className="h-8 shrink-0 gap-1.5 px-2.5"
            title="Bühnen-Gong stumm / aktiv (M)"
          >
            {audioMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span className="hidden text-xs font-bold sm:inline">
              {audioMuted ? "Stumm (M)" : "Gong aktiv (M)"}
            </span>
          </Button>

          {/* Daylight / Dark Toggle (T) */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={(e) => {
              e.currentTarget.blur();
              setDarkBeamer((v) => !v);
            }}
            className="h-8 w-8 shrink-0"
            aria-label={darkBeamer ? "Tageslicht-Modus (T)" : "Dunkel-Modus (T)"}
            title="Tageslicht / Dunkelmodus (T)"
          >
            {darkBeamer ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Fullscreen */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={(e) => {
              e.currentTarget.blur();
              toggleFullscreen();
            }}
            className="hidden h-8 w-8 shrink-0 sm:inline-flex"
            aria-label="Vollbild"
            title="Vollbild umschalten"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          {/* Speaker Notes Toggle (P) */}
          <Button
            type="button"
            size="icon"
            variant={speakerNotesOpen ? "accent" : "outline"}
            aria-pressed={speakerNotesOpen}
            onClick={(e) => {
              e.currentTarget.blur();
              setSpeakerNotesOpen((v) => !v);
            }}
            className="h-8 w-8 shrink-0"
            aria-label="Sprechernotizen umschalten (P)"
            title="Sprechernotizen für Moderation (P)"
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>

          {/* Keyboard Cheat-Sheet (?) */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={(e) => {
              e.currentTarget.blur();
              setShortcutsOpen(true);
            }}
            className="hidden h-8 w-8 shrink-0 sm:inline-flex"
            aria-label="Tastenkürzel anzeigen (?)"
            title="Alle Tastenkürzel (?)"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Session Overlay Settings */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={(e) => {
              e.currentTarget.blur();
              setOverlayOpen(true);
            }}
            className="h-8 w-8 shrink-0"
            aria-label="Session-Overlay anpassen"
            title="Live-Session Overlay (Cluster, Zeitfenster, Dauer-Preset, Banner)"
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          {/* Hub Link */}
          <a
            href="#/hub"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-card text-foreground transition-colors hover:bg-muted sm:w-auto sm:gap-1.5 sm:px-2.5"
            aria-label="Hub · Alle Workshop-Module"
            title="Alle Module (Hub)"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-brand-ink" />
            <span className="hidden text-xs font-semibold lg:inline">Hub</span>
          </a>

          {/* Return link to static Participant Workshop App */}
          <a
            href={appHref}
            onClick={(e) => {
              if (window.location.pathname.startsWith("/beamer")) {
                e.preventDefault();
                const rootPath = window.location.pathname.replace(/\/beamer\/?.*$/, "/");
                window.history.replaceState(null, "", `${rootPath}${appHref}`);
                window.dispatchEvent(new HashChangeEvent("hashchange"));
              }
            }}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            title="Zur Workshop-App"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Workshop-App</span>
          </a>
        </div>

        {/* Hairline Top Progress Line */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-muted">
          <div
            className="h-full bg-brand-lime transition-all duration-500"
            style={{ width: `${elapsedPct}%` }}
          />
        </div>
      </header>

      {/* Single-Surface Projection Workspace (ZERO <aside> sidebar) */}
      <main
        className={`relative flex min-h-0 min-w-0 flex-1 flex-col justify-between overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:px-10 lg:py-6 ${
          stageMode === "stage" || stageMode === "qr" ? "stage-atmosphere" : ""
        }`}
      >
        {(stageMode === "stage" || stageMode === "qr") && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <StageBackdrop className="absolute -right-28 -top-24 h-[460px] w-[460px] opacity-25 dark:opacity-40" />
          </div>
        )}

        {/* Mode Panels (instant switch without AnimatePresence mode="wait" unmount lag) */}
          {/* MODE 1: STAGE / AKTUELLE PHASE */}
          {stageMode === "stage" && (
            <motion.div
              key={`stage-${activePhase.id}`}
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.12 }}
              className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-between gap-5"
            >
              {/* Upper Hero: Giant Countdown FIRST in DOM/Visual order + Phase Headline */}
              <div className="grid items-center gap-5 lg:grid-cols-12">
                {/* Giant Countdown Focal Block */}
                <div className="card-elevated flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-5 lg:col-span-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
                      <svg
                        viewBox="0 0 112 112"
                        className="h-full w-full -rotate-90"
                        aria-hidden="true"
                      >
                        <circle
                          cx="56"
                          cy="56"
                          r={ringRadius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r={ringRadius}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringOffset}
                          className={
                            isFinalMinute || isTimeUp
                              ? "text-rose-600 transition-all duration-500 dark:text-rose-400"
                              : "text-brand-lime transition-all duration-500"
                          }
                        />
                      </svg>
                      <span className="num-tabular absolute font-mono text-xs font-bold text-muted-foreground">
                        {Math.round(remainingPct)}%
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
                          Etappen-Timer
                        </span>
                        {isTimeUp && (
                          <Badge variant="danger">Zeit abgelaufen</Badge>
                        )}
                        {isFinalMinute && running && (
                          <Badge variant="warning">Letzte Minute</Badge>
                        )}
                      </div>
                      <div
                        className={`num-tabular mt-1 font-mono text-[clamp(3rem,6vw,5.5rem)] font-extrabold leading-none tracking-tight ${
                          isTimeUp || (isFinalMinute && running)
                            ? "text-rose-700 dark:text-rose-400"
                            : "text-foreground"
                        }`}
                      >
                        {formatMMSS(secondsLeft)}
                      </div>
                    </div>
                  </div>

                  {/* Timer Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={running ? "outline" : "accent"}
                      aria-label={running ? "Pause — Timer anhalten (Space)" : "Start — Timer starten (Space)"}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        toggleRunning();
                      }}
                      className="gap-1.5 font-bold"
                    >
                      {running ? (
                        <>
                          <Pause className="h-4 w-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Start</span>
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label="1m hinzufügen"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        addOneMinute();
                      }}
                      className="gap-1 font-mono font-bold"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>1m</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-label="Zurücksetzen"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        resetPhaseTimer();
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Phase Headline & Key Takeaway */}
                <div className="space-y-3 lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="num-tabular rounded-full bg-brand-lime px-3.5 py-1 font-mono text-xs font-extrabold uppercase tracking-wider text-brand-obsidian">
                      {formatPhasePillLabel(activePhase, durationPreset !== baseTotalDuration)}
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {activePhase.phaseGroup === "aha-kern"
                        ? `${ahaGroupMin} Min. gemeinsamer Aha-Kern`
                        : `${praxisGroupMin} Min. freier Praxis-Pfad`}
                    </Badge>
                  </div>

                  <h1 className="font-display text-[clamp(1.75rem,3.1vw,3.15rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
                    {activePhase.beamerHeadline}
                  </h1>

                  <p className="text-[clamp(1.05rem,1.35vw,1.35rem)] font-medium leading-snug text-muted-foreground">
                    {activePhase.keyTakeaway}
                  </p>
                </div>
              </div>

              {/* Middle Focus: 4-Column Werkzeug-Hilfe Cues */}
              <div className="grid gap-4 border-y py-4 md:grid-cols-2 xl:grid-cols-4 md:gap-4">
                {TOOL_MODE_CARDS.map((tool) => {
                  const Icon = tool.icon;
                  const cueText =
                    activePhase.modeCues[tool.id] || activePhase.modeCues.agent || "";
                  return (
                    <div
                      key={tool.id}
                      className="space-y-1.5 rounded-xl border bg-card/60 p-3.5"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{tool.label}</span>
                      </div>
                      <p className="text-[clamp(0.95rem,1.2vw,1.25rem)] font-medium leading-snug text-foreground">
                        {cueText}
                      </p>
                    </div>
                  );
                })}
              </div>

              {activePhase.phaseGroup === "praxis-pfad" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-lime/40 bg-secondary/35 px-4 py-2.5 text-xs sm:text-sm">
                  <span className="font-bold text-brand-ink">4 Ziele wählbar in Schritt 01 &amp; 04:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["1 · Prompting", "2 · App bauen", "3 · Präsentation", "4 · KI im Arbeitsalltag"].map(
                      (g) => (
                        <Badge key={g} variant="outline" className="bg-card font-semibold">
                          {g}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Anchor: Active Test Question Spotlight */}
              <div
                className={`card-elevated rounded-2xl border bg-card p-5 ${
                  activeQuestion.isTrap
                    ? "border-l-4 border-l-rose-600"
                    : "border-l-4 border-l-brand-lime"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant={activeQuestion.isTrap ? "danger" : "lime"}>
                      Testfrage {activeQuestion.number} · {activeQuestion.type}
                    </Badge>
                    {activeQuestion.isTrap && (
                      <Badge
                        variant="outline"
                        className="border-rose-600/40 bg-rose-500/10 font-mono text-rose-700 dark:text-rose-300"
                      >
                        0 Treffer in {data.vaultArticles.length} Dateien
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={solutionOpen ? "accent" : "outline"}
                    className="shrink-0 whitespace-nowrap"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      setSolutionOpen((v) => !v);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span>{solutionOpen ? "Lösung schließen (S)" : "Lösung (S)"}</span>
                  </Button>
                </div>

                <p className="mt-2.5 font-display text-[clamp(1.15rem,1.55vw,1.65rem)] font-bold leading-snug text-foreground">
                  „{activeQuestion.question}“
                </p>

                <p className="mt-2 text-base font-medium text-muted-foreground">
                  <strong className="text-foreground">Beobachtung: </strong>
                  {renderInlineCode(activeQuestion.whatToWatch)}
                </p>
              </div>
            </motion.div>
          )}

          {/* MODE 2: DEMO (PROGRESSIVE KEYNOTE REVEAL + EMBEDDED GRAPH + MCP) */}
          {stageMode === "demo" && (
            <motion.div
              key="mode-demo"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.12 }}
              className="relative z-10 mx-auto flex w-full max-w-[1260px] flex-1 flex-col justify-between gap-4"
            >
              {/* Demo Header & Sub-Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
                    Keynote-Demo · Progressive Enthüllung (Space / N)
                  </div>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    Warum Struktur, Regeln &amp; Wissen alles verändern
                  </h1>
                </div>

                <div
                  role="tablist"
                  aria-label="Demo Stationen"
                  className="no-scrollbar inline-flex max-w-full flex-wrap gap-1 rounded-xl border bg-muted p-1 sm:flex-nowrap sm:overflow-x-auto"
                >
                  {(
                    [
                      { id: "stages", label: "Stufe 1 → 2 → 3" },
                      { id: "methods", label: "4 Prompt-Methoden" },
                      { id: "layers", label: "5 Ebenen" },
                      { id: "graph", label: "Wissens-Graph" },
                      { id: "mcp", label: "MCP-Fluss" },
                    ] as { id: DemoSubTab; label: string }[]
                  ).map((tab) => {
                    const active = demoTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setDemoTab(tab.id);
                        }}
                        className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors sm:text-sm ${
                          active
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-tab 1: Stufe 1 -> 2 -> 3 Simulator */}
              {demoTab === "stages" && (
                <BeamerDemoSimulator
                  questionKey={demoQuestionKey}
                  onSelectQuestion={(nextKey) => {
                    setDemoQuestionKey(nextKey);
                    setDemoRevealStep(0);
                  }}
                  revealStep={demoRevealStep}
                  onRevealStepChange={setDemoRevealStep}
                  q4Mutated={q4Mutated}
                  onToggleQ4Mutated={() => setQ4Mutated((v) => !v)}
                  questions={data.testQuestions}
                  demoScenarios={data.animatics?.demoScenarios}
                />
              )}

              {/* Sub-tab 2: 4 Prompt-Methoden with Real Result Snippets */}
              {demoTab === "methods" && (
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card px-4 py-3">
                    <div className="text-sm font-semibold text-foreground sm:text-base">
                      Aufgabe: <span className="text-muted-foreground">{data.promptComparisonTask}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setMethodRevealCount((c) =>
                            c >= data.promptMethods.length ? 0 : data.promptMethods.length
                          );
                        }}
                      >
                        {methodRevealCount >= data.promptMethods.length
                          ? "Alle einklappen"
                          : "Alle zeigen"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    {data.promptMethods.map((m, idx) => {
                      const revealed = idx < methodRevealCount;
                      return (
                        <div
                          key={m.id}
                          className="card-elevated flex flex-col justify-between rounded-2xl border bg-card p-5"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h2 className="font-display text-xl font-bold text-foreground">
                                {m.name}
                              </h2>
                              <Badge variant="lime">{m.badge}</Badge>
                            </div>

                            <p className="text-base font-medium text-muted-foreground">
                              {m.bestFor}
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                              {m.components.map((c) => (
                                <Badge key={c} variant="outline" className="text-xs">
                                  {c}
                                </Badge>
                              ))}
                            </div>

                            {revealed ? (
                              <div className="space-y-2 rounded-xl border border-brand-lime/40 bg-secondary/35 p-3.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-bold uppercase tracking-wider text-brand-ink">
                                    Ergebnis-Ausschnitt
                                  </span>
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {m.structuredComparison.formatTag}
                                  </Badge>
                                </div>
                                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-snug text-foreground sm:text-base">
                                  {m.structuredComparison.excerpt}
                                </pre>
                                <p className="border-t pt-2 text-xs font-semibold text-brand-ink sm:text-sm">
                                  {m.expectedSnippet}
                                </p>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.currentTarget.blur();
                                  setMethodRevealCount(idx + 1);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-lime/50 bg-muted/40 px-4 py-4 text-sm font-bold text-brand-ink transition-colors hover:bg-secondary/40"
                              >
                                <Eye className="h-4 w-4" />
                                <span>Space / N / Klick: Ergebnis-Ausschnitt aufdecken</span>
                              </button>
                            )}
                          </div>

                          <p className="mt-3 border-t pt-2.5 text-sm font-medium text-foreground">
                            <strong className="text-brand-ink">Wirkung: </strong>
                            {m.strength}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: 5 Ebenen (Thick Block Architecture Stack) */}
              {demoTab === "layers" && (
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Layers className="h-4 w-4 text-brand-ink" />
                      <span>
                        Von der flüchtigen Einzelfrage zur verbindlichen System-Architektur (
                        {layerRevealCount}/{data.architectureLayers.length} aufgedeckt)
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        setLayerRevealCount((c) =>
                          c >= data.architectureLayers.length ? 1 : data.architectureLayers.length
                        );
                      }}
                    >
                      {layerRevealCount >= data.architectureLayers.length
                        ? "Auf Ebene 1 zurück"
                        : `Alle ${data.architectureLayers.length} Ebenen zeigen`}
                    </Button>
                  </div>

                  <div className="grid flex-1 gap-3">
                    {data.architectureLayers.map((l, idx) => {
                      const revealed = idx < layerRevealCount;
                      const powerPct = (idx + 1) * 20;
                      return (
                        <button
                          key={l.layer}
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            setLayerRevealCount(idx + 1);
                          }}
                          className={`card-elevated grid w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-all md:grid-cols-12 ${
                            revealed
                              ? "border-brand-lime/55 bg-card"
                              : "border-dashed border-border bg-muted/40 opacity-65 hover:opacity-100"
                          }`}
                        >
                          <div className="md:col-span-3">
                            <div className="font-display text-lg font-extrabold text-foreground sm:text-xl">
                              {cleanLayerLabel(l.layer)}
                            </div>
                            <div className="text-sm font-semibold text-brand-ink">
                              {l.analogy}
                            </div>
                          </div>

                          <div className="text-sm font-medium text-muted-foreground sm:text-base md:col-span-3">
                            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                              Durchsetzung
                            </span>
                            {revealed ? l.authority : "Space / N / Klick aufdecken"}
                          </div>

                          <div className="text-sm font-medium text-foreground sm:text-base md:col-span-4">
                            <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                              Beispiel · {l.persistence}
                            </span>
                            {revealed ? renderInlineCode(l.example) : "…"}
                          </div>

                          <div className="flex items-center gap-2.5 md:col-span-2">
                            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-brand-lime transition-all duration-300"
                                style={{ width: `${powerPct}%` }}
                              />
                            </div>
                            <span className="num-tabular font-mono text-sm font-extrabold text-foreground">
                              {powerPct}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Embedded Projector-Scale ObsidianKnowledgeGraph */}
              {demoTab === "graph" && (
                <div className="flex flex-1 flex-col gap-3">
                  <ObsidianKnowledgeGraph
                    articles={data.vaultArticles}
                    vaultIndexMarkdown={data.stages[2]?.indexMd}
                    taxonomy={data.taxonomy}
                    projectorMode
                  />
                </div>
              )}

              {/* Sub-tab 5: Embedded Projector-Scale McpPacketAnimatic */}
              {demoTab === "mcp" && (
                <div className="flex flex-1 flex-col justify-center gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-3.5">
                    <div className="flex items-center gap-2 text-base font-bold text-foreground">
                      <Network className="h-5 w-5 text-brand-ink" />
                      <span>Lokaler MCP-Server: Schmale Werkzeuge statt Raten</span>
                    </div>
                    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border bg-muted p-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setMcpMode("search");
                        }}
                        className={`max-w-full whitespace-normal rounded-lg px-3 py-1.5 text-left font-mono text-xs font-bold transition-colors sm:text-sm ${
                          mcpMode === "search"
                            ? "bg-brand-lime text-brand-obsidian"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {data.animatics?.mcpPacket?.searchToolName || "search_vault"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setMcpMode("verify");
                        }}
                        className={`max-w-full whitespace-normal rounded-lg px-3 py-1.5 text-left font-mono text-xs font-bold transition-colors sm:text-sm ${
                          mcpMode === "verify"
                            ? "bg-brand-lime text-brand-obsidian"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {data.animatics?.mcpPacket?.verifyToolName || "verify_claim"}
                      </button>
                    </div>
                  </div>

                  <McpPacketAnimatic
                    projectorMode
                    defaultView="klartext"
                    toolMode="agent"
                    mode={mcpMode}
                    spec={data.animatics?.mcpPacket}
                    articleCount={data.vaultArticles.length}
                    className="dark:!border-border"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* MODE 3: QR JOIN (STATIC GITHUB PAGES + GIT CLONE) */}
          {stageMode === "qr" && (
            <motion.div
              key="mode-qr"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.12 }}
              className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-1 flex-col items-center justify-center gap-8 rounded-3xl bg-[radial-gradient(circle_at_30%_50%,rgba(169,194,63,0.14),transparent_60%)] p-4 sm:p-6 lg:flex-row lg:gap-14"
            >
              {/* Giant High-Contrast QR Frame */}
              <div className="relative max-w-full shrink-0">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-2.5 -top-2.5 h-7 w-7 rounded-tl-2xl border-l-[3px] border-t-[3px] border-brand-lime"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2.5 -top-2.5 h-7 w-7 rounded-tr-2xl border-r-[3px] border-t-[3px] border-brand-lime"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-2.5 -left-2.5 h-7 w-7 rounded-bl-2xl border-b-[3px] border-l-[3px] border-brand-lime"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-2.5 -right-2.5 h-7 w-7 rounded-br-2xl border-b-[3px] border-r-[3px] border-brand-lime"
                />
                <div className="lime-glow rounded-3xl bg-white p-3 shadow-2xl ring-2 ring-brand-lime/50 sm:p-5">
                  <QrCodeSvg value={joinUrl} size={310} />
                </div>
              </div>

              {/* URL, Git Clone & 3 Onboarding Steps */}
              <div className="min-w-0 max-w-xl space-y-5 text-center lg:text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-lime/45 bg-brand-lime/15 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-ink">
                    <QrCode className="h-3.5 w-3.5" />
                    {data.meta.title} · {overlay.unitLabel || data.meta.cluster}
                    {overlay.timeSlot ? ` · ${overlay.timeSlot}` : ""}
                  </div>
                  <div className="inline-flex rounded-lg border bg-muted p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setQrMode("online")}
                      className={`rounded-md px-2.5 py-1 font-semibold ${
                        qrMode === "online"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      GitHub Pages
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode("local")}
                      className={`rounded-md px-2.5 py-1 font-semibold ${
                        qrMode === "local"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      Lokal / Offline-LAN
                    </button>
                  </div>
                </div>

                <h1 className="font-display text-[clamp(2rem,3.5vw,3.5rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-foreground">
                  Scannen &amp; direkt starten
                </h1>

                {/* Primary GitHub Pages URL */}
                <div className="card-elevated flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3.5">
                  <span className="wrap-safe font-mono text-base font-bold text-brand-ink sm:text-xl">
                    {joinUrl}
                  </span>
                  <CopyButton text={joinUrl} label="URL" />
                </div>

                {/* Git Clone Command */}
                <div className="space-y-1.5">
                  <div className="card-elevated flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/60 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <GitBranch className="h-4 w-4 shrink-0 text-brand-ink" />
                      <code className="wrap-safe font-mono text-xs font-semibold text-foreground sm:text-sm">
                        {cloneCommand}
                      </code>
                    </div>
                    <CopyButton text={cloneCommand} label="Clone" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Am besten am Laptop öffnen</strong>{" "}
                    (Split-Screen neben dem Chat) — Git Clone ist optional nur für{" "}
                    <strong className="text-foreground">Code-Agent</strong>!
                  </p>
                </div>

                {/* 3 Onboarding Cards */}
                <div className="grid gap-3 text-left sm:grid-cols-3">
                  {[
                    {
                      n: "01",
                      t: "QR scannen oder Link im Browser öffnen",
                    },
                    {
                      n: "02",
                      t: "Ziel & Werkzeug wählen: Prompting / App / Deck / Alltag × Web / Desktop / IDE / CLI",
                    },
                    {
                      n: "03",
                      t: `${activeDurationTotal} Min. · Aha-Kern + Ziel-Labor + Ergebnis-Check`,
                    },
                  ].map((st) => (
                    <div key={st.n} className="card-elevated rounded-xl border bg-card/90 p-3.5">
                      <div className="num-tabular font-mono text-xs font-bold text-brand-ink">
                        {st.n}
                      </div>
                      <div className="mt-1 text-sm font-semibold leading-snug text-foreground">
                        {st.t}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MODE 4: OUTRO / DEBRIEF & 13:00 UHR */}
          {stageMode === "outro" && (
            <motion.div
              key="mode-outro"
              initial={prefersReduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.12 }}
              className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-between gap-5"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-lime/45 bg-brand-lime/15 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-ink">
                  <Hand className="h-3.5 w-3.5" />
                  Moderierter Abschluss · {overlay.unitLabel || data.meta.cluster}
                </div>
                <h1 className="font-display text-[clamp(1.85rem,3.2vw,3.1rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
                  Was nehmt ihr in den Alltag mit?
                </h1>
              </div>

              {/* 3 Moderated Hand-Raise Debrief Prompts */}
              <div className="grid gap-4 md:grid-cols-3">
                {outroPrompts.map((item) => (
                  <div
                    key={item.num}
                    className="card-elevated flex flex-col justify-between rounded-2xl border border-t-4 border-t-brand-lime bg-card p-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="num-tabular font-mono text-2xl font-extrabold text-brand-ink">
                          {item.num}
                        </span>
                        <Badge variant="lime">{item.title}</Badge>
                      </div>
                      <p className="text-[clamp(1.1rem,1.4vw,1.45rem)] font-semibold leading-snug text-foreground">
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 3 Key Take-aways */}
              <div className="grid gap-4 md:grid-cols-3">
                {outroTakeaways.map((tk) => (
                  <div
                    key={tk.title}
                    className="flex items-start gap-3 rounded-2xl border bg-muted/55 p-4"
                  >
                    <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">
                        {tk.title}
                      </h2>
                      <p className="mt-1 text-sm font-medium leading-snug text-muted-foreground sm:text-base">
                        {tk.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Unit-Programm / Ausblick Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-brand-lime bg-brand-lime/15 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Compass className="h-7 w-7 shrink-0 text-brand-ink" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-brand-ink">
                      Ausblick{overlay.roomHint ? ` · ${overlay.roomHint}` : ""}
                    </div>
                    <div className="font-display text-xl font-extrabold text-foreground sm:text-2xl">
                      {overlay.outroBanner ||
                        data.eventOverlay?.outroBanner ||
                        "13:00 Uhr Unit-Programm & World Café"}
                    </div>
                  </div>
                </div>
                <Badge variant="lime" className="px-4 py-1.5 text-sm font-extrabold">
                  {data.transferBridge.length}-Rollen Transfer-Brücke aktiv
                </Badge>
              </div>
            </motion.div>
          )}
      </main>

      {/* Optional Speaker Notes Cue Bar (P) */}
      {speakerNotesOpen && (
        <aside
          data-testid="beamer-speaker-notes"
          className="border-t border-brand-lime/50 bg-secondary/40 px-4 py-2.5 text-xs lg:px-6"
        >
          <div className="mx-auto flex max-w-[1260px] flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <div className="font-bold uppercase tracking-wider text-brand-ink">
                Moderation-Hinweis ({STAGE_MODE_LABELS[stageMode]} · Phase {activePhase.number})
              </div>
              <p className="text-foreground">
                {stageMode === "stage"
                  ? `Kernaussage: „${activePhase.keyTakeaway}“ · Danach mit Space Timer starten oder mit S Lösung aufdecken.`
                  : stageMode === "demo"
                    ? `Aktiver Tab: ${DEMO_TAB_LABELS[demoTab]} · Mit Space/N schrittweise aufdecken, mit Shift+1..5 zwischen Demo-Tabs wechseln.`
                    : stageMode === "qr"
                      ? "Teilnehmende öffnen den Link am Laptop (Split-Screen) und wählen zuerst Ziel + Werkzeug."
                      : "2–3 Teilnehmende aus verschiedenen Zielen (Prompting / App / Deck / Alltag) ihr Takeaway-Kit kurz zeigen lassen."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSpeakerNotesOpen(false)}
            >
              Schließen (P)
            </Button>
          </div>
        </aside>
      )}

      {/* Bottom Timeline & Shortcut Bar */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-card/90 px-4 py-2 text-xs text-muted-foreground lg:px-6">
        <div className="no-scrollbar flex max-w-full flex-wrap items-center gap-1.5 sm:flex-nowrap sm:overflow-x-auto">
          {scaledPhases.map((p, idx) => {
            const active = idx === phaseIdx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  goPhase(idx);
                  setStageMode("stage");
                }}
                className={`max-w-full rounded-lg px-2.5 py-1 text-left font-semibold transition-colors sm:whitespace-nowrap ${
                  active
                    ? "bg-brand-lime text-brand-obsidian"
                    : "hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="num-tabular mr-1 font-mono">{p.number}. </span>
                {p.title}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden font-mono text-[11px] hover:text-foreground xl:inline"
          >
            1–4 Modi · T Licht/Dunkel · M Gong · P Notizen · ? Alle Kürzel
          </button>
          <span className="num-tabular font-mono font-bold text-foreground">
            {nowClock}
          </span>
        </div>
      </footer>

      {/* Verified Solution Dialog (S) */}
      <Dialog open={solutionOpen} onOpenChange={setSolutionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              <span>Verifizierte Lösung · Testfrage {activeQuestion.number}</span>
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-foreground">
              „{activeQuestion.question}“
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/45 p-4 text-base leading-relaxed text-foreground">
              {renderInlineCode(activeQuestion.solutionSummary)}
            </div>

            {activeQuestion.webChatSolution && (
              <div className="flex items-start gap-2.5 rounded-xl border border-brand-lime/40 bg-secondary/35 p-3.5 text-sm font-medium text-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" />
                <span>{renderInlineCode(activeQuestion.webChatSolution)}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quellen:
              </span>
              {activeQuestion.targetDocs.length > 0 ? (
                activeQuestion.targetDocs.map((doc) => (
                  <Badge key={doc} variant="secondary" className="font-mono text-xs">
                    {doc}
                  </Badge>
                ))
              ) : (
                <Badge variant="danger">
                  0 Treffer in {data.vaultArticles.length} Dateien (Negativtest)
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live-Session Overlay Settings Dialog (sessionStorage only) */}
      <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-brand-ink" />
              <span>Session-Overlay für diesen Termin</span>
            </DialogTitle>
            <DialogDescription>
              Passt Cluster-Name, Zeitfenster, Raum und Abschluss-Banner nur für deine aktuelle
              Browser-Session an (verändert keine Repo-Dateien).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Cluster / Gruppe</span>
              <Input
                value={overlay.unitLabel || ""}
                onChange={(e) => updateOverlay({ unitLabel: e.target.value })}
                placeholder={data.meta.cluster}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Zeitfenster</span>
              <Input
                value={overlay.timeSlot || ""}
                onChange={(e) => updateOverlay({ timeSlot: e.target.value })}
                placeholder={data.meta.timeSlot}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Raum / Call-Hinweis (optional)
              </span>
              <Input
                value={overlay.roomHint || ""}
                onChange={(e) => updateOverlay({ roomHint: e.target.value })}
                placeholder="z. B. Raum Mannheim / Teams-Link"
              />
            </label>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Dauer-Preset (skaliert alle Timer proportional)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[30, 45, 60, 90].map((minVal) => (
                  <button
                    key={minVal}
                    type="button"
                    aria-pressed={durationPreset === minVal}
                    onClick={() => applyDurationPreset(minVal)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                      durationPreset === minVal
                        ? "border-brand-lime bg-secondary/70 text-foreground"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {minVal} Min.
                  </button>
                ))}
              </div>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">
                Abschluss-Banner (Outro)
              </span>
              <Input
                value={overlay.outroBanner || ""}
                onChange={(e) => updateOverlay({ outroBanner: e.target.value })}
                placeholder={data.eventOverlay?.outroBanner || "z. B. Nächster Schritt & Transfer ins Team"}
              />
            </label>
            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const defaults: EventOverlaySpec = {
                    unitLabel: data.eventOverlay?.unitLabel || data.meta.cluster,
                    timeSlot: data.eventOverlay?.timeSlot || data.meta.timeSlot,
                    outroBanner:
                      data.eventOverlay?.outroBanner || "13:00 Uhr Unit-Programm & World Café",
                    roomHint: data.eventOverlay?.roomHint || "",
                  };
                  setOverlay(defaults);
                  applyDurationPreset(baseTotalDuration);
                  try {
                    sessionStorage.removeItem(overlayStorageKey);
                    sessionStorage.removeItem(`v7-beamer-duration:${moduleId}`);
                  } catch {
                    // ignore
                  }
                }}
              >
                Zurücksetzen
              </Button>
              <Button type="button" size="sm" onClick={() => setOverlayOpen(false)}>
                Übernehmen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcut Cheat-Sheet Modal (?) */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-lg" data-testid="beamer-shortcuts-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-brand-ink" />
              <span>Trainer-Bühne · Alle Tastenkürzel</span>
            </DialogTitle>
            <DialogDescription>
              Schnellsteuerung für die Bühne — ohne Maus zwischen Demo, Timer und QR wechseln.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["1 / 2 / 3 / 4", "Stage / Demo / QR Join / Outro"],
              ["Shift + 1..5", "Direkt zu Demo-Tab 1–5 springen"],
              ["Space / N", "Timer Start/Pause oder Demo aufdecken"],
              ["← / →", "Vorherige / Nächste Phase"],
              ["+ / R", "+1 Minute / Phase zurücksetzen"],
              ["S", "Lösung der Testfrage öffnen"],
              ["P", "Sprechernotizen ein-/ausblenden"],
              ["T / M / F", "Hell-Dunkel / Gong / Vollbild"],
            ].map(([key, desc]) => (
              <div key={key} className="rounded-lg border bg-muted/35 p-2.5">
                <div className="font-mono font-bold text-brand-ink">{key}</div>
                <div className="mt-0.5 text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
