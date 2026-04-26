# GlassBox AI — Multi-Agent Critique Report

**Author:** Composer (Cursor AI)  
**Evaluation date:** 2026-04-18  
**Repo:** `/Users/tanvi/.cursor/worktrees/AWS-Cloud-Hacks-2026/wcy`  
**Protocol:** `CURSOR_PROMPT.md` (Lead Evaluation Orchestrator). **Code changes:** none (review-only).

## Orchestrator pre-read (3 sentences)

The simulator produces structured manager traces and POSTs them to a GlassBox HTTP ingest endpoint with `x-api-key`; the trace ingest Lambda validates the body, runs a Judge (intended as Bedrock Agent + Knowledge Base in the tech doc), merges judge fields, and persists to DynamoDB, after which streams and a broadcaster should push events to WebSocket clients for the Next.js dashboard. In this repository, the implemented Judge path in `trace_ingest/handler.py` is **Claude `invoke_model` with a JSON-only system prompt**, not a Bedrock Agent/KB retrieval loop, so citations are model-generated unless you deploy a different path. Frontend integration uses the FastAPI simulator for session control and trace polling fallback; live AWS WebSocket, Step Functions, Polly, and SAM-deployed API Gateway were **not verified** in this run because there is **no `template.yaml`** in the worktree and no deployed `$API_URL` was supplied.

---

## 1. Executive Summary

- **What works:** Role split is reflected in tree layout (`backend/simulator/`, `backend/lambdas/*`, `frontend/`). Trace schema alignment across `backend/simulator/schemas.py`, `frontend/lib/types.ts`, and `trace_ingest/handler.py` is strong on field names (`regulations_cited` with `code` / `title` / `excerpt`). Local **`traceIngestHandler` smoke tests pass** (`backend/lambdas/trace_ingest/test_local.py` with `SKIP_JUDGE=1` and `--mock-judge`). Regulatory **source text files exist** under `backend/regulations/` (NFPA, ASHRAE 55/90.1, OSHA). Local simulator responds on `:8080` (`GET /health` returned `ok` during this evaluation).
- **What’s broken or missing:** **No SAM/CDK template** in-repo (`template.yaml` absent); Technical-doc §2/§7 inventory is therefore **not** represented as deployable IaC. **`sample_manager_trace.json`** referenced in Technical-doc §10 is **missing**. `trace_ingest/handler.py` has **no Step Functions `StartExecution`, no SNS publish, no critical-path orchestration** (grep: no `stepfunctions` / `StartExecution`). **Judge architecture diverges** from Technical-doc (KB-backed Agent vs prompt-only `invoke_model`), creating **citation fidelity risk** relative to `backend/regulations/`. **Routing:** doc §8.2 expects `/session/[session_id]`; app uses **single-page view switching** in `frontend/app/page.tsx` (no dedicated session URL). **Amazon Location Service / MapLibre** called out in §8 is **not present** in frontend (globe is Three.js).
- **What kills the demo:** Judges who ask “show me the regulation text” may discover citations are **LLM-paraphrases**, not retrieved chunks from the committed corpus. **No deployed pipeline** means **no real `curl $API/trace`** or **500 ms WebSocket** proof from this evaluation. **Polling fallback** (`frontend/hooks/use-trace-polling.ts`, 2 s interval) contradicts the “no polling” pitch if `NEXT_PUBLIC_WS_URL` is empty.

---

## 2. Static Review

**Repo vs role split (Technical-doc §5–8)**

- **AI/ML:** Manager + guardrails in simulator (`backend/simulator/bedrock_manager.py`); Judge logic present as Lambda handler (`backend/lambdas/trace_ingest/handler.py`) — but not as Bedrock Agent in code.
- **Simulator:** `backend/simulator/` matches Role 2 (loop, scenarios, stadiums, FastAPI `app.py`).
- **Cloud:** Lambda sources under `backend/lambdas/` (trace ingest, ws connect/disconnect, broadcaster, polly, postmortem, read/write). **No root IaC** tying them to API Gateway, DynamoDB tables, streams, or Step Functions.
- **Frontend:** `frontend/` Next.js app with globe + dashboard per `CHANGELOG_2026-04-18.md` / current files.

