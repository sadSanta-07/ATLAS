"""Turn experiment outputs into paper figures and tables.

python -m experiments.make_figures --data data/synthetic --out outputs
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

from atlas.pipeline import run_detection
from atlas.schemas import DetectionParams
from atlas.visualization import render_overlay
from experiments.dataset import fit_gt, iter_pairs

MAIN = ["M1_pixel", "M2_ssim", "M3_hybrid", "M4_atlas_full"]
LABELS = {
    "M1_pixel": "M1 Pixel diff.",
    "M2_ssim": "M2 SSIM",
    "M3_hybrid": "M3 Hybrid",
    "M4_atlas_full": "M4 ATLAS (full)",
    "A1_hybrid+otsu": "Hybrid + Otsu",
    "A2_hybrid+photometric": "Hybrid + photometric",
    "A3_hybrid+align": "Hybrid + align",
}
SCENARIO_ORDER = ["object", "removal", "noise", "brightness", "translation", "combined", "unchanged"]
DPI = 200


def fig_main(df: pd.DataFrame, fig_dir: Path) -> None:
    """Grouped bars: F1 per scenario for the four main methods."""
    sub = df[df.config.isin(MAIN)]
    pivot = sub.pivot_table(index="scenario", columns="config", values="f1", aggfunc="mean")
    pivot = pivot.reindex(SCENARIO_ORDER)[MAIN]
    pivot.loc["overall"] = sub.groupby("config")["f1"].mean()[MAIN]

    ax = pivot.plot.bar(figsize=(9, 4.2), width=0.8)
    ax.set_ylabel("Mean F1 (test split)")
    ax.set_xlabel("")
    ax.set_ylim(0, 1.05)
    ax.legend([LABELS[c] for c in MAIN], ncol=4, loc="lower center", fontsize=8)
    ax.grid(axis="y", alpha=0.3)
    plt.xticks(rotation=25, ha="right")
    plt.tight_layout()
    plt.savefig(fig_dir / "fig_main_f1_by_scenario.png", dpi=DPI)
    plt.close()


def fig_ablation(df: pd.DataFrame, fig_dir: Path) -> None:
    """Horizontal bars: overall F1 of every configuration, with 95% CI."""
    g = df.groupby("config")["f1"]
    means = g.mean()
    ci = 1.96 * g.std() / g.count() ** 0.5
    order = means.sort_values().index
    fig, ax = plt.subplots(figsize=(7, 3.6))
    ax.barh([LABELS[c] for c in order], means[order], xerr=ci[order], color="#2a9d8f", capsize=3)
    ax.set_xlabel("Overall mean F1 (test split, 95% CI)")
    ax.set_xlim(0, 1.05)
    ax.grid(axis="x", alpha=0.3)
    plt.tight_layout()
    plt.savefig(fig_dir / "fig_ablation.png", dpi=DPI)
    plt.close()


def fig_cost(df: pd.DataFrame, fig_dir: Path) -> None:
    """Accuracy vs runtime trade-off."""
    g = df.groupby("config").agg(f1=("f1", "mean"), runtime=("runtime_ms", "mean"))
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.scatter(g.runtime, g.f1, s=60, color="#e76f51")
    for cfg, row in g.iterrows():
        ax.annotate(LABELS[cfg], (row.runtime, row.f1), textcoords="offset points", xytext=(6, 4), fontsize=7)
    ax.set_xlabel("Mean runtime per image pair (ms)")
    ax.set_ylabel("Overall mean F1")
    ax.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(fig_dir / "fig_accuracy_vs_runtime.png", dpi=DPI)
    plt.close()


def fig_qualitative(data: Path, best: dict, fig_dir: Path, scenario: str, index: int = 0) -> None:
    """A, B, ground truth and the four methods' detections on one test pair."""
    pairs = list(iter_pairs(data / "test" / scenario))
    pair = pairs[index]
    panels: list[tuple[str, object]] = [
        ("Image A", pair.a),
        ("Image B", pair.b),
        ("Ground truth", render_overlay(pair.a, pair.gt)),
    ]
    for name in MAIN:
        settings = {k: v for k, v in best[name].items() if k != "val_f1"}
        result = run_detection(pair.a, pair.b, DetectionParams(**settings))
        panels.append((LABELS[name], render_overlay(result.base, result.mask)))

    fig, axes = plt.subplots(2, 4, figsize=(12, 5))
    for ax in axes.ravel():
        ax.axis("off")
    for ax, (title, image) in zip(axes.ravel(), panels):
        ax.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        ax.set_title(title, fontsize=9)
    fig.suptitle(f"Scenario: {scenario} ({pair.name})", fontsize=10)
    plt.tight_layout()
    plt.savefig(fig_dir / f"fig_qualitative_{scenario}.png", dpi=DPI)
    plt.close()


def table_overall(df: pd.DataFrame, out: Path) -> None:
    rows = []
    for cfg, g in df.groupby("config"):
        row = {"config": LABELS[cfg]}
        for m in ("precision", "recall", "f1", "iou"):
            row[m] = f"{g[m].mean():.3f} ± {g[m].std():.3f}"
        row["runtime_ms"] = f"{g['runtime_ms'].mean():.0f}"
        rows.append(row)
    table = pd.DataFrame(rows)
    table.to_csv(out / "table_overall.csv", index=False)
    print(table.to_string(index=False))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=Path("data/synthetic"))
    parser.add_argument("--out", type=Path, default=Path("outputs"))
    args = parser.parse_args()

    fig_dir = args.out / "figures"
    fig_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.out / "results_per_image.csv")
    best = json.loads((args.out / "best_params.json").read_text())

    fig_main(df, fig_dir)
    fig_ablation(df, fig_dir)
    fig_cost(df, fig_dir)
    for scenario in ("translation", "brightness", "combined", "unchanged"):
        fig_qualitative(args.data, best, fig_dir, scenario)
    table_overall(df, args.out)
    print(f"\nFigures written to {fig_dir.resolve()}")


if __name__ == "__main__":
    main()