# BUILD-PLAN.md — The Heist Crew

> 4 builders, ~3 hours to 4:00 PM demo. Roles, interfaces, timeline.
> Read this once, then go build. Don't change interfaces without telling everyone.

## Team

| Builder | Role | Owns |
|---------|------|------|
| **Jonel** | Frontend UI + Visual + Map | Full frontend surface: layout, animations, Mapbox, geocoding, fallbacks |
| **Manny** | Agents + AG2 orchestration + pitch | The 4 agents, prompts, orchestrator, message schema, demo pitch |
| **Michael** | Backend API + SSE + reliability | FastAPI, SSE endpoint, ngrok, demo-mode JSON fallback |
| **Paula** | Plan schema + Risk Score rubric + content + demo production | The structured plan format, scoring rubric, Professor's quote library, disclaimer copy, demo target vetting |

---

## Jonel — Frontend UI + Visual + Map

**First tasks (in order):**
1. Spin up Next.js 16 + Tailwind v4 + Framer Motion. Vercel deploy of an empty page in 15 min.
2. Set up `next/font` for Bebas Neue, JetBrains Mono, Inter. Lock color tokens (`#0a0a0a`, `#0f0f0f`, `#1f1f1f`, `#DC0000`, `#C9A227`).
3. Build static layout with hardcoded mock data: header → target reveal → map slot → crew cards → debate panel → bottom row → final card.
4. Build Framer Motion animations: crew card slide-in (100ms stagger, ease-out 400ms), typewriter (~30ms/char), phase reveal (fade + slide up 8px, 150ms apart), Risk Score stamp (1.5x → 1.0x scale, slight rotation, hard stop).
5. Mapbox setup: account, token in `NEXT_PUBLIC_MAPBOX_TOKEN`, custom dark Studio style (~10 min).
6. Build `<TargetMap target onZoomComplete />`: Mapbox GL JS at NYC overview (zoom 11) → `flyTo` zoom 17 over 1.5s `easeInOutCubic` → SVG crosshair (3 concentric red circles + center dot + "▼ TARGET") fades in at 80% flight.
7. Build cached geocode JSON for at least 5 targets (Paula will give you the final list).
8. Static dark NYC PNG fallback if Mapbox fails. Demo continues without zoom animation.
9. Source and integrate Bella Ciao MP3. Volume choreography: 30% → 50% → fade out by Professor's final word.
10. Wire up SSE to Michael's `/heist` endpoint last.

**Deliverable:** the complete frontend, ready to run on Vercel + ngrok backend.

**If falling behind, cut in this order:** live Mapbox geocoding (rely on cached JSON only) → 200m radius overlay → Bella Ciao audio → Run-another-heist button.

---

## Manny — Agents + AG2 orchestration + pitch

**First tasks (in order):**
1. Refactor `agent.py` into:
   - `agents.py` (the 4 personas)
   - `prompts.py` (system prompts with voice + refusal guardrails)
   - `orchestrator.py` (the GroupChat flow)
2. Write the 4 system prompts per PRD Appendix A voice direction. Bake in:
   - **Voice:** Professor (theatrical, three-act), Brooklyn (cocky, hyper-technical), Detroit (terse, timing-obsessed), Houston (charming, observational)
   - **Refusals:** no real named individuals, no real residential addresses, no operational specifics for real security systems. Pulpy narrative only.
   - **Length cap:** strict 2-sentence response limit per turn. The typewriter at 30ms/char will run long otherwise.
3. Lock message schema with Michael:
   ```json
   {
     "agent": "Brooklyn" | "Detroit" | "Houston" | "The Professor",
     "content": "string",
     "timestamp": "ISO-8601",
     "type": "speaking" | "plan_section" | "risk_score" | "final_word"
   }
   ```
