"""Async simulation loop (§6.3).

Generates stadium state every ~5 s, calls the Manager agent on Bedrock,
computes impact, and POSTs the trace to the GlassBox platform.
"""

from __future__ import annotations

import asyncio
import logging
import os
import random
from datetime import datetime
from typing import Any

import httpx
import ulid

from simulator.bedrock_manager import invoke_manager
from simulator.impact import compute_impact
from simulator.scenarios import apply_scenario
from simulator.schemas import (
    Action,
    Observation,
    Scenario,
    StadiumConfig,
    TracePostBody,
)
from simulator.secrets import get_api_key, get_bedrock_config
from simulator.stadiums import CLIMATE_CURVES, GRID_CURVES

logger = logging.getLogger(__name__)

# Active sessions — keyed by session_id
_sessions: dict[str, asyncio.Task] = {}

# Trace buffer — stores recent traces per session for polling
_trace_buffer: dict[str, list[dict]] = {}


# ---------------------------------------------------------------------------
# State helpers
# ---------------------------------------------------------------------------

def _initial_state(stadium: StadiumConfig) -> dict[str, Any]:
    """Build the initial mutable state dict for a session."""
    hour = datetime.utcnow().hour
    climate = CLIMATE_CURVES.get(stadium.climate_profile, {})
    grid = GRID_CURVES.get(stadium.stadium_id, {})

    outside_temp, humidity = climate.get(hour, (85.0, 30.0))
    grid_price, grid_co2 = grid.get(hour, (stadium.baseline_energy_rate_usd_mwh, stadium.baseline_co2_g_kwh))

    return {
        "outside_temp_f": outside_temp,
        "inside_temp_f": 74.0,
        "attendance": int(stadium.capacity * random.uniform(0.7, 0.95)),
        "grid_price_usd_mwh": grid_price,
        "grid_co2_g_kwh": grid_co2,
        "hvac_state": "cooling_73",
        "lighting_state": "full",
        "_hvac_broken": False,
    }


def _evolve(state: dict[str, Any], stadium: StadiumConfig, step: int) -> dict[str, Any]:
    """Advance the simulation state by one tick (natural drift)."""
    # Slight random drift on temps
    state["outside_temp_f"] += random.uniform(-0.5, 0.8)
    state["inside_temp_f"] += random.uniform(-0.3, 0.4)

    # Crowd trickle
    max_cap = stadium.capacity
    state["attendance"] = max(0, min(max_cap, state["attendance"] + random.randint(-200, 300)))

    # Grid price jitter
    state["grid_price_usd_mwh"] *= random.uniform(0.97, 1.03)
    state["grid_co2_g_kwh"] *= random.uniform(0.99, 1.01)

    return state


def _apply_action(state: dict[str, Any], action: Action, scenario: Scenario) -> dict[str, Any]:
    """Apply the manager's chosen action to the simulation state."""
    # If api_broken scenario and tool is HVAC, simulate failure
    if state.get("_hvac_broken") and action.tool == "adjust_hvac":
        logger.warning("HVAC tool call failed (api_broken scenario)")
        return state

    if action.tool == "adjust_hvac":
        target = action.args.get("target_temp_f", 73)
        # Move inside temp toward target
        diff = target - state["inside_temp_f"]
        state["inside_temp_f"] += diff * 0.3
        state["hvac_state"] = f"cooling_{int(target)}"

    elif action.tool == "adjust_lighting":
        level = action.args.get("level_0_to_100", action.args.get("level", 100))
        if level == 0:
            state["lighting_state"] = "off"
        elif level < 50:
            state["lighting_state"] = "dim"
        else:
            state["lighting_state"] = "full"

    elif action.tool == "deploy_coolant":
        state["inside_temp_f"] = max(60.0, state["inside_temp_f"] - 15.0)

    elif action.tool == "adjust_ventilation":
        state["inside_temp_f"] += random.uniform(-1.0, -0.2)

    return state


def _state_to_observation(state: dict[str, Any]) -> Observation:
    """Convert mutable state dict to an Observation model."""
    return Observation(
        outside_temp_f=round(state["outside_temp_f"], 1),
        inside_temp_f=round(state["inside_temp_f"], 1),
        attendance=state["attendance"],
        grid_price_usd_mwh=round(state["grid_price_usd_mwh"], 2),
        grid_co2_g_kwh=round(state["grid_co2_g_kwh"], 1),
        hvac_state=state["hvac_state"],
        lighting_state=state["lighting_state"],
    )


# ---------------------------------------------------------------------------
# Core loop
# ---------------------------------------------------------------------------

