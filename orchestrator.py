"""Orchestrator — runs the heist as an async generator of Messages.

This is the contract with Michael's SSE endpoint:

    async for msg in run_heist(target):
        # msg.model_dump() goes out as one SSE `data:` line

Flow (scripted round-robin, ~11 messages, fits the 2:30 demo budget):
1. Houston scouts the target (speaking)
2. Brooklyn answers the tech angle (speaking)
3. Detroit answers the timing angle (speaking)
4. Professor synthesizes verbally (speaking)
5. Professor emits structured plan -> 5 plan_section + 1 risk_score + 1 final_word
"""

from __future__ import annotations

from typing import AsyncGenerator

from agents import Crew, build_crew
from prompts import PROFESSOR_PLAN_INSTRUCTIONS
from schema import HeistPlan, Message


def _frame(target: str, prior: list[tuple[str, str]]) -> str:
    """Render the target + prior speakers into a brief context string."""
    lines = [f'Target: "{target}".']
    if prior:
        lines.append("So far:")
        for name, content in prior:
            lines.append(f"- {name}: {content}")
    return "\n".join(lines)


async def _speak(agent, ask_text: str) -> str:
    reply = await agent.ask(ask_text)
    return (reply.body or "").strip()


async def run_heist(target: str) -> AsyncGenerator[Message, None]:
    """Yield messages for one full heist run."""
    crew = build_crew()
    transcript: list[tuple[str, str]] = []

    # 1. Houston scouts.
    text = await _speak(
        crew.houston,
        f'{_frame(target, transcript)}\n\nYou go first. What do you see when you look at this place — staff, rhythms, the friendly face?',
    )
    transcript.append(("Houston", text))
    yield Message(agent="Houston", content=text, type="speaking")

    # 2. Brooklyn on the tech.
    text = await _speak(
        crew.brooklyn,
        f'{_frame(target, transcript)}\n\nYour turn. What does the tech surface look like — cameras, alarms, comms? Build on Houston, don\'t repeat him.',
    )
    transcript.append(("Brooklyn", text))
    yield Message(agent="Brooklyn", content=text, type="speaking")

    # 3. Detroit on timing/getaway.
    text = await _speak(
        crew.detroit,
        f'{_frame(target, transcript)}\n\nYour turn. The window and the way out — give me seconds and street names.',
    )
    transcript.append(("Detroit", text))
    yield Message(agent="Detroit", content=text, type="speaking")

    # 4. Professor synthesizes verbally.
    text = await _speak(
        crew.professor,
        f'{_frame(target, transcript)}\n\nLock it in two sentences. What does this heist actually look like, in voice?',
    )
    transcript.append(("The Professor", text))
    yield Message(agent="The Professor", content=text, type="speaking")

    # 5. Professor emits structured plan.
    plan_reply = await crew.professor.ask(
        f'{_frame(target, transcript)}\n\n{PROFESSOR_PLAN_INSTRUCTIONS}',
        response_schema=HeistPlan,
    )
    plan: HeistPlan | None = await plan_reply.content(retries=1)
    if plan is None:
        raise RuntimeError("Professor failed to emit a structured plan.")

    for phase in plan.phases:
        yield Message(
            agent=phase.agent,
            content=f"[{phase.timestamp}] {phase.title} — {phase.detail}",
            type="plan_section",
        )

    rs = plan.risk_score
    yield Message(
        agent="The Professor",
        content=(
            f"Risk {rs.total:.1f} — detection {rs.detection}, "
            f"difficulty {rs.difficulty}, coordination {rs.coordination}, "
            f"style {rs.style}."
        ),
        type="risk_score",
    )

    yield Message(
        agent="The Professor",
        content=plan.professors_final_word,
        type="final_word",
    )
