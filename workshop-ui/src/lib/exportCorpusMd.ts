import { toast } from "sonner";
import rawSearchIndex from "@/data/searchIndex.json";
import type { CorpusSearchIndex, StarterArticle, VaultArticle } from "@/types/workshop";

const fullBodyIndex = rawSearchIndex as CorpusSearchIndex;

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

export function buildAll68ArticlesMarkdown(vaultArticles: VaultArticle[]): string {
  const header = [
    "# CCF Prompt-Werkstatt · Gesamte Wissensbasis (68 öffentliche Wikipedia-Artikel)",
    "",
    "> Hinweis: 100 % öffentliche Wikipedia-Texte (Tierwelt & Ökosysteme), gebündelt zum Hochladen in Web-Chats oder Projekte.",
    "",
  ].join("\n");

  const sections = vaultArticles.map((art) => {
    const body = fullBodyIndex[art.slug] || art.summary;
    return `=== ${art.slug}.md · ${art.title} ===\nKategorie: ${art.category} | Lebensraum: ${art.habitat}\n\n# ${art.title}\n\n${body}\n\n[Quelle: ${art.slug}.md]`;
  });

  return `${header}${sections.join("\n\n---\n\n")}\n`;
}

export function buildStarterBundleMarkdown(starterArticles: StarterArticle[]): string {
  const header = [
    "# CCF Prompt-Werkstatt · 12 Fokus-Artikel (Arktis, Korallenriff & Alpen)",
    "",
    "> Ideal für den schnellen Upload in Claude.ai, ChatGPT oder Microsoft Copilot.",
    "",
  ].join("\n");

  const sections = starterArticles.map(
    (art) => `=== ${art.slug}.md · ${art.title} ===\n\n${art.content}\n\n[Quelle: ${art.slug}.md]`
  );

  return `${header}${sections.join("\n\n---\n\n")}\n`;
}
