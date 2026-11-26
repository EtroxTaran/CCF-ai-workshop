import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  if (!entry) return <span className={className}>{label || id}</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-baseline gap-0.5 rounded px-0.5 text-left underline decoration-dotted decoration-brand-lime underline-offset-4 hover:text-brand-ink focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
        >
          <span>{label || entry.term}</span>
          <Info className="inline h-3 w-3 shrink-0 self-center text-brand-ink/80" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1.5">
        <div className="font-display text-xs font-bold text-foreground">{entry.term}</div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{entry.short}</p>
        <p className="rounded bg-muted/70 px-2 py-1 text-[10px] leading-snug text-foreground">
          <strong>Beispiel:</strong> {entry.everydayExample}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
