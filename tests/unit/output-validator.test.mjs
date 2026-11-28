import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractCitedSlugs,
  validateParticipantOutput,
  validateRulebook,
  getValidatorSample,
} from "../../shared/output-validator.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function collectSlugs(dir) {
  const slugs = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) slugs.push(...collectSlugs(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) slugs.push(path.basename(entry.name, ".md"));
  }
  return slugs.sort();
}

const l1Slugs = collectSlugs(path.join(ROOT, "stufe-3-obsidian-vault", "wiki"));
const l2Slugs = collectSlugs(path.join(ROOT, "modules", "context-engineering-projekt", "corpus"));

test("validateParticipantOutput checks all 4 goals cleanly on pass/fail samples and flags unknown citations", () => {
  for (const goalId of ["prompting", "app-building", "presentations", "everyday-ai"]) {
    const passSample = getValidatorSample(goalId, "pass", { validSlugs: l1Slugs });
    const passRes = validateParticipantOutput(goalId, passSample, { validSlugs: l1Slugs });
    assert.equal(passRes.passed, true, `${goalId} pass sample failed: ${JSON.stringify(passRes)}`);
    assert.ok(passRes.score >= passRes.maxScore - 1);

    const failSample = getValidatorSample(goalId, "fail", { validSlugs: l1Slugs });
    const failRes = validateParticipantOutput(goalId, failSample, { validSlugs: l1Slugs });
    assert.equal(failRes.passed, false, `${goalId} fail sample unexpectedly passed`);
  }

  // Unknown citation fails grounding check
  const fakeCite = validateParticipantOutput(
    "prompting",
    "Laut (erfundene-datei-999.md) betraegt der Wert 100. [Nicht in Quelle] · Fazit: Test.",
    { validSlugs: l1Slugs }
  );
  assert.equal(fakeCite.passed, false);

  // L2 corpus sample check
  const l2Sample = getValidatorSample("presentations", "pass", { validSlugs: l2Slugs });
  const l2Res = validateParticipantOutput("presentations", l2Sample, { validSlugs: l2Slugs });
  assert.equal(l2Res.passed, true);
});

test("validateRulebook checks all 4 pillars deterministically", () => {
  const weak = validateRulebook("Sei nett und hilfreich.", "Was kostet es?");
  assert.equal(weak.passed, false);
  assert.ok(weak.score < weak.maxScore);

  const strong = validateRulebook(
    `1. Nutze ausschließlich Fakten aus den bereitgestellten Dateien — kein Vorwissen.
2. Belege jede Aussage mit dem exakten Dateinamen (datei.md).
3. Markiere fehlende Angaben zwingend mit [Nicht in Quelle].`,
    "Welche Vertragsstrafe gilt laut aktuellem Vertrag für das Modul Krypto-Wallet?"
  );
  assert.equal(strong.passed, true);
  assert.equal(strong.score, 4);
  assert.equal(strong.maxScore, 4);
});

