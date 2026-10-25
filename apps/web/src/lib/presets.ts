import type { DetectionParams } from "./types";

export const DEFAULT_PARAMS: DetectionParams = {
  method: "hybrid",
  threshold: 0.2,
  threshold_mode: "fixed",
  alpha: 0.5,
  blur_sigma: 1.0,
  morph_kernel: 5,
  min_area: 50,
  align: false,
  photometric: false,
  otsu_floor: 0.05,
};

export interface Preset {
  id: string;
  label: string;
  description: string;
  params: DetectionParams;
}

export const PRESETS: Preset[] = [
  {
    id: "pixel",
    label: "M1 · Pixel difference",
    description: "Baseline: absolute intensity difference.",
    params: { ...DEFAULT_PARAMS, method: "pixel", threshold: 0.2 },
  },
  {
    id: "ssim",
    label: "M2 · SSIM",
    description: "Structural dissimilarity (1 − SSIM).",
    params: { ...DEFAULT_PARAMS, method: "ssim", threshold: 0.1 },
  },
  {
    id: "hybrid",
    label: "M3 · Hybrid",
    description: "Weighted fusion of pixel and SSIM maps.",
    params: { ...DEFAULT_PARAMS, method: "hybrid", alpha: 0.75, threshold: 0.2 },
  },
  {
    id: "atlas",
    label: "M4 · ATLAS full",
    description: "Hybrid + alignment + photometric normalisation + Otsu.",
    params: {
      ...DEFAULT_PARAMS,
      method: "hybrid",
      alpha: 0.75,
      threshold_mode: "otsu",
      align: true,
      photometric: true,
    },
  },
];

export const PRESET_LABELS: Record<string, string> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p.label]),
);