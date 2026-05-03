"""The four crew members as AG2 beta Agents.

Factory functions — call `build_crew()` to get all four wired to the same
shared model config.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from autogen.beta import Agent
from autogen.beta.config import OpenAIConfig

from prompts import BROOKLYN, DETROIT, HOUSTON, PROFESSOR


def _model_config() -> OpenAIConfig:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY not set. Copy .env.example to .env and fill it in."
        )
    return OpenAIConfig(
        model=os.environ.get("HEIST_MODEL", "google/gemini-2.5-flash"),
        streaming=False,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        max_completion_tokens=512,
    )


@dataclass
class Crew:
    professor: Agent
    brooklyn: Agent
    detroit: Agent
    houston: Agent


def build_crew() -> Crew:
    config = _model_config()
    return Crew(
        professor=Agent(name="The Professor", prompt=PROFESSOR, config=config),
        brooklyn=Agent(name="Brooklyn", prompt=BROOKLYN, config=config),
        detroit=Agent(name="Detroit", prompt=DETROIT, config=config),
        houston=Agent(name="Houston", prompt=HOUSTON, config=config),
    )