**Schema §3 cross-check**

- **Trace / POST body:** `TraceRecord`, `TracePostBody` (`backend/simulator/schemas.py` approx. L75–169) align with `Trace` in `frontend/lib/types.ts` (e.g. `regulations_cited: RegulationCitation[]`). No rename drift like `regulations` vs `regulations_cited` detected.
- **Severity & scores:** Enum/string usage consistent (`Severity` in Python ↔ union in TS).

**Secrets / hardcoding**

- Tracked code uses **env vars and Secrets Manager helpers** (`backend/simulator/secrets.py`, `loop.py`); `.env` patterns are **gitignored** (`.gitignore` L11–14, L24). No live API keys found in tracked `.ts`/`.py` via search (only placeholders in `.env.example` and docs).
- **Risk:** Local defaults — e.g. `GLASSBOX_API_URL` default `http://localhost:8000` in `backend/simulator/loop.py` **L138** while README runs Uvicorn on **8080** — misconfiguration causes silent failed POSTs to platform if env not set.

**Secrets Manager “implemented”?**

- **Simulator:** Yes, with env fallback (`secrets.py` L41–51).
- **trace ingest:** Uses **plain `TRACE_INGEST_API_KEY` env** (`handler.py` L239–245), not `GetSecretValue` at runtime — **simpler than §7.6** (acceptable for hackathon, but not what the doc describes for the ingest Lambda).

**SAM/CDK vs §2**

- **Mismatch:** Technical-doc §7.1 and §2 expect SAM; **no `template.yaml` / `samconfig.toml` in worktree** (only `.gitignore` mentions `.aws-sam/`). **Cannot** claim template matches service inventory.

**Regulatory corpus vs Judge**

- Files: `backend/regulations/nfpa-101-life-safety.txt`, `ashrae-55-thermal-comfort.txt`, `ashrae-90-1-energy.txt`, `osha-1910-subpart-e.txt`.
- **Judge prompt** (`handler.py` L127–150) instructs “plausible … even if paraphrased” — **does not** load or retrieve from these files. **Hallucination risk** vs prompt mandate in `CURSOR_PROMPT.md`.

**Documentation drift**

- `CLAUDE.md` still states frontend mock / stadium mismatch in places; `CHANGELOG_2026-04-18.md` claims those are fixed. **Onboarding hazard.**

---

## 3. Backend Pipeline

**Environment:** No `API_URL` or AWS credentials were provided for this evaluation. **Deployed** API Gateway + DynamoDB + Streams + WebSocket + Step Functions were **not exercised**.

| Check | Result | Notes |
|--------|--------|--------|
| Smoke ingest (`curl` §10) | **Not run** | Requires deployed `$API_URL` + `$KEY`. |
| Safe trace → score ≥ 7, `severity: info` | **Not run** (deployed) | Local `test_local.py --mock-judge` returned `judge_score: 8`, `severity: info` (~instant, mocked Bedrock). |
| Unsafe trace → low score, `critical`, citations | **Not run** (deployed) | Handler code paths exist; no live Bedrock judge call in this evaluation. |
| Step Functions both branches | **Fail / not implemented in handler** | `trace_ingest/handler.py` has **no** `states:StartExecution` or Lambda wiring in the reviewed file. |
| WebSocket ≤500 ms after POST | **Not run** | No WS URL; broadcaster Lambda not integration-tested. |
| Local handler unit smoke | **Pass** | `TRACE_INGEST_API_KEY=test-secret SKIP_JUDGE=1 python3 test_local.py` → `statusCode: 200`, `put_item` called once. Same with `--mock-judge`. |

**Phase 2 halt rule:** The **deployed** pipeline was not proven. Per protocol, **full backend validation is blocked** until `curl` + WS tests run against real infra.

---

## 4. Frontend Functional

**Constraint:** No browser automation or Amplify URL was used in this evaluation.

