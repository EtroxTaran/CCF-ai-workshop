import { useMemo, useState } from "react";
import {
  Compass,
  Download,
  ExternalLink,
  FileText,
  FolderArchive,
  HelpCircle,
  Search,
} from "lucide-react";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GLOSSARY_ENTRIES } from "@/data/glossary";
import {
  buildAll68ArticlesMarkdown,
  buildStarterBundleMarkdown,
  downloadMarkdownFile,
} from "@/lib/exportCorpusMd";
import type { StarterArticle, VaultArticle } from "@/types/workshop";

export const REPO_ZIP_URL =
  "https://github.com/EtroxTaran/CCF-ai-workshop/archive/refs/heads/main.zip";

export const WEB_CHAT_LINKS = [
  { name: "Claude.ai öffnen", url: "https://claude.ai/", note: "Free-Tier & Artifacts" },
  { name: "ChatGPT öffnen", url: "https://chatgpt.com/", note: "Free-Tier & Canvas" },
  { name: "Gemini öffnen", url: "https://gemini.google.com/", note: "Google-Chat" },
  { name: "Copilot öffnen", url: "https://copilot.microsoft.com/", note: "Microsoft Web-Chat" },
];

const FAQ_ITEMS = [
  {
    q: "Ich weiß nicht, welches Fenster ich jetzt öffnen soll!",
    a: "Ganz einfach im Web-Chat: Lasse diese Workshop-App links/in Tab 1 offen und öffne in einem zweiten Browser-Tab ChatGPT (chatgpt.com) oder Claude (claude.ai). Danach springst du einfach mit Alt+Tab oder Klick zwischen beiden Tabs hin und her.",
  },
  {
    q: "Was ist eigentlich eine .md-Datei — und muss ich die am PC öffnen?",
    a: "„.md“ steht für Markdown: eine ganz normale Textdatei (wie .txt) mit einfachen #-Überschriften. Wenn Windows fragt „Womit öffnen?“, einfach ignorieren! Du öffnest die Datei gar nicht selbst, sondern lädst sie über „+“ oder die Büroklammer (📎) direkt in deinen KI-Chat hoch.",
  },
  {
    q: "ChatGPT oder Copilot sagt „Nachricht zu lang“ oder schneidet Text ab!",
    a: "Kein Problem: Unsere Buttons „Kompakt-Paket kopieren“ bleiben bewusst bei ca. 5.500 Zeichen (mit deiner Frage ganz oben), damit nichts abgeschnitten wird. Falls ein Tool doch meckert, lade stattdessen die .md-Datei über „+“ / 📎 hoch.",
  },
  {
    q: "Wie öffne ich eine interaktive Webseite (Artifacts / Canvas) in Schritt 04?",
    a: "Bei Claude schaltest du einmal in den Einstellungen „Artifacts“ ein (oder bittest im Prompt um ein HTML-Artifact). Bei ChatGPT klickst du neben dem Textfeld auf „+“ / Werkzeuge → „Canvas“ oder bittest einfach um eine „Vorschau im Canvas“.",
  },
  {
    q: "Wie komme ich an die Workshop-Ordner für Claude Cowork ohne „Git“ zu kennen?",
    a: "Klicke im Tab „Schnellstart & .md“ auf „Alle Ordner als ZIP laden“, entpacke die ZIP-Datei (Windows: Rechtsklick → „Alle extrahieren…“, Mac: Doppelklick) und wähle danach in Claude Cowork z. B. den Ordner „stufe-2-skills-guardrails“ aus.",
  },
  {
    q: "Woran liegt der Unterschied zwischen Claude Cowork und ChatGPT Projects?",
    a: "Claude Cowork (Desktop-App) kann direkt lokale Ordner auf deinem PC öffnen und AGENTS.md automatisch lesen. In ChatGPT Projects oder Claude.ai Web-Projekten lädst du stattdessen die Datei „alle-68-artikel-wissensbasis.md“ in den Projekt-Speicher hoch und fügst unsere Chat-Regeln in die Projekt-Anweisungen ein.",
  },
  {
    q: "Ich habe gar kein eigenes KI-Abo — kann ich trotzdem alles testen?",
    a: "Ja! Kostenlose Accounts bei ChatGPT, Claude.ai oder Gemini reichen im Browser völlig aus. Außerdem funktioniert der 68-Artikel-Faktenprüfer in Schritt 04 komplett ohne Konto — oder du nutzt im Terminal OpenCode mit OpenRouter.",
  },
];

