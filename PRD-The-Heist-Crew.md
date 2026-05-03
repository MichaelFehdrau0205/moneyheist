# PRD — The Heist Crew

> Multi-agent simulation styled after *Money Heist* (English-language adaptation). Four AI specialists collaboratively plan a fictional heist on an audience-named target, debating live on screen with an interactive Mapbox flyover and a 2:30 cinematic demo flow.
> Built at the AG2 Hackathon, May 3, 2026. Demo deadline: 4:00 PM.

## Team & Roles

| Builder | Role | Owns |
|---------|------|------|
| **Jonel** | Frontend UI + Visual + Map | Full frontend surface: layout, animations, Mapbox setup + token, custom Studio dark style, `<TargetMap />` component, geocoding, cached geocode JSON, static PNG fallback, Bella Ciao audio integration, SSE consumption |
| **Manny** | Agents + AG2 orchestration + pitch lead | The 4 agent personas (The Professor, Brooklyn, Detroit, Houston), system prompts with voice + refusal guardrails, GroupChat orchestrator, message schema, `run_heist()` async function, demo pitch + final dry-run discipline |
| **Michael** | Backend API + SSE + reliability | FastAPI server, SSE endpoint (`GET /heist`), `/health` endpoint, ngrok tunnel, CORS for Vercel, integration of Manny's `run_heist()` into the SSE stream, **demo-mode JSON fallback (`?demo=true` replay)** |
| **Paula** | Plan schema + Risk Score rubric + content + demo production | Plan output schema (phases + risk + final word), Risk Score rubric (Detection / Difficulty / Coordination / Style), Professor's quote library, disclaimer copy, demo target curation + vetting, stopwatch on dry runs |

> Operational details (per-builder task lists, hour-by-hour timeline, integration handoffs) live in `BUILD-PLAN.md`.

## Problem Statement

**Who is affected:** Hackathon judges, demo audiences, and developers evaluating multi-agent AI frameworks who have to sit through yet another black-box agent demo where four agents "collaborate" but the only visible artifact is JSON logs scrolling past in a terminal. Also affected: AG2 framework evangelists trying to attract builders with compelling reference implementations.

**What's broken:** Multi-agent systems' core value proposition — specialists with distinct voices collaborating in legible ways — gets lost in technical implementation. Most demos render agents as functions in a pipeline, not characters in a story. Audiences forget which agent did what within 30 seconds of the demo ending. The pattern that's actually winning at AG2 hackathons (per the Cascadia AI Hackathon Best AG2 prize) is "agents as characters in a simulated world," but there's no shared playbook for how to build one.

**How we know it's real:** Browse any recent AG2 / CrewAI / LangGraph hackathon submission feed and 90% are pipelines styled as productivity tools. The standout AG2 winner from Cascadia was a dinosaur park simulation game, not a B2B tool — because watching agents "be characters" is more engaging than watching them be functions.

## Target User

**Primary user:** Hackathon judges evaluating multi-agent submissions who need to assess, in under 3 minutes, whether the multi-agent design is meaningful or cosmetic — and who appreciate being entertained while doing so.

**Secondary user:** Demo audience members (other hackathon participants, sponsors, the AG2 community) who'll vote with reactions, social posts, and eyeballs. Tertiary: developers who'll later study the project as an "agents as characters" reference implementation.

**How they solve this today:** They sit through a dozen agent demos that all look like JSON logs and try to remember which one was different. The ones that stick are visual and narrative — almost never the most technically sophisticated.

**User needs:**
- As a judge, I need to see distinct agent personalities collaborate visibly so I can evaluate whether the multi-agent design is meaningful or just a single agent in a trenchcoat.
- As a demo audience member, I need to be entertained because pure technical demos are forgettable, and I'll vote (with attention, social posts, conversation) for whatever made me lean forward.
- As a developer studying this later, I need clear separation of agent roles, prompts, and tool boundaries so I can adapt the pattern to my own project.

