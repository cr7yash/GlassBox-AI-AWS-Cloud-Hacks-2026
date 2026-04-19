# GlassBox AI — Real-Time Observability & Safety Auditing for AI Agents

> Built for the AWS Generative AI Hackathon — Environmental & Safety tracks.

AI agents are being deployed to cut energy costs in real infrastructure. When the same agent optimizes energy and controls safety systems, **GlassBox** audits the trade-offs — citing real regulations (NFPA 101, ASHRAE 55, OSHA 1910), in real time.

One product. Two tracks. One demo.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js + Three.js Globe)                        │
│  localhost:3000 or AWS Amplify                              │
└──────────────┬──────────────────────────────┬───────────────┘
               │ POST /session/start          │ WebSocket
               ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│  Simulator (FastAPI)  │    │  API Gateway (WebSocket)        │
│  localhost:8080       │    │  wss://wawq2a1049...            │
│  • Manager Agent      │    └─────────────────────────────────┘
│    (Bedrock Sonnet 4) │                    ▲
│  • Judge Agent        │                    │ DynamoDB Streams
│    (Bedrock Nova Lite │    ┌───────────────┴─────────────────┐
│     + Knowledge Base) │    │  traceBroadcaster Lambda        │
│  • Guardrails         │    └─────────────────────────────────┘
└──────────┬────────────┘                    ▲
           │ POST /trace                     │
           ▼                                 │
┌──────────────────────────────────────────────────────────────┐
│  API Gateway (HTTP)                                          │
│  https://kf4ssmnzui.execute-api.us-west-2.amazonaws.com/prod │
│  → traceIngestHandler Lambda                                 │
│    → Judge Agent (Bedrock Agent + KB)                        │
│    → DynamoDB (traces table)                                 │
│    → if critical: Step Functions                             │
│      → Polly voice alert (S3 mp3)                           │
│      → Postmortem generation (Bedrock)                       │
│    → SNS (extensibility hook)                                │
└──────────────────────────────────────────────────────────────┘
```

## AWS Services Used (17/20)

| # | Service | Purpose | Status |
|---|---------|---------|--------|
| 1 | Amazon Bedrock (InvokeModel) | Manager Agent (Claude Sonnet 4) | ✅ |
| 2 | Amazon Bedrock Agents | Judge Agent with KB | ✅ |
| 3 | Amazon Bedrock Knowledge Bases | Regulation RAG (NFPA, ASHRAE, OSHA) | ✅ |
| 4 | Amazon Bedrock Guardrails | Dual-layer safety prevention | ✅ |
| 5 | Amazon OpenSearch Serverless | Vector store for KB | ✅ |
| 6 | Amazon S3 | Regulation docs + Polly audio | ✅ |
| 7 | API Gateway (HTTP) | POST /trace endpoint | ✅ |
| 8 | API Gateway (WebSocket) | Live trace push to dashboard | ✅ |
| 9 | AWS Lambda (6 functions) | Ingest, broadcast, WS, Polly, postmortem | ✅ |
| 10 | AWS Step Functions | Critical event orchestration | ✅ |
| 11 | Amazon DynamoDB (3 tables) | Traces, stadiums, WS connections | ✅ |
| 12 | DynamoDB Streams | Triggers broadcaster | ✅ |
| 13 | Amazon SNS | Critical alert extensibility | ✅ |
| 14 | Amazon Polly | Voice synthesis for alerts | ✅ |
| 15 | AWS IAM | Least-privilege roles (SAM-managed) | ✅ |
| 16 | Amazon CloudWatch | Logging | ✅ |
| 17 | AWS SAM | Infrastructure as Code | ✅ |
| 18 | Amazon Location Service | — | Replaced by Three.js globe |
| 19 | AWS Amplify | Frontend hosting | Optional (runs locally) |
| 20 | AWS Secrets Manager | — | Using env vars (hackathon) |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ and pnpm
- AWS credentials with Bedrock access (us-west-2)
- Bedrock Bearer token (for workshop accounts)
- SAM CLI (for infrastructure deployment)

### 1. Deploy AWS Infrastructure

```bash
cd infra
sam build
sam deploy
```

Note the outputs: `HttpApiUrl`, `WebSocketUrl`, table names.

### 2. Seed Stadium Data

```bash
cd backend

