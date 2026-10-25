"""Render result images and encode them for transport."""

from __future__ import annotations

import base64

import cv2
import numpy as np

def to_data_uri(image: np.ndarray, fmt: str = "png", quality: int = 85) -> str:
    """Encode an image as a data URI. JPEG for photos/heatmaps, PNG for binary masks."""
    if fmt == "jpeg":
        ok, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, quality])
        mime = "image/jpeg"
    else:
        ok, buffer = cv2.imencode(".png", image)
        mime = "image/png"
    if not ok:
        raise RuntimeError(f"{fmt} encoding failed.")
    return f"data:{mime};base64," + base64.b64encode(buffer.tobytes()).decode("ascii")

def render_heatmap(score: np.ndarray) -> np.ndarray:
    """JET heatmap. vmax has a floor so unchanged pairs don't amplify noise."""
    vmax = max(float(score.max()), 0.25)
    scaled = np.clip(score / vmax * 255.0, 0, 255).astype(np.uint8)
    return cv2.applyColorMap(scaled, cv2.COLORMAP_JET)


def render_mask(mask: np.ndarray) -> np.ndarray:
    return (mask * 255).astype(np.uint8)


def render_overlay(base: np.ndarray, mask: np.ndarray, alpha: float = 0.45) -> np.ndarray:
    """Translucent red fill + contour on top of the original image."""
    overlay = base.copy()
    overlay[mask > 0] = (0, 0, 255)
    blended = cv2.addWeighted(overlay, alpha, base, 1 - alpha, 0)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(blended, contours, -1, (0, 255, 255), 2)
    return blended