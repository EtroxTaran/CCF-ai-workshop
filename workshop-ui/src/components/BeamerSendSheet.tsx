import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FolderGit2, Send, Wrench } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { SubmissionItem } from "@/types/workshop";

export interface BeamerPrefill {
  stage?: string;
  method?: string;
  question?: string;
}

interface BeamerSendSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  onTeamNameChange: (name: string) => void;
  track: "A" | "B";
  prefill: BeamerPrefill | null;
  githubRepoSlug: string;
  cliCommandTemplate: string;
  onSuccess: () => void;
}

const STAGE_OPTIONS = ["Prompt-Labor", "Stufe 1", "Stufe 2", "Stufe 3", "Wahl-Mission"];
const METHOD_OPTIONS = ["Zero-Shot", "CO-STAR", "Few-Shot", "RISEN + CoT", "MCP / Frei"];

function defaultBeamerEndpoint(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:3777/api/submissions";
  if (window.location.protocol.startsWith("http")) {
    return `${window.location.origin}/api/submissions`;
  }
  return "http://127.0.0.1:3777/api/submissions";
}

export function BeamerSendSheet({
  open,
  onOpenChange,
  teamName,
  onTeamNameChange,
  track,
  prefill,
  githubRepoSlug,
  cliCommandTemplate,
  onSuccess,
}: BeamerSendSheetProps) {
  const [stage, setStage] = useState("Stufe 2");
  const [method, setMethod] = useState("RISEN + CoT");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [serverUrl, setServerUrl] = useState(defaultBeamerEndpoint);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<SubmissionItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!prefill) return;
    if (prefill.stage) setStage(prefill.stage);
    if (prefill.method) setMethod(prefill.method);
    if (prefill.question) setQuestion(prefill.question);
    setLastSubmitted(null);
    setErrorMsg("");
  }, [prefill]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !question.trim()) {
      setErrorMsg("Bitte gib Teamnamen und Frage oder Beobachtung ein.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    setLastSubmitted(null);

    try {
      const res = await fetch(serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team: teamName.trim(),
          track: track === "A" ? "Track A (Browser/Chat)" : "Track B (CLI/Agent)",
          stage,
          method,
          question: question.trim(),
          ai_answer: aiAnswer.trim(),
          source: "web-ui",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLastSubmitted(json.item || null);
      onSuccess();
      toast.success("Live auf den Beamer gesendet!");
    } catch {
      setErrorMsg(
        `Server unter ${serverUrl} nicht erreichbar. Prüfe die LAN-IP in den Fallback-Optionen unten oder speichere als JSON.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function downloadJson() {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const slug = teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "team";
    const obj = {
      id: `ui-${stamp}-${slug}`,
      created_at: new Date().toISOString(),
      team: teamName,
      track: track === "A" ? "Track A (Browser/Chat)" : "Track B (CLI/Agent)",
      stage,
      method,
      question,
      ai_answer: aiAnswer,
      source: "json-export",
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stamp}-${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON für live-questions/ gespeichert");
  }

  function openGithubIssue() {
    if (!githubRepoSlug) return;
    const title = encodeURIComponent(`[Workshop] ${teamName}: ${question.slice(0, 70)}`);
    const body = encodeURIComponent(
      `team: ${teamName}\ntrack: Track ${track}\nstage: ${stage}\nmethod: ${method}\n\n### Frage / Befund\n${question}\n\n### KI-Antwort\n${aiAnswer || "(keine Angabe)"}`
    );
    window.open(
      `https://github.com/${githubRepoSlug}/issues/new?labels=workshop-question&title=${title}&body=${body}`,
      "_blank"
    );
  }

  const personalizedCliCommand = cliCommandTemplate.replace(
    /--team\s+"[^"]*"/,
    `--team "${(teamName.trim() || "Euer Team").replace(/"/g, "'")}"`
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-[500px] overflow-y-auto pb-8">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-brand-ink" />
            Ergebnis auf der Raum-Leinwand teilen
          </SheetTitle>
          <SheetDescription>
            Optional: Eure Frage oder euer Aha-Moment erscheint als Karte auf der gemeinsamen
            Raum-Leinwand — dein eigener Bildschirm bleibt unverändert.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Euer Team / Tisch
            </label>
            <Input
              value={teamName}
              onChange={(e) => onTeamNameChange(e.target.value)}
              placeholder="z. B. Tisch 2 - Polarfuchs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stufe
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STAGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStage(opt)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    stage === opt
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Methode
            </label>
            <div className="flex flex-wrap gap-1.5">
              {METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMethod(opt)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    method === opt
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Testfrage oder Beobachtung
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Welche Frage oder Erkenntnis möchtet ihr teilen?"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              KI-Antwort (optional — für Live-Quellencheck)
            </label>
            <Textarea
              value={aiAnswer}
              onChange={(e) => setAiAnswer(e.target.value)}
              rows={3}
              placeholder="Fügt hier kurz die Antwort eurer KI ein…"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              {errorMsg}
            </div>
          )}

          {lastSubmitted && (
            <div className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                Auf der Beamer-Wall angekommen!
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={
                    lastSubmitted.evaluation.status === "belegt"
                      ? "success"
                      : lastSubmitted.evaluation.status === "teilweise"
                        ? "warning"
                        : lastSubmitted.evaluation.status === "notiz"
                          ? "secondary"
                          : "danger"
                  }
                >
                  {lastSubmitted.evaluation.status === "belegt"
                    ? "Im Korpus belegt"
                    : lastSubmitted.evaluation.status === "teilweise"
                      ? "Teilweise belegt"
                      : lastSubmitted.evaluation.status === "notiz"
                        ? "Workshop-Erkenntnis"
                        : "Nicht im Korpus (Fangfrage!)"}
                </Badge>
                {lastSubmitted.evaluation.evidence.slice(0, 2).map((ev) => (
                  <Badge key={ev.slug} variant="outline">
                    [[{ev.slug}]]
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            <Send className="h-4 w-4" />
            <span>{submitting ? "Wird gesendet…" : "Live an Beamer senden"}</span>
          </Button>
        </form>

        <Accordion type="single" collapsible className="mt-4 border-t pt-2">
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" />
                {track === "B"
                  ? "Erweiterte Optionen (JSON-Export, Server-URL & Track B CLI)"
                  : "Erweiterte Optionen (JSON-Export & Server-URL)"}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Raum-Server-URL
                </label>
                <Input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={downloadJson}>
                  <FolderGit2 className="h-3.5 w-3.5" />
                  <span>Als Datei speichern</span>
                </Button>
                {githubRepoSlug && (
                  <Button type="button" size="sm" variant="outline" onClick={openGithubIssue}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>GitHub Issue öffnen</span>
                  </Button>
                )}
              </div>

              {track === "B" && (
                <div className="space-y-1.5 rounded-xl border bg-muted/40 p-3 text-xs">
                  <div className="font-semibold">Direkt über Track B Agent / Terminal:</div>
                  <p className="text-[11px] text-muted-foreground">
                    Sage deinem Agenten: <code>„Nutze send_to_beamer für Team {teamName}“</code> oder:
                  </p>
                  <pre className="whitespace-pre-wrap break-all rounded border bg-card p-2 font-mono text-[11px]">
                    {personalizedCliCommand}
                  </pre>
                  <CopyButton text={personalizedCliCommand} label="CLI-Befehl kopieren" />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