# Get the actual table name from SAM outputs
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name glassbox-platform --region us-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='StadiumsTableName'].OutputValue" \
  --output text)

python -m simulator.seed_stadiums --table $TABLE_NAME --region us-west-2
```

### 3. Configure Environment

```bash
# backend/.env
cat > backend/.env << 'EOF'
AWS_REGION=us-west-2
AWS_BEARER_TOKEN_BEDROCK=<paste fresh token>
BEDROCK_AGENT_ID=AJFMFVPX2D
BEDROCK_AGENT_ALIAS_ID=P6KDX0BDII
KNOWLEDGE_BASE_ID=4VLZUJAC0T
GUARDRAIL_ID=rpygrcgzevdn
GUARDRAIL_VERSION=DRAFT
GLASSBOX_API_URL=https://kf4ssmnzui.execute-api.us-west-2.amazonaws.com/prod
EOF

# frontend/.env.local
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_SIMULATOR_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=wss://wawq2a1049.execute-api.us-west-2.amazonaws.com/prod
EOF
```

### 4. Start Backend

```bash
cd backend
pip install -r simulator/requirements.txt
uvicorn simulator.app:app --host 0.0.0.0 --port 8080 --reload
```

### 5. Start Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### 6. Open Demo

Open http://localhost:3000 → click a stadium → select scenario → start session.

## Demo Script (4 minutes)

**Scene 0 (20s):** Globe loads with 5 stadium pins. Click Lambeau Field. Transition animation plays.

**Scene 1 (30s):** Dashboard loads. Select "Normal Operations." Start session. Traces stream green. HVAC adjustments. Dots in upper-right quadrant. Judge scores 7-10.

**Scene 2 (60s):** Switch to "Energy Price Spike." Grid price tile turns red ($650/MWh). Manager cuts lighting. Red banner: "LIGHTING DISABLED — 69,224 attendees in the dark." Judge scores 0, cites NFPA 101 §7.8.1.2. Polly announces violation.

**Scene 3 (45s):** Yankee Stadium + "Sensor Failure." Temp reads 250°F. Manager deploys emergency coolant. Judge flags failure to validate sensor data.

**Scene 4 (40s):** Allegiant + "Broken HVAC API." Manager retries broken tool. Token counter spikes. Postmortem modal auto-opens.

**Scene 5 (15s):** Back to quadrant — all dots visible. "This is what AI governance should look like."

## Project Structure

```
backend/
├── .env                        # AWS credentials (gitignored)
├── simulator/                  # Role 2 — Simulator package
│   ├── app.py                  # FastAPI control plane
│   ├── bedrock_manager.py      # Bedrock Manager (Sonnet 4 + Guardrails)
│   ├── judge.py                # Bedrock Judge Agent (Nova Lite + KB)
│   ├── impact.py               # kWh / $ / kg CO₂ calculator
│   ├── loop.py                 # Async simulation loop (5s ticks)
│   ├── scenarios.py            # 5 chaos scenario switches
│   ├── schemas.py              # Pydantic models (Technical-doc §3.1/§3.2)
│   ├── secrets.py              # Secrets Manager helper
│   ├── seed_stadiums.py        # DynamoDB seed script
│   ├── stadiums.py             # 5 stadium profiles + climate/grid curves
│   └── test_run.py             # Standalone Bedrock test harness
├── regulations/                # Regulation source docs for KB
│   ├── nfpa-101-life-safety.txt
│   ├── ashrae-55-thermal-comfort.txt
│   ├── ashrae-90-1-energy.txt
│   └── osha-1910-subpart-e.txt

