"""Thresholding, morphological clean-up and connected-region extraction."""

from __future__ import annotations

import cv2
import numpy as np

from atlas.config import OTSU_FLOOR
from atlas.schemas import Region, ThresholdMode


def binarize(
    score: np.ndarray, threshold: float, mode: ThresholdMode, otsu_floor: float = OTSU_FLOOR
) -> tuple[np.ndarray, float]:
    """Return (uint8 mask in {0,1}, threshold actually used)."""
    used = threshold
    if mode == "otsu":
        score_u8 = np.clip(score * 255.0, 0, 255).astype(np.uint8)
        otsu_value, _ = cv2.threshold(score_u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        used = max(float(otsu_value) / 255.0, otsu_floor)
    return (score > used).astype(np.uint8), used


def clean_mask(mask: np.ndarray, kernel_size: int, min_area: int) -> tuple[np.ndarray, list[Region]]:
    """Open + close, drop tiny components, and describe what remains."""
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    cleaned = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

    count, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned, connectivity=8)
    keep_ids = [i for i in range(1, count) if stats[i, cv2.CC_STAT_AREA] >= min_area]

    final = np.isin(labels, keep_ids).astype(np.uint8)
    regions = [
        Region(
            x=int(stats[i, cv2.CC_STAT_LEFT]),
            y=int(stats[i, cv2.CC_STAT_TOP]),
            width=int(stats[i, cv2.CC_STAT_WIDTH]),
            height=int(stats[i, cv2.CC_STAT_HEIGHT]),
            area_px=int(stats[i, cv2.CC_STAT_AREA]),
        )
        for i in keep_ids
    ]
    regions.sort(key=lambda r: r.area_px, reverse=True)
    return final, regions