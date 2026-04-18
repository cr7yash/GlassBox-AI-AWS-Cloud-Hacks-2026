# GlassBox AI — Real-Time Observability for AI Agents

> Built for the AWS Generative AI Hackathon — Environmental & Safety tracks.

AI agents are being deployed to cut energy costs in real infrastructure. When the same agent optimizes energy and controls safety systems, **GlassBox** audits the trade-offs — citing real regulations, in real time.

## Local Setup (Full Stack)

### Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm
- AWS credentials configured (`aws configure`) with Bedrock access in `us-west-2`
- Bedrock Bearer token (for workshop accounts)

### 1. Backend (Simulator)

```bash
# Install dependencies
cd backend
pip install -r simulator/requirements.txt

# Create .env with your credentials
cat > .env << 'EOF'
AWS_REGION=us-west-2
AWS_BEARER_TOKEN_BEDROCK=<paste-your-token-here>
EOF

# Quick test (verifies Bedrock access works)
python -m simulator.test_run --stadium lusail --scenario heat_wave --steps 2

# Start the simulator control plane
uvicorn simulator.app:app --host 0.0.0.0 --port 8080 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8080
```

Verify it's up:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/stadiums
```

### 2. Frontend (Dashboard)

```bash
# In a new terminal
cd frontend

# Create env file pointing to local simulator
echo "NEXT_PUBLIC_SIMULATOR_URL=http://localhost:8080" > .env.local

# Install and run
pnpm install
pnpm dev
```

You should see:
```
▲ Next.js 16.2.0 (Turbopack)
- Local: http://localhost:3000
```

### 3. Use It

1. Open http://localhost:3000
2. Click a stadium pin on the 3D globe (e.g. Lusail)
3. Watch the transition animation
4. On the dashboard, pick a scenario from the dropdown (or keep the default)
5. Click "Start simulation session"
6. Watch traces stream in every ~5 seconds:
   - Live trace terminal shows manager reasoning + decisions
   - Safety × Sustainability quadrant accumulates dots
   - Facility state panel updates with real observation data
   - Cumulative energy/cost/carbon counters tick up
7. Click "Stop session" when done

### Test Each Scenario

```bash
# From the backend directory — standalone test (no frontend needed)
python -m simulator.test_run --stadium lusail --scenario heat_wave --steps 5
python -m simulator.test_run --stadium lambeau --scenario price_spike --steps 8
python -m simulator.test_run --stadium yankee --scenario sensor_fail --steps 10
python -m simulator.test_run --stadium allegiant --scenario api_broken --steps 6
python -m simulator.test_run --stadium wembley --scenario normal --steps 3
```

### Troubleshooting

| Problem | Fix |
|---|---|
| `AccessDeniedException` on Bedrock | Export `AWS_BEARER_TOKEN_BEDROCK` in `backend/.env` — token may have expired, get a fresh one |
| `ConnectError: All connection attempts failed` | This is the simulator trying to POST to the platform (Role 3). Harmless — traces are buffered locally and the frontend polls them |
| Frontend shows no traces | Make sure backend is running on port 8080 and `NEXT_PUBLIC_SIMULATOR_URL=http://localhost:8080` is in `frontend/.env.local` |
| `Cannot read properties of undefined` | Stop session, refresh the page, start a new session |
| Globe doesn't load | Three.js needs WebGL — try a different browser or disable hardware acceleration blockers |

## Architecture

```
Frontend (Next.js + Three.js Globe)  ←── polls every 2s ──→  Simulator (FastAPI :8080)
                                                                    │
                                                              Bedrock Claude Sonnet 4
                                                              (Manager Agent + Guardrails)
                                                                    │
                                                              POST /trace ──→ API Gateway (Role 3)
                                                                              → Lambda → Judge → DynamoDB
                                                                              → WebSocket → Frontend
```

Currently running in **polling mode** (frontend polls `GET /traces/{session_id}` from the simulator). When Role 3 deploys the WebSocket API Gateway, the frontend automatically switches to live push via `NEXT_PUBLIC_WS_URL`.

## Project Structure

