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
    <label className={`block ${props.disabled ? "opacity-40" : ""}`}>
      <div className="mb-1 flex justify-between text-xs text-neutral-400">
        <span>{props.label}</span>
        <span className="font-mono text-neutral-200">{props.value}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full accent-cyan-400"
      />
    </label>
  );
}

function Toggle(props: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-neutral-900 p-3">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="mt-1 accent-cyan-400"
      />
      <span>
        <span className="block text-sm">{props.label}</span>
        <span className="block text-xs text-neutral-500">{props.hint}</span>
      </span>
    </label>
  );
}

export function ControlsPanel({ params, activePreset, disabled, onPreset, onChange }: Props) {
  const otsu = params.threshold_mode === "otsu";

  return (
    <fieldset disabled={disabled} className="space-y-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Presets</h3>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                activePreset === p.id
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
              }`}
            >
              <span className="block text-sm font-medium">{p.label}</span>
              <span className="block text-xs text-neutral-500">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Fine tuning</h3>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs text-neutral-400">
            Method
            <select
              value={params.method}
              onChange={(e) => onChange({ method: e.target.value as DetectionParams["method"] })}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
            >
              <option value="pixel">Pixel</option>
              <option value="ssim">SSIM</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="block text-xs text-neutral-400">
            Threshold
            <select
              value={params.threshold_mode}
              onChange={(e) => onChange({ threshold_mode: e.target.value as DetectionParams["threshold_mode"] })}
              className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
            >
              <option value="fixed">Fixed</option>
              <option value="otsu">Otsu (auto)</option>
            </select>
          </label>
        </div>

        <Slider label="Threshold τ" value={params.threshold} min={0.02} max={0.8} step={0.01} disabled={otsu}
          onChange={(v) => onChange({ threshold: v })} />
        <Slider label="Hybrid weight α (pixel share)" value={params.alpha} min={0} max={1} step={0.05}
          disabled={params.method !== "hybrid"} onChange={(v) => onChange({ alpha: v })} />
        <Slider label="Blur σ" value={params.blur_sigma} min={0} max={5} step={0.5}
          onChange={(v) => onChange({ blur_sigma: v })} />
        <Slider label="Morphology kernel" value={params.morph_kernel} min={1} max={21} step={2}
          onChange={(v) => onChange({ morph_kernel: v })} />
        <Slider label="Min region area (px)" value={params.min_area} min={0} max={2000} step={10}
          onChange={(v) => onChange({ min_area: v })} />

        <Toggle label="Align images" hint="ORB + RANSAC homography fixes camera movement."
          checked={params.align} onChange={(v) => onChange({ align: v })} />
        <Toggle label="Photometric normalisation" hint="Matches lighting of image B to image A."
          checked={params.photometric} onChange={(v) => onChange({ photometric: v })} />
      </div>
    </fieldset>
  );
}