| Step (idea.md / CURSOR_PROMPT Phase 3) | Result |
|----------------------------------------|--------|
| Map / Location Service | **Not tested.** Codebase uses **Three.js globe** (`frontend/components/globe/`), not Amazon Location Service. |
| Session start → `/session/start` | **Code review only:** `frontend/components/dashboard/dashboard.tsx` imports `startSession` from `@/lib/api` — likely correct; **no** navigation to `/session/[id]` (`frontend/app/page.tsx` only toggles Zustand `view`). |
| WebSocket sync ≤10 s | **Not tested.** `use-glassbox-stream.ts` depends on `NEXT_PUBLIC_WS_URL`; empty → relies on **polling** (`use-trace-polling.ts`, **2 s**). |
| Quadrant / terminal / alerts | **Not tested** in browser. |

---

## 5. UX Critique (code-level only; no layout capture)

**Pitch-killing**

- **“Real citations from KB” story** is **not** backed by current Judge implementation in `trace_ingest/handler.py` (prompt-based JSON). UX can show citations that **aren’t** grounded in `backend/regulations/`.
- **Polling-visible latency** if WebSocket unset — undermines “real-time observability” claim.

**Noticeable**

- **Single-route app** vs documented `/session/[session_id]` — shareable deep links and refresh behavior may be weaker than judges expect.

**Cosmetic**

- (Skipped — no visual inspection.)

---

## 6. Demo Readiness

**Not executed:** Full 4-minute script with stopwatch (requires stable deployed stack + presenter). **Risk vectors from static + partial backend evidence:**

- **Dead air** if traces only poll every 2 s and judges expect sub-second updates.
- **Scene 2–4** (critical → Polly + postmortem) depend on Step Functions + Lambdas **not** evidenced in `trace_ingest` hot path in this repo snapshot.
- **Scene 0** map story may need copy alignment: **esri/Location** vs **3D globe**.

---

## 7. Ranked Fix List

Ordered by `(Impact on Demo) × (Hours to Fix)` — highest priority first.

1. **Deploy minimal real pipeline** — API Gateway POST `/trace` → `traceIngest` → DynamoDB (+ optional stream) so §10 `curl` and WS tests can pass. **Impact: critical. Hours: high (8–16+)** without pre-built SAM.
2. **Add root `template.yaml` (or CDK)** matching §7 tables, HTTP API, Lambdas, stream → broadcaster, WebSocket API — **Impact: critical. Hours: high.**
3. **Wire Judge to Bedrock Knowledge Base** (or deterministic retrieval from `backend/regulations/`) so citations are **verifiable** against corpus — **Impact: critical for safety-track credibility. Hours: medium–high.**
4. **Implement critical path in ingest** — SNS and/or Step Functions kickoff when `severity == critical` (per §7.5–7.7); connect Polly + postmortem Lambdas — **Impact: high for “wow” demos. Hours: medium.**
5. **Commit `sample_manager_trace.json`** at repo root (or under `backend/lambdas/trace_ingest/`) matching §10 — **Impact: medium (team velocity + judging). Hours: low (~0.5).**
6. **Align `GLASSBOX_API_URL` default port** with Uvicorn **8080** or document single canonical port — **Impact: medium (silent trace loss). Hours: low.**
7. **Refresh `CLAUDE.md` integration section** to match `CHANGELOG` / current frontend — **Impact: low–medium (team confusion). Hours: low.**
8. **Amazon Location Service** (if pitch deck promises ESRI map) — **Impact: medium for “AWS-native map” story. Hours: medium.**

---

## Appendix: Commands run

```text
[Instantiating Agent: Static-Analysis-Agent]
curl http://localhost:8080/health

[Instantiating Agent: Backend-QA-Agent]
curl http://127.0.0.1:8080/health
cd backend/lambdas/trace_ingest && TRACE_INGEST_API_KEY=test-secret SKIP_JUDGE=1 python3 test_local.py
cd backend/lambdas/trace_ingest && TRACE_INGEST_API_KEY=test-secret python3 test_local.py --mock-judge
```

---

*End of report — Composer (Cursor AI).*
