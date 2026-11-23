import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Compass,
  Cpu,
  Download,
  ExternalLink,
  FileCode2,
  FolderGit2,
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
import { CopyButton } from "@/components/CopyButton";
import { VaultExplorer } from "@/components/VaultExplorer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { EvidenceMatch, WorkshopDataset } from "@/types/workshop";

const data = rawData as unknown as WorkshopDataset;

const CHECKLIST_ITEMS = [
  { id: "chk-setup", label: "Track (A oder B) gewählt & Teamnamen notiert" },
  { id: "chk-methods", label: "Prompt-Methoden (Zero-Shot vs. CO-STAR/Few-Shot/RISEN) getestet" },
  { id: "chk-priming", label: "System-Prompt / Priming vs. User-Prompt verglichen" },
  { id: "chk-s1", label: "Stufe 1 (Chaos): Fragen 1–3 getestet & Lücken beobachtet" },
  { id: "chk-s2", label: "Stufe 2 (Harness): Guardrails & Fangfrage 3 geprüft" },
  { id: "chk-s3", label: "Stufe 3 (Vault): _index.md & [[Wikilinks]] für Frage 2 genutzt" },
  { id: "chk-mission", label: "Mindestens 1 Wahl-Mission oder MCP-Tool ausprobiert" },
  { id: "chk-beamer", label: "Frage oder Aha-Moment an den Beamer gesendet" },
];

const STORAGE_KEY = "v7-ccf-workshop-state-v1";

