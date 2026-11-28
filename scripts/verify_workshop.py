#!/usr/bin/env python3
"""End-to-end verification suite for the virtual7 CCF KI Workshop repository."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.parse import unquote

CATEGORY_SUBDIRS = {
    "lebensraum": "lebensraeume",
    "tierart": "tierarten",
    "konzept": "konzepte",
}

EXPECTED_STAGE_SKILLS = {
    "stufe-2-skills-guardrails": {"quellen-recherche", "fakten-pruefer"},
    "stufe-3-obsidian-vault": {"vault-suche", "wissen-synthese"},
}

REQUIRED_CONTEXT_TERMS = (
    "Workshop-App",
    "Trainer-Bühne",
    "Aha-Kern",
    "Praxis-Pfad",
    "Transfer-Brücke",
    "Werkzeug-Hilfe",
    "Web-Chat",
    "Desktop & Ordner",
    "Code-Agent",
    "Wissensbasis",
)

PAGES_URL = "https://etroxtaran.github.io/CCF-ai-workshop/"

R5_DOC_AND_LAUNCHER_FILES = (
    "README.md",
    "AGENTS.md",
    "aufgaben.md",
    "LOESUNGEN_TRAINER.md",
    "start-workshop.bat",
    "start-workshop.sh",
    "start-beamer.bat",
    "start-beamer.sh",
)

R5_MAIN_BRANCH_DOCS = ("README.md", "aufgaben.md", "LOESUNGEN_TRAINER.md")

R5_AVOIDED_TERM_PATTERNS = (
    ("Track A", re.compile(r"\bTrack\s+A\b", re.I)),
    ("Track B", re.compile(r"\bTrack\s+B\b", re.I)),
    ("Wahl-Mission", re.compile(r"\bWahl-Mission(?:en)?\b", re.I)),
    ("Live-Wall", re.compile(r"\bLive-Wall\b", re.I)),
    ("Beamer-Server", re.compile(r"\bBeamer-Server\b", re.I)),
    ("Regie-Backend", re.compile(r"\bRegie-Backend\b", re.I)),
    ("MOC", re.compile(r"\bMOC\b")),
    ("bare /beamer", re.compile(r"(?<!#)(?<![a-zA-Z0-9_./-])/beamer\b")),
    (
        "master branch",
        re.compile(r"(?:git\s+clone\s+-b\s+master\b|\bBranch\s+master\b|\bPush\s+nach\s+master\b)", re.I),
    ),
)

# Construct dynamically so this file never self-matches personal path checks.
PERSONAL_PATH_RE = re.compile(
    r"(?:"
    + r"[a-z]:[/\\]us"
    + r"ers[/\\]|/us"
    + r"ers/|down"
    + r"loads[/\\]|down"
    + r"loads\b)",
    re.I,
)

FORBIDDEN_REMNANT_STRINGS = (
    "send_to_beamer",
    "BEAMER_URL",
    "/api/submissions",
    "/api/events",
    "BeamerSendSheet",
    "submit-question.mjs",
    "live-questions/",
)

MAX_JS_CHUNK_BYTES = 500_000


def normalize_text(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()


def parse_frontmatter(text: str) -> tuple[dict[str, Any] | None, str]:
    match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)", text)
    if not match:
        return None, text
    raw_fm = match.group(1)
    body = text[match.end() :]
    parsed: dict[str, Any] = {}
    current_key: str | None = None
    for raw_line in raw_fm.splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        list_match = re.match(r"^\s*-\s+(.*)$", raw_line)
        if list_match and current_key is not None:
            val = list_match.group(1).strip().strip('"').strip("'")
            if not isinstance(parsed.get(current_key), list):
                parsed[current_key] = []
            parsed[current_key].append(val)
            continue
        kv_match = re.match(r"^([A-Za-z0-9_.-]+):\s*(.*)$", raw_line)
        if kv_match:
            key = kv_match.group(1).strip()
            val_raw = kv_match.group(2).strip()
            current_key = key
            if val_raw == "":
                parsed[key] = []
            elif val_raw.startswith("[") and val_raw.endswith("]"):
                inner = val_raw[1:-1].strip()
                items = [
                    part.strip().strip('"').strip("'")
                    for part in inner.split(",")
                    if part.strip()
                ]
                parsed[key] = items
            else:
                parsed[key] = val_raw.strip('"').strip("'")
    return parsed, body


def extract_wikilinks(md_text: str) -> list[str]:
    no_fenced = re.sub(r"```[\s\S]*?```", "", md_text)
    no_inline = re.sub(r"`[^`]+`", "", no_fenced)
    targets: list[str] = []
    for raw_target in re.findall(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]", no_inline):
        target = raw_target.split("#", 1)[0].strip()
        if target:
            targets.append(target)
    return targets


def check_personal_paths(root: Path, errors: list[str], summary: list[str]) -> None:
    scripts_dir = root / "scripts"
    if not scripts_dir.is_dir():
        errors.append(f"Missing scripts directory: {scripts_dir}")
        return
    py_files = sorted(scripts_dir.glob("*.py"))
    flagged = []
    for py_file in py_files:
        content = py_file.read_text(encoding="utf-8", errors="replace")
        for line_no, line in enumerate(content.splitlines(), start=1):
            if PERSONAL_PATH_RE.search(line):
                flagged.append(f"{py_file.name}:{line_no}")
    if flagged:
        errors.append(f"Hardcoded personal path found in scripts: {', '.join(flagged[:10])}")
    else:
        summary.append(f"Zero hardcoded personal paths across {len(py_files)} Python scripts")


def check_multi_cli_and_mirrors(root: Path, errors: list[str], summary: list[str]) -> None:
    expected_server = (root / "mcp-server" / "server.mjs").resolve()

    mcp_targets = [
        (root / ".mcp.json", "mcpServers", root, "workshop-wildlife"),
        (root / ".cursor" / "mcp.json", "mcpServers", root, "workshop-wildlife"),
        (root / ".gemini" / "settings.json", "mcpServers", root, "workshop-wildlife"),
        (root / ".vscode" / "mcp.json", "servers", root, "workshop-wildlife"),
        (
            root / "stufe-3-obsidian-vault" / ".mcp.json",
            "mcpServers",
            root / "stufe-3-obsidian-vault",
            "workshop-wildlife",
        ),
        (
            root / "stufe-3-obsidian-vault" / ".cursor" / "mcp.json",
            "mcpServers",
            root / "stufe-3-obsidian-vault",
            "workshop-wildlife",
        ),
        (
            root / "stufe-3-obsidian-vault" / ".gemini" / "settings.json",
            "mcpServers",
            root / "stufe-3-obsidian-vault",
            "workshop-wildlife",
        ),
        (
            root / "stufe-3-obsidian-vault" / ".vscode" / "mcp.json",
            "servers",
            root / "stufe-3-obsidian-vault",
            "workshop-wildlife",
        ),
        (
            root / "modules" / "context-engineering-projekt" / ".cursor" / "mcp.json",
            "mcpServers",
            root / "modules" / "context-engineering-projekt",
            "workshop-context-engineering-projekt",
        ),
    ]
    for cfg_path, root_key, workspace_dir, expected_server_key in mcp_targets:
        rel = cfg_path.relative_to(root)
        if not cfg_path.is_file():
            errors.append(f"Missing MCP config: {rel}")
            continue
        try:
            cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"Invalid JSON in {rel}: {exc}")
            continue
        servers_obj = cfg.get(root_key)
        if not isinstance(servers_obj, dict):
            errors.append(f"Missing '{root_key}' object in {rel}")
            continue
        entry = servers_obj.get(expected_server_key)
        if not isinstance(entry, dict):
            errors.append(f"Missing '{expected_server_key}' entry in {rel}")
            continue
        if entry.get("command") != "node":
            errors.append(f"{rel}: expected command == 'node', got {entry.get('command')!r}")
        args = entry.get("args")
        if not isinstance(args, list) or not args:
            errors.append(f"{rel}: expected non-empty args list")
            continue
        raw_arg = str(args[0])
        cleaned = raw_arg.replace("${workspaceFolder}/", "").replace("${workspaceFolder}\\", "")
        resolved = (workspace_dir / cleaned).resolve()
        if resolved != expected_server:
            errors.append(
                f"{rel}: script path {raw_arg!r} resolves to {resolved}, expected {expected_server}"
            )

    # Stufe 2 darf absichtlich keinerlei MCP-Konfiguration besitzen (Stage 2 Isolation).
    for forbidden_s2_rel in (
        ".mcp.json",
        ".cursor/mcp.json",
        ".vscode/mcp.json",
        ".gemini/settings.json",
        ".codex/config.toml",
        "opencode.json",
    ):
        if (root / "stufe-2-skills-guardrails" / forbidden_s2_rel).exists():
            errors.append(
                f"Stage 2 isolation breach: stufe-2-skills-guardrails/{forbidden_s2_rel} must NOT exist (leaks Stage 3 vault)"
            )

    # OpenCode configs (root & Stage 3)
    for oc_path in (root / "opencode.json", root / "stufe-3-obsidian-vault" / "opencode.json"):
        rel = oc_path.relative_to(root)
        if not oc_path.is_file():
            errors.append(f"Missing OpenCode config: {rel}")
            continue
        try:
            cfg = json.loads(oc_path.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"Invalid JSON in {rel}: {exc}")
            continue
        entry = (cfg.get("mcp") or {}).get("workshop-wildlife")
        cmd = entry.get("command") if isinstance(entry, dict) else None
        if not isinstance(entry, dict) or entry.get("type") != "local" or not isinstance(cmd, list) or len(cmd) < 2 or cmd[0] != "node":
            errors.append(f"{rel}: invalid OpenCode MCP schema for 'workshop-wildlife'")
        elif (oc_path.parent / str(cmd[1])).resolve() != expected_server:
            errors.append(f"{rel}: OpenCode server path resolves outside {expected_server}")

    # Codex configs (root & Stage 3)
    for cx_path in (root / ".codex" / "config.toml", root / "stufe-3-obsidian-vault" / ".codex" / "config.toml"):
        rel = cx_path.relative_to(root)
        if not cx_path.is_file():
            errors.append(f"Missing Codex config: {rel}")
            continue
        txt = cx_path.read_text(encoding="utf-8")
        if "[mcp_servers.workshop-wildlife]" not in txt or "server.mjs" not in txt:
            errors.append(f"{rel}: missing [mcp_servers.workshop-wildlife] or server.mjs reference")

    # Line-ending guard & sandbox gitignore
    if not (root / ".gitattributes").is_file():
        errors.append("Missing .gitattributes (*.sh eol=lf, *.bat eol=crlf)")
    gi_path = root / ".gitignore"
    if not gi_path.is_file() or "sandbox/" not in gi_path.read_text(encoding="utf-8"):
        errors.append(".gitignore must ignore sandbox/")

    # Root AGENTS.md & .github/copilot-instructions.md must stay spoiler-free & R5-clean
    for root_instr_rel in ("AGENTS.md", ".github/copilot-instructions.md"):
        root_instr_path = root / root_instr_rel
        if not root_instr_path.is_file() or not root_instr_path.read_text(encoding="utf-8").strip():
            errors.append(f"Missing or empty {root_instr_rel}")
            continue
        root_instr_txt = root_instr_path.read_text(encoding="utf-8", errors="replace")
        root_instr_low = root_instr_txt.lower()
        for spoiler in ("schneeleopard", "krypto-wallet"):
            if spoiler in root_instr_low:
                errors.append(f"Spoiler leak in {root_instr_rel}: contains {spoiler!r}")
        for label, rx in R5_AVOIDED_TERM_PATTERNS:
            if rx.search(root_instr_txt):
                errors.append(f"R5 avoided term ({label}) found in {root_instr_rel}")
        for token in FORBIDDEN_REMNANT_STRINGS:
            if token in root_instr_txt:
                errors.append(f"Forbidden remnant {token!r} found in {root_instr_rel}")

    for folder_rel in (
        ".",
        "stufe-1-chaos",
        "stufe-2-skills-guardrails",
        "stufe-3-obsidian-vault",
        "modules/context-engineering-projekt",
    ):
        folder = root / folder_rel if folder_rel != "." else root
        agents_path = folder / "AGENTS.md"
        if not agents_path.is_file() or not agents_path.read_text(encoding="utf-8").strip():
            errors.append(f"Missing or empty {folder_rel}/AGENTS.md")
        elif folder_rel in (
            "stufe-2-skills-guardrails",
            "stufe-3-obsidian-vault",
            "modules/context-engineering-projekt",
        ):
            if "Scope-Override" not in agents_path.read_text(encoding="utf-8"):
                errors.append(f"{folder_rel}/AGENTS.md missing Scope-Override header")

        if folder_rel in (
            ".",
            "stufe-2-skills-guardrails",
            "stufe-3-obsidian-vault",
            "modules/context-engineering-projekt",
        ):
            copilot_path = folder / ".github" / "copilot-instructions.md"
            if not copilot_path.is_file() or not copilot_path.read_text(encoding="utf-8").strip():
                errors.append(f"Missing or empty {folder_rel}/.github/copilot-instructions.md")
            elif folder_rel != ".":
                if "Scope-Override" not in copilot_path.read_text(encoding="utf-8"):
                    errors.append(
                        f"{folder_rel}/.github/copilot-instructions.md missing Scope-Override header"
                    )

        for mirror_name in ("CLAUDE.md", "GEMINI.md"):
            mirror_path = folder / mirror_name
            if not mirror_path.is_file():
                errors.append(f"Missing {folder_rel}/{mirror_name}")
            else:
                val = mirror_path.read_text(encoding="utf-8").strip()
                if val != "@AGENTS.md":
                    errors.append(f"{folder_rel}/{mirror_name} must be '@AGENTS.md', got {val!r}")

    for stage_rel, expected_skills in EXPECTED_STAGE_SKILLS.items():
        stage_dir = root / stage_rel
        agents_skills_dir = stage_dir / ".agents" / "skills"
        claude_skills_dir = stage_dir / ".claude" / "skills"

        if not agents_skills_dir.is_dir():
            errors.append(f"Missing {stage_rel}/.agents/skills directory")
            continue
        actual_agents = {
            p.name for p in agents_skills_dir.iterdir() if p.is_dir() and (p / "SKILL.md").is_file()
        }
        if actual_agents != expected_skills:
            errors.append(
                f"{stage_rel}/.agents/skills mismatch: expected={sorted(expected_skills)}, got={sorted(actual_agents)}"
            )

        if not claude_skills_dir.is_dir():
            errors.append(f"Missing {stage_rel}/.claude/skills directory")
            continue
        actual_claude = {
            p.name for p in claude_skills_dir.iterdir() if p.is_dir() and (p / "SKILL.md").is_file()
        }
        if actual_claude != expected_skills:
            errors.append(
                f"{stage_rel}/.claude/skills mismatch: expected={sorted(expected_skills)}, got={sorted(actual_claude)}"
            )

        for skill_name in sorted(expected_skills):
            a_skill = agents_skills_dir / skill_name / "SKILL.md"
            c_skill = claude_skills_dir / skill_name / "SKILL.md"
            if not a_skill.is_file():
                errors.append(f"Missing {stage_rel}/.agents/skills/{skill_name}/SKILL.md")
                continue
            a_raw = a_skill.read_text(encoding="utf-8")
            fm, body = parse_frontmatter(a_raw)
            if fm is None:
                errors.append(f"Missing YAML frontmatter in {stage_rel}/.agents/skills/{skill_name}/SKILL.md")
            else:
                if str(fm.get("name", "")).strip() != skill_name:
                    errors.append(
                        f"{stage_rel}/.agents/skills/{skill_name}/SKILL.md frontmatter name mismatch: {fm.get('name')!r}"
                    )
                if not str(fm.get("description", "")).strip():
                    errors.append(
                        f"{stage_rel}/.agents/skills/{skill_name}/SKILL.md missing description"
                    )
            if not body.strip():
                errors.append(f"Empty body in {stage_rel}/.agents/skills/{skill_name}/SKILL.md")

            if c_skill.is_file():
                c_raw = c_skill.read_text(encoding="utf-8")
                if normalize_text(a_raw) != normalize_text(c_raw):
                    errors.append(
                        f"Skill mirror mismatch between .agents/skills and .claude/skills for {stage_rel}/{skill_name}"
                    )

    summary.append("Multi-CLI configs (.mcp.json, .vscode/mcp.json, CLAUDE.md, GEMINI.md, .claude/skills mirrors) checked")


def check_corpus_and_vault(
    root: Path, errors: list[str], summary: list[str]
) -> tuple[set[str], dict[str, dict[str, Any]]]:
    manifest_path = root / "scripts" / "corpus_manifest.json"
    if not manifest_path.is_file():
        errors.append("Missing scripts/corpus_manifest.json")
        return set(), {}

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid JSON in scripts/corpus_manifest.json: {exc}")
        return set(), {}

    if not isinstance(manifest, list) or len(manifest) != 68:
        errors.append(f"Expected 68 items in corpus_manifest.json, got {len(manifest) if isinstance(manifest, list) else type(manifest).__name__}")
        return set(), {}

    by_slug: dict[str, dict[str, Any]] = {}
    for item in manifest:
        slug = item.get("slug")
        cat = item.get("category")
        if not isinstance(slug, str) or not slug:
            errors.append(f"Invalid slug in corpus_manifest.json: {item!r}")
            continue
        if cat not in CATEGORY_SUBDIRS:
            errors.append(f"Invalid category {cat!r} for slug {slug!r}")
        by_slug[slug] = item

    slugs = set(by_slug.keys())
    if len(slugs) != 68:
        errors.append(f"Expected 68 unique slugs in corpus_manifest.json, got {len(slugs)}")

    stage_dirs = [
        root / "stufe-1-chaos" / "docs",
        root / "stufe-2-skills-guardrails" / "docs",
        root / "stufe-3-obsidian-vault" / "raw",
    ]
    stage_texts: dict[str, dict[str, str]] = {}
    for stage_dir in stage_dirs:
        if not stage_dir.is_dir():
            errors.append(f"Missing corpus directory: {stage_dir.relative_to(root)}")
            continue
        files = {p.stem: p for p in stage_dir.glob("*.md")}
        stems = set(files.keys())
        if stems != slugs:
            errors.append(
                f"Slug mismatch in {stage_dir.relative_to(root)}: missing={sorted(slugs - stems)[:5]}, extra={sorted(stems - slugs)[:5]}"
            )
        stage_texts[str(stage_dir)] = {}
        for slug, p in files.items():
            txt = p.read_text(encoding="utf-8")
            if len(txt.strip()) < 500:
                errors.append(f"File too short (<500 chars): {p.relative_to(root)}")
            stage_texts[str(stage_dir)][slug] = normalize_text(txt)

    if len(stage_texts) == 3:
        keys = list(stage_texts.keys())
        for slug in sorted(slugs):
            t0 = stage_texts[keys[0]].get(slug)
            t1 = stage_texts[keys[1]].get(slug)
            t2 = stage_texts[keys[2]].get(slug)
            if t0 is not None and t1 is not None and t2 is not None:
                if not (t0 == t1 == t2):
                    errors.append(f"Corpus content parity mismatch across stufe-1..3 for {slug}.md")

    wiki_dir = root / "stufe-3-obsidian-vault" / "wiki"
    if not wiki_dir.is_dir():
        errors.append("Missing stufe-3-obsidian-vault/wiki directory")
        return slugs, by_slug

    wiki_files = sorted(wiki_dir.rglob("*.md"))
    if len(wiki_files) != 68:
        errors.append(f"Expected 68 wiki files, got {len(wiki_files)}")

    wiki_stems: set[str] = set()
    dup_stems: list[str] = []
    broken_links: list[str] = []

    for wf in wiki_files:
        slug = wf.stem
        if slug in wiki_stems:
            dup_stems.append(slug)
        wiki_stems.add(slug)

        manifest_item = by_slug.get(slug)
        if manifest_item:
            expected_sub = CATEGORY_SUBDIRS[manifest_item["category"]]
            if wf.parent.name != expected_sub or wf.parent.parent != wiki_dir:
                errors.append(
                    f"Wiki file {wf.relative_to(root)} not under expected category dir {expected_sub}/"
                )

        txt = wf.read_text(encoding="utf-8")
        fm, _ = parse_frontmatter(txt)
        if fm is None:
            errors.append(f"Missing YAML frontmatter in {wf.relative_to(root)}")
        else:
            for req_key in ("title", "category", "habitat", "status"):
                if not str(fm.get(req_key, "")).strip():
                    errors.append(f"Missing or empty frontmatter '{req_key}' in {wf.relative_to(root)}")
            tags_val = fm.get("tags")
            if not isinstance(tags_val, list) or len(tags_val) == 0:
                errors.append(f"Missing or empty frontmatter 'tags' in {wf.relative_to(root)}")
            expected_sf = f"raw/{slug}.md"
            if str(fm.get("source_file", "")).strip() != expected_sf:
                errors.append(
                    f"Frontmatter 'source_file' in {wf.relative_to(root)} should be {expected_sf!r}, got {fm.get('source_file')!r}"
                )

        links = extract_wikilinks(txt)
        if len(links) < 2:
            errors.append(f"Fewer than 2 wikilinks in {wf.relative_to(root)}")
        for target in links:
            if target not in slugs:
                broken_links.append(f"{wf.name} -> [[{target}]]")

    if dup_stems:
        errors.append(f"Duplicate wiki stems found: {dup_stems}")
    if wiki_stems != slugs:
        errors.append(
            f"Wiki stems mismatch: missing={sorted(slugs - wiki_stems)[:5]}, extra={sorted(wiki_stems - slugs)[:5]}"
        )

    index_path = root / "stufe-3-obsidian-vault" / "_index.md"
    if not index_path.is_file():
        errors.append("Missing stufe-3-obsidian-vault/_index.md")
    else:
        index_txt = index_path.read_text(encoding="utf-8")
        index_links = extract_wikilinks(index_txt)
        for target in index_links:
            if target not in slugs:
                broken_links.append(f"_index.md -> [[{target}]]")
        missing_in_index = slugs - set(index_links)
        if missing_in_index:
            errors.append(f"_index.md missing links to {len(missing_in_index)} articles: {sorted(missing_in_index)[:5]}")

    if broken_links:
        errors.append(f"Broken wikilinks ({len(broken_links)}): {broken_links[:10]}")

    # Q1-Q4 evidence & Q3 trap checks across docs/ and wiki/
    def read_lower(path: Path) -> str:
        return path.read_text(encoding="utf-8").lower() if path.is_file() else ""

    for label, p in [
        ("stufe-1-chaos/docs/eisbaer.md", root / "stufe-1-chaos" / "docs" / "eisbaer.md"),
        ("stufe-2-skills-guardrails/docs/eisbaer.md", root / "stufe-2-skills-guardrails" / "docs" / "eisbaer.md"),
        ("stufe-3-obsidian-vault/raw/eisbaer.md", root / "stufe-3-obsidian-vault" / "raw" / "eisbaer.md"),
        ("stufe-3-obsidian-vault/wiki/tierarten/eisbaer.md", wiki_dir / "tierarten" / "eisbaer.md"),
    ]:
        txt_l = read_lower(p)
        if txt_l:
            for term in ("squalen", "schwarzen haut", "42 zähne"):
                if term not in txt_l:
                    errors.append(f"Q1 evidence missing in {label}: {term}")
            if "38 zähne" in txt_l:
                errors.append(f"Q4 mutated value '38 zähne' left behind in {label}")

    q2_checks = [
        ("anemonenfische", "tierarten", ("sialinsäuren",)),
        ("symbiose", "konzepte", ("ektosymbiose", "endosymbiose")),
        ("steinkorallen", "tierarten", ("zooxanthellen",)),
        ("korallenbleiche", "konzepte", ("zooxanthellen", "acht wochen")),
    ]
    for slug, sub, terms in q2_checks:
        for base_label, p in [
            (f"stufe-1-chaos/docs/{slug}.md", root / "stufe-1-chaos" / "docs" / f"{slug}.md"),
            (f"stufe-2-skills-guardrails/docs/{slug}.md", root / "stufe-2-skills-guardrails" / "docs" / f"{slug}.md"),
            (f"stufe-3-obsidian-vault/wiki/{sub}/{slug}.md", wiki_dir / sub / f"{slug}.md"),
        ]:
            txt_l = read_lower(p)
            if txt_l:
                for term in terms:
                    if term not in txt_l:
                        errors.append(f"Q2 evidence missing in {base_label}: {term}")

    trap_dirs = [
        root / "stufe-1-chaos" / "docs",
        root / "stufe-2-skills-guardrails" / "docs",
        root / "stufe-3-obsidian-vault" / "raw",
        wiki_dir,
    ]
    for trap_dir in trap_dirs:
        if not trap_dir.is_dir():
            continue
        for md_file in trap_dir.rglob("*.md"):
            content_l = md_file.read_text(encoding="utf-8").lower()
            for trap_term in ("schneeleopard", "schweizerischer nationalpark", "eintrittspreis"):
                if trap_term in content_l:
                    errors.append(f"Q3 trap term {trap_term!r} found in {md_file.relative_to(root)}")

    summary.append("68-article corpus parity, YAML frontmatter, 0 broken [[Wikilinks]], _index.md, and Q1-Q4 checks verified")
    return slugs, by_slug


def check_docs_adr_ci(root: Path, errors: list[str], summary: list[str]) -> None:
    context_path = root / "CONTEXT.md"
    if not context_path.is_file():
        errors.append("Missing CONTEXT.md")
    else:
        ctx = context_path.read_text(encoding="utf-8")
        missing_terms = [t for t in REQUIRED_CONTEXT_TERMS if t not in ctx]
        if missing_terms:
            errors.append(f"CONTEXT.md missing Ubiquitous Language terms: {missing_terms}")

    adr_dir = root / "docs" / "adr"
    if not adr_dir.is_dir():
        errors.append("Missing docs/adr directory")
    else:
        for num in ("0001", "0002", "0003", "0004", "0005", "0006"):
            matches = list(adr_dir.glob(f"{num}-*.md"))
            if not matches:
                errors.append(f"Missing ADR file docs/adr/{num}-*.md")
            elif not matches[0].read_text(encoding="utf-8").strip():
                errors.append(f"Empty ADR file {matches[0].relative_to(root)}")

    wf_path = root / ".github" / "workflows" / "deploy-pages.yml"
    if not wf_path.is_file():
        errors.append("Missing .github/workflows/deploy-pages.yml")
    else:
        wf = wf_path.read_text(encoding="utf-8")
        if not re.search(r"node-version\s*:\s*['\"]?20\b", wf):
            errors.append("deploy-pages.yml must specify Node 20 (node-version: 20)")
        for needle in ("npm ci", "npm run build", "404.html", "actions/deploy-pages", "workshop-ui/dist", "main"):
            if needle not in wf:
                errors.append(f"deploy-pages.yml missing required token: {needle!r}")

    ci_path = root / ".github" / "workflows" / "ci.yml"
    if not ci_path.is_file():
        errors.append("Missing .github/workflows/ci.yml")
    rel_wf_path = root / ".github" / "workflows" / "release-offline.yml"
    if not rel_wf_path.is_file():
        errors.append("Missing .github/workflows/release-offline.yml")

    for rel_doc in R5_DOC_AND_LAUNCHER_FILES:
        doc_path = root / rel_doc
        if not doc_path.is_file():
            errors.append(f"Missing R5 doc/launcher file: {rel_doc}")
            continue
        doc_txt = doc_path.read_text(encoding="utf-8", errors="replace")
        for label, rx in R5_AVOIDED_TERM_PATTERNS:
            if rx.search(doc_txt):
                errors.append(f"R5 avoided term ({label}) found in {rel_doc}")
        if PAGES_URL not in doc_txt:
            errors.append(f"Missing GitHub Pages URL ({PAGES_URL}) in {rel_doc}")
        if rel_doc in R5_MAIN_BRANCH_DOCS and not re.search(r"\bmain\b", doc_txt):
            errors.append(f"Missing 'main' branch reference in {rel_doc}")

    summary.append("CONTEXT.md, docs/adr/0001..0006, R5 docs/launchers, and CI/Pages workflows verified")


ROOT_ABS_JS_STR_RE = re.compile(r"""["']/(?!/)""")


