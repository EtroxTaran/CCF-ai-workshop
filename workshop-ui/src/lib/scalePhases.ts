import type { WorkshopPhase } from "../types/workshop";

/**
 * Allocates `targetTotal` integer minutes across items proportionally to `durations`
 * using Hamilton largest-remainder allocation with a floor of `minPerItem`
 * (clamped if `durations.length * minPerItem > targetTotal`), guaranteeing `sum(result) === targetTotal`.
 */
export function scaleDurationsExact(
  durations: number[],
  targetTotal: number,
  minPerItem = 2
): number[] {
  const n = durations.length;
  if (n === 0) return [];

  const safeTarget = Math.max(0, Math.round(targetTotal));
  const safeMin = Math.max(0, Math.round(minPerItem));
  const floorMin = n * safeMin > safeTarget ? Math.floor(safeTarget / n) : safeMin;

  const remTarget = safeTarget - n * floorMin;
  if (remTarget <= 0) {
    return Array<number>(n).fill(floorMin);
  }

  const sanitized = durations.map((d) => (Number.isFinite(d) && d > 0 ? d : 0));
  const baseSum = sanitized.reduce((acc, d) => acc + d, 0);
  const exact = sanitized.map((d) =>
    baseSum > 0 ? (d / baseSum) * safeTarget : safeTarget / n
  );

  const weights = exact.map((e) => Math.max(0, e - floorMin));
  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const shares = weights.map((w) =>
    weightSum > 0 ? (w / weightSum) * remTarget : remTarget / n
  );

  const floors = shares.map((s) => Math.floor(s));
  const allocated = floors.reduce((acc, f) => acc + f, 0);
  const remaining = remTarget - allocated;

  const order = shares
    .map((s, idx) => ({ idx, rem: s - floors[idx] }))
    .sort((a, b) => (b.rem !== a.rem ? b.rem - a.rem : a.idx - b.idx));

  const result = floors.map((f) => floorMin + f);
  for (let k = 0; k < remaining; k++) {
    result[order[k % n].idx] += 1;
  }
  return result;
}

const WALL_CLOCK_RE = /^\d{1,2}:\d{2}[–-]\d{1,2}:\d{2}$/;
const INLINE_MIN_SUFFIX_RE = /\s*·\s*\d+\s*Min\.?/g;

/**
 * Scales `phases` durations cleanly to `targetTotal` and keeps `timeRange` consistent:
 * - Wall-clock ranges (`11:00–11:10`) stay unchanged when `targetTotal === baseTotal`,
 *   otherwise become cumulative `Min. ${start}–${end}`.
 * - Label ranges with inline `· X Min.` (e.g. `"Start · 5 Min."`) strip the stale duration suffix.
 */
export function scalePhasesExact(phases: WorkshopPhase[], targetTotal: number): WorkshopPhase[] {
  if (phases.length === 0) return [];

  const baseTotal = phases.reduce((sum, p) => sum + p.durationMin, 0);
  const scaledDurations = scaleDurationsExact(
    phases.map((p) => p.durationMin),
    targetTotal
  );

  let elapsed = 0;
  return phases.map((phase, idx) => {
    const durationMin = scaledDurations[idx];
    const start = elapsed;
    const end = elapsed + durationMin;
    elapsed = end;

    let timeRange = phase.timeRange;
    if (WALL_CLOCK_RE.test(phase.timeRange.trim())) {
      timeRange = targetTotal === baseTotal ? phase.timeRange : `Min. ${start}–${end}`;
    } else if (/·\s*\d+\s*Min\.?/.test(phase.timeRange)) {
      timeRange = phase.timeRange.replace(INLINE_MIN_SUFFIX_RE, "").trim();
    }

    return {
      ...phase,
      durationMin,
      timeRange,
    };
  });
}
