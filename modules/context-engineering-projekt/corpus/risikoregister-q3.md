---
title: Risikoregister Q3 2026
category: entscheidung
group: Architektur & Governance
tags: [risiko, engpass, batch, rollback]
---

# Risikoregister Q3 2026

Aktuelle Top-3-Risiken für den Go-Live am **15. Oktober 2026** ([[rfp-kernbank-2026]]):

| ID | Risiko | Schwere | Gegenmaßnahme & Quelle |
|---|---|---|---|
| **R-01** | Abendlicher **SEPA-Batch um 22:00 Uhr** überschreitet bei Lastspitzen das Zeitfenster vor 01:00 Uhr | **Hoch** | Verpflichtender Lasttest + Vorab-Checkliste in [[runbook-zahlungslauf]] und [[migrationsplan-phase1]] |
| **R-02** | Rückstau in der **Transactional Outbox** verzögert Buchungsbestätigungen | **Mittel** | Schwellenwert-Alarm ab **5.000 offenen Events** + Replay-Skript laut [[architektur-entscheidung-01]] |
| **R-03** | Fehlende synthetische Testdaten verzögern Abnahme | **Mittel** | Generierungsskript 3 Wochen vor Abnahme gemäß [[datenschutz-leitlinie]] & [[team-rollen-raci]] |