def _check_manifest_relative(manifest_path: Path, rel_label: str, errors: list[str]) -> None:
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid JSON in {rel_label}: {exc}")
        return
    if not isinstance(manifest, dict):
        errors.append(f"{rel_label} must be a JSON object")
        return

    for field in ("start_url", "scope"):
        val = manifest.get(field)
        if isinstance(val, str) and val.startswith("/"):
            errors.append(f"Root-absolute '{field}' ({val!r}) in {rel_label}; use relative './'")

    icons = manifest.get("icons", [])
    if isinstance(icons, list):
        for idx, icon in enumerate(icons):
            if isinstance(icon, dict):
                src = icon.get("src")
                if isinstance(src, str) and src.startswith("/"):
                    errors.append(f"Root-absolute icons[{idx}].src ({src!r}) in {rel_label}")

    shortcuts = manifest.get("shortcuts", [])
    if isinstance(shortcuts, list):
        for s_idx, sc in enumerate(shortcuts):
            if not isinstance(sc, dict):
                continue
            sc_url = sc.get("url")
            if isinstance(sc_url, str) and sc_url.startswith("/"):
                errors.append(f"Root-absolute shortcuts[{s_idx}].url ({sc_url!r}) in {rel_label}")
            for i_idx, icon in enumerate(sc.get("icons", []) if isinstance(sc.get("icons"), list) else []):
                if isinstance(icon, dict):
                    src = icon.get("src")
                    if isinstance(src, str) and src.startswith("/"):
                        errors.append(
                            f"Root-absolute shortcuts[{s_idx}].icons[{i_idx}].src ({src!r}) in {rel_label}"
                        )


