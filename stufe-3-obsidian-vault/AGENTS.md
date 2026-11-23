# Projekt-Anweisung: Obsidian-Vault (Markdown-RAG)

## Architektur (3 Zonen)
- `raw/`: Unveränderte Quelldateien (nur lesend, nie ändern).
- `wiki/`: Kuratierte, verlinkte Wissensartikel mit YAML-Frontmatter, Tags und `[[Wikilinks]]`.
- `_index.md`: Zentrale Map of Content (MOC) als Einstiegspunkt.

## Verbindlicher Such-Workflow
1. **Immer zuerst `_index.md` lesen**, um die relevanten Themenbereiche und Dateien zu identifizieren (nicht blind alle Dateien durchsuchen).
2. Folge gezielt den `[[Wikilinks]]` und YAML-Frontmatter-Feldern (`habitat`, `category`, `tags`) in `wiki/`.
3. Ziehe `raw/` nur heran, wenn Detailinformationen in `wiki/` fehlen oder geprüft werden müssen.

## Verbindliche Guardrails
- Antworte ausschließlich auf Basis von `wiki/` und `raw/`.
- Zitiere immer die exakten Artikel-Links (`[[Artikelname]]`) bzw. Dateipfade.
- Wenn eine Information fehlt, sage es offen – erfinde nichts.
- Markiere mögliche Widersprüche zwischen Dateien explizit.
