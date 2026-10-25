"use client";

import { useState } from "react";

import { ComparisonTable } from "@/components/ComparisonTable";
import { CompareSlider } from "@/components/CompareSlider";
import { ControlsPanel } from "@/components/ControlsPanel";
import { ImageDropzone } from "@/components/ImageDropzone";
import { MetricCards } from "@/components/MetricCards";
import { analyze } from "@/lib/api";
import { DEFAULT_PARAMS, PRESETS } from "@/lib/presets";
import type { AnalysisResponse, DetectionParams } from "@/lib/types";
import { useObjectUrl } from "@/lib/useObjectUrl";

type ViewKey = "a" | "b" | "overlay" | "heatmap" | "mask" | "aligned";

const VIEW_LABELS: Record<ViewKey, string> = {
  a: "Image A (earlier)",
  b: "Image B (later)",
  overlay: "Change overlay",
  heatmap: "Heatmap",
  mask: "Binary mask",
  aligned: "B after alignment",
};

export default function Home() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const urlA = useObjectUrl(fileA);
  const urlB = useObjectUrl(fileB);

  const [params, setParams] = useState<DetectionParams>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AnalysisResponse>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftView, setLeftView] = useState<ViewKey>("a");
  const [rightView, setRightView] = useState<ViewKey>("overlay");

  const result = activeKey ? results[activeKey] : null;

  const resetResults = () => {
    setResults({});
    setActiveKey(null);
    setError(null);
  };

  const handleFile = (setter: (f: File | null) => void) => (file: File | null) => {
    setter(file);
    resetResults();
  };

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setParams(preset.params);
    setActivePreset(id);
  };

  const patchParams = (patch: Partial<DetectionParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
    setActivePreset(null);
  };

  const run = async (jobs: { key: string; params: DetectionParams }[], focusKey: string) => {
    if (!fileA || !fileB) {
      setError("Upload both images first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      for (const job of jobs) {
        const response = await analyze(fileA, fileB, job.params);
        setResults((prev) => ({ ...prev, [job.key]: response }));
      }
      setActiveKey(focusKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const runCurrent = () => run([{ key: activePreset ?? "custom", params }], activePreset ?? "custom");
  const runAll = () => run(PRESETS.map((p) => ({ key: p.id, params: p.params })), "atlas");

  const sourceFor = (view: ViewKey): string | null => {
    switch (view) {
      case "a":
        return urlA;
      case "b":
        return urlB;
      case "overlay":
        return result?.images.overlay ?? null;
      case "heatmap":
        return result?.images.heatmap ?? null;
      case "mask":
        return result?.images.mask ?? null;
      case "aligned":
        return result?.images.aligned_b ?? null;
    }
  };

  const downloadJson = () => {
    const slim = Object.fromEntries(
      Object.entries(results).map(([k, r]) => [k, { ...r, images: undefined }]),
    );
    const blob = new Blob([JSON.stringify(slim, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "atlas-results.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const ready = Boolean(fileA && fileB);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              ATLAS <span className="text-cyan-400">·</span> Temporal Change Detection
            </h1>
            <p className="text-xs text-neutral-500">
              Align → normalise lighting → compare → localise. Pixel vs SSIM vs hybrid, side by side.
            </p>
          </div>
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer"
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-600">
            API docs ↗
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <ImageDropzone label="Image A" hint="Earlier time" file={fileA} previewUrl={urlA} onFile={handleFile(setFileA)} />
            <ImageDropzone label="Image B" hint="Later time" file={fileB} previewUrl={urlB} onFile={handleFile(setFileB)} />
          </div>

          <ControlsPanel params={params} activePreset={activePreset} disabled={loading}
            onPreset={applyPreset} onChange={patchParams} />

          <div className="space-y-2">
            <button type="button" onClick={runCurrent} disabled={!ready || loading}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? "Analysing…" : "Analyse with current settings"}
            </button>
            <button type="button" onClick={runAll} disabled={!ready || loading}
              className="w-full rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-40">
              Compare all 4 methods
            </button>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {error && (
            <div role="alert" className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {!result ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-neutral-800 text-center text-sm text-neutral-500">
              <p>
                Upload two photos of the same scene,
                <br />
                then run an analysis.
              </p>
            </div>
          ) : (
            <>
              <MetricCards result={result} />

              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                {(
                  [
                    ["Left", leftView, setLeftView],
                    ["Right", rightView, setRightView],
                  ] as const
                ).map(([label, value, setter]) => (
                  <label key={label} className="flex items-center gap-2">
                    {label}
                    <select value={value} onChange={(e) => setter(e.target.value as ViewKey)}
                      className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-neutral-100">
                      {(Object.keys(VIEW_LABELS) as ViewKey[]).map((v) => (
                        <option key={v} value={v}>{VIEW_LABELS[v]}</option>
                      ))}
                    </select>
                  </label>
                ))}
                <div className="ml-auto flex gap-2">
                  <a href={result.images.overlay} download="atlas-overlay.jpg"
                    className="rounded-md border border-neutral-800 px-3 py-1 hover:border-neutral-600">
                    Download overlay
                  </a>
                  <button type="button" onClick={downloadJson}
                    className="rounded-md border border-neutral-800 px-3 py-1 hover:border-neutral-600">
                    Export results JSON
                  </button>
                </div>
              </div>

              <CompareSlider left={sourceFor(leftView)} right={sourceFor(rightView)}
                leftLabel={VIEW_LABELS[leftView]} rightLabel={VIEW_LABELS[rightView]}
                width={result.width} height={result.height} />

              <ComparisonTable results={results} activeKey={activeKey} onSelect={setActiveKey} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}