export function HelpFaqSheet({
  open,
  onOpenChange,
  onStartTour,
  starterArticles,
  vaultArticles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  starterArticles: StarterArticle[];
  vaultArticles: VaultArticle[];
}) {
  const [query, setQuery] = useState("");

  const filteredGlossary = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY_ENTRIES;
    return GLOSSARY_ENTRIES.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.short.toLowerCase().includes(q) ||
        e.everydayExample.toLowerCase().includes(q) ||
        (e.aliases || []).some((a) => a.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-tour="help-trigger"
          className="h-8 gap-1 px-2 text-xs sm:h-9 sm:gap-1.5 sm:px-2.5"
          aria-label="Hilfe, Glossar & FAQ öffnen"
          title="Hilfe, Glossar & FAQ öffnen"
        >
          <HelpCircle className="h-4 w-4 text-brand-ink" />
          <span className="hidden sm:inline">Hilfe</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-ink" />
            <span>Hilfe, Glossar &amp; FAQ</span>
          </SheetTitle>
          <SheetDescription>
            Klare Antworten ohne Fachchinesisch — vom ersten Klick bis zur eigenen Mini-App.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Guided Spotlight Tour Launch */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-lime/50 bg-secondary/40 p-3">
            <div className="min-w-0 text-xs">
              <div className="font-semibold text-foreground">Neu hier? (15 Sekunden)</div>
              <div className="text-muted-foreground">
                4 kurze Hinweise direkt auf den wichtigsten Knöpfen anzeigen.
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                window.setTimeout(() => onStartTour(), 180);
              }}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Tour starten</span>
            </Button>
          </div>

          <Tabs defaultValue="quickstart" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quickstart" className="text-xs">
                Schnellstart &amp; .md
              </TabsTrigger>
              <TabsTrigger value="glossary" className="text-xs">
                Glossar ({GLOSSARY_ENTRIES.length})
              </TabsTrigger>
              <TabsTrigger value="faq" className="text-xs">
                FAQ ({FAQ_ITEMS.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quickstart" className="space-y-4 text-xs leading-relaxed">
              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                  <FileText className="h-4 w-4 text-brand-ink" />
                  <span>Was ist eigentlich eine .md-Datei?</span>
                </div>
                <p className="text-muted-foreground">
                  <strong>.md</strong> steht für <em>Markdown</em> — eine ganz normale Textdatei (wie{" "}
                  <code>.txt</code>) mit einfachen <code>#</code>-Überschriften. Du musst sie am PC
                  gar nicht öffnen: Lade sie einfach per <strong>+</strong> oder Büroklammer (📎)
                  direkt in deinen KI-Chat hoch, oder nutze unsere Kopierbuttons.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadMarkdownFile(
                        "fokus-korpus-12-artikel.md",
                        buildStarterBundleMarkdown(starterArticles),
                        "12 Fokus-Artikel heruntergeladen — einfach per + / 📎 im Chat anhängen!"
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>12 Fokus-Artikel (.md)</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={() =>
                      downloadMarkdownFile(
                        "alle-68-artikel-wissensbasis.md",
                        buildAll68ArticlesMarkdown(vaultArticles),
                        "Alle 68 Artikel als .md heruntergeladen — perfekt für ChatGPT/Claude Upload!"
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Alle 68 Artikel (.md)</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="font-display text-sm font-bold text-foreground">
                  KI-Chat im zweiten Browser-Tab öffnen
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {WEB_CHAT_LINKS.map((item) => (
                    <a
                      key={item.url}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 font-medium hover:border-primary hover:bg-secondary/40"
                    >
                      <span>
                        {item.name}
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {item.note}
                        </span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-brand-ink" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                  <FolderArchive className="h-4 w-4 text-brand-ink" />
                  <span>Workshop-Ordner ohne Git herunterladen (für Claude Cowork)</span>
                </div>
                <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
                  <li>ZIP-Archiv über den Button unten herunterladen.</li>
                  <li>
                    Entpacken (Windows: Rechtsklick → <em>„Alle extrahieren…“</em>, Mac: Doppelklick).
                  </li>
                  <li>
                    In <strong>Claude Cowork</strong> nacheinander <code>stufe-1-chaos</code>,{" "}
                    <code>stufe-2-skills-guardrails</code> oder <code>stufe-3-obsidian-vault</code>{" "}
                    als Arbeitsordner öffnen.
                  </li>
                </ol>
                <a
                  href={REPO_ZIP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Alle Workshop-Ordner als ZIP laden</span>
                </a>
              </div>
            </TabsContent>

            <TabsContent value="glossary" className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Begriff suchen (z. B. .md, CO-STAR, Guardrail, RAG)…"
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <div className="space-y-2.5">
                {filteredGlossary.map((entry) => (
                  <div key={entry.id} className="space-y-1 rounded-xl border bg-card p-3 text-xs">
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
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    Kein Glossar-Eintrag für „{query}“ gefunden.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-2">
              <Accordion type="multiple" className="space-y-2">
                {FAQ_ITEMS.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="rounded-xl border bg-card px-3.5"
                  >
                    <AccordionTrigger className="py-3 text-left text-xs font-semibold leading-snug">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 text-xs leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
