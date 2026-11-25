---
status: accepted
---

# 100 % statische HTTPS-App (GitHub Pages) statt Live-Raum-Server

Wir entfernen den bidirektionalen Live-Raum-Server (SSE-Sync, Live-Submission-Wall, `live-questions/`, `BeamerSendSheet`, `submit-question.mjs` und das MCP-Tool `send_to_beamer`) vollständig und betreiben die Workshop-App sowie die Trainer-Bühne (`#/beamer`) als rein statische HTTPS-Webanwendung über GitHub Pages (`https://etroxtaran.github.io/CCF-ai-workshop/`).

## Considered Options

- **Zentraler HTTPS-Raum-Server (Tunnel/Cloud) mit Live-Wall & Room-Pulse:** Bietet Live-Karten am Projektor, bringt aber erhebliche Betriebs- und Moderationskomplexität (Admin-Auth, SSE-Skalierung, Rate-Limits, Zscaler-/WLAN-Debugging) für geringen Nutzen in 40 Netto-Minuten.
- **Reines Konferenz-WLAN (`http://192.168.x.x:3777`):** Scheitert in vielen Hotel-/Firmen-WLANs an Client-Isolation, Windows-Firewall, virtuellen Netzwerkadaptern und blockiert die HTTPS-Clipboard-API unter iOS.
- **100 % statische HTTPS-App (gewählt):** Null Server-Ausfallrisiko, natives HTTPS-Clipboard auf allen Geräten, sofortige Erreichbarkeit über GitHub Pages und lokales `start-workshop.bat` als schlankes 40-Zeilen-Offline-Backup.

## Consequences

- Das gesamte Entwicklungsbudget fließt in visuelle Führung, Animatics, interaktive Vorher/Nachher-Vorschauen und didaktische Klarheit statt in LAN-Networking.
- Der lokale MCP-Server (`mcp-server/server.mjs`) konzentriert sich auf reine Wissensbasis-Werkzeuge (`search_wildlife_vault`, `verify_claim_against_corpus`, `read_vault_article`).
- Debrief-Interaktionen im Raum (11:55 Uhr) erfolgen gezielt über direkte Handzeichen und kuratierte Bühnen-Impulse auf `#/beamer`.
