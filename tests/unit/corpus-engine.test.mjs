import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseFrontmatter,
  searchCorpus,
  stripMarkdownAndCitations,
  verifyClaim,
} from "../../shared/corpus-engine.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const L1_DIR = path.join(ROOT, "stufe-3-obsidian-vault", "wiki");
const L2_DIR = path.join(ROOT, "modules", "context-engineering-projekt", "corpus");

function walkMd(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out.sort();
}

function loadArticlesFromDir(baseDir) {
  return walkMd(baseDir).map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = path.basename(filePath, ".md");
    return {
      slug,
      title: meta.title || slug,
      category: meta.category || path.basename(path.dirname(filePath)),
      group: meta.group || meta.category || path.basename(path.dirname(filePath)),
      habitat: meta.habitat || "",
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      rel_path: path.relative(baseDir, filePath).replace(/\\/g, "/"),
      source_file: meta.source_file || `raw/${slug}.md`,
      body,
    };
  });
}

test("parseFrontmatter handles hyphenated keys, inline YAML arrays, escaped quotes, and CRLF", () => {
  const sample =
    '---\r\ntitle: "Runbook \\"Kernbank\\" Release"\r\nlast-updated: 2026-03-14\r\ntags: [betrieb, "release-check", sla-tier-1]\r\n---\r\nInhalt hier.';
  const { meta, body } = parseFrontmatter(sample);
  assert.equal(meta.title, 'Runbook "Kernbank" Release');
  assert.equal(meta["last-updated"], "2026-03-14");
  assert.deepEqual(meta.tags, ["betrieb", "release-check", "sla-tier-1"]);
  assert.equal(body.trim(), "Inhalt hier.");
});

test("L1 & L2 corpora load with expected counts (68 / 10), slugs, and searchCorpus works", () => {
  const l1 = loadArticlesFromDir(L1_DIR);
  assert.equal(l1.length, 68);
  assert.ok(l1.every((a) => a.slug && a.title && a.group && a.rel_path && a.source_file));

  const l2 = loadArticlesFromDir(L2_DIR);
  assert.equal(l2.length, 10);
  assert.ok(l2.every((a) => a.slug && a.title && a.group && a.rel_path && a.source_file));

  const hits = searchCorpus(l1, "Eisbär schwarze Haut Squalen", 5);
  assert.ok(hits.length > 0);
  assert.equal(hits[0].slug, "eisbaer");
  assert.equal(hits[0].wikilink, "[[eisbaer|Eisbär]]");
});

test("verifyClaim confirms true claims, detects missing claims, and catches numeric/negation contradictions", () => {
  const l1 = loadArticlesFromDir(L1_DIR);
  const l2 = loadArticlesFromDir(L2_DIR);

  const l1True = verifyClaim(l1, "Der Eisbär hat unter seinem Fell schwarze Haut und besitzt 42 Zähne.");
  assert.equal(l1True.status, "belegt");
  assert.ok((l1True.evidence || []).some((e) => e.slug === "eisbaer"));

  const l1Missing = verifyClaim(
    l1,
    "Im Schweizerischen Nationalpark leben 45 Schneeleoparden und das Ticket kostet 25 Euro."
  );
  assert.equal(l1Missing.status, "nicht_belegt");

  const l1NumContra = verifyClaim(l1, "Der Eisbär hat 38 Zähne.");
  assert.equal(l1NumContra.status, "widerspruch");
  assert.ok(Array.isArray(l1NumContra.mismatch_reasons) && l1NumContra.mismatch_reasons.length > 0);

  const l1NegContra = verifyClaim(l1, "Der Eisbär produziert im Fettgewebe Squalen.");
  assert.equal(l1NegContra.status, "widerspruch");
  assert.ok(l1NegContra.mismatch_reasons.some((r) => /squalen|fehlen|kein/i.test(r)));

  const l2True = verifyClaim(
    l2,
    "Der nächtliche SEPA-Zahlungslauf startet um 22:00 Uhr und eskaliert bei über 30 Minuten Störung an den Incident-Lead."
  );
  assert.equal(l2True.status, "belegt");

  const l2Contra = verifyClaim(l2, "Die vereinbarte RTO für den SEPA-Zahlungslauf beträgt 2 Stunden.");
  assert.equal(l2Contra.status, "widerspruch");
  assert.ok(l2Contra.mismatch_reasons.length > 0);
});

