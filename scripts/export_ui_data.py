#!/usr/bin/env python3
"""Export verified corpus, stage files, prompts, praxis paths and search index for workshop-ui."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "scripts" / "corpus_manifest.json"
OUT_PATH = ROOT / "workshop-ui" / "src" / "data" / "workshopData.json"
SEARCH_INDEX_PATH = ROOT / "workshop-ui" / "src" / "data" / "searchIndex.json"

STARTER_SLUGS = [
    "eisbaer",
    "arktis",
    "ringelrobbe",
    "anemonenfische",
    "seeanemonen",
    "symbiose",
    "steinkorallen",
    "korallenbleiche",
    "korallenriff",
    "alpenmurmeltier",
    "winterschlaf",
    "klimawandel",
]

PROMPT_HEADER_TEMPLATE = (
    "{{PROMPT}}\n\n"
    "---\n"
    "NUTZE AUSSCHLIESSLICH DIESE QUELLTEXTE (MIT DATEINAMEN ZITIEREN):\n\n"
    "{{TEXTS}}"
)


def read_text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8").strip()


def clean_article_body(raw_md: str) -> str:
    lines = raw_md.splitlines()
    # Strip leading "# Title"
    if lines and lines[0].lstrip().startswith("# "):
        lines = lines[1:]
    # Strip trailing Wikipedia boilerplate / horizontal rule / Hinweis
    cleaned: list[str] = []
    for ln in lines:
        s = ln.strip()
        if s.startswith("*(Hinweis: Gekürzte Fassung"):
            continue
        if s.startswith("Quelle: Wikipedia Deutsch"):
            continue
        if s == "---":
            continue
        cleaned.append(ln)
    return "\n".join(cleaned).strip()


def extract_wiki_preview(slug: str, category: str) -> list[str]:
    sub = {"lebensraum": "lebensraeume", "tierart": "tierarten", "konzept": "konzepte"}[category]
    txt = (ROOT / "stufe-3-obsidian-vault" / "wiki" / sub / f"{slug}.md").read_text(encoding="utf-8")
    m = re.search(r"## Wichtige Fakten auf einen Blick\s+([\s\S]*?)\n## ", txt)
    if not m:
        return []
    bullets = [ln.lstrip("- ").strip() for ln in m.group(1).splitlines() if ln.strip().startswith("- ")]
    return bullets[:4]


ABBR_PROTECT_RE = re.compile(
    r"(?:\b(?:z\.\s*B\.|u\.\s*a\.|d\.\s*h\.|i\.\s*d\.\s*R\.|u\.\s*v\.\s*m\.|u\.\s*ä\.|o\.\s*ä\.|et\s+al\.|Mrd\.|Mio\.|ca\.|bzw\.|vgl\.|etc\.|Nr\.|S\.|ggf\.|sog\.|usw\.|Dr\.|Prof\.|P\.\s*h\.)|\b\d{1,2}\.(?=\s+[A-ZÄÖÜ][a-zäöüß]))"
)
DOT_PLACEHOLDER = "\x00"


def extract_matching_units(slug: str, keywords: list[str], max_chars: int = 620) -> str:
    """Deterministically extract verbatim sentences/lines from stufe-1-chaos/docs/<slug>.md matching keywords."""
    raw = read_text(f"stufe-1-chaos/docs/{slug}.md")
    body = clean_article_body(raw)
    units: list[str] = []
    for line in body.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        # Split prose paragraphs into sentences; keep structured lines (like Familie ...) intact
        if s.startswith("Familie ") or len(s) < 160:
            units.append(s)
        else:
            protected = ABBR_PROTECT_RE.sub(lambda m: m.group(0).replace(".", DOT_PLACEHOLDER), s)
            parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9„(])", protected)
            units.extend(p.replace(DOT_PLACEHOLDER, ".").strip() for p in parts if p.strip())

    selected: list[str] = []
    used: set[str] = set()
    total_len = 0

    for kw in keywords:
        kw_low = kw.lower()
        for u in units:
            if u in used:
                if kw_low in u.lower():
                    break
                continue
            if kw_low in u.lower():
                add_len = len(u) + (1 if selected else 0)
                if total_len + add_len > max_chars and selected:
                    continue
                selected.append(u)
                used.add(u)
                total_len += add_len
                break

    # Top up with lead/context sentences up to ~85% of max_chars for balanced Express package length
    target_min = int(max_chars * 0.85)
    for u in units:
        if total_len >= target_min:
            break
        if u in used:
            continue
        add_len = len(u) + (1 if selected else 0)
        if total_len + add_len > max_chars:
            continue
        selected.append(u)
        used.add(u)
        total_len += add_len

    if not selected and units:
        selected.append(units[0][:max_chars])

    return f"=== {slug}.md ===\n" + " ".join(selected) + f" ({slug}.md)"


def build_express_package(
    pkg_id: str,
    title: str,
    description: str,
    spec: list[tuple[str, list[str], int]],
) -> dict[str, Any]:
    blocks = [extract_matching_units(slug, kws, cap) for slug, kws, cap in spec]
    content = "\n\n".join(blocks)
    # Target ~4,600–5,200 body chars so prompt (~350-500 chars) + content totals ~5,000–5,600 chars
    assert 4500 <= len(content) <= 5300, (
        f"Express package '{pkg_id}' body length {len(content)} outside expected 4500..5300 bounds"
    )
    return {
        "id": pkg_id,
        "title": title,
        "description": description,
        "charCount": len(content),
        "promptHeaderTemplate": PROMPT_HEADER_TEMPLATE,
        "sources": [f"{slug}.md" for slug, _, _ in spec],
        "content": content,
    }


def main() -> None:
    manifest: list[dict[str, Any]] = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    starter_articles = []
    search_index: dict[str, str] = {}
    for item in manifest:
        slug = item["slug"]
        raw_md = read_text(f"stufe-1-chaos/docs/{slug}.md")
        search_index[slug] = clean_article_body(raw_md)
        if slug in STARTER_SLUGS:
            starter_articles.append(
                {
                    "slug": slug,
                    "title": item["title"],
                    "category": item["category"],
                    "habitat": item["habitat"],
                    "content": raw_md,
                }
            )

    vault_articles = []
    for item in manifest:
        vault_articles.append(
            {
                "slug": item["slug"],
                "title": item["title"],
                "category": item["category"],
                "habitat": item["habitat"],
                "status": item["status"],
                "tags": item["tags"],
                "summary": item["summary"],
                "related": item.get("related", []),
                "source_file": f"raw/{item['slug']}.md",
                "key_points": extract_wiki_preview(item["slug"], item["category"]),
            }
        )

    express_methods = build_express_package(
        "methods",
        "Express-Paket 1 · Klimawandel in Arktis & Korallenriff",
        "Kürzungsfreie Schlüsselsätze aus den 6 Klimawandel-Artikeln mit (datei.md)-Quellenschildern — direkt kopierbar für Web-Chat.",
        [
            ("arktis", ["2030", "grenze der hocharktis", "nordpolarmeer"], 780),
            ("eisbaer", ["squalen", "schwarzen haut", "hohl", "meereseis", "42 zähne"], 980),
            ("klimawandel", ["anthropogene", "treibhausgasen", "klimakrise"], 760),
            ("steinkorallen", ["20 °c", "zooxanthellen", "tropischen"], 740),
            ("korallenbleiche", ["1998, 2010", "70 bis 90", "photoinhibition", "acht wochen", "9,6 mrd."], 1130),
            ("korallenriff", ["600.000 km", "20 °c", "tiefwasserriffe"], 680),
        ],
    )

    express_stages = build_express_package(
        "stages-arctic-reef",
        "Express-Paket 2 · Arktis & Korallenriff (Alle 10 Fokus-Dateien)",
        "Alle relevanten Fakten aus den 10 Arktis- und Riff-Artikeln für Frage 1–4 im 3-Stufen-Experiment (~5.000 Zeichen).",
        [
            ("arktis", ["2030", "grenze der hocharktis"], 360),
            ("eisbaer", ["squalen", "schwarzen haut", "hohl", "42 zähne"], 620),
            ("ringelrobbe", ["geburtshöhlen", "eisbären"], 380),
            ("klimawandel", ["anthropogene", "treibhausgasen"], 510),
            ("anemonenfische", ["sialinsäuren", "falterfischen"], 300),
            ("seeanemonen", ["stichodactylidae", "anemonenfische"], 320),
            ("symbiose", ["ektosymbiose", "endosymbiose"], 450),
            ("steinkorallen", ["20 °c", "kalkbildung"], 400),
            ("korallenbleiche", ["1998, 2010", "70 bis 90", "photoinhibition", "acht wochen", "9,6 mrd."], 1130),
            ("korallenriff", ["600.000 km", "tiefwasserriffe"], 360),
        ],
    )

    data: dict[str, Any] = {
        "meta": {
            "title": "Prompt-Werkstatt · virtual7 CCF Clustertag",
            "subtitle": "Vom ungefilterten Chat zum strukturierten KI-System",
            "presenter": "Nico Rimmele",
            "cluster": "Customer Cluster Finance (CCF)",
            "timeSlot": "45 Min. Hands-on (15 Min. Aha-Kern + 30 Min. Praxis-Pfad)",
            "articleCount": len(manifest),
            "complianceNote": "100 % öffentliche Wikipedia-Artikel (Tierwelt & Ökosysteme) – keine internen oder personenbezogenen Daten.",
            "pagesUrl": "https://etroxtaran.github.io/CCF-ai-workshop/",
            "repoUrl": "https://github.com/EtroxTaran/CCF-ai-workshop.git",
        },
        "steps": [
            {
                "id": "start",
                "num": "01",
                "label": "01 · Einstieg & Werkzeug-Hilfe",
                "short": "Einstieg",
                "phaseGroup": "aha-kern",
                "phaseLabel": "Vorbereitung (2 Min.)",
            },
            {
                "id": "methods",
                "num": "02",
                "label": "02 · Aha-Kern 1: Prompt-Methoden",
                "short": "Methoden",
                "phaseGroup": "aha-kern",
                "phaseLabel": "15 Min. gemeinsamer Aha-Kern",
            },
            {
                "id": "stages",
                "num": "03",
                "label": "03 · Aha-Kern 2: 3 Stufen & Wissen",
                "short": "3 Stufen",
                "phaseGroup": "aha-kern",
                "phaseLabel": "15 Min. gemeinsamer Aha-Kern",
            },
            {
                "id": "paths",
                "num": "04",
                "label": "04 · Praxis-Pfade & Transfer",
                "short": "Praxis-Pfade",
                "phaseGroup": "praxis-pfad",
                "phaseLabel": "30 Min. freier Praxis-Pfad",
            },
        ],
        "toolModes": [
            {
                "id": "web",
                "label": "Web-Chat",
                "shortLabel": "Web-Chat",
                "badge": "Kein Setup nötig",
                "summary": "Direkt im Browser (Claude.ai, ChatGPT, Gemini) mit 1-Klick-Kopierpaketen, .md-Download sowie Artifacts oder Canvas.",
                "examples": ["Claude.ai", "ChatGPT", "Google Gemini"],
                "workflowHint": "Nutze die 1-Klick-Kopierpakete (Prompt steht bereits ganz oben) oder lade einzelne .md-Dateien hoch.",
                "noInstallRequired": True,
            },
            {
                "id": "desktop",
                "label": "Desktop & Ordner",
                "shortLabel": "Desktop & Ordner",
                "badge": "Ohne Terminal",
                "summary": "Öffne die Workshop-Ordner direkt als Projekt- oder Arbeitsordner (z. B. Claude Cowork oder ChatGPT Projects).",
                "examples": ["Claude Desktop / Cowork", "ChatGPT Projects"],
                "workflowHint": "Wähle einfach den Ordner stufe-1-chaos, stufe-2-skills-guardrails oder stufe-3-obsidian-vault als Arbeitsbereich.",
                "noInstallRequired": False,
            },
            {
                "id": "agent",
                "label": "Code-Agent",
                "shortLabel": "Code-Agent",
                "badge": "Terminal / IDE",
                "summary": "Arbeite im Terminal oder in der IDE mit AGENTS.md, Skills und lokalem MCP-Server auf allen 68 Artikeln.",
                "examples": ["Claude Code", "Codex CLI", "Gemini CLI", "VS Code / Copilot", "OpenCode"],
                "workflowHint": "Wechsle per cd in stufe-1-chaos/, stufe-2-skills-guardrails/ oder stufe-3-obsidian-vault/ — Regeln & MCP laden automatisch.",
                "noInstallRequired": False,
            },
        ],
        "openCodeHelp": {
            "title": "Kein eigenes KI-Abo? → OpenCode + OpenRouter",
            "summary": "Falls du heute kein eigenes Claude-, ChatGPT- oder Copilot-Konto nutzt, kannst du in wenigen Sekunden kostenlos über OpenCode + OpenRouter (oder das In-Browser-Labor in Schritt 04) mitmachen.",
            "steps": [
                "Repository klonen: git clone -b main https://github.com/EtroxTaran/CCF-ai-workshop.git",
                "OpenCode starten und OpenRouter als Provider wählen (kostenlose Free-Tier-Modelle verfügbar, nur öffentliche Tierwelt-Daten).",
                "Alternativ funktionieren alle Aha-Kern-Schritte und der 68-Artikel-Faktenprüfer auch komplett ohne Login direkt hier in der Workshop-App.",
            ],
            "commandSnippet": "npx opencode-ai@latest",
            "note": "Compliance-Hinweis: Alle 68 Dateien sind 100 % öffentliche Wikipedia-Artikel ohne interne oder personenbezogene Daten.",
        },
        "phases": [
            {
                "id": "demo",
                "number": 1,
                "phaseGroup": "aha-kern",
                "timeRange": "11:00–11:10",
                "durationMin": 10,
                "title": "Keynote-Demo auf der Trainer-Bühne",
                "subtitle": "Prompt-Methoden, 5 Ebenen & Stufe 1 → 2 → 3",
                "beamerHeadline": "Live-Demo: Warum Kontext & Leitplanken alles verändern",
                "modeCues": {
                    "web": "Beobachte am Beamer, wie derselbe Chat durch klare Struktur und Quellenpflicht plötzlich belegbar antwortet.",
                    "desktop": "Achte darauf, wie Ordner-Kontext (AGENTS.md & Index) Vorwissen aus dem Internet zähmt.",
                    "agent": "Beobachte, wie derselbe Code-Agent nur durch AGENTS.md, Skills und _index.md anders navigiert.",
                },
                "activeQuestionId": "q3",
                "keyTakeaway": "Gleiches Modell, gleiche Dateien – völlig anderes Ergebnis durch Kontext-Design.",
            },
            {
                "id": "aha-kern",
                "number": 2,
                "phaseGroup": "aha-kern",
                "timeRange": "11:10–11:25",
                "durationMin": 15,
                "title": "Gemeinsamer Aha-Kern (Schritte 01–03)",
                "subtitle": "Werkzeug-Hilfe wählen, 4 Prompt-Methoden testen & 3 Stufen erleben",
                "beamerHeadline": "15 Min. Aha-Kern: Erst Prompt-Struktur, dann 3 Stufen inkl. Fangfrage",
                "modeCues": {
                    "web": "Kopiere Express-Paket 1 & 2 (Prompt steht ganz oben!) in deinen Browser-Chat und teste Q1–Q4.",
                    "desktop": "Öffne stufe-1-chaos → stufe-2-skills-guardrails → stufe-3-obsidian-vault als Ordner-Projekt.",
                    "agent": "Wandere im Terminal durch stufe-1-chaos → stufe-2 → stufe-3 und prüfe Q3 (Schneeleopard) + Q4 (38 Zähne).",
                },
                "activeQuestionId": "q4",
                "keyTakeaway": "Prompt-Struktur steuert das Format – Guardrails & Wissensstruktur verhindern Halluzinationen.",
            },
            {
                "id": "praxis-pfade",
                "number": 3,
                "phaseGroup": "praxis-pfad",
                "timeRange": "11:25–11:55",
                "durationMin": 30,
                "title": "Freier Praxis-Pfad (Schritt 04)",
                "subtitle": "Recherche & Fakten · Präsentation & Animatic · Kleine App",
                "beamerHeadline": "30 Min. Praxis-Pfad: Wählt euer eigenes Ziel & baut ein echtes Ergebnis",
                "modeCues": {
                    "web": "Nutze Pfad 1 (In-Browser-Faktenprüfer), Pfad 2 (Artifacts/Canvas-Folie) oder Pfad 3 (interaktives HTML-Tool).",
                    "desktop": "Nutze deinen Lieblingsordner als Datenbasis für Recherche-Matrix, Briefing-Seite oder Mini-App.",
                    "agent": "Nutze MCP (search_wildlife_vault, verify_claim_against_corpus, read_vault_article) oder baue ein Mini-Tool.",
                },
                "activeQuestionId": "q2",
                "keyTakeaway": "Jede CCF-Rolle findet in denselben Mustern sofortigen Hebel für Recherche, Kommunikation oder Bau.",
            },
            {
                "id": "debrief",
                "number": 4,
                "phaseGroup": "praxis-pfad",
                "timeRange": "11:55–12:00",
                "durationMin": 5,
                "title": "Debrief & CCF-Transfer-Brücke",
                "subtitle": "Handzeichen-Impulse, 4 Rollen & Ausblick auf 13:00 Uhr",
                "beamerHeadline": "Debrief: Was nehmt ihr in den CCF-Alltag mit?",
                "modeCues": {
                    "web": "Wählt euren Praxis-Alltagsfall aus der 4-Rollen Transfer-Brücke und teilt 1 Learning per Handzeichen.",
                    "desktop": "Übertragt das Ordner- & Regeln-Prinzip auf Fachkonzepte, Projektberichte oder Runbooks.",
                    "agent": "Nehmt AGENTS.md, Skills & schmale MCP-Tools als Blaupause für reproduzierbare Agenten-Workflows mit.",
                },
                "activeQuestionId": "q2",
                "keyTakeaway": "Kontext schlägt Magie. Ab 13:00 Uhr geht es weiter ins Unit-Programm & World Café.",
            },
        ],
        "promptComparisonTask": "Welche Auswirkungen hat der Klimawandel laut unseren Dokumenten auf Eisbären in der Arktis und auf Steinkorallen im Korallenriff?",
        "promptMethods": [
            {
                "id": "zero-shot",
                "name": "1 · Zero-Shot (Roh-Prompt)",
                "badge": "Baseline",
                "bestFor": "Schnelles Brainstorming ohne Qualitätsanspruch",
                "strength": "Minimaler Aufwand (1 Satz)",
                "risk": "Vermischt Dateien mit allgemeinem Internet-Wissen, nennt keine Quellen und wählt zufälliges Format.",
                "components": ["Nur Aufgabe"],
                "prompt": "Erkläre, wie der Klimawandel Eisbären und Korallenriffe beeinflusst.",
                "unstructuredComparison": {
                    "label": "Typische Roh-Antwort (ungefiltert)",
                    "excerpt": "Der Klimawandel bedroht Eisbären durch schmelzendes Eis, sodass sie weiter schwimmen müssen. Korallenriffe leiden unter wärmeren Meeren und Ozeanversauerung und bleichen weltweit aus.",
                    "issues": [
                        "Keine einzige Quelldatei oder exakte Zahl aus den Dokumenten",
                        "Vermischt Internet-Vorwissen (z. B. allgemeine Aussagen) mit dem Korpus",
                        "Unstrukturiert als Fließtext – nicht direkt als Briefing oder Check nutzbar",
                    ],
                },
                "structuredComparison": {
                    "label": "Was fehlt ohne Struktur?",
                    "excerpt": "Ohne Zielgruppe, Formatvorgabe und Quellenpflicht fehlt jede Prüfbarkeit. Zahlen wie „2030 eisfrei“ (arktis.md) oder „20–29 °C / acht Wochen“ (steinkorallen.md, korallenbleiche.md) tauchen nur zufällig auf.",
                    "highlights": [
                        "Dient als Baseline: erst sehen, was ohne Rahmen passiert",
                        "Danach mit CO-STAR, Few-Shot oder RISEN direkt vergleichen",
                    ],
                    "formatTag": "Baseline (Fließtext)",
                },
                "expectedSnippet": "Baseline ohne Format- oder Quellenvorgabe.",
            },
            {
                "id": "costar",
                "name": "2 · CO-STAR",
                "badge": "Kommunikation & Business",
                "bestFor": "Briefings, Fachbereichs-Texte, Sales, PM & Team-Updates",
                "strength": "Trennt Kontext, Ziel, Stil, Ton, Zielgruppe und Antwortformat glasklar.",
                "risk": "Ohne explizite Quellenpflicht kann die KI Lücken höflich überspielen.",
                "components": ["Context", "Objective", "Style", "Tone", "Audience", "Response"],
                "prompt": (
                    "Context: Wir bereiten ein internes Cluster-Briefing auf Basis lokaler Wikipedia-Artikel (arktis.md, eisbaer.md, korallenbleiche.md, steinkorallen.md, klimawandel.md) vor.\n"
                    "Objective: Erkläre die konkreten Folgen des Klimawandels für Eisbären in der Arktis und Steinkorallen im Korallenriff.\n"
                    "Style: Klar strukturiertes Management-Memo mit belegbaren Fakten.\n"
                    "Tone: Sachlich, präzise, ohne Alarmismus.\n"
                    "Audience: Gemischtes Team aus Fachbereich, Datenanalyse und Projektleitung.\n"
                    "Response: Zwei kurze Abschnitte („Arktis & Eisbär“ / „Korallenriff & Steinkorallen“) mit je maximal 3 Bulletpoints plus expliziter Quellenangabe in Klammern. Erfinde keine Zahlen."
                ),
                "unstructuredComparison": {
                    "label": "Zero-Shot (ohne CO-STAR)",
                    "excerpt": "Eisbären verlieren ihren Lebensraum und Korallen bleichen aus. Das gefährdet langfristig viele Arten in beiden Ökosystemen.",
                    "issues": [
                        "Keine Trennung nach Zielgruppe oder Briefing-Format",
                        "Keine Quellen in Klammern",
                    ],
                },
                "structuredComparison": {
                    "label": "CO-STAR-Ausgabe (Management-Memo)",
                    "excerpt": (
                        "Arktis & Eisbär:\n"
                        "• Der Arktische Ozean könnte nach Prognosen bereits 2030 im Sommer eisfrei sein (arktis.md).\n"
                        "• Die Hocharktis-Grenze verschiebt sich durch globale Erwärmung nach Norden (arktis.md).\n"
                        "• Eisbären verbringen einen Großteil ihres Lebens auf Meereseis und wiegen im Sommer ausgehungert deutlich weniger (eisbaer.md).\n\n"
                        "Korallenriff & Steinkorallen:\n"
                        "• Steinkorallen benötigen i. d. R. 20 °C bis 29 °C Wassertemperatur (steinkorallen.md).\n"
                        "• Wärmestress (z. B. 29 °C) führt zu Photoinhibition und Abstoßung der Zooxanthellen; ohne Rückkehr binnen ca. acht Wochen sterben Korallen ab (korallenbleiche.md).\n"
                        "• Globale Bleichen 1998, 2010, 2016 und 2024; Riffe absorbieren 70–90 % Wellenenergie (korallenbleiche.md)."
                    ),
                    "highlights": [
                        "Sofort präsentierbares Management-Memo in 2 Abschnitten",
                        "Exakte Zahlen (2030, 20–29 °C, acht Wochen, 70–90 %) mit (datei.md)",
                    ],
                    "formatTag": "Management-Memo",
                },
                "expectedSnippet": "Arktis & Eisbär: 2030 eisfrei (arktis.md) · Steinkorallen: 20–29 °C & 8 Wochen (steinkorallen.md, korallenbleiche.md).",
            },
            {
                "id": "few-shot",
                "name": "3 · Few-Shot (Beispiele)",
                "badge": "Daten, BI & Struktur",
                "bestFor": "Tabellen, JSON/CSV-Extraktion, Datenbank-Mapping & einheitliche Muster",
                "strength": "Zwei konkrete Beispiele erzwingen exakt das gewünschte Ausgabe-Schema ohne langes Erklären.",
                "risk": "Beispiele verbrauchen Tokens – bei fehlerhaften Beispielen kopiert die KI den Fehler.",
                "components": ["Instruktion", "2 Input-Output-Beispiele", "Zielaufgabe"],
                "prompt": (
                    "Extrahiere aus den vorliegenden Dokumenten die Klimawandel-Auswirkungen exakt im Format der beiden Beispiele. Nutze nur Fakten aus den Dateien.\n\n"
                    "Beispiel 1:\n"
                    "Lebensraum: Alpen | Betroffene Art: Alpenmurmeltier | Konkreter Befund: Auf höhere Gebirgslagen begrenzte Eiszeitrelikte | Quelle: alpenmurmeltier.md\n\n"
                    "Beispiel 2:\n"
                    "Lebensraum: Arktis | Betroffene Art: Ringelrobbe | Konkreter Befund: Geburtshöhlen auf festem Eis; Junge werden Ende Juni/Anfang Juli beim Eisaufbruch selbstständig | Quelle: ringelrobbe.md\n\n"
                    "Aufgabe: Erstelle genau solche Zeilen für „Eisbär (Arktis)“ und „Steinkorallen (Korallenriff)“ inkl. konkreter Temperatur-, Jahres- oder Zeitraumangaben aus den Dateien."
                ),
                "unstructuredComparison": {
                    "label": "Zero-Shot (ohne Schema-Beispiele)",
                    "excerpt": "Für den Eisbären spielt das Meereis eine große Rolle. Bei den Korallen sind es steigende Wassertemperaturen im Meer.",
                    "issues": [
                        "Nicht maschinenlesbar / kein einheitliches Pipe- oder Tabellen-Schema",
                        "Fehlende Pflichtfelder (Lebensraum, Befund, Quelle)",
                    ],
                },
                "structuredComparison": {
                    "label": "Few-Shot-Ausgabe (Schema-treu)",
                    "excerpt": (
                        "Lebensraum: Arktis | Betroffene Art: Eisbär | Konkreter Befund: Auf Meereseis angewiesen; Arktischer Ozean laut Prognosen ab 2030 im Sommer eisfrei; im Sommer deutlich geringeres Gewicht | Quelle: eisbaer.md, arktis.md\n"
                        "Lebensraum: Korallenriff | Betroffene Art: Steinkorallen | Konkreter Befund: Optimal 20–29 °C; bei Wärmestress (29 °C) Photoinhibition und Ausbleichen; Absterben ohne Zooxanthellen-Rückkehr nach ca. acht Wochen (Bleichen 1998, 2010, 2016, 2024) | Quelle: steinkorallen.md, korallenbleiche.md"
                    ),
                    "highlights": [
                        "100 % einheitliches Schema dank 2 Vorbild-Zeilen",
                        "Ideal für CSV/JSON-Importe, BI-Mappings und Datenbank-Extraktion",
                    ],
                    "formatTag": "Pipe-Schema / Datensatz",
                },
                "expectedSnippet": "Lebensraum: Arktis | Betroffene Art: Eisbär | ... | Quelle: eisbaer.md, arktis.md",
            },
            {
                "id": "risen-cot",
                "name": "4 · RISEN + Chain-of-Thought",
                "badge": "Analyse & Prüfung",
                "bestFor": "Komplexe Analysen, Fakten-Audits, Architektur & nachprüfbare Herleitungen",
                "strength": "Kombiniert feste Arbeits-Schritte (Steps), schrittweises Denken (CoT) und harte Grenzen (Narrowing).",
                "risk": "Etwas längerer Prompt – lohnt sich immer dann, wenn Fehler teuer sind.",
                "components": ["Role", "Instructions", "Steps + CoT", "End Goal", "Narrowing"],
                "prompt": (
                    "Role: Du bist ein streng quellenbasierter Recherche-Analyst.\n"
                    "Instructions: Vergleiche die Klimawandel-Risiken für Eisbären in der Arktis und Steinkorallen im Korallenriff ausschließlich anhand der bereitgestellten Markdown-Dokumente.\n"
                    "Steps:\n"
                    "1. Denke Schritt für Schritt: Suche zuerst relevante Textstellen in arktis.md, eisbaer.md, steinkorallen.md und korallenbleiche.md.\n"
                    "2. Prüfe jeden Zahlenwert (Jahreszahl, Temperatur, Zeitraum, Prozentwert) direkt am Text.\n"
                    "3. Formuliere eine kompakte Vergleichstabelle.\n"
                    "End Goal: Eine fehlerfreie, vollständig belegte Entscheidungsgrundlage.\n"
                    "Narrowing: Kein allgemeines Vorwissen verwenden. Was nicht im Text steht, mit „[Nicht in Quelle]“ markieren. Jede Aussage mit Dateinamen belegen."
                ),
                "unstructuredComparison": {
                    "label": "Zero-Shot (ohne Steps & Narrowing)",
                    "excerpt": "Eisbären sind stark bedroht und ihre Populationen sinken drastisch. Korallenriffe sind ebenfalls bald verschwunden.",
                    "issues": [
                        "Unbelegte Pauschalaussagen ohne Gegenprüfung am Text",
                        "Keine Markierung fehlender Daten mit [Nicht in Quelle]",
                    ],
                },
                "structuredComparison": {
                    "label": "RISEN + CoT-Ausgabe (Audit-Tabelle)",
                    "excerpt": (
                        "| Kriterium | Eisbär (Arktis) | Steinkorallen (Korallenriff) |\n"
                        "|---|---|---|\n"
                        "| Schwellenwert / Prognose | Sommer-Eisfreiheit ab 2030 möglich (arktis.md) | Optimal 20–29 °C (steinkorallen.md); Stress ab 29 °C (korallenbleiche.md) |\n"
                        "| Biologische Folge | Nahrungsengpass im Sommer (eisbaer.md) | Photoinhibition -> Abstoßung Zooxanthellen, Tod nach ~8 Wochen (korallenbleiche.md) |\n"
                        "| Ökonomie / Schutz | Schutzgebiete z. B. Tuvaijuittuq (arktis.md) | 70–90 % Wellenschutz; 9,6 Mrd. $ Tourismusumsatz (korallenbleiche.md) |\n"
                        "| Konkrete globale Bestandszahl | [Nicht in Quelle] | Globale Bleichen 1998, 2010, 2016, 2024 (korallenbleiche.md) |"
                    ),
                    "highlights": [
                        "Erzwingt Zahlen-Check und explizites „[Nicht in Quelle]“ statt Raten",
                        "Perfekt für Architektur-, Audit- und Fachkonzept-Entscheidungen",
                    ],
                    "formatTag": "Vergleichstabelle + Audit",
                },
                "expectedSnippet": "Vergleichstabelle mit geprüften Zahlen und explizitem [Nicht in Quelle].",
            },
        ],
        "architectureLayers": [
            {
                "layer": "1 · User-Prompt",
                "analogy": "Die konkrete Tagesaufgabe im Posteingang",
                "persistence": "Gilt nur für genau diese eine Nachricht",
                "authority": "Niedrig – vergisst Regeln bei langen Chats schnell",
                "example": "„Fasse mir die Folgen für Steinkorallen aus diesen Dateien zusammen.“",
            },
            {
                "layer": "2 · Priming (im Chat)",
                "analogy": "Kurzes Briefing zu Gesprächsbeginn",
                "persistence": "Gilt für den laufenden Chatverlauf",
                "authority": "Mittel – richtet Ton, Glossar und Zielbild sauber aus",
                "example": "Erste Chat-Nachricht mit Rolle, Kontext & Qualitätskriterien, bevor die eigentliche Frage folgt.",
            },
            {
                "layer": "3 · System-Prompt / AGENTS.md",
                "analogy": "Die Stellenbeschreibung & Hausordnung",
                "persistence": "Dauerhaft über alle Aufgaben im Projekt aktiv",
                "authority": "Hoch – übersteuert lockere User-Prompts bei Konflikten",
                "example": "Verbindliche Guardrails: Nur lokale Dateien nutzen, Dateinamen zitieren, Lücken offen melden.",
            },
            {
                "layer": "4 · Harness (Skills + Guardrails)",
                "analogy": "Das Sicherheitsgeschirr & Standard-Playbook",
                "persistence": "Wiederverwendbare Abläufe pro Aufgabentyp",
                "authority": "Sehr hoch – erzwingt Recherche-Schritte & Gegenprüfung",
                "example": "Skill `quellen-recherche` + Skill `fakten-pruefer` prüfen Antworten vor der Ausgabe.",
            },
            {
                "layer": "5 · Tools & MCP",
                "analogy": "Werkzeuge, Datenbanken & geprüfte Schnittstellen",
                "persistence": "Standardisiertes Protokoll (Model Context Protocol)",
                "authority": "Direkte Aktion statt reinem Text-Raten",
                "example": "`search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article`.",
            },
        ],
        "chatRulesTemplate": (
            "VERBINDLICHE CHAT-REGELN (für alle folgenden Antworten einhalten):\n"
            "Du bist ein präziser Recherche-Assistent für unsere bereitgestellten Markdown-Dokumente.\n"
            "1. Nutze AUSSCHLIESSLICH die von mir bereitgestellten Texte – kein allgemeines Weltwissen zum Lückenfüllen.\n"
            "2. Nenne nach jeder faktischen Aussage den exakten Dateinamen in Klammern, z. B. (eisbaer.md).\n"
            "3. Wenn eine Information nicht in den Dokumenten steht, antworte exakt: „Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“\n"
            "4. Antworte sachlich, kurz und strukturiert (max. 5 Bulletpoints oder kompakte Tabelle)."
        ),
        "testQuestions": [
            {
                "id": "q1",
                "number": 1,
                "type": "Detailfrage (1 Datei)",
                "question": "Warum gefriert das Fell des Eisbären nicht, welche Hautfarbe hat ein ausgewachsener Eisbär darunter, und wie viele Zähne besitzt er?",
                "targetDocs": ["eisbaer.md"],
                "whatToWatch": "Nennt die KI exakt den Squalen-freien Eisbärentalg, die schwarze Haut (bei Babys rosa), hohle transparente Haare und 42 Zähne – inkl. (eisbaer.md)?",
                "solutionSummary": "Laut `eisbaer.md`: Eine Schicht aus Eisbärentalg (ohne Squalen, hydrophob) lässt Wasser abperlen/verdunsten, bevor Eisnukleation entsteht. Darunter liegt schwarze Haut (bei Babys rosa) und eine 5–10 cm Fettschicht; der Eisbär besitzt 42 Zähne.",
                "focusStages": ["stufe-1"],
                "isTrap": False,
            },
            {
                "id": "q2",
                "number": 2,
                "type": "Querverbindungs-Frage (5+ verknüpfte Dateien)",
                "question": "Vergleiche die Symbiose zwischen Anemonenfischen und Seeanemonen mit der Symbiose zwischen Steinkorallen und Zooxanthellen: Wie schützen sich Anemonenfische vor Nesselzellen, welcher Symbiose-Typ liegt jeweils räumlich vor, und was passiert bei starker Erwärmung im Korallenriff?",
                "targetDocs": ["anemonenfische.md", "seeanemonen.md", "symbiose.md", "steinkorallen.md", "korallenbleiche.md"],
                "whatToWatch": "Findet die KI alle verknüpften Dateien? Besonders in Stufe 3 helfen `_index.md` + `[[Wikilinks]]`, Ektosymbiose vs. Endosymbiose sauber zu trennen.",
                "solutionSummary": "`anemonenfische.md`: Schleimhaut mit geringem Anteil an Sialinsäuren schützt vor Nesselzellen. `symbiose.md`: Clownfisch & Seeanemone = Ektosymbiose (körperlich getrennt), Zooxanthellen in Steinkorallen = Endosymbiose (in Zellen). `steinkorallen.md` + `korallenbleiche.md`: Ideal 20–29 °C; bei Wärmestress (z. B. 29 °C) Photoinhibition/oxidativer Stress -> Abstoßung der Zooxanthellen (Korallenbleiche); ohne Rückkehr binnen ca. acht Wochen sterben Korallen ab.",
                "focusStages": ["stufe-3"],
                "isTrap": False,
            },
            {
                "id": "q3",
                "number": 3,
                "type": "Fangfrage / Negativtest (NICHT im Korpus!)",
                "question": "Wie hoch ist der aktuelle Bestand an Schneeleoparden im Schweizerischen Nationalpark und welche jährlichen Tourismus-Eintrittspreise in Euro werden dort zum Artenschutz erhoben?",
                "targetDocs": [],
                "whatToWatch": "DER Härtetest: Rät/spekuliert die KI in Stufe 1? Oder antwortet sie in Stufe 2 & 3 sauber: „Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“?",
                "solutionSummary": "Weder „Schneeleopard“, noch „Schweizerischer Nationalpark“, noch „Eintrittspreis“ kommen in einer einzigen der 68 Dateien vor (0 Treffer). Korrekte Antwort in Stufe 2 & 3: klare Ablehnung ohne Spekulation.",
                "focusStages": ["stufe-1", "stufe-2", "stufe-3"],
                "isTrap": True,
            },
            {
                "id": "q4",
                "number": 4,
                "type": "Steuerungs- & Kontext-Check (38 Zähne)",
                "question": "Teste Kontext-Priorisierung: Wenn in unserer lokalen Datei `eisbaer.md` testweise „38 Zähne“ statt „42 Zähne“ steht — folgt die KI strikt deinem Dokument oder korrigiert sie heimlich aus ihrem Trainingswissen?",
                "targetDocs": ["eisbaer.md", "AGENTS.md"],
                "whatToWatch": "Beweist den Unterschied zwischen Modell-Gedächtnis und lokalem Kontext/Harness. (Bei lokalem Dateitest `42` danach bitte wieder herstellen!)",
                "solutionSummary": "Mit aktivem Guardrail übernimmt die KI „38 Zähne (eisbaer.md)“ ohne stillschweigend aus dem Training zu korrigieren – so wird Kontext-Priorisierung überprüfbar.",
                "focusStages": ["stufe-2"],
                "isTrap": False,
                "webChatPrompt": (
                    "REGEL: Nutze AUSSCHLIESSLICH diesen Textausschnitt (kein Vorwissen!).\n"
                    "Text (eisbaer.md): „Wie die meisten Bären besitzen Eisbären 38 Zähne, und wie alle Bären sind sie Sohlengänger.“\n"
                    "Frage: Wie viele Zähne besitzt ein Eisbär laut dieser Quelle?"
                ),
                "webChatWatch": "Antwortet der Chat exakt „38 Zähne (eisbaer.md)“ – oder korrigiert er eigenmächtig auf 42?",
                "webChatSolution": "Mit Guardrail antwortet der Chat treu „38 Zähne (eisbaer.md)“ – der Beweis, dass lokale Regeln stärker sind als Trainingswissen.",
                "manipulationCheck": {
                    "targetFile": "stufe-2-skills-guardrails/docs/eisbaer.md",
                    "originalValue": "42 Zähne",
                    "mutatedValue": "38 Zähne",
                    "expectedCitation": "(eisbaer.md)",
                },
            },
        ],
        "stages": [
            {
                "id": "stufe-1",
                "folder": "stufe-1-chaos",
                "title": "Stufe 1 · Chaos (Ohne Regeln)",
                "badge": "Baseline",
                "beginnerBadge": "Ohne Schutz",
                "summary": "Minimale Anweisung ohne Quellenpflicht, ohne Guardrails und ohne Struktur im Ordner docs/.",
                "beginnerSummary": "Wie ein ganz normaler Chat ohne Spielregeln: Die KI rät schnell aus dem Internet-Gedächtnis mit und nennt keine Dateien.",
                "agentsMd": read_text("stufe-1-chaos/AGENTS.md"),
                "skills": [],
                "modeNotes": {
                    "web": {
                        "headline": "Express-Paket OHNE Regeln in einen neuen Chat einfügen",
                        "steps": [
                            "Kopiere das Express-Paket (oder hänge docs/eisbaer.md an) ohne besondere Schutzregeln.",
                            "Stelle Frage 3 (Schneeleopard-Fangfrage) und Frage 1 (Eisbär).",
                            "Beobachte: Vermischt die KI deinen Text mit Vorwissen aus dem Internet?",
                        ],
                        "commandOrAction": "Neuer Chat → Express-Paket ohne Regeln einfügen",
                    },
                    "desktop": {
                        "headline": "Ordner stufe-1-chaos/ im Desktop-Tool öffnen",
                        "steps": [
                            "Öffne den Ordner stufe-1-chaos/ in Claude Cowork oder ChatGPT Projects.",
                            "Stelle Frage 3 (Fangfrage) und Frage 1 ohne weitere Leitplanken.",
                            "Beobachte fehlende Dateinamen und Spekulationen.",
                        ],
                        "commandOrAction": "Arbeitsordner: stufe-1-chaos/",
                    },
                    "agent": {
                        "headline": "CLI / Agent direkt in stufe-1-chaos/ starten",
                        "steps": [
                            "Wechsle per Terminal in cd stufe-1-chaos (AGENTS.md hat hier nur 1 Satz).",
                            "Stelle Frage 3 (Fangfrage) und Frage 1.",
                            "Vergleiche das Ergebnis anschließend direkt mit Stufe 2.",
                        ],
                        "commandOrAction": "cd stufe-1-chaos",
                    },
                },
                "focusQuestionIds": ["q3", "q1"],
                "sourceTags": [
                    "arktis.md",
                    "eisbaer.md",
                    "ringelrobbe.md",
                    "klimawandel.md",
                    "anemonenfische.md",
                    "seeanemonen.md",
                    "symbiose.md",
                    "steinkorallen.md",
                    "korallenbleiche.md",
                    "korallenriff.md",
                ],
            },
            {
                "id": "stufe-2",
                "folder": "stufe-2-skills-guardrails",
                "title": "Stufe 2 · Klare Regeln & Skills (Harness)",
                "badge": "Kontrolle",
                "beginnerBadge": "Mit Leitplanken",
                "summary": "Klare Leitplanken in AGENTS.md + zwei wiederverwendbare Skills (quellen-recherche & fakten-pruefer).",
                "beginnerSummary": "Jetzt bekommt die KI feste Hausregeln: Nur lokale Texte nutzen, (datei.md) nennen und bei Lücken ehrlich „nicht enthalten“ sagen.",
                "agentsMd": read_text("stufe-2-skills-guardrails/AGENTS.md"),
                "skills": [
                    {
                        "name": "quellen-recherche",
                        "content": read_text("stufe-2-skills-guardrails/.agents/skills/quellen-recherche/SKILL.md"),
                    },
                    {
                        "name": "fakten-pruefer",
                        "content": read_text("stufe-2-skills-guardrails/.agents/skills/fakten-pruefer/SKILL.md"),
                    },
                ],
                "modeNotes": {
                    "web": {
                        "headline": "Chat-Regeln + Express-Paket kombinieren (Prompt steht ganz oben!)",
                        "steps": [
                            "Öffne einen frischen Chat und nutze das 1-Klick-Paket inkl. Verbindlichen Chat-Regeln.",
                            "Stelle erneut Frage 3 (Fangfrage) — kommt jetzt die saubere Ablehnung?",
                            "Teste Frage 4 („38 Zähne“-Schalter): Übernimmt der Chat 38 statt 42?",
                        ],
                        "commandOrAction": "Frischer Chat → Paket mit Chat-Regeln einfügen",
                    },
                    "desktop": {
                        "headline": "Ordner stufe-2-skills-guardrails/ öffnen",
                        "steps": [
                            "Öffne stufe-2-skills-guardrails/ (enthält AGENTS.md & Skills).",
                            "Stelle Frage 3 (Schneeleopard) — der Agent muss sauber ablehnen.",
                            "Optional für Frage 4: kurz 42 → 38 Zähne in docs/eisbaer.md testen.",
                        ],
                        "commandOrAction": "Arbeitsordner: stufe-2-skills-guardrails/",
                    },
                    "agent": {
                        "headline": "CLI / Agent in stufe-2-skills-guardrails/ starten",
                        "steps": [
                            "Wechsle in cd ../stufe-2-skills-guardrails (AGENTS.md + Skills + .mcp.json aktiv).",
                            "Stelle Frage 3 (Fangfrage) und prüfe den Refusal-Text.",
                            "Teste Frage 4 (42 -> 38 Zähne in docs/eisbaer.md) und stelle danach 42 wieder her.",
                        ],
                        "commandOrAction": "cd ../stufe-2-skills-guardrails",
                    },
                },
                "focusQuestionIds": ["q3", "q4"],
                "sourceTags": [
                    "arktis.md",
                    "eisbaer.md",
                    "ringelrobbe.md",
                    "klimawandel.md",
                    "anemonenfische.md",
                    "seeanemonen.md",
                    "symbiose.md",
                    "steinkorallen.md",
                    "korallenbleiche.md",
                    "korallenriff.md",
                ],
            },
            {
                "id": "stufe-3",
                "folder": "stufe-3-obsidian-vault",
                "title": "Stufe 3 · Vernetztes Wissen (Markdown-RAG)",
                "badge": "Wissens-Graph",
                "beginnerBadge": "Index + Links",
                "summary": "3-Zonen-Architektur (raw/, wiki/, _index.md) mit YAML-Frontmatter, [[Wikilinks]] und Synthese-Skills.",
                "beginnerSummary": "Statt 68 Dateien blind zu durchsuchen, springt die KI über eine Übersichtskarte (_index.md) und [[Querverweise]] direkt zu den richtigen Passagen.",
                "agentsMd": read_text("stufe-3-obsidian-vault/AGENTS.md"),
                "indexMd": read_text("stufe-3-obsidian-vault/_index.md"),
                "skills": [
                    {
                        "name": "vault-suche",
                        "content": read_text("stufe-3-obsidian-vault/.agents/skills/vault-suche/SKILL.md"),
                    },
                    {
                        "name": "wissen-synthese",
                        "content": read_text("stufe-3-obsidian-vault/.agents/skills/wissen-synthese/SKILL.md"),
                    },
                ],
                "modeNotes": {
                    "web": {
                        "headline": "Wissens-Graph hier in der App + Express-Paket für Frage 2",
                        "steps": [
                            "Klicke im interaktiven Wissens-Graph unten durch die 5 Sprünge von Frage 2 (oder starte mit _index.md).",
                            "Stelle Frage 2 (Anemonenfisch vs. Steinkorallen-Symbiose) mit Express-Paket 2.",
                            "Vergleiche: Wie klar werden Ektosymbiose, Endosymbiose und 20–29 °C getrennt?",
                        ],
                        "commandOrAction": "Wissens-Graph Schritt für Schritt + Frage 2 testen",
                    },
                    "desktop": {
                        "headline": "Ordner stufe-3-obsidian-vault/ öffnen",
                        "steps": [
                            "Öffne stufe-3-obsidian-vault/ mit _index.md und wiki/.",
                            "Bitte die KI, zuerst _index.md zu lesen und [[Wikilinks]] für Frage 2 zu folgen.",
                            "Prüfe danach Frage 3 (Fangfrage) gegen den gesamten Vault.",
                        ],
                        "commandOrAction": "Arbeitsordner: stufe-3-obsidian-vault/",
                    },
                    "agent": {
                        "headline": "CLI / Agent in stufe-3-obsidian-vault/ (mit Skills & MCP)",
                        "steps": [
                            "Wechsle in cd ../stufe-3-obsidian-vault (vault-suche, wissen-synthese & .mcp.json aktiv).",
                            "Stelle Frage 2 (Querverbindung über 5+ Dateien) und Frage 3.",
                            "Beobachte, wie _index.md + [[Wikilinks]] gezielte Datei-Sprünge auslösen.",
                        ],
                        "commandOrAction": "cd ../stufe-3-obsidian-vault",
                    },
                },
                "focusQuestionIds": ["q2", "q3"],
                "sourceTags": [
                    "_index.md",
                    "anemonenfische.md",
                    "seeanemonen.md",
                    "symbiose.md",
                    "steinkorallen.md",
                    "korallenbleiche.md",
                    "korallenriff.md",
                    "arktis.md",
                    "eisbaer.md",
                    "ringelrobbe.md",
                ],
            },
        ],
        "expressPackages": [express_methods, express_stages],
        "praxisPaths": [
            {
                "id": "pfad-recherche",
                "number": 1,
                "title": "Praxis-Pfad 1 · Recherche & Fakten-System",
                "tag": "Fakten-Audit · Wissens-Graph · MCP",
                "durationMin": 30,
                "bestForRoles": ["Kunden & Projekte", "Fachkonzept & Daten", "Entwicklung & Architektur"],
                "description": "Prüfe KI-Behauptungen gegen alle 68 Artikel direkt im Browser-Faktenprüfer oder verbinde deinen Code-Agenten per lokalem MCP-Server (search_wildlife_vault, verify_claim_against_corpus, read_vault_article).",
                "includesInBrowserLab": True,
                "promptsByMode": {
                    "web": {
                        "label": "Fakten-Audit-Prompt (für Browser-Chat + 68-Artikel-Prüfer)",
                        "prompt": (
                            "Nutze strenge Quellenpflicht (nur belegte Fakten + Dateiname in Klammern) und prüfe diese 4 Behauptungen einzeln mit Belegt / Widersprüchlich / Nicht belegt:\n"
                            "1. Eisbärentalg enthält kein Squalen und ihre Haut unter dem Fell ist schwarz.\n"
                            "2. Eisbären fressen im Sommer regelmäßig Pinguine und haben 38 Zähne.\n"
                            "3. Clownfische schützen sich durch geringen Sialinsäure-Anteil vor Nesselzellen (Ektosymbiose).\n"
                            "4. Im Schweizerischen Nationalpark leben 45 Schneeleoparden."
                        ),
                        "deliverableHint": "Ergebnis-Checkliste mit Belegt / Widersprüchlich / Nicht belegt gegen unsere 68 Artikel.",
                    },
                    "desktop": {
                        "label": "Ordner-Audit in stufe-3-obsidian-vault/",
                        "prompt": (
                            "Lies _index.md in stufe-3-obsidian-vault/ und erstelle eine strukturierte Fakten-Matrix (JSON + Markdown-Tabelle) für Eisbär, Ringelrobbe, Anemonenfische, Alpenmurmeltier, Steinadler und Gepard. "
                            "Felder: title, habitat, status, kernfakt, wikilink, source_file. Fehlendes mit „[Nicht in Quelle]“ markieren."
                        ),
                        "deliverableHint": "Vollständig belegte 6-Arten-Matrix mit [[Wikilinks]] und [Nicht in Quelle]-Lücken.",
                    },
                    "agent": {
                        "label": "MCP-Workflow im Code-Agent",
                        "prompt": (
                            "Nutze die MCP-Tools unseres Workshop-Servers (workshop-wildlife):\n"
                            "1. Suche mit search_wildlife_vault nach 'Korallenbleiche Klimawandel'.\n"
                            "2. Lies mit read_vault_article den Artikel 'korallenbleiche' sowie '_index'.\n"
                            "3. Prüfe zwei eigene Thesen mit verify_claim_against_corpus und gib eine kurze Audit-Übersicht mit [[Wikilinks]] aus."
                        ),
                        "deliverableHint": "Nachvollziehbare Tool-Aufrufe über stdio MCP ohne Halluzinationen.",
                    },
                },
            },
            {
                "id": "pfad-praesentation",
                "number": 2,
                "title": "Praxis-Pfad 2 · Präsentation, Animatic & Übersichtsseite",
                "tag": "Artifacts · Canvas · Management-Briefing",
                "durationMin": 30,
                "bestForRoles": ["Kunden & Projekte", "Fachkonzept & Daten"],
                "description": "Erzeuge in 15–20 Minuten eine vorzeigbare interaktive Übersichtsseite, HTML-Animatic oder Management-Präsentation (z. B. in Claude Artifacts oder ChatGPT Canvas) auf Basis belegter Fakten.",
                "promptsByMode": {
                    "web": {
                        "label": "Claude Artifacts / ChatGPT Canvas Prompt",
                        "prompt": (
                            "Erstelle eine einzelne, eigenständige HTML-Übersichtsseite (oder interaktive 4-Karten-Präsentation in Artifacts/Canvas) zum Thema „Klimawandel in Arktis & Korallenriff“.\n"
                            "Anforderungen:\n"
                            "- Nur belegte Zahlen aus unseren Texten nutzen (2030 eisfrei, 20–29 °C, acht Wochen, 70–90 % Wellenschutz, 9,6 Mrd. $ Tourismus) + Dateiname in Klammern.\n"
                            "- Klares visuelles Vorher/Nachher (gesundes Riff vs. Bleiche) als einfaches Inline-SVG.\n"
                            "- Ein kurzer Abschnitt „Offene Lücken in unseren Quellen“."
                        ),
                        "deliverableHint": "Interaktive Übersichtsseite oder 4-Folien-Deck direkt im Browser-Vorschaufenster.",
                    },
                    "desktop": {
                        "label": "Briefing + HTML-Handout aus stufe-3-obsidian-vault/",
                        "prompt": (
                            "Lies arktis.md, eisbaer.md, korallenbleiche.md und steinkorallen.md und erstelle ein kompaktes Entscheider-Handout (HTML oder Markdown-Deck) "
                            "nach CO-STAR mit max. 5 Bulletpoints pro Lebensraum, exakten (datei.md)-Quellen und einem Block „Offene Lücken“."
                        ),
                        "deliverableHint": "Sauberes Briefing-Dokument oder lokales HTML-Handout.",
                    },
                    "agent": {
                        "label": "Statische Mini-Präsentation im Workspace generieren",
                        "prompt": (
                            "Nutze die verifizierten Fakten aus stufe-3-obsidian-vault/wiki/ und generiere eine einzelne statische HTML-Präsentation (ohne externe CDN-Skripte) "
                            "mit 4 Folien, Tastaturnavigation (Pfeiltasten) und einem Inline-SVG zur Korallenbleiche-Schwelle (20–29 °C)."
                        ),
                        "deliverableHint": "Eigenständige lokale HTML-Präsentation mit Quellenangaben.",
                    },
                },
            },
            {
                "id": "pfad-app",
                "number": 3,
                "title": "Praxis-Pfad 3 · Kleine interaktive App bauen",
                "tag": "Quiz · Simulator · Explorer",
                "durationMin": 30,
                "bestForRoles": ["Betrieb & Datenbanken", "Entwicklung & Architektur", "Fachkonzept & Daten"],
                "description": "Baue eine kleine, sofort lauffähige interaktive Anwendung auf Basis des Tierwelt-Korpus — z. B. ein Fakten-Quiz mit Quellenbeleg, einen Riff-Temperatur-Simulator oder einen Nahrungsnetz-Explorer.",
                "promptsByMode": {
                    "web": {
                        "label": "1-Datei-Web-App in Claude Artifacts / ChatGPT Canvas",
                        "prompt": (
                            "Baue eine kleine interaktive Single-File-HTML-App (React/HTML+JS in Artifacts/Canvas): „Korallenriff- & Arktis-Faktencheck“.\n"
                            "Funktionen:\n"
                            "1. Temperatur-Regler (18 °C bis 32 °C) zeigt live die Auswirkungen auf Steinkorallen & Zooxanthellen (20–29 °C Optimalbereich, Stress bei 29 °C, acht Wochen Überlebensfenster).\n"
                            "2. 4 Quizfragen inkl. einer Fangfrage („Schneeleoparden im Schweizerischen Nationalpark“), bei der jede Auflösung den exakten Dateinamen anzeigt.\n"
                            "3. Klare, helle Oberfläche ohne externe Abhängigkeiten."
                        ),
                        "deliverableHint": "Lauffähiger interaktiver Simulator + Quiz direkt in Artifacts/Canvas.",
                    },
                    "desktop": {
                        "label": "Explorer-App aus dem Obsidian-Vault entwerfen",
                        "prompt": (
                            "Nutze die Dateien in stufe-3-obsidian-vault/wiki/ als Datenbasis und entwirf eine kleine HTML/JS-Such- und Lernkarten-App "
                            "für 6–10 Tierarten mit Filter nach Lebensraum (Arktis, Korallenriff, Alpen) und Anzeige der verknüpften [[Wikilinks]]."
                        ),
                        "deliverableHint": "Lernkarten- oder Lebensraum-Filter-App mit echten Vault-Metadaten.",
                    },
                    "agent": {
                        "label": "CLI / IDE Mini-App mit Tests & Guardrails",
                        "prompt": (
                            "Baue in einem neuen temporären Unterordner (ohne die 68 Artikel zu verändern) eine kleine Node- oder Single-File-HTML-App: "
                            "z. B. ein interaktives Tierwelt-Quiz oder einen [[Wikilink]]-Pfadfinder über stufe-3-obsidian-vault/_index.md, inkl. kurzem Smoke-Check."
                        ),
                        "deliverableHint": "Lauffähige Mini-App im eigenen Testordner + geprüfte Quellenverweise.",
                    },
                },
            },
        ],
        "transferBridge": [
            {
                "id": "kunden-projekte",
                "title": "1 · Kunden & Projekte",
                "roles": "Sales, Account Management, Projekt- & Programmleitung",
                "workshopPattern": "CO-STAR Briefing + Quellenpflicht (Stufe 2)",
                "ccfUseCase": "Öffentliche Ausschreibungs- oder Markt-Analysen, Executive-Briefings und Statusberichte mit expliziter Lücken-Spalte statt blinder Behauptungen.",
                "guardrailRule": "Jede Kennzahl und Frist muss eine Quelldatei/Abschnitt tragen; fehlende Angaben zwingend als „[Nicht in Quelle]“ markieren.",
                "starterPrompt": (
                    "Context: Kurze Management-Vorlage auf Basis bereitgestellter Projektdokumente.\n"
                    "Objective: Fasse Risiken, Termine und offene Punkte in max. 5 Bulletpoints zusammen.\n"
                    "Narrowing: Kein Vorwissen ergänzen. Jede Aussage mit (Dokumentname) belegen; Lücken als „[Nicht in Quelle]“ ausweisen."
                ),
            },
            {
                "id": "fachkonzept-daten",
                "title": "2 · Fachkonzept & Daten",
                "roles": "Business Analyst:innen, Fachkonzepter:innen, BI & Reporting",
                "workshopPattern": "Few-Shot-Schema + Obsidian-Index / [[Wikilinks]] (Stufe 3)",
                "ccfUseCase": "Abgleich von Fachbegriffen, Kennzahl-Definitionen und Querverweisen über viele Dokumente hinweg (z. B. Glossar ↔ Regelwerk ↔ Bericht).",
                "guardrailRule": "Definitionen erst über eine zentrale Übersichtskarte (_index.md) auflösen, Begriffe per Few-Shot in ein festes Tabellen-/JSON-Schema pressen.",
                "starterPrompt": (
                    "Extrahiere alle Fachbegriffe und Kennzahlen im Format „Begriff | Definition | Abhängigkeit | Quelle“.\n"
                    "Prüfe Querverweise über unsere Übersichtsdatei zuerst und markiere widersprüchliche oder fehlende Stellen explizit."
                ),
            },
            {
                "id": "betrieb-datenbanken",
                "title": "3 · Betrieb & Datenbanken",
                "roles": "DBA, Betrieb, Support, Incident- & Change-Management",
                "workshopPattern": "RISEN + CoT + Fakten-Prüfer (Stufe 2/3)",
                "ccfUseCase": "Runbook-Prüfung, Fehlerbild-Analyse und Migrations-Checklisten gegen verifizierte lokale Betriebsdokumente ohne Halluzinations-Risiko bei Kommandos.",
                "guardrailRule": "Striktes Negativtest-Verbot: Wenn ein Parameter, Port oder Pfad nicht im Runbook steht, niemals raten — abbrechen und Lücke melden.",
                "starterPrompt": (
                    "Role: Streng faktenbasierter Betriebs-Analyst.\n"
                    "Steps: 1. Prüfe jede Behauptung gegen unsere Runbooks. 2. Markiere jeden Schritt mit Belegt / Widersprüchlich / Nicht belegt.\n"
                    "Narrowing: Keine Befehle oder Schwellwerte aus dem Gedächtnis ergänzen."
                ),
            },
            {
                "id": "entwicklung-architektur",
                "title": "4 · Entwicklung & Architektur",
                "roles": "Software-Entwicklung, Web Dev, Lösungsarchitektur",
                "workshopPattern": "AGENTS.md + Skills + schmales MCP-Interface (Stufe 3 + MCP)",
                "ccfUseCase": "Reproduzierbare Code-Reviews, ADR-Synthese, Doku-Verifikation und zielgerichtete Read-Only-Tools per MCP statt riesiger unstrukturierter Kontext-Dumps.",
                "guardrailRule": "Arbeitsregeln im Repo versionieren (AGENTS.md + Skills) und MCP-Werkzeuge eng auf Such-, Lese- und Prüf-Verträge begrenzen.",
                "starterPrompt": (
                    "Lies zuerst AGENTS.md und die betroffene ADR/Spezifikation. Führe gegenläufige Anforderungen gegeneinander auf "
                    "und schlage nur Änderungen vor, die durch bestehende Tests oder Schnittstellen-Verträge gedeckt sind."
                ),
            },
        ],
        "starterArticles": starter_articles,
        "vaultArticles": vault_articles,
        "mcpConfigs": {
            "claudeCode": read_text("mcp-server/mcp-config-examples/claude-code.mcp.json"),
            "geminiCli": read_text("mcp-server/mcp-config-examples/gemini-cli.settings.json"),
            "codex": read_text("mcp-server/mcp-config-examples/codex.config.toml"),
            "vscodeCursor": read_text("mcp-server/mcp-config-examples/vscode-cursor.mcp.json"),
            "setupCommand": "node mcp-server/setup-client.mjs --client all --dry-run",
        },
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    SEARCH_INDEX_PATH.write_text(
        json.dumps(search_index, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Exported {OUT_PATH} ({OUT_PATH.stat().st_size} bytes, {len(vault_articles)} vault articles, "
        f"{len(starter_articles)} starter articles) + {SEARCH_INDEX_PATH} ({SEARCH_INDEX_PATH.stat().st_size} bytes, "
        f"{len(search_index)} keys)."
    )


if __name__ == "__main__":
    main()
