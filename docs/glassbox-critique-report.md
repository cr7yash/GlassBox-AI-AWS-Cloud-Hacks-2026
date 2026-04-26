# GlassBox Critique Report

## Executive Summary
- The simulator, ingest lambda, and frontend scaffolding are real and partially wired, and ingest can return a trace in sub-second latency.
- The live safety audit path is broken: unsafe traces are returning fallback `warning` verdicts with empty `regulations_cited`, which destroys the product claim.
- The demo is not stage-safe because backend critical-path semantics fail before UI even matters, and the required halt condition was triggered in Phase 2.

## Static Review
- [High] Role split is not cleanly implemented as documented; AI/ML logic is fragmented across simulator and lambda paths with a divergent model config file (`backend/lambdas/trace_ingest/handler.py:127-211`, `backend/models/agent_config.json:1-33`).
- [Critical] Documented SAM/CDK IaC source of truth is missing from repo root (`Technical-doc.md:526-527` references `template.yaml`, but only `backend/samconfig.toml:1-16` is present).
- [High] Region drift: SAM config points to `us-east-1` while architecture mandates `us-west-2` (`backend/samconfig.toml:13`, `Technical-doc.md:185-186`).
- [Critical] `traceIngestHandler` does not implement required Step Functions start on critical traces (`backend/lambdas/trace_ingest/handler.py:327-353`, `Technical-doc.md:44-45`, `Technical-doc.md:566-567`).
- [High] Contract A response shape mismatch: docs require top-level verdict fields, handler returns nested `trace` envelope (`backend/lambdas/trace_ingest/handler.py:346-352`, `Technical-doc.md:281-286`).
- [High] Judge invocation path diverges from documented Bedrock Agent + KB contract (`backend/lambdas/trace_ingest/handler.py:165-170`, `backend/lambdas/trace_ingest/handler.py:288-304`, `Technical-doc.md:295-308`).
- [High] Secrets handling is inconsistent: ingest auth is environment-key based (`backend/lambdas/trace_ingest/handler.py:8-10`, `backend/lambdas/trace_ingest/handler.py:239-245`) instead of documented Secrets Manager runtime fetch (`Technical-doc.md:593`).
- [Medium] Judge score coercion clamps to 1..10 while docs allow 0..10 for unsafe floor (`backend/lambdas/trace_ingest/handler.py:195-200`, `Technical-doc.md:211-212`).
- [Low] WebSocket client does not handle `session_start` message type even though it is part of documented message formats (`frontend/hooks/use-glassbox-stream.ts:54-71`, `frontend/lib/types.ts:76-81`, `Technical-doc.md:265-277`).
- [Low] No committed hardcoded production keys were found in static scan, but docs and local test files include insecure placeholder/dev patterns (`backend/lambdas/trace_ingest/test_local.py:24`, `backend/simulator/.env.example:5-7`, `README.md:24-27`).

## Backend Pipeline
- [PASS] Endpoint discovery and key lookup path available through AWS CLI; live HTTP ingest endpoint and WS endpoint resolved.
- [PASS] Smoke ingest returned HTTP 200 in ~390ms and created a trace ID.
- [FAIL] Safe/unsafe semantic validation failed: safe and unsafe traces both returned fallback-style output (`judge_score: 5`, `severity: warning`, empty `regulations_cited`) instead of expected split (`>=7 info` vs `<=3 critical`).
- [FAIL] Judge quality degraded by Bedrock invocation failure mode; verdicts were synthesized fallback behavior rather than regulation-grounded Judge output.
- [FAIL] WebSocket latency test (`<=500ms`) could not be validated in this run due missing `wscat` availability in environment.
- [FAIL] Step Functions critical orchestration evidence is not reliable for this test run because unsafe traces were not escalated to `critical`, so the critical branch trigger condition was not met.
- Schema violations observed:
- Live response is nested (`{ ok, trace_id, trace: {...} }`) vs expected flat contract output.
- Unsafe trace classification did not escalate severity despite clearly unsafe action content.
- `regulations_cited` returned empty where critical citations are mandatory.

Phase status: **FAIL (halt required)**.

## Frontend Functional
- Not executed. Per protocol, frontend browser testing is halted because Phase 2 failed.
- Critical risk if forced to proceed: frontend can look alive while backend semantics are invalid, producing a false-positive demo confidence.

## UX Critique
- Not executed. Per protocol, UX audit is halted because Phase 2 failed.
- Preliminary survivability note: visual polish cannot compensate for missing valid regulation-cited critical verdicts.

## Demo Readiness
- Full 4-minute rehearsal was not run due mandatory halt after Phase 2 failure.
- Current risk vectors:
- Dead-air risk when unsafe scenario fails to trigger dramatic critical event behavior.
- Credibility risk when judge output lacks real citations from corpus files.
- Architecture-claim risk if judges ask for Step Functions branch proof and live run does not show expected fan-out.

## Ranked Fix List
- 1) **Fix Judge invocation throughput/config so unsafe traces reliably produce real critical verdicts with citations** (Impact: Extreme, Hours: 2-4).
- 2) **Enforce hard failure on empty `regulations_cited` for critical-class decisions** (Impact: Extreme, Hours: 1-2).
- 3) **Restore contract parity for ingest response + trace schema (flat contract and documented fields)** (Impact: High, Hours: 1-3).
- 4) **Implement/verify critical-event orchestration trigger from ingest to Step Functions for every `severity=critical` trace** (Impact: High, Hours: 2-4).
- 5) **Unify region and deployment source of truth (`us-west-2`, reproducible IaC in repo root)** (Impact: High, Hours: 2-5).
- 6) Add automated backend semantic tests (safe vs unsafe expected thresholds and citation presence) before demo runs (Impact: High, Hours: 2-3).
- 7) Add a backend readiness gate in frontend session start flow to prevent demo progression when judge path is degraded (Impact: Medium, Hours: 1-2).
- 8) Add WebSocket latency verification tooling to CI/dev scripts (Impact: Medium, Hours: 1-2).