test("stripMarkdownAndCitations preserves number+unit pairs and strips citations", () => {
  const cleaned = stripMarkdownAndCitations(
    "**42** Zähne (wiki/tierarten/eisbaer.md) und `2` h laut [[eisbaer|Eisbär]]."
  );
  assert.match(cleaned, /42 Zähne/);
  assert.match(cleaned, /2 h/);
  assert.doesNotMatch(cleaned, /wiki\/tierarten/);
  assert.doesNotMatch(cleaned, /\[\[/);
  assert.match(cleaned, /Eisbär/);
});

test("verifyClaim handles markdown formatting, units, clock times, number words, hyphenated IDs, and abbreviations", () => {
  const l1 = loadArticlesFromDir(L1_DIR);
  const l2 = loadArticlesFromDir(L2_DIR);

  // L1 formatted belegt & widerspruch
  assert.equal(
    verifyClaim(l1, "Der Eisbär hat **42** Zähne (wiki/tierarten/eisbaer.md).").status,
    "belegt"
  );
  assert.equal(verifyClaim(l1, "Der Eisbär hat **38** Zähne.").status, "widerspruch");
  assert.equal(verifyClaim(l1, "Der Eisbär hat ca. 38 Zähne.").status, "widerspruch");
  assert.equal(
    verifyClaim(l1, "Die Korallenbleiche dauert 4 Wochen bis zum Absterben.").status,
    "widerspruch"
  );

  // L2 clock times, unit abbreviations, and R-01
  assert.equal(verifyClaim(l2, "Der SEPA-Zahlungslauf startet um 22 Uhr.").status, "belegt");
  assert.equal(
    verifyClaim(l2, "Bei R-01 im Zahlungsverkehr gilt eine RTO von 4 Stunden.").status,
    "belegt"
  );
  assert.equal(verifyClaim(l2, "Die RTO beträgt `2` h.").status, "widerspruch");
  assert.equal(verifyClaim(l2, "Der SEPA-Zahlungslauf startet um 21:00 Uhr.").status, "widerspruch");

  // Synthetic hyphenated identifier (Tier-1) does not treat "-1" as negative number
  const tierArticles = [
    {
      slug: "sla-tier1",
      title: "SLA Tier-1",
      category: "runbook",
      group: "runbook",
      body: "Für den Tier-1 Zahlungsverkehr gilt eine RTO von 4 Stunden.",
    },
  ];
  assert.equal(
    verifyClaim(tierArticles, "Für den Tier-1 Zahlungsverkehr gilt eine RTO von 4 Stunden.").status,
    "belegt"
  );

  // Abbreviation-safe sentence splitting (ca., z. B., bzw., Std., e.g., approx.)
  const abbrArticles = [
    {
      slug: "abbr-de-en",
      title: "Abkürzungen",
      category: "konzept",
      group: "konzept",
      body: [
        "Der Eisbär hat ca. 42 Zähne. Bei z. B. adulten Tieren sind bzw. bleiben es ca. 42 Zähne.",
        "Die Laufzeit beträgt 4 Std. pro Durchlauf.",
        "The runtime is e.g. 4 hours, approx. 4 hrs.",
      ].join(" "),
    },
  ];
  assert.equal(verifyClaim(abbrArticles, "Der Eisbär hat ca. 38 Zähne.").status, "widerspruch");
  assert.equal(verifyClaim(abbrArticles, "Die Laufzeit beträgt ca. 2 Std.").status, "widerspruch");
  assert.equal(verifyClaim(abbrArticles, "The runtime is approx. 2 hours.").status, "widerspruch");
});

test("verifyClaim handles EN stopwords and EN negation markers (no, not, never, without, lack, absent, cannot)", () => {
  const enArticles = [
    {
      slug: "polar-bear-en",
      title: "Polar Bear",
      category: "tierart",
      group: "tierart",
      body: "The polar bear has black skin, 42 teeth, and produces no squalene in its fat tissue.",
    },
  ];

  // Affirmative match with EN stopwords stripped
  const trueRes = verifyClaim(
    enArticles,
    "The polar bear has black skin and 42 teeth."
  );
  assert.equal(trueRes.status, "belegt");

  // Contradiction: corpus says "no squalene", positive claim asserts it produces squalene
  assert.equal(
    verifyClaim(enArticles, "The polar bear produces squalene in its fat tissue.").status,
    "widerspruch"
  );

  // Conversely, when corpus asserts a positive fact, all EN negation markers flip polarity -> widerspruch
  const positiveCorpus = [
    {
      slug: "coral-en",
      title: "Coral Reef",
      category: "konzept",
      group: "konzept",
      body: "Stony corals contain symbiotic zooxanthellae inside their tissue.",
    },
  ];
  for (const negPhrase of [
    "Stony corals contain no zooxanthellae inside their tissue.",
    "Stony corals do not contain zooxanthellae inside their tissue.",
    "Stony corals never contain zooxanthellae inside their tissue.",
    "Stony corals live without zooxanthellae inside their tissue.",
    "Stony corals lack zooxanthellae inside their tissue.",
    "Zooxanthellae are absent inside stony corals tissue.",
    "Stony corals cannot contain zooxanthellae inside their tissue.",
  ]) {
    const res = verifyClaim(positiveCorpus, negPhrase);
    assert.equal(res.status, "widerspruch", `Expected widerspruch for: ${negPhrase}`);
  }
});

test("verifyClaim regression checks: no verb-only false contradictions, L2 German inflections, multi-line claims, and clean DE wording", () => {
  const l1 = loadArticlesFromDir(L1_DIR);
  const l2 = loadArticlesFromDir(L2_DIR);

  // M3-06: verb-only 'springen' + 'meter' must not falsely contradict against riesenmanta.md
  const leapRes = verifyClaim(
    l1,
    "Schneeleoparden springen bis zu 25 Meter weit über Gletscherspalten."
  );
  assert.equal(leapRes.status, "nicht_belegt");

  // M3-06: multi-line claims evaluate every line and preserve worst status
  const multiLineContra = verifyClaim(
    l1,
    "Der Eisbär hat 42 Zähne.\nDer Eisbär produziert im Fettgewebe Squalen."
  );
  assert.equal(multiLineContra.status, "widerspruch");

  const multiLinePartial = verifyClaim(
    l1,
    "Der Eisbär hat 42 Zähne.\nIm Schweizerischen Nationalpark leben 45 Schneeleoparden."
  );
  assert.notEqual(multiLinePartial.status, "belegt");

  // M5-03: L2 German compound duration & participle phrasing
  const dualWrite = verifyClaim(l2, "Die Dual-Write-Phase dauert 14 Tage.");
  assert.equal(dualWrite.status, "belegt");

  const outboxAlarm = verifyClaim(
    l2,
    "Ab 5.000 offenen Events in der Transactional Outbox wird ein Alarm ausgelöst."
  );
  assert.equal(outboxAlarm.status, "belegt");

  // M5-17: Umlauts preserved in reasons and no stray English 'no' marker in DE negation messages
  const ibanViolation = verifyClaim(
    l2,
    "Konto- und Kundendaten wie IBAN dürfen in externen KI-Tools genutzt werden."
  );
  assert.equal(ibanViolation.status, "widerspruch");
  assert.equal(
    ibanViolation.mismatch_reasons.some((r) => /„no“/.test(r)),
    false
  );
});
