import { useEffect, useMemo, useRef, useState } from "react";
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
import { ToolTranslationMatrix } from "@/components/guidance/ToolTranslationMatrix";
import { GLOSSARY_ENTRIES } from "@/data/glossary";
import {
  buildAllArticlesMarkdown,
  buildStarterBundleMarkdown,
  downloadMarkdownFile,
} from "@/lib/exportCorpusMd";
import type { CorpusSearchIndex, StarterArticle, ToolMode, VaultArticle } from "@/types/workshop";

export const REPO_ZIP_URL =
  "https://github.com/EtroxTaran/CCF-ai-workshop/archive/refs/heads/main.zip";

export const WEB_CHAT_LINKS = [
  { name: "ChatGPT öffnen", url: "https://chatgpt.com/", note: "Free-Tier & Canvas" },
  { name: "Claude.ai öffnen", url: "https://claude.ai/", note: "Free-Tier & Artifacts" },
  { name: "Langdock öffnen", url: "https://app.langdock.com/", note: "Enterprise-Hub · Chat & Assistants" },
  { name: "Gemini öffnen", url: "https://gemini.google.com/", note: "Google-Chat & Canvas" },
  { name: "Copilot öffnen", url: "https://copilot.microsoft.com/", note: "Microsoft Web-Chat" },
];

function buildFaqItems(articleCount: number, stage2Folder: string) {
  return [
    {
      q: "Ich weiß nicht, welches Fenster ich jetzt öffnen soll!",
      a: "Ganz einfach im Web-Chat: Lasse diese Workshop-App in Tab 1 offen und öffne in Tab 2 ChatGPT, Claude, Langdock, Gemini oder Copilot. Danach wechselst du einfach zwischen beiden Tabs hin und her.",
    },
    {
      q: "Wie nutze ich Langdock im Workshop (Chat, Assistant, Knowledge Folder & MCP)?",
      a: "Im Langdock Web-Chat startest du mit einem neuen Chat und unseren Kompakt-Paketen. Für dauerhafte Regeln legst du einen Langdock Assistant an, fügst deine Leitplanken in die Assistant Instructions ein und lädst die .md-Dateien in den Knowledge Folder. Wichtig: Cloud-Hubs wie Langdock, ChatGPT Web, Claude.ai Web und M365 Copilot können keinen lokalen stdio-MCP-Server starten — nutze dort Knowledge Folder, Remote MCP (Streamable HTTP/SSE) bzw. Integrations oder unseren Browser-Faktenprüfer.",
    },
    {
      q: "Was ist eigentlich eine .md-Datei — und muss ich die am PC öffnen?",
      a: "„.md“ steht für Markdown: eine ganz normale Textdatei (wie .txt) mit einfachen #-Überschriften. Wenn Windows fragt „Womit öffnen?“, einfach ignorieren! Du lädst sie über „+“ oder die Büroklammer (📎) direkt in deinen KI-Chat hoch.",
    },
    {
      q: "ChatGPT, Langdock oder Copilot sagt „Nachricht zu lang“ oder schneidet Text ab!",
      a: "Kein Problem: Alle unsere Kopier-Buttons bleiben ab sofort strikt bei <= 7.500 Zeichen (mit deinem Prompt ganz oben), damit nichts abgeschnitten wird. Für vollständige Originaltexte kannst du die .md-Dateien herunterladen und direkt hochladen.",
    },
    {
      q: "Wie zeige ich eine Web-App oder Präsentations-Vorschau in meinem Chat?",
      a: "In Claude aktivierst du einmal „Artifacts“; in ChatGPT klickst du auf „+“ → „Canvas“; in Gemini nutzt du „Canvas“. In Google Antigravity steht direkt eine Built-in Preview bereit. Nutzt du Microsoft Copilot oder Langdock ohne Canvas, speichere den erzeugten HTML-Code als app.html und öffne ihn per Doppelklick im Browser.",
    },
    {
      q: "Wie komme ich an die Workshop-Ordner für Desktop / IDE ohne „Git“ zu kennen?",
      a: `Klicke im Tab „Schnellstart & .md“ auf „Alle Workshop-Ordner als ZIP laden“, entpacke die ZIP-Datei (Windows: Rechtsklick → „Alle extrahieren…“, Mac: Doppelklick) und öffne danach z. B. „${stage2Folder}“ in Claude Cowork, Google Antigravity, Cursor, Windsurf oder VS Code.`,
    },
    {
      q: "Woran liegt der Unterschied zwischen Claude Cowork / IDEs und Langdock Assistants / Projects?",
      a: `Claude Cowork und Agentic IDEs (Antigravity, Cursor, Windsurf, VS Code) lesen lokale Ordner samt AGENTS.md und .agents/skills/ direkt. In Langdock Assistants, ChatGPT/Claude Projects oder Gemini Gems lädst du stattdessen „alle-${articleCount}-dokumente-wissensbasis.md“ in den Knowledge Folder hoch und fügst die Regeln in die Assistant-/Projekt-Anweisungen ein.`,
    },
    {
      q: "Ich habe gar kein eigenes KI-Abo — kann ich trotzdem alles testen?",
      a: `Ja! Kostenlose Accounts bei ChatGPT, Claude.ai, Gemini oder Copilot (sowie Langdock, falls im Unternehmen aktiv) genügen im Browser. Außerdem funktionieren der ${articleCount}-Dokumente-Faktenprüfer sowie der Output-Validator in Schritt 04 komplett lokal ohne Login.`,
    },
  ];
}

