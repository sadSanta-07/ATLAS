"""Image decoding, size normalisation, registration and photometric correction."""

from __future__ import annotations

import cv2
import numpy as np


class ImageDecodeError(ValueError):
    """Raised when bytes cannot be decoded into an image."""


def decode_image(data: bytes) -> np.ndarray:
    """Decode raw bytes into a BGR uint8 image."""
    buffer = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise ImageDecodeError("File is not a valid or supported image.")
    return image


def limit_size(image: np.ndarray, max_side: int) -> np.ndarray:
    """Downscale so the longest side is <= max_side (never upscales)."""
    height, width = image.shape[:2]
    scale = max_side / max(height, width)
    if scale >= 1.0:
        return image
    new_size = (round(width * scale), round(height * scale))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def match_shapes(a: np.ndarray, b: np.ndarray, max_side: int) -> tuple[np.ndarray, np.ndarray]:
    """Bring both images to the same (bounded) resolution; B is resized to A."""
    a = limit_size(a, max_side)
    height, width = a.shape[:2]
    if b.shape[:2] != (height, width):
        b = cv2.resize(b, (width, height), interpolation=cv2.INTER_AREA)
    return a, b


def align_to_reference(
    moving: np.ndarray,
    reference: np.ndarray,
    max_features: int = 3000,
    min_inliers: int = 25,
) -> tuple[np.ndarray, bool, int]:
    """Register `moving` onto `reference` using ORB features + RANSAC homography.

    Returns (warped_image, success, inlier_count). On failure the original
    image is returned untouched so the pipeline degrades gracefully.
    """
    gray_ref = cv2.cvtColor(reference, cv2.COLOR_BGR2GRAY)
    gray_mov = cv2.cvtColor(moving, cv2.COLOR_BGR2GRAY)

    orb = cv2.ORB_create(nfeatures=max_features)
    kp_ref, des_ref = orb.detectAndCompute(gray_ref, None)
    kp_mov, des_mov = orb.detectAndCompute(gray_mov, None)
    if des_ref is None or des_mov is None:
        return moving, False, 0

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = sorted(matcher.match(des_mov, des_ref), key=lambda m: m.distance)
    matches = matches[: max(min_inliers, int(len(matches) * 0.6))]
    if len(matches) < min_inliers:
        return moving, False, 0

    src = np.float32([kp_mov[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
    dst = np.float32([kp_ref[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
    homography, inlier_mask = cv2.findHomography(src, dst, cv2.RANSAC, 3.0)
    if homography is None or inlier_mask is None:
        return moving, False, 0

    inliers = int(inlier_mask.sum())
    if inliers < min_inliers:
        return moving, False, inliers

    height, width = reference.shape[:2]
    warped = cv2.warpPerspective(
        moving, homography, (width, height), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    )
    return warped, True, inliers


def match_photometry(source: np.ndarray, reference: np.ndarray) -> np.ndarray:
    """Transfer reference illumination statistics onto `source` in LAB space.

    Uses median / MAD instead of mean / std so that a large genuinely-changed
    region does not bias the correction.
    """
    src = cv2.cvtColor(source, cv2.COLOR_BGR2LAB).astype(np.float32)
    ref = cv2.cvtColor(reference, cv2.COLOR_BGR2LAB).astype(np.float32)

    for c in range(3):
        s_med = np.median(src[..., c])
        r_med = np.median(ref[..., c])
        s_mad = np.median(np.abs(src[..., c] - s_med)) * 1.4826 + 1e-6
        r_mad = np.median(np.abs(ref[..., c] - r_med)) * 1.4826 + 1e-6
        src[..., c] = (src[..., c] - s_med) * (r_mad / s_mad) + r_med

    out = np.clip(src, 0, 255).astype(np.uint8)
    return cv2.cvtColor(out, cv2.COLOR_LAB2BGR)