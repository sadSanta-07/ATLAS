"""Procedural bi-temporal image pairs with exact ground-truth change masks.

Scenarios (ground truth is always expressed in image A's coordinate frame):
  object       a new object appears in B
  removal      an object present in A disappears in B
  brightness   B has a global + gradient illumination change AND a new object
  translation  B is slightly shifted/rotated (camera motion) AND has a new object
  noise        B has heavy sensor noise AND a new object
  unchanged    no real change (tests false-alarm rate)
  combined     illumination + camera motion + noise + new object (hardest)
"""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

SCENARIOS: tuple[str, ...] = (
    "object", "removal", "brightness", "translation", "noise", "unchanged", "combined",
)
BASE_NOISE_SIGMA = 2.0


def make_background(rng: np.random.Generator, h: int, w: int) -> np.ndarray:
    """Smooth colour field + clutter + fine texture (gives ORB plenty of features)."""
    coarse = rng.random((h // 48 + 2, w // 48 + 2, 3)).astype(np.float32)
    field = cv2.resize(coarse, (w, h), interpolation=cv2.INTER_CUBIC)
    canvas = np.clip(60 + field * 140, 0, 255).astype(np.uint8)

    for _ in range(70):
        center = (int(rng.integers(0, w)), int(rng.integers(0, h)))
        color = tuple(int(c) for c in rng.integers(30, 230, 3))
        thickness = int(rng.choice([-1, 2]))
        if rng.random() < 0.5:
            cv2.circle(canvas, center, int(rng.integers(5, 30)), color, thickness)
        else:
            half = int(rng.integers(5, 25))
            cv2.rectangle(canvas, (center[0] - half, center[1] - half),
                          (center[0] + half, center[1] + half), color, thickness)

    texture = cv2.GaussianBlur(rng.normal(0, 1, (h, w, 3)).astype(np.float32), (0, 0), 1.2) * 14
    return np.clip(canvas.astype(np.float32) + texture, 0, 255).astype(np.uint8)


def make_objects(rng: np.random.Generator, background: np.ndarray, count: int) -> tuple[np.ndarray, np.ndarray]:
    """Return (object colour layer, binary mask). Objects are forced to contrast with the background."""
    h, w = background.shape[:2]
    layer = np.zeros_like(background)
    mask = np.zeros((h, w), np.uint8)

    for _ in range(count):
        shape = np.zeros((h, w), np.uint8)
        cx = int(rng.integers(int(w * 0.15), int(w * 0.85)))
        cy = int(rng.integers(int(h * 0.15), int(h * 0.85)))
        if rng.random() < 0.5:
            axes = (int(rng.integers(20, 50)), int(rng.integers(20, 50)))
            cv2.ellipse(shape, (cx, cy), axes, float(rng.integers(0, 180)), 0, 360, 1, -1)
        else:
            sw, sh = int(rng.integers(30, 80)), int(rng.integers(30, 80))
            cv2.rectangle(shape, (cx - sw // 2, cy - sh // 2), (cx + sw // 2, cy + sh // 2), 1, -1)

        region = shape > 0
        bg_mean = background[region].mean(axis=0)
        color = rng.integers(20, 235, 3)
        for _try in range(10):  # enforce visible contrast
            if np.abs(color - bg_mean).mean() >= 50:
                break
            color = rng.integers(20, 235, 3)

        texture = rng.normal(0, 8, (h, w, 3))
        obj = np.clip(color + texture, 0, 255).astype(np.uint8)
        layer[region] = obj[region]
        mask |= shape

    return layer, mask


def apply_illumination(img: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Global gain + bias + horizontal lighting gradient."""
    h, w = img.shape[:2]
    gain = 1.0 + float(rng.choice([-1, 1])) * rng.uniform(0.15, 0.30)
    bias = rng.uniform(-25, 25)
    slope = rng.uniform(-0.15, 0.15)
    xs = np.linspace(-1, 1, w, dtype=np.float32)[None, :, None]
    out = img.astype(np.float32) * gain * (1.0 + slope * xs) + bias
    return np.clip(out, 0, 255).astype(np.uint8)


def apply_camera_motion(img: np.ndarray, rng: np.random.Generator,
                        max_px: float = 4.0, max_deg: float = 1.0) -> np.ndarray:
    h, w = img.shape[:2]
    tx = float(rng.choice([-1, 1])) * rng.uniform(2.0, max_px)
    ty = float(rng.choice([-1, 1])) * rng.uniform(2.0, max_px)
    angle = rng.uniform(-max_deg, max_deg)
    matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    matrix[:, 2] += (tx, ty)
    return cv2.warpAffine(img, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def add_noise(img: np.ndarray, rng: np.random.Generator, sigma: float) -> np.ndarray:
    return np.clip(img.astype(np.float32) + rng.normal(0, sigma, img.shape), 0, 255).astype(np.uint8)


def generate_pair(scenario: str, rng: np.random.Generator, h: int = 384, w: int = 512
                  ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return (image_a, image_b, ground_truth_mask in A's frame)."""
    if scenario not in SCENARIOS:
        raise ValueError(f"Unknown scenario {scenario!r}; choose from {SCENARIOS}")

    bg = make_background(rng, h, w)
    layer, mask = make_objects(rng, bg, int(rng.integers(1, 4)))
    with_obj = np.where(mask[..., None] > 0, layer, bg)
    zeros = np.zeros((h, w), np.uint8)
    noise_b = BASE_NOISE_SIGMA

    if scenario == "object":
        a, b, gt = bg, with_obj, mask
    elif scenario == "removal":
        a, b, gt = with_obj, bg, mask
    elif scenario == "brightness":
        a, b, gt = bg, apply_illumination(with_obj, rng), mask
    elif scenario == "translation":
        a, b, gt = bg, apply_camera_motion(with_obj, rng), mask
    elif scenario == "noise":
        a, b, gt = bg, with_obj, mask
        noise_b = 10.0
    elif scenario == "unchanged":
        a, b, gt = bg, bg, zeros
    else:  # combined
        a, b, gt = bg, apply_camera_motion(apply_illumination(with_obj, rng), rng), mask
        noise_b = 5.0

    return add_noise(a, rng, BASE_NOISE_SIGMA), add_noise(b, rng, noise_b), gt.copy()


def generate_dataset(out_root: Path, split: str, scenarios: tuple[str, ...], count: int,
                     seed: int, h: int = 384, w: int = 512) -> None:
    """Write out_root/split/scenario/{A,B,masks}/pair_XXX.png."""
    for s_idx, scenario in enumerate(scenarios):
        base = out_root / split / scenario
        for sub in ("A", "B", "masks"):
            (base / sub).mkdir(parents=True, exist_ok=True)
        for i in range(count):
            rng = np.random.default_rng([seed, s_idx, i])
            a, b, gt = generate_pair(scenario, rng, h, w)
            name = f"pair_{i:03d}.png"
            cv2.imwrite(str(base / "A" / name), a)
            cv2.imwrite(str(base / "B" / name), b)
            cv2.imwrite(str(base / "masks" / name), gt * 255)
        print(f"[{split}] {scenario}: {count} pairs -> {base}")