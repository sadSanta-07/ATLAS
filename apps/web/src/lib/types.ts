export type Method = "pixel" | "ssim" | "hybrid";
export type ThresholdMode = "fixed" | "otsu";

export interface DetectionParams {
  method: Method;
  threshold: number;
  threshold_mode: ThresholdMode;
  alpha: number;
  blur_sigma: number;
  morph_kernel: number;
  min_area: number;
  align: boolean;
  photometric: boolean;
  otsu_floor: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  area_px: number;
}

export interface AnalysisImages {
  heatmap: string;
  mask: string;
  overlay: string;
  aligned_b: string | null;
}

export interface AnalysisResponse {
  params: DetectionParams;
  width: number;
  height: number;
  changed_percent: number;
  region_count: number;
  regions: Region[];
  threshold_used: number;
  aligned: boolean;
  alignment_inliers: number;
  runtime_ms: number;
  images: AnalysisImages;
}