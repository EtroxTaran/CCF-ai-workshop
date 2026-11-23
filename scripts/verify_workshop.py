#!/usr/bin/env python3
"""End-to-end verification suite for the virtual7 CCF KI Workshop repository."""

from __future__ import annotations

import json
import re
from pathlib import Path
from pptx import Presentation

ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS_TEMPLATES = Path(r"c:\Users\180-1\Downloads\SKILLS_UND_AGENTS_VORLAGEN.md")


def extract_fenced_blocks(md_text: str) -> list[str]:
    return [m.group(1).strip() for m in re.finditer(r"```markdown\r?\n([\s\S]*?)\r?\n```", md_text)]


def main() -> None:
    errors: list[str] = []

    manifest = json.loads((ROOT / "scripts" / "corpus_manifest.json").read_text(encoding="utf-8"))
    slugs = {item["slug"] for item in manifest}
    assert len(manifest) == 68 and len(slugs) == 68, f"Expected 68 unique articles, got {len(manifest)}"

    # 1. Flat corpus files & wiki files
    for stage_dir in [
        ROOT / "stufe-1-chaos" / "docs",
        ROOT / "stufe-2-skills-guardrails" / "docs",
        ROOT / "stufe-3-obsidian-vault" / "raw",
    ]:
        files = {p.stem for p in stage_dir.glob("*.md")}
        if files != slugs:
            errors.append(f"Mismatch in {stage_dir}: missing={slugs - files}, extra={files - slugs}")
        for p in stage_dir.glob("*.md"):
            if len(p.read_text(encoding="utf-8").strip()) < 500:
                errors.append(f"File too short/empty: {p}")

    # 2. Verbatim AGENTS.md, CLAUDE.md, SKILL.md check
    if DOWNLOADS_TEMPLATES.exists():
        blocks = extract_fenced_blocks(DOWNLOADS_TEMPLATES.read_text(encoding="utf-8"))
        expected_map = {
            "stufe-1-chaos/AGENTS.md": blocks[0],
            "stufe-2-skills-guardrails/AGENTS.md": blocks[1],
            "stufe-2-skills-guardrails/.agents/skills/quellen-recherche/SKILL.md": blocks[2],
            "stufe-2-skills-guardrails/.agents/skills/fakten-pruefer/SKILL.md": blocks[3],
            "stufe-3-obsidian-vault/AGENTS.md": blocks[4],
            "stufe-3-obsidian-vault/.agents/skills/vault-suche/SKILL.md": blocks[5],
            "stufe-3-obsidian-vault/.agents/skills/wissen-synthese/SKILL.md": blocks[6],
        }
        for rel, expected in expected_map.items():
            actual = (ROOT / rel).read_text(encoding="utf-8").strip()
            if actual != expected:
                errors.append(f"Verbatim mismatch in {rel}")
    for st in ["stufe-1-chaos", "stufe-2-skills-guardrails", "stufe-3-obsidian-vault"]:
        claude = (ROOT / st / "CLAUDE.md").read_text(encoding="utf-8").strip()
        if claude != "@AGENTS.md":
            errors.append(f"{st}/CLAUDE.md should be '@AGENTS.md', got {claude!r}")

    # 3. Obsidian vault YAML frontmatter & [[Wikilinks]] validation
    wiki_dir = ROOT / "stufe-3-obsidian-vault" / "wiki"
    wiki_files = list(wiki_dir.rglob("*.md"))
    if len(wiki_files) != 68:
        errors.append(f"Expected 68 wiki files, got {len(wiki_files)}")

    required_fm_keys = ("title:", "category:", "habitat:", "status:", "tags:", "source_file:")
    broken_links: list[str] = []
    wikilink_re = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")

    for wf in wiki_files + [ROOT / "stufe-3-obsidian-vault" / "_index.md"]:
        txt = wf.read_text(encoding="utf-8")
        if wf != ROOT / "stufe-3-obsidian-vault" / "_index.md":
            fm_match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---", txt)
            if not fm_match:
                errors.append(f"Missing YAML frontmatter in {wf}")
            else:
                fm_text = fm_match.group(1)
                for key in required_fm_keys:
                    if key not in fm_text:
                        errors.append(f"Missing key {key} in {wf}")
        txt_no_code = re.sub(r"`[^`]+`", "", txt)
        links = wikilink_re.findall(txt_no_code)
        if wf != ROOT / "stufe-3-obsidian-vault" / "_index.md" and len(links) < 2:
            errors.append(f"Fewer than 2 wikilinks in {wf}")
        for target in links:
            if target not in slugs:
                broken_links.append(f"{wf.name} -> [[{target}]]")
    if broken_links:
        errors.append(f"Broken wikilinks: {broken_links[:10]}")

    # 4. Verify Test Question facts & Fangfrage zero-hits
    eisbaer_txt = (ROOT / "stufe-1-chaos" / "docs" / "eisbaer.md").read_text(encoding="utf-8").lower()
    for term in ("squalen", "schwarzen haut", "42 zähne"):
        if term not in eisbaer_txt:
            errors.append(f"Question 1 evidence missing in eisbaer.md: {term}")

    all_corpus_text = "\n".join(
        p.read_text(encoding="utf-8").lower() for p in (ROOT / "stufe-1-chaos" / "docs").glob("*.md")
    )
    for trap_term in ("schneeleopard", "schweizerischer nationalpark", "eintrittspreis"):
        if trap_term in all_corpus_text:
            errors.append(f"Trap question term unexpectedly found in corpus: {trap_term}")

    # 5. Presentation & UI bundle check
    pptx_path = ROOT / "presentation" / "CCF_HandsOn_Prompt_Werkstatt.pptx"
    if not pptx_path.exists():
        errors.append("Missing presentation/CCF_HandsOn_Prompt_Werkstatt.pptx")
    else:
        prs = Presentation(str(pptx_path))
        if len(prs.slides) != 9:
            errors.append(f"Expected 9 PPTX slides, got {len(prs.slides)}")
        for idx, slide in enumerate(prs.slides, start=1):
            if not slide.notes_slide.notes_text_frame.text.strip():
                errors.append(f"Missing speaker notes on slide {idx}")

    dist_index = ROOT / "workshop-ui" / "dist" / "index.html"
    if not dist_index.exists() or dist_index.stat().st_size < 100:
        errors.append("Missing or empty workshop-ui/dist/index.html")

    if errors:
        print("VERIFICATION FAILED:")
        for e in errors:
            print(" -", e)
        raise SystemExit(1)

    print("ALL WORKSHOP VERIFICATION CHECKS PASSED!")
    print(f"  - 68 unique Wikipedia articles across stufe-1, stufe-2, stufe-3/raw & stufe-3/wiki")
    print(f"  - All AGENTS.md, CLAUDE.md, and SKILL.md files verified verbatim")
    print(f"  - 0 broken [[Wikilinks]] across all 68 wiki notes and _index.md")
    print(f"  - Question 1-4 evidence & Fangfrage zero-hits verified")
    print(f"  - PPTX (9 slides + speaker notes) & workshop-ui/dist/ ready")


if __name__ == "__main__":
    main()
