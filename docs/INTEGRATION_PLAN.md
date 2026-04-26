# Backend ↔ Frontend Integration Plan

## Current State

- **Backend:** Fully working simulator with real Bedrock calls, FastAPI control plane on port 8080
- **Frontend:** Next.js 16 with 3D globe, audit dashboard, but running client-side mock simulation
- **Platform (Role 3):** Not yet deployed — no API Gateway, no WebSocket, no DynamoDB

## Mismatches to Fix

### 1. Stadium List Sync

Frontend (`lib/stadiums.ts`) has: Lusail, Wembley, Camp Nou, Maracanã, Rose Bowl
Backend (`simulator/stadiums.py`) has: Lusail, Lambeau, Wembley, Allegiant, Yankee

**Fix:** Update `frontend/lib/stadiums.ts` to match backend's 5 stadiums with correct coordinates and capacities.

### 2. Chaos Mode Sync

Frontend (`lib/simulation.ts`) has: `normal | heatwave | crowd-surge | power-outage | weather-alert`
Backend (`simulator/schemas.py`) has: `normal | price_spike | sensor_fail | api_broken | heat_wave`

**Fix:** Update frontend chaos options to match backend scenario enum values.

### 3. Simulation Data Shape

Frontend `runSimulationStep()` returns `{safety, strain, lines}` — synthetic numbers.
Backend trace has `{observation, thought, action, impact, tokens, latency_ms}` — real Bedrock output.

**Fix:** Create a frontend trace type matching `TracePostBody` schema and parse real data.

## Integration Steps (in order)

### Step 1: Sync Static Data
- Update `frontend/lib/stadiums.ts` → 5 backend stadiums (lusail, lambeau, wembley, allegiant, yankee)
- Update chaos modes in `frontend/components/dashboard/dashboard.tsx` → backend scenarios
- Update `frontend/lib/simulation.ts` types to match backend `Scenario` enum

### Step 2: Add API Client
- Create `frontend/lib/api.ts` with:
  - `startSession(stadiumId, scenario)` → calls `POST {SIMULATOR_URL}/session/start`
  - `stopSession(sessionId)` → calls `POST {SIMULATOR_URL}/session/stop`
  - `getStadiums()` → calls `GET {SIMULATOR_URL}/stadiums`
- Add env var `NEXT_PUBLIC_SIMULATOR_URL` (ngrok URL or localhost:8080)

### Step 3: Add Trace Types
- Create `frontend/lib/types.ts` matching backend `TracePostBody` / `TraceRecord` schema:
  - `Observation`, `Action`, `Impact`, `TokenUsage`, `RegulationCitation`
  - `Trace` (the full record from WebSocket)

### Step 4: Wire Globe → Simulator
- On stadium pin click → store stadium in Zustand → transition → dashboard
- On "Run simulation step" → call `startSession(stadiumId, scenario)` instead of mock
- Store `sessionId` in Zustand app state

### Step 5: Add WebSocket Hook (when Role 3 is ready)
- Create `frontend/hooks/use-glassbox-stream.ts`:
  ```ts
  function useGlassboxStream(sessionId: string) {
    // Connect to wss://{WS_URL}?session_id={sessionId}
    // Parse messages: trace | critical_alert | postmortem
    // Return { traces, alerts, postmortems }
  }
  ```
- Wire into dashboard components

### Step 6: Update Dashboard Components
- `live-trace.tsx` → render real `thought` + `action` from traces instead of mock lines
- `safety-quadrant.tsx` → plot `judge_score` (Y) vs `impact.kg_co2_delta` (X) from real traces
- `workflow-pipeline.tsx` → highlight active agent based on trace `agent` field
- `lumen-rail.tsx` → derive health from latest `judge_score`
- Add severity color coding (green/amber/red based on `severity` field)

### Step 7: Add Missing Dashboard Features
- Postmortem modal (auto-opens on `postmortem` WebSocket message)
- Critical alert toast (plays Polly audio on `critical_alert` message)
- Guardrail blocked banner (purple, when `guardrail_blocked: true`)
- Facility state panel (temp, attendance, grid price from `observation`)

## Interim Mode (Before Role 3)

Until the platform is deployed, the frontend can call the simulator directly:

1. Simulator runs on `localhost:8080` (or ngrok)
2. Frontend calls `POST /session/start` to begin
3. Simulator POSTs traces to a local echo server (or we add a `GET /traces/{session_id}` endpoint to the simulator for polling)
4. Frontend polls that endpoint every 2s

This lets us demo the full flow without WebSocket infrastructure.

## Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_SIMULATOR_URL=http://localhost:8080   # or ngrok URL
NEXT_PUBLIC_WS_URL=wss://XXX.execute-api.us-west-2.amazonaws.com/prod  # when Role 3 is ready
```