```
backend/
├── .env                    # AWS credentials (gitignored)
├── simulator/
│   ├── app.py              # FastAPI control plane
│   ├── bedrock_manager.py  # Bedrock InvokeModel + Guardrails
│   ├── impact.py           # kWh / $ / kg CO₂ calculator
│   ├── loop.py             # Async simulation loop (5s ticks)
│   ├── scenarios.py        # 5 chaos scenario switches
│   ├── schemas.py          # Pydantic models (Technical-doc §3.1/§3.2)
│   ├── secrets.py          # Secrets Manager helper
│   ├── seed_stadiums.py    # DynamoDB seed script
│   ├── stadiums.py         # 5 stadium profiles + climate/grid curves
│   └── test_run.py         # Standalone Bedrock test harness
│
frontend/
├── .env.local              # NEXT_PUBLIC_SIMULATOR_URL (gitignored)
├── app/page.tsx            # Globe → Transition → Dashboard views
├── components/
│   ├── globe/              # 3D globe with stadium pins
│   └── dashboard/          # Audit dashboard (8 components)
│       ├── dashboard.tsx       # Main layout + session controls
│       ├── safety-quadrant.tsx # Recharts scatter plot (centerpiece)
│       ├── live-trace.tsx      # Scrolling trace terminal
│       ├── auditor-feed.tsx    # Judge verdicts + regulation citations
│       ├── workflow-pipeline.tsx # Agent pipeline visualization
│       ├── lumen-rail.tsx      # Health spectrum bar
│       ├── postmortem-modal.tsx # Auto-opens on critical events
│       └── critical-alert-toast.tsx # Toast + Polly audio
├── hooks/
│   ├── use-glassbox-stream.ts  # WebSocket hook (Contract B)
│   └── use-trace-polling.ts    # Polling fallback
└── lib/
    ├── api.ts              # Simulator API client (Contract C)
    ├── types.ts            # Trace types (Technical-doc §3.1)
    ├── stadiums.ts         # 5 stadiums + scenarios
    ├── humanize.ts         # Human-readable labels
    └── app-state.ts        # Zustand store
```

## Stadiums & Scenarios

| Stadium | Location | Capacity | Default Scenario | What Happens |
|---|---|---|---|---|
| Lusail Stadium | Qatar | 88,966 | Heat Wave | Outside temp ramps 95→118°F |
| Lambeau Field | Green Bay, USA | 81,441 | Price Spike | Grid price surges 3× at step 5 |
| Wembley Stadium | London, UK | 90,000 | Normal | Happy path baseline |
| Allegiant Stadium | Las Vegas, USA | 65,000 | Broken HVAC API | HVAC tool errors after step 3 |
| Yankee Stadium | New York, USA | 54,251 | Sensor Failure | Temp sensor reads 250°F at step 8 |

## Team

| Role | Person | Owns |
|---|---|---|
| AI Engineer | Sneha | Bedrock KB, Judge Agent, Guardrails, Postmortem prompt |
| Simulator Architect | Yash | Python simulator, stadiums, scenarios, FastAPI, frontend integration |
| Cloud Plumber | Tanvi | SAM infra, Lambdas, API GW, DynamoDB, Step Functions, Polly |
| Frontend | Siddhi | Next.js dashboard, globe, visualizations |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Three.js, Recharts, Zustand, shadcn/ui, Tailwind |
| Backend | Python 3.11, FastAPI, boto3, Pydantic, httpx |
| AI | Bedrock Claude Sonnet 4 (Manager), Opus 4.6 (Judge), Guardrails |
| Infra | API Gateway, Lambda, DynamoDB, Step Functions, Polly, Secrets Manager |
| Region | us-west-2 |

## Key Docs

- [idea.md](idea.md) — v3 pitch doc
- [Technical-doc.md](Technical-doc.md) — Build bible
- [backend/simulator/README.md](backend/simulator/README.md) — Simulator details
- [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md) — Frontend ↔ Backend integration plan
- [CHANGELOG_2026-04-18.md](CHANGELOG_2026-04-18.md) — Build log
