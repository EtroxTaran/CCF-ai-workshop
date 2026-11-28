import type { GoalId, GoalTrackSpec, WorkshopDataset } from "@/types/workshop";

export const GOAL_LABELS: Record<GoalId, string> = {
  prompting: "Besseres Prompting",
  "app-building": "Anwendung bauen",
  presentations: "Präsentationen bauen",
  "everyday-ai": "KI im Arbeitsalltag",
};

export function buildGoalTracksForModule(data: WorkshopDataset): GoalTrackSpec[] {
  const modId = data.moduleId || "prompt-werkstatt-tierwelt";
  const isDefault = modId === "prompt-werkstatt-tierwelt";
  const domain = data.meta.domainLabel || data.meta.title;
  const s1 = data.starterArticles[0]?.slug || "eisbaer";
  const s2 = data.starterArticles[1]?.slug || data.starterArticles[0]?.slug || "arktis";
  const s3 = data.starterArticles[4]?.slug || data.starterArticles[1]?.slug || s1;
  const stage2Dir = data.stages[1]?.folder || `modules/${modId}`;
  const stage3Dir = data.stages[2]?.folder || `modules/${modId}`;

  const q4 = data.testQuestions.find((q) => q.id === "q4");
  const q4Mutated = q4?.manipulationCheck?.mutatedValue || (isDefault ? "38 Zähne" : "2 Stunden");
  const q4Original = q4?.manipulationCheck?.originalValue || (isDefault ? "42 Zähne" : "4 Stunden");
  const q4File =
    (q4?.manipulationCheck?.targetFile || `${s1}.md`).split("/").pop() || `${s1}.md`;
  const q4Fact = `Testwert „${q4Mutated}“ statt dokumentiertem Original „${q4Original}“ in ${q4File}`;
  const trapTopic = isDefault
    ? "Schneeleoparden im Schweizerischen Nationalpark"
    : "Vertragsstrafe für Krypto-Wallet";

  return [
    {
      id: "prompting",
      title: "Ziel 1 · Besseres Prompting & Verlässliche KI",
      shortLabel: "Besseres Prompting",
      badge: "Prompt Engineering · Grounding",
      audienceHint: "Für alle, die sofort präzisere, belegte Antworten ohne Halluzinationen wollen.",
      durationLabel: "30 Min. Ziel-Labor",
      outcomeSummary:
        "Du vergleichst Roh-Prompt vs. CO-STAR/RISEN, härtest Antworten gegen Fangfragen ab und lässt die KI deinen eigenen Prompt kritisch verbessern.",
      validatorPreset: "prompting",
      steps: [
        {
          id: "p-step-1",
          num: "01",
          title: "Vom vagen Einzeiler zur CO-STAR-Vorlage",
          durationMin: 10,
          instruction: `Teste die Aufgabe zu „${domain}“ erst vage und dann mit klarer Zielgruppe, Format und Quellenpflicht (${s1}.md).`,
          promptsByMode: {
            web: `Context: Kurzes Fachbriefing ausschließlich auf Basis der beigefügten Dateien (${s1}.md, ${s2}.md).\nObjective: Beantworte die Kernfrage und prüfe eine Fangfrage (${trapTopic}).\nStyle & Format: Max. 4 Bulletpoints.\nNarrowing: Jede Aussage mit (datei.md) belegen; Fehlendes zwingend als „[Nicht in Quelle]“ markieren.`,
            desktop: `Lies aus deinem Arbeitsordner (${stage2Dir}/ in Cowork) bzw. deinem Knowledge Folder (Langdock / Projects / Gems) die Dateien zu ${s1}.md und ${s2}.md unter Beachtung der Hausregeln (AGENTS.md / Assistant Instructions). Fasse die Kernaussagen in 4 Bulletpoints mit (datei.md) zusammen und markiere ${trapTopic} als „[Nicht in Quelle]“.`,
            ide: `Nutze im geöffneten Workspace AGENTS.md sowie die zugehörigen Quelldateien (${s1}.md, ${s2}.md). Erstelle eine 4-Punkte-Antwort mit (datei.md)-Belegen und markiere ${trapTopic} als „[Nicht in Quelle]“.`,
            agent: `Starte in ${stage3Dir}/ (oder per MCP --module ${modId}), nutze search_vault und verify_claim zu ${s1} sowie ${trapTopic} und gib eine 4-Punkte-Antwort mit (datei.md) und [Nicht in Quelle] aus.`,
          },
          toolTips: {
            web: "Funktioniert in ChatGPT, Claude, Langdock, Gemini & M365 Copilot gleichermaßen.",
            desktop: "In Claude Cowork greift AGENTS.md direkt; in Langdock Assistants, Projects & Gems Regeln ins Systemfeld einfügen.",
            ide: "In Google Antigravity, Cursor, Windsurf & VS Code Copilot zuerst AGENTS.md gezielt als Dateireferenz (@ bzw. Dateianhang) einbinden.",
            agent: "Prüfe über den lokalen MCP-Server, ob das MCP-Tool verify_claim bei der Fangfrage 0 Belege liefert.",
          },
          expectedGoodSignals: [
            `Konkrete Fakten tragen exakt (${s1}.md) bzw. (${s2}.md).`,
            `${trapTopic} wird sauber als „[Nicht in Quelle]“ abgelehnt.`,
          ],
          commonPitfalls: [
            "Alten Chat wiederverwendet (Kontext-Verschmutzung).",
            "Nur ‚Nenne Quellen‘ geschrieben statt ‚Kein Vorwissen ergänzen‘.",
          ],
        },
        {
          id: "p-step-2",
          num: "02",
          title: "Adversarial Prompt-Critique & Feinschliff",
          durationMin: 10,
          instruction:
            "Nutze die KI als strengen Prompt-Reviewer: Lass sie Lücken in deinem eigenen Prompt aufdecken und danach eine gehärtete Endfassung erstellen.",
          promptsByMode: {
            web: `Bewerte meinen Prompt aus Schritt 1 als strenger KI-Qualitätsprüfer:\n1. Wo könnte ein Sprachmodell noch raten oder Formatvorgaben umgehen?\n2. Wie reagiere ich auf den geänderten Fakt (${q4Fact})?\n3. Gib mir eine verbesserte, direkt kopierbare Endfassung + Beispielantwort mit (datei.md) und [Nicht in Quelle].`,
            desktop: `Prüfe meine aktuelle AGENTS.md bzw. Assistant-/Project Instructions (aus ${stage2Dir}/ oder dem Projekt-Systemfeld) auf Lücken gegen Halluzinationen und schlage 2 konkrete Test-Fangfragen vor.`,
            ide: `Reviewe AGENTS.md im aktuellen Workspace: Welche Mehrdeutigkeiten könnten im Editor-Chat zu erfundenen Fakten führen? Schlage einen Patch + 2 Negativtests vor.`,
            agent: `Analysiere AGENTS.md und die Skills in ${stage3Dir}/ als Adversarial Reviewer und schlage 2 konkrete Guardrail-Verbesserungen inkl. verify_claim-Testfall vor.`,
          },
          toolTips: {
            web: "Kopiere die fertige Antwort anschließend direkt in den Output-Validator unten!",
            desktop: "Speichere deinen verbesserten Prompt direkt als Projekt-Template.",
            ide: "Teste den geschärften Prompt in einem komplett neuen Editor-Chat-Tab.",
            agent: "Halte AGENTS.md unter 30 Zeilen — Detailregeln gehören in Skills.",
          },
          expectedGoodSignals: [
            "Prompt enthält explizites Negativ-Verbot und [Nicht in Quelle]-Marker.",
            "Mindestens 1 konkreter Testfall für die Fangfrage.",
          ],
          commonPitfalls: [
            "Zu lange Regelwände (> 1 Seite), die vom Modell im Mittelteil überlesen werden.",
          ],
        },
        {
          id: "p-step-3",
          num: "03",
          title: "Ergebnis im Output-Validator prüfen",
          durationMin: 10,
          isActionStep: true,
          actionTargetId: "output-validator-section",
          instruction:
            "Kopiere dein finales KI-Ergebnis unten in den Output-Validator, prüfe alle 4 Kriterien und hake deine Ziel-Rubrik ab.",
          promptsByMode: {
            web: "Füge deine geprüfte Chat-Antwort direkt unten in das Feld „Ergebnis prüfen“ ein.",
            desktop: "Kopiere die Antwort aus deinem Projekt-/Assistant-Chat unten in den Output-Validator.",
            ide: "Kopiere die Antwort aus deinem Editor-Chat unten in den Output-Validator.",
            agent: "Kopiere das Terminal-/MCP-Ergebnis unten in den Output-Validator.",
          },
          toolTips: {
            web: "Achte auf grüne Haken bei echten Dateinamen und [Nicht in Quelle].",
            desktop: "Prüfe, ob keine Dateinamen aus einem anderen Modul vermischt wurden.",
            ide: "Prüfe, ob jede Zahl aus den echten Quelldateien stammt.",
            agent: "MCP-Antworten lassen sich direkt gegen die Rubrik prüfen.",
          },
          expectedGoodSignals: ["Output-Validator zeigt mindestens 3/4 grüne Kriterien."],
          commonPitfalls: ["Dateinamen geraten oder [Nicht in Quelle] vergessen."],
        },
      ],
      rubric: [
        {
          id: "r-prompt-struct",
          criterion: "Klare Prompt-Struktur (CO-STAR / RISEN) statt Einzeiler genutzt",
          howToCheck: "Rolle/Kontext, Ziel, Format und Grenzen sind getrennt angegeben.",
          required: true,
        },
        {
          id: "r-prompt-cite",
          criterion: "Jede Sachaussage trägt eine echte Quelle (datei.md)",
          howToCheck: "Output-Validator bestätigt gültige Quelldateien ohne erfundene Namen.",
          required: true,
        },
        {
          id: "r-prompt-trap",
          criterion: "Fangfrage sauber mit [Nicht in Quelle] abgelehnt",
          howToCheck: "Keine geschätzten Preise, Zahlen oder Zusatzfakten.",
          required: true,
        },
        {
          id: "r-prompt-reuse",
          criterion: "Eigene wiederverwendbare Prompt-Vorlage / Regel gesichert",
          howToCheck: "Im Takeaway-Kit unten als Markdown heruntergeladen.",
          required: false,
        },
      ],
    },
    {
      id: "app-building",
      title: "Ziel 2 · Eine Anwendung bauen (Spec → Build → Test)",
      shortLabel: "Anwendung bauen",
      badge: "App-Entwicklung · Vibe-Coding mit Qualität",
      audienceHint: "Für alle, die mit KI nicht nur Code generieren, sondern saubere, getestete Mini-Apps bauen wollen.",
      durationLabel: "30 Min. Ziel-Labor",
      outcomeSummary:
        "Du lernst den Profi-Dreischritt für KI-App-Bau: erst 1-Seiten-Spezifikation + Akzeptanzkriterien, dann lauffähiger Prototyp (HTML/IDE/CLI), dann Test & Quellen-Härtung.",
      validatorPreset: "app-building",
      steps: [
        {
          id: "a-step-1",
          num: "01",
          title: "Erst Spezifikation & Akzeptanzkriterien (nie blind coden!)",
          durationMin: 8,
          instruction: `Lass die KI zuerst eine knappe Mini-Spezifikation für einen interaktiven „${domain}“-Assistenten oder Rechner schreiben — inklusive 3 Testfällen.`,
          promptsByMode: {
            web: `Erstelle ZUERST nur eine 1-seitige Mini-Spezifikation (noch KEIN Code!) für eine kleine Single-File-HTML-App auf Basis von (${s1}.md, ${s2}.md, ${s3}.md):\n1. Problem & Nutzerfluss in 3 Schritten\n2. Konkrete Datenbasis (nur verifizierte Fakten + (datei.md))\n3. 3 Akzeptanz- & Edge-Case-Tests (Normalfall, leere Eingabe, unbekannter Begriff → „[Nicht in Quelle]“).`,
            desktop: `Nutze die Wissensbasis (Ordner ${stage3Dir}/ in Cowork bzw. Knowledge Folder in Langdock / Projects / Gems) und erstelle zuerst eine 1-seitige Mini-Spezifikation (Problem, Datenvertrag mit (datei.md), 3 Edge-Case-Testfälle inkl. [Nicht in Quelle]), bevor irgendeine HTML-Datei erzeugt wird.`,
            ide: `Erstelle im Editor auf Basis von AGENTS.md und _index.md zuerst eine Datei sandbox/app-spec.md mit Problem, Datenmodell aus den Quellen und 3 konkreten Akzeptanztests (inkl. Leer- & Fehlerzustand).`,
            agent: `Erstelle unter sandbox/app-spec.md (ohne Korpus-Dateien zu ändern) zuerst eine Mini-Spezifikation + 3 Akzeptanztests auf Basis von search_vault (--module ${modId}).`,
          },
          toolTips: {
            web: "Warte erst auf die Spec und korrigiere Unklarheiten, bevor du „Jetzt bauen“ sagst.",
            desktop: "So verhinderst du, dass die KI 400 Zeilen Code am eigentlichen Bedarf vorbeischreibt.",
            ide: "Perfekt für Google Antigravity Plan-Mode, Cursor Composer oder VS Code Copilot Plan.",
            agent: "Spec-Dateien halten auch CLI-Agenten auf Kurs.",
          },
          expectedGoodSignals: [
            "Klare Trennung von Problem, Datenquelle und 3 Testfällen.",
            "Fehler-/Leerzustand und [Nicht in Quelle] explizit definiert.",
          ],
          commonPitfalls: [
            "Sofort ‚Bau mir eine App‘ prompten — führt meist zu erfundenen Beispieldaten.",
          ],
        },
        {
          id: "a-step-2",
          num: "02",
          title: "Funktionalen Prototyp bauen (passend zu deinem Werkzeug)",
          durationMin: 12,
          instruction:
            "Setze genau diese Spezifikation um — ohne externe CDNs, ohne API-Keys und mit sichtbaren Quellenangaben.",
          promptsByMode: {
            web: `Setze jetzt exakt unsere Spezifikation als eigenständige Single-File-HTML-App (React/HTML+JS ohne externe CDN-Skripte) in Claude Artifacts / ChatGPT Canvas um (Tipp für Copilot/Gemini/Langdock: gib kompletten HTML-Code in einem Block zum lokalen Speichern als app.html aus).\nPflicht: Jede Fach-Karte zeigt (datei.md), leere/unbekannte Suchen zeigen „[Nicht in Quelle]“.`,
            desktop: `Baue jetzt gemäß unserer Spezifikation eine vollständige, helle Single-File-HTML-App (ohne externe CDNs) mit interaktiver Suche/Quiz, Fehlerbehandlung und (datei.md)-Quellen-Footer.`,
            ide: `Implementiere jetzt gemäß sandbox/app-spec.md die lauffähige App unter sandbox/workshop-app.html (ohne externe Abhängigkeiten, mit klarer Fehler- & Leerzustands-Anzeige sowie (datei.md)-Belegen).`,
            agent: `Implementiere sandbox/workshop-app.html gemäß sandbox/app-spec.md, halte alle Zahlen streng aus dem Korpus und füge unten einen Selbsttest-Block ein.`,
          },
          toolTips: {
            web: "In Claude: Artifacts. In ChatGPT: Canvas. In M365 Copilot / Gemini / Langdock: Code kopieren → als app.html speichern → im Browser öffnen.",
            desktop: "Öffne die erzeugte .html-Datei einfach per Doppelklick im Browser.",
            ide: "Nutze Live Preview / Browser in VS Code, um direkt zu klicken.",
            agent: "Lass den Agenten keine Originaldateien außerhalb von sandbox/ anfassen.",
          },
          expectedGoodSignals: [
            "Standalone HTML läuft ohne Internet/CDN und ohne Platzhalter-Secrets.",
            "Quellenangaben (datei.md) sind für Nutzer sichtbar.",
          ],
          commonPitfalls: [
            "Kaputte CDN-Imports oder hartcodierte Demo-Zahlen statt echter Korpus-Fakten.",
          ],
        },
        {
          id: "a-step-3",
          num: "03",
          title: "Testen, Debuggen & im Output-Validator abnehmen",
          durationMin: 10,
          instruction:
            "Führe deine 3 Testfälle aus Schritt 1 am Prototyp durch, lass Fehler beheben und prüfe Spec/Code im Output-Validator.",
          promptsByMode: {
            web: `Prüfe unsere App gegen diese 3 Tests und behebe jede Schwachstelle:\n1. Leere Eingabe oder Sonderzeichen -> kein Crash, klare Meldung.\n2. Fangfrage (${trapTopic}) -> zeigt „[Nicht in Quelle]“.\n3. Alle angezeigten Zahlen entsprechen exakt (${s1}.md) / (${s2}.md).`,
            desktop: `Führe ein kritisches Code- & Fakten-Review unserer HTML-App gegen alle 3 Akzeptanzkriterien durch und gib mir das geprüfte Ergebnis samt Testprotokoll aus.`,
            ide: `Führe in der IDE einen Review-Pass auf sandbox/workshop-app.html gegen sandbox/app-spec.md durch (Barrierefreiheit, Leerzustand, Quellenbelege) und erstelle ein kurzes Testprotokoll.`,
            agent: `Prüfe sandbox/workshop-app.html automatisiert (Syntax, keine Secrets/eval, alle 3 Akzeptanzkriterien) und erstelle ein kurzes Abnahme-Protokoll.`,
          },
          toolTips: {
            web: "Füge deine Spec + HTML-Auszug bzw. das Testprotokoll unten in den Output-Validator ein!",
            desktop: "Prüfe einmal die Browser-Konsole (F12) auf rote Fehler.",
            ide: "Nutze deinen Editor für gezielte Bugfixes statt die ganze Datei neu zu generieren.",
            agent: "Ein kurzes Node-Smoke-Skript prüft HTML-Struktur & verbotene Begriffe in Sekunden.",
          },
          expectedGoodSignals: ["Alle 3 Edge-Cases getestet; Output-Validator grün."],
          commonPitfalls: ["Nur den Happy-Path getestet, Leerzustand vergessen."],
        },
      ],
      rubric: [
        {
          id: "r-app-spec",
          criterion: "Spezifikation & Akzeptanzkriterien vor dem Code erstellt",
          howToCheck: "Problem, Datenbasis und mindestens 3 Testfälle sind schriftlich definiert.",
          required: true,
        },
        {
          id: "r-app-run",
          criterion: "Lauffähiger Prototyp (Artifact / Canvas / lokale .html) ohne Konsolenfehler",
          howToCheck: "Interaktion funktioniert im Browser ohne kaputte externe Skripte.",
          required: true,
        },
        {
          id: "r-app-edge",
          criterion: "Leerzustand & Fangfrage ([Nicht in Quelle]) sauber behandelt",
          howToCheck: "Unbekannte/leere Eingaben stürzen nicht ab und erfinden keine Fakten.",
          required: true,
        },
        {
          id: "r-app-cite",
          criterion: "Fachdaten in der App tragen echte Quellenbelege (datei.md)",
          howToCheck: "Jede Karte / jeder Wert nennt die Quelldatei im Text oder Footer.",
          required: false,
        },
      ],
    },
    {
      id: "presentations",
      title: "Ziel 3 · Bessere Präsentationen & Storylines",
      shortLabel: "Präsentationen bauen",
      badge: "SCQA · Action-Titles · Echte Decks",
      audienceHint: "Für alle, die überzeugende Management-Decks statt generischer Bulletpoint-Wände bauen wollen.",
      durationLabel: "30 Min. Ziel-Labor",
      outcomeSummary:
        "Du baust keine bloße Text-Zusammenfassung, sondern erst eine SCQA-Storyline mit Action-Titles, dann einen vollständigen Folien-Blueprint (Layout, Belege, Sprechernotizen) und exportierst ins echte Deck-Format.",
      validatorPreset: "presentations",
      steps: [
        {
          id: "s-step-1",
          num: "01",
          title: "Zielgruppe & SCQA-Storyline (Action-Titles)",
          durationMin: 8,
          instruction: `Entwirf eine 5-Folien-Storyline für Entscheider:innen zu „${domain}“ nach Situation → Komplikation → Frage → Antwort — jeder Folientitel muss eine echte Kernaussage sein.`,
          promptsByMode: {
            web: `Erstelle ZUERST nur die Storyline für ein 5-Folien-Management-Deck zu „${domain}“ (basierend auf ${s1}.md, ${s2}.md, ${s3}.md):\n- Struktur: SCQA (Situation, Komplikation, Frage, Antwort) + Empfehlung.\n- Regel für Titel: KEINE Themenwörter wie „Überblick“ oder „Risiken“, sondern komplette Action-Titles (Kernaussagen mit Zahl/Fakt).\n- Jede Zahl braucht (datei.md); Unbekanntes („${trapTopic}“) als [Nicht in Quelle].`,
            desktop: `Nutze die Wissensbasis (${stage3Dir}/ in Cowork bzw. Knowledge Folder in Langdock / Projects / Gems) und entwirf zuerst eine 5-Folien-SCQA-Gliederung mit echten Action-Titles (Kernaussagen), belegt durch (datei.md).`,
            ide: `Nutze AGENTS.md und _index.md im aktuellen Workspace und entwirf in sandbox/deck-storyline.md eine 5-Folien-SCQA-Storyline mit vollständigen Action-Titles und Dateibelegen.`,
            agent: `Nutze search_vault (--module ${modId}) und entwirf eine 5-Folien-SCQA-Storyline mit vollständigen Action-Titles, (datei.md)-Belegen und [Nicht in Quelle].`,
          },
          toolTips: {
            web: "Lies zuerst nur die 5 Folientitel hintereinander: Ergibt das schon die ganze Geschichte?",
            desktop: "Perfekt als Gliederung für PowerPoint-Designer oder M365 Copilot.",
            ide: "Markdown-Outlines lassen sich direkt als Marp/Slidev-Decks rendern.",
            agent: "Mit _index.md stellt der Agent sicher, dass keine wichtige Gegenaussage fehlt.",
          },
          expectedGoodSignals: [
            "Alle 5 Titel sind vollständige Kernaussagen statt 1-Wort-Überschriften.",
            "Klare SCQA-Dramaturgie von Ausgangslage bis Empfehlung.",
          ],
          commonPitfalls: [
            "Langweilige Titel wie ‚Folie 2: Daten & Fakten‘ statt ‚Folie 2: Guardrails senken Halluzinationen auf 0‘.",
          ],
        },
        {
          id: "s-step-2",
          num: "02",
          title: "Folien-Blueprint: Visuals, 3 Bullets & Sprechernotizen",
          durationMin: 12,
          instruction:
            "Arbeite jede Folie aus: max. 3 kurze Bullets, konkreter Visual-/Diagramm-Vorschlag, exakte Quellen und 2–3 Sätze Sprechernotiz.",
          promptsByMode: {
            web: `Baue jetzt aus der Storyline den vollständigen 5-Folien-Blueprint (Folie 1 bis Folie 5):\nPro Folie verbindlich:\n- Action-Title\n- Max. 3 knappe Bullets (je max. 12 Wörter) mit (datei.md)\n- Visual-Vorschlag (z. B. Vorher/Nachher-Vergleich, Balkendiagramm, 2x2-Matrix)\n- Sprechernotiz (2–3 Sätze für die Moderation)\nAuf Folie 5 zwingend ein Kasten „Offene Lücken / [Nicht in Quelle]“.`,
            desktop: `Erstelle auf Basis der Storyline einen vollständigen 5-Folien-Blueprint mit Action-Titles, max. 3 Bullets, Visual-Specs, Sprechernotizen, (datei.md)-Belegen und Offene-Lücken-Kasten.`,
            ide: `Schreibe in sandbox/deck-blueprint.md (Marp-/Markdown-Format mit --- Trennern) 5 vollständige Folien inkl. Visual-Spezifikation, Sprechernotizen (<!-- Notiz: ... -->), (datei.md) und [Nicht in Quelle].`,
            agent: `Erzeuge sandbox/deck-blueprint.md als 5-Folien-Deck (Action-Titles, max. 3 Bullets, Visual-Spec, Sprechernotizen, (datei.md) und Offene Lücken).`,
          },
          toolTips: {
            web: "Für M365 Copilot in PowerPoint: Blueprint als Gliederungstext einfügen — oder direkt in Gamma / Claude Artifacts als Folien rendern.",
            desktop: "Markdown mit --- lässt sich direkt in Gamma oder Marp einfügen; für klassisches PowerPoint als Word-Gliederung oder per Marp-PPTX-Export übernehmen.",
            ide: "Mit der VS-Code-Erweiterung ‚Marp for VS Code‘ (oder Marp CLI) siehst du sofort echte Folien + PDF/PPTX-Export.",
            agent: "Mit Marp CLI (npx @marp-team/marp-cli) lässt sich sandbox/deck-blueprint.md direkt als HTML-, PDF- oder PPTX-Deck exportieren.",
          },
          expectedGoodSignals: [
            "Keine Textwüsten (max. 3 Bullets je Folie).",
            "Jede Folie hat Visual-Spec + Sprechernotiz + (datei.md).",
          ],
          commonPitfalls: ["Sprechernotizen vergessen und ganzen Vortrag auf die Folie gepackt."],
        },
        {
          id: "s-step-3",
          num: "03",
          title: "Executive-Critique & Deck-Export prüfen",
          durationMin: 10,
          instruction:
            "Lass eine kritische Vorstands-Prüfung über deinen Blueprint laufen (und erstelle optional eine HTML-/PowerPoint-Vorschau), danach im Output-Validator abnehmen.",
          promptsByMode: {
            web: `Prüfe unseren 5-Folien-Blueprint wie ein kritischer Lenkungsausschuss:\n1. Welche Folie hat noch zu viel Text oder keinen klaren Action-Title?\n2. Ist jede Zahl durch (datei.md) gedeckt?\n3. Gib die überarbeitete Endfassung (oder als interaktive 5-Folien-HTML-Vorschau in Artifacts/Canvas) aus.`,
            desktop: `Prüfe den Blueprint auf Folien-Überladung und unbelegte Aussagen und bereite ihn sauber für PowerPoint / M365 Copilot bzw. Gamma/Marp auf.`,
            ide: `Prüfe sandbox/deck-blueprint.md auf Action-Titles, Faktenbelege und Sprechernotizen und erzeuge optional sandbox/deck-preview.html mit Pfeiltasten-Navigation.`,
            agent: `Prüfe sandbox/deck-blueprint.md gegen alle Quelldateien (verify_claim) und erzeuge eine saubere Endfassung.`,
          },
          toolTips: {
            web: "Füge deinen fertigen Folien-Blueprint unten in den Output-Validator ein!",
            desktop: "Behalte die Lücken-Folie bei — das schafft sofort Vertrauen beim Publikum.",
            ide: "Prüfe das fertige Markdown-Deck auch direkt unten im Output-Validator.",
            agent: "Jede Zahl auf einer Folie lässt sich vor dem Termin gegen den Vault verifizieren.",
          },
          expectedGoodSignals: ["Output-Validator bestätigt >= 4 Folien, SCQA, Belege & Sprechernotizen."],
          commonPitfalls: ["Folien mit erfundenen Zahlen ‚aufgehübscht‘."],
        },
      ],
      rubric: [
        {
          id: "r-pres-scqa",
          criterion: "Klare SCQA-Dramaturgie mit aussagekräftigen Action-Titles",
          howToCheck: "Die Folientitel allein erzählen schon den roten Faden.",
          required: true,
        },
        {
          id: "r-pres-concise",
          criterion: "Keine Textwände — max. 3 Bullets + konkrete Visual-Idee pro Folie",
          howToCheck: "Jede Folie benennt ein passendes Schaubild/Layout.",
          required: true,
        },
        {
          id: "r-pres-cite",
          criterion: "Zahlen mit (datei.md) belegt & Sprechernotizen getrennt formuliert",
          howToCheck: "Output-Validator findet gültige Dateinamen und Sprechernotizen.",
          required: true,
        },
        {
          id: "r-pres-gaps",
          criterion: "Offene Punkte / [Nicht in Quelle] explizit auf Folie markiert",
          howToCheck: "Keine fehlenden Daten stillschweigend ergänzt.",
          required: false,
        },
      ],
    },
    {
      id: "everyday-ai",
      title: "Ziel 4 · KI im Arbeitsalltag",
      shortLabel: "KI im Arbeitsalltag",
      badge: "Workflows · Review · Regelbuch",
      audienceHint: "Für alle Rollen: Meetings, Mails, Dokument-Reviews & ein persönliches KI-Betriebssystem für Montagmorgen.",
      durationLabel: "30 Min. Ziel-Labor",
      outcomeSummary:
        "Du baust eine wiederverwendbare Meeting-/Dokument-Pipeline, entlarvst versteckte Entwurfsfehler per Faktencheck und nimmst dein getestetes Regelbuch (Projects / Gems / AGENTS.md) mit.",
      validatorPreset: "everyday-ai",
      steps: [
        {
          id: "e-step-1",
          num: "01",
          title: "Dokument-/Meeting-zu-Aktionen-Pipeline",
          durationMin: 10,
          instruction: `Verwandle komplexe Unterlagen aus „${domain}“ in ein verbindliches Beschluss- & Aufgaben-Protokoll — ohne dass die KI Fristen oder Zuständigkeiten dazuerfindet.`,
          promptsByMode: {
            web: `Erstelle aus den beigefügten Unterlagen (${s1}.md, ${s2}.md, ${s3}.md) ein klares Ergebnis- & Aktionsprotokoll für unser Team:\n1. Zusammenfassung & Entscheidungen (max. 4 Punkte mit (datei.md))\n2. Aufgaben-Tabelle: Aufgabe | Verantwortlich (Owner) | Frist (wenn fehlend: zwingend „[Noch klären]“)\n3. Risiken & Offene Fragen (Fehlendes als „[Nicht in Quelle]“).\nErfinde KEINE Termine, Namen oder Budgets hinzu.`,
            desktop: `Lies die Dateien aus ${stage2Dir}/ (Cowork) bzw. deinem Knowledge Folder (Langdock / Projects / Gems) und erstelle ein strukturiertes Ergebnisprotokoll (Entscheidungen, Aufgaben mit Owner/Frist oder [Noch klären], Risiken/Offene Fragen mit (datei.md)).`,
            ide: `Nutze AGENTS.md und die Quelldateien im aktuellen Workspace, um ein strukturiertes Aktionsprotokoll mit Entscheidungen, Aufgaben (Owner/Frist oder [Noch klären]), Risiken und (datei.md)-Quellen zu erstellen.`,
            agent: `Nutze search_vault (--module ${modId}) und erzeuge ein strukturiertes Aktionsprotokoll (Entscheidungen, Aufgaben mit Owner/Frist oder [Noch klären], Risiken, (datei.md)).`,
          },
          toolTips: {
            web: "Ideal für Teams-Protokolle, E-Mail-Zusammenfassungen und Status-Updates.",
            desktop: "In Langdock Assistants oder Claude/ChatGPT Projects einmal als Vorlage speichern.",
            ide: "Eignet sich perfekt für PR-/ADR-/Runbook-Zusammenfassungen im Repo.",
            agent: "Reproduzierbar für tägliche Status-Checks über ganze Ordner.",
          },
          expectedGoodSignals: [
            "Entscheidungen, Aufgaben, Owner/Fristen und Risiken klar getrennt.",
            "Fehlende Zuständigkeiten erscheinen ehrlich als [Noch klären] / [Nicht in Quelle].",
          ],
          commonPitfalls: [
            "KI erfindet ‚bis Ende der Woche‘ oder ‚Team-Lead‘, wenn keine Frist im Text steht.",
          ],
        },
        {
          id: "e-step-2",
          num: "02",
          title: "Faktencheck & kritisches Entwurfs-Redlining",
          durationMin: 10,
          instruction:
            "Nutze unten den In-Browser Faktenprüfer ODER lass deine KI einen fehlerhaften Textentwurf Satz für Satz gegen unsere Dateien gegenprüfen.",
          promptsByMode: {
            web: `Prüfe den folgenden kurzen Entwurf kritisch gegen unsere beigefügten Dateien und markiere jeden Satz als [Belegt (datei.md)], [Widerspruch] oder [Nicht in Quelle]:\n„Laut unseren Unterlagen gilt beim Kennwert aus ${q4File} der Wert ${q4Mutated}, außerdem deckt unser Material bereits das Thema ${trapTopic} vollständig ab.“\n(Kontrollhinweis zum Abgleich: ${q4Fact}.)`,
            desktop: `Prüfe kritisch gemäß den Leitplanken (Faktenprüfung-Skill in ${stage2Dir}/ bzw. Assistant Instructions) die Aussage „${q4Mutated}“ (${q4Fact}) sowie „${trapTopic}“ — zeige exakt, welche Datei was belegt.`,
            ide: `Prüfe gegen _index.md und die Quelldateien im aktuellen Workspace einzeln mit Belegt / Widerspruch / Nicht in Quelle: (1) den Kernwert aus ${q4File} (${q4Fact}), (2) die Behauptung „${trapTopic}“.`,
            agent: `Rufe verify_claim (--module ${modId}) für mindestens 2 Aussagen (eine wahre, eine widersprüchliche/Fangfrage wie ${q4Fact}) auf und dokumentiere das Ergebnis.`,
          },
          toolTips: {
            web: "Nutze parallel unten das „Live-Suche & Faktenprüfer“-Labor direkt hier im Browser!",
            desktop: "So prüfst du Entwürfe von Kolleg:innen oder eigene Mails vor dem Versand.",
            ide: "Hilft auch beim Abgleich von Doku vs. echtem Code.",
            agent: "verify_claim erkennt jetzt auch Zahlenwidersprüche und Verneinungen!",
          },
          expectedGoodSignals: [
            "Mindestens 1 belegte Aussage und 1 Widerspruch/Fangfrage sauber getrennt.",
          ],
          commonPitfalls: ["KI nickt falsche Zahlen im Entwurf einfach höflich ab."],
        },
        {
          id: "e-step-3",
          num: "03",
          title: "Persönliches KI-Betriebssystem + Entscheidungs-Check",
          durationMin: 10,
          isActionStep: true,
          actionTargetId: "output-validator-section",
          instruction:
            "Prüfe dein Aktionsprotokoll im Output-Validator und baue darunter in der Regel-Werkbank deine fertige Hausregel für Montagmorgen.",
          promptsByMode: {
            web: "Füge dein Aktionsprotokoll unten in den Output-Validator ein und erstelle danach in der Regel-Werkbank deine Custom Instructions inkl. Test-Fangfrage.",
            desktop: "Prüfe dein Ergebnis unten im Output-Validator und exportiere dein Takeaway-Kit für deinen Projektordner bzw. Assistant.",
            ide: "Prüfe dein Ergebnis unten im Output-Validator und sichere deine getestete AGENTS.md über die Regel-Werkbank.",
            agent: "Prüfe dein Ergebnis unten im Output-Validator und sichere deine getestete AGENTS.md + Fangfrage als Takeaway-Kit.",
          },
          toolTips: {
            web: "Wann KI NICHT nutzen? Bei echten Kundendaten, Personaldaten oder unklaren Verträgen im offenen Chat!",
            desktop: "Anonymisiere Namen/Kontonummern immer zuerst vor dem Hochladen.",
            ide: "Lege vertrauliche Dateien immer in .gitignore / lokale Ignore-Listen.",
            agent: "Datenschutz-Regel Nr. 1: Nie echte Kundendaten an externe Modelle senden.",
          },
          expectedGoodSignals: [
            "Output-Validator + 4-Säulen-Regelbuch beide grün.",
            "Takeaway-Kit heruntergeladen.",
          ],
          commonPitfalls: ["Regel gebaut, aber nie mit einer eigenen Fangfrage getestet."],
        },
      ],
      rubric: [
        {
          id: "r-day-actions",
          criterion: "Protokoll trennt Entscheidungen, Aufgaben (Owner/Frist) & Risiken",
          howToCheck: "Output-Validator bestätigt alle 4 Struktur-Blöcke.",
          required: true,
        },
        {
          id: "r-day-gaps",
          criterion: "Fehlende Zuständigkeiten oder Fristen als [Noch klären] markiert",
          howToCheck: "Keine erfundenen Namen oder Termine im Text.",
          required: true,
        },
        {
          id: "r-day-factcheck",
          criterion: "Mindestens 1 Faktencheck oder Entwurfs-Redlining durchgeführt",
          howToCheck: "Live-Prüfer genutzt oder Entwurfsfehler mit (datei.md) aufgedeckt.",
          required: true,
        },
        {
          id: "r-day-rulebook",
          criterion: "Persönliche Hausregel + Fangfrage für Montagmorgen validiert",
          howToCheck: "Regel-Werkbank zeigt 4/4 Säulen erfüllt.",
          required: false,
        },
      ],
    },
  ];
}
