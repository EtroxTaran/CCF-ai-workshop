export interface GlossaryEntry {
  id: string;
  term: string;
  aliases?: string[];
  category: "Basis" | "Methoden" | "Schutz & Wissen" | "Technik (Code-Agent)";
  short: string;
  everydayExample: string;
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: "markdown",
    term: ".md / Markdown",
    aliases: ["Markdown", ".md-Datei", "Markdown-Dokument"],
    category: "Basis",
    short: "Eine ganz normale Textdatei (wie .txt) mit einfachen #-Überschriften statt Word-Design.",
    everydayExample: "Kannst du einfach per „+“ oder 📎 in Claude & ChatGPT hochladen — am PC musst du sie gar nicht extra öffnen.",
  },
  {
    id: "prompt",
    term: "Prompt",
    aliases: ["User-Prompt", "Roh-Prompt"],
    category: "Basis",
    short: "Dein Auftrag bzw. deine Frage an eine KI im Eingabefeld.",
    everydayExample: "Wie eine kurze Arbeitsanweisung an eine neue Kollegin.",
  },
  {
    id: "zero-shot",
    term: "Zero-Shot (Baseline)",
    aliases: ["Zero-Shot"],
    category: "Methoden",
    short: "Du stellst einfach eine kurze Frage ohne Vorlage, Beispiele oder Formatvorgabe.",
    everydayExample: "„Erzähl mir was über Eisbären“ — schnell eingetippt, aber die Antwort bleibt meist vage.",
  },
  {
    id: "costar",
    term: "CO-STAR",
    category: "Methoden",
    short: "6-Punkte-Checkliste für klare Business-Prompts: Context (Kontext), Objective (Ziel), Style (Stil), Tone (Ton), Audience (Zielgruppe), Response (Format).",
    everydayExample: "Ideal für Management-Memos, Kunden-E-Mails und saubere Zusammenfassungen.",
  },
  {
    id: "few-shot",
    term: "Few-Shot",
    aliases: ["Few-Shot (Schema)"],
    category: "Methoden",
    short: "Du gibst der KI 2 kurze Muster-Beispiele, damit sie genau dein Tabellen- oder Listenformat trifft.",
    everydayExample: "Statt 10 Regeln zu erklären, zeigst du zwei fertige Tabellenzeilen — den Rest macht die KI genauso.",
  },
  {
    id: "risen-cot",
    term: "RISEN + Chain-of-Thought (CoT)",
    aliases: ["RISEN", "CoT"],
    category: "Methoden",
    short: "Struktur mit Rolle, klaren Einzelschritten (1–2–3), Endziel und Grenzen („Narrowing“).",
    everydayExample: "Super für Fakten-Prüfungen und Verträge: Schritt 1 prüfen, Schritt 2 vergleichen, Schritt 3 Lücken melden.",
  },
  {
    id: "halluzination",
    term: "Halluzination (Raten)",
    aliases: ["Halluzination"],
    category: "Schutz & Wissen",
    short: "Wenn eine KI überzeugend klingende Zahlen oder Fakten frei erfindet, obwohl sie nichts dazu weiß.",
    everydayExample: "Sie nennt selbstbewusst „18 € Eintritt für Schneeleoparden“, obwohl kein einziges Dokument das erwähnt.",
  },
  {
    id: "guardrails",
    term: "Leitplanken (Guardrails)",
    aliases: ["Guardrail", "Narrowing"],
    category: "Schutz & Wissen",
    short: "Feste Verbote & Regeln für die KI — z. B. „Erfinde nichts“ oder „Nenne immer die Quelle“.",
    everydayExample: "Wie ein Qualitäts-Stoppschild: Lieber ehrlich „steht nicht im Text“ sagen als raten.",
  },
  {
    id: "kontext-fenster",
    term: "Kontext-Fenster (Kurzzeitgedächtnis)",
    aliases: ["Kontext-Fenster", "Kontext-Tank", "Tokens"],
    category: "Basis",
    short: "Der begrenzte Arbeits-Speicher eines Chats. Alles darin (Texte, Verlauf, Regeln) wird in kleinen Wort-Bausteinen („Tokens“) gezählt.",
    everydayExample: "Wird ein Chat ewig lang, fallen alte Wünsche aus dem Gedächtnis — deshalb hilft pro Test ein „+ Neuer Chat“.",
  },
  {
    id: "priming",
    term: "Basis-Regeln / Priming",
    aliases: ["Priming", "System-Prompt", "System-Regeln"],
    category: "Schutz & Wissen",
    short: "Eine klare Grundregel, die du ganz am Anfang eines Chats (oder in den Projekt-Anweisungen) vorgibst.",
    everydayExample: "„Du bist heute ein strenger Faktenprüfer und nutzt nur meine angehängten Dateien.“",
  },
  {
    id: "artifacts-canvas",
    term: "Artifacts & Canvas",
    aliases: ["Artifacts", "Canvas"],
    category: "Basis",
    short: "Das Vorschau-Fenster direkt neben dem Chat in Claude (Artifacts) oder ChatGPT (Canvas), in dem Webseiten, Tabellen oder Mini-Apps sofort laufen.",
    everydayExample: "Du schreibst „Erstelle eine interaktive Vorschau / HTML-Seite“ — rechts ploppt die fertige Seite auf.",
  },
  {
    id: "wissensbasis",
    term: "Wissensbasis (68 Artikel)",
    aliases: ["Korpus", "Wissensbasis"],
    category: "Basis",
    short: "Unsere Sammlung aus 68 öffentlichen deutschen Wikipedia-Artikeln zu Tierwelt & Lebensräumen.",
    everydayExample: "Absolut sicheres Übungsmaterial mit 0 Kundendaten — die Express-Pakete bündeln die wichtigsten 6–10 Texte.",
  },
  {
    id: "rag",
    term: "Vernetztes Wissen (Markdown-RAG)",
    aliases: ["Markdown-RAG", "RAG"],
    category: "Schutz & Wissen",
    short: "Retrieval-Augmented Generation: Statt alles blind in den Chat zu kopieren, schlägt die KI erst im Inhaltsverzeichnis nach und holt sich gezielt passende Artikel.",
    everydayExample: "Wie erst ins Sachregister eines Lexikons schauen statt alle 68 Bände gleichzeitig auf den Tisch zu kippen.",
  },
  {
    id: "wikilinks",
    term: "Querverweise ([[Wikilinks]])",
    aliases: ["[[Wikilinks]]", "Wikilinks"],
    category: "Schutz & Wissen",
    short: "Doppelte eckige Klammern verknüpfen verwandte Artikel direkt miteinander — wie anklickbare Querverweise im Wiki.",
    everydayExample: "Im Artikel [[anemonenfische]] steht direkt der Link zu [[seeanemonen]] und [[symbiose]].",
  },
  {
    id: "agents-md",
    term: "AGENTS.md & Harness",
    aliases: ["AGENTS.md", "Harness", "Skills"],
    category: "Technik (Code-Agent)",
    short: "Eine Textdatei im Projekt-Ordner, die Desktop- und Code-Agenten (mit wiederverwendbaren „Skills“) beim Öffnen automatisch als Arbeitsanweisung laden.",
    everydayExample: "Die dauerhafte Arbeitsmappe eines Teams: Regeln müssen nie wieder abgetippt werden.",
  },
  {
    id: "yaml",
    term: "Steckbrief (YAML-Frontmatter)",
    aliases: ["YAML", "Frontmatter"],
    category: "Technik (Code-Agent)",
    short: "Der strukturierte Kopfbereich ganz oben in einer Wissens-Datei (zwischen drei Strichen ---) mit Lebensraum, Tags und Querverweisen.",
    everydayExample: "Wie das Deckblatt einer Akte: Lebensraum = Arktis, Status = geprüft.",
  },
  {
    id: "mcp",
    term: "MCP (Model Context Protocol)",
    aliases: ["MCP", "JSON-RPC"],
    category: "Technik (Code-Agent)",
    short: "Ein offener Standard („USB-C-Stecker für KI“), über den eine KI direkt Werkzeuge wie Suche oder Faktencheck aufrufen kann.",
    everydayExample: "Statt Texte selbst herüberzukopieren, schaut die KI live über ein geprüftes Werkzeug nach.",
  },
  {
    id: "opencode",
    term: "OpenCode & OpenRouter",
    aliases: ["OpenCode", "OpenRouter"],
    category: "Technik (Code-Agent)",
    short: "Ein freies Open-Source-Terminal-Tool (OpenCode), das sich über OpenRouter auch mit kostenlosen Free-Tier-Modellen verbinden lässt.",
    everydayExample: "Unsere Backup-Brücke vor Ort, falls jemand gar kein eigenes KI-Konto nutzt.",
  },
  {
    id: "git-zip",
    term: "Git & ZIP-Download",
    aliases: ["git clone", "Repository", "ZIP"],
    category: "Technik (Code-Agent)",
    short: "Ein „Repository“ ist einfach der Projekt-Ordner auf GitHub. Ohne das Programm „Git“ kannst du ihn auch als ganz normale ZIP-Datei herunterladen und entpacken.",
    everydayExample: "Auf Windows einfach Rechtsklick auf die ZIP-Datei → „Alle extrahieren…“.",
  },
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY_ENTRIES.map((e) => [e.id, e]));
