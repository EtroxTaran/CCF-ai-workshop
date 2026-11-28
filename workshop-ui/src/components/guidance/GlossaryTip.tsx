import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { GLOSSARY_BY_ID } from "@/data/glossary";

export function GlossaryTip({
  id,
  label,
  className = "",
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  const entry = GLOSSARY_BY_ID[id];
  const popoverId = useId();
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLSpanElement | null>(null);

  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;

  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 12,
    left: 12,
    width: 288,
  });

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl || typeof window === "undefined") return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const width = Math.min(288, Math.max(200, vw - margin * 2));
    const rect = triggerEl.getBoundingClientRect();

    const centeredLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.max(margin, Math.min(centeredLeft, vw - width - margin));

    const popHeight = popoverRef.current?.offsetHeight || 148;
    const fitsAbove = rect.top - popHeight - 8 >= margin;
    const top = fitsAbove
      ? rect.top - popHeight - 8
      : Math.max(margin, Math.min(rect.bottom + 8, vh - popHeight - margin));

    setPos({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPinned(false);
        setHovered(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPinned(false);
        setHovered(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  if (!entry) return <span className={className}>{label || id}</span>;

  function handleToggleClick() {
    if (pinned) {
      setPinned(false);
      setHovered(false);
    } else {
      setPinned(true);
    }
  }

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setHovered(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={handleToggleClick}
        className={`inline-flex items-baseline gap-0.5 rounded px-0.5 text-left underline decoration-dotted decoration-brand-lime underline-offset-4 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        <span>{label || entry.term}</span>
        <Info className="inline h-3 w-3 shrink-0 self-center text-brand-ink/80" aria-hidden="true" />
      </button>

      {open && (
        <span
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={entry.term}
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          className="fixed z-50 block space-y-1.5 rounded-xl border bg-popover p-3 text-left text-popover-foreground shadow-lg"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="font-display text-xs font-bold text-foreground">{entry.term}</span>
            <button
              type="button"
              onClick={() => {
                setPinned(false);
                setHovered(false);
                triggerRef.current?.focus();
              }}
              aria-label="Begriffserklärung schließen"
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
          <span className="block text-[11px] leading-relaxed text-muted-foreground">
            {entry.short}
          </span>
          <span className="block rounded bg-muted/70 px-2 py-1 text-[10px] leading-snug text-foreground">
            <strong>Beispiel:</strong> {entry.everydayExample}
          </span>
        </span>
      )}
    </span>
  );
}
