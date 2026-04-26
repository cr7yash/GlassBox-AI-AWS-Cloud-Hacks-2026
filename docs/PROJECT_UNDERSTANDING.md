# GlassBox AI: Project Understanding

This document captures my consolidated understanding of the project from the pitch and technical build docs.

## 1) What this project is

GlassBox AI is a real-time observability and safety-auditing platform for autonomous AI agents.

The demo environment is a Smart Stadium Simulator where an AI Facility Manager makes operational decisions (HVAC, lighting, ventilation, etc.) under dynamic conditions. A second AI Judge audits those decisions for safety and regulatory compliance.

Core value proposition:
- Make AI decision-making visible (not a black box)
- Detect unsafe choices in real time
- Ground critical findings in real regulations (NFPA, ASHRAE, OSHA, etc.)
- Show safety and sustainability trade-offs clearly

## 2) End-to-end system flow

1. Simulator (Python) emits stadium state every ~5 seconds.
2. Simulator calls Manager model on Bedrock (with Guardrails enabled).
3. Simulator posts manager trace to API Gateway HTTP endpoint (`POST /trace`).
4. `traceIngestHandler` Lambda validates payload and API key (Secrets Manager), then invokes Judge Agent.
5. Lambda writes enriched trace (manager + judge verdict) to DynamoDB.
6. If severity is critical, Lambda starts Step Functions critical-event workflow.
7. DynamoDB Streams trigger broadcaster Lambda for real-time WebSocket fan-out.
8. Frontend subscribes to WebSocket and renders traces, alerts, and postmortems live.

Critical path additions:
- Step Functions parallel branch runs Polly audio generation + postmortem generation
- Resulting audio URL and markdown are written back and broadcast to clients

## 3) Key AWS services in scope

- Amazon Bedrock (Manager model)
- Bedrock Agents (Judge)
- Bedrock Knowledge Bases + OpenSearch Serverless (regulation retrieval)
- Bedrock Guardrails (prevent unsafe manager output)
- API Gateway (HTTP + WebSocket)
- AWS Lambda (ingest, broadcast, websocket handlers, polly, postmortem)
- DynamoDB (+ Streams)
- Step Functions (critical-event orchestration)
- S3 (regulation docs, audio artifacts, frontend artifacts)
- Secrets Manager (api keys/config ids)
- IAM (least privilege)
- CloudWatch (logs)
- Amplify (frontend hosting)
- Amazon Location Service (map)

Region requirement: `us-west-2` only.

## 4) Source-of-truth data expectations

Trace records include:
- Session linkage: `trace_id`, `session_id`, `stadium_id`, `scenario`, `timestamp`, `step`
- Manager decision fields: `observation`, `thought`, `action`
- Judge fields: `judge_score`, `judge_reasoning`, `regulations_cited`, `severity`
- Impact fields: `dollars_delta`, `kwh_delta`, `kg_co2_delta`
- Operational fields: `tokens`, `latency_ms`, `polly_audio_url`, `postmortem_md`
- Guardrails extension: `guardrail_blocked`, `guardrail_intervention`

Scenarios expected in system behavior:
- `normal`
- `price_spike`
- `sensor_fail`
- `api_broken`
- `heat_wave`

WebSocket message types expected by frontend:
- `trace`
- `critical_alert`
- `postmortem`
- `session_start`

## 5) Cross-role integration contracts (must stay stable)

- Simulator -> Platform: `POST /trace` with `x-api-key`
- Platform -> Frontend: WebSocket stream filtered by `session_id`
- Frontend -> Simulator: control plane `POST /session/start` and `POST /session/stop`
- Judge I/O schema: strict structured response with score, reasoning, citations, severity

These interfaces are non-negotiable during rapid build; changes must be coordinated.

## 6) Frontend product expectations

Primary dashboard experience should include:
- Stadium map and scenario picker
- Live Safety x Sustainability quadrant chart (centerpiece)
- Trace terminal with color-coded severity
- Facility state panel (temp, attendance, cost, carbon)
- Auditor feed with regulation citations
- Critical alert toast + Polly playback
- Postmortem modal on critical events

Design direction called out in docs:
- Dark, operator/SRE style
- Real-time feel (WebSockets over polling)
- Polished and demo-first

## 7) Current repo state vs build docs

Observed current repo structure includes:
- `frontend/` as Vite + React TypeScript app (not Next.js app-router scaffold)
- `backend/` with initial utility/models placeholders
- Core docs present (`idea.md`, `Technical-doc.md`)

Implication:
- Team should explicitly decide whether to keep Vite (faster continuity) or migrate to Next.js (matches docs). This is a strategic choice and should be locked early to avoid churn.

## 8) Risk and execution priorities (from docs)

Must-have demo-critical capabilities:
- End-to-end ingestion and judge verdict from curl
- Live WebSocket updates to UI
- At least one critical scenario firing cleanly
- Regulation-cited safety finding
- Quadrant visualization updating live

Feature cuts if blocked by time:
- Prioritize core stream + judge + quadrant first
- Defer optional polish/features after first end-to-end success

## 9) My practical interpretation

This project should be treated as a platform demo with a simulator client, not as a simulator product.

The strongest differentiator is dual-layer safety:
1) Preventive controls (Guardrails)
2) Detective controls (Judge with regulation-grounded citations)

If both layers are visible in one scenario (especially `price_spike`), the demo story becomes both technically credible and memorable.
