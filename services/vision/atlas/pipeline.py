"""End-to-end change-detection pipeline, split into stages so experiments can reuse them."""

from __future__ import annotations

import time
from dataclasses import dataclass

import numpy as np

from atlas import preprocessing as prep
from atlas.config import MAX_IMAGE_SIDE
from atlas.detectors import DETECTORS
from atlas.postprocessing import binarize, clean_mask
from atlas.schemas import DetectionParams, Region


@dataclass
class Prepared:
    base: np.ndarray  # image A after resizing
    b: np.ndarray  # image B after resize / alignment / photometric normalisation
    aligned: bool
    alignment_inliers: int


@dataclass
class DetectionResult:
    base: np.ndarray
    aligned_b: np.ndarray
    score: np.ndarray  # float32 [0, 1]
    mask: np.ndarray  # uint8 {0, 1}
    regions: list[Region]
    threshold_used: float
    aligned: bool
    alignment_inliers: int
    runtime_ms: float

    @property
    def changed_percent(self) -> float:
        return float(self.mask.mean() * 100.0)


def preprocess(
    image_a: np.ndarray, image_b: np.ndarray, params: DetectionParams, max_side: int = MAX_IMAGE_SIDE
) -> Prepared:
    a, b = prep.match_shapes(image_a, image_b, max_side)
    aligned, inliers = False, 0
    if params.align:
        b, aligned, inliers = prep.align_to_reference(b, a)
    if params.photometric:
        b = prep.match_photometry(b, a)
    return Prepared(a, b, aligned, inliers)


def postprocess(score: np.ndarray, params: DetectionParams) -> tuple[np.ndarray, list[Region], float]:
    raw_mask, used = binarize(score, params.threshold, params.threshold_mode, params.otsu_floor)
    mask, regions = clean_mask(raw_mask, params.morph_kernel, params.min_area)
    return mask, regions, used


def run_detection(
    image_a: np.ndarray, image_b: np.ndarray, params: DetectionParams, max_side: int = MAX_IMAGE_SIDE
) -> DetectionResult:
    """Full pipeline. Runtime covers everything after decoding."""
    start = time.perf_counter()
    prepared = preprocess(image_a, image_b, params, max_side)
    score = DETECTORS[params.method](prepared.base, prepared.b, params.blur_sigma, params.alpha)
    mask, regions, used = postprocess(score, params)
    runtime_ms = (time.perf_counter() - start) * 1000.0
    return DetectionResult(
        prepared.base, prepared.b, score, mask, regions, used,
        prepared.aligned, prepared.alignment_inliers, runtime_ms,
    )