## Solution

**One-liner:** A four-agent crew — The Professor, Brooklyn, Detroit, and Houston — plans a fictional heist on an audience-named target, debating live on screen with *Money Heist* energy translated into English, an animated Mapbox flyover, and a stamped Risk Score reveal.

**Core user flow:**
1. Audience names a target ("Trader Joe's, Union Square") → header pulses red, target field accepts input.
2. Map executes a Mapbox `flyTo` from NYC overview (zoom 11) to the target (zoom 17) over 1.5s with `easeInOutCubic`. SVG crosshair locks on at 80% completion.
3. Four crew cards slide in left-to-right, staggered 100ms.
4. Live debate streams in via typewriter effect (~30ms/char). Each agent contributes their specialty in turn, then they challenge and refine.
5. Plan phases reveal one by one with timestamps (T-04:00 → T+04:00). Risk Score stamps in red. The Professor's italic quote closes the demo.

## Feature Scope

> P0 = must ship by 4:00 PM. P1 = important if time allows. P2 = nice to have.
> Demo target window: **2:30 total** (0:00 input → 2:30 final quote).
> Owner shorthand: **[J] = Jonel**, **[M] = Manny**, **[Mi] = Michael**, **[P] = Paula**.

### User Journey: "From Mark to Master Plan"

**Context:** A judge or audience member volunteers a target. The whole flow runs for 2:30 and needs to be entertaining throughout, memorable for the rest of the day, and degrade gracefully if anything breaks.

**Step 1: Target Selection (0:00–0:15)**
- [P0] Single text input field for target [J]
- [P0] Three preset target buttons for fast demo runs [J renders, P curates the list]
- [P0] Pre-cached geocodes for likely demo targets in local JSON [J caches, P provides target list]
- [P0] Live geocoding via Mapbox Geocoding API for audience-named targets not in cache [J]
- [P1] Header pulses red on target submission [J]
- [P2] User can pan / zoom the map manually after auto-zoom [J]

**Step 2: Map Zoom (0:15–0:30)**
- [P0] Mapbox GL JS with custom dark Studio style [J]
- [P0] `flyTo` animation NYC overview (zoom 11) → target (zoom 17), 1.5s, `easeInOutCubic` [J]
- [P0] SVG crosshair overlay (3 concentric red circles + center red dot) fades in at 80% flight completion [J]
- [P0] "▼ TARGET" mono label below crosshair [J]
- [P0] Map tiles pre-loaded on page mount [J]
- [P1] Faint red overlay on a 200m operational radius around the pin [J]

**Step 3: Crew Assembly (0:30–0:45)**
- [P0] Four crew cards slide in left-to-right, staggered 100ms, ease-out 400ms [J]
- [P0] Each card: 14px padding, 0.5px border, 2px top color bar matching agent [J]
- [P0] Card content: agent number + role label (mono, dim) → agent name (Bebas Neue) → one-line description → two capability pills [J renders, M defines agent identity per Appendix A]
- [P0] No avatars, no Dalí masks — typography carries identity [J]

**Step 4: Live Debate (0:45–1:45)**
- [P0] "▸ LIVE DEBATE · IN PROGRESS" mono header [J]
- [P0] Each message: 2px left border in agent color, mono timestamp, body dialogue in Inter [J]
- [P0] Messages stream in via typewriter effect (~30ms/char) [J]
- [P0] Cursor blinks at end of active line [J]
- [P0] Agent dialogue generation with voice + refusal guardrails + 2-sentence cap [M]
- [P0] SSE stream from backend to frontend [Mi sends, J consumes]
- [P1] Auto-scroll keeps newest message in view [J]
- [P2] Click an agent card to filter debate to just that agent's messages [J]