def _check_sw_relative(sw_path: Path, rel_label: str, errors: list[str]) -> None:
    raw = sw_path.read_text(encoding="utf-8", errors="replace")
    no_block = re.sub(r"/\*[\s\S]*?\*/", "", raw)
    no_comments = re.sub(r"(?m)^\s*//.*$", "", no_block)
    hits = sorted({m.group(0) for m in ROOT_ABS_JS_STR_RE.finditer(no_comments)})
    if hits:
        sample = ROOT_ABS_JS_STR_RE.search(no_comments)
        snippet = ""
        if sample:
            s_idx = max(0, sample.start() - 15)
            e_idx = min(len(no_comments), sample.end() + 25)
            snippet = no_comments[s_idx:e_idx].replace("\n", " ").strip()
        errors.append(f"Root-absolute path in {rel_label} (e.g. {snippet!r})")


def check_static_build(root: Path, errors: list[str], summary: list[str]) -> None:
    ui_dir = root / "workshop-ui"
    src_index = ui_dir / "index.html"
    dist_dir = ui_dir / "dist"
    dist_index = dist_dir / "index.html"

    # Zero Google Fonts in source HTML & src/**/*.{ts,tsx,css}
    font_scan_files: list[Path] = []
    if src_index.is_file():
        font_scan_files.append(src_index)
    src_dir = ui_dir / "src"
    if src_dir.is_dir():
        for ext in ("*.ts", "*.tsx", "*.css"):
            font_scan_files.extend(src_dir.rglob(ext))
    for fpath in font_scan_files:
        txt = fpath.read_text(encoding="utf-8", errors="replace")
        if "fonts.googleapis.com" in txt or "fonts.gstatic.com" in txt:
            errors.append(f"External Google Fonts reference in {fpath.relative_to(root)}")

    pub_manifest = ui_dir / "public" / "manifest.webmanifest"
    if pub_manifest.is_file():
        _check_manifest_relative(pub_manifest, "workshop-ui/public/manifest.webmanifest", errors)
    pub_sw = ui_dir / "public" / "sw.js"
    if pub_sw.is_file():
        _check_sw_relative(pub_sw, "workshop-ui/public/sw.js", errors)

    if not dist_index.is_file() or dist_index.stat().st_size < 100:
        errors.append("Missing or empty workshop-ui/dist/index.html")
        return

    dist_html = dist_index.read_text(encoding="utf-8")
    if "fonts.googleapis.com" in dist_html or "fonts.gstatic.com" in dist_html:
        errors.append("External Google Fonts reference in workshop-ui/dist/index.html")

    for attr_val in re.findall(r"""(?:src|href)=["']([^"']+)["']""", dist_html):
        if attr_val.startswith("data:") or attr_val.startswith("#"):
            continue
        if attr_val.startswith("http://") or attr_val.startswith("https://"):
            errors.append(f"External URL in workshop-ui/dist/index.html: {attr_val}")
            continue
        if attr_val.startswith("/"):
            errors.append(f"Root-absolute asset path in workshop-ui/dist/index.html: {attr_val}")
            continue
        clean_rel = unquote(attr_val.split("?", 1)[0].split("#", 1)[0])
        if clean_rel.startswith("./"):
            clean_rel = clean_rel[2:]
        if clean_rel and not (dist_dir / clean_rel).exists():
            errors.append(f"Missing built asset referenced by dist/index.html: {attr_val}")

    woff2_files = list(dist_dir.rglob("*.woff2"))
    if not woff2_files:
        errors.append("No local .woff2 font files found in workshop-ui/dist/")

    assets_dir = dist_dir / "assets"
    if assets_dir.is_dir():
        for js_file in sorted(assets_dir.glob("*.js")):
            sz = js_file.stat().st_size
            if sz > MAX_JS_CHUNK_BYTES:
                errors.append(
                    f"JS chunk exceeds 500 kB ({sz} bytes > {MAX_JS_CHUNK_BYTES}): {js_file.relative_to(root)}"
                )

    dist_manifest = dist_dir / "manifest.webmanifest"
    if dist_manifest.is_file():
        _check_manifest_relative(dist_manifest, "workshop-ui/dist/manifest.webmanifest", errors)
    elif pub_manifest.is_file():
        errors.append("Missing workshop-ui/dist/manifest.webmanifest")

    dist_sw = dist_dir / "sw.js"
    if dist_sw.is_file():
        _check_sw_relative(dist_sw, "workshop-ui/dist/sw.js", errors)
    elif pub_sw.is_file():
        errors.append("Missing workshop-ui/dist/sw.js")

    summary.append("Static ./ build, zero Google Fonts, local .woff2 fonts, and <=500 kB JS chunks verified")


