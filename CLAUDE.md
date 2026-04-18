# GlassBox AI — Project Context

Real-time observability and safety auditing platform for AI agents, built for the AWS Generative AI Hackathon (Environmental & Safety tracks). Demoed via a Smart Stadium Simulator where an AI Facility Manager balances energy cost vs. occupant safety.

**Read these for full context:** [idea.md](idea.md) (v3 pitch), [Technical-doc.md](Technical-doc.md) (v1.1 build bible).

## The Pitch

AI agents are being deployed to cut energy costs in real infrastructure. When the same agent optimizes energy *and* controls safety systems, GlassBox audits the trade-offs. The Judge agent doesn't just flag "unsafe" — it cites the actual regulation (NFPA 101, ASHRAE 55/90.1, OSHA 1910) retrieved live from a Bedrock Knowledge Base.

**One product, two tracks, one demo.** Platform is the product; stadium sim is the customer.

## Architecture

```
Frontend (Next.js + Three.js Globe)
    ↓ POST /session/start {stadium_id, scenario}
Simulator (FastAPI, Python)
    ↓ async loop every 5s
Manager Agent (Bedrock Claude Sonnet 4 + Guardrails)
    ↓ POST /trace (x-api-key header)
API Gateway → Lambda traceIngestHandler
    ↓ invoke Judge Agent (Bedrock Opus 4.6 + KB)
DynamoDB (Streams) → traceBroadcaster Lambda → WebSocket API
    ↓ live push
Next.js Dashboard (globe → transition → audit view)

Critical events → Step Functions (parallel: Polly voice + Postmortem generation)
```

Region: **us-west-2** (Bedrock + Location Service). Do not mix regions.

## Roles & Ownership

- **Role 1 — AI Engineer (Sneha):** Bedrock Knowledge Base, Manager + Judge agents, postmortem prompt, Guardrails config. See [Technical-doc.md §5](Technical-doc.md).
- **Role 2 — Simulator Architect (Yash):** Python sim loop, 5 stadium profiles, 5 chaos scenarios, FastAPI control plane. See [Technical-doc.md §6](Technical-doc.md) and [backend/simulator/](backend/simulator/).
- **Role 3 — Cloud Plumber (Tanvi):** SAM infra, Lambdas, API GW (HTTP + WebSocket), DynamoDB, Step Functions, Secrets Manager, Polly, Location Service. Critical path. See [Technical-doc.md §7](Technical-doc.md).
- **Role 4 — Frontend (Siddhi):** Next.js/TS dashboard on Amplify. Globe view + audit dashboard. See [Technical-doc.md §8](Technical-doc.md) and [frontend/](frontend/).

## Repo Layout

```
backend/
├── simulator/              # Role 2 — Full simulator package
│   ├── app.py              # FastAPI control plane (POST /session/start, /stop)
│   ├── bedrock_manager.py  # Bedrock InvokeModel + Guardrails
│   ├── impact.py           # kWh / $ / kg CO₂ calculator
│   ├── loop.py             # Async simulation loop (5s ticks)
│   ├── scenarios.py        # 5 chaos switches
│   ├── schemas.py          # Pydantic models matching Technical-doc §3.1/§3.2
│   ├── secrets.py          # Secrets Manager helper + env fallback
│   ├── seed_stadiums.py    # DynamoDB seed script
│   ├── stadiums.py         # 5 hardcoded stadium profiles + climate/grid curves
│   └── test_run.py         # Standalone Bedrock test (no UI needed)
├── models/agent_config.json
└── utils/calculator.py

frontend/                   # Next.js 16 + Three.js globe dashboard
├── app/page.tsx            # View router: globe → transition → dashboard
├── components/
│   ├── globe/              # 3D globe with stadium pins (react-three-fiber)
│   ├── dashboard/          # Audit view: trace terminal, safety quadrant, pipeline
│   └── ui/                 # shadcn/ui component library
├── lib/
│   ├── app-state.ts        # Zustand store (view, selectedStadium)
│   ├── simulation.ts       # Client-side mock simulation (to be replaced with real API)
│   └── stadiums.ts         # Stadium data for globe rendering
```

## Non-Negotiable Contracts

Defined in [Technical-doc.md §4](Technical-doc.md). Everyone codes to these from hour 1:

