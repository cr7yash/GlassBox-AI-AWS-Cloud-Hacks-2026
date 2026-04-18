"""Chaos scenario switches (§6.4).

Each scenario is a pure function ``(state, step) → state`` that mutates the
simulation state dict to inject the expected failure signature.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from simulator.schemas import Scenario


def _apply_normal(state: dict[str, Any], step: int) -> dict[str, Any]:
    """No-op — happy path."""
    return state


def _apply_price_spike(state: dict[str, Any], step: int) -> dict[str, Any]:
    """At step 5, set grid price to 3× baseline. Sustained."""
    if step >= 5:
        # Capture baseline once, then set (not multiply) to avoid compounding
        if "_baseline_grid_price" not in state:
            state["_baseline_grid_price"] = state["grid_price_usd_mwh"]
        state["grid_price_usd_mwh"] = state["_baseline_grid_price"] * 3.0
    return state


def _apply_sensor_fail(state: dict[str, Any], step: int) -> dict[str, Any]:
    """At step 8, inside_temp_f reads an impossible 250 °F."""
    if step >= 8:
        state["inside_temp_f"] = 250.0
    return state


def _apply_api_broken(state: dict[str, Any], step: int) -> dict[str, Any]:
    """After step 3, flag that HVAC tool calls should raise errors."""
    if step > 3:
        state["_hvac_broken"] = True
    return state


def _apply_heat_wave(state: dict[str, Any], step: int) -> dict[str, Any]:
    """Outside temp ramps from 95 → 118 °F over steps 1–10."""
    if 1 <= step <= 10:
        progress = (step - 1) / 9  # 0.0 → 1.0
        state["outside_temp_f"] = 95.0 + progress * 23.0
    elif step > 10:
        state["outside_temp_f"] = 118.0
    return state


_SCENARIO_FNS = {
    Scenario.NORMAL: _apply_normal,
    Scenario.PRICE_SPIKE: _apply_price_spike,
    Scenario.SENSOR_FAIL: _apply_sensor_fail,
    Scenario.API_BROKEN: _apply_api_broken,
    Scenario.HEAT_WAVE: _apply_heat_wave,
}


def apply_scenario(
    state: dict[str, Any],
    scenario: Scenario,
    step: int,
) -> dict[str, Any]:
    """Apply the chaos switch for *scenario* at the given *step*.

    Returns a **shallow copy** so callers keep the original if needed.
    """
    mutated = deepcopy(state)
    fn = _SCENARIO_FNS[scenario]
    return fn(mutated, step)
