#!/usr/bin/env python3
"""Build the virtual7-branded CCF Hands-on PowerPoint presentation from virtual7_PPTMaster_2026_DE_klein.potx."""

from __future__ import annotations

import io
import re
import zipfile
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent
POTX_PATH = Path(r"c:\Users\180-1\Downloads\virtual7_PPTMaster_2026_DE_klein.potx")
OUT_PPTX = ROOT / "presentation" / "CCF_HandsOn_Prompt_Werkstatt.pptx"

# virtual7 Master Palette (explicit RGBs so theme dk1=FFFFFF never causes white-on-white text)
V7_GREEN = RGBColor(0xA9, 0xC2, 0x3F)
V7_GREEN_DARK = RGBColor(0x6E, 0x83, 0x1B)
V7_OLIVE = RGBColor(0x8A, 0x9E, 0x38)
V7_SOFT_GREEN = RGBColor(0xED, 0xF1, 0xC6)
V7_CREAM_GREEN = RGBColor(0xF7, 0xFA, 0xEB)
V7_CHARCOAL = RGBColor(0x57, 0x57, 0x56)
V7_DARK = RGBColor(0x2B, 0x2B, 0x2A)
V7_MUTED = RGBColor(0x6F, 0x6F, 0x6D)
V7_LIGHT_BG = RGBColor(0xF7, 0xF7, 0xF6)
V7_BORDER = RGBColor(0xDC, 0xDC, 0xD8)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

RED_SOFT = RGBColor(0xFD, 0xED, 0xED)
RED_DARK = RGBColor(0xB4, 0x23, 0x18)
AMBER_SOFT = RGBColor(0xFE, 0xF6, 0xE0)
AMBER_DARK = RGBColor(0xA1, 0x5C, 0x07)

FONT_FAMILY = "Calibri"


def load_template_presentation(potx_path: Path) -> Presentation:
    """Open .potx in memory as .pptx, strip broken NULL font rels and sample library slides cleanly."""
    buf = io.BytesIO()
    with zipfile.ZipFile(potx_path, "r") as zin, zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "[Content_Types].xml":
                data = data.replace(
                    b"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml",
                    b"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
                )
            elif item.filename == "ppt/_rels/presentation.xml.rels":
                s = data.decode("utf-8")
                s = re.sub(r'<Relationship[^>]*Target="NULL"[^>]*/>', "", s)
                data = s.encode("utf-8")
            elif item.filename == "ppt/presentation.xml":
                s = data.decode("utf-8")
                s = s.replace(' embedTrueTypeFonts="1"', "")
                s = re.sub(r"<p:embeddedFontLst>.*?</p:embeddedFontLst>", "", s, flags=re.S)
                data = s.encode("utf-8")
            zout.writestr(item, data)
    buf.seek(0)
    prs = Presentation(buf)

    for sldId in list(prs.slides._sldIdLst):
        rId = sldId.rId
        prs.part.drop_rel(rId)
        prs.slides._sldIdLst.remove(sldId)
    return prs