- **A. Simulator → Platform:** `POST /trace` with `x-api-key`. Body = manager trace only; Lambda fills judge fields.
- **B. Platform → Frontend:** WebSocket `?session_id=...`. Messages: `trace | critical_alert | postmortem | session_start`.
- **C. Simulator Control → Frontend:** `POST /session/start {stadium_id, scenario}` → `{session_id}` (FastAPI over ngrok).
- **D. Judge I/O:** Returns `{judge_score, judge_reasoning, regulations_cited[], severity}`.

Trace schema is the source of truth — see [Technical-doc.md §3.1](Technical-doc.md). Do not drift from it.

## Frontend Architecture (Current State)

The frontend is a Next.js 16 app with three views managed by Zustand:

1. **Globe view** — 3D Earth (Three.js + react-three-fiber) with 5 stadium pins. Click a pin to select.
2. **Transition** — Zoom/fade animation (2.5s) between globe and dashboard.
3. **Dashboard** — Audit view with:
   - Workflow pipeline (Simulator → Manager → Judge → GlasseX)
   - Safety × Strain quadrant chart (the centerpiece)
   - Live trace terminal (scrolling log)
   - Lumen spectrum rail (health bar)
   - Stadium + chaos mode selectors
   - "Run simulation step" button

**Current state:** Frontend uses client-side mock simulation (`lib/simulation.ts`). Chaos modes are `normal | heatwave | crowd-surge | power-outage | weather-alert` — these need to be aligned with the backend's `normal | price_spike | sensor_fail | api_broken | heat_wave`.

**Stadium mismatch:** Frontend has Lusail, Wembley, Camp Nou, Maracanã, Rose Bowl. Backend has Lusail, Lambeau, Wembley, Allegiant, Yankee. These need to be synced.

## Backend Simulator (Current State)

Fully built and tested with real Bedrock calls. Models:
- **Manager:** Claude Sonnet 4 (`us.anthropic.claude-sonnet-4-20250514-v1:0`)
- **Judge:** Claude Opus 4.6 (`anthropic.claude-opus-4-6-v1`) — used by Role 3's Lambda

FastAPI control plane runs on port 8080:
- `POST /session/start` → starts async sim loop
- `POST /session/stop` → cancels session
- `GET /stadiums` → returns 5 profiles
- `GET /health` → liveness check

## Integration Status

**What's connected:** Nothing yet. Frontend runs mock simulation client-side. Backend runs real Bedrock calls but POSTs to a platform that doesn't exist yet.

**What needs to happen:**
1. Sync stadium lists (frontend → backend's 5 stadiums)
2. Sync chaos modes (frontend → backend's 5 scenarios)
3. Frontend calls `POST /session/start` on the simulator instead of running mock
4. Frontend connects to WebSocket for live trace streaming (Contract B)
5. Replace `lib/simulation.ts` mock with real API calls

## The Five Scenarios

`normal | price_spike | sensor_fail | api_broken | heat_wave` — each trips a distinct agent failure mode. Mapped to stadiums: Lusail (heat_wave), Lambeau (price_spike), Wembley (normal), Yankee (sensor_fail), Allegiant (api_broken).

## What Must Work On Stage

From [idea.md §11](idea.md):

1. Map → stadium selection → scenario trigger
2. Live trace streaming (WebSocket, no polling)
3. Judge citing at least one real regulation
4. Safety × Sustainability quadrant updating live
5. At least 2 of 3 trap scenarios fire cleanly

## What We're NOT Building

Explicitly cut: counterfactual replay, semantic trace search, multi-agent trace viz, time-scrubbing timeline. Bedrock Guardrails IS in (dual-layer safety).

## Key Checkpoints

- **Hour 12:** `curl POST /trace` returns judge verdict. If not → mob-program.
- **Hour 24:** End-to-end demo runs once, even ugly. If not → drop postmortem first.
- **Hour 36:** Full 4-min demo rehearsed twice.
- **Hour 42:** Feature freeze. Bug fixes only.

## Conventions

- Frontend: dark mode only, hacker/SRE aesthetic. Next.js 16, Three.js globe, Zustand state, shadcn/ui + Tailwind. Geist + Geist Mono fonts.
- Backend: Python 3.11, FastAPI for control plane, boto3 for Bedrock, pydantic for schema validation.
- Infra: AWS SAM, single `template.yaml` at repo root. IAM in SAM from day 1.
- Secrets: Secrets Manager only (`glassbox/api-gateway-key`, `glassbox/bedrock-config`, `glassbox/polly-config`). No hardcoded keys.
- Workshop accounts: Use Bearer token auth + inference profile ARNs (not direct model IDs).
