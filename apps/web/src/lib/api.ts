import type { AnalysisResponse, DetectionParams } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export async function analyze(
  imageA: File,
  imageB: File,
  params: DetectionParams,
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  const form = new FormData();
  form.append("image_a", imageA);
  form.append("image_b", imageB);
  for (const [key, value] of Object.entries(params)) {
    form.append(key, String(value));
  }
  form.append("include_aligned", String(params.align || params.photometric));

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1/analyze`, { method: "POST", body: form, signal });
  } catch {
    throw new Error(`Cannot reach the vision API at ${API_URL}. Is uvicorn running?`);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* keep statusText */
    }
    throw new Error(detail);
  }
  return response.json();
}