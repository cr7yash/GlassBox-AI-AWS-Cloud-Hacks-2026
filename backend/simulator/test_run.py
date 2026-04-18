#!/usr/bin/env python3
"""Standalone test run — no UI, no API Gateway, just Bedrock calls.

Simulates a few steps and prints the manager's decisions to verify the
Bedrock integration works end-to-end.

Usage:
    cd backend
    python -m simulator.test_run --stadium lusail --scenario heat_wave --steps 3
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys

# Ensure parent directory is on path when run as script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simulator.bedrock_manager import invoke_manager
from simulator.impact import compute_impact
from simulator.scenarios import apply_scenario
from simulator.schemas import Scenario
from simulator.stadiums import CLIMATE_CURVES, GRID_CURVES, get_stadium

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def test_run(stadium_id: str, scenario: Scenario, steps: int) -> None:
    """Run N simulation steps and print results."""
    stadium = get_stadium(stadium_id)
    print(f"\n{'='*60}")
    print(f"Stadium: {stadium.name} ({stadium.country})")
    print(f"Capacity: {stadium.capacity:,}")
    print(f"Scenario: {scenario.value}")
    print(f"Steps: {steps}")
    print(f"{'='*60}\n")

    # Initial state
    state = {
        "outside_temp_f": 95.0,
        "inside_temp_f": 74.0,
        "attendance": int(stadium.capacity * 0.85),
        "grid_price_usd_mwh": stadium.baseline_energy_rate_usd_mwh,
        "grid_co2_g_kwh": stadium.baseline_co2_g_kwh,
        "hvac_state": "cooling_73",
        "lighting_state": "full",
        "_hvac_broken": False,
    }

    for step in range(steps):
        print(f"--- Step {step} ---")

        # Apply scenario chaos
        state = apply_scenario(state, scenario, step)

        # Build observation
        obs = {
            "outside_temp_f": round(state["outside_temp_f"], 1),
            "inside_temp_f": round(state["inside_temp_f"], 1),
            "attendance": state["attendance"],
            "grid_price_usd_mwh": round(state["grid_price_usd_mwh"], 2),
            "grid_co2_g_kwh": round(state["grid_co2_g_kwh"], 1),
            "hvac_state": state["hvac_state"],
            "lighting_state": state["lighting_state"],
        }
        print(f"Observation: {json.dumps(obs, indent=2)}")

        # Call Bedrock Manager
        print("Calling Bedrock Manager...")
        try:
            from simulator.schemas import Observation as ObsModel
            observation = ObsModel(**obs)
            manager_output, tokens, latency_ms, guardrail_blocked, guardrail_intervention = (
                await asyncio.to_thread(
                    invoke_manager,
                    stadium,
                    observation,
                    guardrail_id=os.getenv("GUARDRAIL_ID"),
                    guardrail_version=os.getenv("GUARDRAIL_VERSION"),
                )
            )

            print(f"Thought: {manager_output.thought[:200]}..." if len(manager_output.thought) > 200 else f"Thought: {manager_output.thought}")
            print(f"Action: {manager_output.action.tool}({manager_output.action.args})")
            print(f"Tokens: {tokens.input} in / {tokens.output} out | Latency: {latency_ms}ms")
            if guardrail_blocked:
                print(f"⚠️  GUARDRAIL BLOCKED: {guardrail_intervention}")

            # Compute impact
            impact = compute_impact(
                manager_output.action,
                state["grid_price_usd_mwh"],
                state["grid_co2_g_kwh"],
            )
            print(f"Impact: kWh={impact.kwh_delta}, $={impact.dollars_delta}, CO2={impact.kg_co2_delta}kg")

            # Apply action to state (simplified)
            if manager_output.action.tool == "adjust_hvac":
                target = manager_output.action.args.get("target_temp_f", 73)
                state["inside_temp_f"] += (target - state["inside_temp_f"]) * 0.3
                state["hvac_state"] = f"cooling_{int(target)}"
            elif manager_output.action.tool == "adjust_lighting":
                level = manager_output.action.args.get("level_0_to_100", 100)
                state["lighting_state"] = "off" if level == 0 else "dim" if level < 50 else "full"
            elif manager_output.action.tool == "deploy_coolant":
                state["inside_temp_f"] = max(60, state["inside_temp_f"] - 15)

        except Exception as e:
            print(f"❌ Error calling Bedrock: {e}")
            raise

        print()

    print(f"{'='*60}")
    print(f"Test run complete — {steps} steps executed")
    print(f"{'='*60}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Standalone simulator test run")
    parser.add_argument("--stadium", default="lusail", help="Stadium ID (lusail, lambeau, wembley, allegiant, yankee)")
    parser.add_argument("--scenario", default="heat_wave", help="Scenario (normal, price_spike, sensor_fail, api_broken, heat_wave)")
    parser.add_argument("--steps", type=int, default=3, help="Number of simulation steps")
    args = parser.parse_args()

    scenario = Scenario(args.scenario)
    asyncio.run(test_run(args.stadium, scenario, args.steps))


if __name__ == "__main__":
    main()
