"""
The Professor's final-word library.

Pick by Risk Score character:
  Style >= 8      → cinematic (first 5)
  Style 6–7       → dry/lower-stakes (next 3)
  Coordination >= 8 → surgical (last 2)
DEMO_QUOTE is the safe hardcoded fallback for the Trader Joe's run.
"""

PROFESSOR_QUOTE_LIBRARY = [
    # Cinematic / high-style targets (Style >= 8)
    "A heist is a story we tell ourselves before the alarm sounds. This one ends with us — quiet, anonymous, and gone.",
    "They'll spend years asking how. The answer was never in the vault. It was in the timing.",
    "Every door has a key. Every key has a hand. Every hand has a price. We've already paid.",
    "The only difference between a plan and a prayer is the crew. We have a crew.",
    "Chaos is what happens when amateurs improvise. We did not improvise.",
    # Dry / lower-stakes targets (Style 6–7, e.g. grocery stores)
    "Some men dream of gold. We dreamed of a clean exit on the FDR. One of those is achievable.",
    "The city will forget this happened. That is the point. That has always been the point.",
    "There is nothing remarkable about what we just did. Remarkable is for people who get caught.",
    # High coordination / surgical plans (Coordination >= 8)
    "Four people, four roles, one window. The math was always simple. The execution was not.",
    "We did not win because we were bold. We won because we were boring — invisible, predictable, and exactly on time.",
]

DEMO_QUOTE = "Some men dream of gold. We dreamed of a clean exit on the FDR. One of those is achievable."
