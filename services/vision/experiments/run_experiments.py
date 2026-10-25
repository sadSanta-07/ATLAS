"""Tune on the validation split, evaluate on the test split, write CSVs.

python -m experiments.run_experiments --data data/synthetic --out outputs
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd

from atlas.detectors import combine, pixel_difference, ssim_dissimilarity
from atlas.metrics import evaluate
from atlas.pipeline import postprocess, preprocess, run_detection
from atlas.schemas import DetectionParams
from experiments.dataset import Pair, fit_gt, iter_pairs

# name -> overrides. M* are the main comparison, A* are ablations of the full system.
CONFIGS: dict[str, dict] = {
    "M1_pixel": dict(method="pixel"),
    "M2_ssim": dict(method="ssim"),
    "M3_hybrid": dict(method="hybrid"),
    "A1_hybrid+otsu": dict(method="hybrid", threshold_mode="otsu"),
    "A2_hybrid+photometric": dict(method="hybrid", photometric=True),
    "A3_hybrid+align": dict(method="hybrid", align=True),
    "M4_atlas_full": dict(method="hybrid", align=True, photometric=True, threshold_mode="otsu"),
}
ALPHAS = (0.25, 0.5, 0.75)
THRESHOLDS = tuple(round(float(t), 2) for t in np.arange(0.05, 0.61, 0.05))
OTSU_FLOORS = (0.05, 0.08, 0.10, 0.12, 0.15, 0.20)

Item = tuple[str, Pair]  # (scenario, pair)


def load_split(root: Path, split: str) -> list[Item]:
    items: list[Item] = []
    for scenario_dir in sorted(p for p in (root / split).iterdir() if p.is_dir()):
        items.extend((scenario_dir.name, pair) for pair in iter_pairs(scenario_dir))
    if not items:
        raise FileNotFoundError(f"No pairs found under {root / split}")
    return items


def tune(base: DetectionParams, val: list[Item]) -> tuple[DetectionParams, float]:
    """Grid-search alpha and (threshold or Otsu floor) maximising mean F1 on the validation split."""
    alphas = ALPHAS if base.method == "hybrid" else (base.alpha,)
    field, values = ("threshold", THRESHOLDS) if base.threshold_mode == "fixed" else ("otsu_floor", OTSU_FLOORS)
    f1_by_setting: dict[tuple[float, float], list[float]] = defaultdict(list)

    for _, pair in val:
        prepared = preprocess(pair.a, pair.b, base)
        d_p = pixel_difference(prepared.base, prepared.b, base.blur_sigma) if base.method != "ssim" else None
        d_s = ssim_dissimilarity(prepared.base, prepared.b, base.blur_sigma) if base.method != "pixel" else None
        for alpha in alphas:
            score = combine(base.method, d_p, d_s, alpha)
            for value in values:
                params = base.model_copy(update={"alpha": alpha, field: value})
                mask, _, _ = postprocess(score, params)
                f1_by_setting[(alpha, value)].append(evaluate(mask, fit_gt(pair.gt, mask.shape)).f1)

    best = max(f1_by_setting, key=lambda k: float(np.mean(f1_by_setting[k])))
    tuned = base.model_copy(update={"alpha": best[0], field: best[1]})
    return tuned, float(np.mean(f1_by_setting[best]))

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("data/synthetic"))
    parser.add_argument("--out", type=Path, default=Path("outputs"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    val, test = load_split(args.data, "val"), load_split(args.data, "test")
    print(f"validation pairs: {len(val)} | test pairs: {len(test)}")

    rows: list[dict] = []
    best_params: dict[str, dict] = {}

    for name, overrides in CONFIGS.items():
        tuned, val_f1 = tune(DetectionParams(**overrides), val)
        best_params[name] = {**tuned.model_dump(), "val_f1": round(val_f1, 4)}
        print(f"{name:24s} tuned alpha={tuned.alpha} tau={tuned.threshold} otsu_floor={tuned.otsu_floor} (val F1={val_f1:.3f})")

        for scenario, pair in test:
            result = run_detection(pair.a, pair.b, tuned)
            m = evaluate(result.mask, fit_gt(pair.gt, result.mask.shape))
            rows.append({
                "scenario": scenario, "config": name, "pair": pair.name,
                "precision": m.precision, "recall": m.recall, "f1": m.f1, "iou": m.iou,
                "changed_percent": result.changed_percent, "runtime_ms": result.runtime_ms,
                "aligned": result.aligned,
            })

    df = pd.DataFrame(rows)
    df.to_csv(args.out / "results_per_image.csv", index=False)
    (args.out / "best_params.json").write_text(json.dumps(best_params, indent=2))

    metrics = ["precision", "recall", "f1", "iou", "runtime_ms"]
    overall = df.assign(scenario="ALL")
    summary = (
        pd.concat([df, overall])
        .groupby(["scenario", "config"])[metrics]
        .agg(["mean", "std"])
        .round(4)
    )
    summary.to_csv(args.out / "summary.csv")

    pivot = pd.concat([df, overall]).pivot_table(index="config", columns="scenario", values="f1", aggfunc="mean")
    print("\nMean F1 on TEST split (rows: config, cols: scenario)")
    print(pivot.round(3).to_string())
    print(f"\nWrote results to {args.out.resolve()}")


if __name__ == "__main__":
    main()