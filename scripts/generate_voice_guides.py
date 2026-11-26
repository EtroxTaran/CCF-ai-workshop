#!/usr/bin/env python3
"""Generate concise German ElevenLabs voice-guide MP3s into workshop-ui/public/audio/.

Requires a valid ElevenLabs secret API key (`ELEVENLABS_API_KEY=sk_...`, NOT an API key ID).
No synthetic/robotic fallback TTS is used.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "workshop-ui" / "public" / "audio"
DEFAULT_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")  # Sarah (multilingual v2)
DEFAULT_MODEL_ID = "eleven_multilingual_v2"

SCRIPTS: dict[str, str] = {
    "what-is-markdown": (
        "Kurz erklärt: Punkt M D steht für Markdown. Das ist einfach eine ganz normale, leicht lesbare "
        "Textdatei mit Überschriften. Du musst sie am PC gar nicht selbst öffnen. Lade sie entweder über das "
        "Plus- oder Büroklammer-Symbol direkt in Claude oder ChatGPT hoch — oder klicke einfach auf unseren "
        "Button Paket kopieren, dann ist alles fertig in deiner Zwischenablage."
    ),
    "step-01": (
        "Willkommen bei Schritt eins! Öffne am besten in einem zweiten Browser-Tab ChatGPT oder Claude. "
        "Hier wählst du oben aus, ob du im Browser arbeitest, einen Ordner am Computer öffnest oder ein "
        "Programmier-Werkzeug im Terminal nutzt. Du kannst diesen Filter jederzeit ohne Datenverlust umschalten."
    ),
    "step-02": (
        "In Schritt zwei vergleichen wir zwei Arten zu fragen. Oben drückst du einmal auf Kompakt-Paket "
        "kopieren und fügst alles direkt in einen neuen Chat ein. Sieh selbst, wie eine klare Struktur wie "
        "CO-STAR sofort saubere Listen mit Dateiquellen erzeugt — statt nur vagem Fließtext."
    ),
    "step-03": (
        "Jetzt kommt das Herzstück in Schritt drei: Warum erfindet eine KI manchmal Dinge, und wie stoppen "
        "wir sie? Schalte nacheinander durch Stufe eins, zwei und drei und stelle jeweils zuerst die Fangfrage "
        "nach dem Schneeleoparden. In Stufe eins rät die KI oft mit. Ab Stufe zwei lehnt sie ehrlich ab, weil "
        "sie feste Hausregeln hat."
    ),
    "step-04": (
        "Schritt vier ist deine freie Praxis-Phase! Suche dir genau einen Pfad aus: Fakten prüfen in der "
        "Wissensbasis, eine schicke Übersichtsseite bauen oder eine kleine interaktive Web-App erzeugen. Alle "
        "nötigen Wikipedia-Texte werden jetzt automatisch mitkopiert oder als Markdown-Datei heruntergeladen."
    ),
}


def synthesize_clip(api_key: str, voice_id: str, text: str, out_path: Path) -> None:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = json.dumps(
        {
            "text": text,
            "model_id": DEFAULT_MODEL_ID,
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.78,
                "style": 0.15,
                "use_speaker_boost": True,
            },
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        out_path.write_bytes(resp.read())


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate German ElevenLabs audio guides.")
    parser.add_argument("--voice-id", default=DEFAULT_VOICE_ID, help="ElevenLabs Voice ID")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing MP3 files")
    args = parser.parse_args()

    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip().strip('"').strip("'")
    if not api_key:
        print("FEHLER: ELEVENLABS_API_KEY ist nicht gesetzt.", file=sys.stderr)
        return 1
    if not api_key.startswith("sk_"):
        print(
            "FEHLER: ELEVENLABS_API_KEY beginnt nicht mit 'sk_'. "
            "Hinweis: In ElevenLabs muss der geheime API-Schlüssel (sk_...) verwendet werden, nicht die Key-ID.",
            file=sys.stderr,
        )
        return 1

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    for clip_id, script in SCRIPTS.items():
        target = AUDIO_DIR / f"{clip_id}.mp3"
        if target.exists() and not args.overwrite:
            print(f"[SKIP] {target.relative_to(ROOT)} existiert bereits (--overwrite zum Neu-Erzeugen).")
            continue
        try:
            synthesize_clip(api_key, args.voice_id, script, target)
            print(f"[OK] Erzeugt: {target.relative_to(ROOT)} ({target.stat().st_size} Bytes)")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            print(f"[FAIL] {clip_id}: HTTP {exc.code} — {detail[:300]}", file=sys.stderr)
            return 1

    print("Alle Voice-Guide-Clips erfolgreich erzeugt. Danach 'npm run build' in workshop-ui ausführen.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
