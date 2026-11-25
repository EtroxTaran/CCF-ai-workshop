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
import type { ExpressPackage, StageSpec, ToolMode } from "@/types/workshop";

interface StageArtifactsSheetProps {
  stage: StageSpec;
  expressArcticReef: ExpressPackage;
  arcticPack: string;
  reefPack: string;
  all12Pack: string;
  toolMode: ToolMode;
}

function downloadMd(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StageArtifactsSheet({
  stage,
  expressArcticReef,
  arcticPack,
  reefPack,
  all12Pack,
  toolMode,
}: StageArtifactsSheetProps) {
  const isWeb = toolMode === "web";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5" />
          <span>
            {isWeb
              ? `Alle Texte & Regeln (${stage.skills.length + (stage.indexMd ? 2 : 1)})`
              : `Dateien & Pakete (${stage.skills.length + (stage.indexMd ? 2 : 1)})`}
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
              Artikel-Pakete
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
              <CopyButton text={stage.agentsMd} label="AGENTS.md kopieren" variant="default" />
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
                <CopyButton text={sk.content} label="Skill kopieren" variant="default" />
              </div>
              <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                {sk.content}
              </pre>
            </TabsContent>
          ))}

          {stage.indexMd && (
            <TabsContent value="index" className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-muted-foreground">
                  stufe-3-obsidian-vault/_index.md
                </code>
                <CopyButton text={stage.indexMd} label="_index.md kopieren" variant="default" />
              </div>
              <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                {stage.indexMd}
              </pre>
            </TabsContent>
          )}

          <TabsContent value="packs" className="space-y-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Für Web-Chats und schnelle Tests: Alle Pakete sind mit <code>(datei.md)</code>-Tags
              versehen oder lassen sich direkt als <code>.md</code>-Datei herunterladen.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#A9C23F]/50 bg-secondary/35 p-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{expressArcticReef.title}</div>
                  <div className="text-xs text-muted-foreground">
                    ~{expressArcticReef.charCount.toLocaleString("de-DE")} Zeichen · alle 10
                    Fokus-Dateien (Arktis + Riff)
                  </div>
                </div>
                <CopyButton text={expressArcticReef.content} label="Kopieren" variant="default" />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border p-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Paket Arktis &amp; Klima (4 Artikel)</div>
                  <div className="text-xs text-muted-foreground">
                    Für Frage 1 (Eisbär) &amp; Frage 4
                  </div>
                </div>
                <CopyButton text={arcticPack} label="Kopieren" />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border p-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    Paket Korallenriff &amp; Symbiose (6 Artikel)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Für Querverbindungs-Frage 2
                  </div>
                </div>
                <CopyButton text={reefPack} label="Kopieren" />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border p-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Alle 12 Fokus-Artikel (.md)</div>
                  <div className="text-xs text-muted-foreground">
                    Zum direkten Hochladen in Web-Chats oder Projekte
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => downloadMd("fokus-korpus-12-artikel.md", all12Pack)}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Laden</span>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
