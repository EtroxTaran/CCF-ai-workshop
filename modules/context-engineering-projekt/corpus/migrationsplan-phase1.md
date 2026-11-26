---
title: Migrationsplan Phase 1 (Dual-Write & Cutover)
category: runbook
group: Planung & Scope
tags: [migration, cutover, dual-write, rollback]
---

# Migrationsplan Phase 1 (Go-Live 15. Oktober 2026)

Sicherer Übergang vom Alt- auf das Neusystem ohne Betriebsunterbrechung:

1. **Tag -21:** Abnahme synthetischer Testdaten durch [[team-rollen-raci]] gemäß [[datenschutz-leitlinie]].
2. **Tag -14:** Start der **14-tägigen Dual-Write-Phase** (Parallelvergleich aller Buchungen, Risiko **R-01** im [[risikoregister-q3]]).
3. **Tag 0 (15. Oktober 2026):** Produktiver Cutover nach erfolgreichem Dry-Run des [[runbook-zahlungslauf]] und Einhaltung aller Ziele in [[sla-betriebsmodell]].
4. **Rollback-Fenster:** Bis **04:00 Uhr** morgens vollständiger Rückschwenk möglich.

Begriffe siehe [[glossar-fachbegriffe]], Gesamtrahmen [[rfp-kernbank-2026]].
