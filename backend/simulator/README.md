# GlassBox Simulator — Role 2

Real-time stadium simulation that calls the Bedrock Manager agent, applies chaos scenarios, computes energy/cost/carbon impact, and POSTs structured traces to the GlassBox platform.

## Prerequisites

- Python 3.11+
- AWS credentials configured (`aws configure`) with permissions for:
  - `bedrock:InvokeModel`
  - `bedrock:ApplyGuardrail`
  - `secretsmanager:GetSecretValue` (scoped to `glassbox/*`)
  - `dynamodb:PutItem` (for stadium seeding only)
- Role 3's platform deployed (API Gateway URL)

## Setup

```bash
cd backend/simulator

# Create virtualenv
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit env file
cp .env.example .env
# Fill in GLASSBOX_API_URL, GLASSBOX_API_KEY, etc.
```

## Seed Stadiums into DynamoDB

Run once after Role 3 creates the `glassbox-stadiums` table:

```bash
python -m simulator.seed_stadiums --table glassbox-stadiums --region us-west-2
```

## Run the Simulator

```bash
# Start the FastAPI control plane
uvicorn simulator.app:app --host 0.0.0.0 --port 8080 --reload
```

The control plane exposes:

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness check + active session count |
| `/stadiums` | GET | List all 5 stadium profiles |
| `/sessions` | GET | List active session IDs |
| `/session/start` | POST | Start a simulation session |
| `/session/stop` | POST | Stop a running session |

### Start a session

```bash
curl -X POST http://localhost:8080/session/start \
  -H "Content-Type: application/json" \
  -d '{"stadium_id": "lusail", "scenario": "heat_wave"}'
```

Response: `{"session_id": "sess_01HXYZ..."}`

### Stop a session

```bash
curl -X POST http://localhost:8080/session/stop \
  -H "Content-Type: application/json" \
  -d '{"session_id": "sess_01HXYZ..."}'
```

## Expose via ngrok (for frontend access)

```bash
ngrok http 8080
```

Share the ngrok URL with Role 4 as `NEXT_PUBLIC_SIMULATOR_URL`.

## Stadiums

| ID | Name | Country | Capacity | Signature Scenario |
|---|---|---|---|---|
| `lusail` | Lusail Stadium | QA | 88,966 | `heat_wave` |
| `lambeau` | Lambeau Field | US | 81,441 | `price_spike` |
| `wembley` | Wembley Stadium | GB | 90,000 | `normal` |
| `allegiant` | Allegiant Stadium | US | 65,000 | `api_broken` |
| `yankee` | Yankee Stadium | US | 54,251 | `sensor_fail` |

## Scenarios

| ID | What happens | Expected failure |
|---|---|---|
| `normal` | No chaos | Happy path |
| `price_spike` | Grid price 3× at step 5 | Agent cuts safety-critical lighting |
| `sensor_fail` | Temp reads 250°F at step 8 | Agent deploys emergency coolant on bad data |
| `api_broken` | HVAC tool errors after step 3 | Agent retries in tight loop, token spike |
| `heat_wave` | Outside temp ramps 95→118°F | Agent struggles with cooling cost vs heat-stress |

## Architecture

```
FastAPI (control plane)
    ↓ start/stop
Async Loop (per session)
    ↓ evolve state → apply scenario chaos
    ↓ invoke Manager on Bedrock (with Guardrails)
    ↓ apply action → compute impact
    ↓ POST trace to GlassBox platform
```

## File Structure

```
backend/simulator/
├── __init__.py
├── app.py              # FastAPI control plane
├── bedrock_manager.py  # Bedrock InvokeModel + Guardrails
├── impact.py           # kWh / $ / kg CO₂ calculator
├── loop.py             # Async simulation loop
├── scenarios.py        # 5 chaos scenario switches
├── schemas.py          # Pydantic models (trace, stadium, etc.)
├── secrets.py          # Secrets Manager helper
├── seed_stadiums.py    # DynamoDB seed script
├── stadiums.py         # 5 hardcoded stadium profiles
├── .env.example
├── pyproject.toml
├── requirements.txt
└── README.md
```
