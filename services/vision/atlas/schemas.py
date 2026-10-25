"""Pydantic models shared by the pipeline, experiments and the HTTP API."""

from typing import Literal

from pydantic import BaseModel, Field

Method = Literal["pixel", "ssim", "hybrid"]
ThresholdMode = Literal["fixed", "otsu"]


class DetectionParams(BaseModel):
    """All tunable knobs of a detection run. Every experiment logs one of these."""

    method: Method = "hybrid"
    threshold: float = Field(0.20, ge=0.0, le=1.0, description="Used when threshold_mode='fixed'")
    threshold_mode: ThresholdMode = "fixed"
    otsu_floor: float = Field(0.05, ge=0.0, le=1.0, description="Lower bound for the Otsu threshold")
    alpha: float = Field(0.5, ge=0.0, le=1.0, description="Hybrid weight on pixel difference")
    blur_sigma: float = Field(1.0, ge=0.0, le=10.0)
    morph_kernel: int = Field(5, ge=1, le=31)
    min_area: int = Field(50, ge=0, le=1_000_000)
    align: bool = False
    photometric: bool = False 


class Region(BaseModel):
    x: int
    y: int
    width: int
    height: int
    area_px: int


class AnalysisImages(BaseModel):
    heatmap: str
    mask: str  
    overlay: str
    aligned_b: str | None = None

class AnalysisResponse(BaseModel):
    params: DetectionParams
    width: int
    height: int
    changed_percent: float
    region_count: int
    regions: list[Region]
    threshold_used: float
    aligned: bool
    alignment_inliers: int
    runtime_ms: float
    images: AnalysisImages