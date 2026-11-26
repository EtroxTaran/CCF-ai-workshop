---
title: Runbook · Nächtlicher SEPA-Zahlungslauf (22:00 Uhr)
category: runbook
group: Betrieb & SLA
tags: [runbook, incident, replay, rollback, batch]
---

# Runbook · Nächtlicher SEPA-Zahlungslauf

Standard-Ablauf für den täglichen Produktivlauf um **22:00 Uhr** unter Einhaltung von [[sla-betriebsmodell]]:

## 1. Vorprüfung (21:45 Uhr)
- Outbox-Tiefe prüfen (muss unter **5.000 offenen Events** liegen laut [[risikoregister-q3]] und [[architektur-entscheidung-01]]).
- Datenbank-Snapshot bestätigen (maximal **15 Minuten RPO**).

## 2. Störfall & Eskalation
- Schlägt der Batch fehl, zunächst `replay_outbox --dry-run` ausführen — kein blinder Neustart ohne Log-Prüfung!
- Dauert die Störung länger als **30 Minuten**, sofort den Incident-Lead laut [[team-rollen-raci]] eskalieren, um das **4-Stunden-RTO** zu halten.
- Jede Aktion gemäß [[datenschutz-leitlinie]] protokollieren.
