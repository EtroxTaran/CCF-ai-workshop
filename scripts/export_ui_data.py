#!/usr/bin/env python3
"""Export verified corpus, stage files, prompts, phases and missions into workshop-ui/src/data/workshopData.json."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "scripts" / "corpus_manifest.json"
OUT_PATH = ROOT / "workshop-ui" / "src" / "data" / "workshopData.json"

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


def read_text(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8").strip()


def extract_wiki_preview(slug: str, category: str) -> list[str]:
    sub = {"lebensraum": "lebensraeume", "tierart": "tierarten", "konzept": "konzepte"}[category]
    txt = (ROOT / "stufe-3-obsidian-vault" / "wiki" / sub / f"{slug}.md").read_text(encoding="utf-8")
    m = re.search(r"## Wichtige Fakten auf einen Blick\s+([\s\S]*?)\n## ", txt)
    if not m:
        return []
    bullets = [ln.lstrip("- ").strip() for ln in m.group(1).splitlines() if ln.strip().startswith("- ")]
    return bullets[:4]


def main() -> None:
    manifest: list[dict[str, Any]] = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    starter_articles = []
    for item in manifest:
        if item["slug"] in STARTER_SLUGS:
            raw_md = read_text(f"stufe-1-chaos/docs/{item['slug']}.md")
            starter_articles.append(
                {
                    "slug": item["slug"],
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

    data: dict[str, Any] = {
        "meta": {
            "title": "Prompt-Werkstatt · virtual7 CCF Clustertag",
            "subtitle": "Vom ungefilterten Chat zum strukturierten KI-System",
            "presenter": "Nico Rimmele",
            "cluster": "Customer Cluster Finance (CCF)",
            "timeSlot": "11:00–12:00 Uhr",
            "articleCount": len(manifest),
            "complianceNote": "100 % öffentliche Wikipedia-Artikel (Tierwelt & Ökosysteme) – keine internen oder personenbezogenen Daten.",
        },
        "phases": [
            {
                "id": "demo",
                "number": 1,
                "timeRange": "11:00–11:10",
                "durationMin": 10,
                "title": "Live-Vorführung am Beamer",
                "subtitle": "Stufe 1 vs. 2 vs. 3 & Live-Gimmick",
                "beamerHeadline": "Live-Demo: Warum Kontext & Leitplanken alles verändern",
                "trackACue": "Zurücklehnen & beobachten: Wo rät ein ungefilterter Chat? Wo greifen Guardrails?",
                "trackBCue": "Achte darauf, wie derselbe Agent nur durch AGENTS.md, Skills und _index.md anders navigiert.",
                "activeQuestionId": "q3",
                "keyTakeaway": "Gleiches Modell, gleiche Dateien – völlig anderes Ergebnis durch Kontext-Design.",
            },
            {
                "id": "setup",
                "number": 2,
                "timeRange": "11:10–11:15",
                "durationMin": 5,
                "title": "Setup & Track-Wahl",
                "subtitle": "Team finden, UI starten, Track A/B wählen",
                "beamerHeadline": "Jetzt startet ihr: Wählt Track A (Browser) oder Track B (CLI/Agent)",
                "trackACue": "Öffne diese Seite + deinen Browser-Chat (ChatGPT, Claude, Gemini). Nutze die 1-Klick-Kopierpakete.",
                "trackBCue": "Öffne das Repo lokal (claude / codex / gemini / opencode) und starte in stufe-1-chaos/.",
                "activeQuestionId": "q1",
                "keyTakeaway": "Beide Tracks testen dieselben Paradigmen – wähle einfach dein bevorzugtes Werkzeug.",
            },
            {
                "id": "methoden-stufe1",
                "number": 3,
                "timeRange": "11:15–11:25",
                "durationMin": 10,
                "title": "Prompt-Methoden & Stufe 1 (Chaos)",
                "subtitle": "4 Schreibweisen vergleichen + Fragen 1–3 im Chaos-Ordner",
                "beamerHeadline": "Runde 1: Ungefilterter Chat & 4 Prompt-Methoden im Vergleich",
                "trackACue": "Teste erst die 4 Methoden im Tab 'Prompt-Methoden', dann Fragen 1–3 mit dem schwachen Stufe-1-Prompt.",
                "trackBCue": "Arbeite in stufe-1-chaos/: Stelle Fragen 1–3. Beobachte fehlende Quellen und Halluzinationen.",
                "activeQuestionId": "q1",
                "keyTakeaway": "Ein vager Roh-Prompt überlässt dem Modell das Raten – Struktur steuert sofort Ton, Format & Fokus.",
            },
            {
                "id": "stufe2",
                "number": 4,
                "timeRange": "11:25–11:37",
                "durationMin": 12,
                "title": "Stufe 2: System-Prompt, Skills & Guardrails",
                "subtitle": "Priming, Quellenpflicht & Negativtest (Frage 3)",
                "beamerHeadline": "Runde 2: Der Harness – Guardrails & Skills verändern die Antwort",
                "trackACue": "Nutze im Browser das Stufe-2-Priming (AGENTS.md + quellen-recherche) und stelle erneut Fragen 1–3!",
                "trackBCue": "Wechsle in stufe-2-skills-guardrails/: Beobachte, wie AGENTS.md + fakten-pruefer Frage 3 sauber ablehnen.",
                "activeQuestionId": "q3",
                "keyTakeaway": "Guardrails verhindern Erfindungen; Skills geben wiederholbare Arbeitsweisen vor.",
            },
            {
                "id": "stufe3",
                "number": 5,
                "timeRange": "11:37–11:48",
                "durationMin": 11,
                "title": "Stufe 3: Obsidian-Vault (Markdown-RAG)",
                "subtitle": "_index.md, YAML-Frontmatter & [[Wikilinks]]",
                "beamerHeadline": "Runde 3: Strukturiertes Wissen – Markdown-RAG über Index & Graph",
                "trackACue": "Nutze _index.md + den Mini-Vault-Explorer hier in der App und teste die Querverbindungs-Frage 2.",
                "trackBCue": "Wechsle in stufe-3-obsidian-vault/: Der Agent liest erst _index.md und springt gezielt über [[Wikilinks]].",
                "activeQuestionId": "q2",
                "keyTakeaway": "Kuratierte Struktur (Index + Links + Metadaten) schlägt pures Datei-Chaos bei vernetzten Fragen.",
            },
            {
                "id": "missionen",
                "number": 6,
                "timeRange": "11:48–11:55",
                "durationMin": 7,
                "title": "Wahl-Missionen & Live-Beamer-Gimmick",
                "subtitle": "Fakten-Audit, Daten/Graph, Briefing oder MCP live testen",
                "beamerHeadline": "Endspurt: Löst eine Wahl-Mission & schickt euer Highlight auf den Beamer!",
                "trackACue": "Wähle eine der 4 Wahl-Missionen und klicke auf 'An Beamer senden', um euren Fund zu teilen.",
                "trackBCue": "Teste Frage 4 (Zahl ändern / eigenen Skill) oder schicke per MCP-Tool send_to_beamer live an die Leinwand!",
                "activeQuestionId": "q4",
                "keyTakeaway": "Mit MCP und eigenen Skills wird aus einem Chat ein vernetztes Arbeitswerkzeug.",
            },
            {
                "id": "debrief",
                "number": 7,
                "timeRange": "11:55–12:00",
                "durationMin": 5,
                "title": "Debrief & Live-Leinwand",
                "subtitle": "Ergebnisse prüfen & je 1 Learning teilen",
                "beamerHeadline": "Debrief: Live-Ergebnisse vom Beamer-Feed & eure wichtigsten Aha-Momente",
                "trackACue": "Schaut gemeinsam auf die Beamer-Auswertung eurer Fragen – welches Muster hat euch am meisten überrascht?",
                "trackBCue": "Teilt 1 zentrales Take-away eurer Gruppe – danach geht es ab 13:00 weiter ins Nachmittagsprogramm!",
                "activeQuestionId": "q2",
                "keyTakeaway": "Kontext schlägt Magie. Leitplanken + sauberes Wissen machen KI im Alltag verlässlich.",
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
                "analogy": "Werkzeuge, Datenbanken & Live-Schnittstellen",
                "persistence": "Standardisiertes Protokoll (Model Context Protocol)",
                "authority": "Direkte Aktion statt reinem Text-Raten",
                "example": "`search_wildlife_vault`, `verify_claim_against_corpus`, `send_to_beamer`.",
            },
        ],
        "trackAPrimingTemplate": (
            "SYSTEM-PRIMING FÜR DIESEN CHAT (bitte ab sofort für alle Antworten einhalten):\n"
            "Du bist ein präziser Recherche-Assistent für unsere hochgeladenen/eingefügten Markdown-Dokumente.\n"
            "Verbindliche Regeln:\n"
            "1. Nutze AUSSCHLIESSLICH die von mir bereitgestellten Texte – kein allgemeines Weltwissen zum Lückenfüllen.\n"
            "2. Nenne nach jeder faktischen Aussage den exakten Dateinamen in Klammern, z. B. (eisbaer.md).\n"
            "3. Wenn eine Information nicht in den Dokumenten steht, antworte exakt: „Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“\n"
            "4. Antworte sachlich, kurz und strukturiert (max. 5 Bulletpoints oder kompakte Tabelle).\n"
            "Bestätige kurz mit „Verstanden – bereit für deine Fragen“, bevor ich die Dokumente schicke."
        ),
        "testQuestions": [
            {
                "id": "q1",
                "number": 1,
                "type": "Detailfrage (1 Datei)",
                "question": "Warum gefriert das Fell des Eisbären nicht, welche Hautfarbe hat ein ausgewachsener Eisbär darunter, und wie viele Zähne besitzt er?",
                "targetDocs": ["eisbaer.md"],
                "whatToWatch": "Nennt die KI exakt den Squalen-freien Eisbärentalg, die schwarze Haut (bei Babys rosa), hohle transparente Haare und 42 Zähne – inkl. Quelle?",
                "solutionSummary": "Laut `eisbaer.md`: Eine Schicht aus Eisbärentalg (ohne Squalen, hydrophob) lässt Wasser abperlen/verdunsten, bevor Eisnukleation entsteht. Darunter liegt schwarze Haut (bei Babys rosa) und eine 5–10 cm Fettschicht; der Eisbär besitzt 42 Zähne.",
            },
            {
                "id": "q2",
                "number": 2,
                "type": "Querverbindungs-Frage (4+ Dateien)",
                "question": "Vergleiche die Symbiose zwischen Anemonenfischen und Seeanemonen mit der Symbiose zwischen Steinkorallen und Zooxanthellen: Wie schützen sich Anemonenfische vor Nesselzellen, welcher Symbiose-Typ liegt jeweils räumlich vor, und was passiert bei starker Erwärmung im Korallenriff?",
                "targetDocs": ["anemonenfische.md", "seeanemonen.md", "symbiose.md", "steinkorallen.md", "korallenbleiche.md"],
                "whatToWatch": "Findet die KI alle verknüpften Dateien? Besonders in Stufe 3 helfen `_index.md` + `[[Wikilinks]]`, Ektosymbiose vs. Endosymbiose sauber zu trennen.",
                "solutionSummary": "`anemonenfische.md`: Schleimhaut mit geringem Anteil an Sialinsäuren schützt vor Nesselzellen. `symbiose.md`: Clownfisch & Seeanemone = Ektosymbiose (körperlich getrennt), Zooxanthellen in Steinkorallen = Endosymbiose (in Zellen). `steinkorallen.md` + `korallenbleiche.md`: Ideal 20–29 °C; bei Wärmestress (z. B. 29 °C) Photoinhibition/oxidativer Stress -> Abstoßung der Zooxanthellen (Korallenbleiche); ohne Rückkehr binnen ca. acht Wochen sterben Korallen ab.",
            },
            {
                "id": "q3",
                "number": 3,
                "type": "Fangfrage / Negativtest (NICHT im Korpus!)",
                "question": "Wie hoch ist der aktuelle Bestand an Schneeleoparden im Schweizerischen Nationalpark und welche jährlichen Tourismus-Eintrittspreise in Euro werden dort zum Artenschutz erhoben?",
                "targetDocs": [],
                "whatToWatch": "DER Härtetest: Rät/spekuliert die KI in Stufe 1? Oder antwortet sie in Stufe 2 & 3 sauber: „Diese Information ist in den vorliegenden Dokumenten nicht enthalten.“?",
                "solutionSummary": "Weder „Schneeleopard“, noch „Schweizerischer Nationalpark“, noch „Eintrittspreis“ kommen in einer einzigen der 68 Dateien vor (0 Treffer). Korrekte Antwort in Stufe 2 & 3: klare Ablehnung ohne Spekulation.",
            },
            {
                "id": "q4",
                "number": 4,
                "type": "Steuerungs- & Manipulations-Aufgabe",
                "question": "Ändere in einer lokalen Kopie (z. B. `stufe-2-skills-guardrails/docs/eisbaer.md`) kurz „42 Zähne“ auf „38 Zähne“ ODER ergänze in `AGENTS.md` eine neue Formatpflicht (z. B. 3-spaltige Risiko-Tabelle) und prüfe, ob die KI strikt deinen Daten/Regeln statt ihrem Vorwissen folgt.",
                "targetDocs": ["eisbaer.md", "AGENTS.md"],
                "whatToWatch": "Beweist den Unterschied zwischen Modell-Gedächtnis und lokalem Kontext/Harness. (Danach Zahl im Repo bitte wieder auf `42` zurückstellen!)",
                "solutionSummary": "Mit aktivem Guardrail übernimmt die KI „38 Zähne (docs/eisbaer.md)“ ohne stillschweigend aus dem Training zu korrigieren – so wird Kontext-Priorisierung überprüfbar.",
            },
        ],
        "stages": [
            {
                "id": "stufe-1",
                "folder": "stufe-1-chaos",
                "title": "Stufe 1 · Chaos (Ungefilterter Chat)",
                "badge": "Baseline",
                "summary": "Minimale Anweisung ohne Quellenpflicht, ohne Guardrails und ohne Struktur im Ordner docs/.",
                "agentsMd": read_text("stufe-1-chaos/AGENTS.md"),
                "skills": [],
                "trackBPrompt": "Ich bin im Ordner stufe-1-chaos/. Beantworte folgende Frage anhand der Dateien in docs/:\n\n[Frage 1, 2 oder 3 hier einfügen]",
            },
            {
                "id": "stufe-2",
                "folder": "stufe-2-skills-guardrails",
                "title": "Stufe 2 · Skills & Guardrails (Harness)",
                "badge": "Kontrolle",
                "summary": "Klare Leitplanken in AGENTS.md + zwei wiederverwendbare Skills (quellen-recherche & fakten-pruefer).",
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
                "trackBPrompt": "Ich bin im Ordner stufe-2-skills-guardrails/. Nutze den Skill quellen-recherche und alle Guardrails aus AGENTS.md für folgende Frage:\n\n[Frage 1, 2 oder 3 hier einfügen]",
            },
            {
                "id": "stufe-3",
                "folder": "stufe-3-obsidian-vault",
                "title": "Stufe 3 · Obsidian-Vault (Markdown-RAG)",
                "badge": "Wissens-Graph",
                "summary": "3-Zonen-Architektur (raw/, wiki/, _index.md) mit YAML-Frontmatter, [[Wikilinks]] und Synthese-Skills.",
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
                "trackBPrompt": "Ich bin im Ordner stufe-3-obsidian-vault/. Starte bei _index.md und nutze die Skills vault-suche sowie wissen-synthese für folgende Frage:\n\n[Frage 2 oder eigene Querverbindung hier einfügen]",
            },
        ],
        "missions": [
            {
                "id": "m1-audit",
                "title": "Mission A · Fakten-Audit & Qualitäts-Check",
                "tag": "Qualität & Prüfung",
                "description": "Nimm eine freie Chat-Antwort aus Stufe 1 und jage sie durch den Skill `fakten-pruefer`. Decke gnadenlos auf, was belegt ist und was dazuerfunden wurde.",
                "prompt": (
                    "Nutze den Skill fakten-pruefer und prüfe diese Aussage kritisch gegen unsere Dokumente:\n"
                    "„Eisbären haben weiße Haut unter ihrem dichten weißen Fell, wiegen bis zu 800 kg, fressen am liebsten Pinguine und ihre Haare leiten UV-Licht wie Glasfaserkabel direkt auf die Haut.“\n"
                    "Markiere jeden Teilpunkt mit Belegt / Widersprüchlich / Nicht belegt inkl. exakter Quelle!"
                ),
            },
            {
                "id": "m2-data",
                "title": "Mission B · Datenstruktur & Wissens-Graph",
                "tag": "Struktur & Daten",
                "description": "Verwandle unstrukturierte Fließtexte in ein sauberes Datenmodell (JSON oder Markdown-Tabelle) für 6 Tierarten aus verschiedenen Lebensräumen.",
                "prompt": (
                    "Lies im Vault _index.md und extrahiere für Eisbär, Ringelrobbe, Anemonenfische, Alpenmurmeltier, Steinadler und Gepard eine saubere JSON-Liste (und Markdown-Tabelle) mit den Feldern: "
                    "title, habitat, status, hauptbedrohung_oder_anpassung, wikilink, source_file. Erfinde fehlende Felder nicht, sondern schreibe \"[Nicht in Quelle]\"."
                ),
            },
            {
                "id": "m3-briefing",
                "title": "Mission C · Executive Briefing mit Klartext-Lücken",
                "tag": "Kommunikation & Nutzen",
                "description": "Formuliere nach CO-STAR + Guardrails ein kompaktes Entscheider-Briefing zu wirtschaftlichen und ökologischen Risiken der Korallenbleiche.",
                "prompt": (
                    "Context: Kurze Entscheidungsvorlage für eine Projekt- und Cluster-Runde.\n"
                    "Objective: Fasse die ökologischen und wirtschaftlichen Folgen der Korallenbleiche anhand von korallenbleiche.md, korallenriff.md und steinkorallen.md zusammen.\n"
                    "Audience: Teamleitung & Management.\n"
                    "Response: Max. 5 prägnante Bulletpoints mit belegten Zahlen (z. B. Küstenschutz, Tourismusumsatz, Zeitfenster) + separater Block „Offene Lücken in unseren Quellen“."
                ),
            },
            {
                "id": "m4-mcp",
                "title": "Mission D · Eigener Skill & Live-Beamer-Gimmick",
                "tag": "Agenten & MCP",
                "description": "Teste eine eigene Regel/Skill-Erweiterung ODER nutze den MCP-Server / das Formular, um eure spannendste Frage + KI-Befund live auf die Leinwand zu schicken!",
                "prompt": (
                    "Nutze das MCP-Tool search_wildlife_vault für das Thema 'Korallenbleiche Klimawandel', "
                    "prüfe die Kernaussage mit verify_claim_against_corpus und sende anschließend mit send_to_beamer unsere Gruppen-Erkenntnis live an den Beamer!"
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
            "cliCommand": 'node mcp-server/submit-question.mjs --team "Euer Team" --question "Wie überwintern Alpenmurmeltiere?" --stage "Stufe 3"',
        },
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported {OUT_PATH} ({len(vault_articles)} vault articles, {len(starter_articles)} starter articles).")


if __name__ == "__main__":
    main()
