#!/usr/bin/env python3
"""Fetch and clean 68 German Wikipedia articles for the virtual7 CCF AI Workshop.

Outputs identical flat Markdown files into:
- stufe-1-chaos/docs/
- stufe-2-skills-guardrails/docs/
- stufe-3-obsidian-vault/raw/
and saves structured metadata into scripts/corpus_manifest.json.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parent.parent
STAGES_FLAT_DIRS = [
    ROOT / "stufe-1-chaos" / "docs",
    ROOT / "stufe-2-skills-guardrails" / "docs",
    ROOT / "stufe-3-obsidian-vault" / "raw",
]
MANIFEST_PATH = ROOT / "scripts" / "corpus_manifest.json"

WIKI_API = "https://de.wikipedia.org/w/api.php"
HEADERS = {
    "User-Agent": "virtual7-CCF-KI-Workshop-Builder/1.0 (https://virtual7.de; workshop@example.org)"
}

STOP_SECTIONS = {
    "literatur",
    "weblinks",
    "einzelnachweise",
    "siehe auch",
    "film",
    "filme",
    "quellen",
    "anmerkungen",
    "belege",
    "dokumentationen",
    "ausstellungen",
    "sonstiges",
    "rezeption",
}

# 5 Habitats + 48 Species + 15 Ecological Concepts = 68 Articles
CORPUS_SPEC: list[dict[str, Any]] = [
    # --- 5 Lebensräume ---
    {"slug": "arktis", "titles": ["Arktis"], "category": "lebensraum", "habitat": "Arktis", "tags": ["lebensraum", "polar", "meereis"]},
    {"slug": "tropischer-regenwald", "titles": ["Tropischer Regenwald"], "category": "lebensraum", "habitat": "Tropischer Regenwald", "tags": ["lebensraum", "tropen", "wald"]},
    {"slug": "korallenriff", "titles": ["Korallenriff"], "category": "lebensraum", "habitat": "Korallenriff", "tags": ["lebensraum", "ozean", "riff"]},
    {"slug": "alpen", "titles": ["Alpen"], "category": "lebensraum", "habitat": "Alpen", "tags": ["lebensraum", "hochgebirge", "europa"]},
    {"slug": "savanne", "titles": ["Savanne"], "category": "lebensraum", "habitat": "Savanne", "tags": ["lebensraum", "grasland", "afrika"]},

    # --- 10 Tierarten: Arktis ---
    {"slug": "eisbaer", "titles": ["Eisbär"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "raubtier", "arktis"]},
    {"slug": "polarfuchs", "titles": ["Polarfuchs"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "raubtier", "arktis"]},
    {"slug": "ringelrobbe", "titles": ["Ringelrobbe"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "robbe", "arktis"]},
    {"slug": "walross", "titles": ["Walross"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "robbe", "arktis"]},
    {"slug": "narwal", "titles": ["Narwal"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "wal", "arktis"]},
    {"slug": "schneeeule", "titles": ["Schneeeule"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "vogel", "arktis"]},
    {"slug": "ren", "titles": ["Ren"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "hirsch", "arktis"]},
    {"slug": "moschusochse", "titles": ["Moschusochse"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "huftier", "arktis"]},
    {"slug": "weisswal", "titles": ["Weißwal"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "wal", "arktis"]},
    {"slug": "lemminge", "titles": ["Echte Lemminge", "Lemminge", "Berglemming"], "category": "tierart", "habitat": "Arktis", "tags": ["tierart", "nagetier", "arktis"]},

    # --- 10 Tierarten: Tropischer Regenwald ---
    {"slug": "jaguar", "titles": ["Jaguar"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "raubkatze", "regenwald"]},
    {"slug": "faultiere", "titles": ["Faultiere"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "saeugetier", "regenwald"]},
    {"slug": "baumsteigerfroesche", "titles": ["Baumsteigerfrösche"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "amphibie", "regenwald"]},
    {"slug": "harpyie", "titles": ["Harpyie (Vogel)"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "greifvogel", "regenwald"]},
    {"slug": "blattschneiderameisen", "titles": ["Blattschneiderameisen"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "insekt", "regenwald"]},
    {"slug": "riesentukan", "titles": ["Riesentukan"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "vogel", "regenwald"]},
    {"slug": "grosse-anakonda", "titles": ["Große Anakonda", "Anakondas"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "schlange", "regenwald"]},
    {"slug": "orang-utans", "titles": ["Orang-Utans"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "primat", "regenwald"]},
    {"slug": "kapuzineraffen", "titles": ["Kapuzineraffen"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "primat", "regenwald"]},
    {"slug": "morphofalter", "titles": ["Morphofalter", "Himmelsfalter"], "category": "tierart", "habitat": "Tropischer Regenwald", "tags": ["tierart", "schmetterling", "regenwald"]},

    # --- 10 Tierarten: Korallenriff ---
    {"slug": "anemonenfische", "titles": ["Anemonenfische"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "fisch", "korallenriff"]},
    {"slug": "seeanemonen", "titles": ["Seeanemonen"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "nesseltier", "korallenriff"]},
    {"slug": "gruene-meeresschildkroete", "titles": ["Grüne Meeresschildkröte"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "reptil", "korallenriff"]},
    {"slug": "schwarzspitzen-riffhai", "titles": ["Schwarzspitzen-Riffhai"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "hai", "korallenriff"]},
    {"slug": "riesenmanta", "titles": ["Riesenmanta", "Teufelsrochen"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "rochen", "korallenriff"]},
    {"slug": "kraken", "titles": ["Kraken"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "kopffuesser", "korallenriff"]},
    {"slug": "steinkorallen", "titles": ["Steinkorallen"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "koralle", "korallenriff"]},
    {"slug": "papageifische", "titles": ["Papageifische"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "fisch", "korallenriff"]},
    {"slug": "seepferdchen", "titles": ["Seepferdchen"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "fisch", "korallenriff"]},
    {"slug": "dornenkronenseestern", "titles": ["Dornenkronenseestern"], "category": "tierart", "habitat": "Korallenriff", "tags": ["tierart", "stachelhaeuter", "korallenriff"]},

    # --- 9 Tierarten: Alpen ---
    {"slug": "alpensteinbock", "titles": ["Alpensteinbock"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "huftier", "alpen"]},
    {"slug": "alpenmurmeltier", "titles": ["Alpenmurmeltier"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "nagetier", "alpen"]},
    {"slug": "steinadler", "titles": ["Steinadler"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "greifvogel", "alpen"]},
    {"slug": "gaemse", "titles": ["Gämse"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "huftier", "alpen"]},
    {"slug": "bartgeier", "titles": ["Bartgeier"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "greifvogel", "alpen"]},
    {"slug": "schneehase", "titles": ["Schneehase"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "hasenart", "alpen"]},
    {"slug": "alpensalamander", "titles": ["Alpensalamander"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "amphibie", "alpen"]},
    {"slug": "eurasischer-luchs", "titles": ["Eurasischer Luchs"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "raubkatze", "alpen"]},
    {"slug": "alpenschneehuhn", "titles": ["Alpenschneehuhn"], "category": "tierart", "habitat": "Alpen", "tags": ["tierart", "vogel", "alpen"]},

    # --- 9 Tierarten: Savanne ---
    {"slug": "afrikanischer-elefant", "titles": ["Afrikanischer Elefant"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "saeugetier", "savanne"]},
    {"slug": "loewe", "titles": ["Löwe"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "raubkatze", "savanne"]},
    {"slug": "gepard", "titles": ["Gepard"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "raubkatze", "savanne"]},
    {"slug": "giraffen", "titles": ["Giraffen", "Giraffe"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "huftier", "savanne"]},
    {"slug": "steppenzebra", "titles": ["Steppenzebra"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "huftier", "savanne"]},
    {"slug": "streifengnu", "titles": ["Streifengnu"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "huftier", "savanne"]},
    {"slug": "tuepfelhyaene", "titles": ["Tüpfelhyäne"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "raubtier", "savanne"]},
    {"slug": "erdmaennchen", "titles": ["Erdmännchen"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "raubtier", "savanne"]},
    {"slug": "termiten", "titles": ["Termiten"], "category": "tierart", "habitat": "Savanne", "tags": ["tierart", "insekt", "savanne"]},

    # --- 15 Konzepte ---
    {"slug": "symbiose", "titles": ["Symbiose"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "interaktion", "oekologie"]},
    {"slug": "nahrungskette", "titles": ["Nahrungskette"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "trophie", "oekologie"]},
    {"slug": "raeuber-beute-beziehung", "titles": ["Räuber-Beute-Beziehung"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "trophie", "oekologie"]},
    {"slug": "tarnung-biologie", "titles": ["Tarnung (Biologie)"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "anpassung", "oekologie"]},
    {"slug": "mimikry", "titles": ["Mimikry"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "anpassung", "oekologie"]},
    {"slug": "invasive-art", "titles": ["Invasive Art", "Biologische Invasion"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "artenschutz", "oekologie"]},
    {"slug": "artensterben", "titles": ["Artensterben", "Massenaussterben"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "artenschutz", "oekologie"]},
    {"slug": "biodiversitaet", "titles": ["Biodiversität"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "vielfalt", "oekologie"]},
    {"slug": "klimawandel", "titles": ["Klimawandel"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "klima", "oekologie"]},
    {"slug": "korallenbleiche", "titles": ["Korallenbleiche"], "category": "konzept", "habitat": "Korallenriff", "tags": ["konzept", "korallenriff", "klima"]},
    {"slug": "winterschlaf", "titles": ["Winterschlaf"], "category": "konzept", "habitat": "Alpen", "tags": ["konzept", "anpassung", "winter"]},
    {"slug": "vogelzug", "titles": ["Vogelzug"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "migration", "voegel"]},
    {"slug": "schluesselart", "titles": ["Schlüsselart"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "oekosystem", "trophie"]},
    {"slug": "oekosystem", "titles": ["Ökosystem"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "grundlage", "oekologie"]},
    {"slug": "rote-liste-gefaehrdeter-arten", "titles": ["Rote Liste gefährdeter Arten"], "category": "konzept", "habitat": "Übergreifend", "tags": ["konzept", "artenschutz", "iucn"]},
]


def fetch_wikipedia_article(title: str) -> dict[str, Any] | None:
    """Query Wikipedia DE API for plain-text extract, URL and categories."""
    params = {
        "action": "query",
        "titles": title,
        "prop": "extracts|info|categories",
        "explaintext": "1",
        "inprop": "url",
        "cllimit": "max",
        "redirects": "1",
        "format": "json",
        "formatversion": "2",
    }
    resp = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    data = resp.json()
    pages = data.get("query", {}).get("pages", [])
    if not pages:
        return None
    page = pages[0]
    if page.get("missing"):
        return None
    extract = (page.get("extract") or "").strip()
    if len(extract) < 800:
        return None
    cats = [c.get("title", "") for c in page.get("categories", [])]
    return {
        "title": page.get("title", title),
        "fullurl": page.get("fullurl", ""),
        "extract": extract,
        "categories": cats,
    }


def fetch_wikidata_iucn(titles: list[str]) -> dict[str, str]:
    """Batch-resolve authoritative IUCN Red List statuses via Wikipedia pageprops + Wikidata P141."""
    p141_map = {
        "Q211005": "Nicht gefährdet (LC)",
        "Q719675": "Potenziell gefährdet (NT)",
        "Q278113": "Gefährdet (VU)",
        "Q11394": "Stark gefährdet (EN)",
        "Q96377276": "Stark gefährdet (EN)",
        "Q219127": "Vom Aussterben bedroht (CR)",
        "Q239509": "In der Natur ausgestorben (EW)",
        "Q237350": "Ausgestorben (EX)",
        "Q3245245": "Unzureichende Datenlage (DD)",
    }
    qmap: dict[str, str] = {}
    for start in range(0, len(titles), 45):
        chunk = titles[start : start + 45]
        r = requests.get(
            WIKI_API,
            params={
                "action": "query",
                "titles": "|".join(chunk),
                "prop": "pageprops",
                "ppprop": "wikibase_item",
                "redirects": "1",
                "format": "json",
                "formatversion": "2",
            },
            headers=HEADERS,
            timeout=20,
        )
        r.raise_for_status()
        for p in r.json().get("query", {}).get("pages", []):
            qid = p.get("pageprops", {}).get("wikibase_item")
            if qid:
                qmap[p["title"]] = qid

    result: dict[str, str] = {}
    qids = list(set(qmap.values()))
    all_ents: dict[str, Any] = {}
    for start in range(0, len(qids), 45):
        chunk = qids[start : start + 45]
        wd = requests.get(
            "https://www.wikidata.org/w/api.php",
            params={"action": "wbgetentities", "ids": "|".join(chunk), "props": "claims", "format": "json"},
            headers=HEADERS,
            timeout=20,
        )
        wd.raise_for_status()
        all_ents.update(wd.json().get("entities", {}))
    for title, qid in qmap.items():
        claims = all_ents.get(qid, {}).get("claims", {}).get("P141", [])
        if claims:
            val_id = claims[0].get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("id")
            if val_id in p141_map:
                result[title] = p141_map[val_id]
    return result


def detect_iucn_status(title: str, category: str, wd_map: dict[str, str]) -> str:
    """Return authoritative Wikidata P141 IUCN status or group classification."""
    if category != "tierart":
        return "Konzept / Lebensraum"
    return wd_map.get(title, "Artengruppe / Gattung (variiert je nach Art)")


def clean_extract_to_markdown(title: str, fullurl: str, extract: str, max_chars: int = 6200) -> tuple[str, str]:
    """Convert Wikipedia plain-text extract into clean Markdown and extract 1-sentence summary."""
    lines = extract.splitlines()
    cleaned_lines: list[str] = []
    heading_re = re.compile(r"^(={2,4})\s*(.+?)\s*\1\s*$")

    for raw_line in lines:
        line = raw_line.strip()
        m = heading_re.match(line)
        if m:
            level = len(m.group(1))
            sec_title = m.group(2).strip()
            sec_norm = sec_title.lower().rstrip(":")
            if sec_norm in STOP_SECTIONS:
                break
            md_level = "#" * min(level, 4)
            cleaned_lines.append("")
            cleaned_lines.append(f"{md_level} {sec_title}")
            cleaned_lines.append("")
        else:
            # Skip leftover reference markers or empty image captions
            if re.match(r"^\[\d+\]$", line):
                continue
            cleaned_lines.append(raw_line.rstrip())

    body = "\n".join(cleaned_lines)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()

    # Cap overly long articles cleanly at section or paragraph boundaries
    if len(body) > max_chars:
        cutoff = body.rfind("\n## ", 0, max_chars)
        if cutoff < 2200:
            cutoff = body.rfind("\n\n", 0, max_chars)
        if cutoff > 1500:
            body = body[:cutoff].strip() + "\n\n*(Hinweis: Gekürzte Fassung des Wikipedia-Artikels für kompakte Workshop-Nutzung.)*"

    # Derive clean 1-sentence summary from the opening paragraph
    first_para = ""
    for para in body.split("\n\n"):
        p = para.strip()
        if p and not p.startswith("#"):
            first_para = re.sub(r"\s+", " ", p)
            break
    sentence_match = re.match(r"^(.{40,260}?[.!?])(?:\s|$)", first_para)
    summary = sentence_match.group(1) if sentence_match else first_para[:220]

    header = f"# {title}\n\n"
    source_note = f"\n\n---\nQuelle: Wikipedia Deutsch ({fullurl})\n"
    return header + body + source_note, summary


def main() -> None:
    for d in STAGES_FLAT_DIRS:
        d.mkdir(parents=True, exist_ok=True)
        # Remove previously generated .md files if re-running cleanly
        for old in d.glob("*.md"):
            old.unlink()

    manifest: list[dict[str, Any]] = []
    for idx, spec in enumerate(CORPUS_SPEC, start=1):
        slug = spec["slug"]
        fetched = None
        used_query = ""
        for candidate in spec["titles"]:
            fetched = fetch_wikipedia_article(candidate)
            if fetched:
                used_query = candidate
                break
            time.sleep(0.25)

        if not fetched:
            raise RuntimeError(f"Could not fetch Wikipedia article for {slug}: {spec['titles']}")

        md_text, summary = clean_extract_to_markdown(
            fetched["title"], fetched["fullurl"], fetched["extract"]
        )

        for d in STAGES_FLAT_DIRS:
            (d / f"{slug}.md").write_text(md_text, encoding="utf-8")

        manifest.append(
            {
                "slug": slug,
                "title": fetched["title"],
                "query_title": used_query,
                "fullurl": fetched["fullurl"],
                "category": spec["category"],
                "habitat": spec["habitat"],
                "status": "Ausstehend",
                "tags": spec["tags"],
                "summary": summary,
                "char_count": len(md_text),
            }
        )
        print(f"[{idx:02d}/{len(CORPUS_SPEC)}] {slug}.md <- {fetched['title']} ({len(md_text)} chars)")
        time.sleep(0.15)

    species_titles = [m["title"] for m in manifest if m["category"] == "tierart"]
    wd_map = fetch_wikidata_iucn(species_titles)
    for m in manifest:
        m["status"] = detect_iucn_status(m["title"], m["category"], wd_map)

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone! Wrote {len(manifest)} articles to all 3 flat stages and {MANIFEST_PATH}.")


if __name__ == "__main__":
    main()
