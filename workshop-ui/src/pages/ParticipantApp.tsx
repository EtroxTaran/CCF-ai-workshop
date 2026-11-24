import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Compass,
  Cpu,
  FileCode2,
  Layers,
  Monitor,
  Network,
  Plug,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import rawData from "@/data/workshopData.json";
import { ArchitectureLayerStack } from "@/components/ArchitectureLayerStack";
import { BeamerSendSheet, type BeamerPrefill } from "@/components/BeamerSendSheet";
import { CopyButton } from "@/components/CopyButton";
import { ObsidianKnowledgeGraph } from "@/components/ObsidianKnowledgeGraph";
import { PromptMethodComparator } from "@/components/PromptMethodComparator";
import { StageArtifactsSheet } from "@/components/StageArtifactsSheet";
import { StageBackdrop } from "@/components/StageBackdrop";
import { StageMiniDiagram } from "@/components/StageMiniDiagram";
import { Virtual7Logo } from "@/components/Virtual7Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { EvidenceMatch, StageState, WorkshopDataset } from "@/types/workshop";

const data = rawData as unknown as WorkshopDataset;

type StepId = "start" | "methods" | "stages" | "mcp" | "missions";

function renderInlineCode(text: string) {
  const parts = String(text || "").split(/(`[^`]+`)/g);
  return parts.map((part, idx) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={idx} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

function parseWikilink(raw: string, fallbackSlug: string, fallbackTitle?: string) {
  const m = String(raw || "").match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (m) return { slug: m[1], title: m[2] || fallbackTitle || m[1] };
  return { slug: fallbackSlug, title: fallbackTitle || fallbackSlug };
}

const STEPS: { id: StepId; num: string; label: string; short: string; icon: typeof Compass }[] = [
  { id: "start", num: "01", label: "Start & Track", short: "Start", icon: Compass },
  { id: "methods", num: "02", label: "Methoden & Ebenen", short: "Methoden", icon: Layers },
  { id: "stages", num: "03", label: "Stufen 1 → 2 → 3", short: "Stufen", icon: BookOpen },
  { id: "mcp", num: "04", label: "Tools & MCP", short: "MCP", icon: Plug },
  { id: "missions", num: "05", label: "Wahl-Missionen", short: "Missionen", icon: Sparkles },
];

const CHECKLIST_ITEMS = [
  { id: "chk-setup", label: "Track (A oder B) gewählt & Teamnamen notiert" },
  { id: "chk-methods", label: "Prompt-Methoden (Zero-Shot vs. CO-STAR/Few-Shot/RISEN) getestet" },
  { id: "chk-priming", label: "System-Prompt / Priming vs. User-Prompt verglichen" },
  { id: "chk-s1", label: "Stufe 1 (Chaos): Fragen 1–3 getestet & Lücken beobachtet" },
  { id: "chk-s2", label: "Stufe 2 (Harness): Guardrails & Fangfrage 3 geprüft" },
  { id: "chk-s3", label: "Stufe 3 (Vault): _index.md & Wissens-Graph für Frage 2 genutzt" },
  { id: "chk-mission", label: "Mindestens 1 Wahl-Mission oder MCP-Tool ausprobiert" },
  { id: "chk-beamer", label: "Frage oder Aha-Moment an den Beamer gesendet" },
];

const STORAGE_KEY = "v7-ccf-workshop-state-v2";

export function ParticipantApp() {
  const [step, setStep] = useState<StepId>("start");
  const [track, setTrack] = useState<"A" | "B">("A");
  const [teamName, setTeamName] = useState<string>("Tisch 1");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);

  // Live synced Beamer stage companion
  const [liveStage, setLiveStage] = useState<StageState | null>(null);
  const [syncedSec, setSyncedSec] = useState<number>(600);

  // Send-to-Beamer global drawer
  const [sendOpen, setSendOpen] = useState(false);
  const [sendPrefill, setSendPrefill] = useState<BeamerPrefill | null>(null);
  const [githubRepoSlug, setGithubRepoSlug] = useState("");

  // MCP Playground state
  const [mcpQuery, setMcpQuery] = useState("Anemonenfische Seeanemonen Symbiose");
  const [mcpResults, setMcpResults] = useState<EvidenceMatch[] | null>(null);
  const [verifyClaim, setVerifyClaim] = useState(
    "Eisbärentalg enthält kein Squalen und verhindert dadurch das Gefrieren des Fells."
  );
  const [verifyOutput, setVerifyOutput] = useState<{
    status: string;
    label: string;
    evidence: EvidenceMatch[];
  } | null>(null);
  const [mcpActiveHop, setMcpActiveHop] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("v7-ccf-workshop-state-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.track === "A" || parsed.track === "B") setTrack(parsed.track);
        if (typeof parsed.teamName === "string") setTeamName(parsed.teamName);
        if (parsed.checked && typeof parsed.checked === "object") setChecked(parsed.checked);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ track, teamName, checked }));
    } catch {
      // ignore
    }
  }, [track, teamName, checked]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => {
        if (h?.githubRepo) setGithubRepoSlug(h.githubRepo);
      })
      .catch(() => undefined);

    const es = new EventSource("/api/events");
    es.addEventListener("stage", (ev) => {
      try {
        const st = JSON.parse((ev as MessageEvent).data) as StageState;
        setLiveStage(st);
        setSyncedSec(st.secondsLeft);
      } catch {
        // ignore
      }
    });
    return () => es.close();
  }, []);

  useEffect(() => {
    if (!liveStage?.running) return;
    const id = window.setInterval(() => {
      setSyncedSec((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [liveStage?.running, liveStage?.updatedAt]);

  function mapPhaseToStep(phaseIdx: number): { step: StepId; stageIdx?: number } {
    if (phaseIdx <= 1) return { step: "start" };
    if (phaseIdx === 2) return { step: "methods" };
    if (phaseIdx === 3) return { step: "stages", stageIdx: 1 };
    if (phaseIdx === 4) return { step: "stages", stageIdx: 2 };
    return { step: "missions" };
  }

  function formatCompactTime(sec: number): string {
    const safe = Math.max(0, Math.floor(sec));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const completedCount = useMemo(
    () => CHECKLIST_ITEMS.filter((item) => checked[item.id]).length,
    [checked]
  );

  const trackAPacks = useMemo(() => {
    const pick = (slugs: string[]) =>
      data.starterArticles
        .filter((a) => slugs.includes(a.slug))
        .map((a) => `=== DATEI: docs/${a.slug}.md ===\n${a.content}`)
        .join("\n\n");
    return {
      arctic: pick(["eisbaer", "arktis", "ringelrobbe", "klimawandel"]),
      reef: pick(["anemonenfische", "seeanemonen", "symbiose", "steinkorallen", "korallenbleiche", "korallenriff"]),
      all12: data.starterArticles.map((a) => `=== DATEI: docs/${a.slug}.md ===\n${a.content}`).join("\n\n"),
    };
  }, []);

  function goToStep(next: StepId) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openBeamerSheet(prefill?: BeamerPrefill) {
    setSendPrefill(prefill || null);
    setSendOpen(true);
  }

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function animatePipelinePulse() {
    setMcpActiveHop(1);
    window.setTimeout(() => setMcpActiveHop(2), 180);
    window.setTimeout(() => setMcpActiveHop(3), 360);
    window.setTimeout(() => setMcpActiveHop(4), 540);
    window.setTimeout(() => setMcpActiveHop(0), 1400);
  }

  async function runMcpSearch(customQuery?: string) {
    const q = (customQuery ?? mcpQuery).trim();
    if (customQuery !== undefined) setMcpQuery(customQuery);
    animatePipelinePulse();
    try {
      const res = await fetch("/api/tools/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 5 }),
      });
      if (res.ok) {
        const json = await res.json();
        setMcpResults(json.matches || []);
        return;
      }
    } catch {
      // local fallback
    }
    const qTokens = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
    const localMatches: EvidenceMatch[] = data.vaultArticles
      .map((a) => {
        const hay = `${a.title} ${a.habitat} ${a.summary} ${a.tags.join(" ")}`.toLowerCase();
        const score = qTokens.reduce((acc, t) => acc + (hay.includes(t) ? 10 : 0), 0);
        return {
          slug: a.slug,
          title: a.title,
          wikilink: `[[${a.slug}|${a.title}]]`,
          rel_path: `wiki/${a.category === "lebensraum" ? "lebensraeume" : a.category === "tierart" ? "tierarten" : "konzepte"}/${a.slug}.md`,
          source_file: a.source_file,
          snippet: a.summary,
          score,
        };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setMcpResults(localMatches);
  }

  async function runMcpVerify(customClaim?: string) {
    const c = (customClaim ?? verifyClaim).trim();
    if (customClaim !== undefined) setVerifyClaim(customClaim);
    animatePipelinePulse();
    try {
      const res = await fetch("/api/tools/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: c }),
      });
      if (res.ok) {
        const json = await res.json();
        setVerifyOutput({
          status: json.status,
          label: json.statusLabel || json.confidence_label,
          evidence: json.evidence || [],
        });
        return;
      }
    } catch {
      // fallback
    }
    const tokens = c
      .toLowerCase()
      .replace(/[^a-z0-9äöüß\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4);
    const hits = data.starterArticles
      .map((a) => {
        const hay = a.content.toLowerCase();
        const count = tokens.filter((t) => hay.includes(t)).length;
        return {
          slug: a.slug,
          title: a.title,
          wikilink: `[[${a.slug}|${a.title}]]`,
          rel_path: `docs/${a.slug}.md`,
          source_file: `raw/${a.slug}.md`,
          snippet: a.content.split("\n").find((l) => l.trim() && !l.startsWith("#")) || "",
          score: count,
        };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    setVerifyOutput({
      status: hits.length > 0 && hits[0].score >= 2 ? "belegt" : "nicht_belegt",
      label:
        hits.length > 0 && hits[0].score >= 2
          ? "Starke Übereinstimmung im Starter-Korpus."
          : "Keine eindeutigen Belege gefunden (mögliche Fangfrage).",
      evidence: hits,
    });
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const prevStep = stepIndex > 0 ? STEPS[stepIndex - 1] : null;
  const nextStep = stepIndex < STEPS.length - 1 ? STEPS[stepIndex + 1] : null;
  const currentStage = data.stages[activeStageIdx];
  const progressPct = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Slim Single-Row Sticky Header (56px) */}
      <header className="sticky top-0 z-40 h-14 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Virtual7Logo compact className="sm:hidden" />
            <Virtual7Logo className="hidden h-7 sm:block" />
            <Separator orientation="vertical" className="hidden h-5 sm:block" />
            <span className="whitespace-nowrap font-display text-sm font-bold tracking-tight">
              <span className="sm:hidden">CCF</span>
              <span className="hidden sm:inline">Prompt-Werkstatt</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Compact Track Segmented Switch */}
            <div className="inline-flex rounded-lg border bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTrack("A")}
                className={`min-h-[34px] min-w-[30px] rounded-md px-2.5 py-1 font-medium transition-colors ${
                  track === "A" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                title="Track A: Browser & Web-Chat"
              >
                <span className="sm:hidden">A</span>
                <span className="hidden sm:inline">Track A · Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setTrack("B")}
                className={`min-h-[34px] min-w-[30px] rounded-md px-2.5 py-1 font-medium transition-colors ${
                  track === "B" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
                title="Track B: Terminal, IDE & Agent"
              >
                <span className="sm:hidden">B</span>
                <span className="hidden sm:inline">Track B · CLI</span>
              </button>
            </div>

            {/* Checklist & Team Drawer Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="num-tabular h-9 gap-1.5 px-2.5 text-xs"
                  title="Fortschritt & Team-Einstellungen"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-ink" />
                  <span>
                    {completedCount}/{CHECKLIST_ITEMS.length}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Euer Fortschritt ({progressPct}%)</SheetTitle>
                  <SheetDescription>
                    Wird automatisch im Browser gespeichert. Teamname gilt für den Beamer-Feed.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-5 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Team / Tisch
                    </label>
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="z. B. Tisch 1"
                    />
                  </div>
                  <div className="space-y-2">
                    {CHECKLIST_ITEMS.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={!!checked[item.id]}
                          onCheckedChange={() => toggleCheck(item.id)}
                          className="mt-0.5"
                        />
                        <span className={checked[item.id] ? "line-through text-muted-foreground" : ""}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Global Send to Beamer CTA */}
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 px-2.5 text-xs sm:px-3"
              onClick={() => openBeamerSheet()}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="sm:hidden">Beamer</span>
              <span className="hidden sm:inline">An Beamer</span>
            </Button>

            <a
              href="/beamer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Zur Beamer-Ansicht wechseln"
              aria-label="Zur Beamer-Ansicht wechseln"
            >
              <Monitor className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Responsive Shell: Left Step-Rail (lg+) + Calm Guided Canvas */}
      <div className="mx-auto flex max-w-[1320px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[256px] shrink-0 flex-col justify-between border-r px-4 py-8 lg:flex">
          <nav aria-label="Workshop-Schritte" className="space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Lernpfad (11:00–12:00)
            </div>
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-left text-sm transition-all ${
                    isActive
                      ? "border-l-primary bg-secondary/70 font-semibold text-foreground"
                      : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-brand-ink" : ""}`} />
                  <div className="min-w-0 flex-1">
                    <span className="num-tabular mr-1.5 font-mono text-xs opacity-60">{s.num}</span>
                    <span className="truncate">{s.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="space-y-2 rounded-xl border bg-card p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{teamName || "Mein Team"}</span>
              <Badge variant="secondary" className="text-[10px]">
                Track {track}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>68 öffentliche Wikipedia-Artikel</span>
            </div>
          </div>
        </aside>

        {/* Focused Editorial Content Canvas */}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-[920px]">
            {liveStage?.beamerActive && data.phases[liveStage.phaseIdx] && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-lime/40 bg-secondary/50 px-4 py-2.5 text-xs">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-brand-lime" />
                  <span className="font-semibold text-foreground">
                    Live auf dem Beamer: Phase {data.phases[liveStage.phaseIdx].number} ·{" "}
                    {data.phases[liveStage.phaseIdx].title}
                  </span>
                  <span className="num-tabular whitespace-nowrap rounded-md bg-card px-2 py-0.5 font-mono font-semibold text-brand-ink">
                    Restzeit {formatCompactTime(syncedSec)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = mapPhaseToStep(liveStage.phaseIdx);
                    if (typeof target.stageIdx === "number") setActiveStageIdx(target.stageIdx);
                    goToStep(target.step);
                  }}
                  className="shrink-0 font-semibold text-brand-ink hover:underline"
                >
                  Zur aktuellen Etappe →
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="space-y-10"
              >
                {/* STEP 0: START & TRACK */}
                {step === "start" && (
                  <div className="space-y-9">
                    {/* Signature virtual7 Dark Keynote Hero Card */}
                    <section className="stage-atmosphere relative overflow-hidden rounded-3xl border border-[#232B20] bg-[#0B0F0A] p-6 text-[#F2F4EE] shadow-xl sm:p-9">
                      <StageBackdrop className="absolute -right-24 -top-20 h-[400px] w-[400px] opacity-65" />
                      <div className="relative z-10 space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#A9C23F]/35 bg-[#A9C23F]/15 px-3 py-1 text-xs font-semibold text-[#A9C23F]">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            virtual7 CCF Clustertag · 11:00–12:00 ·{" "}
                            <span className="whitespace-nowrap">100&nbsp;% öffentliche Daten</span>
                          </span>
                        </div>

                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                          Vom ungefilterten Chat zum{" "}
                          <span className="text-[#A9C23F]">strukturierten KI-System.</span>
                        </h1>

                        <p className="editorial-measure text-sm leading-relaxed text-[#D3DACD] sm:text-base">
                          Direkte Praxis auf Basis eurer CCF-Umfrage (n = 47): erlebe in 5 klaren
                          Etappen, wie klare Prompt-Methodik, System-Regeln, Leitplanken (Guardrails),
                          verknüpftes Nachschlagen (Markdown-RAG) und Werkzeug-Anbindung (MCP) aus
                          vagen Antworten verlässliche Ergebnisse machen.
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                          {[
                            { val: "57 %", lbl: "Prompting-Training gewünscht" },
                            { val: "62 %", lbl: "Erste Agent-Praxis heute" },
                            { val: "66 %", lbl: "Klarheit zu RAG schaffen" },
                            { val: "68", lbl: "Öffentliche Wiki-Artikel" },
                          ].map((kpi) => (
                            <div
                              key={kpi.lbl}
                              className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                            >
                              <div className="num-tabular font-display text-xl font-extrabold text-[#A9C23F] sm:text-2xl">
                                {kpi.val}
                              </div>
                              <div className="mt-0.5 text-[11px] leading-snug text-[#9FA998]">
                                {kpi.lbl}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        1 · Wähle dein Arbeitswerkzeug (gleiches Lernziel für alle)
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setTrack("A")}
                          className={`flex flex-col justify-between gap-3 rounded-2xl border p-5 text-left transition-all ${
                            track === "A"
                              ? "border-primary bg-secondary/45 ring-1 ring-primary"
                              : "bg-card hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="flex items-center gap-2 font-display text-base font-bold">
                              <Compass className="h-5 w-5 text-brand-ink" />
                              Track A · Browser &amp; Web-Chat
                            </span>
                            {track === "A" && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            ChatGPT, Claude oder Gemini im Browser. Du nutzt 1-Klick-Kopierpakete für
                            Prompts, Regeln und Starter-Artikel direkt aus dieser Web-App.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTrack("B")}
                          className={`flex flex-col justify-between gap-3 rounded-2xl border p-5 text-left transition-all ${
                            track === "B"
                              ? "border-primary bg-secondary/45 ring-1 ring-primary"
                              : "bg-card hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="flex items-center gap-2 font-display text-base font-bold">
                              <Terminal className="h-5 w-5 text-brand-ink" />
                              Track B · Terminal, IDE &amp; Agent
                            </span>
                            {track === "B" && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            Claude Code, Codex, Gemini CLI oder OpenCode. Du öffnest die drei
                            Projekt-Ordner nacheinander lokal und bindest die Werkzeug-Schnittstelle (MCP) ein.
                          </p>
                        </button>
                      </div>
                    </section>

                    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-end">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          2 · Euer Team- oder Tischname (für Beamer-Einträge)
                        </label>
                        <Input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="z. B. Tisch 1 - Polarfuchs"
                        />
                      </div>
                      <Button
                        type="button"
                        size="lg"
                        onClick={() => {
                          setChecked((prev) => ({ ...prev, "chk-setup": true }));
                          goToStep("methods");
                        }}
                      >
                        <span>Los geht’s: Prompt-Methoden</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </section>

                    <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
                      <AccordionItem value="schedule" className="border-none">
                        <AccordionTrigger className="font-display text-sm font-semibold">
                          Ablaufplan ansehen (7 Phasen · 11:00–12:00 Uhr)
                        </AccordionTrigger>
                        <AccordionContent className="divide-y pb-3">
                          {data.phases.map((p) => (
                            <div
                              key={p.id}
                              className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span className="num-tabular font-mono text-xs font-semibold text-brand-ink">
                                  {p.timeRange}
                                </span>
                                <span className="text-sm font-semibold">
                                  {p.number}. {p.title}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">{p.subtitle}</span>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* STEP 1: PROMPT METHODS & 5 ARCHITECTURE LAYERS */}
                {step === "methods" && (
                  <div className="space-y-12">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                        Schritt 02 · Prompting &amp; Steuerung
                      </div>
                      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Prompt-Methoden &amp; System-Ebenen
                      </h1>
                      <p className="editorial-measure text-sm leading-relaxed text-muted-foreground">
                        Vergleiche, wie exakt dieselbe Frage durch Methodik (Zero-Shot, CO-STAR,
                        Few-Shot, RISEN + CoT) völlig unterschiedliche Ergebnisse erzwingt.
                      </p>
                    </div>

                    <PromptMethodComparator
                      task={data.promptComparisonTask}
                      methods={data.promptMethods}
                      track={track}
                      arcticAndReefBundle={`${trackAPacks.arctic}\n\n${trackAPacks.reef}`}
                      onShareMethod={(methodName, promptTask) => {
                        setChecked((prev) => ({ ...prev, "chk-methods": true }));
                        openBeamerSheet({
                          stage: "Prompt-Labor",
                          method: methodName,
                          question: promptTask,
                        });
                      }}
                    />

                    <Separator />

                    <ArchitectureLayerStack
                      layers={data.architectureLayers}
                      primingTemplate={data.trackAPrimingTemplate}
                      track={track}
                      trackBAgentsTemplate={data.stages[1]?.agentsMd}
                    />
                  </div>
                )}

                {/* STEP 2: STAGES 1 -> 2 -> 3 & OBSIDIAN KNOWLEDGE GRAPH */}
                {step === "stages" && (
                  <div className="space-y-10">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                        Schritt 03 · Das 3-Stufen-Experiment
                      </div>
                      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Stufe 1 → Stufe 2 → Stufe 3
                      </h1>
                      <p className="editorial-measure text-sm leading-relaxed text-muted-foreground">
                        Stelle dieselben 4 Fragen nacheinander in allen drei Stufen und erlebe den
                        Unterschied zwischen Chaos, Harness und Markdown-RAG.
                      </p>
                    </div>

                    {/* Clean 3-Stage Selector */}
                    <div className="grid gap-3 md:grid-cols-3">
                      {data.stages.map((st, idx) => {
                        const isActive = idx === activeStageIdx;
                        const dotColor =
                          idx === 0
                            ? "bg-rose-500"
                            : idx === 1
                              ? "bg-amber-500"
                              : "bg-brand-lime";
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setActiveStageIdx(idx)}
                            className={`card-elevated flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                              isActive
                                ? "border-primary bg-secondary/45 ring-1 ring-primary"
                                : "bg-card hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-2 font-display text-sm font-bold">
                                <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                                {st.title.split(" · ")[0]}
                              </span>
                              <Badge variant="outline" className="text-[11px]">
                                {st.badge}
                              </Badge>
                            </div>
                            <StageMiniDiagram
                              variant={idx === 0 ? "chaos" : idx === 1 ? "harness" : "vault"}
                            />
                            <div className="text-xs font-semibold text-foreground">
                              {st.title.split(" · ")[1]}
                            </div>
                            <p className="text-xs text-muted-foreground">{st.summary}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Calm Track-Aware Execution Strip (Raw Markdown lives cleanly in Slide-Over Drawer!) */}
                    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
                          {track === "A"
                            ? `Track A · ${currentStage.title}`
                            : `Track B · cd ${currentStage.folder}`}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {track === "A"
                            ? currentStage.id === "stufe-1"
                              ? "1. Neuen Browser-Chat öffnen (noch OHNE Leitplanken!) → 2. Arktis-Artikelpaket kopieren → 3. Testfragen 1–3 stellen."
                              : currentStage.id === "stufe-2"
                                ? "1. Neuen Chat öffnen → 2. AGENTS.md als System-Regel einfügen → 3. Artikel-Paket + Testfragen 1–3 senden."
                                : "1. Neuen Chat öffnen → 2. AGENTS.md + _index.md einfügen → 3. Korallenriff-Artikel & Querverbindung (Frage 2) testen."
                            : `Öffne ${currentStage.folder}/ als Arbeitsverzeichnis in Claude Code, Codex, Gemini CLI oder OpenCode.`}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {track === "A" ? (
                          currentStage.id === "stufe-1" ? (
                            <CopyButton
                              text={trackAPacks.arctic}
                              label="Arktis-Paket kopieren"
                              variant="default"
                            />
                          ) : currentStage.id === "stufe-2" ? (
                            <CopyButton
                              text={currentStage.agentsMd}
                              label="AGENTS.md kopieren"
                              variant="default"
                            />
                          ) : (
                            <CopyButton
                              text={currentStage.indexMd || currentStage.agentsMd}
                              label="_index.md kopieren"
                              variant="default"
                            />
                          )
                        ) : (
                          <CopyButton
                            text={`cd ${currentStage.folder}`}
                            label={`cd ${currentStage.folder}`}
                            variant="default"
                          />
                        )}
                        <StageArtifactsSheet
                          stage={currentStage}
                          arcticPack={trackAPacks.arctic}
                          reefPack={trackAPacks.reef}
                          all12Pack={trackAPacks.all12}
                        />
                      </div>
                    </div>

                    {/* The 4 Verified Test Questions */}
                    <section className="space-y-4">
                      <h2 className="font-display text-lg font-bold">
                        Die 4 Testfragen (für alle 3 Stufen identisch)
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        {data.testQuestions.map((q) => {
                          const isTrackAQ4 = q.number === 4 && track === "A";
                          const displayQuestion = isTrackAQ4
                            ? "Ersetze in deinen kopierten Eisbär-Notizen im Chat kurz ‚42 Zähne‘ durch ‚38 Zähne‘ ODER ergänze im Chat-Priming eine neue Formatpflicht (z. B. 3-spaltige Risiko-Tabelle) und prüfe, ob die KI strikt deinen Vorgaben statt ihrem Vorwissen folgt."
                            : q.question;
                          const displayWatch = isTrackAQ4
                            ? "Beweist den Unterschied zwischen allgemeinem KI-Vorwissen und deinem explizit gesetzten Chat-Kontext."
                            : q.whatToWatch;
                          return (
                            <div
                              key={q.id}
                              className={`flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5 ${
                                q.number === 3 ? "border-l-4 border-l-rose-500" : ""
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex min-w-0 items-baseline gap-2">
                                    <span className="num-tabular shrink-0 font-mono text-xs font-bold text-brand-ink">
                                      0{q.number}
                                    </span>
                                    <span className="text-xs font-semibold leading-snug text-muted-foreground">
                                      {q.type}
                                    </span>
                                  </div>
                                  <CopyButton text={displayQuestion} label="Kopieren" className="shrink-0" />
                                </div>

                                <p className="text-[15px] font-medium leading-snug text-foreground">
                                  {renderInlineCode(displayQuestion)}
                                </p>

                                <p className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                                  <strong className="text-foreground">Fokus: </strong>
                                  {renderInlineCode(displayWatch)}
                                </p>
                              </div>

                              <div className="space-y-2 border-t pt-3">
                                <Accordion type="single" collapsible>
                                  <AccordionItem value="sol" className="border-none">
                                    <AccordionTrigger className="py-1 text-xs font-medium text-brand-ink">
                                      Verifizierte Lösung (nach dem Testen öffnen)
                                    </AccordionTrigger>
                                    <AccordionContent className="rounded-xl bg-secondary/40 p-3 text-xs leading-relaxed text-foreground">
                                      {renderInlineCode(q.solutionSummary)}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>

                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-xs text-brand-ink"
                                    onClick={() =>
                                      openBeamerSheet({
                                        stage:
                                          currentStage.id === "stufe-1"
                                            ? "Stufe 1"
                                            : currentStage.id === "stufe-2"
                                              ? "Stufe 2"
                                              : "Stufe 3",
                                        question: displayQuestion,
                                      })
                                    }
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>Beobachtung an Beamer</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Real Obsidian Force-Directed Knowledge Graph */}
                    <section className="space-y-3">
                      <div className="space-y-1">
                        <h2 className="font-display text-lg font-bold">
                          Warum Stufe 3 gewinnt: Der Wissens-Graph hinter dem Vault
                        </h2>
                        <p className="editorial-measure text-sm text-muted-foreground">
                          Erkunde alle 68 Artikel interaktiv — jeder Klick auf einen Knoten oder ein{" "}
                          <code>[[Wikilink]]</code> zeigt exakt, wie der Agent Beziehungen verfolgt.
                        </p>
                      </div>
                      <ObsidianKnowledgeGraph articles={data.vaultArticles} />
                    </section>
                  </div>
                )}

                {/* STEP 3: TOOLS & MCP */}
                {step === "mcp" && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                        Schritt 04 · Werkzeug-Protokoll (MCP) &amp; Live-Tests
                      </div>
                      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Werkzeuge &amp; Model Context Protocol (MCP)
                      </h1>
                      <p className="editorial-measure text-sm leading-relaxed text-muted-foreground">
                        MCP funktioniert wie ein USB-C-Anschluss für KI: Jede kompatible KI greift
                        über einheitliche Befehle direkt auf unsere 68 Artikel, den Faktencheck und
                        den Beamer zu.
                      </p>
                    </div>

                    {/* Interactive Animated 4-Node Protocol Pipeline */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { hop: 1, icon: Bot, title: "1 · KI-Oberfläche", desc: "Web-Chat, CLI oder diese App" },
                        { hop: 2, icon: Network, title: "2 · MCP-Protokoll", desc: "Einheitliches Datenformat (JSON-RPC)" },
                        { hop: 3, icon: Cpu, title: "3 · Werkzeug-Server", desc: "mcp-server/server.mjs (3 Tools)" },
                        { hop: 4, icon: Monitor, title: "4 · Wissensbasis & Beamer", desc: "Suche, Prüfung & Live-Post" },
                      ].map((node) => {
                        const Icon = node.icon;
                        const lit = mcpActiveHop === node.hop;
                        const passed = mcpActiveHop > node.hop;
                        const edgeActive =
                          mcpActiveHop === node.hop || mcpActiveHop === node.hop + 1;
                        return (
                          <div
                            key={node.hop}
                            className={`relative rounded-2xl border p-4 transition-all duration-300 ${
                              lit
                                ? "lime-glow border-brand-lime bg-secondary/80 ring-1 ring-brand-lime"
                                : passed
                                  ? "border-brand-lime/45 bg-secondary/35"
                                  : "card-elevated bg-card"
                            }`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-2 font-display text-sm font-bold">
                              <span className="flex items-center gap-2">
                                <Icon
                                  className={`h-4 w-4 ${
                                    lit || passed ? "text-brand-ink" : "text-muted-foreground"
                                  }`}
                                />
                                <span>{node.title}</span>
                              </span>
                              {lit && (
                                <span
                                  className="inline-block h-2 w-2 rounded-full bg-brand-lime animate-pulse"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{node.desc}</p>
                            {node.hop < 4 && (
                              <>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border text-[11px] font-bold transition-all lg:flex ${
                                    edgeActive
                                      ? "animate-pulse border-brand-lime bg-brand-lime text-brand-obsidian shadow-sm"
                                      : "border-border bg-background text-muted-foreground"
                                  }`}
                                >
                                  →
                                </span>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute -bottom-3 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border text-[11px] font-bold transition-all sm:hidden ${
                                    edgeActive
                                      ? "animate-pulse border-brand-lime bg-brand-lime text-brand-obsidian shadow-sm"
                                      : "border-border bg-background text-muted-foreground"
                                  }`}
                                >
                                  ↓
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Unified Interactive Tool Lab */}
                    <div className="rounded-2xl border bg-card p-4 sm:p-6">
                      <Tabs defaultValue="search" className="space-y-4">
                        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 p-1 sm:inline-flex sm:w-auto sm:flex-wrap">
                          <TabsTrigger value="search" className="justify-start gap-1.5 px-3 py-2 text-xs sm:text-sm">
                            <Wrench className="h-3.5 w-3.5 shrink-0" />
                            <span>Vault durchsuchen</span>
                            <code className="hidden text-[11px] opacity-70 sm:inline">
                              search_wildlife_vault
                            </code>
                          </TabsTrigger>
                          <TabsTrigger value="verify" className="justify-start gap-1.5 px-3 py-2 text-xs sm:text-sm">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>Fakten prüfen</span>
                            <code className="hidden text-[11px] opacity-70 sm:inline">
                              verify_claim_against_corpus
                            </code>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="space-y-4">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={mcpQuery}
                              onChange={(e) => setMcpQuery(e.target.value)}
                              placeholder="Suchbegriff eingeben…"
                            />
                            <Button type="button" onClick={() => runMcpSearch()} className="shrink-0">
                              Tool ausführen
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "Anemonenfische Symbiose",
                              "Eisbär Talg Squalen",
                              "Korallenbleiche Temperatur",
                              "Alpenmurmeltier Winterschlaf",
                              "Schneeleopard Nationalpark",
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => runMcpSearch(preset)}
                                className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs hover:bg-secondary"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          {mcpResults && (
                            <div className="divide-y rounded-xl border bg-muted/20">
                              {mcpResults.length === 0 && (
                                <div className="p-4 text-xs text-muted-foreground">
                                  Keine Treffer im 68-Artikel-Korpus gefunden (0 Treffer).
                                </div>
                              )}
                              {mcpResults.map((m) => {
                                const parsed = parseWikilink(m.wikilink, m.slug, m.title);
                                return (
                                  <div key={m.slug} className="space-y-1.5 p-3.5 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-display text-sm font-bold text-foreground">
                                          {parsed.title}
                                        </span>
                                        <Badge variant="outline" className="font-mono text-[11px] text-brand-ink">
                                          [[{parsed.slug}]]
                                        </Badge>
                                      </div>
                                      <Badge variant="outline">Relevanz {m.score}</Badge>
                                    </div>
                                    <div className="break-all font-mono text-[11px] text-muted-foreground">
                                      {m.rel_path}
                                    </div>
                                    <p className="leading-relaxed text-foreground/90">{m.snippet}</p>
                                    {m.matched_tokens && m.matched_tokens.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                          Treffer:
                                        </span>
                                        {m.matched_tokens.slice(0, 6).map((tok) => (
                                          <span
                                            key={tok}
                                            className="rounded bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                                          >
                                            {tok}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="verify" className="space-y-4">
                          <Textarea
                            value={verifyClaim}
                            onChange={(e) => setVerifyClaim(e.target.value)}
                            rows={2}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={() => runMcpVerify()}>
                              Behauptung prüfen
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                runMcpVerify(
                                  "Im Schweizerischen Nationalpark leben 45 Schneeleoparden und das Ticket kostet 25 Euro."
                                )
                              }
                            >
                              Fangfrage testen
                            </Button>
                          </div>

                          {verifyOutput && (
                            <div className="space-y-3 rounded-xl border bg-muted/25 p-4 text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={
                                    verifyOutput.status === "belegt"
                                      ? "success"
                                      : verifyOutput.status === "teilweise"
                                        ? "warning"
                                        : "danger"
                                  }
                                >
                                  {verifyOutput.status.toUpperCase()}
                                </Badge>
                                <span className="font-medium">{verifyOutput.label}</span>
                              </div>
                              {verifyOutput.evidence.length === 0 && (
                                <div className="rounded-lg border border-dashed bg-card p-3 text-muted-foreground">
                                  0 verlässliche Belege in den 68 Artikeln – korrekte System-Reaktion:
                                  Behauptung nicht bestätigen.
                                </div>
                              )}
                              {verifyOutput.evidence.map((ev) => {
                                const parsed = parseWikilink(ev.wikilink, ev.slug, ev.title);
                                return (
                                  <div key={ev.slug} className="space-y-1 rounded-lg border bg-card p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-display text-sm font-bold text-foreground">
                                        {parsed.title}
                                      </span>
                                      <Badge variant="outline" className="font-mono text-[11px] text-brand-ink">
                                        [[{parsed.slug}]]
                                      </Badge>
                                    </div>
                                    <p className="leading-relaxed text-muted-foreground">{ev.snippet}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Track B MCP Configs (Clean file targets + wrapping without awkward desktop scrollbars) */}
                    <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
                      <AccordionItem value="mcp-cfg" className="border-none">
                        <AccordionTrigger className="font-display text-sm font-semibold">
                          <span className="flex items-center gap-2 text-left">
                            <FileCode2 className="h-4 w-4 shrink-0 text-brand-ink" />
                            <span>MCP-Konfiguration für Track B anzeigen (5 Clients)</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="min-w-0 pb-4">
                          <Tabs defaultValue="claude" className="min-w-0">
                            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 overflow-visible bg-muted p-1.5">
                              <TabsTrigger value="claude" className="px-2.5 py-1 text-xs">Claude Code</TabsTrigger>
                              <TabsTrigger value="gemini" className="px-2.5 py-1 text-xs">Gemini CLI</TabsTrigger>
                              <TabsTrigger value="codex" className="px-2.5 py-1 text-xs">Codex</TabsTrigger>
                              <TabsTrigger value="vscode" className="px-2.5 py-1 text-xs">VS Code</TabsTrigger>
                              <TabsTrigger value="cli" className="px-2.5 py-1 text-xs">1-Zeiler CLI</TabsTrigger>
                            </TabsList>
                            {[
                              { id: "claude", path: ".mcp.json (im Repo-Root bereits hinterlegt)", code: data.mcpConfigs.claudeCode, wrapAll: false },
                              { id: "gemini", path: "~/.gemini/settings.json (oder .gemini/settings.json im Projekt)", code: data.mcpConfigs.geminiCli, wrapAll: false },
                              { id: "codex", path: "~/.codex/config.toml", code: data.mcpConfigs.codex, wrapAll: false },
                              { id: "vscode", path: ".vscode/mcp.json (bzw. Cursor MCP Settings)", code: data.mcpConfigs.vscodeCursor, wrapAll: false },
                              {
                                id: "cli",
                                path: "Terminal (PowerShell / Bash im Repo-Root)",
                                code: data.mcpConfigs.cliCommand.replace(
                                  /--team\s+"[^"]*"/,
                                  `--team "${(teamName.trim() || "Euer Team").replace(/"/g, "'")}"`
                                ),
                                wrapAll: true,
                              },
                            ].map((cfg) => (
                              <TabsContent key={cfg.id} value={cfg.id} className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <code className="break-all text-[11px] text-muted-foreground">
                                    Zieldatei: {cfg.path}
                                  </code>
                                  <CopyButton text={cfg.code} label="Konfig kopieren" />
                                </div>
                                <pre
                                  className={`max-w-full rounded-xl border bg-muted/40 p-3.5 font-mono text-xs ${
                                    cfg.wrapAll
                                      ? "whitespace-pre-wrap break-all"
                                      : "overflow-x-auto whitespace-pre-wrap break-words"
                                  }`}
                                >
                                  {cfg.code}
                                </pre>
                              </TabsContent>
                            ))}
                          </Tabs>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}

                {/* STEP 4: INCLUSIVE MISSIONS */}
                {step === "missions" && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                        Schritt 05 · Freie Wahl-Missionen
                      </div>
                      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Für jeden etwas: Wähle deine Bonus-Mission
                      </h1>
                      <p className="editorial-measure text-sm leading-relaxed text-muted-foreground">
                        Ob Faktenprüfung, strukturierte Daten, klares Management-Briefing oder eigenes
                        MCP-Gimmick — wählt nach Lust und Laune und schickt euer Ergebnis an den Beamer!
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {data.missions.map((m) => (
                        <div
                          key={m.id}
                          className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-brand-ink">
                                {m.tag}
                              </span>
                            </div>
                            <h3 className="font-display text-lg font-bold">{m.title}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {renderInlineCode(m.description)}
                            </p>
                            <pre className="whitespace-pre-wrap break-words rounded-xl border bg-muted/35 p-3.5 font-mono text-xs leading-relaxed">
                              {m.prompt}
                            </pre>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                            <CopyButton text={m.prompt} label="Prompt kopieren" />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-brand-ink"
                              onClick={() => {
                                setChecked((prev) => ({ ...prev, "chk-mission": true }));
                                openBeamerSheet({
                                  stage: "Wahl-Mission",
                                  method: "Frei / MCP",
                                  question: `${m.title}: ${m.description}`,
                                });
                              }}
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>An Beamer teilen</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Step Footer Navigation */}
            <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
              {prevStep ? (
                <Button type="button" variant="outline" onClick={() => goToStep(prevStep.id)}>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Zurück: {prevStep.label}</span>
                </Button>
              ) : (
                <div />
              )}
              {nextStep ? (
                <Button type="button" onClick={() => goToStep(nextStep.id)}>
                  <span>Weiter: {nextStep.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={() => openBeamerSheet()}>
                  <Send className="h-4 w-4" />
                  <span>Abschluss-Learning an Beamer senden</span>
                </Button>
              )}
            </footer>
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Step-Bar (Safe-Area Aware) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? "text-brand-ink" : "text-muted-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-lime" />
              )}
              <Icon className="h-4 w-4" />
              <span className="truncate max-w-full">{s.short}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Slide-Over Send-to-Beamer Sheet */}
      <BeamerSendSheet
        open={sendOpen}
        onOpenChange={setSendOpen}
        teamName={teamName}
        onTeamNameChange={setTeamName}
        track={track}
        prefill={sendPrefill}
        githubRepoSlug={githubRepoSlug}
        cliCommandTemplate={data.mcpConfigs.cliCommand}
        onSuccess={() => setChecked((prev) => ({ ...prev, "chk-beamer": true }))}
      />
    </div>
  );
}
