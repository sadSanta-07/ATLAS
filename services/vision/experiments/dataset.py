"""Loading A / B / mask triplets from disk."""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


@dataclass(frozen=True)
class Pair:
    name: str
    a: np.ndarray
    b: np.ndarray
    gt: np.ndarray  # uint8 {0, 1}


def iter_pairs(root: Path, mask_dir: str = "masks") -> Iterator[Pair]:
    """Yield pairs whose A, B and mask files share a filename."""
    for path_a in sorted((root / "A").glob("*.png")):
        path_b = root / "B" / path_a.name
        path_m = root / mask_dir / path_a.name
        if not (path_b.exists() and path_m.exists()):
            raise FileNotFoundError(f"Missing B or mask for {path_a.name} under {root}")
        a, b = cv2.imread(str(path_a)), cv2.imread(str(path_b))
        gt = cv2.imread(str(path_m), cv2.IMREAD_GRAYSCALE)
        if a is None or b is None or gt is None:
            raise ValueError(f"Could not read {path_a.name}")
        yield Pair(path_a.stem, a, b, (gt > 127).astype(np.uint8))


def fit_gt(gt: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    """Resize ground truth (nearest) if the pipeline downscaled the images."""
    if gt.shape == shape:
        return gt
    return cv2.resize(gt, (shape[1], shape[0]), interpolation=cv2.INTER_NEAREST)