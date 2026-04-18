# Changelog - 2026-04-18

## Frontend ↔ Backend Integration
- Synced frontend stadiums to backend (Lambeau, Allegiant, Yankee replace Camp Nou, Maracanã, Rose Bowl)
- Synced frontend chaos modes to backend scenario enum (`price_spike`, `sensor_fail`, `api_broken`, `heat_wave`)
- Added `frontend/lib/types.ts` — TypeScript trace types matching backend Pydantic schemas (Technical-doc §3.1)
- Added `frontend/lib/api.ts` — API client for simulator FastAPI (Contract C: startSession, stopSession, fetchStadiums)
- Added `frontend/hooks/use-glassbox-stream.ts` — WebSocket hook for live trace streaming (Contract B)
- Updated `frontend/lib/app-state.ts` — Added sessionId, selectedScenario to Zustand store
- Wired dashboard to real API calls (start/stop session replaces mock simulation)
- Added `frontend/.env.example` for SIMULATOR_URL and WS_URL

## Frontend Fixes (from sanity check against Technical-doc §8 and idea.md)
- Rewrote Safety × Sustainability Quadrant as Recharts ScatterChart (was single CSS dot with wrong axes)
  - X-axis: cumulative kg_co2_delta (emissions saved), Y-axis: judge_score 0-10
  - Dots colored by severity (green/amber/red), sized by abs(dollars_delta)
  - Tooltip on hover with step, tool, score, CO₂, cost
  - Quadrant shading for danger zones
- Added PostmortemModal — auto-opens on `postmortem` WebSocket message, renders markdown
- Added CriticalAlertToast — floating toast with Polly audio playback via `new Audio(url).play()`
- Added severity color-coding to LiveTrace terminal (green/amber/red lines, left border accents)
- Added AuditorFeed — expandable judge verdicts with regulation citations (code, title, excerpt)
- Added facility state metric tiles (outside temp, inside temp, attendance, grid price)
- Added guardrail blocked banner (purple) and critical alert banner (red)

## Documentation
- Rewrote README.md with current architecture, quick start, project structure
- Updated CLAUDE.md with frontend architecture, integration status, known gaps
- Added INTEGRATION_PLAN.md with 7-step plan and interim polling mode

## Repo Cleanup
- Removed `Figma/` and `ai-shelf-frontend/` directories (258 files, 47k lines)
- Renamed `v0/` → `frontend/`
- Updated `.gitignore` with Python, simulator, and SAM entries

## Added (backend)
- Scaffolded `backend/simulator/` package (Role 2: Simulator Architect)
  - `schemas.py` — Pydantic models matching Technical-doc §3.1 (TraceRecord), §3.2 (StadiumConfig), Contract A (TracePostBody), Contract C (SessionStart/Stop)
  - `stadiums.py` — 5 hardcoded stadium profiles (Lusail, Lambeau, Wembley, Allegiant, Yankee) with 24-hour climate and grid curves
  - `scenarios.py` — 5 chaos scenario switches (normal, price_spike, sensor_fail, api_broken, heat_wave)
  - `impact.py` — Energy/cost/carbon impact calculator (kWh, $, kg CO₂)
  - `bedrock_manager.py` — Bedrock InvokeModel with Claude Sonnet 4 tool-use and Guardrails integration
  - `loop.py` — Async simulation loop (evolve → chaos → invoke → apply → impact → POST trace)
  - `app.py` — FastAPI control plane (POST /session/start, POST /session/stop, GET /stadiums, GET /health)
  - `secrets.py` — AWS Secrets Manager helper with in-process caching and env-var fallback
  - `seed_stadiums.py` — DynamoDB stadium seed script
  - `test_run.py` — Standalone test harness for Bedrock calls without UI/platform
  - `pyproject.toml`, `requirements.txt`, `.env.example`, `README.md`
- Set Manager model to Claude Sonnet 4, Judge model to Claude Opus 4.6

## Fixed (from sanity check)
- price_spike scenario was compounding 3× every tick (exponential explosion) — now captures baseline once and sets to `baseline × 3`
- Tool definitions used Converse API format (`toolSpec`/`inputSchema`) — reformatted to Messages API (`name`/`input_schema`)
- Synchronous boto3 `invoke_model` was blocking the async event loop — wrapped in `asyncio.to_thread()`
- Added missing `timestamp` and `agent` fields to `TracePostBody`
- Added warning logs when API key is empty (was failing silently with 403s)
- Fixed inference profile ARN for workshop accounts with Bearer token auth
- Fixed logger format string in loop.py (was printing status code as "score")
- Fixed JUDGE_MODEL_ID to match available inference profile format
- Removed unused imports (`json`, `sys`) from `seed_stadiums.py`

## Verified
- Successful end-to-end test run: Lusail/heat_wave (3 steps) and Lambeau/price_spike (8 steps)
- All 11 Python files pass syntax check
- All Pydantic schemas match Technical-doc §3.1, §3.2, §3.3
- Contract A and Contract C compliance verified
- Price spike stable at 3× baseline across all ticks

## Notes
- No existing changelog file was present, so this dated changelog file was initialized.
- Created `PROJECT_UNDERSTANDING.md` with a consolidated project understanding from pitch and technical docs.