function downloadTextFile(filename: string, content: string, mime = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ParticipantApp() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [track, setTrack] = useState<"A" | "B">("A");
  const [teamName, setTeamName] = useState<string>("Tisch 1");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);

  // MCP Playground state
  const [mcpQuery, setMcpQuery] = useState<string>("Anemonenfische Seeanemonen Symbiose");
  const [mcpResults, setMcpResults] = useState<EvidenceMatch[] | null>(null);
  const [verifyClaim, setVerifyClaim] = useState<string>(
    "Eisbärentalg enthält kein Squalen und verhindert dadurch das Gefrieren des Fells."
  );
  const [verifyOutput, setVerifyOutput] = useState<{
    status: string;
    label: string;
    evidence: EvidenceMatch[];
  } | null>(null);

  // Send to Beamer state
  const [sendStage, setSendStage] = useState<string>("Stufe 2");
  const [sendMethod, setSendMethod] = useState<string>("RISEN + CoT");
  const [sendQuestion, setSendQuestion] = useState<string>(data.testQuestions[2].question);
  const [sendAnswer, setSendAnswer] = useState<string>("");
  const [beamerServerUrl, setBeamerServerUrl] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location.port === "3777") {
      return `${window.location.origin}/api/submissions`;
    }
    return "http://127.0.0.1:3777/api/submissions";
  });
  const [githubRepoSlug, setGithubRepoSlug] = useState<string>("");
  const [sendStatus, setSendStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Restore saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.track === "A" || parsed.track === "B") setTrack(parsed.track);
        if (typeof parsed.teamName === "string") setTeamName(parsed.teamName);
        if (parsed.checked && typeof parsed.checked === "object") setChecked(parsed.checked);
        if (typeof parsed.beamerServerUrl === "string") setBeamerServerUrl(parsed.beamerServerUrl);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ track, teamName, checked, beamerServerUrl })
      );
    } catch {
      // ignore
    }
  }, [track, teamName, checked, beamerServerUrl]);

  // Fetch optional githubRepo from server health if connected
  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((h) => {
        if (h?.githubRepo) setGithubRepoSlug(h.githubRepo);
      })
      .catch(() => {});
  }, []);

  const completedCount = useMemo(
    () => CHECKLIST_ITEMS.filter((item) => checked[item.id]).length,
    [checked]
  );
  const progressPct = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Starter packs for Track A Web-Chats
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

  async function runMcpSearch() {
    try {
      const res = await fetch("/api/tools/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mcpQuery, limit: 5 }),
      });
      if (res.ok) {
        const json = await res.json();
        setMcpResults(json.matches || []);
        return;
      }
    } catch {
      // fallback below
    }
    const qTokens = mcpQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 3);
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

  async function runMcpVerify() {
    try {
      const res = await fetch("/api/tools/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: verifyClaim }),
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
      // client fallback
    }
    const tokens = verifyClaim
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
          ? "Starke Übereinstimmung im lokalen Starter-Korpus."
          : "Keine eindeutigen Belege gefunden (ggf. voller Korpus auf dem Beamer-Server).",
      evidence: hits,
    });
  }

  async function submitToBeamer(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !sendQuestion.trim()) {
      setSendStatus({ ok: false, msg: "Bitte gib Teamnamen und Frage/Befund ein." });
      return;
    }
    setIsSending(true);
    setSendStatus(null);
    const payload = {
      team: teamName.trim(),
      track: track === "A" ? "Track A (Browser/Chat)" : "Track B (CLI/Agent)",
      stage: sendStage,
      method: sendMethod,
      question: sendQuestion.trim(),
      ai_answer: sendAnswer.trim(),
      source: "web-ui",
    };

    try {
      const res = await fetch(beamerServerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setChecked((prev) => ({ ...prev, "chk-beamer": true }));
      setSendStatus({
        ok: true,
        msg: "Erfolgreich an die Beamer-Leinwand gesendet! Der Prüfmechanismus wertet deine Frage live aus.",
      });
    } catch {
      setSendStatus({
        ok: false,
        msg: `Server unter ${beamerServerUrl} nicht direkt erreichbar. Nutze unten „Als JSON herunterladen“ (für live-questions/) oder „Als GitHub Issue senden“, oder trage die LAN-IP des Trainers ein.`,
      });
    } finally {
      setIsSending(false);
    }
  }

  function downloadSubmissionJson() {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "team";
    const obj = {
      id: `ui-${stamp}-${slug}`,
      created_at: new Date().toISOString(),
      team: teamName,
      track: track === "A" ? "Track A (Browser/Chat)" : "Track B (CLI/Agent)",
      stage: sendStage,
      method: sendMethod,
      question: sendQuestion,
      ai_answer: sendAnswer,
      source: "json-export",
    };
    downloadTextFile(`${stamp}-${slug}.json`, JSON.stringify(obj, null, 2), "application/json;charset=utf-8");
  }

  function openGithubIssue() {
    const repo = githubRepoSlug || "OWNER/REPO";
    const title = encodeURIComponent(`[Workshop] ${teamName}: ${sendQuestion.slice(0, 70)}`);
    const body = encodeURIComponent(
      `team: ${teamName}\ntrack: Track ${track}\nstage: ${sendStage}\nmethod: ${sendMethod}\n\n### Frage / Befund\n${sendQuestion}\n\n### KI-Antwort / Beobachtung\n${sendAnswer || "(keine Angabe)"}`
    );
    window.open(`https://github.com/${repo}/issues/new?labels=workshop-question&title=${title}&body=${body}`, "_blank");
  }

  const currentStage = data.stages[activeStageIdx];

  return (
    <div className="min-h-screen bg-background">
      {/* Top virtual7 Navigation & Progress Bar */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-v7-green text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight sm:text-lg">
                  {data.meta.title}
                </h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {data.meta.timeSlot}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.meta.cluster} · {data.meta.presenter} · {data.meta.articleCount} öffentliche Artikel
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Track Switcher */}
            <div className="inline-flex items-center rounded-lg border bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTrack("A")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                  track === "A" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Compass className="h-3.5 w-3.5 text-v7-greenDark" />
                Track A · Browser/Chat
              </button>
              <button
                type="button"
                onClick={() => setTrack("B")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors ${
                  track === "B" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-v7-greenDark" />
                Track B · CLI/Agent
              </button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setActiveTab("beamer-send")}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>An Beamer senden</span>
            </Button>

            <a
              href="/beamer"
              className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Beamer-Ansicht öffnen"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Beamer</span>
            </a>
          </div>
        </div>

        {/* Live Progress Strip */}
        <div className="border-t bg-muted/40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs">
            <div className="flex min-w-[220px] flex-1 items-center gap-3">
              <span className="font-semibold text-v7-charcoal dark:text-foreground">
                Fortschritt: {completedCount}/{CHECKLIST_ITEMS.length} ({progressPct}%)
              </span>
              <Progress value={progressPct} className="max-w-xs" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Team:</span>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="h-7 w-36 text-xs"
                aria-label="Teamname"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs">
                    Checkliste ({completedCount}/{CHECKLIST_ITEMS.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Euer Workshop-Fortschritt</DialogTitle>
                    <DialogDescription>
                      Hakt erledigte Etappen ab – wird lokal in eurem Browser gespeichert.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2.5 pt-2">
                    {CHECKLIST_ITEMS.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 text-sm hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={!!checked[item.id]}
                          onCheckedChange={() => toggleCheck(item.id)}
                        />
                        <span className={checked[item.id] ? "line-through text-muted-foreground" : ""}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Tabs */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">0 · Start & Checkliste</TabsTrigger>
            <TabsTrigger value="methods">1 · Prompt-Methoden & Priming</TabsTrigger>
            <TabsTrigger value="stages">2 · Stufen 1 → 2 → 3</TabsTrigger>
            <TabsTrigger value="mcp">3 · Tools & MCP</TabsTrigger>
            <TabsTrigger value="missions">4 · Wahl-Missionen</TabsTrigger>
            <TabsTrigger value="beamer-send">5 · An Beamer senden</TabsTrigger>
          </TabsList>

          {/* TAB 0: OVERVIEW */}
          <TabsContent value="overview" className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-v7-green/50 lg:col-span-2">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      virtual7 KI-Richtlinie konform
                    </Badge>
                    <Badge variant="outline">68 öffentliche Wikipedia-Artikel</Badge>
                  </div>
                  <CardTitle className="text-xl">
                    Worum geht es in den nächsten 60 Minuten?
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Im Vormittagsblock haben wir gesehen: <strong>57 %</strong> im Cluster wünschen sich
                    Prompt-Training, <strong>62 %</strong> haben noch keine Agent-Erfahrung und{" "}
                    <strong>66 %</strong> wünschen sich Klarheit zu RAG. Genau diese Lücke schließen wir jetzt
                    praktisch – mit <strong>einer gemeinsamen Wissensbasis</strong> aus Tierwelt &amp; Ökosystemen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div
                    onClick={() => setTrack("A")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      track === "A" ? "border-primary bg-secondary/40 ring-1 ring-primary" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Compass className="h-4 w-4 text-v7-greenDark" />
                        Track A · Browser &amp; Web-Chat
                      </span>
                      {track === "A" && <Badge>Aktiv</Badge>}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Ideal für ChatGPT, Claude oder Gemini im Browser: Du kopierst Prompts,
                      System-Regeln und kompakte Artikel-Pakete mit einem Klick aus dieser Oberfläche.
                    </p>
                  </div>

                  <div
                    onClick={() => setTrack("B")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      track === "B" ? "border-primary bg-secondary/40 ring-1 ring-primary" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Terminal className="h-4 w-4 text-v7-greenDark" />
                        Track B · Terminal, IDE &amp; Agent
                      </span>
                      {track === "B" && <Badge>Aktiv</Badge>}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Ideal für Claude Code, Codex, Gemini CLI oder OpenCode: Du öffnest die drei
                      Projekt-Ordner nacheinander direkt im Repository und testest MCP-Tools.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Checklist */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-v7-greenDark" />
                    Euer roter Faden
                  </CardTitle>
                  <CardDescription>Hakt jeden Schritt ab, sobald ihr ihn erlebt habt.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {CHECKLIST_ITEMS.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-muted/20 p-2 text-xs hover:bg-muted/50"
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
                </CardContent>
              </Card>
            </div>

            {/* 7-Phase Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ablauf (11:00–12:00 Uhr)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {data.phases.map((p) => (
                  <div key={p.id} className="rounded-xl border bg-card p-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <Badge variant="outline">{p.timeRange}</Badge>
                      <span className="font-medium text-muted-foreground">{p.durationMin} Min.</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {p.number}. {p.title}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.subtitle}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setActiveTab("methods")} className="gap-2">
                <span>Weiter zu Schritt 1: Prompt-Methoden &amp; Priming</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* TAB 1: PROMPT METHODS & PRIMING */}
          <TabsContent value="methods" className="space-y-6">
            <Card className="border-v7-green/40 bg-secondary/20">
              <CardHeader>
                <CardTitle className="text-lg">
                  1 Aufgabe – 4 Schreibweisen: Warum Prompt-Struktur die Antwort komplett verändert
                </CardTitle>
                <CardDescription>
                  Gleiche Aufgabe: <strong>„{data.promptComparisonTask}“</strong> — kopiere zwei bis vier
                  Varianten nacheinander in deinen Chat oder Agenten und vergleiche Qualität, Format und
                  Quellentreue.
                </CardDescription>
              </CardHeader>
              {track === "A" && (
                <CardContent className="flex flex-wrap items-center gap-2 pt-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    Für Track A direkt die passenden Klimawandel-Dateien mitkopieren:
                  </span>
                  <CopyButton
                    text={`${trackAPacks.arctic}\n\n${trackAPacks.reef}`}
                    label="Kontext-Dateien (Arktis + Korallen) kopieren"
                    variant="secondary"
                  />
                </CardContent>
              )}
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {data.promptMethods.map((m) => (
                <Card key={m.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">{m.name}</CardTitle>
                      <Badge variant="secondary">{m.badge}</Badge>
                    </div>
                    <CardDescription>{m.bestFor}</CardDescription>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.components.map((c) => (
                        <Badge key={c} variant="outline" className="text-[11px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-3">
                    <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                      {m.prompt}
                    </pre>
                    <div className="space-y-1 text-xs">
                      <div>
                        <strong className="text-emerald-700 dark:text-emerald-400">Stärke:</strong> {m.strength}
                      </div>
                      <div>
                        <strong className="text-amber-700 dark:text-amber-400">Grenze:</strong> {m.risk}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <CopyButton text={m.prompt} label="Prompt kopieren" />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSendMethod(m.name);
                          setSendQuestion(data.promptComparisonTask);
                          setActiveTab("beamer-send");
                        }}
                      >
                        Ergebnis teilen →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* System Prompt vs Priming vs User Prompt vs Harness vs MCP */}
            <div className="space-y-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Layers className="h-5 w-5 text-v7-greenDark" />
                  Vom User-Prompt zum KI-System: Was ist Priming, System-Prompt, Harness &amp; MCP?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ob Web-Chat (Track A) oder Coding-Agent (Track B) – darunter stecken exakt dieselben 5
                  Steuerungs-Ebenen:
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                {data.architectureLayers.map((layer) => (
                  <Card key={layer.layer} className="bg-card">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm">{layer.layer}</CardTitle>
                      <CardDescription className="text-xs font-medium text-v7-greenDark">
                        {layer.analogy}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4 pt-0 text-xs text-muted-foreground">
                      <div>
                        <strong>Lebensdauer:</strong> {layer.persistence}
                      </div>
                      <div>
                        <strong>Durchsetzung:</strong> {layer.authority}
                      </div>
                      <div className="rounded bg-muted p-2 text-[11px] text-foreground">{layer.example}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      Sofort-Vorlage: Priming / System-Regel für deinen Browser-Chat (Track A)
                    </CardTitle>
                    <CopyButton text={data.trackAPrimingTemplate} label="Priming kopieren" />
                  </div>
                  <CardDescription>
                    In Track B liegt das Äquivalent automatisch als <code>AGENTS.md</code> bzw.{" "}
                    <code>CLAUDE.md</code> im Projektordner. Im Web-Chat fügst du es als erste Nachricht
                    (Priming) oder Custom Instruction ein.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                    {data.trackAPrimingTemplate}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: STAGES 1 -> 2 -> 3 */}
          <TabsContent value="stages" className="space-y-6">
            {/* Stage Picker */}
            <div className="grid gap-3 md:grid-cols-3">
              {data.stages.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStageIdx(idx)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    activeStageIdx === idx
                      ? "border-primary bg-secondary/40 ring-1 ring-primary"
                      : "bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-semibold">{st.title}</span>
                    <Badge variant={activeStageIdx === idx ? "default" : "outline"}>{st.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{st.summary}</p>
                </button>
              ))}
            </div>

            {/* Active Stage Execution Guide */}
            <Card className="border-v7-green/40">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{currentStage.title}</CardTitle>
                    <CardDescription>
                      Ordner im Repository: <code className="rounded bg-muted px-1.5 py-0.5">{currentStage.folder}/</code>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {track === "A" ? "Anleitung für Track A (Browser/Chat)" : "Anleitung für Track B (CLI/Agent)"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {track === "A" ? (
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                    <div className="text-sm font-semibold">
                      Track A: So simulierst du {currentStage.title} im Web-Chat
                    </div>
                    <p className="text-xs text-muted-foreground">
                      1. Starte einen <strong>neuen Chat</strong> (wichtig, damit alte Regeln nicht nachwirken).
                      <br />
                      2. Kopiere die System-Anweisung (<code>AGENTS.md</code>) und ggf. die Skills in den Chat.
                      <br />
                      3. Kopiere das passende Artikel-Paket (oder lade Dateien aus <code>{currentStage.folder}/docs/</code> hoch)
                      und stelle die 4 Testfragen unten.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <CopyButton text={currentStage.agentsMd} label="AGENTS.md kopieren" variant="default" />
                      {currentStage.skills.map((sk) => (
                        <CopyButton
                          key={sk.name}
                          text={sk.content}
                          label={`Skill „${sk.name}“ kopieren`}
                          variant="secondary"
                        />
                      ))}
                      {currentStage.indexMd && (
                        <CopyButton
                          text={currentStage.indexMd}
                          label="_index.md (MOC) kopieren"
                          variant="secondary"
                        />
                      )}
                      <CopyButton text={trackAPacks.arctic} label="Paket Arktis (4 Dateien)" />
                      <CopyButton text={trackAPacks.reef} label="Paket Korallenriff (6 Dateien)" />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => downloadTextFile("starter-korpus-12-artikel.md", trackAPacks.all12)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>12 Starter-Artikel (.md) laden</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                    <div className="text-sm font-semibold">
                      Track B: So arbeitest du in {currentStage.folder}/ mit deinem CLI/IDE-Agenten
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Öffne genau diesen Unterordner als Arbeitsverzeichnis in Claude Code, Codex, Gemini CLI
                      oder OpenCode (damit nur die dortige <code>AGENTS.md</code> / <code>CLAUDE.md</code> gilt):
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-md border bg-card px-3 py-1.5 font-mono text-xs">
                        cd {currentStage.folder}
                      </code>
                      <CopyButton text={`cd ${currentStage.folder}`} label="cd-Befehl kopieren" />
                      <CopyButton text={currentStage.trackBPrompt} label="Starter-Prompt kopieren" variant="secondary" />
                    </div>
                  </div>
                )}

                <Accordion type="single" collapsible>
                  <AccordionItem value="agents-preview">
                    <AccordionTrigger>
                      Inhalt ansehen: {currentStage.folder}/AGENTS.md &amp; Skills ({currentStage.skills.length})
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                        {currentStage.agentsMd}
                      </pre>
                      {currentStage.skills.map((sk) => (
                        <div key={sk.name}>
                          <div className="mb-1 text-xs font-semibold">
                            .agents/skills/{sk.name}/SKILL.md
                          </div>
                          <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                            {sk.content}
                          </pre>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* The 4 Test Questions */}
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <BookOpen className="h-5 w-5 text-v7-greenDark" />
                Die 4 Testfragen (für alle 3 Stufen identisch!)
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {data.testQuestions.map((q) => (
                  <Card key={q.id} className="flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={q.number === 3 ? "warning" : "secondary"}>
                          Frage {q.number} · {q.type}
                        </Badge>
                        <CopyButton text={q.question} label="Frage kopieren" />
                      </div>
                      <CardTitle className="pt-1 text-sm leading-snug">{q.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="rounded-lg bg-muted/40 p-2.5 text-muted-foreground">
                        <strong>Worauf achten?</strong> {q.whatToWatch}
                      </div>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="sol" className="border-none">
                          <AccordionTrigger className="py-1.5 text-xs text-v7-greenDark">
                            Verifizierte Musterlösung anzeigen (erst nach dem Testen öffnen)
                          </AccordionTrigger>
                          <AccordionContent className="rounded-lg border bg-secondary/30 p-2.5 text-xs leading-relaxed">
                            {q.solutionSummary}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSendStage(currentStage.id === "stufe-1" ? "Stufe 1" : currentStage.id === "stufe-2" ? "Stufe 2" : "Stufe 3");
                            setSendQuestion(q.question);
                            setActiveTab("beamer-send");
                          }}
                        >
                          Beobachtung an Beamer senden →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Interactive Vault Explorer */}
            <VaultExplorer articles={data.vaultArticles} />
          </TabsContent>

          {/* TAB 3: TOOLS & MCP */}
          <TabsContent value="mcp" className="space-y-6">
            <Card className="border-v7-green/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plug className="h-5 w-5 text-v7-greenDark" />
                  Wie Tools &amp; MCP (Model Context Protocol) die KI mit der Außenwelt verbinden
                </CardTitle>
                <CardDescription>
                  Mit MCP spricht jede kompatible KI über einen einheitlichen Standard direkt mit Werkzeugen,
                  Datenbanken oder unserem Beamer – ohne individuellen Klebecode pro Modell.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Bot className="h-4 w-4 text-v7-greenDark" />
                      1. KI-Host (Chat/CLI)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Claude, Codex, Gemini CLI, VS Code oder Langdock-Client erkennt verfügbare Tools.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Network className="h-4 w-4 text-v7-greenDark" />
                      2. MCP-Protokoll
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Standardisiertes JSON-RPC (stdio / HTTP): Übergibt Tool-Namen, Schema und Parameter.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Cpu className="h-4 w-4 text-v7-greenDark" />
                      3. Workshop-MCP-Server
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <code>mcp-server/server.mjs</code> stellt 3 Live-Tools ohne Fremdpakete bereit.
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Monitor className="h-4 w-4 text-v7-greenDark" />
                      4. Daten &amp; Beamer-Aktion
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vault-Suche, Fakten-Gegenprüfung und Live-Zustellung an <code>/beamer</code>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Browser Playground for the 3 MCP Tools */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="h-4 w-4 text-v7-greenDark" />
                    Live-Tool-Test 1: <code>search_wildlife_vault</code>
                  </CardTitle>
                  <CardDescription>
                    Probiere direkt im Browser aus, was das MCP-Tool der KI als strukturierten Kontext liefert.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={mcpQuery}
                      onChange={(e) => setMcpQuery(e.target.value)}
                      placeholder="Suchbegriff eingeben..."
                    />
                    <Button type="button" onClick={runMcpSearch}>
                      Ausführen
                    </Button>
                  </div>
                  {mcpResults && (
                    <ScrollArea className="h-56 rounded-lg border bg-muted/20 p-2.5">
                      <div className="space-y-2">
                        {mcpResults.length === 0 && (
                          <div className="text-xs text-muted-foreground">Keine Treffer gefunden.</div>
                        )}
                        {mcpResults.map((m) => (
                          <div key={m.slug} className="rounded-lg border bg-card p-2.5 text-xs">
                            <div className="flex items-center justify-between font-semibold">
                              <span>{m.wikilink}</span>
                              <Badge variant="outline">Score {m.score}</Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{m.rel_path}</div>
                            <p className="mt-1 text-muted-foreground">{m.snippet}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-4 w-4 text-v7-greenDark" />
                    Live-Tool-Test 2: <code>verify_claim_against_corpus</code>
                  </CardTitle>
                  <CardDescription>
                    Prüfe eine Behauptung oder Fangfrage gegen alle lokalen Vault-Artikel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={verifyClaim}
                    onChange={(e) => setVerifyClaim(e.target.value)}
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={runMcpVerify}>
                      Behauptung prüfen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVerifyClaim(
                          "Im Schweizerischen Nationalpark leben 45 Schneeleoparden und das Ticket kostet 25 Euro."
                        )
                      }
                    >
                      Fangfrage testen
                    </Button>
                  </div>
                  {verifyOutput && (
                    <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-xs">
                      <div className="flex items-center gap-2">
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
                        <span>{verifyOutput.label}</span>
                      </div>
                      {verifyOutput.evidence.map((ev) => (
                        <div key={ev.slug} className="rounded border bg-card p-2">
                          <div className="font-semibold">{ev.wikilink}</div>
                          <p className="text-muted-foreground">{ev.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Config snippets for Track B */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCode2 className="h-4 w-4 text-v7-greenDark" />
                  MCP-Konfiguration zum Mitnehmen (Track B &amp; CLI-Schnelltest)
                </CardTitle>
                <CardDescription>
                  Im Repository-Root liegt bereits <code>.mcp.json</code> – Claude Code erkennt den Server
                  sofort. Weitere Clients:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="claude">
                  <TabsList>
                    <TabsTrigger value="claude">Claude Code</TabsTrigger>
                    <TabsTrigger value="gemini">Gemini CLI</TabsTrigger>
                    <TabsTrigger value="codex">Codex</TabsTrigger>
                    <TabsTrigger value="vscode">VS Code / Cursor</TabsTrigger>
                    <TabsTrigger value="cli">1-Zeiler CLI</TabsTrigger>
                  </TabsList>
                  <TabsContent value="claude" className="space-y-2">
                    <div className="flex justify-end">
                      <CopyButton text={data.mcpConfigs.claudeCode} />
                    </div>
                    <pre className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{data.mcpConfigs.claudeCode}</pre>
                  </TabsContent>
                  <TabsContent value="gemini" className="space-y-2">
                    <div className="flex justify-end">
                      <CopyButton text={data.mcpConfigs.geminiCli} />
                    </div>
                    <pre className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{data.mcpConfigs.geminiCli}</pre>
                  </TabsContent>
                  <TabsContent value="codex" className="space-y-2">
                    <div className="flex justify-end">
                      <CopyButton text={data.mcpConfigs.codex} />
                    </div>
                    <pre className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{data.mcpConfigs.codex}</pre>
                  </TabsContent>
                  <TabsContent value="vscode" className="space-y-2">
                    <div className="flex justify-end">
                      <CopyButton text={data.mcpConfigs.vscodeCursor} />
                    </div>
                    <pre className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{data.mcpConfigs.vscodeCursor}</pre>
                  </TabsContent>
                  <TabsContent value="cli" className="space-y-2">
                    <div className="flex justify-end">
                      <CopyButton text={data.mcpConfigs.cliCommand} />
                    </div>
                    <pre className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">{data.mcpConfigs.cliCommand}</pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: INCLUSIVE MISSIONS */}
          <TabsContent value="missions" className="space-y-5">
            <Card className="border-v7-green/40">
              <CardHeader>
                <CardTitle className="text-lg">Freie Wahl-Missionen: Für jeden etwas</CardTitle>
                <CardDescription>
                  Ob Faktenprüfung, strukturierte Daten, klares Management-Briefing oder eigenes MCP-Experiment
                  – wählt das Szenario, das euch am meisten Spaß macht!
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {data.missions.map((m) => (
                <Card key={m.id} className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{m.title}</CardTitle>
                      <Badge variant="secondary">{m.tag}</Badge>
                    </div>
                    <CardDescription>{m.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                      {m.prompt}
                    </pre>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CopyButton text={m.prompt} label="Missions-Prompt kopieren" />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setChecked((prev) => ({ ...prev, "chk-mission": true }));
                          setSendQuestion(m.title + ": " + m.description);
                          setActiveTab("beamer-send");
                        }}
                      >
                        Ergebnis an Beamer →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 5: SEND TO BEAMER */}
          <TabsContent value="beamer-send" className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Send className="h-5 w-5 text-v7-greenDark" />
                    Frage oder Aha-Moment live auf die Beamer-Leinwand senden
                  </CardTitle>
                  <CardDescription>
                    Dein Beitrag landet im Live-Feed auf <code>/beamer</code> und wird vom Prüfmechanismus
                    automatisch gegen alle 68 Artikel gecheckt.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitToBeamer} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Euer Team / Name</label>
                        <Input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="z. B. Tisch 2 - Polarfuchs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Projekt-Stufe</label>
                        <select
                          value={sendStage}
                          onChange={(e) => setSendStage(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option>Prompt-Labor</option>
                          <option>Stufe 1</option>
                          <option>Stufe 2</option>
                          <option>Stufe 3</option>
                          <option>Wahl-Mission / MCP</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Prompt-Methode</label>
                        <select
                          value={sendMethod}
                          onChange={(e) => setSendMethod(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option>Zero-Shot</option>
                          <option>CO-STAR</option>
                          <option>Few-Shot</option>
                          <option>RISEN + CoT</option>
                          <option>Frei / MCP</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">Eure Testfrage oder Beobachtung</label>
                      <Textarea
                        value={sendQuestion}
                        onChange={(e) => setSendQuestion(e.target.value)}
                        rows={3}
                        placeholder="Welche Frage habt ihr getestet?"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium">
                        KI-Antwort oder Aha-Moment (optional – wird auf Quellen &amp; Guardrails geprüft)
                      </label>
                      <Textarea
                        value={sendAnswer}
                        onChange={(e) => setSendAnswer(e.target.value)}
                        rows={3}
                        placeholder="Was hat eure KI geantwortet? Hat sie halluziniert oder sauber abgelehnt?"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Beamer-Server-URL (Standard: aktueller Host bzw. Trainer-IP im WLAN)
                      </label>
                      <Input
                        value={beamerServerUrl}
                        onChange={(e) => setBeamerServerUrl(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>

                    {sendStatus && (
                      <div
                        className={`rounded-lg border p-3 text-sm ${
                          sendStatus.ok
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                            : "border-amber-300 bg-amber-50 text-amber-900"
                        }`}
                      >
                        {sendStatus.msg}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={isSending}>
                        <Send className="h-4 w-4" />
                        <span>{isSending ? "Sende..." : "Live an Beamer senden"}</span>
                      </Button>
                      <Button type="button" variant="outline" onClick={downloadSubmissionJson}>
                        <FolderGit2 className="h-4 w-4" />
                        <span>Als JSON für live-questions/ speichern</span>
                      </Button>
                      <Button type="button" variant="outline" onClick={openGithubIssue}>
                        <ExternalLink className="h-4 w-4" />
                        <span>Als GitHub Issue öffnen</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Für Agent-Fans (Track B / MCP)</CardTitle>
                  <CardDescription>
                    Du kannst deiner KI auch direkt im Chat oder Terminal sagen:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="rounded-lg border bg-muted/40 p-3 font-medium">
                    „Stell folgende Frage über das MCP-Tool <code>send_to_beamer</code> auf den Beamer und
                    merke dir unser Team!“
                  </div>
                  <CopyButton
                    text={`Nutze das MCP-Tool send_to_beamer mit team="${teamName}", stage="${sendStage}", method="${sendMethod}" und question="${sendQuestion}".`}
                    label="Agent-Auftrag kopieren"
                  />
                  <Separator />
                  <div className="text-muted-foreground">
                    Oder klassisch per CLI (ohne MCP-Setup):
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-2.5 font-mono text-[11px]">
                    {data.mcpConfigs.cliCommand}
                  </pre>
                  <CopyButton text={data.mcpConfigs.cliCommand} label="CLI-Befehl kopieren" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
