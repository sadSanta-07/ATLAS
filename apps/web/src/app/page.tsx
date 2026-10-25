"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { ComparisonTable } from "@/components/ComparisonTable";
import { CompareSlider } from "@/components/CompareSlider";
import { ControlsPanel } from "@/components/ControlsPanel";
import { ImageDropzone } from "@/components/ImageDropzone";
import { MetricCards } from "@/components/MetricCards";
import { analyze } from "@/lib/api";
import { DEFAULT_PARAMS, PRESETS } from "@/lib/presets";
import type { AnalysisResponse, DetectionParams } from "@/lib/types";
import { useObjectUrl } from "@/lib/useObjectUrl";
import Image from "next/image";

type ViewKey = "a" | "b" | "overlay" | "heatmap" | "mask" | "aligned";

const VIEW_LABELS: Record<ViewKey, string> = {
  a: "Image A (earlier)",
  b: "Image B (later)",
  overlay: "Change overlay",
  heatmap: "Heatmap",
  mask: "Binary mask",
  aligned: "B after alignment",
};


function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e5e0ff] ${className}`}
    >
      <Image
        src="/logo.jpg"
        alt="ATLAS logo"
        width={36}
        height={36}
        className="h-full w-full object-contain"
      />
    </span>
  );
}


function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-[0.18em] text-[#77786e]">{number}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#77786e]">{children}</span>
      <span className="h-px flex-1 bg-[#e9e8f2]" />
    </div>
  );
}

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
  const runAll = () =>
    run(
      PRESETS.map((p) => ({ key: p.id, params: p.params })),
      PRESETS[0]?.id ?? "custom",
    );
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
    <div className="atlas-shell min-h-screen text-[#20211b]">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40" aria-hidden="true">
        <div className="atlas-grid absolute inset-0" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[#e9e8f2]/90 bg-[#faf9ff]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:px-12">
          <a href="#" className="flex items-center gap-3" aria-label="ATLAS home">
            <Mark />
            <div>
              <div className="text-[15px] font-bold tracking-[-0.04em]">ATLAS<span className="text-[#7565d8]">.</span></div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-[#77786e]">Temporal intelligence</div>
            </div>
          </a>
          <div className="hidden items-center gap-7 text-xs text-[#77786e] md:flex">
            <a href="#workspace" className="transition hover:text-[#20211b]">Workspace</a>
            <a href="#method" className="transition hover:text-[#20211b]">Methodology</a>
            <span className="flex items-center gap-2 rounded-full border border-[#e9e8f2] bg-white/60 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8574e8]" />
              Local analysis engine
            </span>
          </div>
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#e2e0ef] bg-white px-4 py-2 text-xs font-semibold transition hover:border-[#a99aff] hover:bg-[#f6f5ff]">
            API docs
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12">
        <section className="relative grid gap-8 border-b border-[#e9e8f2] py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-12 lg:py-20">
          <div className="absolute right-0 top-12 hidden h-24 w-24 rounded-full border border-[#e9e8f2] lg:block" aria-hidden="true">
            <div className="absolute inset-3 rounded-full border border-dashed border-[#dedaf5]" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a99aff]" />
          </div>
          <div>
            <h1 className="max-w-3xl text-[clamp(3rem,7.5vw,6.8rem)] font-semibold leading-[0.91] tracking-[-0.085em]">
              See what<br />time <span className="font-serif font-normal italic text-[#7565d8]">changed.</span>
            </h1>
            <p className="mt-7 max-w-xl text-sm leading-7 text-[#66675e] sm:text-base">
              Compare two moments in one place. ATLAS aligns imagery, accounts for lighting, and maps the differences that matter.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] text-[#77786e]">
              <span className="rounded-full bg-[#edf0ff] px-3 py-1.5">PIXEL DIFFERENCE</span>
              <span className="rounded-full bg-[#edf0ff] px-3 py-1.5">STRUCTURAL SIMILARITY</span>
              <span className="rounded-full bg-[#edf0ff] px-3 py-1.5">HYBRID DETECTION</span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e9e8f2] bg-[#f3f1ff] p-6 sm:p-8">
            <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border border-[#dedaf5]" />
            <div className="absolute -right-3 -top-7 h-36 w-36 rounded-full border border-[#dedaf5]" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77786e]">The workflow</p>
                <p className="mt-2 text-xl font-medium tracking-[-0.04em] sm:text-2xl">From two images<br />to a clear signal.</p>
              </div>
              <span className="font-mono text-xs text-[#77786e]">01—04</span>
            </div>
            <div className="relative mt-8 space-y-3">
              {[
                ["01", "Align", "Correct camera movement"],
                ["02", "Normalize", "Reduce lighting differences"],
                ["03", "Compare", "Evaluate pixel and structure"],
                ["04", "Localize", "Map changed regions"],
              ].map(([n, title, copy]) => (
                <div key={n} className="flex items-center gap-4 border-t border-[#e5e2f2] py-3">
                  <span className="font-mono text-[10px] text-[#7565d8]">{n}</span>
                  <span className="w-24 text-sm font-semibold">{title}</span>
                  <span className="text-xs text-[#77786e]">{copy}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workspace" className="grid scroll-mt-24 gap-8 py-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-10 lg:py-14">
          <aside className="min-w-0 space-y-7">
            <div>
              <SectionLabel number="01">Source imagery</SectionLabel>
              <p className="mb-4 text-xs leading-5 text-[#77786e]">Add two images of the same scene, captured at different times.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="atlas-dropzone">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.13em]">Image A</span>
                    <span className="rounded-full bg-[#edf0ff] px-2 py-0.5 text-[9px] text-[#5e5a83]">EARLIER</span>
                  </div>
                  <ImageDropzone label="Image A" hint="Earlier time" file={fileA} previewUrl={urlA} onFile={handleFile(setFileA)} />
                </div>
                <div className="atlas-dropzone">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.13em]">Image B</span>
                    <span className="rounded-full bg-[#edf0ff] px-2 py-0.5 text-[9px] text-[#5e5a83]">LATER</span>
                  </div>
                  <ImageDropzone label="Image B" hint="Later time" file={fileB} previewUrl={urlB} onFile={handleFile(setFileB)} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-[#8a8b80]">
                <span className="font-mono">JPG · PNG · WEBP</span>
                <span className="h-1 w-1 rounded-full bg-[#c9c5df]" />
                <span>Images stay in your workflow</span>
              </div>
            </div>

            <div className="atlas-panel rounded-[1.5rem] p-5 sm:p-6">
              <SectionLabel number="02">Detection settings</SectionLabel>
              <ControlsPanel params={params} activePreset={activePreset} disabled={loading}
                onPreset={applyPreset} onChange={patchParams} />
            </div>

            <div className="space-y-3">

              <button
                type="button"
                onClick={runCurrent}
                disabled={!ready || loading}
                className="
    group relative flex w-full items-center justify-between
    rounded-2xl border-2 border-[#8da2ff]
    bg-[#e9edff] px-5 py-3.5
    text-sm font-semibold text-[#29449c]
    shadow-[0_5px_0_#aebfff,0_7px_14px_rgba(91,111,220,0.10)]
    transition-[transform,box-shadow,background-color]
    duration-150 ease-out
    hover:bg-[#e0e7ff]
    active:translate-y-[3px]
    active:shadow-[0_2px_0_#aebfff,0_3px_8px_rgba(91,111,220,0.10)]
    focus-visible:outline-2
    focus-visible:outline-offset-4
    focus-visible:outline-[#7565d8]
    disabled:cursor-not-allowed
    disabled:opacity-75
    disabled:hover:bg-[#e9edff]
    disabled:active:translate-y-0
    disabled:active:shadow-[0_5px_0_#aebfff,0_7px_14px_rgba(91,111,220,0.10)]
  "
              >
                <span>
                  {loading ? "Analysing imagery…" : "Analyse current settings"}
                </span>

                <span
                  aria-hidden="true"
                  className="
      flex h-8 w-8 items-center justify-center
      rounded-xl border border-[#c4ceff]
      bg-[#dbe3ff] text-[#29449c]
      transition-transform duration-150
      group-active:translate-y-0.5
    "
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                onClick={runAll}
                disabled={!ready || loading}
                className="
    group relative flex w-full items-center justify-between
    rounded-2xl border-2 border-[#8da2ff]
    bg-[#e9edff] px-5 py-3.5
    text-sm font-semibold text-[#29449c]
    shadow-[0_5px_0_#aebfff,0_7px_14px_rgba(91,111,220,0.10)]
    transition-[transform,box-shadow,background-color]
    duration-150 ease-out
    hover:bg-[#e0e7ff]
    active:translate-y-[3px]
    active:shadow-[0_2px_0_#aebfff,0_3px_8px_rgba(91,111,220,0.10)]
    focus-visible:outline-2
    focus-visible:outline-offset-4
    focus-visible:outline-[#7565d8]
    disabled:cursor-not-allowed
    disabled:opacity-75
    disabled:hover:bg-[#e9edff]
    disabled:active:translate-y-0
    disabled:active:shadow-[0_5px_0_#aebfff,0_7px_14px_rgba(91,111,220,0.10)]
  "
              >
                <span>Compare all 4 methods</span>

                <span
                  className="
      rounded-lg border border-[#c4ceff]
      bg-[#dbe3ff] px-2.5 py-1
      font-mono text-[11px] font-semibold text-[#4058ad]
    "
                >
                  01—04
                </span>
              </button>
              {!ready && <p className="px-2 text-center text-[10px] text-[#8a8b80]">Upload both images to begin analysis.</p>}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionLabel number="03">Analysis workspace</SectionLabel>
                <h2 className="text-2xl font-semibold tracking-[-0.06em] sm:text-3xl">The change report<span className="text-[#7565d8]">.</span></h2>
                <p className="mt-2 text-xs text-[#77786e]">Visual comparison, quantitative metrics, and exportable findings.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#dfe0d4] bg-white/70 px-3 py-2 text-[10px] text-[#77786e]">
                <span className={`h-1.5 w-1.5 rounded-full ${result ? "bg-[#8574e8]" : loading ? "animate-pulse bg-[#c19d44]" : "bg-[#c7c5d5]"}`} />
                {loading ? "PROCESSING" : result ? "RESULTS READY" : "AWAITING INPUT"}
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-2xl border border-[#e5b6aa] bg-[#fff1ec] px-4 py-3 text-sm text-[#9c4334]">
                <span className="mr-2 font-semibold">Analysis error</span>{error}
              </div>
            )}

            {!result ? (
              <div className="atlas-empty-state flex min-h-[430px] flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-[#e9e8f2] px-6 py-12 text-center">
                <div className="relative mb-8 flex h-32 w-48 items-center justify-center">
                  <div className="absolute left-0 top-4 h-24 w-24 -rotate-6 rounded-2xl border border-[#c9cdb9] bg-[#f0eeff] p-2">
                    <div className="flex h-full items-end rounded-lg bg-[#e5e1ff] p-2">
                      <span className="h-7 w-7 rounded-full bg-[#c7bcff]" />
                      <span className="ml-1 h-12 w-10 rounded-t-full bg-[#a99aff]" />
                    </div>
                  </div>
                  <div className="absolute right-0 top-4 h-24 w-24 rotate-6 rounded-2xl border border-[#c9cdb9] bg-white p-2 shadow-sm">
                    <div className="relative flex h-full items-end rounded-lg bg-[#f3f1ff] p-2">
                      <span className="h-6 w-7 rounded-full bg-[#c7bcff]" />
                      <span className="ml-1 h-10 w-10 rounded-t-full bg-[#a99aff]" />
                      <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-[#8574e8]" />
                    </div>
                  </div>
                  <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe0d4] bg-[#faf9ff] text-sm text-[#77786e]">↔</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a8b80]">Ready when you are</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.06em]">Two moments. One clearer picture.</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#77786e]">Upload your earlier and later images, choose a detection method, and let ATLAS map where the scene changed.</p>
                <a href="#workspace" className="mt-6 rounded-full border border-[#dedaf5] bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-[#9cae50]">Add source images <span className="ml-2">↑</span></a>
              </div>
            ) : (
              <div className="space-y-6">
                <MetricCards result={result} />

                <div className="atlas-panel rounded-[1.5rem] p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#77786e]">Visual inspection</p>
                      <p className="mt-1 text-sm font-semibold">Compare views</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ["Left", leftView, setLeftView],
                        ["Right", rightView, setRightView],
                      ] as const).map(([label, value, setter]) => (
                        <label key={label} className="flex items-center gap-2 rounded-full border border-[#e9e8f2] bg-white px-3 py-2 text-[10px] text-[#77786e]">
                          {label}
                          <select value={value} onChange={(e) => setter(e.target.value as ViewKey)}
                            className="max-w-36 bg-transparent text-xs font-medium text-[#20211b] outline-none">
                            {(Object.keys(VIEW_LABELS) as ViewKey[]).map((v) => (
                              <option key={v} value={v}>{VIEW_LABELS[v]}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                  <CompareSlider left={sourceFor(leftView)} right={sourceFor(rightView)}
                    leftLabel={VIEW_LABELS[leftView]} rightLabel={VIEW_LABELS[rightView]}
                    width={result.width} height={result.height} />
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e5e5dc] pt-4">
                    <a href={result.images.overlay} download="atlas-overlay.jpg"
                      className="rounded-full bg-[#20211b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#39315e]">
                      Download overlay <span className="ml-1">↓</span>
                    </a>
                    <button type="button" onClick={downloadJson}
                      className="rounded-full border border-[#e2e0ef] bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-[#a99aff]">
                      Export results JSON <span className="ml-1">↓</span>
                    </button>
                  </div>
                </div>

                <div className="atlas-panel rounded-[1.5rem] p-4 sm:p-5">
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#77786e]">Method evaluation</p>
                    <p className="mt-1 text-sm font-semibold">Compare algorithm results</p>
                  </div>
                  <ComparisonTable results={results} activeKey={activeKey} onSelect={setActiveKey} />
                </div>
              </div>
            )}
          </section>
        </section>

        <section id="method" className="grid gap-6 border-t border-[#e9e8f2] py-8 sm:grid-cols-3 sm:py-10">
          {[
            ["01 / ALIGN", "Handle camera movement", "Feature matching estimates a geometric transform so both images line up before comparison."],
            ["02 / COMPARE", "Use complementary signals", "Pixel difference, SSIM structural dissimilarity, and hybrid scoring reveal different kinds of change."],
            ["03 / LOCALIZE", "Make changes inspectable", "Spatial filtering helps turn raw differences into regions you can inspect, measure, and export."],
          ].map(([eyebrow, title, copy]) => (
            <div key={eyebrow} className="border-t border-[#e2e0ef] pt-4">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[#7565d8]">{eyebrow}</p>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em]">{title}</h3>
              <p className="mt-2 max-w-sm text-xs leading-6 text-[#77786e]">{copy}</p>
            </div>
          ))}
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-[#e9e8f2] py-6 text-[10px] text-[#8a8b80] sm:flex-row sm:items-center">
          <div className="flex items-center gap-2"><Mark className="h-7 w-7 rounded-lg" /><span className="font-semibold tracking-wide text-[#55564e]">ATLAS / TEMPORAL CHANGE INTELLIGENCE</span></div>
          <span>Designed for careful comparison, not guesswork.</span>
        </footer>
      </main>
    </div>
  );
}