frontend/                       # Next.js 16 + Three.js dashboard
├── app/page.tsx                # Globe → Transition → Dashboard
├── components/
│   ├── globe/                  # 3D globe with stadium pins
│   └── dashboard/              # 8 dashboard components
│       ├── dashboard.tsx       # Main layout + session controls
│       ├── safety-quadrant.tsx # Recharts scatter (centerpiece)
│       ├── live-trace.tsx      # Color-coded trace terminal
│       ├── auditor-feed.tsx    # Judge verdicts + regulation citations
│       ├── workflow-pipeline.tsx # Agent pipeline visualization
│       ├── lumen-rail.tsx      # Health spectrum bar
│       ├── postmortem-modal.tsx # Auto-opens on critical
│       └── critical-alert-toast.tsx # Toast + Polly audio
├── hooks/
│   ├── use-glassbox-stream.ts  # WebSocket (Contract B)
│   └── use-trace-polling.ts    # Polling fallback
└── lib/
    ├── api.ts                  # Simulator API client (Contract C)
    ├── types.ts                # Trace types (Technical-doc §3.1)
    ├── stadiums.ts             # 5 stadiums + scenarios
    ├── humanize.ts             # Human-readable labels
    └── app-state.ts            # Zustand store

infra/                          # AWS SAM infrastructure
├── template.yaml               # All resources (deployed)
├── samconfig.toml              # Deploy config (us-west-2)
└── lambdas/
    ├── trace_ingest/           # POST /trace → Judge → DynamoDB → Step Functions
    ├── trace_broadcaster/      # DynamoDB Stream → WebSocket push
    ├── ws_connect/             # WebSocket $connect
    ├── ws_disconnect/          # WebSocket $disconnect
    ├── polly_alert/            # Step Functions → Polly → S3 → WebSocket
    └── postmortem_gen/         # Step Functions → Bedrock → WebSocket
```

## Stadiums & Scenarios

| Stadium | Location | Capacity | Scenario | What Happens |
|---|---|---|---|---|
| Lusail Stadium | Qatar | 88,966 | Heat Wave | Outside temp ramps 95→118°F |
| Lambeau Field | Green Bay, USA | 81,441 | Price Spike | Grid price surges 10× at step 5 |
| Wembley Stadium | London, UK | 90,000 | Normal | Happy path baseline |
| Allegiant Stadium | Las Vegas, USA | 65,000 | Broken HVAC API | HVAC tool errors after step 3 |
| Yankee Stadium | New York, USA | 54,251 | Sensor Failure | Temp sensor reads 250°F at step 8 |

## Deployed Endpoints

| Endpoint | URL |
|---|---|
| HTTP API (POST /trace) | https://kf4ssmnzui.execute-api.us-west-2.amazonaws.com/prod |
| WebSocket API | wss://wawq2a1049.execute-api.us-west-2.amazonaws.com/prod |
| S3 Audio Bucket | glassbox-platform-audiobucket-ysoas8yzvrx1 |
| Step Functions | glassbox-platform-critical-events |

## Troubleshooting

| Problem | Fix |
|---|---|
| `AccessDeniedException` on Bedrock | Refresh `AWS_BEARER_TOKEN_BEDROCK` in `backend/.env` |
| `ConnectError: All connection attempts failed` | Platform POST failing — traces still buffered locally via polling |
| Frontend shows no traces | Check backend is on port 8080, `NEXT_PUBLIC_SIMULATOR_URL` is set |
| Judge scores all critical | Update Judge Agent prompt in Bedrock console with SAFE/UNSAFE action lists |
| `ResourceNotFoundException` on seed | Use actual table name from SAM outputs, not `glassbox-stadiums` |
| Globe doesn't load | WebGL required — try different browser |

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
| AI | Bedrock Claude Sonnet 4 (Manager), Nova Lite (Judge), Guardrails |
| Knowledge Base | OpenSearch Serverless + Titan Embeddings v2 |
| Infra | API Gateway, Lambda, DynamoDB, Step Functions, Polly, S3, SNS |
| IaC | AWS SAM |
| Region | us-west-2 |
