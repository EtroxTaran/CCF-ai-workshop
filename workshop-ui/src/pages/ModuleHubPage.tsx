import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  ExternalLink,
  FolderPlus,
  Layers,
  Monitor,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Virtual7Logo } from "@/components/Virtual7Logo";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DEFAULT_MODULE_ID,
  fetchCatalog,
  readModuleProgressPct,
} from "@/lib/moduleLoader";
import type { ModuleCatalog, ModuleLevel } from "@/types/workshop";

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

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const filteredModules = useMemo(() => {
    const list = catalog?.modules || [];
    if (levelFilter === "ALL") return list;
    return list.filter((m) => m.level === levelFilter);
  }, [catalog, levelFilter]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 h-14 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2.5">
            <Virtual7Logo className="h-7" />
            <span className="font-display text-sm font-bold tracking-tight text-foreground sm:text-base">
              Workshop-Hub · Modulare Themenbibliothek
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`#/m/${catalog?.defaultModuleId || DEFAULT_MODULE_ID}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-semibold hover:bg-muted"
            >
              <span>Standard-Workshop</span>
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
              Jedes Thema bringt eigene Dokumente, Testfragen, Audio-Kurzhilfen und eine eigene
              Trainer-Bühne mit — funktioniert im Browser ohne Installation sowie im Ordner oder
              Terminal.
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border bg-muted p-1 text-xs">
            {(["ALL", "L1", "L2", "L3"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
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
          <span className="text-xs text-muted-foreground">
            {filteredModules.length} aktive(s) Modul(e) verfügbar
          </span>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Active Module Grid */}
        <section className="grid gap-5 md:grid-cols-2">
          {filteredModules.map((mod) => {
            const pct = readModuleProgressPct(mod.id);
            return (
              <article
                key={mod.id}
                className="card-elevated flex flex-col justify-between gap-4 rounded-2xl border bg-card p-6"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="lime" className="font-mono text-xs font-bold">
                        {mod.level}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {mod.badge}
                      </Badge>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 text-brand-ink" />
                      <span>{mod.articleCount} Dokumente</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{mod.title}</h2>
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
                      <span className="text-muted-foreground">Dein Fortschritt in diesem Modul</span>
                      <span className="font-mono font-semibold text-brand-ink">{pct} %</span>
                    </div>
                    <Progress value={pct} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={mod.isDefault ? "#/" : `#/m/${mod.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Modul starten</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href={mod.isDefault ? "#/beamer" : `#/m/${mod.id}/beamer`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Monitor className="h-3.5 w-3.5 text-brand-ink" />
                      <span>Trainer-Bühne</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Backlog & Contribution Guide */}
        <section className="rounded-2xl border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
                <Layers className="h-3.5 w-3.5" />
                <span>Modularer Ausbau · Themen auf Wunsch</span>
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Nächste Themen-Ideen &amp; eigenes Modul beisteuern
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Jedes weitere Thema lebt als eigener 1-Ordner-Baustein unter{" "}
                <code>modules/&lt;slug&gt;/</code> (<code>node scripts/new_topic.mjs</code>) — ganz
                ohne Umbau der Oberfläche.
              </p>
            </div>
            <a
              href="https://github.com/EtroxTaran/CCF-ai-workshop/issues/new?title=Neues+Workshop-Thema:+"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-secondary/50 px-3 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <FolderPlus className="h-3.5 w-3.5 text-brand-ink" />
              <span>Thema vorschlagen</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {BACKLOG_IDEAS.map((idea) => (
              <div key={idea.title} className="rounded-xl border bg-muted/30 p-3.5 space-y-1">
                <Badge variant="outline" className="text-[10px]">
                  {idea.level} · Idee
                </Badge>
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
