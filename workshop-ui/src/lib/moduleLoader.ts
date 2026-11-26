import type {
  CorpusSearchIndex,
  ModuleCatalog,
  WorkshopDataset,
} from "@/types/workshop";

const catalogCache: { current: ModuleCatalog | null } = { current: null };
const dataCache = new Map<string, WorkshopDataset>();
const indexCache = new Map<string, CorpusSearchIndex>();

export const DEFAULT_MODULE_ID = "prompt-werkstatt-tierwelt";

export async function fetchCatalog(): Promise<ModuleCatalog> {
  if (catalogCache.current) return catalogCache.current;
  const resp = await fetch("./modules/catalog.json");
  if (!resp.ok) {
    throw new Error(`Modul-Katalog konnte nicht geladen werden (HTTP ${resp.status}).`);
  }
  const parsed = (await resp.json()) as ModuleCatalog;
  catalogCache.current = parsed;
  return parsed;
}

export async function fetchModuleData(moduleId: string = DEFAULT_MODULE_ID): Promise<WorkshopDataset> {
  const safeId = moduleId || DEFAULT_MODULE_ID;
  const existing = dataCache.get(safeId);
  if (existing) return existing;

  const resp = await fetch(`./modules/${encodeURIComponent(safeId)}/data.json`);
  if (!resp.ok) {
    throw new Error(`Modul „${safeId}“ nicht gefunden (HTTP ${resp.status}).`);
  }
  const parsed = (await resp.json()) as WorkshopDataset;
  dataCache.set(safeId, parsed);
  return parsed;
}

export async function fetchModuleSearchIndex(
  moduleId: string = DEFAULT_MODULE_ID
): Promise<CorpusSearchIndex> {
  const safeId = moduleId || DEFAULT_MODULE_ID;
  const existing = indexCache.get(safeId);
  if (existing) return existing;

  const resp = await fetch(`./modules/${encodeURIComponent(safeId)}/searchIndex.json`);
  if (!resp.ok) {
    throw new Error(`Suchindex für „${safeId}“ konnte nicht geladen werden (HTTP ${resp.status}).`);
  }
  const parsed = (await resp.json()) as CorpusSearchIndex;
  indexCache.set(safeId, parsed);
  return parsed;
}

export function moduleStorageKeys(moduleId: string) {
  const safeId = moduleId || DEFAULT_MODULE_ID;
  return {
    storageKey:
      safeId === DEFAULT_MODULE_ID
        ? "v7-ccf-workshop-state-v3"
        : `v7-workshop:${safeId}:state-v1`,
    sessionKey:
      safeId === DEFAULT_MODULE_ID
        ? "v7-ccf-workshop-session-v2"
        : `v7-workshop:${safeId}:session-v1`,
    tourKey: "v7-ccf-tour-seen-v1",
  };
}

export function readModuleProgressPct(moduleId: string, totalChecklist = 7): number {
  if (typeof window === "undefined") return 0;
  try {
    const { storageKey } = moduleStorageKeys(moduleId);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { checked?: Record<string, boolean> };
    const checked = parsed?.checked || {};
    const doneCount = Object.values(checked).filter(Boolean).length;
    return Math.min(100, Math.round((doneCount / Math.max(totalChecklist, 1)) * 100));
  } catch {
    return 0;
  }
}
