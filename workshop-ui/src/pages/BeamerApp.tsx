import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Pin,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import rawData from "@/data/workshopData.json";
import { QrCodeSvg } from "@/components/QrCodeSvg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { ServerHealth, SubmissionItem, WorkshopDataset } from "@/types/workshop";

const data = rawData as unknown as WorkshopDataset;

type DemoViewMode = "phase" | "stages" | "methods" | "architecture";

function formatMMSS(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BeamerApp() {
  const [darkBeamer, setDarkBeamer] = useState<boolean>(true);
  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(data.phases[0].durationMin * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [nowClock, setNowClock] = useState<string>(() =>
    new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
  );
  const [viewMode, setViewMode] = useState<DemoViewMode>("phase");
  const [revealSolution, setRevealSolution] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live submissions & health
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [spotlight, setSpotlight] = useState<SubmissionItem | null>(null);
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  // Settings modal state
  const [cfgJoinUrl, setCfgJoinUrl] = useState<string>("");
  const [cfgGithubRepo, setCfgGithubRepo] = useState<string>("");
  const [cfgGithubLabel, setCfgGithubLabel] = useState<string>("workshop-question");
  const [cfgGitPull, setCfgGitPull] = useState<boolean>(false);
  const [cfgSavedMsg, setCfgSavedMsg] = useState<string>("");

  const activePhase = data.phases[phaseIdx];
  const activeQuestion = useMemo(
    () => data.testQuestions.find((q) => q.id === activePhase.activeQuestionId) || data.testQuestions[0],
    [activePhase.activeQuestionId]
  );

  // Wall clock updater
  useEffect(() => {
    const id = window.setInterval(() => {
      setNowClock(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Keyboard shortcuts (Space = play/pause, Left/Right = phase)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        setRunning((r) => !r);
      } else if (e.code === "ArrowRight") {
        goPhase(Math.min(data.phases.length - 1, phaseIdx + 1));
      } else if (e.code === "ArrowLeft") {
        goPhase(Math.max(0, phaseIdx - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phaseIdx]);

  // Initial fetch & SSE connection
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
      .catch(() => {});

    fetch("/api/submissions")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.items) setSubmissions(res.items);
      })
      .catch(() => {});

    const es = new EventSource("/api/events");
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.addEventListener("submissions", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data);
        if (Array.isArray(payload.items)) {
          setSubmissions(payload.items);
        }
      } catch {
        // ignore
      }
    });
    return () => es.close();
  }, []);

  function goPhase(nextIdx: number) {
    setPhaseIdx(nextIdx);
    setSecondsLeft(data.phases[nextIdx].durationMin * 60);
    setRevealSolution(false);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  async function simulateDemoQuestion() {
    await fetch("/api/submissions/demo", { method: "POST" }).catch(() => {});
  }

  async function togglePin(item: SubmissionItem) {
    await fetch(`/api/submissions/${encodeURIComponent(item.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !item.pinned }),
    }).catch(() => {});
  }

  async function removeSubmission(id: string) {
    await fetch(`/api/submissions/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    if (spotlight?.id === id) setSpotlight(null);
  }

  async function saveServerConfig() {
    setCfgSavedMsg("");
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
      setCfgSavedMsg("Gespeichert! Watcher & QR-Code aktualisiert.");
    } else {
      setCfgSavedMsg("Konnte Server-Konfiguration nicht speichern.");
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

  return (
    <div className={darkBeamer ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        {/* Top Beamer Control Header */}
        <header className="border-b bg-card/95 px-5 py-3 shadow-sm">
          <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-v7-green text-white shadow">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight sm:text-xl">
                    virtual7 · CCF Prompt-Werkstatt
                  </span>
                  <Badge variant={sseConnected ? "success" : "warning"} className="text-xs">
                    <Radio className="h-3 w-3" />
                    {sseConnected ? "Live-Stream aktiv" : "Offline / Statisch"}
                  </Badge>
                  {health?.llmMode && (
                    <Badge variant="outline" className="hidden md:inline-flex">
                      Prüfer: {health.llmMode}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.meta.timeSlot} · Phase {activePhase.number}/{data.phases.length}:{" "}
                  <strong>{activePhase.title}</strong> ({activePhase.timeRange})
                </p>
              </div>
            </div>

            {/* Timer & Regie Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border bg-muted/60 px-3 py-1.5">
                <Clock className="h-4 w-4 text-v7-green" />
                <span
                  className={`font-mono text-2xl font-extrabold tabular-nums ${
                    secondsLeft <= 60 && running ? "text-rose-500" : ""
                  }`}
                >
                  {formatMMSS(secondsLeft)}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant={running ? "secondary" : "default"}
                  onClick={() => setRunning((r) => !r)}
                  title="Timer Start/Pause (Leertaste)"
                >
                  {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setSecondsLeft(activePhase.durationMin * 60)}
                  title="Phase zurücksetzen"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSecondsLeft((s) => s + 60)}
                  title="+1 Minute"
                >
                  <Plus className="h-3.5 w-3.5" />1m
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={phaseIdx === 0}
                  onClick={() => goPhase(phaseIdx - 1)}
                  title="Vorherige Phase (Pfeil links)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={phaseIdx === data.phases.length - 1}
                  onClick={() => goPhase(phaseIdx + 1)}
                  title="Nächste Phase (Pfeil rechts)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button type="button" size="sm" variant="secondary" onClick={simulateDemoQuestion}>
                Demo-Frage simulieren
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" size="icon" variant="outline" title="Beamer & Watcher Einstellungen">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Beamer-Regie &amp; Dual-Modus-Einstellungen</DialogTitle>
                    <DialogDescription>
                      Konfiguriere Join-URL für den QR-Code, GitHub-Issue-Watcher oder Git-Auto-Pull.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2 text-sm">
                    {health?.lanUrls && health.lanUrls.length > 0 && (
                      <div className="rounded-lg border bg-muted/40 p-3 text-xs">
                        <div className="mb-1 font-semibold">Erkannte LAN-Adressen für Teilnehmer:</div>
                        {health.lanUrls.map((u) => (
                          <div key={u} className="font-mono">
                            {u}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-medium">QR-Code Ziel-URL (LAN-IP oder Repo-URL)</label>
                      <Input value={cfgJoinUrl} onChange={(e) => setCfgJoinUrl(e.target.value)} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">GitHub Repo (owner/repo) für Issues</label>
                        <Input
                          value={cfgGithubRepo}
                          onChange={(e) => setCfgGithubRepo(e.target.value)}
                          placeholder="z. B. virtual7/ccf-ki-workshop"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Issue-Label Filter</label>
                        <Input value={cfgGithubLabel} onChange={(e) => setCfgGithubLabel(e.target.value)} />
                      </div>
                    </div>
                    <label className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-xs font-semibold">Git Auto-Pull alle 20s</div>
                        <div className="text-[11px] text-muted-foreground">
                          Holt automatisch neue Dateien aus <code>live-questions/</code> per git pull.
                        </div>
                      </div>
                      <Switch checked={cfgGitPull} onCheckedChange={setCfgGitPull} />
                    </label>
                    {cfgSavedMsg && (
                      <div className="rounded-md bg-emerald-500/15 p-2 text-xs text-emerald-400">
                        {cfgSavedMsg}
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button type="button" onClick={saveServerConfig}>
                        Speichern &amp; aktivieren
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setDarkBeamer((d) => !d)}
                title="Hell/Dunkel umschalten"
              >
                {darkBeamer ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={toggleFullscreen}
                title="Vollbild"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <span className="hidden rounded-md border px-2.5 py-1 font-mono text-sm font-semibold xl:inline-block">
                {nowClock}
              </span>
            </div>
          </div>
          <Progress value={elapsedPct} className="mx-auto mt-2.5 h-1.5 max-w-[1680px]" />
        </header>

        {/* Main 16:9 Beamer Grid */}
        <main className="mx-auto grid max-w-[1680px] gap-5 p-5 lg:grid-cols-12">
          {/* LEFT 7 COLS: CURRENT PHASE + DEMO SWITCHER */}
          <div className="space-y-4 lg:col-span-7">
            {/* Phase Stepper Pills */}
            <div className="grid grid-cols-7 gap-1.5">
              {data.phases.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goPhase(idx)}
                  className={`rounded-lg border px-2 py-2 text-left transition-all ${
                    idx === phaseIdx
                      ? "border-primary bg-primary text-primary-foreground shadow"
                      : idx < phaseIdx
                        ? "border-v7-green/40 bg-secondary/40 opacity-80"
                        : "bg-card hover:bg-muted"
                  }`}
                >
                  <div className="text-[11px] font-bold">
                    {p.number}. {p.timeRange.split("–")[0]}
                  </div>
                  <div className="truncate text-xs font-medium">{p.title}</div>
                </button>
              ))}
            </div>

            {/* View Switcher for Live Demo */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "phase", label: "Aktuelle Phase & Auftrag" },
                  { id: "stages", label: "Live-Demo: Stufe 1 vs. 2 vs. 3" },
                  { id: "methods", label: "4 Prompt-Methoden" },
                  { id: "architecture", label: "5 Ebenen & MCP" },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    type="button"
                    size="sm"
                    variant={viewMode === tab.id ? "default" : "outline"}
                    onClick={() => setViewMode(tab.id as DemoViewMode)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <a
                href="/"
                className="text-xs font-medium text-v7-green hover:underline"
              >
                ← Zur Teilnehmer-UI
              </a>
            </div>

            {viewMode === "phase" && (
              <div className="space-y-4">
                <Card className="border-v7-green/50 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        JETZT DRAN · {activePhase.timeRange} ({activePhase.durationMin} Min.)
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Leitgedanke: {activePhase.keyTakeaway}
                      </span>
                    </div>
                    <CardTitle className="pt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
                      {activePhase.beamerHeadline}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border bg-muted/40 p-4">
                      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-v7-green">
                        Track A · Browser &amp; Web-Chat
                      </div>
                      <p className="text-base leading-snug">{activePhase.trackACue}</p>
                    </div>
                    <div className="rounded-xl border bg-muted/40 p-4">
                      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-v7-green">
                        Track B · Terminal, IDE &amp; Agent
                      </div>
                      <p className="text-base leading-snug">{activePhase.trackBCue}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Test Question Spotlight */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={activeQuestion.number === 3 ? "warning" : "default"}>
                        Aktuelle Testfrage {activeQuestion.number}: {activeQuestion.type}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setRevealSolution((s) => !s)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{revealSolution ? "Lösung ausblenden" : "Verifizierte Lösung zeigen"}</span>
                      </Button>
                    </div>
                    <CardTitle className="pt-2 text-xl leading-snug">
                      „{activeQuestion.question}“
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      <strong>Beobachtungsfokus:</strong> {activeQuestion.whatToWatch}
                    </p>
                    {revealSolution && (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm leading-relaxed">
                        <strong>Verifizierte Quelle &amp; Antwort:</strong> {activeQuestion.solutionSummary}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {viewMode === "stages" && (
              <div className="grid gap-3 md:grid-cols-3">
                <Card className="border-rose-500/40">
                  <CardHeader>
                    <Badge variant="danger" className="w-fit">Stufe 1 · Chaos</Badge>
                    <CardTitle className="text-xl">Ungefilterter Chat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Setup:</strong> Minimaler 1-Zeiler in <code>AGENTS.md</code> + 68 flache Dateien.</p>
                    <p><strong>Symptom:</strong> Rät bei Lücken, mischt Trainingswissen ein, keine Quellen.</p>
                    <p><strong>Fangfrage 3:</strong> Gefahr von überzeugenden Halluzinationen.</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/40">
                  <CardHeader>
                    <Badge variant="warning" className="w-fit">Stufe 2 · Harness</Badge>
                    <CardTitle className="text-xl">Skills &amp; Guardrails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Setup:</strong> Klare Guardrails + <code>quellen-recherche</code> &amp; <code>fakten-pruefer</code>.</p>
                    <p><strong>Wirkung:</strong> Zitiert Dateinamen nach jeder Aussage.</p>
                    <p><strong>Fangfrage 3:</strong> Klare Ablehnung („nicht enthalten“).</p>
                  </CardContent>
                </Card>
                <Card className="border-emerald-500/50">
                  <CardHeader>
                    <Badge variant="success" className="w-fit">Stufe 3 · Markdown-RAG</Badge>
                    <CardTitle className="text-xl">Obsidian-Vault</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Setup:</strong> <code>_index.md</code> + Frontmatter + <code>[[Wikilinks]]</code> + <code>raw/</code>.</p>
                    <p><strong>Wirkung:</strong> Springt gezielt über das Beziehungsnetz statt blind zu suchen.</p>
                    <p><strong>Querverbindung 2:</strong> Verknüpft 4+ Artikel präzise.</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {viewMode === "methods" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.promptMethods.map((m) => (
                  <Card key={m.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{m.name}</CardTitle>
                        <Badge variant="secondary">{m.badge}</Badge>
                      </div>
                      <CardDescription>{m.bestFor}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {m.components.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{m.strength}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {viewMode === "architecture" && (
              <div className="space-y-2.5">
                {data.architectureLayers.map((l) => (
                  <Card key={l.layer}>
                    <CardContent className="grid items-center gap-2 p-4 sm:grid-cols-12">
                      <div className="font-bold sm:col-span-3">{l.layer}</div>
                      <div className="text-sm text-v7-green sm:col-span-3">{l.analogy}</div>
                      <div className="text-xs text-muted-foreground sm:col-span-3">{l.persistence}</div>
                      <div className="rounded bg-muted p-2 text-xs sm:col-span-3">{l.example}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 5 COLS: QR JOIN PANEL + LIVE SUBMISSIONS FEED */}
          <div className="space-y-4 lg:col-span-5">
            {/* Compact Join & QR Card */}
            <Card className="border-v7-green/40">
              <CardContent className="flex items-center gap-4 p-4">
                <QrCodeSvg value={qrTargetUrl} size={112} className="shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-v7-green">
                    Mitmachen &amp; an Beamer senden
                  </div>
                  <div className="truncate font-mono text-sm font-bold">{qrTargetUrl}</div>
                  <p className="text-xs text-muted-foreground">
                    Oder per MCP: <code>send_to_beamer</code> / Ordner <code>live-questions/</code>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Live Submissions & Corpus Checker Feed */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Live aus dem Raum
                    <Badge variant="secondary">{submissions.length}</Badge>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    Klick auf Karte = Großansicht
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[490px] pr-2">
                  <div className="space-y-3">
                    {sortedSubmissions.length === 0 && (
                      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Noch keine Live-Einträge. Sende über die UI, per MCP <code>send_to_beamer</code>{" "}
                        oder klicke oben auf „Demo-Frage simulieren“.
                      </div>
                    )}

                    {sortedSubmissions.map((sub) => {
                      const ev = sub.evaluation;
                      const badgeVariant =
                        ev.status === "belegt"
                          ? "success"
                          : ev.status === "teilweise"
                            ? "warning"
                            : "danger";
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setSpotlight(sub)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all hover:border-primary ${
                            sub.pinned ? "border-primary bg-secondary/20 ring-1 ring-primary" : "bg-card"
                          }`}
                        >
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-bold">{sub.team}</span>
                              <Badge variant="outline" className="text-[11px]">{sub.source}</Badge>
                              <Badge variant="secondary" className="text-[11px]">{sub.stage}</Badge>
                              {sub.sample && <Badge variant="outline" className="text-[11px]">Beispiel</Badge>}
                            </div>
                            <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => togglePin(sub)}
                                title="Anpinnen"
                              >
                                <Pin className={`h-3.5 w-3.5 ${sub.pinned ? "text-v7-green" : ""}`} />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => removeSubmission(sub.id)}
                                title="Entfernen"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm font-medium leading-snug">{sub.question}</p>

                          {sub.ai_answer && (
                            <p className="mt-1.5 rounded bg-muted/50 px-2.5 py-2 text-xs leading-relaxed text-muted-foreground">
                              {sub.ai_answer.length > 165 ? `${sub.ai_answer.slice(0, 162)}...` : sub.ai_answer}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant={badgeVariant} className="text-[11px]">
                              {ev.status === "belegt" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {ev.status === "belegt"
                                ? "Im Korpus belegt"
                                : ev.status === "teilweise"
                                  ? "Teilweise belegt"
                                  : "Nicht im Korpus (Fangfrage!)"}
                            </Badge>
                            {ev.answerHasCitation && (
                              <Badge variant="success" className="text-[11px]">Quellen zitiert</Badge>
                            )}
                            {ev.answerHasGuardrailRefusal && (
                              <Badge variant="success" className="text-[11px]">Guardrail gegriffen</Badge>
                            )}
                            {ev.evidence.slice(0, 2).map((m) => (
                              <Badge key={m.slug} variant="outline" className="text-[11px]">
                                [[{m.slug}]]
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Plenum Spotlight Modal */}
        <Dialog open={!!spotlight} onOpenChange={(o) => !o && setSpotlight(null)}>
          <DialogContent className="max-w-3xl">
            {spotlight && (
              <>
                <DialogHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{spotlight.team}</Badge>
                    <Badge variant="secondary">{spotlight.track}</Badge>
                    <Badge variant="outline">{spotlight.stage} · {spotlight.method}</Badge>
                  </div>
                  <DialogTitle className="pt-2 text-xl leading-snug">
                    {spotlight.question}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  {spotlight.ai_answer && (
                    <div className="rounded-xl border bg-muted/40 p-3.5">
                      <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">
                        Eingesandte KI-Antwort / Beobachtung
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{spotlight.ai_answer}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-2">
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
                      <div className="rounded-xl border border-v7-green/40 bg-secondary/30 p-3 text-sm">
                        <strong>Live-KI-Prüfer ({spotlight.evaluation.llmProvider}):</strong>{" "}
                        {spotlight.evaluation.llmComment}
                      </div>
                    )}
                    <div className="space-y-2">
                      {spotlight.evaluation.evidence.map((ev) => (
                        <div key={ev.slug} className="rounded-lg border p-3 text-xs">
                          <div className="font-semibold">
                            {ev.wikilink} · <code>{ev.source_file}</code>
                          </div>
                          <p className="mt-1 text-muted-foreground">{ev.snippet}</p>
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
    </div>
  );
}
