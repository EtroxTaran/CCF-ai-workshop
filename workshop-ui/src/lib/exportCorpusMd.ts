import { toast } from "sonner";
import type { CorpusSearchIndex, StarterArticle, VaultArticle } from "@/types/workshop";

export function downloadMarkdownFile(filename: string, content: string, description?: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(description || `${filename} heruntergeladen — jetzt per „+“ oder 📎 im Chat hochladen.`);
}

export function buildAllArticlesMarkdown(
  vaultArticles: VaultArticle[],
  corpusIndex: CorpusSearchIndex = {},
  moduleTitle = "Prompt-Werkstatt · Gesamte Wissensbasis"
): string {
  const header = [
    `# ${moduleTitle} (${vaultArticles.length} Dokumente)`,
    "",
    "> Hinweis: 100 % öffentliche / synthetische Klartext-Dokumente zum Hochladen in Web-Chats oder Projekte.",
    "",
  ].join("\n");

  const sections = vaultArticles.map((art) => {
    const body = corpusIndex[art.slug] || art.summary;
    const grp = art.group || art.habitat || "Allgemein";
    return `=== ${art.slug}.md · ${art.title} ===\nKategorie: ${art.category} | Bereich: ${grp}\n\n# ${art.title}\n\n${body}\n\n[Quelle: ${art.slug}.md]`;
  });

  return `${header}${sections.join("\n\n---\n\n")}\n`;
}

/** Backwards-compatible alias */
export function buildAll68ArticlesMarkdown(
  vaultArticles: VaultArticle[],
  corpusIndex: CorpusSearchIndex = {},
  moduleTitle?: string
): string {
  return buildAllArticlesMarkdown(vaultArticles, corpusIndex, moduleTitle);
}

export function buildStarterBundleMarkdown(
  starterArticles: StarterArticle[],
  moduleTitle = "Prompt-Werkstatt · Fokus-Dokumente"
): string {
  const header = [
    `# ${moduleTitle} (${starterArticles.length} Fokus-Dokumente)`,
    "",
    "> Ideal für den schnellen Upload in Claude.ai, ChatGPT oder Microsoft Copilot.",
    "",
  ].join("\n");

  const sections = starterArticles.map(
    (art) => `=== ${art.slug}.md · ${art.title} ===\n\n${art.content}\n\n[Quelle: ${art.slug}.md]`
  );

  return `${header}${sections.join("\n\n---\n\n")}\n`;
}