def save_clean_pptx(prs: Presentation, out_path: Path) -> None:
    """Save PPTX and restore SVG/EPS default content types stripped by python-pptx."""
    raw_out = io.BytesIO()
    prs.save(raw_out)
    raw_out.seek(0)

    final_out = io.BytesIO()
    with zipfile.ZipFile(raw_out, "r") as zin, zipfile.ZipFile(final_out, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "[Content_Types].xml":
                s = data.decode("utf-8")
                inject = ""
                if 'Extension="svg"' not in s:
                    inject += '<Default Extension="svg" ContentType="image/svg+xml"/>'
                if 'Extension="eps"' not in s:
                    inject += '<Default Extension="eps" ContentType="image/eps"/>'
                if inject:
                    s = s.replace('<Default Extension="png"', inject + '<Default Extension="png"', 1)
                data = s.encode("utf-8")
            zout.writestr(item, data)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(final_out.getvalue())


def set_notes(slide, notes_text: str) -> None:
    notes_slide = slide.notes_slide
    notes_slide.notes_text_frame.text = notes_text


def set_placeholder_text(slide, idx: int, text: str, color: RGBColor | None = None, size_pt: int | None = None, bold: bool | None = None) -> None:
    for ph in slide.placeholders:
        if ph.placeholder_format.idx == idx:
            tf = ph.text_frame
            tf.clear()
            lines = text.split("\n")
            for i, line in enumerate(lines):
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                run = p.add_run()
                run.text = line
                run.font.name = FONT_FAMILY
                if color is not None:
                    run.font.color.rgb = color
                if size_pt is not None:
                    run.font.size = Pt(size_pt)
                if bold is not None:
                    run.font.bold = bold
            return


def setup_header_meta(slide, date_text: str = "CCF Clustertag · 11:00–12:00") -> None:
    set_placeholder_text(slide, 10, "WIR GESTALTEN DIE DIGITALE ZUKUNFT DEUTSCHLANDS.", color=V7_SOFT_GREEN, size_pt=9, bold=True)
    set_placeholder_text(slide, 12, date_text, color=V7_SOFT_GREEN, size_pt=10, bold=True)


def add_rounded_card(
    slide,
    left: float,
    top: float,
    width: float,
    height: float,
    fill_color: RGBColor = WHITE,
    border_color: RGBColor = V7_BORDER,
    accent_bar_color: RGBColor | None = None,
):
    card = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(height),
    )
    card.adjustments[0] = 0.03
    card.fill.solid()
    card.fill.fore_color.rgb = fill_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.25)

    if accent_bar_color is not None:
        bar = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(left + 0.14),
            Inches(top + 0.12),
            Inches(width - 0.28),
            Inches(0.08),
        )
        bar.adjustments[0] = 0.5
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent_bar_color
        bar.line.fill.background()
    return card


def add_textbox(
    slide,
    left: float,
    top: float,
    width: float,
    height: float,
    lines: list[tuple[str, int, bool, RGBColor]],
    align: PP_ALIGN = PP_ALIGN.LEFT,
    valign: MSO_ANCHOR = MSO_ANCHOR.TOP,
    space_after_pt: int = 6,
):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = valign
    tf.margin_left = Inches(0.06)
    tf.margin_right = Inches(0.06)
    tf.margin_top = Inches(0.04)
    tf.margin_bottom = Inches(0.04)

    for i, (txt, size, is_bold, color) in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(space_after_pt)
        run = p.add_run()
        run.text = txt
        run.font.name = FONT_FAMILY
        run.font.size = Pt(size)
        run.font.bold = is_bold
        run.font.color.rgb = color
    return tb


def add_badge_pill(slide, left: float, top: float, width: float, height: float, text: str, fill_color: RGBColor, text_color: RGBColor):
    pill = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(left),
        Inches(top),
        Inches(width),
        Inches(height),
    )
    pill.adjustments[0] = 0.5
    pill.fill.solid()
    pill.fill.fore_color.rgb = fill_color
    pill.line.fill.background()
    tf = pill.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = text
    run.font.name = FONT_FAMILY
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = text_color
    return pill


