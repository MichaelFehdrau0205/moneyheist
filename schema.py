"""Locked schemas — message wire format and structured plan output.

The message schema is the contract with Michael (backend SSE).
The HeistPlan schema is the contract with Paula (rubric) and Jonel (render).
Don't change without telling the team.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field

MessageType = Literal["speaking", "plan_section", "risk_score", "final_word"]
AgentName = Literal["The Professor", "Brooklyn", "Detroit", "Houston"]


class Message(BaseModel):
    """Live wire message — what Michael's SSE endpoint forwards to Jonel."""

    agent: AgentName
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    type: MessageType


class Phase(BaseModel):
    timestamp: str  # "T-04:00" through "T+04:00"
    title: str
    agent: AgentName
    detail: str


class RiskScore(BaseModel):
    total: float
    detection: int
    difficulty: int
    coordination: int
    style: int


class HeistPlan(BaseModel):
    """Final structured plan emitted by The Professor at synthesis time."""

    target: str
    phases: list[Phase]
    risk_score: RiskScore
    professors_final_word: str
