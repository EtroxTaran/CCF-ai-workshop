# Trainer-Leitfaden & Musterlösungen (`LOESUNGEN_TRAINER.md`)

> Dieses Dokument enthält **kompakte Musterlösungen & Fakten-Checks** für beide Live-Module (**L1: Tierwelt** und **L2: Kernbank 2026**). Die komplette Minuten-für-Minuten-Moderation, Vorflug-Checkliste, Pannen-Playbook und Tool-Troubleshooting findest du im ausführlichen [PRESENTER_RUNBOOK.md](PRESENTER_RUNBOOK.md).

- **Workshop-App:** https://etroxtaran.github.io/CCF-ai-workshop/
- **Workshop-Hub:** https://etroxtaran.github.io/CCF-ai-workshop/#/hub
- **Trainer-Bühne:** https://etroxtaran.github.io/CCF-ai-workshop/#/beamer
- **Repository-Branch:** `main` · **Moderation:** `virtual7 CCF Team`

---

## 1. Musterlösungen L1 (`prompt-werkstatt-tierwelt`, 68 öffentliche Artikel)

### Fangfrage & Widersprüche (Stufe 1 vs. Stufe 2 / Stufe 3)
> **Fakten- & Fangfragen-Set:**
> - **Belegt:** *„Der Eisbär hat unter seinem Fell schwarze Haut und besitzt 42 Zähne.“* (`eisbaer.md`)
> - **Widerspruch 1 (Zahlen):** *„Der Eisbär hat 38 Zähne.“* (`status: widerspruch` — `eisbaer.md` belegt **42 Zähne**)
> - **Widerspruch 2 (Negation):** *„Der Eisbär produziert im Fettgewebe Squalen.“* (`status: widerspruch` — `eisbaer.md` belegt ausdrücklich das *Fehlen von Squalen*)
> - **Fangfrage (`nicht_belegt`):** *„Im Schweizerischen Nationalpark leben 45 Schneeleoparden und das Ticket kostet 25 Euro.“* (0 Treffer im Korpus)

**Erwartete saubere Antwort (Stufe 2 / 3 & Ergebnis-Validator):**
1. **Schwarze Haut, Fell & 42 Zähne:** Laut `eisbaer.md` besitzt der Eisbär unter seinem Fell schwarze Haut (bei Babys rosa), eine **5–10 cm** dicke Fettschicht, hohle und transparente Außenhaare sowie **42 Zähne**. Eine Behauptung *„Der Eisbär hat 38 Zähne“* erzeugt im Validator **`status: widerspruch`**.
2. **Squalen:** Laut `eisbaer.md` weist Eisbärtalg ausdrücklich das **Fehlen von Squalen** auf — eine Bejahung von Squalen im Fettgewebe erzeugt **`status: widerspruch`**.
3. **Korallenbleiche & Riffschutz:** Laut `korallenbleiche.md` absorbieren Riffe **70 bis 90 %** Wellenenergie; bei Wärmestress (z. B. **29 °C**) werden Zooxanthellen abgestoßen und Korallen sterben ohne Rückkehr binnen etwa **acht Wochen** ab.
4. **Schneeleopard / Schweizerischer Nationalpark:** Keine Angabe zu 45 Schneeleoparden oder Ticketpreisen im Korpus — die KI muss zwingend **`[Nicht in Quelle]`** ausgeben.
5. **Richtiges Verhalten in Stufe 2 & 3:** Die KI nennt exakte Dateinamen bzw. `[[Wikilinks]]` (`[[eisbaer]]`, `[[korallenbleiche]]`, `[[alpensteinbock]]`), widerspricht den falschen Zahlen/Negationen offen und erfindet nichts.

### Typischer Vergleich Stufe 1 → Stufe 3
- **`stufe-1-chaos/`:** Ohne Guardrails rät ein Modell bei der Fangfrage häufig Zahlen aus allgemeinem Vorwissen oder bestätigt Squalen ungeprüft aus Trainingswissen.
- **`stufe-2-skills-guardrails/`:** Durch `AGENTS.md` + Skill `fakten-pruefer` lehnt das Modell falsche Prämissen ab und belegt mit `docs/*.md` (und übernimmt beim Test-Mutieren `42 Zähne` → `38 Zähne` treu den lokalen Text).
- **`stufe-3-obsidian-vault/`:** Steigt über `_index.md` ein, springt gezielt über `[[Wikilinks]]` (`wiki/tierarten/eisbaer.md`, `wiki/konzepte/korallenbleiche.md`, `wiki/tierarten/alpensteinbock.md`) und liefert die kürzeste, token-sparsamste und präziseste Antwort (optional direkt über MCP `workshop-wildlife` mit `search_vault`, `verify_claim`, `read_article`, `list_modules` bzw. L1-Aliase).