test("validateParticipantOutput passes valid EN answers across all 4 goals and catches EN trapForbiddenTerms", () => {
  const enCtx = {
    validSlugs: l1Slugs,
    expectedFactToken: "38 Zähne",
    expectedFactAliases: ["38 teeth", "38 zähne"],
    trapForbiddenTerms: ["25 euro", "45 snow leopards", "45 schneeleoparden"],
  };

  const enPrompting = [
    "### Verified Summary",
    "- Polar bears have black skin and 38 teeth according to the updated sheet (eisbaer.md).",
    "- Coral bleaching reaches critical thresholds after eight weeks (korallenbleiche.md).",
    "- Missing park ticket pricing: [Not in source]",
  ].join("\n");
  const resPrompt = validateParticipantOutput("prompting", enPrompting, enCtx);
  assert.equal(resPrompt.passed, true);
  assert.equal(resPrompt.score, 4);

  const trapFail = validateParticipantOutput(
    "prompting",
    enPrompting + "\n- Park entry costs 25 euro and there are 45 snow leopards.",
    enCtx
  );
  assert.equal(trapFail.passed, false);
  assert.equal(trapFail.checks.find((c) => c.id === "gap-honesty")?.passed, false);

  const enApp = [
    "# Mini Specification: Fact Checker",
    "## Problem & Goal",
    "Users verify claims against (eisbaer.md) and (korallenbleiche.md) without guessing.",
    "## Acceptance Criteria & Test Cases",
    "1. Test normal flow: valid query shows verified value with (file.md).",
    "2. Test empty/error state: empty input returns clear validation message.",
    "3. Edge case trap: unknown fact outputs [Not in source].",
    "```js",
    "const status = '[Not in source]';",
    "```",
  ].join("\n");
  const resApp = validateParticipantOutput("app-building", enApp, { validSlugs: l1Slugs });
  assert.equal(resApp.passed, true);
  assert.equal(resApp.score, 4);

  const enSlides = [
    "## Slide 1: Situation — Strict Context Rules Cut AI Hallucinations",
    "- Baseline: unfiltered chats guess when sources omit numbers (eisbaer.md).",
    "Speaker notes: Introduce the risk of ungrounded answers.",
    "## Slide 2: Complication — Missing Citations Hide Costly Errors",
    "- Verified figures come directly from (eisbaer.md) and (korallenbleiche.md).",
    "Speaker notes: Walk through the before/after comparison.",
    "## Slide 3: Answer — Three Guardrails Plus Index Solve Grounding",
    "- Require source citation (eisbaer.md) and [Not in source] markers.",
    "Speaker notes: Summarize the 3-stage architecture.",
    "## Slide 4: Recommendation & Open Questions for Monday",
    "- Conclusion: Validate every rulebook with a negative test ([Not in source]).",
    "Speaker notes: Assign next actions to the team.",
  ].join("\n");
  const resSlides = validateParticipantOutput("presentations", enSlides, { validSlugs: l1Slugs });
  assert.equal(resSlides.passed, true);
  assert.equal(resSlides.score, 4);

  const enEveryday = [
    "### Summary & Decisions",
    "- Core facts reconciled strictly against (eisbaer.md) and (korallenbleiche.md).",
    "### Action Items",
    "- [ ] Publish team rulebook template | Owner: Team Lead | Deadline: Friday (eisbaer.md)",
    "- [ ] Confirm unverified budget item | Owner: [To be clarified] | Due: [To be clarified]",
    "### Risks & Open Questions",
    "- Risk on missing clauses: ungrounded numbers must be flagged with [Not in source].",
  ].join("\n");
  const resEveryday = validateParticipantOutput("everyday-ai", enEveryday, { validSlugs: l1Slugs });
  assert.equal(resEveryday.passed, true);
  assert.equal(resEveryday.score, 4);
});

test("validateParticipantOutput rejects invented/unknown filenames across all 4 goals", () => {
  for (const goalId of ["prompting", "app-building", "presentations", "everyday-ai"]) {
    const sample = getValidatorSample(goalId, "pass", { validSlugs: l1Slugs });
    const firstCited = extractCitedSlugs(sample)[0];
    assert.ok(firstCited, `${goalId} sample must include at least one cited slug`);
    const mutated = sample.replace(`(${firstCited}.md)`, "(phantom-report-999.md)");
    assert.notEqual(mutated, sample, `${goalId} sample mutation must change citation`);
    const res = validateParticipantOutput(goalId, mutated, { validSlugs: l1Slugs });
    assert.equal(res.passed, false, `${goalId} with invented citation must fail`);
  }

  // Presentations must fail unknown citation even when valid citation + speaker notes are present
  const mixedSlides = [
    "## Folie 1: Situation — Belastbare Analyse mit echter Quelle",
    "- Echter Wert aus (eisbaer.md) bestätigt.",
    "Sprechernotiz: Einstieg mit validem Beleg.",
    "## Folie 2: Komplikation — Eingeschmuggelte erfundene Datei",
    "- Zusätzliche Behauptung aus (phantom-deck.md).",
    "Sprechernotiz: Zweite Notiz vorhanden.",
    "## Folie 3: Antwort — Strenge Prüfung erkennt Fake-Datei",
    "- Jede Datei muss im Korpus existieren (korallenbleiche.md).",
    "Sprechernotiz: Dritte Notiz vorhanden.",
    "## Folie 4: Empfehlung — Offene Lücken markieren",
    "- Fehlende Angaben als [Nicht in Quelle] ausweisen.",
    "Sprechernotiz: Vierte Notiz vorhanden.",
  ].join("\n");
  const mixedRes = validateParticipantOutput("presentations", mixedSlides, { validSlugs: l1Slugs });
  assert.equal(mixedRes.passed, false);
  assert.equal(mixedRes.checks.find((c) => c.id === "citations-notes")?.passed, false);
});