4. Lock plan output schema with Paula (see Paula's section below).
5. Get CLI version working: `python heist.py "Trader Joe's Union Square"` → agent dialogue → structured plan → risk score → Professor's final quote.
6. Bake Paula's Risk Score rubric into the Professor's prompt so scoring is consistent.
7. Expose `async def run_heist(target: str) -> AsyncGenerator[Message, None]` for Michael.
8. **Last 30 min:** own the pitch script. Rehearse 3x.

**Deliverable:** `run_heist()` async function yielding messages on the locked schema.

---

## Michael — Backend API + SSE + reliability

**First tasks (in order):**
1. Stand up FastAPI with one SSE endpoint: `GET /heist?target={target}`. **Stub with fake messages on a timer first** so Jonel isn't blocked.
2. Add CORS for the Vercel domain. Add `GET /health`.
3. Set up ngrok. Confirm Jonel's deployed Vercel app can hit the tunnel URL. Share URL in team chat.
4. When Manny's `run_heist()` is ready: swap stub for real call. Make sure SSE flushes per-message (no buffering).
5. **Reliability fallback (P0, do not skip):** record one full successful run as `fallback.json`. Add `?demo=true` query param that replays it at same pacing. Safety net for live demo.

**Deliverable:** running SSE endpoint, documented event contract, working `?demo=true` fallback.

---

## Paula — Plan schema + Risk Score rubric + content + demo production

You're the editorial spine. Three engineers ship features; you make sure the features tell a coherent story. The Risk Score and the Professor's final word are the two emotional beats of the entire 2:30 — they need design attention, not improvisation.

**First tasks (in order):**

1. **Lock the plan output schema with Manny (first 15 min).** This is what The Professor emits at synthesis time. Suggested:
   ```json
   {
     "target": "Trader Joe's, Union Square",
     "phases": [
       {"timestamp": "T-04:00", "title": "Eyes on the prize", "agent": "Houston", "detail": "..."},
       {"timestamp": "T-02:00", "title": "Lights out", "agent": "Brooklyn", "detail": "..."},
       {"timestamp": "T+00:00", "title": "Showtime", "agent": "The Professor", "detail": "..."},
       {"timestamp": "T+02:00", "title": "Wheels up", "agent": "Detroit", "detail": "..."},
       {"timestamp": "T+04:00", "title": "Ghost", "agent": "Detroit", "detail": "..."}
     ],
     "risk_score": {
       "total": 7.2,
       "detection": 6,
       "difficulty": 8,
       "coordination": 7,
       "style": 9
     },
     "professors_final_word": "..."
   }
   ```
   Hand to Manny (for emit logic) and Jonel (for render).

2. **Write the Risk Score rubric (15 min).** Manny bakes this into the Professor's prompt so scoring is consistent across runs.

   - **Detection Risk (0–10):** how likely the crew gets caught. 0 = invisible, 10 = guaranteed arrest.
   - **Execution Difficulty (0–10):** how hard to pull off. 0 = trivial, 10 = needs a miracle.
   - **Crew Coordination (0–10):** failure points across the team. 0 = airtight, 10 = falls apart at first contact.
   - **Style Points (0–10):** how cinematic. 0 = boring, 10 = Ocean's-Eleven-coded.
   - **Total:** average of the four, one decimal place.

3. **Write the Professor's final-word library (30 min).** 5–10 candidate closing quotes in the Professor's voice — italic, serif, pulpy crime-novel. Examples:
   > *"A heist is a story we tell ourselves before the alarm sounds. This one ends with us — quiet, anonymous, and gone."*
   > *"They'll spend years asking how. The answer was never in the vault. It was in the timing."*
   > *"Every door has a key. Every key has a hand. Every hand has a price. We've already paid."*

   The agent picks one based on the run, or hardcode one for the demo if generation is unreliable.

4. **Write disclaimer copy (10 min).** Persistent footer + final-card disclaimer per visual direction doc. Make it part of the comedy:
   > *"This plan exists only in narrative form. The crew is fictional. The targets are inert. Don't actually rob places."*

5. **Pick + vet 3 demo targets (15 min).** One funny ("Trader Joe's, Union Square"), one iconic ("Statue of Liberty"), one local/absurd. Run them through Manny's agents during dry-run hour. Cut anything that produces flat output. Report final list to Jonel for the cached geocode JSON.

6. **Demo production (last 45 min):** sit next to Manny during dry runs. Time each with a stopwatch. Flag anything over 2:30. Help refine the pitch. Watch for moments that need timing tweaks.

**Deliverable:** plan JSON schema (to Manny + Jonel), Risk Score rubric (to Manny), Professor's quote library (to Manny), disclaimer copy (to Jonel), vetted demo target list (to Jonel for caching), and a stopwatch on the dry runs.

---

## The 4 critical interfaces

> Lock these in the next 10 minutes. Post in team chat. Don't change without telling everyone.

### 1. Manny → Michael (live message schema)
```json
{
  "agent": "string",
  "content": "string",
  "timestamp": "ISO-8601",
  "type": "speaking | plan_section | risk_score | final_word"
}
```

### 2. Manny → Paula → Jonel (final plan schema)
See Paula's task #1 above. The Professor emits this at synthesis time. Jonel renders the bottom row from it.

### 3. Michael → Jonel (SSE endpoint)
```
GET https://<ngrok-url>/heist?target=<urlencoded>&demo=<bool>
Content-Type: text/event-stream

data: {"agent": "The Professor", "content": "...", ...}\n\n
data: {"agent": "Brooklyn", "content": "...", ...}\n\n
...
```

### 4. (Internal to Jonel) `<TargetMap />` component API
```tsx
<TargetMap
  target={string}                  // user input or preset
  onZoomComplete={() => void}      // fires at flyTo end so debate can start
/>
```

---

## Timeline

| Time | Focus | Checkpoint |
|------|-------|------------|
| **Now → 1:30 PM** | Isolation work. Jonel: Vercel skeleton + layout + map sandbox. Michael: SSE stub on ngrok. Manny: agents in terminal. Paula: plan schema, rubric, quotes. | Each person has a deployable artifact or a written deliverable. |
| **1:30 → 2:30 PM** | First integration pass. Paula's schema → Manny + Jonel. Michael → Jonel (SSE wire-up). Manny → Michael (real agents replace stub). | One full end-to-end run, however janky. |
| **2:30 → 3:30 PM** | Polish + dry runs. Michael records `fallback.json`. Jonel polishes animations. Manny constrains agent prompts based on actual timing. Paula stopwatches every run. First clean dry run by 3:00. | 3 successful end-to-end dry runs. |
| **3:30 → 4:00 PM** | Pitch prep. Manny rehearses 3x. One dry run with `?demo=true` to confirm fallback. Laptop charged, audio tested, Vercel deploy verified. | Stop coding by 3:50. |

---

## Cuts if you're behind

In order, drop these:
1. Faint red 200m operational radius on the map (P1)
2. "Run another heist" reset button (P1)
3. Bella Ciao audio (degrades cleanly to silent)
4. Multiple preset targets (just ship Trader Joe's Union Square)
5. Live Mapbox geocoding (rely entirely on cached JSON; refuse uncached targets gracefully)

**Do NOT cut:**
- The `?demo=true` JSON fallback (the safety net)
- The static PNG map fallback (Mapbox can fail)
- The visual streaming animations (it IS the demo)
- Paula's Risk Score and Professor's final word (those are the emotional beats)

---

## When in doubt
- Refer to the PRD for the *what* and *why*.
- Refer to the visual direction doc for any visual question.
- Refer to this file for the *who* and *when*.
- Pair with the person whose deliverable you depend on if you're stuck.
