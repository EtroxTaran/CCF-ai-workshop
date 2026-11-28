import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buildToolTranslationMatrix } from "@/data/toolTranslationMatrix";
import type { ToolMode } from "@/types/workshop";

const MODE_LABELS: Record<ToolMode, string> = {
  web: "Web-Chat",
  desktop: "Desktop & Projects",
  ide: "IDE & Editor",
  agent: "CLI Code-Agent",
};

export interface ToolTranslationMatrixProps {
  activeToolMode: ToolMode;
  defaultShowAll?: boolean;
  compactCardsOnly?: boolean;
  stageFolders?: { stufe1?: string; stufe2?: string; stufe3?: string };
}

export function ToolTranslationMatrix({
  activeToolMode,
  defaultShowAll = false,
  compactCardsOnly = false,
  stageFolders,
}: ToolTranslationMatrixProps) {
  const [showAll, setShowAll] = useState<boolean>(defaultShowAll);
  const rows = useMemo(() => buildToolTranslationMatrix(stageFolders), [stageFolders]);

  const visibleRows = showAll
    ? rows
    : rows.filter((entry) => entry.toolMode === activeToolMode);

  return (
    <div data-testid="tool-translation-matrix" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-foreground">
            Konzept → Dein Tool ({visibleRows.length} von {rows.length} Einträgen
            · {rows.length} Ziel-Tools)
          </div>
          <p className="text-[11px] text-foreground/80">
            Gleiche 5 Steuerungsebenen — übersetzt für Web-Chats, Projects/Assistants, IDEs und
            CLIs.
          </p>
        </div>

        <div
          role="group"
          aria-label="Tool-Matrix Filter"
          className="inline-flex rounded-lg border bg-muted p-0.5 text-xs"
        >
          <button
            type="button"
            data-testid="matrix-filter-mode"
            aria-pressed={!showAll}
            onClick={() => setShowAll(false)}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              !showAll
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Passend zu meinem Modus ({MODE_LABELS[activeToolMode]})
          </button>
          <button
            type="button"
            data-testid="matrix-filter-all"
            aria-pressed={showAll}
            onClick={() => setShowAll(true)}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              showAll
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Alle {rows.length} Tools
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Semantic Table (md+ when not forced to cards in narrow drawers) */}
      {!compactCardsOnly && (
        <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                <th scope="col" className="px-3 py-2.5">
                  Tool &amp; Gruppe
                </th>
                <th scope="col" className="px-3 py-2.5">
                  1 · System / Rolle
                </th>
                <th scope="col" className="px-3 py-2.5">
                  2 · Regeln / Guardrails
                </th>
                <th scope="col" className="px-3 py-2.5">
                  3 · Wissen / Kontext
                </th>
                <th scope="col" className="px-3 py-2.5">
                  4 · Werkzeuge / MCP
                </th>
                <th scope="col" className="px-3 py-2.5">
                  5 · Verifikation / Prüfung
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleRows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-muted/25">
                  <th scope="row" className="px-3 py-2.5 font-semibold text-foreground">
                    <div>{row.toolName}</div>
                    <Badge variant="outline" className="mt-1 text-[10px] font-normal">
                      {row.groupLabel}
                    </Badge>
                  </th>
                  <td className="px-3 py-2.5 text-foreground/90">{row.systemRole}</td>
                  <td className="px-3 py-2.5 text-foreground/90">{row.rulesGuardrails}</td>
                  <td className="px-3 py-2.5 text-foreground/90">{row.knowledgeContext}</td>
                  <td className="px-3 py-2.5 text-foreground/90">{row.toolsMcp}</td>
                  <td className="px-3 py-2.5 text-foreground/90">{row.verification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile / Narrow-Drawer Card View */}
      <div className={compactCardsOnly ? "space-y-3" : "space-y-3 md:hidden"}>
        {visibleRows.map((row) => (
          <article key={row.id} className="space-y-2 rounded-xl border bg-card p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <h4 className="font-display text-sm font-bold text-foreground">{row.toolName}</h4>
              <Badge variant="outline" className="text-[10px]">
                {row.groupLabel}
              </Badge>
            </div>
            <dl className="space-y-1.5 text-[11px]">
              <div>
                <dt className="font-semibold text-foreground">1 · System / Rolle</dt>
                <dd className="text-foreground/85">{row.systemRole}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">2 · Regeln / Guardrails</dt>
                <dd className="text-foreground/85">{row.rulesGuardrails}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">3 · Wissen / Kontext</dt>
                <dd className="text-foreground/85">{row.knowledgeContext}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">4 · Werkzeuge / MCP</dt>
                <dd className="text-foreground/85">{row.toolsMcp}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">5 · Verifikation / Prüfung</dt>
                <dd className="text-foreground/85">{row.verification}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
