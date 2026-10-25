import type { AnalysisResponse } from "@/lib/types";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export function MetricCards({ result }: { result: AnalysisResponse }) {
  const alignText = result.params.align
    ? result.aligned
      ? `aligned (${result.alignment_inliers} inliers)`
      : "alignment failed, used original"
    : "alignment off";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card label="Changed area" value={`${result.changed_percent.toFixed(2)}%`} sub={`${result.width}×${result.height}px`} />
      <Card label="Regions" value={String(result.region_count)} sub={result.regions[0] ? `largest ${result.regions[0].area_px} px` : "none"} />
      <Card label="Runtime" value={`${result.runtime_ms.toFixed(0)} ms`} sub={alignText} />
      <Card label="Threshold used" value={result.threshold_used.toFixed(3)} sub={result.params.threshold_mode} />
    </div>
  );
}