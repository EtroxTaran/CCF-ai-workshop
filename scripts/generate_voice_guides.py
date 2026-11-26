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
DEFAULT_SCRIPTS_FILE = ROOT / "modules" / "prompt-werkstatt-tierwelt" / "audio-scripts.json"


def load_scripts(scripts_path: Path) -> dict[str, str]:
    raw = json.loads(scripts_path.read_text(encoding="utf-8"))
    out: dict[str, str] = {}
    for clip_id, entry in raw.items():
        if isinstance(entry, dict):
            text = str(entry.get("tts") or entry.get("transcript") or "").strip()
        else:
            text = str(entry).strip()
        if text:
            out[clip_id] = text
    return out


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
    parser.add_argument(
        "--scripts",
        default=str(DEFAULT_SCRIPTS_FILE),
        help="Path to module audio-scripts.json (single source of truth)",
    )
    parser.add_argument(
        "--out-dir",
        default=str(AUDIO_DIR),
        help="Output directory for generated .mp3 files",
    )
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

    scripts_map = load_scripts(Path(args.scripts))
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    for clip_id, script in scripts_map.items():
        target = out_dir / f"{clip_id}.mp3"
        if target.exists() and not args.overwrite:
            print(f"[SKIP] {target} existiert bereits (--overwrite zum Neu-Erzeugen).")
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