_PPTX_API_CACHE: tuple[Any, Any, Any, Any, set[Any]] | None = None


def _pptx_api() -> tuple[Any, Any, Any, Any, set[Any]]:
    """Lazy-import python-pptx only when check_pptx actually runs."""
    global _PPTX_API_CACHE
    if _PPTX_API_CACHE is None:
        from pptx import Presentation
        from pptx.enum.shapes import MSO_SHAPE_TYPE, PP_PLACEHOLDER
        from pptx.oxml.ns import qn

        chrome = {
            PP_PLACEHOLDER.DATE,
            PP_PLACEHOLDER.FOOTER,
            PP_PLACEHOLDER.HEADER,
            PP_PLACEHOLDER.SLIDE_NUMBER,
        }
        _PPTX_API_CACHE = (Presentation, MSO_SHAPE_TYPE, PP_PLACEHOLDER, qn, chrome)
    return _PPTX_API_CACHE


def _sz_from_lst_style(lst_el: Any, lvl: int) -> float | None:
    if lst_el is None:
        return None
    _, _, _, qn, _ = _pptx_api()
    for tag_name in (f"a:lvl{lvl + 1}pPr", "a:defPPr"):
        p_pr = lst_el.find(qn(tag_name))
        if p_pr is not None:
            def_r_pr = p_pr.find(qn("a:defRPr"))
            if def_r_pr is not None and def_r_pr.get("sz") is not None:
                return int(def_r_pr.get("sz")) / 100.0
    return None


