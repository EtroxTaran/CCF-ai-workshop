import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Pin,
  Play,
  Plus,
  QrCode,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import rawData from "@/data/workshopData.json";
import { BeamerDemoSimulator } from "@/components/BeamerDemoSimulator";
import { QrCodeSvg } from "@/components/QrCodeSvg";
import { StageBackdrop } from "@/components/StageBackdrop";
import { Virtual7Logo } from "@/components/Virtual7Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { ServerHealth, SubmissionItem, WorkshopDataset } from "@/types/workshop";

const data = rawData as unknown as WorkshopDataset;

type StageMode = "stage" | "qr" | "demo" | "wall";
type DemoSubTab = "stages" | "methods" | "layers";
type WallFilter = "all" | "pinned" | "belegt" | "trap";

function formatMMSS(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BeamerApp() {
  const [darkBeamer, setDarkBeamer] = useState<boolean>(true);
  const [stageMode, setStageMode] = useState<StageMode>("stage");
  const [demoTab, setDemoTab] = useState<DemoSubTab>("stages");
  const [wallFilter, setWallFilter] = useState<WallFilter>("all");
  const [showFeedRail, setShowFeedRail] = useState<boolean>(true);
  const [regieOpen, setRegieOpen] = useState<boolean>(false);

  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(data.phases[0].durationMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [revealSolution, setRevealSolution] = useState<boolean>(false);
  const [nowClock, setNowClock] = useState<string>(() =>
    new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live submissions & health
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [spotlight, setSpotlight] = useState<SubmissionItem | null>(null);
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [connectedClients, setConnectedClients] = useState<number>(1);

  // Settings inside Regie Drawer
  const [cfgJoinUrl, setCfgJoinUrl] = useState<string>("");
  const [cfgGithubRepo, setCfgGithubRepo] = useState<string>("");
  const [cfgGithubLabel, setCfgGithubLabel] = useState<string>("workshop-question");
  const [cfgGitPull, setCfgGitPull] = useState<boolean>(false);

  const activePhase = data.phases[phaseIdx];
  const activeQuestion = useMemo(
    () => data.testQuestions.find((q) => q.id === activePhase.activeQuestionId) || data.testQuestions[0],
    [activePhase.activeQuestionId]
  );

  // CRITICAL: Sync .dark onto document.documentElement so Radix Portals (Dialog / Sheet / Toaster) inherit theme!
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkBeamer);
    return () => {
      root.classList.remove("dark");
    };
  }, [darkBeamer]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowClock(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((h: ServerHealth | null) => {
        if (!h) return;
        setHealth(h);
        setCfgJoinUrl(h.joinUrl || h.lanUrls?.[0] || window.location.origin);
        setCfgGithubRepo(h.githubRepo || "");
        setCfgGithubLabel(h.githubLabel || "workshop-question");
        setCfgGitPull(Boolean(h.gitAutoPull));
      })
      .catch(() => undefined);

    fetch("/api/submissions")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.items) setSubmissions(res.items);
      })
      .catch(() => undefined);

    syncStage(0, false, data.phases[0].durationMin * 60);

    const es = new EventSource("/api/events");
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.addEventListener("submissions", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data);
        if (Array.isArray(payload.items)) setSubmissions(payload.items);
      } catch {
        // ignore
      }
    });
    es.addEventListener("stage", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data);
        if (typeof payload.connectedClients === "number") {
          setConnectedClients(Math.max(1, payload.connectedClients));
        }
      } catch {
        // ignore
      }
    });
    return () => es.close();
  }, []);

  function syncStage(nextPhaseIdx: number, nextRunning: boolean, nextSecondsLeft: number) {
    fetch("/api/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phaseIdx: nextPhaseIdx,
        running: nextRunning,
        secondsLeft: nextSecondsLeft,
      }),
    }).catch(() => undefined);
  }

  function goPhase(nextIdx: number) {
    const nextSec = data.phases[nextIdx].durationMin * 60;
    setPhaseIdx(nextIdx);
    setSecondsLeft(nextSec);
    setRevealSolution(false);
    syncStage(nextIdx, running, nextSec);
  }

  function toggleRunning() {
    const nextRunning = !running;
    setRunning(nextRunning);
    syncStage(phaseIdx, nextRunning, secondsLeft);
  }

  function addOneMinute() {
    const nextSec = secondsLeft + 60;
    setSecondsLeft(nextSec);
    syncStage(phaseIdx, running, nextSec);
  }

  function resetPhaseTimer() {
    const nextSec = activePhase.durationMin * 60;
    setSecondsLeft(nextSec);
    syncStage(phaseIdx, running, nextSec);
  }

  // Keyboard shortcuts guarded when inputs, spotlight dialog, or regie drawer are open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (regieOpen || spotlight !== null) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggleRunning();
      } else if (e.code === "ArrowRight") {
        goPhase(Math.min(data.phases.length - 1, phaseIdx + 1));
      } else if (e.code === "ArrowLeft") {
        goPhase(Math.max(0, phaseIdx - 1));
      } else if (e.key === "1") {
        setStageMode("stage");
      } else if (e.key === "2" || e.key.toLowerCase() === "q") {
        setStageMode((m) => (m === "qr" ? "stage" : "qr"));
      } else if (e.key === "3") {
        setStageMode("demo");
      } else if (e.key === "4") {
        setStageMode("wall");
      } else if (e.key.toLowerCase() === "s") {
        setRevealSolution((v) => !v);
      } else if (e.key.toLowerCase() === "f" && !e.shiftKey) {
        setShowFeedRail((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phaseIdx, running, secondsLeft, regieOpen, spotlight]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => undefined);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => undefined);
    }
  }

  async function simulateDemoQuestion() {
    const res = await fetch("/api/submissions/demo", { method: "POST" }).catch(() => null);
    if (res?.ok) toast.success("Demo-Frage in den Live-Feed gesendet");
  }

  async function togglePin(item: SubmissionItem) {
    await fetch(`/api/submissions/${encodeURIComponent(item.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !item.pinned }),
    }).catch(() => undefined);
  }

  async function removeSubmission(id: string) {
    await fetch(`/api/submissions/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined);
    if (spotlight?.id === id) setSpotlight(null);
  }

  async function saveServerConfig() {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        joinUrl: cfgJoinUrl,
        githubRepo: cfgGithubRepo,
        githubLabel: cfgGithubLabel,
        gitAutoPull: cfgGitPull,
      }),
    }).catch(() => null);
    if (res && res.ok) {
      const updated = await res.json();
      setHealth(updated.health);
      toast.success("Beamer-Einstellungen gespeichert");
    } else {
      toast.error("Server-Konfiguration konnte nicht gespeichert werden");
    }
  }

  const totalSec = activePhase.durationMin * 60;
  const elapsedPct = Math.min(100, Math.round(((totalSec - secondsLeft) / Math.max(1, totalSec)) * 100));
  const qrTargetUrl = cfgJoinUrl || health?.joinUrl || health?.lanUrls?.[0] || "http://127.0.0.1:3777/";

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [submissions]);

  const wallSubmissions = useMemo(() => {
    if (wallFilter === "pinned") return sortedSubmissions.filter((s) => s.pinned);
    if (wallFilter === "belegt") return sortedSubmissions.filter((s) => s.evaluation.status === "belegt");
    if (wallFilter === "trap") return sortedSubmissions.filter((s) => s.evaluation.isLikelyTrap);
    return sortedSubmissions;
  }, [sortedSubmissions, wallFilter]);

  const wallMetrics = useMemo(
    () => ({
      total: submissions.length,
      grounded: submissions.filter((s) => s.evaluation.status === "belegt").length,
      traps: submissions.filter((s) => s.evaluation.isLikelyTrap).length,
      cited: submissions.filter((s) => s.evaluation.evidence.length > 0).length,
    }),
    [submissions]
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden">
      {/* Minimal 56px Stage Header */}
      <header className="relative flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card/90 px-4 backdrop-blur lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Virtual7Logo compact className="lg:hidden" />
          <Virtual7Logo className="hidden h-7 lg:block" />
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <span className="hidden truncate font-display text-sm font-bold sm:inline">
            CCF Prompt-Werkstatt
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            title={health?.llmMode || "Offline"}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sseConnected ? "animate-pulse bg-brand-lime" : "bg-amber-400"
              }`}
            />
            <span className="hidden xl:inline">
              {sseConnected ? `Live · ${connectedClients}` : "Lokal"}
            </span>
          </span>
        </div>

        {/* 4-Mode Stage Switcher */}
        <div className="inline-flex items-center rounded-xl border bg-muted p-1">
          {[
            { id: "stage", label: "Stage" },
            { id: "qr", label: "QR Join" },
            { id: "demo", label: "Demo" },
            { id: "wall", label: `Wall (${submissions.length})` },
          ].map((m) => {
            const isActive = stageMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setStageMode(m.id as StageMode)}
                className={`relative rounded-lg px-3 py-1 text-xs font-semibold transition-colors sm:text-sm ${
                  isActive ? "text-brand-obsidian" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="beamer-mode-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-brand-lime"
                  />
                )}
                <span className="relative z-10 num-tabular">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Countdown + Phase Nav + Regie Drawer */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1 md:flex">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={phaseIdx === 0}
              onClick={() => goPhase(phaseIdx - 1)}
              title="Vorherige Phase"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="num-tabular font-mono text-xs font-semibold text-muted-foreground">
              {phaseIdx + 1}/{data.phases.length}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={phaseIdx === data.phases.length - 1}
              onClick={() => goPhase(phaseIdx + 1)}
              title="Nächste Phase"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-xl border bg-muted/60 px-2.5 py-1 transition-all ${
              running ? "lime-glow border-brand-lime/55" : ""
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 22 22"
              className="hidden h-5 w-5 -rotate-90 sm:block"
            >
              <circle
                cx="11"
                cy="11"
                r="8.5"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.16"
                strokeWidth="2.4"
              />
              <circle
                cx="11"
                cy="11"
                r="8.5"
                fill="none"
                stroke={secondsLeft <= 60 && running ? "#F43F5E" : "#A9C23F"}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray={53.41}
                strokeDashoffset={
                  53.41 * (1 - Math.max(0, Math.min(1, secondsLeft / Math.max(1, totalSec))))
                }
              />
            </svg>
            <span
              className={`num-tabular font-mono text-xl font-bold tracking-tight sm:text-2xl ${
                secondsLeft <= 60 && running ? "text-rose-400" : ""
              }`}
            >
              {formatMMSS(secondsLeft)}
            </span>
            <Button
              type="button"
              size="icon"
              variant={running ? "secondary" : "accent"}
              className="h-7 w-7"
              onClick={toggleRunning}
              title="Timer Start/Pause (Leertaste)"
            >
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="hidden h-7 px-2 text-xs sm:inline-flex"
              onClick={addOneMinute}
              title="+1 Minute"
            >
              <Plus className="h-3 w-3" />1m
            </Button>
          </div>

          {/* Single Regie Controls Drawer */}
          <Sheet open={regieOpen} onOpenChange={setRegieOpen}>
            <SheetTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 px-2.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Regie</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Beamer-Regie &amp; Steuerung</SheetTitle>
                <SheetDescription>
                  Moderator-Werkzeuge (Uhrzeit aktuell {nowClock} · {health?.llmMode || "Offline"}).
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={resetPhaseTimer}>
                    <RotateCcw className="h-4 w-4" />
                    <span>Timer Reset</span>
                  </Button>
                  <Button type="button" variant="accent" onClick={simulateDemoQuestion}>
                    <Sparkles className="h-4 w-4" />
                    <span>Demo-Frage</span>
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDarkBeamer((d) => !d)}>
                    {darkBeamer ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span>{darkBeamer ? "Hell-Modus" : "Dark-Modus"}</span>
                  </Button>
                  <Button type="button" variant="outline" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    <span>{isFullscreen ? "Fenster" : "Vollbild"}</span>
                  </Button>
                </div>

                <label className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <div className="font-semibold">Live-Feed-Leiste in Stage zeigen</div>
                    <div className="text-xs text-muted-foreground">Taste F zum schnellen Ausblenden</div>
                  </div>
                  <Switch checked={showFeedRail} onCheckedChange={setShowFeedRail} />
                </label>

                <Separator />

                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    QR-Join &amp; Dual-Modus Watcher
                  </div>
                  {health?.lanUrls && health.lanUrls.length > 0 && (
                    <div className="rounded-xl border bg-muted/40 p-3 font-mono text-xs">
                      <div className="mb-1 font-sans font-semibold text-muted-foreground">
                        Erkannte LAN-Adressen:
                      </div>
                      {health.lanUrls.map((u) => (
                        <div key={u} className="wrap-safe">
                          {u}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-medium">QR-Code Ziel-URL</label>
                    <Input value={cfgJoinUrl} onChange={(e) => setCfgJoinUrl(e.target.value)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">GitHub Repo (owner/repo)</label>
                      <Input
                        value={cfgGithubRepo}
                        onChange={(e) => setCfgGithubRepo(e.target.value)}
                        placeholder="owner/repo"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Issue-Label</label>
                      <Input value={cfgGithubLabel} onChange={(e) => setCfgGithubLabel(e.target.value)} />
                    </div>
                  </div>
                  <label className="flex items-center justify-between rounded-xl border p-3">
                    <div>
                      <div className="text-xs font-semibold">Git Auto-Pull (20s)</div>
                      <div className="text-[11px] text-muted-foreground">
                        Aktualisiert <code>live-questions/</code> per git pull
                      </div>
                    </div>
                    <Switch checked={cfgGitPull} onCheckedChange={setCfgGitPull} />
                  </label>
                  <Button type="button" className="w-full" onClick={saveServerConfig}>
                    Einstellungen speichern
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Shortcuts: Space (Timer) · ←/→ · 1–4 · Q · S · F</span>
                  <a href="/" className="font-semibold text-brand-ink hover:underline">
                    Teilnehmer-UI →
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Hairline Top Progress Line */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-muted">
          <div
            className="h-full bg-brand-lime transition-all duration-500"
            style={{ width: `${elapsedPct}%` }}
          />
        </div>
      </header>

      {/* Main 16:9 Stage Workspace */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* PRIMARY STAGE CANVAS */}
        <main
          className={`relative flex min-h-0 min-w-0 flex-1 flex-col justify-between overflow-x-hidden overflow-y-auto p-5 sm:p-6 lg:px-9 lg:py-6 ${
            stageMode === "stage" || stageMode === "qr" ? "stage-atmosphere" : ""
          }`}
        >
          {(stageMode === "stage" || stageMode === "qr") && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <StageBackdrop className="absolute -right-28 -top-24 h-[460px] w-[460px] opacity-30 dark:opacity-45" />
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* MODE 1: STAGE / AKTUELLE PHASE */}
            {stageMode === "stage" && (
              <motion.div
                key={`stage-${activePhase.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 mx-auto flex h-full w-full max-w-[1060px] flex-col justify-between gap-4"
              >
                {/* Upper Focus: Phase Eyebrow + Massive Keynote Headline */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="num-tabular rounded-full bg-brand-lime px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-brand-obsidian">
                      Phase {activePhase.number} · {activePhase.timeRange} ({activePhase.durationMin} Min.)
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {activePhase.keyTakeaway}
                    </span>
                  </div>

                  <h1 className="font-display text-[clamp(1.75rem,2.85vw,3.1rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
                    {activePhase.beamerHeadline}
                  </h1>
                </div>

                {/* Middle Focus: Hairline-Separated Track A & Track B Cues (ZERO nested cards!) */}
                <div className="grid gap-5 border-y py-4 md:grid-cols-2 md:gap-0 md:divide-x">
                  <div className="space-y-1.5 md:pr-8">
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-brand-ink">
                      Track A · Browser &amp; Web-Chat
                    </div>
                    <p className="text-[clamp(1rem,1.25vw,1.3rem)] leading-relaxed text-foreground">
                      {activePhase.trackACue}
                    </p>
                  </div>
                  <div className="space-y-1.5 md:pl-8">
                    <div className="text-xs font-bold uppercase tracking-[0.1em] text-brand-ink">
                      Track B · Terminal, IDE &amp; Agent
                    </div>
                    <p className="text-[clamp(1rem,1.25vw,1.3rem)] leading-relaxed text-foreground">
                      {activePhase.trackBCue}
                    </p>
                  </div>
                </div>

                {/* Lower Anchor: Active Test Question Spotlight */}
                <div
                  className={`card-elevated rounded-2xl border bg-card p-5 ${
                    activeQuestion.number === 3 ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-brand-lime"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={activeQuestion.number === 3 ? "danger" : "lime"}>
                        Testfrage {activeQuestion.number} · {activeQuestion.type}
                      </Badge>
                      {activeQuestion.number === 3 && (
                        <Badge
                          variant="outline"
                          className="border-rose-500/40 bg-rose-500/10 font-mono text-rose-500 dark:text-rose-300"
                        >
                          0 Treffer in 68 Dateien
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRevealSolution((v) => !v)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{revealSolution ? "Lösung ausblenden (S)" : "Verifizierte Lösung (S)"}</span>
                    </Button>
                  </div>
                  <p className="mt-2.5 font-display text-[clamp(1.1rem,1.5vw,1.48rem)] font-bold leading-snug text-foreground">
                    „{activeQuestion.question}“
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong className="text-foreground">Beobachtung: </strong>
                    {activeQuestion.whatToWatch}
                  </p>
                  {revealSolution && (
                    <div className="mt-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-sm leading-relaxed text-foreground">
                      <strong>Verifizierte Lösung: </strong>
                      {activeQuestion.solutionSummary}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MODE 2: FULL-CANVAS QR JOIN TAKEOVER */}
            {stageMode === "qr" && (
              <motion.div
                key="mode-qr"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 mx-auto flex h-full w-full max-w-[1160px] flex-col items-center justify-center gap-10 rounded-3xl bg-[radial-gradient(circle_at_30%_50%,rgba(169,194,63,0.12),transparent_60%)] p-6 lg:flex-row lg:gap-14"
              >
                <div className="relative shrink-0">
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
                  <div className="lime-glow rounded-3xl bg-white p-5 shadow-2xl ring-2 ring-brand-lime/45">
                    <QrCodeSvg value={qrTargetUrl} size={300} />
                  </div>
                </div>

                <div className="max-w-xl space-y-6 text-center lg:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-lime/40 bg-brand-lime/15 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-brand-ink">
                      <QrCode className="h-3.5 w-3.5" />
                      Smartphone · Tablet · Laptop
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border bg-card/85 px-3 py-1 text-xs font-semibold text-foreground num-tabular">
                      <Users className="h-3.5 w-3.5 text-brand-ink" />
                      <span>
                        {submissions.length} Live-Beiträge · {connectedClients} verbundene Geräte
                      </span>
                    </div>
                  </div>

                  <h1 className="font-display text-[clamp(2.2rem,3.6vw,3.75rem)] font-extrabold leading-[1.06] tracking-[-0.03em]">
                    Scannen &amp; live mitmachen
                  </h1>

                  <div className="card-elevated wrap-safe rounded-2xl border bg-card px-5 py-3.5 font-mono text-xl font-bold text-brand-ink sm:text-2xl">
                    {qrTargetUrl}
                  </div>

                  <div className="grid gap-3 text-left sm:grid-cols-3">
                    {[
                      { n: "01", t: "QR scannen oder URL öffnen" },
                      { n: "02", t: "Track A (Chat) oder Track B (CLI) wählen" },
                      { n: "03", t: "Ergebnisse live an den Beamer senden" },
                    ].map((st) => (
                      <div key={st.n} className="card-elevated rounded-xl border bg-card/85 p-3">
                        <div className="num-tabular font-mono text-xs font-bold text-brand-ink">{st.n}</div>
                        <div className="mt-1 text-sm font-medium leading-snug">{st.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* MODE 3: LIVE-DEMO VERGLEICH */}
            {stageMode === "demo" && (
              <motion.div
                key="mode-demo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="relative z-10 mx-auto flex h-full w-full max-w-[1220px] flex-col justify-between gap-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
                      Live-Demo Referenz
                    </div>
                    <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                      Warum Struktur &amp; Leitplanken alles verändern
                    </h2>
                  </div>

                  <div className="inline-flex rounded-xl border bg-muted p-1">
                    {[
                      { id: "stages", label: "Stufe 1 → 2 → 3" },
                      { id: "methods", label: "4 Prompt-Methoden" },
                      { id: "layers", label: "5 Ebenen" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDemoTab(t.id as DemoSubTab)}
                        className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                          demoTab === t.id
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {demoTab === "stages" && <BeamerDemoSimulator />}

                {demoTab === "methods" && (
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    {data.promptMethods.map((m) => (
                      <div key={m.id} className="card-elevated flex flex-col justify-between rounded-2xl border bg-card p-6">
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-display text-xl font-bold">{m.name}</h3>
                            <Badge variant="lime">{m.badge}</Badge>
                          </div>
                          <p className="text-base text-muted-foreground">{m.bestFor}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.components.map((c) => (
                              <Badge key={c} variant="outline">
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 border-t pt-3 text-sm leading-relaxed text-foreground">
                          <strong className="text-brand-ink">Wirkung: </strong>
                          {m.strength}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {demoTab === "layers" && (
                  <div className="grid flex-1 gap-3">
                    {data.architectureLayers.map((l, idx) => (
                      <div
                        key={l.layer}
                        className="card-elevated grid items-center gap-3 rounded-2xl border bg-card px-6 py-4 md:grid-cols-12"
                      >
                        <div className="font-display text-lg font-bold md:col-span-3">{l.layer}</div>
                        <div className="text-base font-semibold text-brand-ink md:col-span-3">
                          {l.analogy}
                        </div>
                        <div className="text-sm text-muted-foreground md:col-span-3">{l.persistence}</div>
                        <div className="flex items-center gap-2 md:col-span-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-brand-lime"
                              style={{ width: `${(idx + 1) * 20}%` }}
                            />
                          </div>
                          <span className="num-tabular font-mono text-xs font-bold">
                            {(idx + 1) * 20}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* MODE 4: FULL-CANVAS LIVE-WALL */}
            {stageMode === "wall" && (
              <motion.div
                key="mode-wall"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="relative z-10 mx-auto flex h-full w-full max-w-[1260px] flex-col gap-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.08em] text-brand-ink">
                      Live-Wall · Klick auf Karte für Großansicht
                    </div>
                    <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                      Live aus dem Raum ({wallSubmissions.length})
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "all", label: `Alle (${submissions.length})` },
                      { id: "pinned", label: "Angepinnt" },
                      { id: "belegt", label: "Belegt" },
                      { id: "trap", label: "Fangfragen" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setWallFilter(f.id as WallFilter)}
                        className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors ${
                          wallFilter === f.id
                            ? "border-brand-lime bg-brand-lime text-brand-obsidian"
                            : "bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Telemetry KPI Strip */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Eingänge gesamt",
                      value: wallMetrics.total,
                      tone: "text-foreground",
                      accent: "border-t-brand-lime",
                    },
                    {
                      label: "Im Korpus belegt",
                      value: wallMetrics.grounded,
                      tone: "text-emerald-500 dark:text-emerald-400",
                      accent: "border-t-emerald-500",
                    },
                    {
                      label: "Fangfragen erkannt",
                      value: wallMetrics.traps,
                      tone: "text-rose-500 dark:text-rose-400",
                      accent: "border-t-rose-500",
                    },
                    {
                      label: "Mit Quellenangabe",
                      value: wallMetrics.cited,
                      tone: "text-brand-ink",
                      accent: "border-t-brand-lime",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className={`card-elevated rounded-2xl border border-t-2 ${kpi.accent} bg-card px-4 py-3`}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {kpi.label}
                      </div>
                      <div className={`num-tabular mt-1 font-display text-2xl font-extrabold ${kpi.tone}`}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                {wallSubmissions.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed p-12 text-center">
                    <Radio className="h-10 w-10 text-brand-ink" />
                    <p className="max-w-md text-base text-muted-foreground">
                      Noch keine Einträge in diesem Filter. Teams können über die App oder per MCP{" "}
                      <code>send_to_beamer</code> posten.
                    </p>
                    <Button type="button" variant="accent" onClick={simulateDemoQuestion}>
                      Demo-Frage simulieren
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {wallSubmissions.map((sub) => {
                      const ev = sub.evaluation;
                      const statusVar =
                        ev.status === "belegt"
                          ? "success"
                          : ev.status === "teilweise"
                            ? "warning"
                            : "danger";
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setSpotlight(sub)}
                          className={`card-elevated group flex cursor-pointer flex-col justify-between gap-3 rounded-2xl border bg-card p-5 transition-all hover:border-brand-lime ${
                            sub.pinned ? "ring-2 ring-brand-lime" : ""
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate font-display text-base font-bold">
                                  {sub.team}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {sub.stage} · {sub.method} · {sub.source}
                                </div>
                              </div>
                              <div
                                className="flex shrink-0 items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => togglePin(sub)}
                                >
                                  <Pin className={`h-4 w-4 ${sub.pinned ? "text-brand-ink" : ""}`} />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => removeSubmission(sub.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <p className="text-lg font-semibold leading-snug">{sub.question}</p>

                            {sub.ai_answer && (
                              <p className="line-clamp-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground">
                                {sub.ai_answer}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                            <Badge variant={statusVar}>
                              {ev.status === "belegt" ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              )}
                              {ev.status === "belegt"
                                ? "Im Korpus belegt"
                                : ev.status === "teilweise"
                                  ? "Teilweise belegt"
                                  : "Nicht im Korpus (Fangfrage!)"}
                            </Badge>
                            {ev.evidence[0] && (
                              <Badge variant="outline" className="font-mono">
                                [[{ev.evidence[0].slug}]]
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* COLLAPSIBLE COMPACT LIVE-FEED RAIL (Visible in Stage mode) */}
        {stageMode === "stage" && showFeedRail && (
          <aside className="flex w-full shrink-0 flex-col border-t bg-card/45 lg:w-[350px] lg:border-l lg:border-t-0 xl:w-[390px]">
            {/* Compact Micro-QR Trigger -> Click opens full QR Join Takeover */}
            <button
              type="button"
              onClick={() => setStageMode("qr")}
              className="flex items-center gap-3.5 border-b p-4 text-left transition-colors hover:bg-muted/60"
              title="Klicken für Vollbild-QR-Ansicht"
            >
              <QrCodeSvg value={qrTargetUrl} size={62} className="shrink-0 rounded-xl p-1" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-brand-ink">
                  QR Join (Vollbild ↗)
                </div>
                <div className="truncate font-mono text-xs font-semibold text-foreground">
                  {qrTargetUrl}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Oder MCP: <code>send_to_beamer</code>
                </div>
              </div>
            </button>

            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span>Live aus dem Raum</span>
                <Badge variant="secondary" className="num-tabular">
                  {submissions.length}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setStageMode("wall")}
                className="text-xs font-semibold text-brand-ink hover:underline"
              >
                Alle als Wall →
              </button>
            </div>

            <div className="min-h-0 flex-1 divide-y overflow-y-auto">
              {sortedSubmissions.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Noch keine Live-Einträge. Sende aus der App, per MCP oder via Regie → Demo-Frage.
                </div>
              )}

              <AnimatePresence initial={false}>
                {sortedSubmissions.map((sub) => {
                  const ev = sub.evaluation;
                  const dotColor =
                    ev.status === "belegt"
                      ? "bg-emerald-400"
                      : ev.status === "teilweise"
                        ? "bg-amber-400"
                        : "bg-rose-400";
                  const statusText =
                    ev.status === "belegt"
                      ? "Belegt"
                      : ev.status === "teilweise"
                        ? "Teilweise"
                        : "Fangfrage!";
                  return (
                    <motion.div
                      layout
                      key={sub.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSpotlight(sub)}
                      className={`group cursor-pointer space-y-1.5 px-4 py-3.5 transition-colors hover:bg-muted/60 ${
                        sub.pinned ? "bg-secondary/35" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-bold text-foreground">{sub.team}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{sub.stage}</span>
                        </div>
                        <div
                          className="flex shrink-0 items-center gap-0.5 opacity-80 lg:opacity-0 lg:group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => togglePin(sub)}
                          >
                            <Pin className={`h-3 w-3 ${sub.pinned ? "text-brand-ink" : ""}`} />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeSubmission(sub.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <p className="line-clamp-2 text-sm leading-snug text-foreground/95">
                        {sub.question}
                      </p>

                      <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                          {statusText}
                        </span>
                        {ev.evidence[0] && (
                          <span className="truncate font-mono text-muted-foreground">
                            · [[{ev.evidence[0].slug}]]
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom 48px 7-Dot Keynote Timeline (NEVER truncates active title!) */}
      <footer className="flex h-12 shrink-0 items-center justify-between gap-3 border-t bg-card/90 px-4 lg:px-6">
        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
          {data.phases.map((p, idx) => {
            const isActive = idx === phaseIdx;
            const isDone = idx < phaseIdx;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => goPhase(idx)}
                title={`${p.number}. ${p.title} (${p.timeRange})`}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs transition-all ${
                  isActive
                    ? "bg-brand-lime font-bold text-brand-obsidian shadow-sm"
                    : isDone
                      ? "bg-secondary/60 font-medium text-foreground hover:bg-secondary"
                      : "bg-muted/60 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="num-tabular font-mono">{p.number}</span>
                {isActive && (
                  <span className="whitespace-nowrap">
                    {p.title} · {p.timeRange}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="hidden font-mono text-xs text-muted-foreground xl:block">
          {nowClock}
        </div>
      </footer>

      {/* Plenum Spotlight Modal (Inherits Dark Mode cleanly via documentElement!) */}
      <Dialog open={!!spotlight} onOpenChange={(o) => !o && setSpotlight(null)}>
        <DialogContent className="max-w-3xl">
          {spotlight && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="lime">{spotlight.team}</Badge>
                  <Badge variant="secondary">{spotlight.track}</Badge>
                  <Badge variant="outline">
                    {spotlight.stage} · {spotlight.method}
                  </Badge>
                </div>
                <DialogTitle className="pt-2 text-2xl leading-snug">
                  {spotlight.question}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {spotlight.ai_answer && (
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Eingesandte KI-Antwort
                    </div>
                    <p className="whitespace-pre-wrap text-base leading-relaxed">
                      {spotlight.ai_answer}
                    </p>
                  </div>
                )}

                <div className="space-y-2.5 border-t pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">Automatischer Prüfmechanismus:</span>
                    <Badge
                      variant={
                        spotlight.evaluation.status === "belegt"
                          ? "success"
                          : spotlight.evaluation.status === "teilweise"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {spotlight.evaluation.statusLabel}
                    </Badge>
                  </div>

                  {spotlight.evaluation.llmComment && (
                    <div className="rounded-xl border border-brand-lime/40 bg-secondary/40 p-3.5 text-sm">
                      <strong>Live-KI-Prüfer ({spotlight.evaluation.llmProvider}):</strong>{" "}
                      {spotlight.evaluation.llmComment}
                    </div>
                  )}

                  <div className="space-y-2">
                    {spotlight.evaluation.evidence.map((ev) => (
                      <div key={ev.slug} className="rounded-xl border bg-muted/25 p-3 text-xs">
                        <div className="font-mono font-bold text-brand-ink">
                          {ev.wikilink} · {ev.source_file}
                        </div>
                        <p className="mt-1 leading-relaxed text-muted-foreground">{ev.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
