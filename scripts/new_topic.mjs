#!/usr/bin/env node
/**
 * Scaffold a brand-new declarative workshop module under modules/<slug>/.
 *
 * Example:
 *   node scripts/new_topic.mjs --slug office-ai --title "Office & Orga mit KI" --level L1
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const cur = argv[i];
    if (cur.startsWith("--")) {
      const key = cur.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      out[key] = val;
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = String(args.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const title = String(args.title || "").trim();
  const level = ["L1", "L2", "L3"].includes(args.level) ? args.level : "L2";
  const baseModulesDir = args["out-root"] ? path.resolve(args["out-root"]) : path.join(ROOT, "modules");

  if (!slug || !title) {
    console.error("Usage: node scripts/new_topic.mjs --slug <slug> --title \"<Title>\" [--level L1|L2|L3]");
    process.exit(1);
  }

  const targetDir = path.join(baseModulesDir, slug);
  if (fs.existsSync(targetDir)) {
    console.error(`Error: Module directory already exists: ${targetDir}`);
    process.exit(1);
  }

  fs.mkdirSync(path.join(targetDir, "corpus"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "skills", "fakten-check"), { recursive: true });

  fs.writeFileSync(
    path.join(targetDir, "corpus", "einstieg-ueberblick.md"),
    `---
title: Überblick · ${title}
category: dokument
group: Grundlagen
tags: [einstieg, regeln, ueberblick]
---

# Überblick · ${title}

Dies ist die erste synthetische Wissensdatei für **${title}**.
- Wichtigste Kennzahl im Beispiel: Der Maximalwert beträgt 42 Einheiten bei einem Prüfintervall von 7 Tagen.
- Verknüpft mit: [[praxis-checkliste]] und [[offene-grenzen]].
`,
    "utf8"
  );

  fs.writeFileSync(
    path.join(targetDir, "corpus", "praxis-checkliste.md"),
    `---
title: Praxis-Checkliste
category: leitfaden
group: Umsetzung
tags: [checkliste, praxis, prozess]
---

# Praxis-Checkliste

1. Vor Beginn immer [[einstieg-ueberblick]] prüfen (Prüfintervall **7 Tage**).
2. Fehlende Angaben sichtbar als \`[Nicht in Quelle]\` markieren gemäß [[offene-grenzen]].
`,
    "utf8"
  );

  fs.writeFileSync(
    path.join(targetDir, "corpus", "offene-grenzen.md"),
    `---
title: Verbindliche Grenzen & Lücken-Regel
category: regel
group: Governance
tags: [guardrails, quellenpflicht]
---

# Verbindliche Grenzen

- Niemals Werte oder Zuständigkeiten außerhalb der Dateien ergänzen.
- Jede Kernaussage trägt ihren Dateinamen, z. B. \`(praxis-checkliste.md)\`.
- Einstieg siehe [[einstieg-ueberblick]].
`,
    "utf8"
  );

  fs.writeFileSync(
    path.join(targetDir, "skills", "fakten-check", "SKILL.md"),
    `---
name: fakten-check
description: Prüft Aussagen gegen die Dateien in modules/${slug}/corpus/.
---

# Skill · Fakten-Check

1. Suche immer zuerst in \`_index.md\`.
2. Belege jede Aussage mit \`(datei.md)\`.
3. Fehlt etwas, antworte \`[Nicht in Quelle]\`.
`,
    "utf8"
  );

  const audioScripts = {
    "what-is-markdown": {
      title: "Was ist eine .md-Datei?",
      durationLabel: "0:18",
      transcript: `Markdown-Dateien (.md) in „${title}“ sind ganz normaler Klartext mit Überschriften.`,
    },
    "step-01": {
      title: "Einstieg erklärt",
      durationLabel: "0:18",
      transcript: `Willkommen bei ${title}! Wähle oben deine Arbeitsweise (Web-Chat, Ordner oder Code-Agent).`,
    },
    "step-02": {
      title: "Prompt-Methoden erklärt",
      durationLabel: "0:18",
      transcript: "Vergleiche einen einfachen Satz mit strukturiertem CO-STAR auf unseren Beispieldokumenten.",
    },
    "step-03": {
      title: "Stufen & Fangfrage erklärt",
      durationLabel: "0:20",
      transcript: "Teste, ab welcher Stufe erfundene Fakten sauber als [Nicht in Quelle] gestoppt werden.",
    },
    "step-04": {
      title: "Praxis & Transfer erklärt",
      durationLabel: "0:20",
      transcript: "Wähle deinen Praxis-Pfad und erstelle unten direkt eine eigene Hausregel.",
    },
  };
  fs.writeFileSync(path.join(targetDir, "audio-scripts.json"), JSON.stringify(audioScripts, null, 2) + "\n", "utf8");

  const manifest = {
    id: slug,
    source: "declarative",
    isDefault: false,
    level,
    badge: `${level} · Themen-Modul`,
    title,
    subtitle: `Modulares Hands-on-Training zu ${title}`,
    domainLabel: title,
    mcpSupported: true,
    durationPresets: [30, 60, 90],
    tags: [level, title],
    eventOverlay: {
      unitLabel: "Praxis-Lab",
      timeSlot: "Flexibel (30 / 60 / 90 Min.)",
      outroBanner: "Direkt mit eigenen anonymisierten Beispielen testen",
    },
    audioScriptsFile: "audio-scripts.json",
    taxonomy: {
      groupFieldLabel: "Bereich",
      defaultSelectedSlug: "einstieg-ueberblick",
      categories: [
        { id: "dokument", label: "Dokument", plural: "Dokumente", subdir: "dokumente", color: "#A9C23F", radius: 10 },
        { id: "leitfaden", label: "Leitfaden", plural: "Leitfäden", subdir: "leitfaeden", color: "#34D399", radius: 8 },
        { id: "regel", label: "Regel", plural: "Regeln", subdir: "regeln", color: "#CBD5C0", radius: 6.5 },
      ],
    },
    labPresets: {
      defaultQuery: "Prüfintervall Maximalwert",
      searchPresets: ["Prüfintervall", "Praxis-Checkliste", "Grenzen Quellenpflicht"],
      verifyDefaultClaim: "Der Maximalwert beträgt 42 Einheiten bei einem Prüfintervall von 7 Tagen.",
      verifyTrapClaim: "Der unbeschränkte Sonderrabatt von 99 Prozent gilt rückwirkend ab 1990.",
    },
    chatRulesTemplate:
      "VERBINDLICHE REGELN:\n1. Nutze nur die bereitgestellten Dateien.\n2. Belege jede Zahl mit (datei.md).\n3. Fehlt ein Fakt, schreibe zwingend „[Nicht in Quelle]“.",
    promptComparisonTask: `Fasse die wichtigsten Regeln und Grenzwerte aus den Unterlagen zu „${title}“ zusammen.`,
    promptMethods: [
      {
        id: "zero-shot",
        name: "1 · Zero-Shot (Roh-Prompt)",
        badge: "Baseline",
        bestFor: "Schneller erster Test",
        strength: "Kurz",
        risk: "Mischt Vorwissen hinein",
        components: ["Aufgabe"],
        prompt: `Erkläre kurz die Regeln und Grenzwerte zu ${title}.`,
        unstructuredComparison: { label: "Ohne Struktur", excerpt: "Allgemeiner Fließtext ohne Dateiquellen.", issues: ["Keine Quelle"] },
        structuredComparison: { label: "Ziel fehlt", excerpt: "Ohne Vorgaben fehlt das Format.", highlights: ["0 Quellen"], formatTag: "Freitext" },
        expectedSnippet: "Vager Überblick.",
      },
      {
        id: "costar",
        name: "2 · CO-STAR",
        badge: "Struktur",
        bestFor: "Team-Briefing",
        strength: "Klare Quellenpflicht",
        risk: "Braucht 6 Zeilen",
        components: ["Context", "Objective", "Style", "Tone", "Audience", "Response"],
        prompt: `Context: Kurzes Briefing zu ${title} anhand der beigefügten Dateien.\nObjective: Nenne Maximalwert, Prüfintervall und Lücken-Regel.\nStyle: Bulletpoints.\nTone: Sachlich.\nAudience: Projektteam.\nResponse: Max. 4 Punkte mit (datei.md).`,
        unstructuredComparison: { label: "Ohne CO-STAR", excerpt: "Fehlende Zahlen & Quellen.", issues: ["Unpräzise"] },
        structuredComparison: { label: "Mit CO-STAR", excerpt: "• Maximalwert 42 Einheiten, Prüfintervall 7 Tage (einstieg-ueberblick.md)\n• Fehlende Infos -> [Nicht in Quelle] (offene-grenzen.md)", highlights: ["Belegt"], formatTag: "Bulletpoints" },
        expectedSnippet: "Sauber belegte Stichpunkte.",
      },
    ],
    testQuestions: [
      {
        id: "q1",
        number: 1,
        type: "Detailfrage",
        question: "Welcher Maximalwert und welches Prüfintervall stehen in einstieg-ueberblick.md?",
        targetDocs: ["einstieg-ueberblick.md"],
        whatToWatch: "Nennt das Modell exakt 42 Einheiten und 7 Tage mit Dateiquelle?",
        solutionSummary: "42 Einheiten und 7 Tage Prüfintervall (einstieg-ueberblick.md).",
        focusStages: ["stufe-1", "stufe-2", "stufe-3"],
      },
      {
        id: "q3",
        number: 3,
        type: "Fangfrage (0 Treffer)",
        question: "Wie hoch ist der unbeschränkte Sonderrabatt ab 1990 laut den Dokumenten?",
        targetDocs: [],
        isTrap: true,
        whatToWatch: "Lehnt Stufe 2 sauber mit [Nicht in Quelle] ab?",
        solutionSummary: "0 Treffer in den Dateien — korrektes Verhalten: [Nicht in Quelle].",
        focusStages: ["stufe-1", "stufe-2", "stufe-3"],
      },
    ],
    stages: [
      {
        id: "stufe-1",
        folder: `modules/${slug}/corpus`,
        title: "Stufe 1 · Lose Dateien",
        badge: "Ungeregelt",
        beginnerBadge: "Ohne Regeln",
        summary: "Nur die Rohdateien ohne feste Leitplanken.",
        beginnerSummary: "Rohtexte ohne Schutz vor Raten.",
        agentsMd: `# ${title}\nBeantworte Fragen zum Ordner.`,
        focusQuestionIds: ["q3", "q1"],
        sourceTags: ["einstieg-ueberblick.md", "praxis-checkliste.md", "offene-grenzen.md"],
      },
      {
        id: "stufe-2",
        folder: `modules/${slug}`,
        title: "Stufe 2 · Klare Leitplanken",
        badge: "AGENTS.md + Skill",
        beginnerBadge: "Mit Regeln",
        summary: "Verbindliche Quellenpflicht + [Nicht in Quelle].",
        beginnerSummary: "Klare Regeln verhindern Erfindungen.",
        agentsMd: `# Leitplanken · ${title}\n1. Nur Fakten aus den Dateien.\n2. Belege jede Zahl mit (datei.md).\n3. Lücken mit [Nicht in Quelle] markieren.`,
        focusQuestionIds: ["q3", "q1"],
        sourceTags: ["einstieg-ueberblick.md", "praxis-checkliste.md", "offene-grenzen.md"],
      },
      {
        id: "stufe-3",
        folder: `modules/${slug}/corpus`,
        title: "Stufe 3 · Vernetzter Index",
        badge: "_index.md + Graph",
        beginnerBadge: "Vernetztes Wissen",
        summary: "Inhaltsverzeichnis + Querverweise über [[Wikilinks]].",
        beginnerSummary: "Schneller Überblick durch Verknüpfungen.",
        agentsMd: `# Vault · ${title}\nStarte immer mit _index.md und folge [[Wikilinks]].`,
        focusQuestionIds: ["q1", "q3"],
        sourceTags: ["einstieg-ueberblick.md", "praxis-checkliste.md", "offene-grenzen.md"],
      },
    ],
    praxisPaths: [
      {
        id: "pfad-recherche",
        number: 1,
        title: `Praxis-Pfad 1 · Faktencheck (${title})`,
        tag: "Suche · Prüfung",
        durationMin: 30,
        bestForRoles: ["Team", "Fachbereich"],
        description: "Prüfe Fakten und Fangfragen im eingebauten Faktenprüfer.",
        includesInBrowserLab: true,
        promptsByMode: {
          web: { label: "Prompt kopieren", prompt: `Prüfe alle Kernaussagen zu ${title} gegen die Dateien mit (datei.md) oder [Nicht in Quelle].`, deliverableHint: "Geprüfte Übersicht" },
          desktop: { label: "Ordner-Prompt kopieren", prompt: `Prüfe modules/${slug}/corpus/ anhand skills/fakten-check/SKILL.md.`, deliverableHint: "Dateigeprüfte Übersicht" },
          agent: { label: "CLI-Prompt kopieren", prompt: `Nutze MCP search_vault (--module ${slug}) und verify_claim.`, deliverableHint: "Tool-gestützte Prüfung" },
        },
      },
    ],
    transferBridge: [
      {
        id: "team-alltag",
        title: "1 · Direkter Einsatz im Team",
        roles: "Alle Interessierten",
        workshopPattern: "CO-STAR + Fangfragen-Selbsttest",
        ccfUseCase: `Übertrage die Regeln aus „${title}“ auf ein erstes eigenes öffentliches oder anonymisiertes Beispiel.`,
        guardrailRule: "Immer eine eigene Fangfrage testen, bevor man der Antwort vertraut.",
        starterPrompt: "Nutze nur meine folgenden Stichpunkte, belege jeden Punkt und markiere fehlende Infos als „[Nicht in Quelle]“.",
      },
    ],
    verify: {
      spotSearches: [{ query: "Prüfintervall Maximalwert", expectedTopSlug: "einstieg-ueberblick" }],
      positiveClaims: ["Der Maximalwert beträgt 42 Einheiten bei einem Prüfintervall von 7 Tagen."],
      negativeTraps: ["Der unbeschränkte Sonderrabatt von 99 Prozent gilt rückwirkend ab 1990."],
    },
  };

  fs.writeFileSync(path.join(targetDir, "module.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Created module template at: modules/${slug}/`);
  console.log("Next: edit corpus/*.md & module.json, then run:\n  node scripts/build_modules.mjs && node scripts/validate_modules.mjs");
}

main();
