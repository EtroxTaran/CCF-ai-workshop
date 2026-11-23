#!/usr/bin/env python3
"""Build the structured Obsidian vault in stufe-3-obsidian-vault/ from the fetched corpus."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "scripts" / "corpus_manifest.json"
RAW_DIR = ROOT / "stufe-3-obsidian-vault" / "raw"
VAULT_DIR = ROOT / "stufe-3-obsidian-vault"
WIKI_DIR = VAULT_DIR / "wiki"
OBSIDIAN_DIR = VAULT_DIR / ".obsidian"

CATEGORY_SUBDIR = {
    "lebensraum": "lebensraeume",
    "tierart": "tierarten",
    "konzept": "konzepte",
}

HABITAT_SLUG = {
    "Arktis": "arktis",
    "Tropischer Regenwald": "tropischer-regenwald",
    "Korallenriff": "korallenriff",
    "Alpen": "alpen",
    "Savanne": "savanne",
}

# Explicit high-value domain cross-links to enrich the knowledge graph
CURATED_LINKS: dict[str, list[str]] = {
    "arktis": ["eisbaer", "ringelrobbe", "polarfuchs", "narwal", "klimawandel", "raeuber-beute-beziehung"],
    "tropischer-regenwald": ["jaguar", "faultiere", "blattschneiderameisen", "orang-utans", "biodiversitaet", "artensterben"],
    "korallenriff": ["steinkorallen", "anemonenfische", "seeanemonen", "korallenbleiche", "symbiose", "schluesselart"],
    "alpen": ["alpensteinbock", "alpenmurmeltier", "steinadler", "bartgeier", "winterschlaf", "klimawandel"],
    "savanne": ["afrikanischer-elefant", "loewe", "gepard", "steppenzebra", "streifengnu", "schluesselart"],
    "eisbaer": ["arktis", "ringelrobbe", "walross", "polarfuchs", "klimawandel", "nahrungskette"],
    "ringelrobbe": ["arktis", "eisbaer", "polarfuchs", "raeuber-beute-beziehung"],
    "polarfuchs": ["arktis", "lemminge", "eisbaer", "tarnung-biologie"],
    "lemminge": ["arktis", "polarfuchs", "schneeeule", "nahrungskette"],
    "schneeeule": ["arktis", "lemminge", "vogelzug", "tarnung-biologie"],
    "anemonenfische": ["korallenriff", "seeanemonen", "symbiose", "steinkorallen"],
    "seeanemonen": ["korallenriff", "anemonenfische", "symbiose", "steinkorallen"],
    "steinkorallen": ["korallenriff", "korallenbleiche", "symbiose", "dornenkronenseestern"],
    "dornenkronenseestern": ["korallenriff", "steinkorallen", "korallenbleiche", "raeuber-beute-beziehung"],
    "papageifische": ["korallenriff", "steinkorallen", "schluesselart", "oekosystem"],
    "riesenmanta": ["korallenriff", "schwarzspitzen-riffhai", "papageifische", "oekosystem"],
    "alpenmurmeltier": ["alpen", "winterschlaf", "steinadler", "nahrungskette"],
    "steinadler": ["alpen", "alpenmurmeltier", "gaemse", "schneehase", "nahrungskette"],
    "alpensteinbock": ["alpen", "gaemse", "bartgeier", "rote-liste-gefaehrdeter-arten"],
    "bartgeier": ["alpen", "alpensteinbock", "gaemse", "artensterben"],
    "schneehase": ["alpen", "tarnung-biologie", "steinadler", "eurasischer-luchs"],
    "afrikanischer-elefant": ["savanne", "schluesselart", "loewe", "biodiversitaet"],
    "loewe": ["savanne", "steppenzebra", "streifengnu", "tuepfelhyaene", "raeuber-beute-beziehung"],
    "gepard": ["savanne", "loewe", "tarnung-biologie", "rote-liste-gefaehrdeter-arten"],
    "steppenzebra": ["savanne", "streifengnu", "loewe", "tarnung-biologie"],
    "blattschneiderameisen": ["tropischer-regenwald", "symbiose", "oekosystem"],
    "baumsteigerfroesche": ["tropischer-regenwald", "mimikry", "biodiversitaet"],
    "grosse-anakonda": ["tropischer-regenwald", "jaguar", "raeuber-beute-beziehung"],
    "korallenbleiche": ["korallenriff", "steinkorallen", "klimawandel", "symbiose"],
    "symbiose": ["anemonenfische", "seeanemonen", "steinkorallen", "blattschneiderameisen", "oekosystem"],
    "winterschlaf": ["alpen", "alpenmurmeltier", "klimawandel"],
    "klimawandel": ["arktis", "eisbaer", "korallenbleiche", "alpen", "artensterben"],
    "schluesselart": ["steinkorallen", "afrikanischer-elefant", "papageifische", "raeuber-beute-beziehung"],
    "nahrungskette": ["raeuber-beute-beziehung", "eisbaer", "ringelrobbe", "alpenmurmeltier", "steinadler"],
    "raeuber-beute-beziehung": ["nahrungskette", "oekosystem", "schluesselart", "biodiversitaet"],
    "tarnung-biologie": ["mimikry", "schneehase", "polarfuchs", "gepard"],
    "mimikry": ["tarnung-biologie", "morphofalter", "baumsteigerfroesche"],
    "vogelzug": ["schneeeule", "klimawandel", "oekosystem"],
    "invasive-art": ["biodiversitaet", "artensterben", "oekosystem"],
    "artensterben": ["rote-liste-gefaehrdeter-arten", "biodiversitaet", "klimawandel", "invasive-art"],
    "biodiversitaet": ["oekosystem", "tropischer-regenwald", "korallenriff", "artensterben"],
    "oekosystem": ["raeuber-beute-beziehung", "biodiversitaet", "schluesselart", "symbiose"],
    "rote-liste-gefaehrdeter-arten": ["artensterben", "eisbaer", "orang-utans", "gepard"],
}


def yaml_quote(value: str) -> str:
    escaped = value.replace('"', '\\"')
    return f'"{escaped}"'


def split_raw_sections(raw_text: str) -> tuple[str, list[str]]:
    """Split raw article into intro paragraph(s) and remaining body lines, removing top H1 & footer."""
    lines = raw_text.splitlines()
    # Drop leading "# Title"
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    # Drop trailing source block ("---\nQuelle: ...")
    cleaned: list[str] = []
    for i, line in enumerate(lines):
        if line.strip() == "---" and i + 1 < len(lines) and lines[i + 1].startswith("Quelle:"):
            break
        cleaned.append(line)

    body_text = "\n".join(cleaned).strip()
    parts = body_text.split("\n## ", 1)
    intro = parts[0].strip()
    rest = ("## " + parts[1].strip()) if len(parts) > 1 else ""
    return intro, [rest] if rest else []


def extract_key_points(intro: str, rest: str, max_points: int = 5) -> list[str]:
    """Create concise bullet summary from opening sentences without inventing facts."""
    combined = (intro + "\n" + rest).strip()
    # Strip markdown headings for sentence extraction
    plain_lines = [ln for ln in combined.splitlines() if ln.strip() and not ln.strip().startswith("#")]
    text = re.sub(r"\s+", " ", " ".join(plain_lines)).strip()
    # Protect common German abbreviations (d. h., z. B., u. a., ca.) before splitting sentences
    protected = (
        text.replace("d. h.", "d._h.")
        .replace("z. B.", "z._B.")
        .replace("u. a.", "u._a.")
        .replace("v. a.", "v._a.")
        .replace("bzw.", "bzw_")
    )
    sentences = re.split(r"(?<=[.!?])\s+", protected)
    points: list[str] = []
    for sent in sentences:
        s = (
            sent.replace("d._h.", "d. h.")
            .replace("z._B.", "z. B.")
            .replace("u._a.", "u. a.")
            .replace("v._a.", "v. a.")
            .replace("bzw_", "bzw.")
            .strip()
        )
        if len(s) >= 35 and not s.startswith("*(Hinweis:"):
            points.append(s)
        if len(points) >= max_points:
            break
    return points


def find_related_slugs(
    item: dict[str, Any],
    all_items: dict[str, dict[str, Any]],
    raw_text: str,
) -> list[str]:
    """Select verified, non-self related article slugs."""
    slug = item["slug"]
    chosen: list[str] = []

    def add(candidate: str) -> None:
        if candidate != slug and candidate in all_items and candidate not in chosen:
            chosen.append(candidate)

    for c in CURATED_LINKS.get(slug, []):
        add(c)

    habitat_slug = HABITAT_SLUG.get(item["habitat"])
    if habitat_slug:
        add(habitat_slug)

    # Scan raw text for mentions of other corpus titles
    raw_lower = raw_text.lower()
    for other_slug, other in all_items.items():
        if len(chosen) >= 8:
            break
        title_clean = re.sub(r"\s*\([^)]*\)$", "", other["title"]).strip().lower()
        if len(title_clean) >= 5 and re.search(rf"\b{re.escape(title_clean)}\b", raw_lower):
            add(other_slug)

    # Guarantee at least 3 links using category/habitat peers
    if len(chosen) < 3:
        for other_slug, other in all_items.items():
            if other["habitat"] == item["habitat"] or other["category"] == "konzept":
                add(other_slug)
            if len(chosen) >= 4:
                break

    return chosen[:7]


def build_wiki_article(
    item: dict[str, Any],
    all_items: dict[str, dict[str, Any]],
    raw_text: str,
    related_slugs: list[str],
) -> str:
    """Format one Obsidian wiki note with YAML frontmatter, curated summary, facts, and [[Wikilinks]]."""
    tags_yaml = "\n".join(f"  - {t}" for t in item["tags"])
    frontmatter = "\n".join(
        [
            "---",
            f"title: {yaml_quote(item['title'])}",
            f"category: {item['category']}",
            f"habitat: {yaml_quote(item['habitat'])}",
            f"status: {yaml_quote(item['status'])}",
            "tags:",
            tags_yaml,
            f"source_file: {yaml_quote('raw/' + item['slug'] + '.md')}",
            "---",
        ]
    )

    intro, rest_blocks = split_raw_sections(raw_text)
    rest_text = "\n\n".join(rest_blocks)
    key_points = extract_key_points(intro, rest_text, max_points=4)
    bullet_block = "\n".join(f"- {pt}" for pt in key_points) if key_points else f"- {item['summary']}"

    link_lines = []
    for r_slug in related_slugs:
        rel = all_items[r_slug]
        cat_label = {"lebensraum": "Lebensraum", "tierart": "Tierart", "konzept": "Konzept"}[rel["category"]]
        link_lines.append(f"- [[{r_slug}|{rel['title']}]] ({cat_label} · {rel['habitat']})")

    habitat_slug = HABITAT_SLUG.get(item["habitat"])
    habitat_ref = f"[[{habitat_slug}|{item['habitat']}]]" if habitat_slug and habitat_slug != item["slug"] else item["habitat"]

    sections = [
        frontmatter,
        "",
        f"# {item['title']}",
        "",
        f"> **Kategorie:** `{item['category']}` · **Lebensraum:** {habitat_ref} · **Status:** {item['status']} · **Rohquelle:** `raw/{item['slug']}.md`",
        "",
        "## Kurzüberblick",
        "",
        intro or item["summary"],
        "",
        "## Wichtige Fakten auf einen Blick",
        "",
        bullet_block,
        "",
        "## Vernetzte Themen im Vault",
        "",
        "\n".join(link_lines),
    ]

    if rest_text:
        sections.extend(["", "## Detailinformationen aus der Quelle", "", rest_text])

    sections.extend(["", "---", f"Quelle (unverändert): `raw/{item['slug']}.md` · Wikipedia: {item['fullurl']}", ""])
    return "\n".join(sections)


def build_index_md(items: list[dict[str, Any]], relations_map: dict[str, list[str]]) -> str:
    """Create central Map of Content (_index.md) for stufe-3-obsidian-vault."""
    habitats = [x for x in items if x["category"] == "lebensraum"]
    species = [x for x in items if x["category"] == "tierart"]
    concepts = [x for x in items if x["category"] == "konzept"]

    lines: list[str] = [
        "# _index — Wissens-Vault: Tierwelt & Ökosysteme (Map of Content)",
        "",
        "Zentrale Einstiegskarte für den Obsidian-Vault (`stufe-3-obsidian-vault`).",
        "Navigiere über die Kategorien, folge `[[Wikilinks]]` in `wiki/` und nutze `raw/` nur für Detailabgleiche.",
        "",
        f"- **Gesamtbestand:** {len(items)} Artikel ({len(habitats)} Lebensräume, {len(species)} Tierarten, {len(concepts)} ökologische Konzepte)",
        "- **Such-Regel:** Immer zuerst hier starten, passende `[[Wikilinks]]` auswählen und Frontmatter (`category`, `habitat`, `status`, `tags`) nutzen.",
        "",
        "## 1. Lebensräume (`wiki/lebensraeume/`)",
        "",
    ]
    for h in habitats:
        lines.append(f"- [[{h['slug']}|{h['title']}]] — {h['summary']}")

    lines.extend(["", "## 2. Tierarten nach Lebensraum (`wiki/tierarten/`)", ""])
    habitat_order = ["Arktis", "Tropischer Regenwald", "Korallenriff", "Alpen", "Savanne"]
    for hab in habitat_order:
        h_slug = HABITAT_SLUG[hab]
        lines.append(f"### Lebensraum: [[{h_slug}|{hab}]]")
        lines.append("")
        hab_species = [s for s in species if s["habitat"] == hab]
        for sp in hab_species:
            lines.append(f"- [[{sp['slug']}|{sp['title']}]] *({sp['status']})* — {sp['summary']}")
        lines.append("")

    lines.extend(["## 3. Ökologische Konzepte (`wiki/konzepte/`)", ""])
    for c in concepts:
        top_links = ", ".join(f"[[{r}]]" for r in relations_map.get(c["slug"], [])[:3])
        extra = f" · Verknüpft: {top_links}" if top_links else ""
        lines.append(f"- [[{c['slug']}|{c['title']}]] — {c['summary']}{extra}")

    lines.append("")
    return "\n".join(lines)


def write_obsidian_config() -> None:
    """Create minimal .obsidian configuration with virtual7-inspired Graph View colors."""
    OBSIDIAN_DIR.mkdir(parents=True, exist_ok=True)
    app_cfg = {
        "alwaysUpdateLinks": True,
        "newLinkFormat": "shortest",
        "useMarkdownLinks": False,
        "showFrontmatter": True,
    }
    graph_cfg = {
        "collapse-filter": False,
        "search": "",
        "showTags": True,
        "showAttachments": False,
        "hideUnresolved": False,
        "showOrphans": True,
        "collapse-color-groups": False,
        "colorGroups": [
            {"query": "path:wiki/lebensraeume", "color": {"a": 1, "rgb": 11125311}},  # #A9C23F
            {"query": "path:wiki/tierarten", "color": {"a": 1, "rgb": 5723990}},      # #575756
            {"query": "path:wiki/konzepte", "color": {"a": 1, "rgb": 9084472}},       # #8A9E38
        ],
        "collapse-display": False,
        "showArrow": True,
        "textFadeMultiplier": 0,
        "nodeSizeMultiplier": 1.15,
        "lineSizeMultiplier": 1,
        "collapse-forces": False,
        "centerStrength": 0.52,
        "repelStrength": 10,
        "linkStrength": 1,
        "linkDistance": 250,
    }
    (OBSIDIAN_DIR / "app.json").write_text(json.dumps(app_cfg, indent=2), encoding="utf-8")
    (OBSIDIAN_DIR / "graph.json").write_text(json.dumps(graph_cfg, indent=2), encoding="utf-8")


def main() -> None:
    manifest: list[dict[str, Any]] = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    all_items = {item["slug"]: item for item in manifest}

    for sub in CATEGORY_SUBDIR.values():
        target = WIKI_DIR / sub
        target.mkdir(parents=True, exist_ok=True)
        for old in target.glob("*.md"):
            old.unlink()

    relations_map: dict[str, list[str]] = {}
    for item in manifest:
        slug = item["slug"]
        raw_text = (RAW_DIR / f"{slug}.md").read_text(encoding="utf-8")
        rel_slugs = find_related_slugs(item, all_items, raw_text)
        relations_map[slug] = rel_slugs
        item["related"] = rel_slugs

        wiki_md = build_wiki_article(item, all_items, raw_text, rel_slugs)
        sub = CATEGORY_SUBDIR[item["category"]]
        (WIKI_DIR / sub / f"{slug}.md").write_text(wiki_md, encoding="utf-8")

    # Persist enriched manifest including computed related links
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    index_md = build_index_md(manifest, relations_map)
    (VAULT_DIR / "_index.md").write_text(index_md, encoding="utf-8")
    write_obsidian_config()
    print(f"Vault built successfully: {len(manifest)} wiki articles, _index.md, and .obsidian/ config.")


if __name__ == "__main__":
    main()
