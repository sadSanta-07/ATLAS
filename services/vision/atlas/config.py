"""Central configuration constants for the ATLAS vision service."""

MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024 
MAX_IMAGE_SIDE: int = 1024
ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

OTSU_FLOOR: float = 0.05