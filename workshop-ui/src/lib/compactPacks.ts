export const MAX_SAFE_CLIPBOARD_CHARS = 7500;

interface ExpressSection {
  slug: string;
  block: string;
}

function parseExpressSections(expressContent: string): ExpressSection[] {
  const raw = String(expressContent || "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const sections: ExpressSection[] = [];
  let currentSlug = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^===\s*([a-z0-9_-]+)\.md(?:\s+\(.*\))?\s*===\s*$/i);
    if (headerMatch) {
      if (currentLines.length > 0) {
        sections.push({
          slug: currentSlug,
          block: currentLines.join("\n").trim(),
        });
      }
      currentSlug = headerMatch[1].toLowerCase();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      slug: currentSlug,
      block: currentLines.join("\n").trim(),
    });
  }

  return sections.filter((s) => s.block.length > 0);
}

/**
 * Slices an express-package string (with `=== slug.md ===` sections) down to the requested slugs.
 * Preserves section order from the express package and guarantees <= MAX_SAFE_CLIPBOARD_CHARS.
 */
export function sliceExpressBySlugs(
  expressContent: string,
  slugs: string[],
  maxChars: number = MAX_SAFE_CLIPBOARD_CHARS
): string {
  const raw = String(expressContent || "").trim();
  if (!raw) return "";
  const normalizedTarget = new Set(
    slugs.map((s) => String(s || "").trim().toLowerCase().replace(/\.md$/, "")).filter(Boolean)
  );
  if (normalizedTarget.size === 0) {
    return compactToCharLimit(raw, maxChars);
  }

  const sections = parseExpressSections(raw);
  if (sections.length === 0) {
    return compactToCharLimit(raw, maxChars);
  }

  const matched = sections.filter((s) => s.slug && normalizedTarget.has(s.slug));
  const selected = matched.length > 0 ? matched.map((s) => s.block).join("\n\n") : raw;
  return compactToCharLimit(selected, maxChars);
}

function isPrimaryFocusLine(line: string, normalizedSlugs: string[]): boolean {
  const bulletMatch = line.match(/^\s*-\s*\[\[([^\]|#]+)(?:[|#\]])/i);
  if (bulletMatch) {
    return normalizedSlugs.includes(bulletMatch[1].trim().toLowerCase());
  }
  const low = line.toLowerCase();
  return normalizedSlugs.some(
    (slug) =>
      low.includes(`[[${slug}|`) || low.includes(`[[${slug}]`) || low.includes(`[[${slug}#`)
  );
}

function shortenIndexEntryLine(line: string): string {
  // Keep bullet + [[wikilink|title]] + optional *(status)*, drop verbose description tail if needed
  const dashIdx = line.indexOf(" — ");
  if (dashIdx > 0) {
    return line.slice(0, dashIdx).trimEnd();
  }
  return line;
}

function stripIndexMetadataTail(line: string): string {
  return shortenIndexEntryLine(line)
    .replace(/\s*\*\([^)]*(?:\([^)]*\)[^)]*)?\)\*\s*$/g, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trimEnd();
}

/**
 * Compacts a Stage-3 `_index.md` string to fit cleanly within `maxChars` (default 900)
 * while preserving the root heading, relevant section headers, and all focus-article `[[wikilinks]]`.
 */
export function buildCompactIndex(
  rawIndexMd: string,
  focusSlugs: string[],
  maxChars: number = 900
): string {
  const raw = String(rawIndexMd || "").trim();
  if (!raw) return "";
  if (raw.length <= maxChars) return raw;

  const normalizedSlugs = focusSlugs
    .map((s) => String(s || "").trim().toLowerCase().replace(/\.md$/, ""))
    .filter(Boolean);

  const lines = raw.split(/\r?\n/);

  // Group focus lines under their nearest preceding headings so empty sections are omitted
  let mainTitle = "";
  let pendingH2 = "";
  let pendingH3 = "";
  const selectedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("# ")) {
      if (!mainTitle) {
        mainTitle = trimmed;
        selectedLines.push(trimmed);
      }
      continue;
    }
    if (trimmed.startsWith("## ")) {
      pendingH2 = trimmed;
      pendingH3 = "";
      continue;
    }
    if (trimmed.startsWith("### ")) {
      pendingH3 = trimmed;
      continue;
    }
    if (isPrimaryFocusLine(trimmed, normalizedSlugs)) {
      if (pendingH2) {
        selectedLines.push(pendingH2);
        pendingH2 = "";
      }
      if (pendingH3) {
        selectedLines.push(pendingH3);
        pendingH3 = "";
      }
      selectedLines.push(trimmed);
    }
  }

  if (selectedLines.length <= 1) {
    return compactToCharLimit(raw, maxChars);
  }

  const fullJoined = selectedLines.join("\n");
  if (fullJoined.length <= maxChars) {
    return fullJoined;
  }

  // Tier 1: Strip verbose descriptions after ` — ` so focus wikilinks fit inside maxChars
  const compactLines = selectedLines.map((l) =>
    l.startsWith("#") ? l : shortenIndexEntryLine(l)
  );
  const compactJoined = compactLines.join("\n");
  if (compactJoined.length <= maxChars) {
    return compactJoined;
  }

  // Tier 2: Also strip trailing *(status)* / (category) metadata tails
  const minimalLines = selectedLines.map((l) =>
    l.startsWith("#") ? l : stripIndexMetadataTail(l)
  );
  const minimalJoined = minimalLines.join("\n");
  if (minimalJoined.length <= maxChars) {
    return minimalJoined;
  }

  // Tier 3: Collapse `### ` subheaders if still above maxChars
  const noH3Joined = minimalLines.filter((l) => !l.startsWith("### ")).join("\n");
  if (noH3Joined.length <= maxChars) {
    return noH3Joined;
  }

  return compactToCharLimit(noH3Joined, maxChars);
}

/**
 * Guarantees a clipboard string never exceeds `maxChars`, cutting cleanly at a line or word boundary.
 */
export function compactToCharLimit(
  text: string,
  maxChars: number = MAX_SAFE_CLIPBOARD_CHARS
): string {
  const str = String(text || "");
  if (str.length <= maxChars) return str;
  const suffix = "\n… [Kompakt gekürzt für sicheres Web-Chat-Einfügen]";
  const budget = Math.max(0, maxChars - suffix.length);
  if (budget <= 0) return str.slice(0, maxChars);

  const slice = str.slice(0, budget);
  const lastNewline = slice.lastIndexOf("\n");
  const cutPoint = lastNewline > budget * 0.6 ? lastNewline : slice.lastIndexOf(" ");
  const clean = cutPoint > 0 ? slice.slice(0, cutPoint) : slice;
  return `${clean.trimEnd()}${suffix}`;
}
