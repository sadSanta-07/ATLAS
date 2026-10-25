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
    <div className="overflow-x-auto rounded-2xl border border-[#e9e8f2] bg-white/70">
      <table className="w-full min-w-[500px] text-left text-xs">
        <thead className="bg-[#f0eeff] text-[9px] font-semibold uppercase tracking-[0.13em] text-[#77786e]">
          <tr>
            <th className="px-4 py-3.5">Run</th>
            <th className="px-4 py-3.5">Changed %</th>
            <th className="px-4 py-3.5">Regions</th>
            <th className="px-4 py-3.5">Runtime</th>
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
                className={`cursor-pointer border-t border-[#e9e9e1] transition-colors hover:bg-[#f5f7ed] ${active ? "bg-[#eeebff]" : "bg-transparent"}`}
              >
                <td className="px-4 py-3.5 font-medium text-[#303127]">
                  <span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md font-mono text-[9px] ${active ? "bg-[#dcd5ff] text-[#58682b]" : "bg-[#f0eeff] text-[#777583]"}`}>{String(index + 1).padStart(2, "0")}</span>
                  {PRESET_LABELS[key] ?? "Custom settings"}
                  {active && <span className="ml-2 text-[9px] font-semibold uppercase tracking-wider text-[#7565d8]">Active</span>}
                </td>
                <td className="px-4 py-3.5 font-mono tabular-nums text-[#4b4c42]">{r.changed_percent.toFixed(2)}%</td>
                <td className="px-4 py-3.5 font-mono tabular-nums text-[#4b4c42]">{r.region_count}</td>
                <td className="px-4 py-3.5 font-mono tabular-nums text-[#4b4c42]">{r.runtime_ms.toFixed(0)} ms</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
