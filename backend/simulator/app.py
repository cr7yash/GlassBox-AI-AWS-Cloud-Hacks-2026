"""FastAPI control plane (§6.5).

Endpoints:
    POST /session/start  → {session_id}
    POST /session/stop   → {ok: true}
    GET  /sessions        → list of active session IDs
    GET  /stadiums        → list of stadium profiles
    GET  /health          → liveness check
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from simulator.loop import active_sessions, start_session, stop_session
from simulator.schemas import (
    SessionStartRequest,
    SessionStartResponse,
    SessionStopRequest,
    SessionStopResponse,
)
from simulator.stadiums import STADIUMS, get_stadium

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="GlassBox Simulator", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "active_sessions": len(active_sessions())}


@app.get("/stadiums")
async def list_stadiums():
    return [s.model_dump() for s in STADIUMS.values()]


@app.get("/sessions")
async def list_sessions():
    return {"sessions": active_sessions()}


@app.post("/session/start", response_model=SessionStartResponse)
async def session_start(req: SessionStartRequest):
    try:
        stadium = get_stadium(req.stadium_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown stadium: {req.stadium_id}")

    session_id = start_session(stadium, req.scenario)
    return SessionStartResponse(session_id=session_id)


@app.post("/session/stop", response_model=SessionStopResponse)
async def session_stop(req: SessionStopRequest):
    stopped = stop_session(req.session_id)
    if not stopped:
        raise HTTPException(status_code=404, detail=f"Session not found or already stopped: {req.session_id}")
    return SessionStopResponse(ok=True)
