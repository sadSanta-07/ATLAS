"""POST /api/v1/analyze: compare two uploaded images."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from atlas.config import MAX_UPLOAD_BYTES
from atlas.pipeline import run_detection
from atlas.preprocessing import ImageDecodeError, decode_image
from atlas.schemas import AnalysisImages, AnalysisResponse, DetectionParams, Method, ThresholdMode
from atlas.visualization import render_heatmap, render_mask, render_overlay, to_data_uri

router = APIRouter(tags=["analysis"])


async def _read_image(upload: UploadFile, label: str):
    data = await upload.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"{label} exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")
    try:
        return decode_image(data)
    except ImageDecodeError as exc:
        raise HTTPException(422, f"{label}: {exc}") from exc


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    image_a: Annotated[UploadFile, File(description="Earlier image")],
    image_b: Annotated[UploadFile, File(description="Later image")],
    method: Annotated[Method, Form()] = "hybrid",
    threshold: Annotated[float, Form(ge=0, le=1)] = 0.20,
    threshold_mode: Annotated[ThresholdMode, Form()] = "fixed",
    alpha: Annotated[float, Form(ge=0, le=1)] = 0.5,
    blur_sigma: Annotated[float, Form(ge=0, le=10)] = 1.0,
    morph_kernel: Annotated[int, Form(ge=1, le=31)] = 5,
    min_area: Annotated[int, Form(ge=0, le=1_000_000)] = 50,
    align: Annotated[bool, Form()] = False,
    photometric: Annotated[bool, Form()] = False,
        include_aligned: Annotated[bool, Form()] = False,
    otsu_floor: Annotated[float, Form(ge=0, le=1)] = 0.05,
) -> AnalysisResponse:
    params = DetectionParams(
        method=method,
        threshold=threshold,
        threshold_mode=threshold_mode,
        alpha=alpha,
        blur_sigma=blur_sigma,
        morph_kernel=morph_kernel,
        min_area=min_area,
        align=align,
        photometric=photometric,
        otsu_floor=otsu_floor,
    )
    img_a = await _read_image(image_a, "image_a")
    img_b = await _read_image(image_b, "image_b")

    result = await run_in_threadpool(run_detection, img_a, img_b, params)

    height, width = result.mask.shape
    return AnalysisResponse(
        params=params,
        width=width,
        height=height,
        changed_percent=round(result.changed_percent, 4),
        region_count=len(result.regions),
        regions=result.regions[:100],
        threshold_used=round(result.threshold_used, 4),
        aligned=result.aligned,
        alignment_inliers=result.alignment_inliers,
        runtime_ms=round(result.runtime_ms, 2),
        images=AnalysisImages(
            heatmap=to_data_uri(render_heatmap(result.score), "jpeg"),
            mask=to_data_uri(render_mask(result.mask)),
            overlay=to_data_uri(render_overlay(result.base, result.mask), "jpeg"),
            aligned_b=to_data_uri(result.aligned_b, "jpeg") if include_aligned else None,
        ),
    )