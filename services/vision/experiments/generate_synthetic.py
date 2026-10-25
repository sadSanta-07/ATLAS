"""CLI: python -m experiments.generate_synthetic --out data/synthetic --split val --count 15 --seed 1000"""

import argparse
from pathlib import Path

from experiments.synthetic import SCENARIOS, generate_dataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the ATLAS synthetic benchmark.")
    parser.add_argument("--out", type=Path, default=Path("data/synthetic"))
    parser.add_argument("--split", choices=["val", "test"], required=True)
    parser.add_argument("--count", type=int, default=15, help="pairs per scenario")
    parser.add_argument("--seed", type=int, required=True, help="use different seeds for val and test")
    parser.add_argument("--scenario", choices=[*SCENARIOS, "all"], default="all")
    args = parser.parse_args()

    scenarios = SCENARIOS if args.scenario == "all" else (args.scenario,)
    generate_dataset(args.out, args.split, scenarios, args.count, args.seed)


if __name__ == "__main__":
    main()