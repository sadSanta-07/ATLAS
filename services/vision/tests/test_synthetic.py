import numpy as np
import pytest

from experiments.synthetic import SCENARIOS, generate_pair


@pytest.mark.parametrize("scenario", SCENARIOS)
def test_pair_shapes_and_ground_truth(scenario):
    a, b, gt = generate_pair(scenario, np.random.default_rng(0), 192, 256)
    assert a.shape == b.shape == (192, 256, 3)
    assert gt.shape == (192, 256)
    assert set(np.unique(gt)) <= {0, 1}
    assert (gt.sum() == 0) == (scenario == "unchanged")


def test_generation_is_deterministic():
    a1, _, _ = generate_pair("object", np.random.default_rng(7), 128, 128)
    a2, _, _ = generate_pair("object", np.random.default_rng(7), 128, 128)
    assert np.array_equal(a1, a2)