def _find_placeholder_match(container: Any, ph_idx: int | None, ph_type: Any) -> Any:
    _, _, PP_PLACEHOLDER, _, _ = _pptx_api()
    by_type = None
    for sh in container.shapes:
        if not sh.is_placeholder:
            continue
        pf = sh.placeholder_format
        if ph_idx is not None and pf.idx == ph_idx:
            return sh
        if by_type is None and ph_type is not None:
            norm_a = PP_PLACEHOLDER.TITLE if pf.type == PP_PLACEHOLDER.CENTER_TITLE else pf.type
            norm_b = PP_PLACEHOLDER.TITLE if ph_type == PP_PLACEHOLDER.CENTER_TITLE else ph_type
            if norm_a == norm_b:
                by_type = sh
    return by_type


def _resolve_run_pt(
    run: Any, paragraph: Any, shape: Any, slide: Any, prs: Any, cell: Any = None
) -> float | None:
    _, _, PP_PLACEHOLDER, qn, _ = _pptx_api()
    if run.font.size is not None:
        return float(run.font.size.pt)
    r_pr = run._r.find(qn("a:rPr"))
    if r_pr is not None and r_pr.get("sz") is not None:
        return int(r_pr.get("sz")) / 100.0

    if paragraph.font.size is not None:
        return float(paragraph.font.size.pt)
    p_pr = paragraph._p.find(qn("a:pPr"))
    if p_pr is not None:
        def_r_pr = p_pr.find(qn("a:defRPr"))
        if def_r_pr is not None and def_r_pr.get("sz") is not None:
            return int(def_r_pr.get("sz")) / 100.0

    lvl = paragraph.level or 0
    layout = slide.slide_layout
    master = layout.slide_master

    if cell is not None and getattr(cell, "_tc", None) is not None:
        cell_tx_body = cell._tc.find(qn("a:txBody"))
        if cell_tx_body is not None:
            pt = _sz_from_lst_style(cell_tx_body.find(qn("a:lstStyle")), lvl)
            if pt is not None:
                return pt

    if shape is not None and getattr(shape, "has_text_frame", False):
        tx_body = shape._element.find(qn("p:txBody"))
        if tx_body is None:
            tx_body = shape._element.find(qn("a:txBody"))
        if tx_body is not None:
            pt = _sz_from_lst_style(tx_body.find(qn("a:lstStyle")), lvl)
            if pt is not None:
                return pt

    if shape is not None and getattr(shape, "is_placeholder", False):
        pf = shape.placeholder_format
        ph_idx = pf.idx
        ph_type = pf.type

        layout_ph = _find_placeholder_match(layout, ph_idx, ph_type)
        if layout_ph is not None:
            l_tx = layout_ph._element.find(qn("p:txBody"))
            if l_tx is not None:
                pt = _sz_from_lst_style(l_tx.find(qn("a:lstStyle")), lvl)
                if pt is not None:
                    return pt

        master_ph = _find_placeholder_match(master, ph_idx, ph_type)
        if master_ph is not None:
            m_tx = master_ph._element.find(qn("p:txBody"))
            if m_tx is not None:
                pt = _sz_from_lst_style(m_tx.find(qn("a:lstStyle")), lvl)
                if pt is not None:
                    return pt

        tx_styles = master._element.find(qn("p:txStyles"))
        if tx_styles is not None:
            if ph_type in (PP_PLACEHOLDER.TITLE, PP_PLACEHOLDER.CENTER_TITLE):
                style_tag = "p:titleStyle"
            elif ph_type in (PP_PLACEHOLDER.BODY, PP_PLACEHOLDER.SUBTITLE, PP_PLACEHOLDER.OBJECT):
                style_tag = "p:bodyStyle"
            else:
                style_tag = "p:otherStyle"
            pt = _sz_from_lst_style(tx_styles.find(qn(style_tag)), lvl)
            if pt is not None:
                return pt
    else:
        tx_styles = master._element.find(qn("p:txStyles"))
        if tx_styles is not None:
            pt = _sz_from_lst_style(tx_styles.find(qn("p:otherStyle")), lvl)
            if pt is not None:
                return pt

    default_style = prs._element.find(qn("p:defaultTextStyle"))
    pt = _sz_from_lst_style(default_style, lvl)
    if pt is not None:
        return pt

    return None


