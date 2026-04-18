# GlassBox AI — Real-Time Observability for AI Agents

> Built for the AWS Generative AI Hackathon — Environmental & Safety tracks.

AI agents are being deployed to cut energy costs in real infrastructure. When the same agent optimizes energy and controls safety systems, **GlassBox** audits the trade-offs — citing real regulations, in real time.

## What This Is

A full-stack platform that:
- **Simulates** stadium conditions (temperature, attendance, grid pricing) across 5 real-world venues
- **Runs** an AI Facility Manager (Bedrock Claude Sonnet 4) that makes energy/safety trade-offs
- **Audits** every decision with a Judge agent (Bedrock Claude Opus 4.6 + Knowledge Base) citing NFPA, ASHRAE, OSHA codes
- **Streams** traces live to a 3D globe dashboard via WebSocket
- **Catches** unsafe decisions before they execute (dual-layer: Guardrails + Judge)

## Quick Start

### Backend (Simulator)

```bash
cd backend
pip install -r simulator/requirements.txt

# Set AWS credentials
export AWS_REGION=us-west-2

# Test run (no UI needed)
python -m simulator.test_run --stadium lusail --scenario heat_wave --steps 3

# Start the control plane
uvicorn simulator.app:app --host 0.0.0.0 --port 8080 --reload
```

### Frontend (Dashboard)

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:3000 — click a stadium on the globe to enter the audit dashboard.

## Architecture

```
Frontend (Next.js + Three.js Globe)
    ↓ POST /session/start
Simulator (FastAPI control plane)
    ↓ async loop every 5s
Manager Agent (Bedrock Claude Sonnet 4 + Guardrails)
    ↓ POST /trace
API Gateway → Lambda → Judge Agent (Bedrock Opus 4.6 + KB)
    ↓ DynamoDB Streams
WebSocket API → Dashboard (live trace + quadrant chart)
    ↓ if severity=critical
Step Functions → Polly voice alert + Postmortem generation
```

## Project Structure

```
backend/
├── simulator/              # Role 2 — Simulator package
│   ├── app.py              # FastAPI control plane
│   ├── bedrock_manager.py  # Bedrock InvokeModel + Guardrails
│   ├── impact.py           # kWh / $ / kg CO₂ calculator
│   ├── loop.py             # Async simulation loop
│   ├── scenarios.py        # 5 chaos scenario switches
│   ├── schemas.py          # Pydantic models (trace, stadium)
│   ├── secrets.py          # Secrets Manager helper
│   ├── seed_stadiums.py    # DynamoDB seed script
│   ├── stadiums.py         # 5 stadium profiles
│   └── test_run.py         # Standalone test harness
├── models/                 # Agent config
└── utils/                  # Calculator utilities

frontend/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Globe → Transition → Dashboard views
│   └── layout.tsx          # Dark mode, Geist fonts
├── components/
│   ├── globe/              # 3D globe (Three.js + react-three-fiber)
│   │   ├── globe.tsx       # Earth + stadium pins + arcs
│   │   ├── transition.tsx  # Zoom animation between views
│   │   └── globe-magnitude-bars.tsx
│   ├── dashboard/          # Audit dashboard
│   │   ├── dashboard.tsx   # Main layout + controls
│   │   ├── live-trace.tsx  # Scrolling trace terminal
│   │   ├── safety-quadrant.tsx  # Safety × Strain chart
│   │   ├── lumen-rail.tsx  # Health spectrum bar
│   │   └── workflow-pipeline.tsx  # Agent pipeline viz
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── app-state.ts        # Zustand store (view, stadium)
│   ├── simulation.ts       # Client-side mock simulation
│   ├── stadiums.ts         # Stadium data for globe
│   └── utils.ts            # cn() helper
└── styles/
```

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
| `api_broken` | HVAC tool errors after step 3 | Agent retries in tight loop |
| `heat_wave` | Outside temp ramps 95→118°F | Agent struggles with cooling cost vs heat-stress |

## Team

| Role | Person | Owns |
|---|---|---|
| AI Engineer | Sneha | Bedrock KB, Manager/Judge agents, Guardrails |
| Simulator Architect | Yash | Python sim, stadiums, scenarios, FastAPI |
| Cloud Plumber | Tanvi | SAM infra, Lambdas, API GW, DynamoDB, Step Functions |
| Frontend | Siddhi | Next.js dashboard, globe, live visualizations |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Three.js, Zustand, shadcn/ui, Tailwind |
| Backend | Python 3.11, FastAPI, boto3, Pydantic, httpx |
| AI | Bedrock Claude Sonnet 4 (Manager), Opus 4.6 (Judge), Guardrails |
| Infra | API Gateway, Lambda, DynamoDB, Step Functions, Polly, Secrets Manager |
| IaC | AWS SAM |
| Region | us-west-2 |

## Documentation

- [idea.md](idea.md) — v3 pitch doc
- [Technical-doc.md](Technical-doc.md) — Build bible (source of truth)
- [backend/simulator/README.md](backend/simulator/README.md) — Simulator run instructions
- [CHANGELOG_2026-04-18.md](CHANGELOG_2026-04-18.md) — Build log
