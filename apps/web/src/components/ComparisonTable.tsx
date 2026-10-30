import { PRESET_LABELS } from "@/lib/presets";
import type { AnalysisResponse } from "@/lib/types";

interface Props {
  results: Record<string, AnalysisResponse>;
  activeKey: string | null;
  onSelect: (key: string) => void;
}

export function ComparisonTable({ results, activeKey, onSelect }: Props) {
  const keys = Object.keys(results);
  if (keys.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--line-strong)] bg-[var(--surface-card)]">
      <table className="w-full min-w-[500px] text-left text-xs">
        <thead className="border-b border-[var(--line-strong)] bg-[var(--paper-deep)] text-[10px] text-[var(--ink-soft)] mono">
          <tr>
            <th className="px-4 py-3">01 / Method Run</th>
            <th className="px-4 py-3">Changed %</th>
            <th className="px-4 py-3">Regions</th>
            <th className="px-4 py-3">Runtime</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key, index) => {
            const r = results[key];
            const active = activeKey === key;
            return (
              <tr
                key={key}
                onClick={() => onSelect(key)}
                aria-selected={active}
                className={`cursor-pointer border-t border-[var(--line)] transition-colors ${
                  active
                    ? "bg-[var(--surface-hover)]"
                    : "hover:bg-[var(--surface)]"
                }`}
              >
                <td className="px-4 py-3.5 font-medium text-[var(--ink)]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[9px] border ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : "border-[var(--line)] bg-[var(--paper-deep)] text-[var(--ink-soft)]"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{PRESET_LABELS[key] ?? "Custom Parameter Profile"}</span>
                    {active && (
                      <span className="mono rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 text-[9px] text-[var(--accent)] font-semibold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--ink)] font-medium">
                  {r.changed_percent.toFixed(2)}%
                </td>
                <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--ink-soft)]">
                  {r.region_count}
                </td>
                <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--ink-soft)]">
                  {r.runtime_ms.toFixed(0)} ms
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
