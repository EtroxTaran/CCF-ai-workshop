// Pure Web Audio API stage sound cues for #/beamer (Trainer-Bühne) only.
// Strictly muted by default, zero external audio assets, zero speechSynthesis.

let muted = true;
let audioCtx: AudioContext | null = null;

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as AudioWindow;
  return win.AudioContext || win.webkitAudioContext || null;
}

export function isSoundMuted(): boolean {
  return muted;
}

export function unlockAudioContext(): AudioContext | null {
  try {
    const Ctor = getAudioContextConstructor();
    if (!Ctor) return null;
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => undefined);
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function setSoundMuted(nextMuted: boolean): boolean {
  muted = Boolean(nextMuted);
  if (!muted) {
    unlockAudioContext();
  }
  return muted;
}

export function toggleSoundMuted(): boolean {
  return setSoundMuted(!muted);
}

/**
 * Subtle two-tone 01:00 warning chime (880 Hz -> 659.25 Hz).
 * Silent no-op returning false when muted or AudioContext is unavailable.
 */
export function playOneMinuteChime(): boolean {
  if (muted) return false;
  try {
    const ctx = unlockAudioContext();
    if (!ctx) return false;
    const now = ctx.currentTime;

    const notes = [
      { freq: 880, offset: 0, duration: 0.22 },
      { freq: 659.25, offset: 0.16, duration: 0.45 },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + note.offset;
      const end = start + note.duration;

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // ignore cleanup errors
        }
      };

      osc.start(start);
      osc.stop(end + 0.02);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Warm resonant 00:00 stage gong (196 Hz + 293.66 Hz + 392 Hz harmonics).
 * Silent no-op returning false when muted or AudioContext is unavailable.
 */
export function playStageGong(): boolean {
  if (muted) return false;
  try {
    const ctx = unlockAudioContext();
    if (!ctx) return false;
    const now = ctx.currentTime;

    const partials: { freq: number; type: OscillatorType; peak: number; dur: number }[] = [
      { freq: 196, type: "sine", peak: 0.14, dur: 1.6 },
      { freq: 293.66, type: "triangle", peak: 0.055, dur: 1.25 },
      { freq: 392, type: "sine", peak: 0.035, dur: 0.95 },
    ];

    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const end = now + partial.dur;

      osc.type = partial.type;
      osc.frequency.setValueAtTime(partial.freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(partial.peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // ignore cleanup errors
        }
      };

      osc.start(now);
      osc.stop(end + 0.02);
    }
    return true;
  } catch {
    return false;
  }
}
