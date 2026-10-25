"""ATLAS vision service entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from atlas.config import ALLOWED_ORIGINS
from routers.analyze import router as analyze_router

app = FastAPI(
    title="ATLAS Vision API",
    version="0.1.0",
    description="Temporal image change detection: pixel, SSIM and hybrid detectors.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api/v1")


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "atlas-vision", "version": app.version}