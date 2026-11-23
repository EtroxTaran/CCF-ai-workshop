# Live-Questions (Beamer-Eingang)

In diesem Ordner landen Fragen, Ergebnisse und Aha-Momente der Workshop-Gruppen:

- Automatisch über das MCP-Tool `send_to_beamer`
- Über das CLI-Hilfsskript `node mcp-server/submit-question.mjs ...`
- Oder per GitHub-Commit / GitHub Issue (im Dual-Modus des Beamer-Servers)

Der Beamer-Server (`workshop-ui/server.mjs`) überwacht diesen Ordner alle 3 Sekunden und zeigt neue Einträge inkl. automatischer Korpus-Prüfung live auf `/beamer` an.
