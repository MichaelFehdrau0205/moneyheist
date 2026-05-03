"""FastAPI + SSE wrapper around run_heist for local backend.

Run with:
    uvicorn api.index:app --port 8000
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

logger = logging.getLogger("heist.api")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Heist Crew API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.get("/heist")
async def heist(target: str, request: Request) -> EventSourceResponse:
    if not target.strip():
        raise HTTPException(status_code=400, detail="target query param is required")

    async def event_generator():
        try:
            async for msg in run_heist(target):
                if await request.is_disconnected():
                    logger.info("Client disconnected mid-stream")
                    return
                yield {"data": msg.model_dump_json()}
        except Exception as exc:
            logger.exception("run_heist raised")
            yield {"data": json.dumps({"type": "error", "content": str(exc)})}
            return

    return EventSourceResponse(event_generator())
