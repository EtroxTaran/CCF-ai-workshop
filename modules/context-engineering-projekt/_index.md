# Inhaltsverzeichnis · Context Engineering · Projekt & Betrieb

## Dokumente
- [[glossar-fachbegriffe|Projekt-Glossar (Kernbank 2026)]] (Planung & Scope) — RTO (Recovery Time Objective): Maximal tolerierte Ausfallzeit bis zur Wiederherstellung eines Dienst
- [[meeting-notiz-kickoff|Kick-off Meeting-Notiz (08.05.2026)]] (Planung & Scope) — Teilnehmende: Projektleitung (M. Berger), Betrieb (K. Lindner), Architektur (T. Yilmaz), Fachbereich
- [[rfp-kernbank-2026|RFP Kernbank 2026 (Ausschreibung)]] (Planung & Scope) — Die fiktive Nordstern Bank AG schreibt die Modernisierung ihres SEPA-Zahlungsverkehrs unter dem Proj
- [[sla-betriebsmodell|SLA & Betriebsmodell Zahlungsverkehr]] (Betrieb & SLA) — Verbindliche Betriebsvereinbarung für den produktiven SEPA-Zahlungsverkehr von Kernbank 2026:

## Entscheidungen
- [[architektur-entscheidung-01|Architektur-Entscheidung 01 (Event-Outbox vs. Direct Push)]] (Architektur & Governance) — Status: Akzeptiert (gilt für Phase 1 ab 15. Oktober 2026)
- [[datenschutz-leitlinie|Datenschutz- & KI-Nutzungsleitlinie (Synthetisch)]] (Architektur & Governance) — Gilt verbindlich für Projektteam, Testsysteme und KI-Assistenz in Kernbank 2026:
- [[risikoregister-q3|Risikoregister Q3 2026]] (Architektur & Governance) — Aktuelle Top-3-Risiken für den Go-Live am 15. Oktober 2026 (rfp-kernbank-2026):

## Runbooks
- [[migrationsplan-phase1|Migrationsplan Phase 1 (Dual-Write & Cutover)]] (Planung & Scope) — Sicherer Übergang vom Alt- auf das Neusystem ohne Betriebsunterbrechung:
- [[runbook-zahlungslauf|Runbook · Nächtlicher SEPA-Zahlungslauf (22:00 Uhr)]] (Betrieb & SLA) — Standard-Ablauf für den täglichen Produktivlauf um 22:00 Uhr unter Einhaltung von sla-betriebsmodell
- [[team-rollen-raci|Team-Rollen & RACI-Matrix]] (Betrieb & SLA) — Klare Zuständigkeiten für Abnahme und Störungsbetrieb:
