"""Pydantic models matching Technical-doc §3.1 / §3.2 trace and stadium schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Scenario(str, Enum):
    NORMAL = "normal"
    PRICE_SPIKE = "price_spike"
    SENSOR_FAIL = "sensor_fail"
    API_BROKEN = "api_broken"
    HEAT_WAVE = "heat_wave"


class AgentRole(str, Enum):
    MANAGER = "manager"
    JUDGE = "judge"


class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


# ---------------------------------------------------------------------------
# Nested models
# ---------------------------------------------------------------------------

class Observation(BaseModel):
    outside_temp_f: float
    inside_temp_f: float
    attendance: int
    grid_price_usd_mwh: float
    grid_co2_g_kwh: float
    hvac_state: str
    lighting_state: str


class Action(BaseModel):
    tool: str
    args: dict = Field(default_factory=dict)


class RegulationCitation(BaseModel):
    code: str
    title: str
    excerpt: str


class Impact(BaseModel):
    dollars_delta: float
    kwh_delta: float
    kg_co2_delta: float


class TokenUsage(BaseModel):
    input: int = 0
    output: int = 0


# ---------------------------------------------------------------------------
# §3.1 — Trace Record
# ---------------------------------------------------------------------------

class TraceRecord(BaseModel):
    """Full trace record as stored in DynamoDB ``traces`` table."""

    trace_id: str = Field(..., description="PK — ULID for sort-order")
    session_id: str
    stadium_id: str
    scenario: Scenario
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    step: int
    agent: AgentRole = AgentRole.MANAGER
    observation: Observation
    thought: str
    action: Action

    # Judge-populated (null when agent == manager on initial POST)
    judge_score: Optional[int] = None
    judge_reasoning: Optional[str] = None
    regulations_cited: list[RegulationCitation] = Field(default_factory=list)
    severity: Optional[Severity] = None

    impact: Impact

    tokens: TokenUsage = Field(default_factory=TokenUsage)
    latency_ms: int = 0

    # Populated downstream by Lambdas
    polly_audio_url: Optional[str] = None
    postmortem_md: Optional[str] = None

    # Guardrails extension (§5.5)
    guardrail_blocked: bool = False
    guardrail_intervention: Optional[dict] = None


# ---------------------------------------------------------------------------
# §3.2 — Stadium Config
# ---------------------------------------------------------------------------

class Location(BaseModel):
    lat: float
    lng: float


class StadiumConfig(BaseModel):
    """Stadium profile as stored in DynamoDB ``stadiums`` table."""

    stadium_id: str  # PK
    name: str
    location: Location
    country: str
    capacity: int
    climate_profile: str
    grid_region: str
    baseline_energy_rate_usd_mwh: float
    baseline_co2_g_kwh: float
    signature_scenario: Scenario
    icon_url: str = ""


# ---------------------------------------------------------------------------
# Manager agent parsed output
# ---------------------------------------------------------------------------

class ManagerOutput(BaseModel):
    """Structured output parsed from the Manager agent's response."""

    thought: str
    action: Action


# ---------------------------------------------------------------------------
# Contract A — POST /trace request body (simulator → platform)
# ---------------------------------------------------------------------------

class TracePostBody(BaseModel):
    """What the simulator POSTs to the platform (no judge fields)."""

    session_id: str
    stadium_id: str
    scenario: Scenario
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    step: int
    agent: AgentRole = AgentRole.MANAGER
    observation: Observation
    thought: str
    action: Action
    impact: Impact
    tokens: TokenUsage = Field(default_factory=TokenUsage)
    latency_ms: int = 0
    guardrail_blocked: bool = False
    guardrail_intervention: Optional[dict] = None


# ---------------------------------------------------------------------------
# Contract C — Simulator control plane
# ---------------------------------------------------------------------------

class SessionStartRequest(BaseModel):
    stadium_id: str
    scenario: Scenario


class SessionStartResponse(BaseModel):
    session_id: str


class SessionStopRequest(BaseModel):
    session_id: str


class SessionStopResponse(BaseModel):
    ok: bool = True
