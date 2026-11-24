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
import type { StageSpec } from "@/types/workshop";

interface StageArtifactsSheetProps {
  stage: StageSpec;
  arcticPack: string;
  reefPack: string;
  all12Pack: string;
  track?: "A" | "B";
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
  arcticPack,
  reefPack,
  all12Pack,
  track = "A",
}: StageArtifactsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5" />
          <span>
            {track === "A"
              ? `Alle Texte & Regeln (${stage.skills.length + (stage.indexMd ? 2 : 1)})`
              : `Dateien & Kopierpakete (${stage.skills.length + (stage.indexMd ? 2 : 1)})`}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-[580px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{stage.title}</SheetTitle>
          <SheetDescription>
            {track === "A" ? (
              "Fertige Text-Pakete zum Kopieren sowie optional die zugehörigen KI-Regeln."
            ) : (
              <>
                Direkter Blick in <code>{stage.folder}/</code> inkl. Track-A-Kopierpaketen.
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={track === "A" ? "packs" : "agents"} className="mt-5">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1.5">
            <TabsTrigger value="packs" className="px-2.5 py-1.5 text-xs">
              Artikel-Pakete
            </TabsTrigger>
            <TabsTrigger value="agents" className="px-2.5 py-1.5 text-xs">
              {track === "A" ? "Regel-Vorlage" : "AGENTS.md"}
            </TabsTrigger>
            {stage.skills.map((sk) => (
              <TabsTrigger key={sk.name} value={sk.name} className="px-2.5 py-1.5 text-xs">
                {sk.name}
              </TabsTrigger>
            ))}
            {stage.indexMd && (
              <TabsTrigger value="index" className="px-2.5 py-1.5 text-xs">
                {track === "A" ? "Inhaltsverzeichnis" : "_index.md"}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="agents" className="space-y-3">
            <div className="flex items-center justify-between">
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
              <div className="flex items-center justify-between">
                <code className="text-xs text-muted-foreground">stufe-3-obsidian-vault/_index.md</code>
                <CopyButton text={stage.indexMd} label="_index.md kopieren" variant="default" />
              </div>
              <pre className="max-h-[60dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
                {stage.indexMd}
              </pre>
            </TabsContent>
          )}

          <TabsContent value="packs" className="space-y-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Für Web-Chats (ChatGPT, Claude, Gemini): Kopiere das passende Paket direkt in deinen Chat
              oder lade alle 12 Kern-Artikel gebündelt als <code>.md</code>-Datei herunter.
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border p-3.5">
                <div>
                  <div className="text-sm font-semibold">Paket Arktis &amp; Klima (4 Artikel)</div>
                  <div className="text-xs text-muted-foreground">
                    Für Frage 1 (Eisbär) &amp; das Prompt-Labor
                  </div>
                </div>
                <CopyButton text={arcticPack} label="Kopieren" />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3.5">
                <div>
                  <div className="text-sm font-semibold">Paket Korallenriff &amp; Symbiose (6 Artikel)</div>
                  <div className="text-xs text-muted-foreground">
                    Für Querverbindungs-Frage 2
                  </div>
                </div>
                <CopyButton text={reefPack} label="Kopieren" />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-3.5">
                <div>
                  <div className="text-sm font-semibold">Alle 12 Starter-Artikel (.md)</div>
                  <div className="text-xs text-muted-foreground">
                    Zum direkten Hochladen in Browser-Chats
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => downloadMd("starter-korpus-12-artikel.md", all12Pack)}
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
