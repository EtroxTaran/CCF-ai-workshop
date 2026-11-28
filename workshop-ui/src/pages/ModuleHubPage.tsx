import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  ExternalLink,
  FolderPlus,
  HelpCircle,
  Layers,
  Monitor,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Virtual7Logo } from "@/components/Virtual7Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fetchCatalog, readModuleProgressPct } from "@/lib/moduleLoader";
import type { GoalId, ModuleCatalog, ModuleCatalogEntry, ModuleLevel } from "@/types/workshop";
import { GOAL_LABELS } from "@/data/goalTracks";
import { GLOSSARY_ENTRIES } from "../data/glossary";

const BACKLOG_IDEAS = [
  {
    level: "L1–L2",
    title: "Office, Protokolle & Events mit KI",
    desc: "Einladungsmails, Protokolle und Event-Checklisten ohne erfundene Termine.",
  },
  {
    level: "L2–L3",
    title: "KI-Sicherheit & Prompt-Injection-Lab",
    desc: "Angriffsbeispiele selbst testen und System-Regeln gezielt härten.",
  },
  {
    level: "L3",
    title: "Eigene MCP-Tools & automatisierte Evals",
    desc: "Schmale Werkzeug-Verträge, Read-Only-Grenzen und Regressionstests.",
  },
];

