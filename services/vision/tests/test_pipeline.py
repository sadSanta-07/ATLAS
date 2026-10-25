import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from atlas.metrics import evaluate
from atlas.pipeline import run_detection
from atlas.schemas import DetectionParams
from main import app


@pytest.fixture()
def scene() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Textured scene, a copy with a bright square inserted, and the exact GT mask."""
    rng = np.random.default_rng(42)
    base = cv2.GaussianBlur(rng.integers(60, 180, (240, 320, 3), dtype=np.uint8), (0, 0), 3)
    changed = base.copy()
    changed[80:150, 100:190] = (250, 250, 250)
    gt = np.zeros(base.shape[:2], dtype=np.uint8)
    gt[80:150, 100:190] = 1
    return base, changed, gt


@pytest.mark.parametrize("method", ["pixel", "ssim", "hybrid"])
def test_detects_inserted_object(scene, method):
    base, changed, gt = scene
    result = run_detection(base, changed, DetectionParams(method=method))
    assert evaluate(result.mask, gt).iou > 0.6


def test_identical_images_yield_no_change(scene):
    base, _, _ = scene
    result = run_detection(base, base.copy(), DetectionParams())
    assert result.mask.sum() == 0


def test_metrics_perfect_and_degenerate():
    gt = np.zeros((10, 10), dtype=np.uint8)
    gt[2:5, 2:5] = 1
    assert evaluate(gt, gt).f1 == 1.0
    assert evaluate(np.zeros_like(gt), np.zeros_like(gt)).iou == 1.0
    assert evaluate(np.zeros_like(gt), gt).recall == 0.0


def test_api_health_and_rejects_bad_upload():
    client = TestClient(app)
    assert client.get("/health").json()["status"] == "ok"
    response = client.post(
        "/api/v1/analyze",
        files={"image_a": ("a.png", b"not an image", "image/png"), "image_b": ("b.png", b"nope", "image/png")},
    )
    assert response.status_code == 422