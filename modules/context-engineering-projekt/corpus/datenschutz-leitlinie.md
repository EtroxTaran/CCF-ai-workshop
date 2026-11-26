---
title: Datenschutz- & KI-Nutzungsleitlinie (Synthetisch)
category: entscheidung
group: Architektur & Governance
tags: [datenschutz, pii, audit, leitlinie]
---

# Datenschutz- & KI-Nutzungsleitlinie

Gilt verbindlich für Projektteam, Testsysteme und KI-Assistenz in Kernbank 2026:

## Verbindliche Regeln
1. **Keine Echtdaten in Tests oder KI-Prompts:** Konto- und Kundendaten (IBAN, Namen, Adressen) dürfen niemals in nicht-produktiven Umgebungen oder externen KI-Tools genutzt werden.
2. **Event-Payloads minimieren:** Nachrichten aus [[architektur-entscheidung-01]] übertragen ausschließlich interne Vorgangs-IDs und Betrags-Hashwerte.
3. **Audit-Protokoll:** Jeder Lauf des [[runbook-zahlungslauf]] protokolliert Operator-ID, Zeitstempel und Checksummen für **12 Monate** revisionssicher.

Verknüpft mit: [[rfp-kernbank-2026]], [[team-rollen-raci]].
