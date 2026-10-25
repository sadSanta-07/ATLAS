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
    <div className="overflow-x-auto rounded-xl border border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-900 text-xs uppercase tracking-wider text-neutral-500">
          <tr>
            <th className="px-4 py-2">Run</th>
            <th className="px-4 py-2">Changed %</th>
            <th className="px-4 py-2">Regions</th>
            <th className="px-4 py-2">Runtime</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const r = results[key];
            return (
              <tr
                key={key}
                onClick={() => onSelect(key)}
                className={`cursor-pointer border-t border-neutral-800 transition hover:bg-neutral-900 ${
                  activeKey === key ? "bg-cyan-400/10" : ""
                }`}
              >
                <td className="px-4 py-2 font-medium">{PRESET_LABELS[key] ?? "Custom settings"}</td>
                <td className="px-4 py-2 tabular-nums">{r.changed_percent.toFixed(2)}</td>
                <td className="px-4 py-2 tabular-nums">{r.region_count}</td>
                <td className="px-4 py-2 tabular-nums">{r.runtime_ms.toFixed(0)} ms</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}