"""Paired Wilcoxon signed-rank tests: is M4 better than each baseline on the same test pairs?

python -m experiments.significance --out outputs_v2
"""

import argparse
from pathlib import Path

import pandas as pd
from scipy.stats import wilcoxon


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("outputs"))
    args = parser.parse_args()

    df = pd.read_csv(args.out / "results_per_image.csv")
    wide = df.pivot_table(index=["scenario", "pair"], columns="config", values="f1")
    for baseline in ("M1_pixel", "M2_ssim", "M3_hybrid", "A3_hybrid+align"):
        result = wilcoxon(wide["M4_atlas_full"], wide[baseline])
        delta = (wide["M4_atlas_full"] - wide[baseline]).mean()
        print(f"M4 vs {baseline:16s} mean dF1 = {delta:+.3f}   p = {result.pvalue:.2e}   n = {len(wide)}")


if __name__ == "__main__":
    main()