test("app-building placeholders pass while real invented filenames fail, and safety distinguishes task-1/risk-register from real secrets/eval", () => {
  const placeholderApp = [
    "# Mini-Spezifikation: Test-App",
    "## Problem & Ziel",
    "Nutzer prüfen Kennzahlen gegen (eisbaer.md) mit Platzhalter-Hinweis (datei.md) und (file.md).",
    "## Akzeptanzkriterien & Testfälle",
    "1. Testfall Normalfall: Zeige Beleg aus task-1 und risk-register sowie (datei.md).",
    "2. Testfall Fehlerfall: Leere Eingabe zeigt klare Meldung [Nicht in Quelle].",
  ].join("\n");
  const placeholderRes = validateParticipantOutput("app-building", placeholderApp, { validSlugs: l1Slugs });
  assert.equal(placeholderRes.passed, true);
  assert.equal(placeholderRes.score, 4);
  assert.equal(placeholderRes.checks.find((c) => c.id === "safety")?.passed, true);

  const inventedApp = placeholderApp.replace("(datei.md)", "(phantom-report.md)");
  const inventedRes = validateParticipantOutput("app-building", inventedApp, { validSlugs: l1Slugs });
  assert.equal(inventedRes.passed, false);
  assert.equal(inventedRes.checks.find((c) => c.id === "grounding")?.passed, false);

  for (const unsafeToken of [
    "sk-proj-1234567890abcdef",
    "AIzaSyDummyKeyValue1234567890",
    "ghp_1234567890abcdefghij1234",
    "eval(userInput)",
    "new Function('return 1')",
  ]) {
    const unsafeApp = `${placeholderApp}\n// ${unsafeToken}`;
    const unsafeRes = validateParticipantOutput("app-building", unsafeApp, { validSlugs: l1Slugs });
    assert.equal(unsafeRes.passed, false, `Unsafe token ${unsafeToken} should fail validation`);
    assert.equal(
      unsafeRes.checks.find((c) => c.id === "safety")?.passed,
      false,
      `Unsafe token ${unsafeToken} should fail safety check`
    );
  }
});

test("extractCitedSlugs parses backticks, path prefixes, Quelle:/Source: lists, wikilinks with anchors/aliases, and ignores URLs", () => {
  const input = [
    "Beleg in Backticks `walross.md` und Pfad wiki/tierarten/eisbaer.md.",
    "Quelle: korallenbleiche.md, steinkorallen.md; Source: arktis.md, symbiose.md.",
    "Obsidian-Links [[alpensteinbock#Lebensraum]] und [[schneehase#Fell|Schneehase]].",
    "Ignoriere Web-URL https://example.com/docs/not-a-citation.md und http://foo.bar/fake.md.",
  ].join("\n");
  const cited = extractCitedSlugs(input);
  for (const expected of [
    "walross",
    "eisbaer",
    "korallenbleiche",
    "steinkorallen",
    "arktis",
    "symbiose",
    "alpensteinbock",
    "schneehase",
  ]) {
    assert.ok(cited.includes(expected), `Missing cited slug: ${expected}`);
  }
  assert.equal(cited.includes("not-a-citation"), false);
  assert.equal(cited.includes("fake"), false);
});