def _check_pptx_shapes(
    shapes: Any, slide_idx: int, slide: Any, prs: Any, errors: list[str]
) -> None:
    _, MSO_SHAPE_TYPE, _, _, CHROME_PLACEHOLDERS = _pptx_api()
    for shape in shapes:
        if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
            _check_pptx_shapes(shape.shapes, slide_idx, slide, prs, errors)
            continue

        if getattr(shape, "is_placeholder", False):
            if shape.placeholder_format.type in CHROME_PLACEHOLDERS:
                continue

        if shape.has_table:
            for row in shape.table.rows:
                for cell in row.cells:
                    for paragraph in cell.text_frame.paragraphs:
                        for run in paragraph.runs:
                            if not run.text.strip():
                                continue
                            pt = _resolve_run_pt(run, paragraph, shape, slide, prs, cell=cell)
                            if pt is None or pt < 22.0:
                                snippet = run.text.strip()[:40]
                                errors.append(
                                    f"PPTX slide {slide_idx} table cell text {snippet!r} has font size {pt} pt (< 22pt)"
                                )

        if shape.has_text_frame:
            for paragraph in shape.text_frame.paragraphs:
                for run in paragraph.runs:
                    if not run.text.strip():
                        continue
                    pt = _resolve_run_pt(run, paragraph, shape, slide, prs)
                    if pt is None or pt < 22.0:
                        snippet = run.text.strip()[:40]
                        errors.append(
                            f"PPTX slide {slide_idx} shape {shape.name!r} text {snippet!r} has font size {pt} pt (< 22pt)"
                        )


PPTX_LEGACY_PHRASES = (
    "track " + "a",
    "track " + "b",
    "track-" + "wahl",
    "wahl-" + "mission",
    "mission " + "a",
    "mission " + "b",
    "mission " + "c",
    "mission " + "d",
    "send_" + "to_beamer",
    "submit-" + "question",
    "live-" + "questions",
    "/api/" + "submissions",
    "/api/" + "events",
    "beamer" + "_url",
    "beamer" + "sendsheet",
    "live-" + "wall",
    "beamer-" + "feed",
    "live-" + "beamer-gimmick",
    "live-" + "gimmick",
    "beamer-" + "live-server",
    "beamer-" + "server",
    "regie-" + "backend",
    "issue-" + "watcher",
    "dual-" + "modus",
    "langdock-" + "demo-stil",
)


def _collect_pptx_texts(shapes: Any) -> list[str]:
    _, MSO_SHAPE_TYPE, _, _, _ = _pptx_api()
    texts: list[str] = []
    for shape in shapes:
        if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
            texts.extend(_collect_pptx_texts(shape.shapes))
            continue
        if shape.has_table:
            for row in shape.table.rows:
                for cell in row.cells:
                    if cell.text_frame and cell.text_frame.text:
                        texts.append(cell.text_frame.text)
        if shape.has_text_frame and shape.text_frame.text:
            texts.append(shape.text_frame.text)
    return texts


def check_pptx(root: Path, errors: list[str], summary: list[str]) -> None:
    pptx_path = root / "presentation" / "CCF_HandsOn_Prompt_Werkstatt.pptx"
    if not pptx_path.is_file():
        errors.append("Missing presentation/CCF_HandsOn_Prompt_Werkstatt.pptx")
        return

    Presentation, _, _, _, _ = _pptx_api()
    prs = Presentation(str(pptx_path))
    if len(prs.slides) != 6:
        errors.append(f"Expected 6 PPTX slides, got {len(prs.slides)}")

    for idx, slide in enumerate(prs.slides, start=1):
        notes_tf = slide.notes_slide.notes_text_frame if slide.has_notes_slide else None
        notes_txt = notes_tf.text if notes_tf is not None else ""
        if not notes_txt.strip():
            errors.append(f"Missing speaker notes on PPTX slide {idx}")
        _check_pptx_shapes(slide.shapes, idx, slide, prs, errors)

        slide_texts = _collect_pptx_texts(slide.shapes)
        combined = "\n".join([*slide_texts, notes_txt])
        combined_low = combined.lower()
        for token in FORBIDDEN_REMNANT_STRINGS:
            if token in combined:
                errors.append(f"PPTX slide {idx} contains forbidden remnant string {token!r}")
        for label, rx in R5_AVOIDED_TERM_PATTERNS:
            if rx.search(combined):
                errors.append(f"PPTX slide {idx} contains R5 avoided term ({label})")
        for phrase in PPTX_LEGACY_PHRASES:
            if phrase in combined_low:
                errors.append(f"PPTX slide {idx} contains legacy phrase {phrase!r}")

    summary.append("PPTX (6 slides, speaker notes, >= 22pt typography, 0 legacy/forbidden terms) checked")


def check_remnants(
    root: Path, skip_build: bool, errors: list[str], summary: list[str]
) -> None:
    for removed_rel in (
        "live-questions",
        "mcp-server/submit-question.mjs",
        "workshop-ui/src/components/BeamerSendSheet.tsx",
    ):
        if (root / removed_rel).exists():
            errors.append(f"Live-wall remnant path still exists: {removed_rel}")

    scan_files: list[Path] = []
    explicit_files = [
        root / "workshop-ui" / "server.mjs",
        root / "workshop-ui" / "index.html",
        root / "scripts" / "export_ui_data.py",
        root / "scripts" / "build_presentation.py",
        root / ".mcp.json",
        root / ".cursor" / "mcp.json",
        root / ".github" / "copilot-instructions.md",
        root / "opencode.json",
        root / ".gemini" / "settings.json",
        root / ".codex" / "config.toml",
        root / ".vscode" / "mcp.json",
        root / "stufe-2-skills-guardrails" / ".github" / "copilot-instructions.md",
        root / "stufe-3-obsidian-vault" / ".mcp.json",
        root / "stufe-3-obsidian-vault" / ".cursor" / "mcp.json",
        root / "stufe-3-obsidian-vault" / ".github" / "copilot-instructions.md",
        root / "stufe-3-obsidian-vault" / "opencode.json",
        root / "stufe-3-obsidian-vault" / ".gemini" / "settings.json",
        root / "stufe-3-obsidian-vault" / ".codex" / "config.toml",
        root / "stufe-3-obsidian-vault" / ".vscode" / "mcp.json",
        root / "modules" / "context-engineering-projekt" / ".cursor" / "mcp.json",
        root / "modules" / "context-engineering-projekt" / ".github" / "copilot-instructions.md",
        root / "AGENTS.md",
        root / "README.md",
        root / "aufgaben.md",
        root / "LOESUNGEN_TRAINER.md",
    ]
    for p in explicit_files:
        if p.is_file():
            scan_files.append(p)
    for pat in ("start-workshop.*", "start-beamer.*"):
        for p in root.glob(pat):
            if p.is_file():
                scan_files.append(p)

    scan_dirs = [
        root / "mcp-server",
        root / "workshop-ui" / "src",
        root / "workshop-ui" / "public",
    ]
    if not skip_build:
        scan_dirs.append(root / "workshop-ui" / "dist")

    text_exts = {".mjs", ".js", ".ts", ".tsx", ".json", ".toml", ".md", ".html", ".css", ".bat", ".sh", ".py", ".webmanifest"}
    for sdir in scan_dirs:
        if not sdir.is_dir():
            continue
        for p in sdir.rglob("*"):
            if not p.is_file():
                continue
            rel_parts = p.relative_to(root).parts
            if "node_modules" in rel_parts or ".git" in rel_parts:
                continue
            if len(rel_parts) >= 2 and rel_parts[0] == "docs" and rel_parts[1] == "adr":
                continue
            if p.name.endswith(".tsbuildinfo"):
                continue
            if p.suffix.lower() in text_exts:
                scan_files.append(p)

    seen: set[Path] = set()
    for fpath in scan_files:
        res = fpath.resolve()
        if res in seen:
            continue
        seen.add(res)
        rel = fpath.relative_to(root)
        if rel.as_posix() == "scripts/verify_workshop.py":
            continue
        if rel.as_posix().startswith("docs/adr/"):
            continue
        txt = fpath.read_text(encoding="utf-8", errors="replace")
        for token in FORBIDDEN_REMNANT_STRINGS:
            if token in txt:
                errors.append(f"Forbidden live-wall remnant {token!r} in {rel.as_posix()}")

    summary.append("Live-wall remnant absence verified across active files (excluding docs/adr/)")


