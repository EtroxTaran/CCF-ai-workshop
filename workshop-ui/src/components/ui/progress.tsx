import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, "aria-label": ariaLabel = "Fortschritt", ...props }, ref) => {
  const safeValue = Math.min(
    100,
    Math.max(0, typeof value === "number" && Number.isFinite(value) ? value : 0)
  );
  const maxVal = props.max ?? 100;
  const pct = maxVal > 0 ? Math.min(100, (safeValue / maxVal) * 100) : 0;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      aria-label={ariaLabel}
      className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
      value={safeValue}
      max={maxVal}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all duration-300"
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