test("validateRulebook supports EN, custom-instructions/ide-rules formats, and prevents Pillar 2 false positive from gap markers", () => {
  const enStrong = validateRulebook(
    [
      "1. Rely only on the provided files and documents — do not use prior knowledge.",
      "2. Cite every claim with the exact source filename (file.md).",
      "3. Mark any missing information strictly with [Not in source].",
    ].join("\n"),
    "What is the penalty fee for the crypto wallet module in Q4?"
  );
  assert.equal(enStrong.passed, true);
  assert.equal(enStrong.score, 4);

  // Pillar 2 must fail if citation rule is absent even when [Nicht in Quelle] / [Not in source] appears
  const noCiteDe = validateRulebook(
    "Nutze ausschließlich Fakten aus den bereitgestellten Dateien. Markiere fehlende Angaben mit [Nicht in Quelle].",
    "Wie hoch ist das nicht dokumentierte Sonderbudget?"
  );
  assert.equal(noCiteDe.passed, false);
  assert.equal(noCiteDe.checks[1].id, "citation");
  assert.equal(noCiteDe.checks[1].passed, false);

  const noCiteCustom = validateRulebook(
    "Use only the uploaded files. Mark missing facts with [Not in source].",
    "What is the undisclosed bonus budget for next quarter?",
    { format: "custom-instructions" }
  );
  assert.equal(noCiteCustom.checks[1].passed, false);
  assert.match(noCiteCustom.checks[1].fixPrompt, /Wissensdatei/);

  const noCiteIde = validateRulebook(
    "Use only workspace files. Mark missing facts with [Not in source].",
    "What is the undisclosed bonus budget for next quarter?",
    { format: "ide-rules" }
  );
  assert.equal(noCiteIde.checks[1].passed, false);
  assert.match(noCiteIde.checks[1].fixPrompt, /Workspace-Dateinamen/);

  const strongCustom = validateRulebook(
    "Nutze ausschließlich die Wissensdateien. Belege jede Aussage mit dem Dateinamen (datei.md). Markiere Lücken mit [Nicht in Quelle].",
    "Wie hoch ist das Sonderbudget für das nächste Quartal?",
    { format: "custom-instructions" }
  );
  assert.equal(strongCustom.passed, true);
  assert.equal(strongCustom.score, 4);
});

