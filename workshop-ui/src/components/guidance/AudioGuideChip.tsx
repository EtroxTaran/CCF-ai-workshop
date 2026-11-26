import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Pause, Play, Volume2 } from "lucide-react";
import type { AudioGuideScriptSpec } from "@/types/workshop";

const AVAILABLE_AUDIO = new Set(
  typeof __AUDIO_GUIDE_FILES__ !== "undefined" ? __AUDIO_GUIDE_FILES__ : []
);

export type AudioGuideId = "step-01" | "step-02" | "step-03" | "step-04" | "what-is-markdown";

const AUDIO_SCRIPTS: Record<AudioGuideId, AudioGuideScriptSpec> = {
  "what-is-markdown": {
    title: "Was ist eigentlich eine .md-Datei?",
    durationLabel: "0:22",
    transcript:
      "„.md“ steht für Markdown — eine ganz normale, schlichte Textdatei (wie .txt) mit einfachen #-Überschriften. Du musst sie am PC gar nicht öffnen: Lade sie entweder über „+“ oder die Büroklammer (📎) direkt in Claude oder ChatGPT hoch — oder klicke auf unseren Button „Kompakt-Paket kopieren“, dann liegt schon alles fertig in deiner Zwischenablage.",
  },
  "step-01": {
    title: "Einstieg in 20 Sekunden erklärt",
    durationLabel: "0:20",
    transcript:
      "Öffne am besten jetzt schon einen zweiten Browser-Tab mit ChatGPT oder Claude. Hier oben wählst du nur aus, ob du im Browser arbeitest (Web-Chat), einen entpackten Ordner öffnest oder im Terminal entwickelst — umschalten geht jederzeit ohne Verlust.",
  },
  "step-02": {
    title: "Prompt-Methoden in 20 Sekunden erklärt",
    durationLabel: "0:20",
    transcript:
      "Klicke zuerst auf „Kompakt-Paket kopieren“ — unsere App packt deine Frage automatisch ganz nach oben und die passenden Quelltexte direkt darunter. Vergleiche in deinem Chat, wie viel sauberer eine klare Struktur (CO-STAR) gegenüber einem einzelnen Satz antwortet.",
  },
  "step-03": {
    title: "Das 3-Stufen-Experiment in 25 Sekunden",
    durationLabel: "0:25",
    transcript:
      "Schalte nacheinander durch Stufe 1, 2 und 3 und starte pro Stufe immer einen frischen Chat. Stelle zuerst die Fangfrage: Ohne Regeln (Stufe 1) rät die KI oft Zahlen dazu. Ab Stufe 2 greifen feste Hausregeln — sie lehnt ehrlich ab.",
  },
  "step-04": {
    title: "Praxis-Pfade & Transfer in 20 Sekunden",
    durationLabel: "0:20",
    transcript:
      "Wähle genau einen Praxis-Pfad nach Lust und Rolle: Fakten prüfen, eine schicke Übersichtsseite bauen oder eine kleine interaktive Web-App erzeugen. Jeder Web-Chat-Prompt kopiert hier automatisch alle passenden Quelltexte mit — und ganz unten findest du Vorlagen für deinen Arbeitsalltag.",
  },
};

export function AudioGuideChip({
  clipId,
  audioGuides,
  className = "",
}: {
  clipId: AudioGuideId;
  audioGuides?: Record<string, AudioGuideScriptSpec>;
  className?: string;
}) {
  const filename = `${clipId}.mp3`;
  const hasAudioFile = AVAILABLE_AUDIO.has(filename);
  const spec = audioGuides?.[clipId] || AUDIO_SCRIPTS[clipId];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState<1 | 1.25>(1);
  const [openTranscript, setOpenTranscript] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function toggleAudio() {
    if (!hasAudioFile) {
      setOpenTranscript((v) => !v);
      return;
    }
    if (!audioRef.current) {
      const el = new Audio(`./audio/${filename}`);
      el.playbackRate = rate;
      el.addEventListener("ended", () => setPlaying(false));
      el.addEventListener("pause", () => setPlaying(false));
      el.addEventListener("play", () => setPlaying(true));
      audioRef.current = el;
    }
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setPlaying(false);
        setOpenTranscript(true);
      });
    }
  }

  return (
    <div className={`rounded-xl border bg-muted/35 px-3 py-2 text-xs ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleAudio}
          className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-brand-ink"
        >
          {hasAudioFile ? (
            playing ? (
              <Pause className="h-3.5 w-3.5 text-brand-ink" />
            ) : (
              <Play className="h-3.5 w-3.5 text-brand-ink" />
            )
          ) : (
            <FileText className="h-3.5 w-3.5 text-brand-ink" />
          )}
          <span>{spec.title}</span>
          {hasAudioFile && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-brand-ink">
              <Volume2 className="h-3 w-3" />
              {spec.durationLabel}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {hasAudioFile && (
            <button
              type="button"
              onClick={() => setRate((r) => (r === 1 ? 1.25 : 1))}
              className="rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground"
              title="Wiedergabegeschwindigkeit"
            >
              {rate}×
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpenTranscript((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-ink hover:underline"
          >
            <span>{openTranscript ? "Text ausblenden" : "Kurztext lesen"}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${openTranscript ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {openTranscript && (
        <p className="mt-2 border-t pt-2 leading-relaxed text-muted-foreground">{spec.transcript}</p>
      )}
    </div>
  );
}
