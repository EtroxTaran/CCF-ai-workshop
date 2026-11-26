---
title: Architektur-Entscheidung 01 (Event-Outbox vs. Direct Push)
category: entscheidung
group: Architektur & Governance
tags: [adr, outbox, kafka, retry, idempotenz]
---

# Architektur-Entscheidung 01 (Event-Outbox)

- **Status:** Akzeptiert (gilt für Phase 1 ab 15. Oktober 2026)
- **Kontext:** Die Ausschreibung [[rfp-kernbank-2026]] fordert nachvollziehbare Buchungsevents bei maximal **15 Minuten RPO** laut [[sla-betriebsmodell]].

## Entscheidung
Wir verwenden das **Transactional Outbox Pattern** mit idempotenter Zustellung an den Message-Broker statt direkter synchroner RPC-Aufrufe.

## Konsequenzen
- **Vorteil:** Keine verlorenen Zahlungsnachrichten bei kurzzeitigem Broker-Ausfall; exakte Replay-Fähigkeit im [[runbook-zahlungslauf]].
- **Risiko:** Zusätzlicher Überwachungsaufwand für die Outbox-Warteschlange (siehe R-02 im [[risikoregister-q3]]).
- Datenschutz-Anforderungen für Event-Payloads sind in [[datenschutz-leitlinie]] festgelegt.
