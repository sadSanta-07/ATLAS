"""Pixel-level evaluation metrics against a ground-truth change mask."""

from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np


@dataclass(frozen=True)
class Metrics:
    precision: float
    recall: float
    f1: float
    iou: float
    accuracy: float
    tp: int
    fp: int
    fn: int
    tn: int

    def as_dict(self) -> dict[str, float | int]:
        return asdict(self)


def evaluate(prediction: np.ndarray, ground_truth: np.ndarray) -> Metrics:
    """Compute confusion-matrix metrics.

    Convention for degenerate cases (documented for the paper): if both the
    prediction and the ground truth contain no changed pixels, precision,
    recall, F1 and IoU are defined as 1.0 (a perfect "no change" answer).
    """
    if prediction.shape != ground_truth.shape:
        raise ValueError(f"Shape mismatch: {prediction.shape} vs {ground_truth.shape}")

    pred = prediction.astype(bool)
    gt = ground_truth.astype(bool)

    tp = int(np.logical_and(pred, gt).sum())
    fp = int(np.logical_and(pred, ~gt).sum())
    fn = int(np.logical_and(~pred, gt).sum())
    tn = int(np.logical_and(~pred, ~gt).sum())

    if tp + fp + fn == 0:
        precision = recall = f1 = iou = 1.0
    else:
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
        iou = tp / (tp + fp + fn)

    accuracy = (tp + tn) / pred.size
    return Metrics(precision, recall, f1, iou, accuracy, tp, fp, fn, tn)