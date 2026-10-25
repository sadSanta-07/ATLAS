import type { AnalysisResponse } from "@/lib/types";

function Card({ label, value, sub, index }: { label: string; value: string; sub?: string; index: string }) {
  return (
    <div className="group rounded-2xl border border-[#e9e8f2] bg-white/75 p-4 transition hover:-translate-y-0.5 hover:border-[#c9c0ff] hover:shadow-[0_12px_32px_rgba(40,42,29,0.05)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#77786e]">{label}</p>
        <span className="font-mono text-[9px] text-[#9b9c90]">{index}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.07em] text-[#292a22] sm:text-[2.1rem]">{value}</p>
      {sub && <p className="mt-2 border-t border-[#edede5] pt-2 text-[10px] leading-4 text-[#777583]">{sub}</p>}
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
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Card index="01" label="Changed area" value={`${result.changed_percent.toFixed(2)}%`} sub={`${result.width}×${result.height}px inspected`} />
      <Card index="02" label="Detected regions" value={String(result.region_count)} sub={result.regions[0] ? `largest region · ${result.regions[0].area_px} px` : "no regions detected"} />
      <Card index="03" label="Runtime" value={`${result.runtime_ms.toFixed(0)} ms`} sub={alignText} />
      <Card index="04" label="Threshold used" value={result.threshold_used.toFixed(3)} sub={result.params.threshold_mode === "otsu" ? "automatic · Otsu" : "fixed threshold"} />
    </div>
  );
}
