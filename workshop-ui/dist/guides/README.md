# Optionale Drop-In-Screenshots für `ToolHotspotGuide`

Die **Workshop-App** rendert für alle drei Modi der **Werkzeug-Hilfe** (`Web-Chat`, `Desktop & Ordner`, `Code-Agent`) standardmäßig gestochen scharfe SVG-/HTML-Tool-Mockups mit anklickbaren `1 → 2 → 3`-Hotspots — **ohne** eine einzige `404`-Anfrage auszulösen.

Wenn Sie echte Tool-Screenshots einbinden möchten, legen Sie die folgenden `.webp`-Dateien in diesem Ordner ab und bauen Sie `workshop-ui` anschließend neu (`npm run build`):

| Modus (`Werkzeug-Hilfe`) | Dateiname in `workshop-ui/public/guides/` | Empfohlenes Format |
| --- | --- | --- |
| **Web-Chat** | `web-chat.webp` | `16:9`, z. B. `1280×720` px |
| **Desktop & Ordner** | `desktop-folder.webp` | `16:9`, z. B. `1280×720` px |
| **Code-Agent** | `code-agent.webp` | `16:9`, z. B. `1280×720` px |

## Funktionsweise (Zero-404-Garantie)

- Beim Build- bzw. Dev-Start scannt `workshop-ui/vite.config.ts` dieses Verzeichnis nach `*.webp` und stellt die Liste über `__GUIDE_WEBP_FILES__` bereit.
- `ToolHotspotGuide.tsx` rendert `<img src="./guides/<name>.webp" />` **nur dann**, wenn die Datei tatsächlich existiert — andernfalls bleibt der SVG-/HTML-Mockup-Modus aktiv.

## Compliance-Hinweis

Bitte verwenden Sie ausschließlich Screenshots mit öffentlichen Workshop-Beispielen (Tierwelt-Artikel) — **keine** internen Kundendaten, vertraulichen Chats oder API-Keys.
