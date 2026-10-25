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
      <div className="mb-2 flex justify-between gap-3 text-[11px] text-[#777583]">
        <span>{props.label}</span>
        <span className="rounded-md bg-[#f0eeff] px-2 py-0.5 font-mono text-[10px] text-[#4e4a68]">{props.value}</span>
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

function Toggle(props: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-[#e2e0ef] bg-white/70 p-3 transition hover:border-[#c9c0ff]">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#7565d8]"
      />
      <span>
        <span className="block text-xs font-semibold text-[#292642]">{props.label}</span>
        <span className="mt-1 block text-[10px] leading-4 text-[#777583]">{props.hint}</span>
      </span>
    </label>
  );
}

export function ControlsPanel({ params, activePreset, disabled, onPreset, onChange }: Props) {
  const otsu = params.threshold_mode === "otsu";

  return (
    <fieldset disabled={disabled} className="space-y-6">
      <div>
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#77786e]">01 / Choose a profile</h3>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p.id)}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                activePreset === p.id
                  ? "border-[#a99aff] bg-[#f3f0ff] shadow-[inset_3px_0_0_#84963d]"
                  : "border-[#e2e0ef] bg-white/60 hover:border-[#c9c0ff] hover:bg-white"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] ${activePreset === p.id ? "bg-[#e2ddff] text-[#5b4ca4]" : "bg-[#f0eeff] text-[#777583]"}`}>0{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#303127]">{p.label}</span>
                <span className="mt-1 block text-[10px] leading-4 text-[#838477]">{p.description}</span>
              </span>
              <span className={`text-sm transition ${activePreset === p.id ? "translate-x-0 text-[#7565d8]" : "-translate-x-1 text-[#b1b2a7] opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}>↗</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 border-t border-[#e9e8f2] pt-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#77786e]">02 / Fine tuning</h3>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-[10px] font-medium text-[#77786e]">
            Method
            <select
              value={params.method}
              onChange={(e) => onChange({ method: e.target.value as DetectionParams["method"] })}
              className="atlas-select mt-2 w-full rounded-xl border border-[#e9e8f2] bg-white px-3 py-2.5 text-xs font-medium text-[#303127] outline-none transition focus:border-[#a99aff]"
            >
              <option value="pixel">Pixel</option>
              <option value="ssim">SSIM</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="block text-[10px] font-medium text-[#77786e]">
            Threshold
            <select
              value={params.threshold_mode}
              onChange={(e) => onChange({ threshold_mode: e.target.value as DetectionParams["threshold_mode"] })}
              className="atlas-select mt-2 w-full rounded-xl border border-[#e9e8f2] bg-white px-3 py-2.5 text-xs font-medium text-[#303127] outline-none transition focus:border-[#a99aff]"
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

        <div className="space-y-2.5">
          <Toggle label="Align images" hint="ORB + RANSAC homography fixes camera movement."
            checked={params.align} onChange={(v) => onChange({ align: v })} />
          <Toggle label="Photometric normalisation" hint="Matches lighting of image B to image A."
            checked={params.photometric} onChange={(v) => onChange({ photometric: v })} />
        </div>
      </div>
    </fieldset>
  );
}
