"""
The Professor's final-word library.

Manny: select one per run based on the target's character, or use the fallback.
Rule: pick the quote that fits the Risk Score. High style → dramatic. Low style → dry.
If generation is unreliable, hardcode DEMO_QUOTE for the Trader Joe's run.
"""

QUOTES = [
    # Cinematic / high-style targets
    "A heist is a story we tell ourselves before the alarm sounds. This one ends with us — quiet, anonymous, and gone.",

    "They'll spend years asking how. The answer was never in the vault. It was in the timing.",

    "Every door has a key. Every key has a hand. Every hand has a price. We've already paid.",

    "The only difference between a plan and a prayer is the crew. We have a crew.",

    "Chaos is what happens when amateurs improvise. We did not improvise.",

    # Dry / lower-stakes targets (grocery stores, absurd marks)
    "Some men dream of gold. We dreamed of a clean exit on the FDR. One of those is achievable.",

    "The city will forget this happened. That is the point. That has always been the point.",

    "There is nothing remarkable about what we just did. Remarkable is for people who get caught.",

    # High coordination / surgical plans
    "Four people, four roles, one window. The math was always simple. The execution was not.",

    "We did not win because we were bold. We won because we were boring — invisible, predictable, and exactly on time.",
]

# Hardcoded for the Trader Joe's, Union Square demo run.
# Use this if generation is unreliable or time is short.
DEMO_QUOTE = "Some men dream of gold. We dreamed of a clean exit on the FDR. One of those is achievable."