def _check_express_packages(data: dict[str, Any], errors: list[str]) -> None:
    candidates: list[tuple[str | None, str, str, str | None]] = []
    seen_express_ids: set[str] = set()
    for key in ("expressPacks", "expressPackages", "compactPackages", "compactPacks"):
        val = data.get(key)
        if isinstance(val, dict):
            for k, v in val.items():
                pkg_id = v.get("id") if isinstance(v, dict) and isinstance(v.get("id"), str) else (k if isinstance(k, str) else None)
                if key == "expressPackages" and pkg_id:
                    seen_express_ids.add(pkg_id)
                if isinstance(v, str):
                    candidates.append((pkg_id, f"{key}.{k}", v, None))
                elif isinstance(v, dict):
                    hdr = v.get("promptHeaderTemplate")
                    for sub_k in ("text", "content", "payload", "bundle", "promptWithText"):
                        if isinstance(v.get(sub_k), str):
                            candidates.append((pkg_id, f"{key}.{k}.{sub_k}", v[sub_k], hdr if isinstance(hdr, str) else None))
        elif isinstance(val, list):
            for idx, item in enumerate(val):
                if isinstance(item, str):
                    candidates.append((None, f"{key}[{idx}]", item, None))
                elif isinstance(item, dict):
                    pkg_id = item.get("id") if isinstance(item.get("id"), str) else None
                    if key == "expressPackages" and pkg_id:
                        seen_express_ids.add(pkg_id)
                    hdr = item.get("promptHeaderTemplate")
                    for sub_k in ("text", "content", "payload", "bundle", "promptWithText"):
                        if isinstance(item.get(sub_k), str):
                            candidates.append((pkg_id, f"{key}[{idx}].{sub_k}", item[sub_k], hdr if isinstance(hdr, str) else None))

    for list_key in ("stages", "promptMethods"):
        items = data.get(list_key)
        if isinstance(items, list):
            for idx, item in enumerate(items):
                if not isinstance(item, dict):
                    continue
                for sub_k in ("expressPack", "expressPackage", "compactPackage", "compactBundle"):
                    if isinstance(item.get(sub_k), str):
                        candidates.append((None, f"{list_key}[{idx}].{sub_k}", item[sub_k], None))

    if not candidates:
        errors.append(
            "workshopData.json missing express packages (expected expressPacks/expressPackages or stage/method compact package)"
        )
        return

    missing_pkg_ids = {"methods", "stages-arctic-reef"} - seen_express_ids
    if missing_pkg_ids:
        errors.append(
            f"workshopData.json expressPackages missing required ids: {sorted(missing_pkg_ids)}"
        )

    expected_keywords: dict[str, tuple[str, ...]] = {
        "methods": ("squalen", "2030", "zooxanthellen", "abgestoßen", "29"),
        "stages-arctic-reef": (
            "squalen",
            "hydrophob",
            "lichtleiter",
            "hocharktis",
            "sialinsäuren",
            "ektosymbiose",
            "endosymbiose",
            "zooxanthellen",
            "29",
            "acht wochen",
        ),
    }

    tag_re = re.compile(r"\([a-z0-9-]+\.md\)", re.I)
    for pkg_id, label, text, prompt_hdr in candidates:
        text_len = len(text.strip())
        if text_len < 3500:
            errors.append(f"Express package {label} too short ({text_len} chars < 3500)")
        if len(text) > 7500:
            errors.append(f"Express package {label} exceeds compact ceiling ({len(text)} chars > 7500)")
        if not tag_re.search(text):
            errors.append(f"Express package {label} missing (slug.md) source tags")
        if pkg_id in expected_keywords:
            low = text.lower()
            missing_kw = [kw for kw in expected_keywords[pkg_id] if kw not in low]
            if missing_kw:
                errors.append(
                    f"Express package {pkg_id} ({label}) missing factual benchmark keywords: {missing_kw}"
                )
        if prompt_hdr is not None:
            if not prompt_hdr.lstrip().startswith("{{PROMPT}}"):
                errors.append(f"Express package {label} promptHeaderTemplate must start with {{{{PROMPT}}}}")
        else:
            marker_pos = -1
            for marker in ("===", "---", "(eisbaer.md)", "(arktis.md)", "(korallenbleiche.md)"):
                pos = text.find(marker)
                if pos != -1 and (marker_pos == -1 or pos < marker_pos):
                    marker_pos = pos
            if marker_pos == 0:
                errors.append(f"Express package {label} must put prompt at top before article excerpts")


