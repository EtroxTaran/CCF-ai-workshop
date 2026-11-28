/**
 * Pure ESM deterministic validator for participant workshop outputs & rulebooks.
 * Zero external dependencies, zero network/API calls, zero PII transmission.
 * Shared directly between workshop-ui and node:test unit tests.
 */

const PLACEHOLDER_SLUGS = new Set(["datei", "file", "slug"]);

function normalizeCitedSlug(rawToken) {
  let s = String(rawToken || "").trim().toLowerCase();
  if (!s) return "";
  s = s.split("#")[0].split("|")[0].trim();
  if (s.endsWith(".md")) s = s.slice(0, -3);
  if (s.includes("/")) {
    const parts = s.split("/").filter(Boolean);
    s = parts[parts.length - 1] || "";
  }
  return /^[a-z0-9_-]+$/.test(s) ? s : "";
}

export function extractCitedSlugs(text) {
  const cleaned = String(text || "").replace(/https?:\/\/[^\s)>\]]+/gi, " ");
  const found = [];
  const pushToken = (tok) => {
    const slug = normalizeCitedSlug(tok);
    if (slug) found.push(slug);
  };

  // 1. Parenthesized citations: (eisbaer.md), (wiki/tierarten/eisbaer.md), (arktis.md, eisbaer.md), (Quelle: ...), (Source: ...)
  const parenBlocks = cleaned.match(/\([^)\n]*\.md[^)\n]*\)/gi) || [];
  for (const block of parenBlocks) {
    const mdInBlock =
      block.match(/(?<![:/a-z0-9_.@-])(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.md(?!(?:\.[a-z0-9]|[a-z0-9_/@-]))/gi) || [];
    for (const m of mdInBlock) pushToken(m);
  }

  // 2. Square-bracketed .md citations (non-wikilink, e.g. [eisbaer.md] or [Quelle: eisbaer.md])
  const bracketBlocks = cleaned.match(/\[[^\]\n]*\.md[^\]\n]*\]/gi) || [];
  for (const block of bracketBlocks) {
    const mdInBlock =
      block.match(/(?<![:/a-z0-9_.@-])(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.md(?!(?:\.[a-z0-9]|[a-z0-9_/@-]))/gi) || [];
    for (const m of mdInBlock) pushToken(m);
  }

  // 3. Backtick citations: `eisbaer.md`, `wiki/tierarten/eisbaer.md`
  const backtickBlocks = cleaned.match(/`[^`\n]+`/g) || [];
  for (const block of backtickBlocks) {
    const mdInBlock =
      block.match(/(?<![:/a-z0-9_.@-])(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.md(?!(?:\.[a-z0-9]|[a-z0-9_/@-]))/gi) || [];
    for (const m of mdInBlock) pushToken(m);
  }

  // 4. Explicit Quelle:/Source: prefixes (single or comma/semicolon lists)
  const sourceLines =
    cleaned.match(
      /\b(?:quellen?|sources?)\s*:\s*(?:(?<![:/a-z0-9_.@-])(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.md(?!(?:\.[a-z0-9]|[a-z0-9_/@-])))(?:\s*[,;]\s*(?:(?<![:/a-z0-9_.@-])(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.md(?!(?:\.[a-z0-9]|[a-z0-9_/@-]))))*/gi
    ) || [];
  for (const line of sourceLines) {
    const mdInLine =
      line.match(/(?<![:/a-z0-9_.@-])(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.md(?!(?:\.[a-z0-9]|[a-z0-9_/@-]))/gi) || [];
    for (const m of mdInLine) pushToken(m);
  }

  // 5. Path-prefixed .md references anywhere in text: wiki/tierarten/eisbaer.md, corpus/runbook-zahlungslauf.md
  const pathPrefixed =
    cleaned.match(/(?<![:/a-z0-9_.@-])(?:[a-z0-9_-]+\/)+[a-z0-9_-]+\.md(?!(?:\.[a-z0-9]|[a-z0-9_/@-]))/gi) || [];
  for (const m of pathPrefixed) pushToken(m);

  // 6. Bare .md filenames in prose (e.g. "Laut phantom.md gilt das."), excluding email/domain prefixes & trailing sub-extensions
  const bareMd = cleaned.match(/(?<![:/a-z0-9_.@-])([a-z0-9_-]+\.md)(?!(?:\.[a-z0-9]|[a-z0-9_/@-]))/gi) || [];
  for (const m of bareMd) pushToken(m);

  // 7. Wikilinks: [[slug]], [[slug#Anker]], [[slug|alias]], [[slug#Anker|alias]]
  const wikiMatches = cleaned.match(/\[\[([^\]|\n#]+?)(?:#[^\]|\n]*)?(?:\|[^\]\n]*)?\]\]/g) || [];
  for (const w of wikiMatches) {
    const inner = w.slice(2, -2);
    pushToken(inner);
  }

  return [...new Set(found)];
}

function hasGapMarker(text) {
  const low = String(text || "").toLowerCase();
  return (
    low.includes("[nicht in quelle]") ||
    low.includes("[nicht in den quellen]") ||
    low.includes("[noch klären]") ||
    low.includes("[noch klaeren]") ||
    low.includes("nicht in den quellen") ||
    low.includes("nicht in den vorliegenden") ||
    low.includes("keine angabe in den") ||
    low.includes("offene lücken") ||
    low.includes("offene punkte") ||
    low.includes("[not in source]") ||
    low.includes("[not in sources]") ||
    low.includes("[not found in source]") ||
    low.includes("[not found in sources]") ||
    low.includes("[to be clarified]") ||
    low.includes("[missing from source]") ||
    low.includes("not in the source") ||
    low.includes("not in the sources") ||
    low.includes("not in provided source") ||
    low.includes("not found in the source") ||
    low.includes("not found in the sources") ||
    low.includes("not mentioned in the source") ||
    low.includes("no information in the source") ||
    low.includes("open gaps") ||
    low.includes("open questions")
  );
}

function makeCheck(id, label, passed, detail, fixPrompt = "", required = false) {
  return { id, label, passed: Boolean(passed), detail, fixPrompt, required: Boolean(required) };
}

export function validateParticipantOutput(goalId, rawText, ctx = {}) {
  const text = String(rawText || "").trim();
  const low = text.toLowerCase();
  const validSlugs = new Set((ctx.validSlugs || []).map((s) => String(s).toLowerCase()));
  const cited = extractCitedSlugs(text);
  const nonPlaceholderCited = cited.filter((s) => !PLACEHOLDER_SLUGS.has(s));
  const validCited =
    validSlugs.size > 0 ? nonPlaceholderCited.filter((s) => validSlugs.has(s)) : nonPlaceholderCited;
  const unknownCited =
    validSlugs.size > 0 ? nonPlaceholderCited.filter((s) => !validSlugs.has(s)) : [];

  const checks = [];
  const trapForbidden = (ctx.trapForbiddenTerms || [])
    .map((t) => String(t).trim())
    .filter((t) => t && low.includes(t.toLowerCase()));
  const hasTrapHallucination = trapForbidden.length > 0;
  let hasUnsafePattern = false;

  if (!text) {
    return {
      goalId,
      passed: false,
      score: 0,
      maxScore: 4,
      summary: "Noch kein KI-Ergebnis eingefügt.",
      nextStepTip: "Füge die Antwort deiner KI hier ein (oder teste oben ein Beispiel) und klicke auf „Ergebnis prüfen“.",
      checks: [
        makeCheck(
          "non-empty",
          "Antwort vorhanden",
          false,
          "Das Textfeld ist leer.",
          "Füge deine generierte KI-Antwort ein."
        ),
      ],
    };
  }

  if (goalId === "prompting") {
    checks.push(
      makeCheck(
        "depth",
        "Substanz & Struktur (>= 100 Zeichen)",
        text.length >= 100 &&
          (text.includes("\n") || text.includes("|") || text.includes("- ") || text.includes("* ")),
        text.length >= 100
          ? `${text.length} Zeichen mit klarer Gliederung.`
          : `Zu kurz (${text.length} Zeichen) — strukturiertes Format fehlt.`,
        "Bitte strukturiere deine Antwort in max. 5 klaren Stichpunkten oder einer Tabelle."
      )
    );
    checks.push(
      makeCheck(
        "citations",
        "Echte Quellenbelege (datei.md / [[slug]])",
        validCited.length >= 1 && unknownCited.length === 0,
        unknownCited.length > 0
          ? `Achtung: Unbekannte/erfundene Dateinamen gefunden (${unknownCited.join(", ")}).`
          : validCited.length >= 1
            ? `${validCited.length} echte Quelle(n) belegt: ${validCited.map((s) => `(${s}.md)`).join(", ")}.`
            : "Keine verifizierbare Quellenangabe wie (datei.md) gefunden.",
        "Ergänze hinter jeder Sachaussage den exakten Dateinamen in Klammern, z. B. (datei.md). Erfinde keine Dateinamen.",
        true
      )
    );
    const gapOk = hasGapMarker(text) && !hasTrapHallucination;
    checks.push(
      makeCheck(
        "gap-honesty",
        "Ehrliche Lücken-Markierung (kein Raten)",
        gapOk,
        hasTrapHallucination
          ? `Mögliche Halluzination entdeckt (${trapForbidden.join(", ")}) ohne Ablehnung.`
          : hasGapMarker(text)
            ? "Lücken sauber als [Nicht in Quelle] / [Not in source] markiert."
            : "Kein Lücken-Hinweis ([Nicht in Quelle] / [Not in source]) enthalten — Risiko für stilles Raten.",
        "Markiere jede fehlende Angabe ausdrücklich mit „[Nicht in Quelle]“ (bzw. „[Not in source]“) statt zu schätzen.",
        true
      )
    );
    const factCandidates = (
      Array.isArray(ctx.acceptedFactTokens) && ctx.acceptedFactTokens.length > 0
        ? ctx.acceptedFactTokens.map(String)
        : [
            ...(ctx.expectedFactToken ? [String(ctx.expectedFactToken)] : []),
            ...(Array.isArray(ctx.expectedFactAliases) ? ctx.expectedFactAliases.map(String) : []),
          ]
    )
      .map((s) => s.trim())
      .filter(Boolean);
    const factDisplayLabel = String(ctx.expectedFactDisplayLabel || ctx.expectedFactToken || "").trim();
    const hasMutatedOrVerifiedFact =
      factCandidates.length > 0
        ? factCandidates.some((tok) => low.includes(tok.toLowerCase()))
        : validCited.length >= 2 || text.length >= 220;
    checks.push(
      makeCheck(
        "precision",
        factDisplayLabel
          ? `Fakten-Treue (${factDisplayLabel})`
          : "Mehrere Perspektiven / Belegtiefe",
        hasMutatedOrVerifiedFact,
        hasMutatedOrVerifiedFact
          ? "Präzise Faktenabdeckung erkannt."
          : factDisplayLabel
            ? `Erwarteter Wert „${factDisplayLabel}“ fehlt im Ergebnis.`
            : "Verknüpfe mindestens 2 verschiedene Quellen für volle Belegtiefe.",
        factDisplayLabel
          ? `Prüfe nochmals alle konkreten Zahlen aus den bereitgestellten Dateien und übernimm „${factDisplayLabel}“ wortgetreu.`
          : "Prüfe nochmals alle konkreten Zahlen aus den bereitgestellten Dateien und übernimm sie wortgetreu.",
        true
      )
    );
  } else if (goalId === "app-building") {
    const looksLikeHtmlOrCode =
      low.includes("<!doctype html") ||
      low.includes("<html") ||
      low.includes("<script") ||
      low.includes("function ") ||
      low.includes("const ") ||
      low.includes("export ");
    const looksLikeSpec =
      (low.includes("problem") ||
        low.includes("ziel") ||
        low.includes("goal") ||
        low.includes("objective") ||
        low.includes("nutzer") ||
        low.includes("user") ||
        low.includes("user story") ||
        low.includes("purpose") ||
        low.includes("overview") ||
        low.includes("scope")) &&
      (low.includes("akzeptanz") ||
        low.includes("acceptance") ||
        low.includes("anforderung") ||
        low.includes("requirement") ||
        low.includes("feature") ||
        low.includes("daten") ||
        low.includes("data") ||
        low.includes("criteria") ||
        low.includes("specification") ||
        low.includes("spezifikation"));
    checks.push(
      makeCheck(
        "spec-or-code",
        "Spezifikation oder lauffähiger Prototyp",
        looksLikeHtmlOrCode || looksLikeSpec,
        looksLikeHtmlOrCode
          ? "HTML/JS-Prototyp erkannt."
          : looksLikeSpec
            ? "Strukturierte Mini-Spezifikation erkannt."
            : "Weder klare Spezifikation noch HTML/Code-Struktur erkannt.",
        "Beginne mit Problem + 3 Akzeptanzkriterien ODER gib eine eigenständige HTML-Datei inkl. <script> aus.",
        true
      )
    );
    const hasEdgeAndTests =
      /(?:\btest(?:s|fall|fälle|faelle|\s*case)?\b|akzeptanz|acceptance|\bedge(?:\s*case)?\b|eingabe|leere\s+(?:eingabe|daten)|empty\s+(?:input|state)|ungültig|ungueltig|invalid\s+(?:input|data)|fehler(?:fall|zustand|meldung|behandlung)|error\s*(?:state|handling|case|message)|mock|assert|prüf(?:fall|plan|schritt)|pruef(?:fall|plan|schritt)|szenario|scenario|validier|validat|fallback|try\s*\{)/.test(
        low
      );
    checks.push(
      makeCheck(
        "tests-edge",
        "Testfälle & Fehler-/Leerzustand bedacht",
        hasEdgeAndTests,
        hasEdgeAndTests
          ? "Testfälle, Akzeptanzkriterien oder Fehlerbehandlung enthalten."
          : "Keine Testfälle oder Edge-Case-/Fehlerbehandlung gefunden.",
        "Ergänze 3 konkrete Testfälle (inkl. ungültige Eingabe / fehlende Daten) und zeige eine klare Fehlermeldung."
      )
    );
    checks.push(
      makeCheck(
        "grounding",
        "Datenbasis belegt (keine erfundenen Zahlen)",
        !hasTrapHallucination && (validCited.length >= 1 || hasGapMarker(text)) && unknownCited.length === 0,
        hasTrapHallucination
          ? `Mögliche Halluzination entdeckt (${trapForbidden.join(", ")}) — Fangfragen-Begriff ohne Ablehnung übernommen.`
          : unknownCited.length > 0
            ? `Unbekannte/erfundene Quelle zitiert: ${unknownCited.join(", ")}.`
            : validCited.length >= 1
              ? `Verweist auf echte Quelldatei(en): ${validCited.join(", ")}.`
              : hasGapMarker(text)
                ? "Fehlende Daten sauber als [Nicht in Quelle] / [Not in source] ausgewiesen."
                : "Keine Rückbindung an eine echte Quelldatei oder [Nicht in Quelle] gefunden.",
        "Zeige in der App bzw. Spezifikation für jeden Fachwert die echte Quelldatei (datei.md) und erfinde keine Dateinamen.",
        true
      )
    );
    const unsafePattern =
      low.includes("api_key_here") ||
      low.includes("your_api_key") ||
      low.includes("insert_api_key") ||
      low.includes("todo: implement") ||
      /\bsk-(?:proj|ant|live|test)-[a-z0-9_-]{10,}\b/i.test(text) ||
      /\bsk-[a-z0-9]{20,}\b/i.test(text) ||
      /\bAIza[0-9A-Za-z_-]{20,}\b/.test(text) ||
      /\bgh[pousr]_[a-zA-Z0-9]{20,}\b/.test(text) ||
      /\beval\s*\(/i.test(text) ||
      /\bnew\s+Function\s*\(/i.test(text);
    if (unsafePattern) hasUnsafePattern = true;
    const safetyFixPrompt =
      !unsafePattern && text.length < 160
        ? "Ergänze mehr Substanz (mind. 160 Zeichen), z. B. Problembeschreibung, Akzeptanzkriterien und vollständigen HTML-/Spec-Block."
        : "Entferne Platzhalter-TODOs sowie API-Keys und nutze ausschließlich lokale Daten ohne eval().";
    checks.push(
      makeCheck(
        "safety",
        "Saubere Umsetzung (keine Platzhalter-Secrets / eval)",
        !unsafePattern && text.length >= 160,
        unsafePattern
          ? "Unsicheres Muster oder unfertiger Platzhalter (eval / API_KEY_HERE / Secret Key / TODO) gefunden."
          : text.length < 160
            ? "Ausgabe ist zu knapp für eine abnahmefähige Spezifikation/App."
            : "Keine Platzhalter-Secrets oder unsicheren eval()-Aufrufe gefunden.",
        safetyFixPrompt,
        true
      )
    );
  } else if (goalId === "presentations") {
    const slideMatches =
      text.match(/(?:^|\n)\s*(?:#{1,3}\s*|\*{1,2})?(?:folie|slide)\s*\d+[^\n]*/gi) || [];
    const headingMatches = text.match(/(?:^|\n)\s*#{1,3}\s+[^\n]+/g) || [];
    const inlineSlideMatches =
      slideMatches.length < 3 && headingMatches.length < 3
        ? text.match(/\b(?:folie|slide)\s*\d+\b(?:(?!(?:folie|slide)\s*\d+)[^\n]){0,80}/gi) || []
        : [];
    const slides =
      slideMatches.length >= 3
        ? slideMatches
        : headingMatches.length >= 3
          ? headingMatches
          : inlineSlideMatches.length > Math.max(slideMatches.length, headingMatches.length)
            ? inlineSlideMatches
            : slideMatches.length >= headingMatches.length
              ? slideMatches
              : headingMatches;
    checks.push(
      makeCheck(
        "slide-count",
        "Klare Folien-Struktur (>= 4 Folien)",
        slides.length >= 4,
        slides.length >= 4
          ? `${slides.length} Folien/Abschnitte erkannt.`
          : `Nur ${slides.length} Folie(n) erkannt (Ziel: mindestens 4–5 Folien).`,
        "Gliedere den Entwurf in 5 nummerierte Folien (Folie 1 bis Folie 5 / Slide 1 to Slide 5) mit klarer Überschrift.",
        true
      )
    );
    const avgTitleWords =
      slides.length > 0
        ? slides.reduce(
            (sum, s) => sum + s.replace(/^[#*\s]+/, "").replace(/\*+$/, "").trim().split(/\s+/).length,
            0
          ) / slides.length
        : 0;
    const hasStoryline =
      /(situation|komplikation|complication|frage|question|antwort|answer|scqa|fazit|conclusion|summary|empfehlung|recommendation|entscheidung|decision|warum|why|ausblick|outlook|next steps)/.test(
        low
      );
    checks.push(
      makeCheck(
        "action-titles",
        "Action-Titles & SCQA-Storyline",
        avgTitleWords >= 3.5 && hasStoryline,
        avgTitleWords >= 3.5 && hasStoryline
          ? `Aussagekräftige Folientitel (Ø ${avgTitleWords.toFixed(1)} Wörter) + klare Storyline.`
          : "Folientitel sind noch zu kurz (Stichworte statt Kernaussagen) oder Storyline (SCQA/Fazit) fehlt.",
        "Formuliere jeden Folientitel als vollständige Kernaussage (Action-Title) nach Situation → Komplikation → Antwort."
      )
    );
    const hasSpeakerNotes =
      /(notiz|sprecher|moderation|voiceover|hinweis für|hinweis fuer|speaker\s*notes?|presenter\s*notes?|talking\s*points?)/.test(
        low
      );
    checks.push(
      makeCheck(
        "citations-notes",
        "Quellenbelege (datei.md) & Sprechernotizen",
        validCited.length >= 1 && unknownCited.length === 0 && hasSpeakerNotes,
        unknownCited.length > 0
          ? `Unbekannte Quelle zitiert: ${unknownCited.join(", ")}.`
          : !hasSpeakerNotes
            ? "Sprechernotizen pro Folie fehlen noch."
            : validCited.length === 0
              ? "Dateibelege wie (datei.md) auf den Folien fehlen noch."
              : `${validCited.length} Quelle(n) + Sprechernotizen vorhanden.`,
        "Ergänze pro Folie eine Zeile „Sprechernotiz:“ (bzw. „Speaker notes:“) und belege jede Kennzahl mit (datei.md).",
        true
      )
    );
    checks.push(
      makeCheck(
        "gaps",
        "Ehrliche Lücken-Folie / [Nicht in Quelle]",
        hasGapMarker(text) && !hasTrapHallucination,
        hasTrapHallucination
          ? `Mögliche Halluzination entdeckt (${trapForbidden.join(", ")}) — Fangfragen-Begriff statt [Nicht in Quelle].`
          : hasGapMarker(text)
            ? "Offene Lücken transparent ausgewiesen."
            : "Hinweis auf fehlende Daten / [Nicht in Quelle] / [Not in source] fehlt noch.",
        "Füge auf der Abschluss- oder Risiko-Folie einen Block „Offene Punkte / [Nicht in Quelle]“ hinzu.",
        true
      )
    );
  } else {
    // everyday-ai
    const hasSummaryOrDecisions =
      /(beschluss|beschluesse|entscheidung|decision|zusammenfassung|summary|ergebnis|result|outcome|key findings|überblick|ueberblick|overview)/.test(
        low
      );
    const hasActions =
      /(aufgabe|aktion|action|maßnahme|massnahme|next step|to-do|todo|- \[ \]|measure|task)/.test(low);
    const hasOwnerOrDeadline =
      /(owner|verantwortlich|zuständig|zustaendig|assignee|assigned|responsible|lead|frist|termin|datum|deadline|due|by\s+\d|bis\s+\d|montag|dienstag|mittwoch|donnerstag|freitag|monday|tuesday|wednesday|thursday|friday)/.test(
        low
      );
    const hasRisksOrOpen =
      /(risiko|risiken|risk|risks|offen|open\s+(?:point|item|question|issue)|klärung|klaerung|clarif|rückfrage|rueckfrage|blocker|caveat)/.test(
        low
      );

    checks.push(
      makeCheck(
        "decisions",
        "Klare Ergebnisse / Entscheidungen",
        hasSummaryOrDecisions && text.length >= 120,
        hasSummaryOrDecisions
          ? "Zusammenfassung bzw. Beschlüsse klar herausgearbeitet."
          : "Abschnitt für Entscheidungen/Ergebnisse fehlt.",
        "Trenne klar zwischen „Entscheidungen/Fakten“ und „Nächsten Schritten“."
      )
    );
    checks.push(
      makeCheck(
        "actions-owners",
        "Aufgaben mit Owner & Frist (oder [Noch klären])",
        hasActions && (hasOwnerOrDeadline || hasGapMarker(text)),
        hasActions && (hasOwnerOrDeadline || hasGapMarker(text))
          ? "Aktionen inkl. Zuständigkeit/Frist oder Lückenmarker erkannt."
          : "Konkrete Aufgaben mit Owner/Frist (bzw. [Noch klären] / [To be clarified]) fehlen.",
        "Liste Aufgaben im Format „Maßnahme | Owner | Frist (oder [Noch klären])“."
      )
    );
    checks.push(
      makeCheck(
        "risks",
        "Risiken & offene Klärungspunkte",
        hasRisksOrOpen && hasGapMarker(text) && !hasTrapHallucination,
        hasTrapHallucination
          ? `Mögliche Halluzination entdeckt (${trapForbidden.join(", ")}) — Fangfragen-Begriff statt [Nicht in Quelle].`
          : hasRisksOrOpen && hasGapMarker(text)
            ? "Offene Punkte & [Nicht in Quelle] / [Not in source] sauber markiert."
            : "Risiken oder explizite Lücken-Markierung ([Nicht in Quelle] / [Not in source]) fehlen.",
        "Ergänze einen Abschnitt „Offene Fragen & [Nicht in Quelle]“, damit keine Zusagen erfunden werden."
      )
    );
    checks.push(
      makeCheck(
        "sources",
        "Quellenbindung (datei.md)",
        validCited.length >= 1 && unknownCited.length === 0,
        unknownCited.length > 0
          ? `Unbekannte Quelle zitiert: ${unknownCited.join(", ")}.`
          : validCited.length >= 1
            ? `${validCited.length} echte Quelle(n) referenziert.`
            : "Keine (datei.md)-Quellenangabe gefunden.",
        "Belege jede Zahl und Frist mit (datei.md)."
      )
    );
  }

  const score = checks.filter((c) => c.passed).length;
  const maxScore = checks.length;
  const requiredPassed = checks.filter((c) => c.required).every((c) => c.passed);
  const passed =
    score >= Math.max(3, maxScore - 1) &&
    requiredPassed &&
    unknownCited.length === 0 &&
    !hasTrapHallucination &&
    !hasUnsafePattern;
  const failed = checks.filter((c) => !c.passed);

  return {
    goalId,
    passed,
    score,
    maxScore,
    summary: passed
      ? `Bestanden (${score}/${maxScore} Kriterien erfüllt) — belastbares Workshop-Ergebnis!`
      : `Noch ${failed.length} Punkt(e) nachschärfen (${score}/${maxScore} erfüllt).`,
    nextStepTip: failed[0]?.fixPrompt || "Alle Kriterien erfüllt — jetzt unten in die Ziel-Rubrik und den Takeaway-Export übernehmen!",
    checks,
  };
}

export function validateRulebook(ruleText, negativeTest, options = {}) {
  const format = options?.format || "agents-md";
  const rule = String(ruleText || "").trim();
  const neg = String(negativeTest || "").trim();
  const lowRule = rule.toLowerCase();

  // Strip gap-marker phrases before checking Pillar 2 so "[Nicht in Quelle]" / "[Not in source]"
  // in Pillar 3 does not falsely satisfy Pillar 2's citation requirement.
  const ruleWithoutGaps = lowRule
    .replace(
      /\[\s*(?:nicht in (?:der |den )?quellen?|not (?:found )?in (?:the )?sources?|noch kl[aä]ren|to be clarified|missing from sources?)\s*\]/gi,
      " "
    )
    .replace(/nicht in (?:der |den )?quellen?/gi, " ")
    .replace(/not (?:found )?in (?:the )?sources?/gi, " ");

  const hasBindingDe =
    /(ausschließlich|ausschliesslich|nur\s+.*(datei|unterlage|text|quelle|dokument|wissen|wissensbasis|wissensdatei|workspace|projektdatei)|kein\s+.*vorwissen|ohne\s+.*vorwissen|nicht\s+raten)/.test(
      lowRule
    );
  const hasBindingEn =
    /(\b(?:only\s+(?:use|rely\s+on|based\s+on|from|answer\s+from|work\s+with)|(?:use|rely|based|answer|work|ground(?:ed)?)\s+only(?:\s+(?:on|from|in|with))?)\b.*(?:files?|documents?|sources?|corpus|articles?|texts?|materials?|data|attachments?|knowledge|context|provided|uploaded|workspace|project)|exclusively\s+(?:from|on|in|with)\b.*(?:files?|documents?|sources?|corpus|articles?|texts?|materials?|data|attachments?|knowledge|context|provided|uploaded|workspace|project)|strictly\s+(?:from|grounded\s+in)\b|no\s+(?:prior|external|outside|general)\s+knowledge|(?:do\s+not|don't)\s+(?:guess|invent|fabricate|use\s+(?:any\s+)?(?:prior|outside|external|general)\s+knowledge))/.test(
      lowRule
    );

  const hasCitationRule =
    /(dateiname|dateinamen|(?:datei|file|slug)\.md|quellenangabe|quellenpflicht|quellenbeleg|dateibeleg|quelle\s+angeben|quellen\s+angeben|mit\s+(?:dem\s+)?(?:exakten\s+)?datei|mit\s+quelle|belege\s+jede|jede\s+aussage\s+mit|pro\s+(?:satz|aussage).*quelle|zitiere|zitation|filename|file\s+name|source\s+file|source\s+attribution|cite\b|citation|attribute\s+(?:every|each)|with\s+(?:the\s+)?(?:exact\s+)?source|every\s+(?:claim|statement)\s+with|each\s+(?:claim|statement)\s+with)/.test(
      ruleWithoutGaps
    );

  const hasGapRule =
    /(\[nicht in quelle\]|\[nicht in den quellen\]|\[noch klären\]|\[noch klaeren\]|\[not in source\]|\[not in sources\]|\[not found in source\]|\[not found in sources\]|\[to be clarified\]|\[missing from source\])/.test(
      lowRule
    );

  const formatHintCitation =
    format === "custom-instructions"
      ? "Ergänze: „Belege jede Aussage mit dem Dateinamen der Wissensdatei (z. B. datei.md).“"
      : format === "ide-rules"
        ? "Ergänze: „Belege jede Aussage mit dem exakten Workspace-Dateinamen (datei.md).“"
        : "Ergänze: „Belege jede Aussage mit dem exakten Dateinamen (datei.md).“";

  const checks = [
    makeCheck(
      "binding",
      "1. Strikte Quellenbindung (kein Vorwissen)",
      hasBindingDe || hasBindingEn,
      "Bindet die KI verbindlich auf deine Dateien statt Trainingswissen.",
      "Ergänze: „Nutze ausschließlich Fakten aus den bereitgestellten Unterlagen — kein Vorwissen.“"
    ),
    makeCheck(
      "citation",
      "2. Quellenpflicht pro Aussage",
      hasCitationRule,
      "Erzwingt Überprüfbarkeit pro Satz.",
      formatHintCitation
    ),
    makeCheck(
      "gap",
      "3. Expliziter Lücken-Marker",
      hasGapRule,
      "Macht Wissenslücken sofort sichtbar statt höflich zu raten.",
      "Ergänze: „Markiere fehlende Angaben zwingend mit [Nicht in Quelle] (bzw. [Not in source]).“"
    ),
    makeCheck(
      "neg-test",
      "4. Realistische Test-Fangfrage (>= 20 Zeichen)",
      neg.length >= 20 && neg.includes("?"),
      neg.length >= 20
        ? "Konkrete Fangfrage für den Vorher/Nachher-Test vorhanden."
        : "Formuliere eine konkrete Testfrage mit ‚?‘, die sicher NICHT in deinen Dateien steht.",
      "Schreibe eine konkrete Testfrage mit ‚?‘, z. B. nach einem nicht vorhandenen Budget."
    ),
  ];

  const score = checks.filter((c) => c.passed).length;
  return {
    goalId: "rulebook",
    passed: score === checks.length,
    score,
    maxScore: checks.length,
    summary:
      score === checks.length
        ? "4/4 Leitplanken komplett — bereit für den Montagmorgen!"
        : `${score}/4 Leitplanken erfüllt — bitte markierte Punkte ergänzen.`,
    nextStepTip: checks.find((c) => !c.passed)?.fixPrompt || "Alle 4 Säulen erfüllt!",
    checks,
  };
}

export function getValidatorSample(goalId, kind = "pass", ctx = {}) {
  const validSlugs = Array.isArray(ctx.validSlugs) ? ctx.validSlugs.map((s) => String(s)) : [];
  const validSlugsLower = validSlugs.map((s) => s.toLowerCase());
  const isL2 =
    ctx.moduleId === "context-engineering-projekt" ||
    validSlugsLower.includes("sla-betriebsmodell");
  const s1 =
    ctx.samplePrimarySlug ||
    (validSlugsLower.includes("eisbaer")
      ? "eisbaer"
      : validSlugsLower.includes("sla-betriebsmodell")
        ? "sla-betriebsmodell"
        : validSlugs[0] || "eisbaer");
  const s2 =
    ctx.sampleSecondarySlug ||
    (validSlugsLower.includes("arktis")
      ? "arktis"
      : validSlugsLower.includes("architektur-entscheidung-01")
        ? "architektur-entscheidung-01"
        : validSlugs[1] || s1);

  if (kind === "fail") {
    if (goalId === "app-building") {
      return "Hier ist eine tolle App-Idee: Wir bauen ein Dashboard mit Echtzeit-KI und API_KEY_HERE. TODO: implement data fetching.";
    }
    if (goalId === "presentations") {
      return "# Intro\nText über das Thema.\n# Details\nEs gibt viele spannende Fakten und Risiken.\n# Ende\nDanke!";
    }
    if (goalId === "everyday-ai") {
      return "Das Meeting lief gut. Wir müssen nächste Woche weitermachen und alles prüfen.";
    }
    if (isL2) {
      return "Für das Krypto-Wallet-Addon von Kernbank 2026 gelten 50.000 Euro Vertragsstrafe pro Woche und das System wird auf AWS Lambda betrieben.";
    }
    return "Eisbären leben in der Arktis und im Schweizerischen Nationalpark gibt es etwa 45 Schneeleoparden für 25 Euro Eintritt.";
  }

  if (goalId === "app-building") {
    return [
      "# Mini-Spezifikation: Fakten-Prüfer",
      "## Problem & Ziel",
      `Nutzer prüfen Kennzahlen gegen (${s1}.md) und (${s2}.md) ohne Halluzinationen.`,
      "## Akzeptanzkriterien & Testfälle",
      "1. Testfall Normalfall: Gültiger Suchbegriff zeigt belegten Wert mit (datei.md).",
      "2. Testfall Leerzustand: Leere Eingabe zeigt klare Meldung ohne Absturz.",
      "3. Edge Case Fangfrage: Unbekannter Begriff liefert zwingend [Nicht in Quelle].",
      "```html",
      "<!DOCTYPE html><html><body><script>const status = '[Nicht in Quelle]';</script></body></html>",
      "```",
    ].join("\n");
  }
  if (goalId === "presentations") {
    return [
      "## Folie 1: Klare Kontext-Regeln senken KI-Fehlerraten sofort (Situation)",
      `- Ausgangslage: Ungefilterte Chats raten bei Lücken (${s1}.md).`,
      "Sprechernotiz: Einstieg mit dem Risiko ungesteuerter Antworten.",
      "## Folie 2: Komplikation — Ohne Belegpflicht entstehen teure Halluzinationen",
      `- Konkrete Kennzahlen stehen eindeutig in (${s1}.md) und (${s2}.md).`,
      "Sprechernotiz: Zeige das konkrete Gegenbeispiel aus dem Experiment.",
      "## Folie 3: Antwort — Drei Leitplanken + Index lösen das Problem",
      `- Quellenpflicht (${s1}.md), [Nicht in Quelle] und zentrales Inhaltsverzeichnis.`,
      "Sprechernotiz: Erkläre den Nutzen verlässlicher Kontext-Regeln in 30 Sekunden.",
      "## Folie 4: Praxis-Beleg — Verknüpfte Quellen sichern Konsistenz",
      `- Querverweise zwischen (${s1}.md) und (${s2}.md) verhindern Widersprüche.`,
      "Sprechernotiz: Zeige am konkreten Datensatz, wie Quellenverweise geprüft werden.",
      "## Folie 5: Empfehlung & Offene Lücken für Montag",
      "- Fazit: Jede Team-Regel vor Einsatz mit einer Fangfrage testen ([Nicht in Quelle]).",
      "Sprechernotiz: Konkreten nächsten Schritt für das Team festhalten.",
    ].join("\n");
  }
  if (goalId === "everyday-ai") {
    return [
      "### Zusammenfassung & Entscheidungen",
      `- Kernfakten verbindlich anhand (${s1}.md) und (${s2}.md) abgeglichen.`,
      "### Aufgaben (Nächste Schritte)",
      `- [ ] Regeln als Vorlage sichern | Owner: [Noch klären] | Frist: [Noch klären] (${s1}.md)`,
      "- [ ] Budget-Freigabe einholen | Owner: [Noch klären] | Frist: [Noch klären]",
      "### Risiken & Offene Fragen",
      "- Risiko bei Lücken: Fehlende Klauseln werden mit [Nicht in Quelle] markiert.",
    ].join("\n");
  }
  if (isL2) {
    return [
      "### Geprüftes Ergebnis",
      `- Verbindliches Betriebsziel: 4 Stunden RTO (${s1}.md) und 15 Minuten RPO (${s2}.md).`,
      `- Transactional Outbox Pattern und zugehörige Vorgaben sind in (${s2}.md) belegt.`,
      "- Offene / fehlende Angabe zu Krypto-Wallet-Vertragsstrafen: [Nicht in Quelle]",
    ].join("\n");
  }
  return [
    "### Geprüftes Ergebnis",
    `- Der Eisbär besitzt 42 Zähne und schwarze Haut unter dem Fell (${s1}.md).`,
    `- Der Arktische Ozean könnte nach Prognosen ab 2030 im Sommer eisfrei sein (${s2}.md).`,
    "- Offene / fehlende Angabe zu Schneeleoparden im Schweizerischen Nationalpark: [Nicht in Quelle]",
  ].join("\n");
}
