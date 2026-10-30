"use client";

import { useEffect, useState } from "react";
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

type ViewKey = "a" | "b" | "overlay" | "heatmap" | "mask" | "aligned";

const VIEW_LABELS: Record<ViewKey, string> = {
  a: "Image A (earlier)",
  b: "Image B (later)",
  overlay: "Change overlay",
  heatmap: "Heatmap",
  mask: "Binary mask",
  aligned: "B after alignment",
};

function MonogramMark() {
  return (
    <span
      className="monogram"
      aria-hidden="true"
    >
      <span className="font-editorial text-[1.25rem] text-[var(--accent)] font-semibold select-none">
        Δ
      </span>
    </span>
  );
}

function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="mono text-[var(--accent)] font-semibold">{number}</span>
      <span className="mono text-[var(--ink-soft)] tracking-[0.14em]">
        {children}
      </span>
      <span className="h-px flex-1 bg-[var(--line)]" />
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const syncTheme = () => {
      const current =
        (document.documentElement.dataset.theme as "light" | "dark") || "light";
      setTheme(current);
    };

    const observer = new MutationObserver(() => syncTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Initial check from attribute if set
    if (document.documentElement.dataset.theme) {
      syncTheme();
    }

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {}
  };

  const result = activeKey ? results[activeKey] : null;

  const resetResults = () => {
    setResults({});
    setActiveKey(null);
    setError(null);
  };

  const handleFile =
    (setter: (f: File | null) => void) => (file: File | null) => {
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

  const run = async (
    jobs: { key: string; params: DetectionParams }[],
    focusKey: string,
  ) => {
    if (!fileA || !fileB) {
      setError("Upload both earlier (Image A) and later (Image B) images first.");
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

  const runCurrent = () =>
    run([{ key: activePreset ?? "custom", params }], activePreset ?? "custom");

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
      Object.entries(results).map(([k, r]) => [
        k,
        { ...r, images: undefined },
      ]),
    );
    const blob = new Blob([JSON.stringify(slim, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "atlas-change-report.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const ready = Boolean(fileA && fileB);

  return (
    <div className="min-h-screen text-[var(--ink)]">
      {/* ─── SITE HEADER ────────────────────────────────────────── */}
      <header className="site-header sticky top-0 z-40">
        <div className="shell flex min-h-[5.5rem] items-center justify-between gap-4">
          <a
            href="#top"
            className="flex items-center gap-3.5 text-decoration-none group"
            aria-label="ATLAS home"
          >
            <MonogramMark />
            <div>
              <div className="font-editorial text-xl font-medium tracking-tight text-[var(--ink)]">
                ATLAS
                <span className="text-[var(--accent)] font-serif italic ml-0.5">.</span>
              </div>
              <div className="mono text-[9px] text-[var(--ink-soft)]">
                Temporal intelligence
              </div>
            </div>
          </a>

          <nav
            className="hidden items-center gap-8 text-xs font-medium text-[var(--ink-soft)] md:flex"
            aria-label="Primary navigation"
          >
            <a
              href="#workspace"
              className="transition-colors hover:text-[var(--ink)] hover:underline"
            >
              Workspace
            </a>
            <a
              href="#presets"
              className="transition-colors hover:text-[var(--ink)] hover:underline"
            >
              Profiles
            </a>
            <a
              href="#method"
              className="transition-colors hover:text-[var(--ink)] hover:underline"
            >
              Methodology
            </a>
            <span className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-1 font-mono text-[10px] text-[var(--ink-soft)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Engine Online
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 py-1.5 font-mono text-[11px] text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
            >
              <span>API docs</span>
              <span className="text-[var(--accent)]">↗</span>
            </a>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Switch color theme"
              className="theme-toggle"
            >
              {/* Sun icon */}
              <svg
                className="theme-icon theme-icon--sun"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
              </svg>
              {/* Moon icon */}
              <svg
                className="theme-icon theme-icon--moon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
              </svg>
              <span className="sr-only">Switch theme</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ─── HERO SECTION ─────────────────────────────────────── */}
        <section
          id="top"
          className="shell relative border-b border-[var(--line)] py-14 lg:py-24"
          aria-labelledby="hero-title"
        >
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="relative z-10 min-w-0">
              <p className="eyebrow">
                01 / Temporal Analysis Engine · CV &amp; SSIM
              </p>
              <h1
                id="hero-title"
                className="font-editorial text-[clamp(3.4rem,7.5vw,6.4rem)] leading-[0.92] tracking-[-0.045em] text-[var(--ink)]"
              >
                See what <br />
                time <em>changed.</em>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
                Compare two moments in one place. ATLAS aligns imagery across
                viewpoint shifts, accounts for lighting disparity, and maps the
                structural differences that matter.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-6">
                <a className="text-link" href="#workspace">
                  Explore workspace <span>↘</span>
                </a>
                <a
                  className="text-link quiet"
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  API specification <span>↗</span>
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-2.5">
                {[
                  "PIXEL DIFFERENCE",
                  "STRUCTURAL SIMILARITY",
                  "ORB HOMOGRAPHY",
                  "HYBRID DELTA",
                ].map((tag, idx) => (
                  <span
                    key={tag}
                    className="mono rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[10px] text-[var(--ink-soft)]"
                  >
                    0{idx + 1} · {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bespoke Celestial & Optical Alignment Graphic */}
            <div
              className="relative flex items-center justify-center lg:justify-end"
              aria-hidden="true"
            >
              <div className="relative w-full max-w-[34rem]">
                <svg
                  viewBox="0 0 620 590"
                  role="presentation"
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="hero-sun"
                      x1="0"
                      x2="1"
                      y1="0"
                      y2="1"
                    >
                      <stop offset="0" stopColor="var(--sun-start)" />
                      <stop offset="1" stopColor="var(--sun-end)" />
                    </linearGradient>
                    <radialGradient
                      id="hero-halo"
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Breathing Sun / Core Lens */}
                  <circle
                    cx="377"
                    cy="205"
                    r="190"
                    fill="url(#hero-halo)"
                    className="sun-pulse"
                  />
                  <circle
                    className="sun-pulse"
                    cx="377"
                    cy="205"
                    r="135"
                    fill="url(#hero-sun)"
                    opacity="0.85"
                  />

                  {/* Orbits / Optical Rings */}
                  <g
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="1.2"
                    opacity="0.45"
                  >
                    <circle cx="377" cy="205" r="175" />
                    <circle cx="377" cy="205" r="230" strokeDasharray="3 6" />
                    <path d="M110 490 C 190 390, 260 330, 377 205 S 520 80, 580 40" />
                    <path d="M60 540 C 130 470, 200 430, 310 415 C 400 400, 480 430, 560 370" />
                    <path d="M377 205 C 330 330, 360 430, 480 515" />
                  </g>

                  {/* Alignment Crosshairs & Calibration Nodes */}
                  <g fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.6">
                    <circle cx="110" cy="490" r="6" />
                    <circle cx="310" cy="415" r="6" />
                    <circle cx="480" cy="515" r="7" fill="var(--accent)" />
                    <circle cx="560" cy="370" r="5" />
                    <circle cx="580" cy="40" r="6" />
                    <circle cx="377" cy="205" r="4" fill="var(--ink)" />
                  </g>

                  {/* Reticle Axes */}
                  <path
                    d="M 377 155 L 377 255 M 327 205 L 427 205"
                    stroke="var(--ink)"
                    strokeWidth="1"
                    opacity="0.6"
                  />

                  {/* Coordinates & Metadata */}
                  <g
                    fill="var(--ink-soft)"
                    fontFamily="'DM Mono', monospace"
                    fontSize="10px"
                    letterSpacing="0.14em"
                  >
                    <text x="24" y="555">25.2048° N</text>
                    <text x="24" y="573">55.2708° E · DUAL FRAME</text>
                    <text x="360" y="32">OPTICAL DELTA ENGINE · RANSAC</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center text-[11px] text-[var(--ink-soft)] mono">
            <span>CALIBRATION: SENSOR HOMOGRAPHY · SSIM GAUSSIAN</span>
            <span className="hidden sm:inline">
              Designing for pixel-level precision, spatial coherence, and useful surprise.
            </span>
          </div>
        </section>

        {/* ─── MARQUEE / FIELD NOTES ────────────────────────────── */}
        <div className="field-notes" aria-hidden="true">
          <div className="field-notes__track">
            <span>TEMPORAL CHANGE DETECTION</span>
            <i>✦</i>
            <span>STRUCTURAL SIMILARITY (SSIM)</span>
            <i>✦</i>
            <span>ORB FEATURE HOMOGRAPHY</span>
            <i>✦</i>
            <span>RADIOMETRIC NORMALISATION</span>
            <i>✦</i>
            <span>HYBRID DELTA FUSION</span>
            <i>✦</i>
            <span>OTSU THRESHOLDING</span>
            <i>✦</i>
            <span>SPATIAL REGION EXTRACTION</span>
            <i>✦</i>
            <span>TEMPORAL CHANGE DETECTION</span>
            <i>✦</i>
            <span>STRUCTURAL SIMILARITY (SSIM)</span>
            <i>✦</i>
            <span>ORB FEATURE HOMOGRAPHY</span>
            <i>✦</i>
            <span>RADIOMETRIC NORMALISATION</span>
            <i>✦</i>
            <span>HYBRID DELTA FUSION</span>
            <i>✦</i>
            <span>OTSU THRESHOLDING</span>
            <i>✦</i>
            <span>SPATIAL REGION EXTRACTION</span>
            <i>✦</i>
          </div>
        </div>

        {/* ─── WORKSPACE SECTION ────────────────────────────────── */}
        <section id="workspace" className="shell scroll-mt-24 py-14 lg:py-20">
          <div className="mb-12 grid gap-6 md:grid-cols-[0.5fr_1fr_0.6fr] md:items-start border-b border-[var(--line)] pb-10">
            <div>
              <p className="section-number">02 / WORKSPACE</p>
            </div>
            <div>
              <h2 className="font-editorial text-4xl sm:text-5xl leading-tight">
                From two moments<br />
                <em>to a clear signal.</em>
              </h2>
            </div>
            <div className="text-xs leading-relaxed text-[var(--ink-soft)]">
              <p>
                Provide reference and comparison frames. Align geometry, account for
                atmospheric variations, and measure the pixel delta.
              </p>
              <div className="mt-3">
                <a href="#presets" className="text-link">
                  View profiles <span>↘</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12">
            {/* ─── LEFT ASIDE: CONTROLS & INPUTS ─────────────────── */}
            <aside className="min-w-0 space-y-8">
              {/* Image Inputs */}
              <div>
                <SectionLabel number="01">Source Imagery</SectionLabel>
                <p className="mb-4 text-xs leading-relaxed text-[var(--ink-soft)]">
                  Upload two photographs of the same scene captured at different
                  points in time.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="mono font-semibold text-[var(--ink)]">
                        Frame A
                      </span>
                      <span className="mono rounded border border-[var(--line)] bg-[var(--paper-deep)] px-1.5 py-0.5 text-[9px] text-[var(--ink-soft)]">
                        EARLIER
                      </span>
                    </div>
                    <ImageDropzone
                      label="Image A"
                      hint="Earlier moment"
                      file={fileA}
                      previewUrl={urlA}
                      onFile={handleFile(setFileA)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="mono font-semibold text-[var(--ink)]">
                        Frame B
                      </span>
                      <span className="mono rounded border border-[var(--line)] bg-[var(--paper-deep)] px-1.5 py-0.5 text-[9px] text-[var(--ink-soft)]">
                        LATER
                      </span>
                    </div>
                    <ImageDropzone
                      label="Image B"
                      hint="Later moment"
                      file={fileB}
                      previewUrl={urlB}
                      onFile={handleFile(setFileB)}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[var(--ink-soft)]">
                  <span>JPG · PNG · WEBP</span>
                  <span>✦</span>
                  <span>LOCAL ANALYSIS BUFFER</span>
                </div>
              </div>

              {/* Controls Panel */}
              <div id="presets" className="editorial-card rounded-2xl p-5 sm:p-6">
                <ControlsPanel
                  params={params}
                  activePreset={activePreset}
                  disabled={loading}
                  onPreset={applyPreset}
                  onChange={patchParams}
                />
              </div>

              {/* Action Trigger Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={runCurrent}
                  disabled={!ready || loading}
                  className={`group relative flex w-full items-center justify-between rounded-xl border px-5 py-4 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    !ready
                      ? "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-soft)] cursor-not-allowed opacity-80"
                      : loading
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white cursor-wait opacity-90 shadow-sm"
                        : "border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-hover)] active:translate-y-0.5 cursor-pointer"
                  }`}
                >
                  <span className="font-mono text-[11px] tracking-wider">
                    {loading ? "Analysing imagery…" : "Analyse current profile"}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm transition-transform duration-200 ${
                      !ready
                        ? "border border-[var(--line)] bg-[var(--paper-deep)] text-[var(--ink-soft)]"
                        : "border border-white/30 bg-white/20 text-white group-hover:translate-x-1"
                    }`}
                  >
                    {loading ? (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      "→"
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={runAll}
                  disabled={!ready || loading}
                  className={`group flex w-full items-center justify-between rounded-xl border px-5 py-3.5 text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                    !ready
                      ? "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-soft)] cursor-not-allowed opacity-80"
                      : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] active:translate-y-0.5 cursor-pointer"
                  }`}
                >
                  <span className="font-mono text-[11px] tracking-wider">
                    Compare all 4 methods
                  </span>
                  <span
                    className={`mono rounded border px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      !ready
                        ? "border-[var(--line)] bg-[var(--paper-deep)] text-[var(--ink-soft)]"
                        : "border-[var(--line-strong)] bg-[var(--paper-deep)] text-[var(--accent)] group-hover:border-[var(--accent)]"
                    }`}
                  >
                    01—04
                  </span>
                </button>

                {!ready && (
                  <p className="px-2 text-center font-mono text-[10px] text-[var(--ink-soft)]">
                    Upload earlier and later frames to begin inspection.
                  </p>
                )}
              </div>
            </aside>

            {/* ─── RIGHT CANVAS: INSPECTION & RESULTS ─────────────── */}
            <section className="min-w-0">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
                <div>
                  <SectionLabel number="03">Change Report</SectionLabel>
                  <h2 className="font-editorial text-3xl sm:text-4xl">
                    Inspection Canvas
                    <span className="text-[var(--accent)] italic">.</span>
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    Visual comparison, quantified surface metrics, and exportable findings.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[10px] text-[var(--ink-soft)]">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      result
                        ? "bg-[var(--accent)]"
                        : loading
                          ? "animate-ping bg-[var(--gold)]"
                          : "bg-[var(--ink-soft)]/50"
                    }`}
                  />
                  {loading
                    ? "COMPUTING DELTA"
                    : result
                      ? "ANALYSIS READY"
                      : "AWAITING INPUT"}
                </div>
              </div>

              {/* Error Callout */}
              {error && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-[#bc682f] bg-[#f7ebe4] p-4 text-xs text-[#823315] dark:bg-[#25150f] dark:text-[#f2a585]"
                >
                  <span className="font-mono font-bold uppercase tracking-wider mr-2">
                    Analysis fault:
                  </span>
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!result ? (
                <div className="editorial-card flex min-h-[460px] flex-col items-center justify-center rounded-2xl p-8 sm:p-12 text-center">
                  <div className="relative mb-8 flex h-36 w-52 items-center justify-center">
                    <div className="absolute left-2 top-4 h-28 w-28 -rotate-6 rounded-xl border border-[var(--line-strong)] bg-[var(--paper-deep)] p-2 shadow-sm transition-transform duration-300 hover:rotate-0">
                      <div className="flex h-full items-end justify-center rounded bg-[var(--surface)] p-2">
                        <span className="h-8 w-8 rounded-full border border-[var(--line)] bg-[var(--accent)]/30" />
                        <span className="ml-1 h-14 w-12 rounded-t-lg bg-[var(--ink)]/40" />
                      </div>
                    </div>
                    <div className="absolute right-2 top-4 h-28 w-28 rotate-6 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-2 shadow-md transition-transform duration-300 hover:rotate-0">
                      <div className="relative flex h-full items-end justify-center rounded bg-[var(--surface-hover)] p-2">
                        <span className="h-8 w-8 rounded-full border border-[var(--line)] bg-[var(--gold)]/30" />
                        <span className="ml-1 h-12 w-12 rounded-t-lg bg-[var(--ink)]/60" />
                        <span className="absolute right-2 top-2 h-3.5 w-3.5 rounded-full border border-[var(--accent)] bg-[var(--accent)]/40 animate-ping" />
                      </div>
                    </div>
                    <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--paper)] font-mono text-xs text-[var(--ink)] shadow-md">
                      Δ
                    </span>
                  </div>

                  <p className="mono text-[var(--accent)]">
                    Calibrated &amp; Ready
                  </p>
                  <h3 className="mt-2.5 font-editorial text-2xl sm:text-3xl text-[var(--ink)]">
                    Two moments. One clearer picture.
                  </h3>
                  <p className="mt-3 max-w-md text-xs leading-relaxed text-[var(--ink-soft)]">
                    Upload your earlier and later scene captures on the left, choose a
                    mathematical profile, and let ATLAS pinpoint where the scene evolved.
                  </p>
                  <a
                    href="#workspace"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 font-mono text-[11px] text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
                  >
                    <span>Load source images</span>
                    <span>↑</span>
                  </a>
                </div>
              ) : (
                /* Results View */
                <div className="space-y-8">
                  {/* Metric Cards */}
                  <MetricCards result={result} />

                  {/* Visual Inspection Container */}
                  <div className="editorial-card rounded-2xl p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                      <div>
                        <p className="mono text-[var(--accent)]">
                          Visual inspection
                        </p>
                        <p className="font-editorial text-xl text-[var(--ink)]">
                          Spectral comparison view
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {(
                          [
                            ["Left frame", leftView, setLeftView],
                            ["Right frame", rightView, setRightView],
                          ] as const
                        ).map(([label, value, setter]) => (
                          <label
                            key={label}
                            className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 font-mono text-[11px] text-[var(--ink-soft)]"
                          >
                            <span>{label}:</span>
                            <select
                              value={value}
                              onChange={(e) => setter(e.target.value as ViewKey)}
                              className="editorial-select bg-transparent text-xs font-semibold text-[var(--ink)] outline-none cursor-pointer"
                            >
                              {(Object.keys(VIEW_LABELS) as ViewKey[]).map((v) => (
                                <option key={v} value={v}>
                                  {VIEW_LABELS[v]}
                                </option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Comparison Slider */}
                    <CompareSlider
                      left={sourceFor(leftView)}
                      right={sourceFor(rightView)}
                      leftLabel={VIEW_LABELS[leftView]}
                      rightLabel={VIEW_LABELS[rightView]}
                      width={result.width}
                      height={result.height}
                    />

                    {/* Export and Download Actions */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                      <div className="flex flex-wrap gap-2.5">
                        <a
                          href={result.images.overlay}
                          download="atlas-overlay.jpg"
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--ink)] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--paper)] transition hover:bg-[var(--accent)] hover:border-[var(--accent)]"
                        >
                          <span>Download overlay map</span>
                          <span>↓</span>
                        </a>
                        <button
                          type="button"
                          onClick={downloadJson}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
                        >
                          <span>Export results JSON</span>
                          <span>↓</span>
                        </button>
                      </div>

                      <span className="mono text-[10px] text-[var(--ink-soft)]">
                        RESOLUTION: {result.width} × {result.height} PX
                      </span>
                    </div>
                  </div>

                  {/* Multiple Runs Comparison Table */}
                  <div className="editorial-card rounded-2xl p-5 sm:p-6">
                    <div className="mb-4">
                      <p className="mono text-[var(--accent)]">
                        Multi-run evaluation
                      </p>
                      <p className="font-editorial text-xl text-[var(--ink)]">
                        Algorithm cross-comparison
                      </p>
                    </div>
                    <ComparisonTable
                      results={results}
                      activeKey={activeKey}
                      onSelect={setActiveKey}
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>

        {/* ─── METHODOLOGY SECTION ──────────────────────────────── */}
        <section
          id="method"
          className="shell border-t border-[var(--line)] py-16 lg:py-24"
          aria-labelledby="method-title"
        >
          <div className="mb-12 grid gap-6 md:grid-cols-[0.5fr_1fr_0.6fr] md:items-start">
            <div>
              <p className="section-number">04 / METHODOLOGY</p>
            </div>
            <div>
              <h2
                id="method-title"
                className="font-editorial text-4xl sm:text-5xl leading-tight"
              >
                Principles of<br />
                <em>temporal difference.</em>
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
              How ATLAS transforms raw raster pixels into actionable, calibrated
              change maps with zero hallucination.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01 / ALIGN",
                title: "Homography Registration",
                copy: "Feature matching using ORB keypoints and RANSAC homography corrects camera shifts, tilt, and optical rotation before any mathematical subtraction.",
              },
              {
                step: "02 / COMPARE",
                title: "Dual Signal Formulation",
                copy: "Absolute pixel intensity captures high-frequency edges, while structural similarity (SSIM) maps perceptual luminance and contrast alterations.",
              },
              {
                step: "03 / LOCALIZE",
                title: "Morphological Filtering",
                copy: "Otsu thresholding segments the fused gradient, followed by spatial dilation and erosion to isolate contiguous change clusters from sensor noise.",
              },
            ].map((col) => (
              <div
                key={col.step}
                className="editorial-card rounded-xl p-6 transition-all duration-200"
              >
                <p className="mono text-[var(--accent)] font-semibold">
                  {col.step}
                </p>
                <h3 className="mt-3 font-editorial text-2xl text-[var(--ink)]">
                  {col.title}
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">
                  {col.copy}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── SITE FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-[var(--line)] bg-[var(--paper)] py-10 transition-colors">
        <div className="shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-xs text-[var(--ink-soft)]">
          <div className="flex items-center gap-3">
            <MonogramMark />
            <div>
              <span className="font-editorial text-base font-semibold text-[var(--ink)]">
                ATLAS
              </span>
              <span className="mono block text-[9px] text-[var(--ink-soft)]">
                Temporal Change Intelligence
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 font-mono text-[11px]">
            <a
              href="#top"
              className="hover:text-[var(--ink)] hover:underline"
            >
              Top ↑
            </a>
            <a
              href="#workspace"
              className="hover:text-[var(--ink)] hover:underline"
            >
              Workspace
            </a>
            <a
              href="#method"
              className="hover:text-[var(--ink)] hover:underline"
            >
              Methodology
            </a>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--ink)] hover:underline"
            >
              API Docs ↗
            </a>
          </div>

          <div className="mono text-[10px] text-[var(--ink-soft)] sm:text-right">
            <span>25.2048° N · 55.2708° E</span>
            <span className="block mt-0.5 text-[9px] opacity-75">
              Calibrated for clarity, precision, and useful surprise.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
