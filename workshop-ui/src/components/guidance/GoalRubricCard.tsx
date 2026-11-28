import { useId } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { GoalRubricItem } from "@/types/workshop";

export interface GoalRubricCardProps {
  goalTitle: string;
  rubric: GoalRubricItem[];
  checkedIds: Record<string, boolean>;
  onToggleItem: (id: string) => void;
}

export function GoalRubricCard({
  goalTitle,
  rubric,
  checkedIds,
  onToggleItem,
}: GoalRubricCardProps) {
  const headingId = useId();
  const doneCount = rubric.filter((r) => checkedIds[r.id]).length;
  const requiredDone = rubric.filter((r) => r.required).every((r) => checkedIds[r.id]);

  return (
    <section
      data-testid="goal-rubric"
      aria-labelledby={headingId}
      className="rounded-2xl border bg-card p-5 space-y-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-ink">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Definition of Done · Abnahme-Rubrik</span>
          </div>
          <h3 id={headingId} className="font-display text-base font-bold text-foreground sm:text-lg">
            Wann ist dein Ergebnis für „{goalTitle}“ wirklich fertig?
          </h3>
        </div>
        <Badge
          aria-live="polite"
          variant={requiredDone ? "success" : "outline"}
          className="text-xs"
        >
          {doneCount}/{rubric.length} abgehakt
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rubric.map((item) => {
          const isChecked = Boolean(checkedIds[item.id]);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-xs transition-colors ${
                isChecked
                  ? "border-emerald-500/45 bg-emerald-500/5"
                  : "bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleItem(item.id)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <div className="font-semibold text-foreground">
                  {item.criterion}
                  {item.required && (
                    <span className="ml-1.5 text-[10px] font-mono text-brand-ink">
                      (Pflicht)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Prüfhinweis: {item.howToCheck}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
