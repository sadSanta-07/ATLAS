import type { AnalysisResponse } from "@/lib/types";

function Card({
  label,
  value,
  sub,
  index,
}: {
  label: string;
  value: string;
  sub?: string;
  index: string;
}) {
  return (
    <div className="group rounded-xl border border-[var(--line-strong)] bg-[var(--surface-card)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="mono text-[var(--ink-soft)] group-hover:text-[var(--ink)]">
          {label}
        </p>
        <span className="mono text-[var(--accent)] font-semibold">
          {index}
        </span>
      </div>
      <p className="mt-2 text-3xl sm:text-4xl font-editorial tracking-tight text-[var(--ink)]">
        {value}
      </p>
      {sub && (
        <p className="mt-2.5 border-t border-[var(--line)] pt-2 text-[11px] leading-relaxed text-[var(--ink-soft)]">
          {sub}
        </p>
      )}
    </div>
  );
}

export function MetricCards({ result }: { result: AnalysisResponse }) {
  const alignText = result.params.align
    ? result.aligned
      ? `Aligned (${result.alignment_inliers} inliers)`
      : "Alignment failed (fallback original)"
    : "Alignment bypassed";

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Card
        index="01"
        label="Changed area"
        value={`${result.changed_percent.toFixed(2)}%`}
        sub={`${result.width} × ${result.height} px analyzed`}
      />
      <Card
        index="02"
        label="Detected regions"
        value={String(result.region_count)}
        sub={
          result.regions[0]
            ? `Largest region: ${result.regions[0].area_px.toLocaleString()} px`
            : "No significant clusters"
        }
      />
      <Card
        index="03"
        label="Execution time"
        value={`${result.runtime_ms.toFixed(0)} ms`}
        sub={alignText}
      />
      <Card
        index="04"
        label="Decision threshold"
        value={result.threshold_used.toFixed(3)}
        sub={
          result.params.threshold_mode === "otsu"
            ? "Otsu auto-bimodal"
            : "Fixed parameter"
        }
      />
    </div>
  );
}
