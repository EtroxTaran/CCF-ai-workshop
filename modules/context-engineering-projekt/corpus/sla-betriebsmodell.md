---
title: SLA & Betriebsmodell Zahlungsverkehr
category: dokument
group: Betrieb & SLA
tags: [sla, rto, rpo, zahlungslauf, eskalation]
---

# SLA & Betriebsmodell Zahlungsverkehr

Verbindliche Betriebsvereinbarung für den produktiven SEPA-Zahlungsverkehr von Kernbank 2026:

## Wiederanlauf- & Verfügbarkeitsziele
- **RTO (Recovery Time Objective):** **4 Stunden** maximaler Wiederanlaufzeit bei Ausfall des Zahlungs-Gateways.
- **RPO (Recovery Point Objective):** **15 Minuten** maximaler Datenverlust im Fehlerfall.
- **Wartungsfenster:** Sonntags **02:00 bis 05:00 Uhr** nach Ankündigung.

## Eskalationspfad bei Störung
- Ab **30 Minuten** ungelöster Störung erfolgt automatisch eine Meldung an die Betriebsleitung gemäß [[runbook-zahlungslauf]].
- Rollen und Rufbereitschaft sind im [[team-rollen-raci]] geregelt.
- Bekannte Engpässe stehen im [[risikoregister-q3]] und im [[glossar-fachbegriffe]].