export type StageFoldersProp =
  | string[]
  | { stufe1?: string; stufe2?: string; stufe3?: string };

export function HelpFaqSheet({
  open,
  onOpenChange,
  onStartTour,
  starterArticles,
  vaultArticles,
  corpusIndex,
  onLoadCorpusIndex,
  moduleTitle = "Prompt-Werkstatt",
  zipUrl = REPO_ZIP_URL,
  stageFolders = ["stufe-1-chaos", "stufe-2-skills-guardrails", "stufe-3-obsidian-vault"],
  toolMode = "web",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  starterArticles: StarterArticle[];
  vaultArticles: VaultArticle[];
  corpusIndex?: CorpusSearchIndex;
  onLoadCorpusIndex?: () => Promise<CorpusSearchIndex>;
  moduleTitle?: string;
  zipUrl?: string;
  stageFolders?: StageFoldersProp;
  toolMode?: ToolMode;
}) {
  const [query, setQuery] = useState("");
  const launchingTourRef = useRef(false);
  const tourTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tourTimerRef.current !== null) {
        window.clearTimeout(tourTimerRef.current);
      }
    };
  }, []);

  const folderList = useMemo(() => {
    if (Array.isArray(stageFolders)) return stageFolders;
    return [
      stageFolders.stufe1 || "stufe-1-chaos",
      stageFolders.stufe2 || "stufe-2-skills-guardrails",
      stageFolders.stufe3 || "stufe-3-obsidian-vault",
    ];
  }, [stageFolders]);

  const uniqueStageFolders = useMemo(
    () => Array.from(new Set(folderList.filter(Boolean))),
    [folderList]
  );

  const stageFoldersObj = useMemo(() => {
    if (!Array.isArray(stageFolders)) return stageFolders;
    return {
      stufe1: stageFolders[0],
      stufe2: stageFolders[1],
      stufe3: stageFolders[2],
    };
  }, [stageFolders]);

  const faqItems = useMemo(
    () => buildFaqItems(vaultArticles.length, folderList[1] || folderList[0] || "stufe-2-skills-guardrails"),
    [vaultArticles.length, folderList]
  );

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
          className="min-h-[40px] gap-1 px-2.5 text-xs sm:h-9 sm:min-h-0 sm:gap-1.5 sm:px-2.5"
          aria-label="Hilfe, Glossar & FAQ öffnen"
          title="Hilfe, Glossar & FAQ öffnen"
        >
          <HelpCircle className="h-4 w-4 text-brand-ink" />
          <span className="hidden sm:inline">Hilfe</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-[560px] overflow-y-auto"
        onCloseAutoFocus={(e) => {
          if (launchingTourRef.current) {
            e.preventDefault();
            launchingTourRef.current = false;
          }
        }}
      >
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
                launchingTourRef.current = true;
                onOpenChange(false);
                if (tourTimerRef.current !== null) {
                  window.clearTimeout(tourTimerRef.current);
                }
                tourTimerRef.current = window.setTimeout(() => {
                  tourTimerRef.current = null;
                  onStartTour();
                }, 220);
              }}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Tour starten</span>
            </Button>
          </div>

          <Tabs defaultValue="quickstart" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
              <TabsTrigger value="quickstart" className="text-xs">
                Schnellstart &amp; .md
              </TabsTrigger>
              <TabsTrigger value="glossary" className="text-xs">
                Glossar ({GLOSSARY_ENTRIES.length})
              </TabsTrigger>
              <TabsTrigger value="faq" className="text-xs">
                FAQ ({faqItems.length})
              </TabsTrigger>
              <TabsTrigger value="matrix" className="text-xs">
                Tool-Matrix
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quickstart" className="space-y-4 text-xs leading-relaxed">
              <div className="space-y-1.5 rounded-xl border border-brand-lime/50 bg-secondary/35 p-4">
                <div className="font-display text-sm font-bold text-foreground">
                  Kein KI-Abo? Kostenlos starten
                </div>
                <p className="text-muted-foreground">
                  Du brauchst kein bezahltes Abo: Nutze kostenlose Browser-Konten bei{" "}
                  <strong>ChatGPT Free</strong>, <strong>Claude Free</strong>,{" "}
                  <strong>Gemini</strong> oder <strong>M365 Copilot</strong> (bzw.{" "}
                  <strong>Langdock</strong> im Unternehmens-Workspace) — und teste unseren lokalen{" "}
                  {vaultArticles.length}-Dokumente-Faktenprüfer sowie den Output-Validator in
                  Schritt 04 komplett ohne Login.
                </p>
              </div>
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
                  {starterArticles.length < vaultArticles.length && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadMarkdownFile(
                          `fokus-dokumente-${starterArticles.length}.md`,
                          buildStarterBundleMarkdown(starterArticles, moduleTitle),
                          `${starterArticles.length} Fokus-Dokumente heruntergeladen — einfach per + / 📎 im Chat anhängen!`
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{starterArticles.length} Fokus-Dokumente (.md)</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    onClick={async () => {
                      const idx = corpusIndex || (onLoadCorpusIndex ? await onLoadCorpusIndex() : {});
                      downloadMarkdownFile(
                        `alle-${vaultArticles.length}-dokumente-wissensbasis.md`,
                        buildAllArticlesMarkdown(vaultArticles, idx, moduleTitle),
                        `Alle ${vaultArticles.length} Dokumente als .md heruntergeladen — perfekt für ChatGPT/Claude Upload!`
                      );
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Alle {vaultArticles.length} Dokumente (.md)</span>
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
                    In <strong>Claude Cowork / VS Code / Cursor</strong> einen Ordner öffnen:{" "}
                    {uniqueStageFolders.map((f, idx) => (
                      <span key={f}>
                        {idx > 0 && ", "}
                        <code>{f}</code>
                      </span>
                    ))}
                    .
                  </li>
                </ol>
                <a
                  href={zipUrl}
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
                {faqItems.map((item, idx) => (
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

            <TabsContent value="matrix" className="space-y-3">
              <ToolTranslationMatrix
                activeToolMode={toolMode}
                compactCardsOnly
                stageFolders={stageFoldersObj}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
