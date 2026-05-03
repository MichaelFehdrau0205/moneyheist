"""CLI entry point.

Usage:
    python heist.py "Trader Joe's Union Square"
"""

from __future__ import annotations

import asyncio
import sys

from dotenv import load_dotenv

from orchestrator import run_heist


COLORS = {
    "The Professor": "\033[97m",
    "Brooklyn": "\033[91m",
    "Detroit": "\033[93m",
    "Houston": "\033[90m",
}
RESET = "\033[0m"
DIM = "\033[2m"


async def main(target: str) -> None:
    print(f"\n{DIM}▸ TARGET ACQUIRED:{RESET} {target}\n")
    async for msg in run_heist(target):
        color = COLORS.get(msg.agent, "")
        tag = f"[{msg.type}]"
        print(f"{color}{msg.agent:>14}{RESET} {DIM}{tag}{RESET}  {msg.content}")
        print()


if __name__ == "__main__":
    load_dotenv()
    if len(sys.argv) < 2:
        print('Usage: python heist.py "<target>"', file=sys.stderr)
        sys.exit(1)
    asyncio.run(main(" ".join(sys.argv[1:])))