def check_corpus_engine_and_ui_data(
    root: Path, slugs: set[str], skip_node: bool, errors: list[str], summary: list[str]
) -> None:
    engine_path = root / "shared" / "corpus-engine.mjs"
    if not engine_path.is_file():
        errors.append("Missing shared/corpus-engine.mjs")

    mod_pub_dir = root / "workshop-ui" / "public" / "modules" / "prompt-werkstatt-tierwelt"
    data_path = mod_pub_dir / "data.json"
    if not data_path.is_file():
        errors.append("Missing workshop-ui/public/modules/prompt-werkstatt-tierwelt/data.json")
        return

    dist_mod_data = root / "workshop-ui" / "dist" / "modules" / "prompt-werkstatt-tierwelt" / "data.json"
    if not dist_mod_data.is_file():
        errors.append("Missing built module bundle workshop-ui/dist/modules/prompt-werkstatt-tierwelt/data.json")

    try:
        data = json.loads(data_path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"Invalid JSON in {data_path.relative_to(root)}: {exc}")
        return

    meta = data.get("meta", {})
    if meta.get("articleCount") != 68:
        errors.append(f"L1 module data.json meta.articleCount must be 68, got {meta.get('articleCount')!r}")

    search_index_path = mod_pub_dir / "searchIndex.json"
    search_index: dict[str, str] = {}
    has_search_index_file = search_index_path.is_file()
    if has_search_index_file:
        try:
            loaded_idx = json.loads(search_index_path.read_text(encoding="utf-8"))
            if not isinstance(loaded_idx, dict):
                errors.append("L1 module searchIndex.json must be a JSON object mapping slug -> body text")
            else:
                search_index = {str(k): str(v) for k, v in loaded_idx.items()}
                if slugs and set(search_index.keys()) != slugs:
                    errors.append(
                        f"searchIndex.json slug mismatch: missing={sorted(slugs - set(search_index.keys()))[:5]}, extra={sorted(set(search_index.keys()) - slugs)[:5]}"
                    )
        except Exception as exc:
            errors.append(f"Invalid JSON in searchIndex.json: {exc}")

    vault_articles = data.get("vaultArticles", [])
    if not isinstance(vault_articles, list) or len(vault_articles) != 68:
        errors.append(
            f"L1 module data.json vaultArticles must have 68 entries, got {len(vault_articles) if isinstance(vault_articles, list) else type(vault_articles).__name__}"
        )
    else:
        ui_slugs = {a.get("slug") for a in vault_articles if isinstance(a, dict)}
        if slugs and ui_slugs != slugs:
            errors.append(
                f"L1 module data.json vaultArticles slug mismatch: missing={sorted(slugs - ui_slugs)[:5]}"
            )
        for spot in ("walross", "alpensteinbock", "eisbaer", "korallenbleiche"):
            if spot not in ui_slugs:
                errors.append(f"L1 module data.json vaultArticles missing spot-check slug {spot!r}")

        short_bodies: list[str] = []
        for art in vault_articles:
            if not isinstance(art, dict):
                continue
            art_slug = str(art.get("slug", ""))
            inline_body = str(art.get("body") or art.get("content") or art.get("searchText") or "")
            eff_body = search_index.get(art_slug, "") or inline_body
            if len(eff_body.strip()) < 500:
                short_bodies.append(f"{art_slug}({len(eff_body.strip())})")
        if short_bodies:
            if not has_search_index_file:
                errors.append(
                    f"Missing L1 searchIndex.json and {len(short_bodies)} vaultArticles lack full body (>=500 chars): {short_bodies[:8]}"
                )
            else:
                errors.append(
                    f"Full-text corpus body too short (<500 chars) for {len(short_bodies)} articles: {short_bodies[:8]}"
                )

    _check_express_packages(data, errors)

    if skip_node or not engine_path.is_file():
        summary.append("workshopData.json schema & 68-article parity checked (Node engine check skipped/unavailable)")
        return

    node_bin = shutil.which("node")
    if not node_bin:
        errors.append("Node binary not found on PATH (required for shared/corpus-engine.mjs check)")
        return

    node_script = r"""
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.VERIFY_ROOT;
const engineMod = await import(pathToFileURL(path.join(root, "shared", "corpus-engine.mjs")).href);
const { parseFrontmatter, searchCorpus, verifyClaim } = engineMod;

if (typeof searchCorpus !== "function" || typeof verifyClaim !== "function") {
  throw new Error("shared/corpus-engine.mjs must export searchCorpus and verifyClaim");
}

function walkMd(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out.sort();
}

const wikiDir = path.join(root, "stufe-3-obsidian-vault", "wiki");
const wikiFiles = walkMd(wikiDir);
const wikiArticles = wikiFiles.map((filePath) => {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = typeof parseFrontmatter === "function" ? parseFrontmatter(raw) : null;
  const fm = (parsed && (parsed.frontmatter || parsed.meta || parsed.data)) || {};
  const body = (parsed && parsed.body) || raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  const slug = path.basename(filePath, ".md");
  return {
    slug,
    title: fm.title || slug,
    category: fm.category || path.basename(path.dirname(filePath)),
    habitat: fm.habitat || "",
    rel_path: path.relative(path.join(root, "stufe-3-obsidian-vault"), filePath).replace(/\\/g, "/"),
    source_file: fm.source_file || `raw/${slug}.md`,
    body,
  };
});

const modPubDir = path.join(root, "workshop-ui", "public", "modules", "prompt-werkstatt-tierwelt");
const uiData = JSON.parse(
  fs.readFileSync(path.join(modPubDir, "data.json"), "utf8")
);
const searchIndexPath = path.join(modPubDir, "searchIndex.json");
const searchIndex = fs.existsSync(searchIndexPath)
  ? JSON.parse(fs.readFileSync(searchIndexPath, "utf8"))
  : {};
const uiArticles = (uiData.vaultArticles || []).map((a) => ({
  slug: a.slug,
  title: a.title || a.slug,
  category: a.category || "",
  habitat: a.habitat || "",
  rel_path: a.rel_path || `wiki/${a.slug}.md`,
  source_file: a.source_file || `raw/${a.slug}.md`,
  body: searchIndex[a.slug] || a.body || a.content || a.searchText || "",
}));

const failures = [];
function runChecks(label, articles) {
  if (articles.length !== 68) {
    failures.push(`${label}: expected 68 articles, got ${articles.length}`);
  }
  const short = articles.filter((a) => String(a.body || "").trim().length < 500).map((a) => a.slug);
  if (short.length) {
    failures.push(`${label}: ${short.length} articles have body < 500 chars (${short.slice(0, 5).join(", ")})`);
  }
  const eisSearch = searchCorpus(articles, "Eisbär schwarze Haut Squalen", 5);
  if (!eisSearch.length || eisSearch[0].slug !== "eisbaer") {
    failures.push(`${label}: search 'Eisbär schwarze Haut Squalen' top=${eisSearch[0]?.slug}`);
  }
  const walSearch = searchCorpus(articles, "Walross", 5);
  if (!walSearch.length || walSearch[0].slug !== "walross") {
    failures.push(`${label}: search 'Walross' top=${walSearch[0]?.slug}`);
  }
  const walBody = searchCorpus(articles, "Stoßzähnen Borstenbart", 5);
  if (!walBody.length || walBody[0].slug !== "walross") {
    failures.push(`${label}: body-only search 'Stoßzähnen Borstenbart' top=${walBody[0]?.slug}`);
  }
  const alpSearch = searchCorpus(articles, "Alpensteinbock", 5);
  if (!alpSearch.length || alpSearch[0].slug !== "alpensteinbock") {
    failures.push(`${label}: search 'Alpensteinbock' top=${alpSearch[0]?.slug}`);
  }
  const alpBody = searchCorpus(articles, "Rotmoosferner Ziegenbart", 5);
  if (!alpBody.length || alpBody[0].slug !== "alpensteinbock") {
    failures.push(`${label}: body-only search 'Rotmoosferner Ziegenbart' top=${alpBody[0]?.slug}`);
  }
  const q1 = verifyClaim(
    articles,
    "Der Eisbär hat unter seinem Fell schwarze Haut und besitzt 42 Zähne."
  );
  if (q1?.status !== "belegt" || !(q1.evidence || []).some((e) => e.slug === "eisbaer")) {
    failures.push(`${label}: Q1 polar bear verifyClaim failed (${JSON.stringify(q1?.status)})`);
  }
  const contraSqualen = verifyClaim(
    articles,
    "Der Eisbär produziert im Fettgewebe Squalen."
  );
  if (contraSqualen?.status !== "widerspruch") {
    failures.push(`${label}: Q1 Squalen contradiction expected widerspruch, got ${contraSqualen?.status}`);
  }
  const contraTeeth = verifyClaim(
    articles,
    "Der Eisbär hat 38 Zähne."
  );
  if (contraTeeth?.status !== "widerspruch") {
    failures.push(`${label}: teeth contradiction expected widerspruch, got ${contraTeeth?.status}`);
  }
  const trap = verifyClaim(
    articles,
    "Im Schweizerischen Nationalpark leben 45 Schneeleoparden und ein Ticket kostet 25 Euro."
  );
  if (trap?.status !== "nicht_belegt" || (trap.evidence || []).length !== 0) {
    failures.push(
      `${label}: Q3 snow leopard trap expected nicht_belegt with 0 hits, got ${trap?.status} (${(trap?.evidence || []).length})`
    );
  }
}

runChecks("wiki", wikiArticles);
runChecks("workshopData", uiArticles);

if (failures.length) {
  console.error(JSON.stringify(failures));
  process.exit(1);
}
console.log("NODE_CORPUS_ENGINE_OK");
"""
    env = {**os.environ, "VERIFY_ROOT": str(root)}
    proc = subprocess.run(
        [node_bin, "--input-type=module", "-e", node_script],
        capture_output=True,
        text=True,
        encoding="utf-8",
        env=env,
        timeout=20,
    )
    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "").strip()
        errors.append(f"Node corpus-engine check failed: {detail}")
    else:
        summary.append("shared/corpus-engine.mjs + workshopData.json 68-article search & verify parity verified")


def run_verification(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    errors: list[str] = []
    summary: list[str] = []

    check_personal_paths(root, errors, summary)
    check_multi_cli_and_mirrors(root, errors, summary)
    slugs, _ = check_corpus_and_vault(root, errors, summary)
    check_docs_adr_ci(root, errors, summary)
    if not args.skip_build:
        check_static_build(root, errors, summary)
    if not args.skip_pptx:
        check_pptx(root, errors, summary)
    check_remnants(root, args.skip_build, errors, summary)
    check_corpus_engine_and_ui_data(root, slugs, args.skip_node, errors, summary)

    if args.json:
        print(json.dumps({"ok": len(errors) == 0, "errors": errors, "summary": summary}, ensure_ascii=False, indent=2))
        return 0 if not errors else 1

    if errors:
        print("VERIFICATION FAILED:")
        for e in errors:
            print(" -", e)
        return 1

    print("ALL WORKSHOP VERIFICATION CHECKS PASSED!")
    for item in summary:
        print(f"  - {item}")
    return 0


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Verify the virtual7 CCF Prompt-Werkstatt repository (R1-R5 invariants)."
    )
    parser.add_argument(
        "--root",
        default=str(Path(__file__).resolve().parent.parent),
        help="Repository root directory (default: parent of scripts/).",
    )
    parser.add_argument("--skip-build", action="store_true", help="Skip workshop-ui/dist/ static build checks.")
    parser.add_argument("--skip-pptx", action="store_true", help="Skip presentation PPTX checks.")
    parser.add_argument("--skip-node", action="store_true", help="Skip Node ESM corpus-engine.mjs subprocess check.")
    parser.add_argument("--json", action="store_true", help="Output verification result as JSON.")
    return parser


def main() -> None:
    args = build_arg_parser().parse_args()
    raise SystemExit(run_verification(args))


if __name__ == "__main__":
    main()
