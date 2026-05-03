"""SSE wrapper around run_heist — connects Manny's agent flow to the frontend.

Local dev:
    python -m venv .venv
    .venv\\Scripts\\activate         (Windows)  /  source .venv/bin/activate  (Unix)
    pip install -r requirements.txt
    cp .env.example .env             # add your key, see agents.py for required vars
    python -m uvicorn server:app --reload --port 8000

Expose to the deployed frontend via Cloudflare Tunnel:
    cloudflared tunnel --url http://localhost:8000

Then open the deployed app with `?backend=https://<tunnel-host>` appended.
"""

from __future__ import annotations

import json
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from orchestrator import run_heist

load_dotenv()

logger = logging.getLogger("heist.server")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Heist Crew SSE")

# CORS: open for the demo. Tighten to the Vercel origin post-demo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.get("/heist")
async def heist(target: str, request: Request) -> EventSourceResponse:
    """Stream agent messages as SSE. One JSON Message per `data:` line."""

    if not target.strip():
        raise HTTPException(status_code=400, detail="target query param is required")

    async def event_generator():
        try:
            async for msg in run_heist(target):
                if await request.is_disconnected():
                    logger.info("Client disconnected mid-stream")
                    return
                yield {
                    "event": "message",
                    "data": json.dumps(msg.model_dump()),
                }
        except Exception as exc:
            logger.exception("run_heist raised")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(exc), "type": "server_error"}),
            }

    return EventSourceResponse(event_generator())
