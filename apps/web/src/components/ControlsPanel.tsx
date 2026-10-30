"use client";

import { PRESETS } from "@/lib/presets";
import type { DetectionParams } from "@/lib/types";

interface Props {
  params: DetectionParams;
  activePreset: string | null;
  disabled: boolean;
  onPreset: (id: string) => void;
  onChange: (patch: Partial<DetectionParams>) => void;
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className={`block ${props.disabled ? "opacity-35 cursor-not-allowed" : ""}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-[var(--ink-soft)]">
        <span className="font-medium text-[var(--ink)]">{props.label}</span>
        <span className="rounded border border-[var(--line)] bg-[var(--paper-deep)] px-2 py-0.5 font-mono text-[10px] tabular-nums text-[var(--ink)]">
          {props.value}
        </span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="atlas-range w-full cursor-pointer disabled:cursor-not-allowed"
      />
    </label>
  );
}

function Toggle(props: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--line-strong)] accent-[var(--accent)]"
      />
      <div>
        <span className="block text-xs font-semibold tracking-tight text-[var(--ink)]">
          {props.label}
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--ink-soft)]">
          {props.hint}
        </span>
      </div>
    </label>
  );
}

export function ControlsPanel({
  params,
  activePreset,
  disabled,
  onPreset,
  onChange,
}: Props) {
  const otsu = params.threshold_mode === "otsu";

  return (
    <fieldset disabled={disabled} className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="mono text-[var(--accent)]">01 / Choose profile</h3>
          <span className="mono text-[10px] text-[var(--ink-soft)]">PRESETS</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((p, i) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p.id)}
                className={`group flex items-center gap-3.5 rounded-xl border p-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--surface-hover)] shadow-sm"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] border transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white font-bold"
                      : "border-[var(--line)] bg-[var(--paper-deep)] text-[var(--ink-soft)] group-hover:border-[var(--line-strong)]"
                  }`}
                >
                  0{i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-[var(--ink)]">
                    {p.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[var(--ink-soft)] leading-normal line-clamp-1">
                    {p.description}
                  </span>
                </span>
                <span
                  className={`font-mono text-sm transition-transform duration-200 ${
                    isActive
                      ? "text-[var(--accent)] translate-x-0"
                      : "text-[var(--ink-soft)] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-[var(--ink)]"
                  }`}
                >
                  ↗
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 border-t border-[var(--line)] pt-5">
        <div className="flex items-center justify-between">
          <h3 className="mono text-[var(--accent)]">02 / Fine tuning</h3>
          <span className="mono text-[10px] text-[var(--ink-soft)]">PARAMETERS</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[11px] font-medium text-[var(--ink)]">
            <span className="mono block text-[10px] text-[var(--ink-soft)] mb-1">
              Method
            </span>
            <select
              value={params.method}
              onChange={(e) =>
                onChange({ method: e.target.value as DetectionParams["method"] })
              }
              className="editorial-select w-full rounded-lg px-3 py-2 text-xs font-medium"
            >
              <option value="pixel">Pixel difference</option>
              <option value="ssim">Structural (SSIM)</option>
              <option value="hybrid">Hybrid fusion</option>
            </select>
          </label>

          <label className="block text-[11px] font-medium text-[var(--ink)]">
            <span className="mono block text-[10px] text-[var(--ink-soft)] mb-1">
              Threshold
            </span>
            <select
              value={params.threshold_mode}
              onChange={(e) =>
                onChange({
                  threshold_mode: e.target.value as DetectionParams["threshold_mode"],
                })
              }
              className="editorial-select w-full rounded-lg px-3 py-2 text-xs font-medium"
            >
              <option value="fixed">Fixed value</option>
              <option value="otsu">Otsu (automatic)</option>
            </select>
          </label>
        </div>

        <Slider
          label="Threshold τ"
          value={params.threshold}
          min={0.02}
          max={0.8}
          step={0.01}
          disabled={otsu}
          onChange={(v) => onChange({ threshold: v })}
        />

        <Slider
          label="Hybrid weight α (pixel share)"
          value={params.alpha}
          min={0}
          max={1}
          step={0.05}
          disabled={params.method !== "hybrid"}
          onChange={(v) => onChange({ alpha: v })}
        />

        <Slider
          label="Gaussian blur σ"
          value={params.blur_sigma}
          min={0}
          max={5}
          step={0.5}
          onChange={(v) => onChange({ blur_sigma: v })}
        />

        <Slider
          label="Morphology kernel"
          value={params.morph_kernel}
          min={1}
          max={21}
          step={2}
          onChange={(v) => onChange({ morph_kernel: v })}
        />

        <Slider
          label="Min region area (px)"
          value={params.min_area}
          min={0}
          max={2000}
          step={10}
          onChange={(v) => onChange({ min_area: v })}
        />

        <div className="space-y-2.5 pt-2">
          <Toggle
            label="Homography alignment"
            hint="ORB feature matching + RANSAC corrects camera viewpoint shift."
            checked={params.align}
            onChange={(v) => onChange({ align: v })}
          />
          <Toggle
            label="Photometric normalisation"
            hint="Equalizes global luminance between earlier and later frames."
            checked={params.photometric}
            onChange={(v) => onChange({ photometric: v })}
          />
        </div>
      </div>
    </fieldset>
  );
}