---

## 2. Musterlösungen L2 (`context-engineering-projekt`, 10 synthetische Dokumente)

> Alle Dokumente in `modules/context-engineering-projekt/corpus/` sind **100 % fiktive Beispieldaten** rund um *Kernbank 2026*.

### Fangfragen & Widerspruchs-Checks (Live-Demo Q1–Q4 auf `#/beamer`)
1. **Positiv-Fakt (`runbook-zahlungslauf.md`, `sla-betriebsmodell.md`, `team-rollen-raci.md`):**
   - *„Der nächtliche SEPA-Zahlungslauf startet um 22:00 Uhr und eskaliert bei über 30 Minuten Störung an Incident-Lead K. Lindner (4h RTO, 15m RPO; erster Runbook-Schritt: `replay_outbox --dry-run`).“* → **`status: belegt`**.
2. **Widerspruch RTO (`sla-betriebsmodell.md`):**
   - Im Korpus ist als SLA **4 Stunden RTO** (und **15 Minuten RPO**) belegt (`sla-betriebsmodell.md`).
   - Behauptung *„Die vereinbarte RTO für den SEPA-Zahlungslauf beträgt 2 Stunden.“* → **`status: widerspruch`**.
   - *(Hinweis Trainer-Bühne: In `#/beamer` zeigt Q4 in L2 testweise „2 Stunden“ vs. „4 Stunden“ über `Space`/`N`.)*
3. **Fangfrage (`nicht_belegt`):**
   - *„Für das Modul Krypto-Wallet gilt eine Vertragsstrafe von 50.000 Euro beim externen Cloud-Anbieter.“* → 0 Treffer, muss mit `[Nicht in Quelle]` abgelehnt werden.

---

## 3. Bewertungsschlüssel für die Ergebnis-Validierung (Schritt 04)

| Kriterium | Ziel-Mindestwert im Workshop | Tool in der App |
|---|---|---|
| **Belegte Quellen** | Mindestens 2 konkrete Dateinamen / `[[Wikilinks]]` bei Sachaussagen | `Ergebnis-Validator` |
| **Nicht-Wissen-Markierung** | Bei Fangfragen mind. 1 expliziter Hinweis auf fehlende Belege oder Widerspruch | `Ergebnis-Validator` |
| **Widerspruchserkennung** | `0` unmarkierte Zahlen-/Negations-Widersprüche gegen Korpus | `Ergebnis-Validator` |
| **4-Säulen-Regelwerk** | Alle 4 Säulen (`Rolle & Scope`, `Quellen`, `Nicht-Wissen`, `Format`) erfüllt (Score ≥ 75 %) | `Regelwerk-Werkstatt` |
| **Take-away Export** | Mindestens 1 Export (`.md` oder `.json`) für die eigene Teamarbeit nach dem Clustertag | `Workshop-Ergebnis Export` |

---

## 4. Kurze Notfall-Checkliste im Raum

- **Online klemmt / Firewall:** Sofort lokal starten: `start-workshop.bat` / `./start-workshop.sh` (`http://127.0.0.1:3777/`) oder Bühnen-Backup `presentation/CCF_HandsOn_Prompt_Werkstatt.pptx`.
- **Teilnehmende ohne eigenes KI-Abo:** Auf Schritt 01 (`Web-Chat` oder `Code-Agent`) verweisen — z. B. kostenlose Browser-Chats (ChatGPT Free, Claude Free, Google Gemini, M365 Copilot), unseren eingebauten In-Browser-Faktenprüfer, OpenCode + OpenRouter Free-Tier oder gemeinsame Gruppenarbeit am Laptop.
- **Beamer unleserlich:** Taste `T` schaltet sofort zwischen Tageslicht-Hell (Standard) und Dunkel-Kontrast um; `P` blendet Speaker Notes ein; `?` zeigt alle Shortcuts.
- **Stufen-Isolation klemmt in IDE/CLI:** Siehe [docs/ISOLATION_GUIDE.md](docs/ISOLATION_GUIDE.md) (`Scope-Override`, separates Workspace-Fenster, 1-Zeilen-Rezept für Stufe 1).
