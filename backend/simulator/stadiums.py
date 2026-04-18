"""Five hardcoded stadium profiles (§6.2).

Each profile includes a 24-hour climate curve and grid price/carbon curve
so the simulation loop can interpolate realistic values by hour-of-day.
"""

from __future__ import annotations

from simulator.schemas import Location, Scenario, StadiumConfig

# ---------------------------------------------------------------------------
# Climate & grid curves — keyed by hour (0-23).
# Values are (temp_f, humidity_pct) and (price_usd_mwh, co2_g_kwh).
# ---------------------------------------------------------------------------

_DESERT_HOT_CLIMATE = {
    h: (88 + 14 * max(0, 1 - abs(h - 14) / 6), 15 + 5 * max(0, 1 - abs(h - 5) / 4))
    for h in range(24)
}  # peaks ~102 F at 14:00

_COLD_CONTINENTAL_CLIMATE = {
    h: (18 + 12 * max(0, 1 - abs(h - 14) / 6), 55 + 10 * max(0, 1 - abs(h - 6) / 4))
    for h in range(24)
}  # peaks ~30 F at 14:00

_TEMPERATE_MARITIME_CLIMATE = {
    h: (55 + 10 * max(0, 1 - abs(h - 15) / 6), 65 + 10 * max(0, 1 - abs(h - 5) / 4))
    for h in range(24)
}  # peaks ~65 F

_ARID_DESERT_CLIMATE = {
    h: (80 + 20 * max(0, 1 - abs(h - 15) / 6), 10 + 5 * max(0, 1 - abs(h - 5) / 4))
    for h in range(24)
}  # peaks ~100 F

_HUMID_SUBTROPICAL_CLIMATE = {
    h: (72 + 12 * max(0, 1 - abs(h - 14) / 6), 70 + 10 * max(0, 1 - abs(h - 6) / 4))
    for h in range(24)
}  # peaks ~84 F


def _flat_grid(base_price: float, base_co2: float) -> dict[int, tuple[float, float]]:
    """Simple grid curve with a peak multiplier at hours 14-19."""
    return {
        h: (
            base_price * (1.8 if 14 <= h <= 19 else 1.0),
            base_co2 * (1.2 if 14 <= h <= 19 else 1.0),
        )
        for h in range(24)
    }


# ---------------------------------------------------------------------------
# Stadium profiles
# ---------------------------------------------------------------------------

STADIUMS: dict[str, StadiumConfig] = {
    "lusail": StadiumConfig(
        stadium_id="lusail",
        name="Lusail Stadium",
        location=Location(lat=25.4220, lng=51.4891),
        country="QA",
        capacity=88966,
        climate_profile="desert_hot",
        grid_region="qa_national",
        baseline_energy_rate_usd_mwh=85.0,
        baseline_co2_g_kwh=420.0,
        signature_scenario=Scenario.HEAT_WAVE,
        icon_url="s3://glassbox-assets/icons/lusail.png",
    ),
    "lambeau": StadiumConfig(
        stadium_id="lambeau",
        name="Lambeau Field",
        location=Location(lat=44.5013, lng=-88.0622),
        country="US",
        capacity=81441,
        climate_profile="cold_continental",
        grid_region="us_miso",
        baseline_energy_rate_usd_mwh=65.0,
        baseline_co2_g_kwh=380.0,
        signature_scenario=Scenario.PRICE_SPIKE,
        icon_url="s3://glassbox-assets/icons/lambeau.png",
    ),
    "wembley": StadiumConfig(
        stadium_id="wembley",
        name="Wembley Stadium",
        location=Location(lat=51.5560, lng=-0.2795),
        country="GB",
        capacity=90000,
        climate_profile="temperate_maritime",
        grid_region="gb_national",
        baseline_energy_rate_usd_mwh=110.0,
        baseline_co2_g_kwh=230.0,
        signature_scenario=Scenario.NORMAL,
        icon_url="s3://glassbox-assets/icons/wembley.png",
    ),
    "allegiant": StadiumConfig(
        stadium_id="allegiant",
        name="Allegiant Stadium",
        location=Location(lat=36.0908, lng=-115.1833),
        country="US",
        capacity=65000,
        climate_profile="arid_desert",
        grid_region="us_caiso",
        baseline_energy_rate_usd_mwh=95.0,
        baseline_co2_g_kwh=310.0,
        signature_scenario=Scenario.API_BROKEN,
        icon_url="s3://glassbox-assets/icons/allegiant.png",
    ),
    "yankee": StadiumConfig(
        stadium_id="yankee",
        name="Yankee Stadium",
        location=Location(lat=40.8296, lng=-73.9262),
        country="US",
        capacity=54251,
        climate_profile="humid_subtropical",
        grid_region="us_nyiso",
        baseline_energy_rate_usd_mwh=105.0,
        baseline_co2_g_kwh=270.0,
        signature_scenario=Scenario.SENSOR_FAIL,
        icon_url="s3://glassbox-assets/icons/yankee.png",
    ),
}

# Climate curves per profile name
CLIMATE_CURVES: dict[str, dict[int, tuple[float, float]]] = {
    "desert_hot": _DESERT_HOT_CLIMATE,
    "cold_continental": _COLD_CONTINENTAL_CLIMATE,
    "temperate_maritime": _TEMPERATE_MARITIME_CLIMATE,
    "arid_desert": _ARID_DESERT_CLIMATE,
    "humid_subtropical": _HUMID_SUBTROPICAL_CLIMATE,
}

# Grid curves per stadium_id
GRID_CURVES: dict[str, dict[int, tuple[float, float]]] = {
    sid: _flat_grid(s.baseline_energy_rate_usd_mwh, s.baseline_co2_g_kwh)
    for sid, s in STADIUMS.items()
}


def get_stadium(stadium_id: str) -> StadiumConfig:
    """Return a stadium profile or raise ``KeyError``."""
    return STADIUMS[stadium_id]
