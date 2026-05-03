"""Locked schemas — message wire format and structured plan output.

The message schema is the contract with Michael (backend SSE).
HeistPlan mirrors schema/plan_schema.json (Paula's spec) — keep them in sync.
Don't change without telling the team.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, computed_field

MessageType = Literal["speaking", "plan_section", "risk_score", "final_word"]
AgentName = Literal["The Professor", "Brooklyn", "Detroit", "Houston"]
AgentId = Literal["professor", "brooklyn", "detroit", "houston"]
PhaseTimestamp = Literal["T-04:00", "T-02:00", "T+00:00", "T+02:00", "T+04:00"]

_AGENT_ID_MAP: dict[str, AgentId] = {
    "The Professor": "professor",
    "Brooklyn": "brooklyn",
    "Detroit": "detroit",
    "Houston": "houston",
}


class Message(BaseModel):
    """Live wire message — what Michael's SSE endpoint forwards to Jonel.

    `agent` matches Paula's plan schema (capitalized canonical name, also
    used as the display label). `agent_id` is the lowercase lookup key
    Jonel's crew table is indexed by — derived automatically.
    """

    agent: AgentName
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    type: MessageType

    @computed_field  # type: ignore[prop-decorator]
    @property
    def agent_id(self) -> AgentId:
        return _AGENT_ID_MAP[self.agent]


class Phase(BaseModel):
    timestamp: PhaseTimestamp
    title: str = Field(max_length=40)
    agent: AgentName
    detail: str = Field(max_length=120)


class RiskScore(BaseModel):
    total: float = Field(ge=0, le=10)
    detection: int = Field(ge=0, le=10)
    difficulty: int = Field(ge=0, le=10)
    coordination: int = Field(ge=0, le=10)
    style: int = Field(ge=0, le=10)


class HeistPlan(BaseModel):
    """Final structured plan emitted by The Professor at synthesis time.

    Mirrors schema/plan_schema.json. Phases must be exactly 5 in chronological
    order: T-04:00, T-02:00, T+00:00, T+02:00, T+04:00.
    """

    target: str
    phases: list[Phase] = Field(min_length=5, max_length=5)
    risk_score: RiskScore
    professors_final_word: str = Field(max_length=200)