**Step 5: Plan Reveal + Risk Score (1:45–2:15)**
- [P0] Plan output schema (phases + risk + final word) [P defines, M emits, J renders]
- [P0] Phase list reveals on left (2/3 width): T-04:00 through T+04:00, fade + slide up 8px, 150ms apart [J]
- [P0] Risk Score stamps in on right (1/3 width): number scales 1.5x → 1.0x with slight rotation, hard stop [J]
- [P0] Risk Score is large red Bebas Neue, with sub-scores listed below [J]
- [P0] Risk Score rubric (Detection / Difficulty / Coordination / Style, 0–10 each) [P defines, M bakes into Professor's prompt]
- [P1] Each phase shows the responsible agent via a colored left border [J]

**Step 6: The Professor's Final Word (2:15–2:30)**
- [P0] Full-width final card with gold "— THE PROFESSOR —" label [J]
- [P0] Italic disclaimer/quote in serif: *"This plan exists only in narrative form…"* [P writes the library, M emits, J renders]
- [P0] Bella Ciao audio fades out by this beat [J]
- [P1] "Run another heist" button resets state cleanly [J]

### Out of Scope (for now)
- Dalí mask graphics — typography carries the identity
- AI-generated agent portraits — empty cards are cleaner
- Spanish phrases — English audience, English UI
- Red jumpsuits or costume imagery — subtle homage, not cosplay
- Gradients, glows, neon — flat aesthetic only
- Custom Mapbox layer overrides in code — use the pre-built Studio style instead
- Real-world routing or turn-by-turn directions — we are not Waze for crime
- Persistent user accounts or saved heists across sessions
- Mobile-optimized layout — the demo screen is the priority
- Voice input or audio agent dialogue — text streaming only for v1
- Real-time multiplayer / shared sessions

## Data Sources

| Data | Source | Format | Owner | Notes |
|------|--------|--------|-------|-------|
| Target geocoding (address → lat/lng) | Mapbox Geocoding API | REST API | Jonel | Requires `NEXT_PUBLIC_MAPBOX_TOKEN`. Free tier covers demo volume. |
| Map tiles + base style | Mapbox GL JS + custom dark Studio style | Vector tiles | Jonel | Studio style built ~10 min upfront. No code-side layer overrides. |
| Pre-cached demo targets | Local JSON lookup | JSON file | Jonel (caches), Paula (curates target list) | At least 5 targets including Trader Joe's Union Square, Times Square, Statue of Liberty. |
| Agent reasoning | OpenRouter via AG2 (Gemini 2.5 Flash) | Streamed JSON over SSE | Manny | Provided AG2 hackathon key. Shared usage cap — monitor the dashboard. |
| Audio asset | Royalty-free *Bella Ciao* instrumental | Local MP3 | Jonel | YouTube Audio Library or Pixabay. Public-domain folk arrangement, not the show's recording. |
| Pre-recorded fallback dialogue | Static JSON | JSON file | Michael | Scripted message sequence for "Trader Joe's, Union Square" in case AG2 streaming fails mid-demo. Replays at same pacing. |
| Static map fallback image | Pre-exported PNG | PNG asset | Jonel | Dark NYC overview, used behind SVG crosshair if Mapbox fails to load. |
| Risk Score rubric | Inline in Professor system prompt | Plain text | Paula (defines), Manny (implements) | Detection / Difficulty / Coordination / Style, 0–10 each. |
| Professor's quote library | Inline in `prompts.py` | Python list | Paula (writes), Manny (selects/emits) | 5–10 italic, serif, pulpy crime-novel closing lines. |
| Plan output schema | Defined in `BUILD-PLAN.md` Appendix D | JSON contract | Paula (defines), Manny (emits), Jonel (renders) | See Appendix D for the full schema. |

## Visual Identity

> Verbatim from Jo's visual design direction. Locked. Owner: Jonel.

**Color palette**

| Token | Hex | Use |
|-------|-----|-----|
| Background | `#0a0a0a` | Page background (near-black, not pure) |
| Surface | `#0f0f0f` | Cards and panels |
| Border | `#1f1f1f` | Subtle dividers |
| Accent red | `#DC0000` | Brand primary, Brooklyn, target pin, Risk Score stamp |
| Accent gold | `#C9A227` | Risk score sub-scores, Detroit, Professor moments |
| Text primary | `#ffffff` | Headlines, agent names |
| Text body | `#dddddd` | Dialogue, plan text |
| Text muted | `#888888` | Houston accent, descriptions |
| Text dim | `#666666` | Mono labels, timestamps |

Two accent colors only. Red is the brand. Gold is the punctuation. Everything else is greyscale.

**Typography (all free Google Fonts, loaded via Next.js `next/font`)**

| Family | Use | Sizing |
|--------|-----|--------|
| Bebas Neue | Display, agent names, headlines, Risk Score | 38–64px hero, 0.05em letter-spacing |
| JetBrains Mono | Timestamps, codes, chyrons, metadata | 9–10px section labels uppercase, 0.2em letter-spacing |
| Inter | Dialogue, plan text, body | 13px dialogue / 11–12px body, 1.5 line-height |

**Tone rules:** No gradients. No drop shadows. No glow effects. No emoji. Borders are 0.5px or 1px solid. Corners 6–8px max. Backgrounds are flat. Animation does the heavy lifting, not effects.

**Animation principles:**
- Typewriter for dialogue (~30ms per character, blinking cursor at end of active line)
- Stamp for Risk Score (1.5x → 1.0x scale with slight rotation, hard stop, no easing tail)
- Slide-in for crew cards (100ms stagger, ease-out 400ms, from left)
- Map zoom (`flyTo`, 1.5s, `easeInOutCubic`, crosshair fades in at 80%)
- Phase reveals (fade + slide up 8px, 150ms apart)
- No bouncing, no spring physics, no excessive motion. Documentary thriller, not video game.

## Audio

> Owner: Jonel.

Bella Ciao plays under the planning sequence (0:30–2:15).

- Royalty-free instrumental version (YouTube Audio Library or Pixabay)
- Volume: 30% during dialogue → 50% during plan reveal → fade out by Professor's final word
- Triggered via `<audio>` element, autoplay on user gesture (the "begin planning" button)
- Fallback: silent demo if audio file fails to load. Don't let a missing audio file kill the run.

## Reliability & Failure Modes

> Every external dependency has a fallback. Both fallback assets must be local files so they survive a network failure.

| Failure Mode | Fallback | Owner |
|--------------|----------|-------|
| AG2 streaming fails mid-demo | `?demo=true` query param replays pre-recorded `fallback.json` at original pacing | Michael |
| Mapbox fails to load (token, network, rate limit) | Static dark NYC PNG behind SVG crosshair, placeholder coord, no zoom animation | Jonel |
| Bella Ciao MP3 fails to load | Silent demo, no audio at all | Jonel (graceful degrade) |
| ngrok tunnel drops | Restart and update Vercel env var | Michael |
| Agent dialogue runs longer than 60s window | 2-sentence cap baked into system prompts; if a turn exceeds budget, truncate at sentence boundary | Manny |

## Success Metrics

| Goal | Signal | Metric | Target | Owner |
|------|--------|--------|--------|-------|
| Demo memorability | Judges name our project unprompted | Mentions of "Heist Crew" / "Professor" / "Money Heist" in post-demo discussion | At least 1 judge mentions us by name | Manny (pitch) |
| Pacing | Demo fits the 2:30 window | Time from "begin planning" to Professor's final word | 2:15–2:45 | Paula (stopwatch) |
| Visual delight | Audience reacts during the demo | Audible reactions (laughs, "ohhh," lean-ins) | 3+ reactions from the room | Jonel (visual) + Manny (dialogue) |
| Role legibility | Judges can describe each agent's job after demo | Informal recall test post-demo | 4/4 agents correctly described | Manny (voice) + Jonel (cards) |
| Reliability | Demo doesn't crash on stage | Successful end-to-end runs in dry-run hour | 5/5 successful runs in the final hour | Michael (fallbacks) |

## ROI Snapshot

| Category | Without This Tool | With This Tool | Delta |
|----------|------------------|----------------|-------|
| **Time** | Judges watch JSON logs and guess at multi-agent design quality | Judges watch agents collaborate visibly with distinct personalities | Same 3 min, ~10x clearer signal |
| **Memorability** | Demo blurs into 11 other agent pipelines | Demo is the one with the map flyover, the typewriter debate, and the stamped Risk Score | Memorable demo > forgettable pipeline |
| **Build cost** | — | ~20 person-hours (4 builders × 5 hours) | Visualization is the most expensive piece, not the agents |

**One-line pitch:** Twenty person-hours turn a forgettable agent pipeline into a *Money Heist*–coded simulation that judges remember by name.

## Stakeholder Concerns

> Filled in only the sections that matter for a hackathon-scope project.

**Marketing / Communications:** [Owner: Manny + Paula]
- One-line description: *"Four AI specialists plan a fictional heist on anywhere you name — live, in 2:30, with Money Heist energy."*
- Visual hook: the Mapbox flyover locking on a target with the SVG crosshair, four crew cards sliding in, typewriter debate streaming, Risk Score stamping in red.
- Sensitivity: persistent disclaimer on the final card — *"This plan exists only in narrative form. Don't actually rob places."* (Owner: Paula writes the copy.)
- Story arc for the pitch: name a target → meet the crew → watch them work → Risk Score → Professor's final word.

**Legal / Compliance:** [Owner: Manny (prompts) + Paula (disclaimer copy)]
- This is comedy / entertainment fiction. Disclaimer is prominent and built into the closing beat.
- No PII collected. No persistent storage of plans tied to identities.
- Hard refusal in agent system prompts: real named individuals, real residential addresses tied to a person, or operational specifics for real security systems get refused. Trader Joe's: fine. Real names + real addresses: refused. Agents speak in pulpy narrative ("Brooklyn finds the camera grid's blind spot in under a minute"), not technical instructions.
- Bella Ciao licensing: public-domain folk arrangement, not the show's recording.
- Mapbox attribution: visible on map (required by ToS).

**Operations / Engineering:** [Owner: Michael (backend reliability) + Jonel (frontend reliability)]
- Frontend hosting: Vercel.
- Backend hosting: localhost during demo, exposed via ngrok tunnel. Cloud deployment is post-hackathon.
- Failure modes documented in the Reliability & Failure Modes table above.
- Concurrency: single-user assumption. No multi-judge simultaneous demos.

**Product / Strategy:**
- Hackathon-scope demo. Post-hackathon path: open-source as an AG2 reference implementation for the "agents as characters" pattern, with a tutorial blog post.
- Competitive moat: most multi-agent demos are productivity tools. Entertainment-coded multi-agent is rare and visually distinctive.
- v2 roadmap: theme picker — swap "heist crew" for "pirate crew," "space mission control," "courtroom drama." Same orchestration pattern, different costumes.

**End Users:**
- Trust risk: *"Is this teaching people to commit crimes?"* Mitigated by tone (cinematic narrative), persistent disclaimer, and prompt-level refusals on operational specifics. The agents narrate; they don't instruct.
- Ethical risk: misuse for real planning. Mitigated by content moderation on input + agents that intentionally speak in narrative not technical detail.
- Accessibility: respect `prefers-reduced-motion` for typewriter and stamp animations. WCAG AA contrast on dark theme. Keyboard-navigable cards. (Owner: Jonel.)
- Shareability: optimize for the Risk-Score-stamp screenshot — that's the moment that travels on social.

## Build Stack

- **Frontend:** Next.js 16 + Tailwind v4 + Framer Motion
- **Map:** Mapbox GL JS + Mapbox Geocoding API + custom dark Studio style
- **Real-time link:** Server-Sent Events (SSE) from AG2 backend
- **Backend:** Python + FastAPI + AG2 (Gemini 2.5 Flash via OpenRouter)
- **Hosting:** Vercel (frontend), local + ngrok (backend during demo)
- **Single page, no routing**
- **Env:** `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`

## Open Questions (all resolved)

- [x] **Map library:** Mapbox GL JS + custom Studio dark style. *(Jonel)*
- [x] **Risk Score authoring:** Inline by The Professor. No 5th Auditor agent. *(Manny implements, Paula defines rubric)*
- [x] **Audio:** Ship Bella Ciao under the planning sequence (0:30–2:15) with volume choreography. Silent fallback if audio file fails. *(Jonel)*
- [x] **Content moderation strictness:** Hard refuse on real people + real residential addresses. Everything else gets a "let's keep it cinematic" agent reframe. *(Manny bakes into prompts)*
- [x] **Spanish-language toggle:** Out for v1. *(Decided)*
- [x] **Pre-recorded demo-mode fallback:** Required, P0. Hardcoded for "Trader Joe's, Union Square." *(Michael)*
- [x] **Map fallback:** Pre-exported static PNG of dark NYC behind SVG crosshair. *(Jonel)*
- [x] **Codename scheme:** American city codenames (Brooklyn, Detroit, Houston) + The Professor unchanged. *(Decided)*
- [x] **Mapbox token ownership:** Jonel owns the Mapbox account, Studio style, and token.
- [x] **Bella Ciao file ownership:** Jonel sources, downloads, commits, and integrates.
- [x] **Agent message budget:** Strict 2-sentence cap per agent turn, baked into system prompts. ~2,000 chars total dialogue across the 60s debate window. *(Manny)*
- [x] **Plan output schema:** Owned and defined by Paula, emitted by Manny's Professor agent, rendered by Jonel. *(See Appendix D.)*
- [x] **Risk Score rubric:** Detection / Difficulty / Coordination / Style, 0–10 each, total = average. *(Paula defines, Manny implements)*
- [x] **Professor's final-word library:** 5–10 italic, serif, pulpy crime-novel closing lines. *(Paula writes, Manny selects/emits)*
- [x] **Disclaimer copy:** Persistent footer + final-card disclaimer. *(Paula writes, Jonel renders)*
- [x] **Demo target list:** 3 vetted targets (one funny, one iconic, one local/absurd). *(Paula curates, vets during dry-runs)*

## Coverage Check

> Verifying every workstream has an explicit owner. No gaps.

| Workstream | Owner |
|------------|-------|
| Frontend layout, components, animations | Jonel |
| Mapbox setup, custom Studio style, token | Jonel |
| `<TargetMap />` component (flyTo, crosshair, geocoding) | Jonel |
| Cached geocode JSON | Jonel (caches), Paula (curates targets) |
| Static PNG map fallback | Jonel |
| Bella Ciao audio integration + volume choreography | Jonel |
| SSE consumption (frontend side) | Jonel |
| Typography setup (Bebas Neue, JetBrains Mono, Inter) | Jonel |
| Color tokens + visual identity | Jonel |
| Accessibility (`prefers-reduced-motion`, WCAG contrast) | Jonel |
| The 4 agent personas + voice direction | Manny |
| System prompts with refusal guardrails | Manny |
| GroupChat orchestration | Manny |
| `run_heist()` async generator | Manny |
| Risk Score implementation in Professor prompt | Manny |
| Plan emission per Paula's schema | Manny |
| 2-sentence response cap | Manny |
| Demo pitch + final dry-run discipline | Manny |
| FastAPI server | Michael |
| SSE endpoint (`GET /heist`) | Michael |
| `/health` endpoint | Michael |
| CORS configuration | Michael |
| ngrok tunnel | Michael |
| Wrapping Manny's `run_heist()` in SSE | Michael |
| `?demo=true` JSON fallback | Michael |
| Recording `fallback.json` from a successful run | Michael |
| Plan output schema design | Paula |
| Risk Score rubric definition | Paula |
| Professor's quote library | Paula |
| Disclaimer copy | Paula |
| Demo target curation + vetting | Paula |
| Stopwatch on dry runs + pacing flagging | Paula |

---

## Appendix A — Crew Roster

| # | Codename | Role | Owns | Color |
|---|----------|------|------|-------|
| 01 | **The Professor** | Mastermind / Orchestrator | Strategy, timeline, contingencies, synthesis, final Risk Score | White `#ffffff` |
| 02 | **Brooklyn** | Hacker | Cameras, alarms, comms, networks | Red `#DC0000` |
| 03 | **Detroit** | Driver | Routes, vehicles, timing, getaway | Gold `#C9A227` |
| 04 | **Houston** | Inside Man | Guards, staff, social engineering | Grey `#888888` |

Voice direction:
- **The Professor** — cool, theatrical, three-act thinking. Delegates and synthesizes. Never tactical. Closes with the italic final quote.
- **Brooklyn** — quietly cocky, hyper-technical. Thinks in attack surfaces and logging gaps.
- **Detroit** — calm, terse, obsessed with timing. Speaks in seconds and street names.
- **Houston** — charming, observational. Reads rooms in seconds. Believes every fortress has a friendly face.

## Appendix B — Layout Spec

| Region | Height | Content |
|--------|--------|---------|
| Header bar | 60px | Red diamond icon + "THE HEIST CREW" wordmark + operation number (left); pulsing red dot + "LIVE PLANNING" status (right) |
| Target reveal | 100px | Gold "▸ TARGET ACQUIRED" mono label, large Bebas Neue target name, address + lat/long in mono |
| Map zoom | 180px (full width) | Mapbox GL with custom dark style, SVG crosshair overlay, "▼ TARGET" mono label |
| Crew cards | auto (4-column grid) | Agent number + role + name + one-liner + 2 capability pills |
| Live debate | auto (full width) | Header + streaming messages with mono timestamps and colored left borders |
| Bottom row | auto (2/3 + 1/3 grid) | Plan phases with T-stamps (left); Risk Score + sub-scores (right) |
| Final card | auto (full width) | Gold "— THE PROFESSOR —" label, italic serif disclaimer/quote |

## Appendix C — Demo Timing Reference

| Time | Beat | Visual |
|------|------|--------|
| 0:00–0:15 | Audience names target | Header pulses red, target field accepts input |
| 0:15–0:30 | Map zoom | NYC overview → crosshair locks on target |
| 0:30–0:45 | Crew assembles | Four agent cards slide in left-to-right |
| 0:45–1:45 | Live debate | Messages stream in with typewriter effect |
| 1:45–2:15 | Plan reveals | Phases appear one by one with timestamps |
| 2:15–2:30 | Risk + final word | Risk Score stamps in red, Professor's quote |

Bella Ciao plays softly under 0:30–2:15. Fades out for the final word.

## Appendix D — Critical Interfaces

> Lock these now. Post in team chat. Don't change without telling everyone.

**1. Manny → Michael (live message schema)**
```json
{
  "agent": "string",
  "content": "string",
  "timestamp": "ISO-8601",
  "type": "speaking | plan_section | risk_score | final_word"
}
```

**2. Paula → Manny → Jonel (final plan schema)**
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

**3. Michael → Jonel (SSE endpoint)**
```
GET https://<ngrok-url>/heist?target=<urlencoded>&demo=<bool>
Content-Type: text/event-stream

data: {"agent": "The Professor", "content": "...", ...}\n\n
data: {"agent": "Brooklyn", "content": "...", ...}\n\n
...
```

**4. (Internal to Jonel) `<TargetMap />` component API**
```tsx
<TargetMap
  target={string}                  // user input or preset
  onZoomComplete={() => void}      // fires at flyTo end so debate can start
/>
```