test("validateParticipantOutput regression checks: authentic L1/L2 facts, mandatory gate rules, inline slides, and clean samples", () => {
  // M3-05: L1 authentic 42 Zähne passes and sample cites eisbaer.md / arktis.md
  const l1PassSample = getValidatorSample("prompting", "pass", { validSlugs: l1Slugs });
  assert.match(l1PassSample, /\(eisbaer\.md\)/);
  assert.match(l1PassSample, /\(arktis\.md\)/);
  assert.doesNotMatch(l1PassSample, /38 Zähne \(arktis\.md\)/);
  const l1Authentic = validateParticipantOutput(
    "prompting",
    [
      "### Ergebnis",
      "- Der Eisbär besitzt 42 Zähne und schwarze Haut (eisbaer.md).",
      "- Arktisches Meereis könnte ab 2030 saisonal verschwinden (arktis.md).",
      "- Eintrittspreis Schneeleoparden: [Nicht in Quelle]",
    ].join("\n"),
    {
      validSlugs: l1Slugs,
      expectedFactToken: "42 Zähne",
      acceptedFactTokens: ["42 zähne", "42 teeth", "2030", "38 zähne"],
      expectedFactDisplayLabel: "42 Zähne / 2030",
    }
  );
  assert.equal(l1Authentic.passed, true);

  // M3-22: Goal 1 failing precision (3/4) MUST NOT pass
  const missingPrecision = validateParticipantOutput(
    "prompting",
    [
      "### Ergebnis",
      "- Der Eisbär lebt in der Arktis (eisbaer.md).",
      "- Eintrittspreis Schneeleoparden: [Nicht in Quelle]",
    ].join("\n"),
    {
      validSlugs: l1Slugs,
      expectedFactToken: "42 Zähne",
      acceptedFactTokens: ["42 zähne", "2030"],
    }
  );
  assert.equal(missingPrecision.passed, false);

  // M5-02: L2 weak sample has zero wildlife leaks and triggers L2 trap check; strong sample uses Kernbank slugs
  const l2WeakSample = getValidatorSample("prompting", "fail", {
    validSlugs: l2Slugs,
    moduleId: "context-engineering-projekt",
  });
  assert.doesNotMatch(l2WeakSample, /Eisbär|Schneeleopard|Arktis/i);
  const l2WeakRes = validateParticipantOutput("prompting", l2WeakSample, {
    validSlugs: l2Slugs,
    moduleId: "context-engineering-projekt",
    expectedFactToken: "4 Stunden",
    acceptedFactTokens: ["4 stunden", "15 minuten"],
    trapForbiddenTerms: ["50.000", "aws lambda", "25.000"],
  });
  assert.equal(l2WeakRes.passed, false);

  const l2PassSample = getValidatorSample("prompting", "pass", {
    validSlugs: l2Slugs,
    moduleId: "context-engineering-projekt",
  });
  assert.match(l2PassSample, /\(sla-betriebsmodell\.md\)/);
  assert.match(l2PassSample, /\(architektur-entscheidung-01\.md\)/);

  // M5-11 & M3-22 & M3-23: Goal 2 SCQA prose without spec/code fails; <160 char stub fails with length tip
  const scqaProseOnly = [
    "- Situation: Der Betrieb prüft Werte aus (sla-betriebsmodell.md).",
    "- Komplikation: Bei fehlender Regel entstehen stille Fehler und Datenlücken.",
    "- Frage: Wie verhindern wir erfundene Werte im Ergebnis?",
    "- Antwort: Fehlende Angaben werden immer als [Nicht in Quelle] markiert.",
  ].join("\n");
  const scqaRes = validateParticipantOutput("app-building", scqaProseOnly, { validSlugs: l2Slugs });
  assert.equal(scqaRes.passed, false);

  const shortStub = "<!DOCTYPE html><html><body>Test (arktis.md) [Nicht in Quelle] Akzeptanzkriterien</body></html>";
  const shortRes = validateParticipantOutput("app-building", shortStub, { validSlugs: l1Slugs });
  assert.equal(shortRes.passed, false);
  const safetyCheck = shortRes.checks.find((c) => c.id === "safety");
  assert.equal(safetyCheck?.passed, false);
  assert.match(safetyCheck?.fixPrompt || "", /160 Zeichen/);
  assert.doesNotMatch(safetyCheck?.fixPrompt || "", /API-Keys|eval\(\)/);

  // M3-24: Inline Folie 1..4 detected accurately
  const inlineSlides = [
    "Folie 1: Situation — Leitlinien (eisbaer.md). Sprechernotiz: Einstieg.",
    "Folie 2: Komplikation — Lücken sichtbar (arktis.md). Sprechernotiz: Risiko.",
    "Folie 3: Antwort — Guardrails prüfen Fakten (eisbaer.md). Sprechernotiz: Lösung.",
    "Folie 4: Empfehlung — Negativtest als [Nicht in Quelle] (arktis.md). Sprechernotiz: Abschluss.",
  ].join(" ");
  const inlineRes = validateParticipantOutput("presentations", inlineSlides, { validSlugs: l1Slugs });
  assert.equal(inlineRes.passed, true);

  // M3-19b & M5-20: Clean Goal 3 (5 slides, no '3 Stufen') and Goal 4 (no Team-Lead / Freitag)
  const slidesPass = getValidatorSample("presentations", "pass", { validSlugs: l2Slugs });
  assert.match(slidesPass, /Folie 5:/);
  assert.doesNotMatch(slidesPass, /3 Stufen/);
  const everydayPass = getValidatorSample("everyday-ai", "pass", { validSlugs: l2Slugs });
  assert.doesNotMatch(everydayPass, /Team-Lead|Freitag/);
});
