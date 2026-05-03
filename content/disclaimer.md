# Disclaimer Copy

> Owner: Paula (writes), Jonel (renders).
> Two placements: persistent footer throughout the session, and the final card beat at 2:15–2:30.

---

## Persistent Footer

Renders at the bottom of the page throughout the entire demo. Small, mono, muted — visible but not intrusive.

```
This plan exists only in narrative form. The crew is fictional. The targets are inert. Don't actually rob places.
```

**Styling guidance:** JetBrains Mono, 9px, `#666666` (text-dim). Centered. Always visible.

---

## Final Card Disclaimer

Renders inside the Professor's closing card at 2:15, directly below the italic quote. Part of the emotional beat — make it feel like the last frame of a film, not a legal warning.

```
This plan exists only in narrative form.
The Heist Crew is a fictional simulation built with AG2 multi-agent AI.
No vaults were harmed. No Trader Joe's was robbed.
```

**Styling guidance:** Inter, 11px, `#888888` (text-muted). Centered italic. Below the Professor's quote, above the "Run another heist" button (if present).

---

## Usage Notes for Jonel

- The footer copy is one line, never wraps on desktop.
- The final card copy is three lines, each line break is intentional — render as three `<p>` tags or use `whitespace-pre-line`.
- Neither disclaimer uses quotes, asterisks, or legal language. Tone is dry comedy, not CYA.
