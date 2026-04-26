# glassbox critique report (codex)

## Executive Summary
- What works: the repo has clear AI/ML, simulator, cloud Lambda, and frontend surfaces, and live `POST /trace` returns in sub-second latency.
- What's broken: judge evaluation is non-functional in production (model invocation failures), WebSocket connect path returns HTTP 500, and critical-event orchestration fails.
- What kills the demo: unsafe traces are not classified as critical with real citations, so the "regulation-grounded safety intervention" story collapses on stage.

## Static Review
- **Role split mostly matches doc**: AI/simulator/cloud/frontend code exists across `backend/simulator/`, `backend/lambdas/`, and `frontend/`, and regulations corpus is present in `backend/regulations/` files (`nfpa-101-life-safety.txt`, `ashrae-55-thermal-comfort.txt`, `ashrae-90-1-energy.txt`, `osha-1910-subpart-e.txt`).
- **Bedrock Agent + KB contract is not implemented in ingest path**: `backend/lambdas/trace_ingest/handler.py` calls `bedrock-runtime.invoke_model` directly instead of a Bedrock Agent (`_invoke_judge`), and explicitly permits "plausible ... paraphrased" citations in prompt rules (`backend/lambdas/trace_ingest/handler.py` lines 127-150). This violates the "retrieve real regulations before grading" requirement in `Technical-doc.md`.
- **Hallucination risk is explicitly encoded**: the judge prompt instructs generated citations even when paraphrased (`backend/lambdas/trace_ingest/handler.py` line 150), which is exactly the pitch-killer failure mode called out in the protocol.
- **Secrets Manager integration is partial/missing where it matters**: ingest auth checks `TRACE_INGEST_API_KEY` env var directly (`backend/lambdas/trace_ingest/handler.py` lines 238-245) rather than fetching expected key from Secrets Manager as specified in `Technical-doc.md` §7.6.
- **Critical-event trigger contract missing in code**: there is no Step Functions `StartExecution` call in `backend/lambdas/trace_ingest/handler.py` even though the doc requires triggering on `severity=critical`; this means critical path orchestration is not wired at source.
- **IaC mismatch and reproducibility gap**: `backend/samconfig.toml` exists, but no `template.yaml`/`template.yml` is in repo root or backend root; `samconfig` is also pinned to `us-east-1` (`backend/samconfig.toml` line 13) while architecture docs require `us-west-2`.
- **Frontend map implementation diverges from architecture**: no Amazon Location SDK/MapLibre usage exists in frontend (no matches for `@aws-sdk/client-location`, `maplibre`, or `Location Service`), and app entry renders a custom globe flow (`frontend/app/page.tsx` lines 1-31), not the documented Amazon Location map path.
- **Good news on committed secrets**: no tracked `.env` runtime secret files were found in this worktree; only examples exist (`backend/simulator/.env.example`, `frontend/.env.example`).

## Backend Pipeline
- **[FAIL] Smoke test ingest (live endpoint)**: `POST https://1rsa0vy5yd.execute-api.us-west-2.amazonaws.com/trace` with valid key returns HTTP 200 in ~816ms, but verdict payload is degraded (`judge_score=5`, `severity=warning`, `regulations_cited=[]`) because Bedrock invocation fails with "on-demand throughput isn't supported" for configured model ID.
- **[FAIL] Safe trace classification**: safe payload returns in ~280ms but still `judge_score=5`, `severity=warning`, zero citations; expected `judge_score >= 7`, `severity=info`.
- **[FAIL] Unsafe trace classification**: unsafe payload returns in ~343ms but still `judge_score=5`, `severity=warning`, zero citations; expected `judge_score <= 3`, `severity=critical`, and grounded NFPA/OSHA citations.
- **[FAIL] Local fallback hides unsafe behavior**: with `SKIP_JUDGE=1`, an intentionally dangerous "lights off with 78,000 attendees" trace returns `judge_score=7`, `severity=info`, placeholder citation (local script invocation). This can create false confidence during testing.
- **[FAIL] Step Functions critical path**: no ingest-driven executions observed; manual execution of `glassbox-dev-critical` failed immediately. Failure cause from execution history: postmortem branch Bedrock model invocation uses unsupported on-demand model ID (`anthropic.claude-sonnet-4-20250514-v1:0`).
- **[FAIL] WebSocket streaming path**: direct connection attempt to `wss://56pe5azulh.execute-api.us-west-2.amazonaws.com/prod?session_id=...` fails handshake with HTTP 500, so "trace appears within 500ms" requirement cannot be met.
- **Likely root cause for WS 500**: Lambda invoke policy on `glassbox-dev-ws-connect` / `glassbox-dev-ws-disconnect` scopes API Gateway source ARN to `.../*/@connections/*` instead of route invocation patterns (`$connect`/`$disconnect`), which can block route execution.

## Frontend Functional
- **Halted per protocol**: not executed because Phase 2 failed on backend critical path.
- **Pre-check risk**: dashboard is designed to fall back to polling (`frontend/components/dashboard/dashboard.tsx` lines 53-63), which can mask broken WebSocket infra in rehearsals and then fail under stage expectations for real-time push.

## UX Critique
- **Halted per protocol**: not executed because Phase 2 failed on backend critical path.
- **Pitch risk callout**: if backend remains degraded, UI polish is irrelevant because safety events/citations (the core trust signal) will present as generic warnings or dead air.

## Demo Readiness
- **Status: NOT READY**
- **Scene 0 (map intro)**: likely runnable from frontend shell, but architecture/story mismatch remains (custom globe vs documented Amazon Location flow).
- **Scene 2 (safety violation drama)**: currently fails core requirement; unsafe traces do not produce deterministic critical verdicts with grounded citations.
- **Critical-event moment (Polly + postmortem)**: currently broken; state machine fails due unsupported model invocation in postmortem branch.
- **Dead-air vectors**: WebSocket handshake 500, no real-time stream guarantee, and no reliable critical alert chain.

## Ranked Fix List
- **1) Fix judge model invocation path in ingest Lambda (Mandatory)** — swap to supported inference profile/model ID and validate real judge outputs (`score`, `severity`, `regulations_cited`) on safe/unsafe fixtures. **Impact: maximum, Est: 1-2h.**
- **2) Replace "plausible citations" prompt behavior with grounded retrieval-only citations (Mandatory)** — no fabricated paraphrases; reject/flag when retrieval is empty. **Impact: maximum, Est: 1-2h.**
- **3) Wire critical trigger from ingest to Step Functions + verify both branches green (Mandatory)** — enforce `severity=critical -> StartExecution` and add execution logging/alerts. **Impact: very high, Est: 1-2h.**
- **4) Repair WebSocket connect permissions/routes (Mandatory)** — correct Lambda invoke `SourceArn` for `$connect/$disconnect`, then validate sub-500ms trace delivery with a scripted WS test. **Impact: very high, Est: 1-2h.**
- **5) Unify secrets strategy and remove plaintext API key dependency (Mandatory)** — ingest should validate against Secrets Manager-backed key and avoid hardcoded/test env drift. **Impact: high, Est: 1h.**
- **6) Restore reproducible IaC source of truth (High)** — add/fix SAM template in repo and align region to `us-west-2`. **Impact: high, Est: 2-3h.**
- **7) Align frontend map implementation with pitch architecture or update script/docs (Medium)** — avoid architecture contradiction during judging Q&A. **Impact: medium, Est: 1-2h.**