async def run_session(
    stadium: StadiumConfig,
    scenario: Scenario,
    session_id: str,
) -> None:
    """Run the simulation loop until cancelled."""
    api_url = os.getenv("GLASSBOX_API_URL", "http://localhost:8000")
    trace_endpoint = f"{api_url}/trace"

    # Fetch secrets for Bedrock guardrails
    try:
        bedrock_cfg = get_bedrock_config()
        guardrail_id = bedrock_cfg.get("guardrail_id")
        guardrail_version = bedrock_cfg.get("guardrail_version")
    except Exception:
        guardrail_id = os.getenv("GUARDRAIL_ID")
        guardrail_version = os.getenv("GUARDRAIL_VERSION")

    try:
        api_key = get_api_key()
        if not api_key:
            logger.warning("API key is empty — requests will likely be rejected (403)")
    except Exception:
        api_key = os.getenv("GLASSBOX_API_KEY", "")
        if not api_key:
            logger.warning("No API key found in Secrets Manager or GLASSBOX_API_KEY env var")

    state = _initial_state(stadium)
    step = 0

    async with httpx.AsyncClient(timeout=30.0) as http:
        while True:
            try:
                # 1. Evolve state naturally
                state = _evolve(state, stadium, step)

                # 2. Apply scenario chaos
                state = apply_scenario(state, scenario, step)

                # 3. Build observation
                observation = _state_to_observation(state)

                # 4. Call Manager Agent on Bedrock (in thread to avoid blocking event loop)
                manager_output, tokens, latency_ms, guardrail_blocked, guardrail_intervention = (
                    await asyncio.to_thread(
                        invoke_manager,
                        stadium,
                        observation,
                        guardrail_id=guardrail_id,
                        guardrail_version=guardrail_version,
                    )
                )

                # 5. Apply manager's action to state
                state = _apply_action(state, manager_output.action, scenario)

                # 6. Compute impact
                impact = compute_impact(
                    manager_output.action,
                    state["grid_price_usd_mwh"],
                    state["grid_co2_g_kwh"],
                )

                # 7. Build and POST trace
                trace_id = f"trc_{ulid.new().str}"
                trace_body = TracePostBody(
                    session_id=session_id,
                    stadium_id=stadium.stadium_id,
                    scenario=scenario,
                    step=step,
                    observation=observation,
                    thought=manager_output.thought,
                    action=manager_output.action,
                    impact=impact,
                    tokens=tokens,
                    latency_ms=latency_ms,
                    guardrail_blocked=guardrail_blocked,
                    guardrail_intervention=guardrail_intervention,
                )

                # 7a. Store in local buffer for polling
                trace_dict = trace_body.model_dump()
                trace_dict["trace_id"] = trace_id
                if session_id not in _trace_buffer:
                    _trace_buffer[session_id] = []
                _trace_buffer[session_id].append(trace_dict)

                # 7b. POST to platform (may fail if platform not deployed — that's OK)
                headers = {"Content-Type": "application/json"}
                if api_key:
                    headers["x-api-key"] = api_key

                try:
                    resp = await http.post(
                        trace_endpoint,
                        content=trace_body.model_dump_json(),
                        headers=headers,
                    )
                    logger.info(
                        "Step %d | %s | status=%d",
                        step,
                        manager_output.action.tool,
                        resp.status_code,
                    )
                except Exception:
                    # Platform not deployed yet — traces are still in local buffer
                    logger.info(
                        "Step %d | %s | buffered (platform unavailable)",
                        step,
                        manager_output.action.tool,
                    )

            except asyncio.CancelledError:
                logger.info("Session %s cancelled at step %d", session_id, step)
                raise
            except Exception:
                logger.exception("Error at step %d", step)

            step += 1
            await asyncio.sleep(5)


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------

def start_session(stadium: StadiumConfig, scenario: Scenario) -> str:
    """Start a new simulation session, return the session_id."""
    session_id = f"sess_{ulid.new().str}"
    task = asyncio.ensure_future(run_session(stadium, scenario, session_id))
    _sessions[session_id] = task
    logger.info("Started session %s — %s / %s", session_id, stadium.stadium_id, scenario.value)
    return session_id


def stop_session(session_id: str) -> bool:
    """Cancel a running session. Returns True if it was running."""
    task = _sessions.pop(session_id, None)
    if task and not task.done():
        task.cancel()
        return True
    return False


def get_session_traces(session_id: str, after: int = 0) -> list[dict]:
    """Return traces for a session, optionally after a given index (for polling)."""
    traces = _trace_buffer.get(session_id, [])
    return traces[after:]


def active_sessions() -> list[str]:
    """Return IDs of currently running sessions."""
    return [sid for sid, t in _sessions.items() if not t.done()]
