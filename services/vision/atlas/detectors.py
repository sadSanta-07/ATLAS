"""Per-pixel change-score maps. Every detector returns float32 in [0, 1]."""

from __future__ import annotations

from collections.abc import Callable

import cv2
import numpy as np
from skimage.metrics import structural_similarity

ScoreFn = Callable[[np.ndarray, np.ndarray, float, float], np.ndarray]

def combine(method: str, d_p: np.ndarray | None, d_s: np.ndarray | None, alpha: float) -> np.ndarray:
    """Fuse precomputed component maps. Lets experiments tune alpha without recomputing SSIM."""
    if method == "pixel":
        return d_p
    if method == "ssim":
        return d_s
    return (alpha * d_p + (1.0 - alpha) * d_s).astype(np.float32)

def _blur(image: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return image
    return cv2.GaussianBlur(image, (0, 0), sigma)


def pixel_difference(a: np.ndarray, b: np.ndarray, sigma: float = 1.0, alpha: float = 0.5) -> np.ndarray:
    """M1: mean absolute RGB difference after Gaussian smoothing, scaled by 255."""
    diff = np.abs(_blur(a, sigma).astype(np.float32) - _blur(b, sigma).astype(np.float32))
    return (diff.mean(axis=2) / 255.0).astype(np.float32)


def ssim_dissimilarity(a: np.ndarray, b: np.ndarray, sigma: float = 1.0, alpha: float = 0.5) -> np.ndarray:
    """M2: structural dissimilarity 1 - SSIM (Wang et al., 2004), clipped to [0, 1]."""
    gray_a = cv2.cvtColor(_blur(a, sigma), cv2.COLOR_BGR2GRAY)
    gray_b = cv2.cvtColor(_blur(b, sigma), cv2.COLOR_BGR2GRAY)
    _, ssim_map = structural_similarity(
        gray_a,
        gray_b,
        data_range=255,
        gaussian_weights=True,
        sigma=1.5,
        use_sample_covariance=False,
        full=True,
    )
    return np.clip(1.0 - ssim_map, 0.0, 1.0).astype(np.float32)


def hybrid(a: np.ndarray, b: np.ndarray, sigma: float = 1.0, alpha: float = 0.5) -> np.ndarray:
    """M3: D_h = alpha * D_p + (1 - alpha) * D_s."""
    d_p = pixel_difference(a, b, sigma)
    d_s = ssim_dissimilarity(a, b, sigma)
    return (alpha * d_p + (1.0 - alpha) * d_s).astype(np.float32)


DETECTORS: dict[str, ScoreFn] = {
    "pixel": pixel_difference,
    "ssim": ssim_dissimilarity,
    "hybrid": hybrid,
}