def build_deck() -> None:
    prs = load_template_presentation(POTX_PATH)

    # Layouts verified from POTX:
    # 0 = Titelfolie, 2 = Kapiteltrenner, 7 = Nur Titel (freie Gestaltung), 26 = Titel + Tabelle
    lay_title = prs.slide_layouts[0]
    lay_chapter = prs.slide_layouts[2]
    lay_free = prs.slide_layouts[7]
    lay_table = prs.slide_layouts[26]

    # ------------------------------------------------------------------
    # SLIDE 1: Titelfolie
    # ------------------------------------------------------------------
    s1 = prs.slides.add_slide(lay_title)
    set_placeholder_text(s1, 0, "HANDS-ON:\nPROMPT-WERKSTATT", color=WHITE, size_pt=44, bold=True)
    set_placeholder_text(
        s1,
        1,
        "Vom ungefilterten Chat zum strukturierten KI-System\nCustomer Cluster Finance (CCF) · Nico Rimmele · 11:00–12:00 Uhr",
        color=WHITE,
        size_pt=20,
        bold=False,
    )
    set_placeholder_text(s1, 10, "WIR GESTALTEN DIE DIGITALE ZUKUNFT DEUTSCHLANDS.", color=WHITE, size_pt=9)
    set_placeholder_text(s1, 12, "CCF Clustertag", color=V7_DARK, size_pt=10, bold=True)
    set_notes(
        s1,
        "Begrüßung zum Praxisblock (11:00–12:00). Kurze Brücke vom Langdock-Einblick um 10:25: "
        "Jetzt probieren alle im Raum die Prinzipien selbst an 100 % öffentlichen Wikipedia-Daten aus.",
    )

    # ------------------------------------------------------------------
    # SLIDE 2: Brücke vom Vormittag
    # ------------------------------------------------------------------
    s2 = prs.slides.add_slide(lay_free)
    set_placeholder_text(s2, 0, "BRÜCKE VOM VORMITTAG: WAS WIR JETZT PRAKTISCH ERLEBEN", color=WHITE, size_pt=24, bold=True)
    setup_header_meta(s2)

    add_rounded_card(s2, 0.42, 1.72, 6.10, 5.20, fill_color=V7_LIGHT_BG, border_color=V7_BORDER, accent_bar_color=V7_CHARCOAL)
    add_badge_pill(s2, 0.65, 1.98, 2.75, 0.34, "EURE CCF-UMFRAGE (N = 47)", V7_CHARCOAL, WHITE)
    add_textbox(
        s2,
        0.65,
        2.45,
        5.65,
        4.20,
        [
            ("Was euch im Alltag bremst und was ihr wollt:", 16, True, V7_DARK),
            ("• 57 % wünschen sich konkretes Prompting-Training", 15, False, V7_CHARCOAL),
            ("• 62 % haben bisher noch keine Agent-Erfahrung", 15, False, V7_CHARCOAL),
            ("• 66 % sind bei RAG noch unsicher oder kennen es kaum", 15, False, V7_CHARCOAL),
            ("• 66 % nennen Datenschutz & fehlende Freigaben als Hürde", 15, False, V7_CHARCOAL),
            ("→ Ziel: Verstehen, wie man Ergebnisse verlässlich steuert.", 15, True, V7_GREEN_DARK),
        ],
        space_after_pt=10,
    )

    add_rounded_card(s2, 6.80, 1.72, 6.10, 5.20, fill_color=V7_CREAM_GREEN, border_color=V7_GREEN, accent_bar_color=V7_GREEN)
    add_badge_pill(s2, 7.05, 1.98, 3.15, 0.34, "60 MIN. PROMPT-WERKSTATT", V7_GREEN_DARK, WHITE)
    add_textbox(
        s2,
        7.05,
        2.45,
        5.65,
        4.20,
        [
            ("Unser sicheres Experimentierfeld heute:", 16, True, V7_DARK),
            ("• 100 % öffentliche Daten: 68 Wikipedia-Artikel (Tierwelt)", 15, False, V7_CHARCOAL),
            ("• Prompt-Labor: 4 Schreibweisen auf derselben Frage testen", 15, False, V7_CHARCOAL),
            ("• Harness & Skills: System-Prompts, Priming & Guardrails", 15, False, V7_CHARCOAL),
            ("• Markdown-RAG & MCP: Vom Datei-Chaos zum Obsidian-Vault", 15, False, V7_CHARCOAL),
            ("→ Highlight: Live-Fragen direkt auf den Beamer schicken!", 15, True, V7_GREEN_DARK),
        ],
        space_after_pt=10,
    )
    set_notes(
        s2,
        "Direkte Anknüpfung an Block 03 (Umfrage-Ergebnisse) und Block 01 (KI-Richtlinie): "
        "Wir arbeiten ausschließlich mit öffentlichen Tierwelt-Artikeln, sodass alle bedenkenlos testen können.",
    )

    # ------------------------------------------------------------------
    # SLIDE 3: 5 Ebenen der KI-Steuerung
    # ------------------------------------------------------------------
    s3 = prs.slides.add_slide(lay_free)
    set_placeholder_text(s3, 0, "VOM ROH-PROMPT ZUM KI-SYSTEM: 5 STEUERUNGSEBENEN", color=WHITE, size_pt=24, bold=True)
    setup_header_meta(s3)

    levels = [
        ("1. USER-PROMPT", "Einzelauftrag", "Steuert Ton & Ziel für genau eine Frage.\nVergisst Regeln bei langen Chats.", V7_LIGHT_BG, V7_CHARCOAL),
        ("2. PRIMING", "Chat-Aufwärmung", "Gibt im Browser-Chat zu Beginn Rolle, Glossar und Quellenregel vor.", V7_LIGHT_BG, V7_CHARCOAL),
        ("3. SYSTEM-PROMPT", "AGENTS.md", "Dauerhafte Hausordnung im Projekt: Was die KI immer einhalten muss.", V7_CREAM_GREEN, V7_OLIVE),
        ("4. HARNESS", "Skills & Guardrails", "Wiederverwendbare Abläufe (Recherche, Fakten-Check) & harte Grenzen.", V7_CREAM_GREEN, V7_GREEN_DARK),
        ("5. RAG & MCP", "Vault & Tools", "Strukturiertes Wissen (_index.md, [[Links]]) + Live-Werkzeuge.", V7_SOFT_GREEN, V7_GREEN_DARK),
    ]
    card_w = 2.34
    gap = 0.21
    start_x = 0.42
    for i, (hdr, sub, desc, bg, accent) in enumerate(levels):
        cx = start_x + i * (card_w + gap)
        add_rounded_card(s3, cx, 1.80, card_w, 3.85, fill_color=bg, border_color=V7_BORDER, accent_bar_color=accent)
        add_textbox(
            s3,
            cx + 0.10,
            2.05,
            card_w - 0.20,
            3.40,
            [
                (hdr, 13, True, accent),
                (sub, 15, True, V7_DARK),
                (desc, 13, False, V7_CHARCOAL),
            ],
            space_after_pt=8,
        )

    add_rounded_card(s3, 0.42, 5.90, 12.48, 0.98, fill_color=V7_CHARCOAL, border_color=V7_CHARCOAL)
    add_textbox(
        s3,
        0.65,
        6.00,
        12.00,
        0.78,
        [
            ("Brücke zu Kapitel 02 heute Morgen:   Chat (Ebene 1–2)   →   Agent + Harness (Ebene 3–4)   →   RAG & MCP (Ebene 5)", 15, True, WHITE),
            ("Die Konzepte dahinter sind im Browser-Chat (Track A) und im CLI-Agenten (Track B) identisch!", 13, False, V7_SOFT_GREEN),
        ],
        valign=MSO_ANCHOR.MIDDLE,
        space_after_pt=2,
    )
    set_notes(
        s3,
        "Erkläre kurz den Unterschied zwischen User-Prompt, Priming und dauerhaftem System-Prompt/AGENTS.md. "
        "Verweise auf den Begriff 'Harness' vom Vormittag: Regeln + Skills machen Agenten zuverlässig.",
    )

    # ------------------------------------------------------------------
    # SLIDE 4: 4 Prompt-Methoden im direkten Vergleich
    # ------------------------------------------------------------------
    s4 = prs.slides.add_slide(lay_free)
    set_placeholder_text(s4, 0, "1 AUFGABE, 4 METHODEN: WIE SCHREIBWEISE DIE ANTWORT STEUERT", color=WHITE, size_pt=23, bold=True)
    setup_header_meta(s4)

    add_rounded_card(s4, 0.42, 1.66, 12.48, 0.72, fill_color=V7_SOFT_GREEN, border_color=V7_GREEN)
    add_textbox(
        s4,
        0.60,
        1.72,
        12.10,
        0.60,
        [
            ("Identische Testaufgabe: „Welche Auswirkungen hat der Klimawandel laut unseren Dokumenten auf Eisbären und Steinkorallen?“", 14, True, V7_DARK),
        ],
        valign=MSO_ANCHOR.MIDDLE,
        space_after_pt=0,
    )

    methods = [
        ("1 · ZERO-SHOT", "Baseline (1 Satz)", "„Erkläre, wie der Klimawandel Eisbären und Korallen beeinflusst.“", "Schnell, aber vermischt Vorwissen, keine Quellen, beliebiges Format.", RED_SOFT, RED_DARK),
        ("2 · CO-STAR", "Briefings & Klartext", "Context · Objective · Style · Tone · Audience · Response.", "Steuert Zielgruppe, Struktur und Tonalität präzise für Memos.", V7_CREAM_GREEN, V7_GREEN_DARK),
        ("3 · FEW-SHOT", "Daten & Schema", "2 konkrete Input→Output-Beispiele vor der eigentlichen Frage.", "Erzwingt einheitliche Tabellen, JSON oder CSV ohne Erklärtext.", V7_CREAM_GREEN, V7_OLIVE),
        ("4 · RISEN + CoT", "Analyse & Prüfung", "Role · Instructions · Steps + Denkschritte · End Goal · Narrowing.", "Prüft Zahlen am Text und markiert fehlende Fakten sauber.", V7_SOFT_GREEN, V7_GREEN_DARK),
    ]
    mw = 2.96
    mgap = 0.21
    for i, (m_title, m_tag, m_how, m_fx, bg, col) in enumerate(methods):
        mx = 0.42 + i * (mw + mgap)
        add_rounded_card(s4, mx, 2.58, mw, 4.30, fill_color=bg, border_color=V7_BORDER, accent_bar_color=col)
        add_textbox(
            s4,
            mx + 0.14,
            2.82,
            mw - 0.28,
            3.85,
            [
                (m_title, 15, True, col),
                (m_tag, 13, True, V7_DARK),
                ("Aufbau:", 12, True, V7_MUTED),
                (m_how, 13, False, V7_CHARCOAL),
                ("Wirkung im Test:", 12, True, V7_MUTED),
                (m_fx, 13, False, V7_DARK),
            ],
            space_after_pt=6,
        )
    set_notes(
        s4,
        "Zeige den Teilnehmenden, dass alle 4 Methoden als Copy-Paste-Karten in der Begleit-App bereitliegen. "
        "Besonders Few-Shot (für Daten/BI/DB) und CO-STAR (für Analyse/PM/Sales) zeigen sofort Aha-Effekte.",
    )

    # ------------------------------------------------------------------
    # SLIDE 5: Live-Demo: Die 3 Projekt-Stufen
    # ------------------------------------------------------------------
    s5 = prs.slides.add_slide(lay_free)
    set_placeholder_text(s5, 0, "LIVE-VORFÜHRUNG: WAS VERÄNDERN STUFE 1, STUFE 2 UND STUFE 3?", color=WHITE, size_pt=23, bold=True)
    setup_header_meta(s5)

    stages = [
        ("STUFE 1 · CHAOS", "stufe-1-chaos/", RED_SOFT, RED_DARK, [
            "• Minimaler System-Prompt (1 Satz)",
            "• 68 lose Dateien in docs/ ohne Struktur",
            "• Keine Quellenpflicht, keine Grenzen",
            "• Effekt: Rät bei Lücken & halluziniert",
        ]),
        ("STUFE 2 · HARNESS", "stufe-2-skills-guardrails/", AMBER_SOFT, AMBER_DARK, [
            "• Klare Guardrails in AGENTS.md",
            "• Skills: quellen-recherche & fakten-pruefer",
            "• Pflicht: Dateinamen nach jeder Aussage",
            "• Effekt: Ehrliches „Nicht enthalten“",
        ]),
        ("STUFE 3 · MARKDOWN-RAG", "stufe-3-obsidian-vault/", V7_CREAM_GREEN, V7_GREEN_DARK, [
            "• _index.md (MOC) als Startpunkt",
            "• wiki/ mit YAML-Frontmatter & [[Wikilinks]]",
            "• Skills: vault-suche & wissen-synthese",
            "• Effekt: Präzise Verknüpfung über 4+ Artikel",
        ]),
    ]
    sw = 3.98
    sgap = 0.27
    for i, (st_title, st_dir, bg, accent, bullets) in enumerate(stages):
        sx = 0.42 + i * (sw + sgap)
        add_rounded_card(s5, sx, 1.78, sw, 4.00, fill_color=bg, border_color=V7_BORDER, accent_bar_color=accent)
        lines = [(st_title, 16, True, accent), (st_dir, 12, True, V7_MUTED)]
        for b in bullets:
            lines.append((b, 14, False, V7_DARK))
        add_textbox(s5, sx + 0.16, 2.04, sw - 0.32, 3.55, lines, space_after_pt=8)

    add_rounded_card(s5, 0.42, 5.98, 12.48, 0.92, fill_color=V7_LIGHT_BG, border_color=V7_GREEN)
    add_textbox(
        s5,
        0.62,
        6.05,
        12.08,
        0.78,
        [
            ("Live-Demo-Test mit Frage 3 (Fangfrage): „Wie viele Schneeleoparden leben im Schweizerischen Nationalpark?“", 14, True, V7_DARK),
            ("Faktencheck über alle 68 Dateien: 0 Treffer → In Stufe 1 oft Spekulation, in Stufe 2 & 3 klare Guardrail-Ablehnung.", 13, False, V7_GREEN_DARK),
        ],
        valign=MSO_ANCHOR.MIDDLE,
        space_after_pt=2,
    )
    set_notes(
        s5,
        "Hier wechselst du für die 10-Minuten-Live-Demo kurz in das Repo/die UI und führst Frage 3 (Fangfrage) "
        "und Frage 2 (Symbiose/Korallenbleiche) zwischen Stufe 1, 2 und 3 vor.",
    )

    # ------------------------------------------------------------------
    # SLIDE 6: Für jeden etwas (Track A, Track B & Wahl-Missionen)
    # ------------------------------------------------------------------
    s6 = prs.slides.add_slide(lay_free)
    set_placeholder_text(s6, 0, "FÜR JEDEN ETWAS: WERKZEUG-TRACKS & FREIE WAHL-MISSIONEN", color=WHITE, size_pt=23, bold=True)
    setup_header_meta(s6)

    add_rounded_card(s6, 0.42, 1.76, 5.95, 5.10, fill_color=V7_LIGHT_BG, border_color=V7_BORDER, accent_bar_color=V7_CHARCOAL)
    add_textbox(
        s6,
        0.64,
        2.02,
        5.50,
        4.60,
        [
            ("Zwei Wege – exakt dieselben Konzepte:", 16, True, V7_DARK),
            ("Track A · Browser & Web-Chat", 15, True, V7_GREEN_DARK),
            ("ChatGPT, Claude oder Gemini im Browser öffnen. Alle Prompts, Regeln und Starter-Artikel per 1-Klick aus unserer Begleit-App kopieren.", 14, False, V7_CHARCOAL),
            ("Track B · Terminal, IDE & Agent", 15, True, V7_GREEN_DARK),
            ("Claude Code, Codex, Gemini CLI oder OpenCode nacheinander in stufe-1/, stufe-2/ und stufe-3/ öffnen + MCP-Server einbinden.", 14, False, V7_CHARCOAL),
        ],
        space_after_pt=9,
    )

    add_rounded_card(s6, 6.62, 1.76, 6.28, 5.10, fill_color=V7_CREAM_GREEN, border_color=V7_GREEN, accent_bar_color=V7_GREEN)
    add_textbox(
        s6,
        6.84,
        2.02,
        5.84,
        4.60,
        [
            ("4 freie Wahl-Missionen für den Endspurt:", 16, True, V7_DARK),
            ("• Mission A · Fakten-Audit: Fehlerhafte Antwort mit fakten-pruefer zerlegen", 14, False, V7_CHARCOAL),
            ("• Mission B · Daten & Graph: JSON/CSV-Tabelle aus 6 Arten bauen & [[Links]] folgen", 14, False, V7_CHARCOAL),
            ("• Mission C · Executive Briefing: CO-STAR + Guardrails inkl. Lückenliste", 14, False, V7_CHARCOAL),
            ("• Mission D · Tools & Live-Beamer: Über MCP (send_to_beamer) oder UI-Formular eure Frage live auf die Leinwand senden!", 14, True, V7_GREEN_DARK),
        ],
        space_after_pt=10,
    )
    set_notes(
        s6,
        "Betone, dass es kein 'richtig' oder 'falsch' bei Track A vs. B gibt – jede Gruppe (2–4 Personen) wählt "
        "das Werkzeug, mit dem sie sich am wohlsten fühlt.",
    )

    # ------------------------------------------------------------------
    # SLIDE 7: Ablauf & 1-Klick-Quickstart (Layout[26] Titel + Tabelle)
    # ------------------------------------------------------------------
    s7 = prs.slides.add_slide(lay_table)
    set_placeholder_text(s7, 0, "ABLAUF (11:00–12:00 UHR) & 1-KLICK-QUICKSTART", color=WHITE, size_pt=24, bold=True)
    setup_header_meta(s7)

    rows = [
        ("Zeit", "Dauer", "Phase", "Fokus"),
        ("11:00–11:10", "10 Min.", "1. Live-Vorführung", "Stufe 1 vs. 2 vs. 3 live am Beamer + Gimmick-Vorschau"),
        ("11:10–11:15", "5 Min.", "2. Setup & Track-Wahl", "start-workshop.bat/.sh starten → http://127.0.0.1:3777/"),
        ("11:15–11:25", "10 Min.", "3. Prompt-Labor & Stufe 1", "4 Methoden vergleichen + Testfragen 1–3 im Chaos-Ordner"),
        ("11:25–11:37", "12 Min.", "4. Stufe 2 (Harness)", "System-Prompt, Priming, Guardrails & Skills erleben"),
        ("11:37–11:48", "11 Min.", "5. Stufe 3 (Obsidian-Vault)", "_index.md, Frontmatter & [[Wikilinks]] bei Querverbindungen"),
        ("11:48–11:55", "7 Min.", "6. Wahl-Mission & Beamer", "Mission wählen & Frage per UI oder MCP an Beamer senden"),
        ("11:55–12:00", "5 Min.", "7. Debrief im Plenum", "Live-Auswertung auf der Leinwand & 1 Take-away je Gruppe"),
    ]
    tbl_shape = s7.shapes.add_table(len(rows), 4, Inches(0.42), Inches(1.75), Inches(12.48), Inches(4.25))
    tbl = tbl_shape.table
    tbl.columns[0].width = Inches(1.55)
    tbl.columns[1].width = Inches(1.15)
    tbl.columns[2].width = Inches(3.20)
    tbl.columns[3].width = Inches(6.58)

    for r_idx, row_vals in enumerate(rows):
        for c_idx, val in enumerate(row_vals):
            cell = tbl.cell(r_idx, c_idx)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.fill.solid()
            if r_idx == 0:
                cell.fill.fore_color.rgb = V7_CHARCOAL
            elif r_idx % 2 == 1:
                cell.fill.fore_color.rgb = WHITE
            else:
                cell.fill.fore_color.rgb = V7_CREAM_GREEN
            tf = cell.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = val
            run.font.name = FONT_FAMILY
            run.font.size = Pt(13 if r_idx == 0 else 12)
            run.font.bold = r_idx == 0 or c_idx in (0, 2)
            run.font.color.rgb = WHITE if r_idx == 0 else V7_DARK

    add_rounded_card(s7, 0.42, 6.18, 12.48, 0.72, fill_color=V7_SOFT_GREEN, border_color=V7_GREEN)
    add_textbox(
        s7,
        0.62,
        6.23,
        12.08,
        0.60,
        [
            ("Quickstart nach dem Auschecken: Doppelklick start-workshop.bat (Win) oder ./start-workshop.sh (Mac/Linux) — läuft sofort ohne npm install!", 14, True, V7_DARK),
        ],
        valign=MSO_ANCHOR.MIDDLE,
        space_after_pt=0,
    )
    set_notes(
        s7,
        "Erkläre den Start: Wer auscheckt, startet mit 1 Klick die shadcn/ui-Begleit-App oder nutzt die gemeinsame LAN-URL / den QR-Code auf dem Beamer.",
    )

    # ------------------------------------------------------------------
    # SLIDE 8: Kapiteltrenner (Übergang auf Beamer)
    # ------------------------------------------------------------------
    s8 = prs.slides.add_slide(lay_chapter)
    set_placeholder_text(s8, 0, "AB IN DIE PRAXIS!", color=WHITE, size_pt=44, bold=True)
    set_placeholder_text(
        s8,
        1,
        "Wir wechseln jetzt auf die Live-Beamer-Ansicht (/beamer)\nCountdown-Timer · Aktuelle Aufgaben · Live-Fragen-Feed aus dem Raum",
        color=WHITE,
        size_pt=20,
        bold=False,
    )
    set_placeholder_text(s8, 2, "11:00–12:00", color=V7_DARK, size_pt=10, bold=True)
    set_notes(
        s8,
        "Jetzt PowerPoint minimieren bzw. direkt auf http://127.0.0.1:3777/beamer wechseln, "
        "Timer starten und zunächst die 10-Minuten-Live-Demo direkt in der Beamer-Regie vorführen.",
    )

    # ------------------------------------------------------------------
    # SLIDE 9: Debrief & 3 Take-aways
    # ------------------------------------------------------------------
    s9 = prs.slides.add_slide(lay_free)
    set_placeholder_text(s9, 0, "DEBRIEF & 3 TAKE-AWAYS FÜR DEN ALLTAG", color=WHITE, size_pt=24, bold=True)
    setup_header_meta(s9, "Fazit · 12:00 Uhr")

    takeaways = [
        ("1 · KONTEXT SCHLÄGT MAGIE", "Ein Roh-Prompt lässt das Modell raten. Klare Methoden (CO-STAR, Few-Shot, RISEN) liefern sofort nutzbare Struktur.", V7_CREAM_GREEN, V7_GREEN_DARK),
        ("2 · LEITPLANKEN SCHAFFEN VERTRAUEN", "System-Prompts, Guardrails und Skills machen aus generischem Text prüfbare Aussagen mit ehrlichen Lücken.", V7_CREAM_GREEN, V7_OLIVE),
        ("3 · STRUKTUR SCHLÄGT TEXTWÜSTEN", "Ein sauberer Index (_index.md), Frontmatter und [[Wikilinks]] + MCP schlagen das Durchsuchen loser Dateien.", V7_SOFT_GREEN, V7_GREEN_DARK),
    ]
    tw = 3.98
    tgap = 0.27
    for i, (t_head, t_body, bg, accent) in enumerate(takeaways):
        tx = 0.42 + i * (tw + tgap)
        add_rounded_card(s9, tx, 1.82, tw, 3.85, fill_color=bg, border_color=V7_BORDER, accent_bar_color=accent)
        add_textbox(
            s9,
            tx + 0.16,
            2.12,
            tw - 0.32,
            3.35,
            [
                (t_head, 16, True, accent),
                (t_body, 15, False, V7_DARK),
            ],
            space_after_pt=10,
        )

    add_rounded_card(s9, 0.42, 5.90, 12.48, 0.98, fill_color=V7_CHARCOAL, border_color=V7_CHARCOAL)
    add_textbox(
        s9,
        0.64,
        5.98,
        12.04,
        0.82,
        [
            ("Vielen Dank fürs Mitmachen!   ·   Weiter geht es um 13:00 Uhr mit dem Unit-Programm & World Café.", 16, True, WHITE),
            ("Das Repository bleibt für euch zum Weiterexperimentieren im Team jederzeit verfügbar.", 13, False, V7_SOFT_GREEN),
        ],
        valign=MSO_ANCHOR.MIDDLE,
        space_after_pt=2,
    )
    set_notes(
        s9,
        "Abschlussfolie um 11:55–12:00 nach dem Live-Feed-Debrief. Kurze Erinnerung an das Nachmittagsprogramm ab 13:00 Uhr.",
    )

    save_clean_pptx(prs, OUT_PPTX)
    print(f"Saved {OUT_PPTX} with {len(prs.slides)} slides.")


if __name__ == "__main__":
    build_deck()