export function ModuleHubPage() {
  const [catalog, setCatalog] = useState<ModuleCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<"ALL" | ModuleLevel>("ALL");
  const [goalFilter, setGoalFilter] = useState<"ALL" | GoalId>("ALL");
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryQuery, setGlossaryQuery] = useState("");

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const filteredModules = useMemo(() => {
    const list = catalog?.modules || [];
    return list.filter((m) => {
      if (levelFilter !== "ALL" && m.level !== levelFilter) return false;
      if (goalFilter !== "ALL" && Array.isArray(m.goals) && !m.goals.includes(goalFilter)) {
        return false;
      }
      return true;
    });
  }, [catalog, levelFilter, goalFilter]);

  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return GLOSSARY_ENTRIES;
    return GLOSSARY_ENTRIES.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.short.toLowerCase().includes(q) ||
        e.everydayExample.toLowerCase().includes(q) ||
        (e.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  }, [glossaryQuery]);

  const goalQuery = goalFilter !== "ALL" ? `?goal=${encodeURIComponent(goalFilter)}` : "";

  function launchHref(mod: ModuleCatalogEntry): string {
    const base = mod.isDefault ? "#/" : `#/m/${mod.id}`;
    return `${base}${goalQuery}`;
  }

  const moduleCountLabel =
    filteredModules.length === 0
      ? "Keine aktiven Module verfügbar"
      : filteredModules.length === 1
        ? "1 aktives Modul verfügbar"
        : `${filteredModules.length} aktive Module verfügbar`;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 min-h-14 border-b bg-background/90 py-1.5 backdrop-blur-md">
        <div className="mx-auto flex min-h-11 max-w-[1200px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <Virtual7Logo compact className="shrink-0 sm:hidden" />
            <Virtual7Logo className="hidden h-7 shrink-0 sm:block" />
            <span className="truncate font-display text-sm font-bold tracking-tight text-foreground sm:text-base">
              Workshop-Hub<span className="hidden sm:inline"> · Modulare Themenbibliothek</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 gap-1.5 whitespace-nowrap px-2.5 text-xs"
                  aria-label="Hilfe & Glossar öffnen"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-brand-ink" />
                  <span>Hilfe</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-brand-ink" />
                    <span>Hub-Hilfe, Level &amp; Glossar</span>
                  </SheetTitle>
                  <SheetDescription>
                    Orientierung zu den Leveln (L1–L3), den 4 Workshop-Zielen und den wichtigsten
                    KI-Begriffen.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-5 space-y-5 text-xs">
                  <div className="space-y-2 rounded-xl border bg-muted/35 p-3.5">
                    <div className="font-display text-sm font-bold text-foreground">
                      Welche Level gibt es?
                    </div>
                    <ul className="space-y-1.5 leading-relaxed text-muted-foreground">
                      <li>
                        <strong className="text-foreground">L1 · Einstieg:</strong> Zero-Install im
                        Browser mit 68 öffentlichen Tierwelt-Artikeln — ideal für den ersten
                        Aha-Effekt.
                      </li>
                      <li>
                        <strong className="text-foreground">L2 · Praxis &amp; Governance:</strong>{" "}
                        Vertiefung mit 10 synthetischen Projekt-, SLA- und Runbook-Dokumenten
                        (<em>Kernbank 2026</em>).
                      </li>
                      <li>
                        <strong className="text-foreground">L3 · Vertiefung (geplant):</strong>{" "}
                        Eigene MCP-Tools, Prompt-Injection-Lab und automatisierte Evals (aktuell
                        als Ideen-Vorschau im Backlog).
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2.5">
                    <div className="font-display text-sm font-bold text-foreground">
                      Glossar ({GLOSSARY_ENTRIES.length} Begriffe)
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={glossaryQuery}
                        onChange={(e) => setGlossaryQuery(e.target.value)}
                        aria-label="Glossar durchsuchen"
                        placeholder="Begriff suchen (z. B. CO-STAR, Guardrail, RAG, MCP)…"
                        className="h-8 pl-8 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      {filteredGlossary.map((entry) => (
                        <div key={entry.id} className="space-y-1 rounded-xl border bg-card p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-display text-sm font-bold text-foreground">
                              {entry.term}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {entry.category}
                            </Badge>
                          </div>
                          <p className="leading-relaxed text-muted-foreground">{entry.short}</p>
                          <p className="rounded bg-muted/60 px-2.5 py-1.5 text-[11px] text-foreground">
                            <strong>Alltag:</strong> {entry.everydayExample}
                          </p>
                        </div>
                      ))}
                      {filteredGlossary.length === 0 && (
                        <p className="py-4 text-center text-muted-foreground">
                          Kein Glossar-Eintrag für „{glossaryQuery}“ gefunden.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <a
              href={`#/${goalQuery}`}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border bg-card px-2.5 text-xs font-semibold hover:bg-muted sm:px-3"
            >
              <span className="sm:hidden">L1 starten</span>
              <span className="hidden sm:inline">L1 Standard-Workshop</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-10 px-4 py-8 sm:px-6 sm:py-10">
        {/* Hero */}
        <section className="rounded-3xl border border-[#232B20] bg-[#0B0F0A] p-6 text-[#F2F4EE] shadow-xl sm:p-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#A9C23F]/40 bg-[#A9C23F]/15 px-3 py-1 text-xs font-semibold text-[#A9C23F]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Erweiterbare Lernplattform · 100 % öffentliche / synthetische Daten</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Wähle dein Workshop-Modul
            </h1>
            <p className="text-sm leading-relaxed text-[#D3DACD] sm:text-base">
              Jedes Thema bringt eigene Dokumente, Testfragen, Kurztext-Hilfen, Ergebnis-Prüfung
              und eine eigene Trainer-Bühne mit — im Browser ohne Installation sowie in Desktop,
              IDE oder Terminal.
            </p>
          </div>
        </section>

        {/* Filter Bar + Level Legend + Goal Confirmation */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <div className="inline-flex max-w-full flex-wrap rounded-xl border bg-muted p-1 text-xs">
                {(["ALL", "L1", "L2", "L3"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    aria-pressed={levelFilter === lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                      levelFilter === lvl
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lvl === "ALL" ? "Alle Level" : lvl}
                  </button>
                ))}
              </div>

              <div className="inline-flex max-w-full flex-wrap rounded-xl border bg-muted p-1 text-xs">
                {(["ALL", "prompting", "app-building", "presentations", "everyday-ai"] as const).map(
                  (gid) => (
                    <button
                      key={gid}
                      type="button"
                      aria-pressed={goalFilter === gid}
                      onClick={() => setGoalFilter(gid)}
                      className={`rounded-lg px-2.5 py-1.5 font-semibold transition-colors ${
                        goalFilter === gid
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {gid === "ALL" ? "Alle Ziele" : GOAL_LABELS[gid]}
                    </button>
                  )
                )}
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{moduleCountLabel}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            L1 Einstieg · L2 Praxis &amp; Governance · L3 Vertiefung (geplant)
          </p>

          {goalFilter !== "ALL" && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-lime/50 bg-secondary/40 px-3.5 py-2 text-xs font-medium text-foreground"
            >
              <span>
                Gewähltes Ziel „{GOAL_LABELS[goalFilter]}“ wird beim Modulstart direkt vorausgewählt.
              </span>
              <button
                type="button"
                onClick={() => setGoalFilter("ALL")}
                className="font-semibold text-brand-ink underline-offset-2 hover:underline"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Active Module Grid */}
        <section className="grid gap-5 md:grid-cols-2">
          {filteredModules.length === 0 && !error ? (
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed bg-muted/25 p-6 md:col-span-2 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Kein aktives Modul für diese Filterauswahl
                </h2>
                <p className="text-sm text-muted-foreground">
                  Für {levelFilter === "L3" ? "Level L3 (Vertiefung)" : "diese Kombination"} gibt es
                  aktuell noch kein aktives Modul — erste Ideen stehen im Backlog weiter unten.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLevelFilter("ALL");
                  setGoalFilter("ALL");
                }}
              >
                Alle Level anzeigen
              </Button>
            </div>
          ) : (
            filteredModules.map((mod) => {
              const pct = readModuleProgressPct(mod.id, mod.checklistTotal || 6);
              return (
                <article
                  key={mod.id}
                  className="card-elevated flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="lime" className="font-mono text-xs font-bold">
                          {mod.level}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">
                          {mod.badge}
                        </Badge>
                        {mod.isDefault && (
                          <Badge variant="secondary" className="text-[11px] font-semibold">
                            Standard
                          </Badge>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-brand-ink" />
                        <span>{mod.articleCount} Dokumente</span>
                      </span>
                    </div>

                    <div>
                      {mod.domainLabel && (
                        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-brand-ink">
                          {mod.domainLabel}
                        </div>
                      )}
                      <h2 className="font-display text-xl font-bold text-foreground">
                        {mod.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {mod.subtitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                        <Clock className="h-3 w-3 text-brand-ink" />
                        {mod.durationPresets.join(" / ")} Min.
                      </span>
                      {mod.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-md border bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Dein Fortschritt in diesem Modul
                        </span>
                        <span className="font-mono font-semibold text-brand-ink">{pct} %</span>
                      </div>
                      <Progress value={pct} aria-label={`Fortschritt in ${mod.title}`} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={launchHref(mod)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Modul starten</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href={mod.isDefault ? "#/beamer" : `#/m/${mod.id}/beamer`}
                        aria-label={`Trainer-Bühne (Moderation) für ${mod.title} öffnen`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Monitor className="h-3.5 w-3.5 text-brand-ink" />
                        <span>Trainer-Bühne (Moderation)</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Backlog & Contribution Guide */}
        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                <Layers className="h-3.5 w-3.5" />
                <span>Modularer Ausbau · Themen auf Wunsch</span>
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Nächste Themen-Ideen &amp; eigenes Modul beisteuern
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Neue Themen lassen sich als eigenständige Module ergänzen — ganz ohne Umbau der
                Oberfläche.
              </p>
              <details className="rounded-xl border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-semibold text-foreground">
                  Für Trainer &amp; Mitwirkende (Technik-Hinweis)
                </summary>
                <p className="mt-1.5 leading-relaxed">
                  Jedes weitere Thema lebt als eigener 1-Ordner-Baustein unter{" "}
                  <code>modules/&lt;slug&gt;/</code> (<code>node scripts/new_topic.mjs</code>) —
                  mit eigenen Dokumenten, Testfragen und Trainer-Bühne.
                </p>
              </details>
            </div>
            <a
              href="https://github.com/EtroxTaran/CCF-ai-workshop/issues/new?title=Neues+Workshop-Thema:+"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Thema vorschlagen (GitHub · neues Tab, öffnet in neuem Tab)"
              title="Öffnet ein GitHub-Issue-Formular in einem neuen Tab"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-secondary/50 px-3 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <FolderPlus className="h-3.5 w-3.5 text-brand-ink" />
              <span>Thema vorschlagen</span>
              <span className="text-[11px] text-muted-foreground">(GitHub · neues Tab)</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {BACKLOG_IDEAS.map((idea) => (
              <div
                key={idea.title}
                className="space-y-1.5 rounded-xl border border-dashed bg-muted/20 p-3.5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {idea.level}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    Vorschau · Noch nicht verfügbar
                  </Badge>
                </div>
                <div className="text-sm font-semibold text-foreground">{idea.title}</div>
                <p className="text-xs leading-relaxed text-muted-foreground">{idea.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
