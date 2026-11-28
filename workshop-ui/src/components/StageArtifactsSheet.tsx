import { Download, FileText } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildCompactIndex,
  compactToCharLimit,
  MAX_SAFE_CLIPBOARD_CHARS,
  sliceExpressBySlugs,
} from "@/lib/compactPacks";
import { buildAllArticlesMarkdown, downloadMarkdownFile } from "@/lib/exportCorpusMd";
import type {
  CorpusSearchIndex,
  ExpressPackage,
  StagePackSpecItem,
  StageSpec,
  ToolMode,
  VaultArticle,
} from "@/types/workshop";

interface StageArtifactsSheetProps {
  stage: StageSpec;
  expressArcticReef: ExpressPackage;
  arcticPack: string;
  reefPack: string;
  all12Pack: string;
  customPacks?: { item: StagePackSpecItem; content: string }[];
  vaultArticles?: VaultArticle[];
  corpusIndex?: CorpusSearchIndex;
  onLoadCorpusIndex?: () => Promise<CorpusSearchIndex>;
  moduleTitle?: string;
  unitLabel?: string;
  toolMode: ToolMode;
}

export function StageArtifactsSheet({
  stage,
  expressArcticReef,
  arcticPack,
  reefPack,
  all12Pack,
  customPacks,
  vaultArticles,
  corpusIndex,
  onLoadCorpusIndex,
  moduleTitle,
  unitLabel = "Artikel",
  toolMode,
}: StageArtifactsSheetProps) {
  const isWeb = toolMode === "web";
  const tabCount = stage.skills.length + (stage.indexMd ? 3 : 2);
  const starterCount =
    (all12Pack.match(/^=== .+ ===$/gm) || []).length || expressArcticReef.sources.length;
  const packList =
    customPacks && customPacks.length > 0
      ? customPacks
      : [
          {
            item: {
              id: "arctic",
              filename: "arktis-4-artikel.md",
              title: "Paket Arktis & Klima (4 Artikel)",
              subtitle: "Frage 1 & 4",
              slugs: ["arktis", "eisbaer", "ringelrobbe", "klimawandel"],
            },
            content: arcticPack,
          },
          {
            item: {
              id: "reef",
              filename: "korallenriff-6-artikel.md",
              title: "Paket Korallenriff & Symbiose (6 Artikel)",
              subtitle: "Frage 2",
              slugs: [
                "anemonenfische",
                "seeanemonen",
                "symbiose",
                "steinkorallen",
                "korallenbleiche",
                "korallenriff",
              ],
            },
            content: reefPack,
          },
        ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5" />
          <span>
            {isWeb ? `Alle Texte & Regeln (${tabCount})` : `Dateien & Pakete (${tabCount})`}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-[580px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{stage.title}</SheetTitle>
          <SheetDescription>
            {isWeb ? (
              "Kompakte Text-Pakete zum Kopieren sowie optional die zugehörigen KI-Regeln."
            ) : (
              <>
                Direkter Blick in <code>{stage.folder}/</code> inklusive Kopier-Paketen mit{" "}
                <code>(datei.md)</code>-Tags.
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={isWeb ? "packs" : "agents"} className="mt-5">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1.5">
            <TabsTrigger value="packs" className="px-2.5 py-1.5 text-xs">
              {unitLabel}-Pakete
            </TabsTrigger>
            <TabsTrigger value="agents" className="px-2.5 py-1.5 text-xs">
              Regeln (AGENTS.md)
            </TabsTrigger>
            {stage.skills.map((sk) => (
              <TabsTrigger key={sk.name} value={sk.name} className="px-2.5 py-1.5 text-xs">
                {sk.name}
              </TabsTrigger>
            ))}
            {stage.indexMd && (
              <TabsTrigger value="index" className="px-2.5 py-1.5 text-xs">
                Inhaltsverzeichnis (_index.md)
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="agents" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs text-muted-foreground">{stage.folder}/AGENTS.md</code>
              <CopyButton
                text={compactToCharLimit(stage.agentsMd, MAX_SAFE_CLIPBOARD_CHARS)}
                label="AGENTS.md kopieren"
                variant="default"
              />
            </div>
            <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
              {stage.agentsMd}
            </pre>
          </TabsContent>

          {stage.skills.map((sk) => (
            <TabsContent key={sk.name} value={sk.name} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <code className="truncate text-xs text-muted-foreground">
                  .agents/skills/{sk.name}/SKILL.md
                </code>
                <CopyButton
                  text={compactToCharLimit(sk.content, MAX_SAFE_CLIPBOARD_CHARS)}
                  label="Skill kopieren"
                  variant="default"
                />
              </div>
              <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                {sk.content}
              </pre>
            </TabsContent>
          ))}

          {stage.indexMd && (() => {
            const isLargeIndex = stage.indexMd.length > 7000;
            const indexCopyText = isLargeIndex
              ? buildCompactIndex(stage.indexMd, expressArcticReef.sources, 7000)
              : stage.indexMd;
            const approxIndexChars = Math.max(100, Math.round(indexCopyText.length / 100) * 100);
            return (
              <TabsContent value="index" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs text-muted-foreground">
                    {stage.folder}/_index.md
                  </code>
                  <div className="flex items-center gap-1.5">
                    <CopyButton
                      text={indexCopyText}
                      label={
                        isLargeIndex
                          ? `Kompakt kopieren (~${approxIndexChars.toLocaleString("de-DE")} Z.)`
                          : "_index.md kopieren"
                      }
                      variant="default"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadMarkdownFile(
                          "_index.md",
                          stage.indexMd || "",
                          "_index.md (Volltext) heruntergeladen"
                        )
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>.md</span>
                    </Button>
                  </div>
                </div>
                <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                  {stage.indexMd}
                </pre>
              </TabsContent>
            );
          })()}

          <TabsContent value="packs" className="space-y-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Für Web-Chats und schnelle Tests: Alle Pakete sind mit <code>(datei.md)</code>-Tags
              versehen oder lassen sich direkt als <code>.md</code>-Datei herunterladen.
            </p>
            <div className="space-y-2.5">
              {(() => {
                const expressCopyText = compactToCharLimit(
                  expressArcticReef.content,
                  MAX_SAFE_CLIPBOARD_CHARS
                );
                const approxExpressChars = Math.max(
                  100,
                  Math.round(expressCopyText.length / 100) * 100
                );
                return (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#A9C23F]/50 bg-secondary/35 p-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{expressArcticReef.title}</div>
                      <div className="text-xs text-muted-foreground">
                        ~{approxExpressChars.toLocaleString("de-DE")} Zeichen · alle{" "}
                        {expressArcticReef.sources.length} Fokus-Dateien
                      </div>
                    </div>
                    <CopyButton text={expressCopyText} label="Kopieren" variant="default" />
                  </div>
                );
              })()}

              {packList.map(({ item, content }) => {
                const isLargePack = content.length > 7000;
                const copyContent = isLargePack
                  ? item.slugs.length > 0
                    ? sliceExpressBySlugs(expressArcticReef.content, item.slugs, 7000)
                    : compactToCharLimit(content, 7000)
                  : content;
                const approxCopyChars = Math.max(
                  100,
                  Math.round(copyContent.length / 100) * 100
                );
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        ~{content.length.toLocaleString("de-DE")} Zeichen · {item.subtitle}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CopyButton
                        text={copyContent}
                        label={
                          isLargePack
                            ? `Kompakt kopieren (~${approxCopyChars.toLocaleString("de-DE")} Z.)`
                            : "Kopieren"
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          downloadMarkdownFile(
                            item.filename,
                            content,
                            `${item.title} (.md) heruntergeladen`
                          )
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>.md</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Fokus-Dokumente (.md)</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.max(1, Math.round(all12Pack.length / 1000)).toLocaleString("de-DE")}k Zeichen ({starterCount} Volltexte)
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    downloadMarkdownFile(
                      "fokus-dokumente.md",
                      all12Pack,
                      "Fokus-Dokumente (.md) heruntergeladen"
                    )
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Fokus (.md)</span>
                </Button>
              </div>

              {vaultArticles && vaultArticles.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-lime/40 bg-secondary/25 p-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      Gesamte Wissensbasis ({vaultArticles.length} Dokumente · .md)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Komplettdatei zum Hochladen in Claude Projects, ChatGPT oder NotebookLM
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const idx =
                        corpusIndex || (onLoadCorpusIndex ? await onLoadCorpusIndex() : {});
                      downloadMarkdownFile(
                        `alle-${vaultArticles.length}-dokumente-wissensbasis.md`,
                        buildAllArticlesMarkdown(vaultArticles, idx, moduleTitle),
                        `Alle ${vaultArticles.length} Dokumente (.md) heruntergeladen`
                      );
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Alle {vaultArticles.length} (.md)</span>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
