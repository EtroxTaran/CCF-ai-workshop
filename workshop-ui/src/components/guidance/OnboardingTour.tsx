import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkshopStepId } from "@/types/workshop";

export const ONBOARDING_STORAGE_KEY = "v7-ccf-tour-seen-v1";

export interface OnboardingTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectStep?: (step: WorkshopStepId) => void;
}

const TOUR_STATIONS: {
  selector: string;
  title: string;
  body: string;
  stepHint?: WorkshopStepId;
}[] = [
  {
    selector: '[data-tour="tool-mode"]',
    title: "1 · Werkzeug-Hilfe wählen",
    body: "Schalte oben jederzeit zwischen Web-Chat, Desktop & Ordner und Code-Agent um — alle Anleitungen und Kopierpakete passen sich sofort an.",
    stepHint: "start",
  },
  {
    selector: '[data-tour="step-nav"]',
    title: "2 · 2-Phasen-Aufbau (4 Schritte)",
    body: "Schritte 01–03 bilden den gemeinsamen 15-Minuten-Aha-Kern. Danach wählst du in Schritt 04 deinen 30-Minuten-Praxis-Pfad.",
  },
  {
    selector: '[data-tour="checklist-trigger"]',
    title: "3 · Fortschritt & Checkliste",
    body: "Hier siehst du deinen Stand, hakst Erkenntnisse ab und springst mit einem Klick direkt zu jedem Schritt.",
  },
  {
    selector: '[data-tour="beamer-link"]',
    title: "4 · Trainer-Bühne (#/beamer)",
    body: "Über dieses Symbol erreichst du jederzeit die statische Tageslicht-Projektionsansicht mit Countdown, Demo und Wissens-Graph.",
  },
];

export function OnboardingTour({ open, onOpenChange, onSelectStep }: OnboardingTourProps) {
  const prefersReduced = useReducedMotion();
  const [idx, setIdx] = useState<number>(0);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const station = TOUR_STATIONS[idx] || TOUR_STATIONS[0];

  function dismiss() {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    onOpenChange(false);
    setIdx(0);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function measure() {
      const el = document.querySelector(station.selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: "nearest", behavior: prefersReduced ? "auto" : "smooth" });
      setRect({ top: r.top - 4, left: r.left - 4, width: r.width + 8, height: r.height + 8 });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, idx, station.selector, prefersReduced]);

  if (!open) return null;

  const isLast = idx >= TOUR_STATIONS.length - 1;
  const cardTop = rect
    ? Math.min(window.innerHeight - 230, Math.max(16, rect.top + rect.height + 12))
    : undefined;
  const cardLeft = rect
    ? Math.min(window.innerWidth - 340, Math.max(16, rect.left))
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Kurze Orientierungstour"
    >
      {/* Backdrop or Spotlight Ring */}
      {rect ? (
        <div
          onClick={dismiss}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(11, 15, 10, 0.68)",
          }}
          className="fixed rounded-xl border-2 border-[#A9C23F] transition-all duration-200"
        />
      ) : (
        <div onClick={dismiss} className="fixed inset-0 bg-[#0B0F0A]/70 backdrop-blur-[1px]" />
      )}

      {/* Clamped Tooltip Card */}
      <div
        style={
          rect && cardTop !== undefined && cardLeft !== undefined
            ? { top: cardTop, left: cardLeft }
            : undefined
        }
        className={
          rect
            ? "fixed z-50 w-[min(328px,calc(100vw-2rem))] rounded-2xl border border-[#A9C23F]/60 bg-card p-4 text-card-foreground shadow-2xl"
            : "fixed left-1/2 top-1/2 z-50 w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#A9C23F]/60 bg-card p-4 text-card-foreground shadow-2xl"
        }
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-brand-ink">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>
              Orientierung · {idx + 1} / {TOUR_STATIONS.length}
            </span>
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Tour schließen"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="font-display text-sm font-bold text-foreground">{station.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{station.body}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {TOUR_STATIONS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-4 bg-[#A9C23F]" : "w-1.5 bg-muted-foreground/35"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {idx > 0 ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setIdx((i) => i - 1)}>
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Zurück</span>
              </Button>
            ) : (
              <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
                Überspringen
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (isLast) {
                  dismiss();
                } else {
                  const nextStation = TOUR_STATIONS[idx + 1];
                  if (nextStation?.stepHint) onSelectStep?.(nextStation.stepHint);
                  setIdx((i) => i + 1);
                }
              }}
            >
              <span>{isLast ? "Verstanden" : "Weiter"}</span>
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
