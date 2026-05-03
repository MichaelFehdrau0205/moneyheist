// Main app — stitches stages together with state + timing
const { useEffect, useState, useRef, useCallback, useMemo } = React;

// Master switch for the parallel-paths risk fork. Flip false to fully disable
// the feature (alongside the runtime tweak — both must be on for fork mode).
const ENABLE_PATH_FORK = true;

// Per-category deltas applied to Path A to derive Path B ("recruit a 5th").
const PATH_FORK_DELTAS = { DETECTION: -15, DIFFICULTY: -10, COORDINATION: 25, STYLE: 10 };
const PATH_FORK_AUTO_MS = 8000;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "typewriterSpeed": 22,
  "lineGapMs": 700,
  "ambientAudio": false,
  "showStageRail": false,
  "accent": "red",
  "density": "comfortable",
  "autoPlay": true,
  "enablePathFork": true
}/*EDITMODE-END*/;

// Backend wiring. Without a `?backend=` query param the app runs on the stub
// generator. With `?backend=https://<host>` it consumes SSE from that host.
// Lets us flip live/stub on the deployed URL without a redeploy.
const _URL_PARAMS = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const BACKEND_URL = (_URL_PARAMS && _URL_PARAMS.get("backend")) || "http://localhost:8000";
const USE_STUB = false;

const COUNTDOWN_BY_IDX = ["T-04:00", "T-03:00", "T-02:00", "T-01:00"];
function deriveCountdown(idx) {
  return COUNTDOWN_BY_IDX[idx] || "T-00:00";
}

function App() {
  const data = window.HEIST_DATA;
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  const [phase, setPhase] = useState("input"); // input | map | crew | debate | plan | risk | final
  const [target, setTarget] = useState(null);
  const [crewVisible, setCrewVisible] = useState(0);
  const [debateIdx, setDebateIdx] = useState(-1);
  const [planVisible, setPlanVisible] = useState(0);
  const [riskStamp, setRiskStamp] = useState(false);
  const [finalShow, setFinalShow] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

  // Stream-driven buffers (populated by handleMessage). When empty, components
  // fall back to data.js — preserves jumpTo helpers in the tweaks panel.
  const [debateBuffer, setDebateBuffer] = useState([]);
  const [planBuffer, setPlanBuffer] = useState([]);
  const [riskOverride, setRiskOverride] = useState(null);
  const [finalQuoteOverride, setFinalQuoteOverride] = useState(null);

  // "Idle" flags mark animation completion — used to defer phase transitions in
  // stream mode so the next phase doesn't start mid-animation.
  const [debateIdle, setDebateIdle] = useState(false);
  const [planAnimationDone, setPlanAnimationDone] = useState(false);
  const [riskStampDone, setRiskStampDone] = useState(false);

  const speakingCountRef = useRef(0);
  const streamRunningRef = useRef(false);
  const lockedRef = useRef(false);
  const audioRef = useRef(null);

  // Find target by name from input or pick from cache
  const resolveTarget = useCallback((nameInput) => {
    const found = data.targets.find((t) => t.name.toLowerCase().includes(nameInput.toLowerCase()));
    if (found) return found;
    return {
      name: nameInput.toUpperCase(),
      address: "NEW YORK, NY",
      coords: "40.7" + Math.floor(Math.random() * 900) + "° N · 73.9" + Math.floor(Math.random() * 900) + "° W",
      mapX: 0.40 + Math.random() * 0.25,
      mapY: 0.35 + Math.random() * 0.35,
    };
  }, [data]);

  const handleMessage = useCallback((msg) => {
    if (msg.type === "speaking") {
      const idx = speakingCountRef.current;
      speakingCountRef.current = idx + 1;
      const entry = {
        who: msg.agent_id,
        t: deriveCountdown(idx),
        text: msg.content,
      };
      setDebateBuffer((b) => [...b, entry]);
      if (idx === 0) setPhase("crew");
    } else if (msg.type === "plan_section") {
      const normalized = window.normalizePlanPhase(msg.payload || msg);
      if (!normalized) return;
      // Buffer only — phase transition is gated by debate-idle watcher below.
      setPlanBuffer((b) => [...b, normalized]);
    } else if (msg.type === "risk_score") {
      // Buffer only — gated by plan-animation-done watcher.
      setRiskOverride(window.normalizeRiskScore(msg.payload || msg));
    } else if (msg.type === "final_word") {
      // Buffer only — gated by risk-stamp-done watcher.
      setFinalQuoteOverride(msg.content);
      setFinalShow(true);
    }
  }, []);

  const consumeStream = useCallback(async (resolved) => {
    if (streamRunningRef.current) return;
    streamRunningRef.current = true;
    try {
      if (USE_STUB || !BACKEND_URL) {
        const stream = window.createHeistStream(resolved.name);
        for await (const msg of stream) {
          handleMessage(msg);
        }
      } else {
        const url = `${BACKEND_URL}/heist?target=${encodeURIComponent(resolved.name)}`;
        const eventSource = new EventSource(url);
        eventSource.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            handleMessage(msg);
            if (msg.type === "final_word") eventSource.close();
          } catch (e) {
            console.error("Failed to parse SSE message:", e, ev.data);
          }
        };
        eventSource.onerror = (e) => {
          console.error("SSE error:", e);
          eventSource.close();
        };
      }
    } catch (e) {
      console.error("Stream consumption failed:", e);
    } finally {
      streamRunningRef.current = false;
    }
  }, [handleMessage]);

  const startSequence = useCallback((nameInput) => {
    const t = resolveTarget(nameInput);
    setTarget(t);
    setPhase("map");
    speakingCountRef.current = 0;
    setDebateBuffer([]);
    setPlanBuffer([]);
    setRiskOverride(null);
    setFinalQuoteOverride(null);
    setDebateIdle(false);
    setPlanAnimationDone(false);
    setRiskStampDone(false);
    setSelectedPath(null);
    consumeStream(t);
  }, [resolveTarget, consumeStream]);

  // Component data sources — buffers when stream-driven, data.js when empty (jumpTo).
  const debateMessages = debateBuffer.length > 0 ? debateBuffer : data.debate;
  const planPhases = planBuffer.length > 0 ? planBuffer : data.plan;
  const riskData = riskOverride || data.risk;
  const finalProfessorQuote = finalQuoteOverride || data.professorQuote;
  const isStreamMode = debateBuffer.length > 0 || planBuffer.length > 0;

  // Path-fork: derive Path B ("recruit a 5th") from Path A by per-category deltas.
  const forkActive = ENABLE_PATH_FORK && tweaks.enablePathFork;
  const riskAlternative = useMemo(() => {
    if (!forkActive || !riskData || !Array.isArray(riskData.sub)) return null;
    const subAlt = riskData.sub.map((s) => ({
      label: s.label,
      value: Math.max(0, Math.min(100, s.value + (PATH_FORK_DELTAS[s.label] || 0))),
    }));
    const score = subAlt.reduce((acc, s) => acc + s.value, 0) / subAlt.length;
    return { score, sub: subAlt };
  }, [forkActive, riskData]);

  // Crew slide-in
  useEffect(() => {
    if (phase !== "crew") return;
    setCrewVisible(0);
    const timers = [];
    for (let i = 1; i <= 4; i++) {
      timers.push(setTimeout(() => setCrewVisible(i), i * 280));
    }
    timers.push(setTimeout(() => setPhase("debate"), 4 * 280 + 600));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Debate streaming entry
  useEffect(() => {
    if (phase !== "debate") return;
    setDebateIdx(0);
  }, [phase]);

  const onLineDone = useCallback(() => {
    if (debateIdx < 0) return;
    const next = debateIdx + 1;
    setTimeout(() => {
      if (next >= debateMessages.length) {
        // End of current buffer. Mark idle; advance handled by watchers.
        setDebateIdle(true);
        if (!isStreamMode) setPhase("plan");
      } else {
        setDebateIdle(false);
        setDebateIdx(next);
      }
    }, tweaks.lineGapMs);
  }, [debateIdx, debateMessages.length, tweaks.lineGapMs, isStreamMode]);

  // When buffer grows past current debateIdx and we were idle, advance the typewriter.
  useEffect(() => {
    if (phase !== "debate") return;
    if (!debateIdle) return;
    if (debateIdx + 1 < debateMessages.length) {
      setDebateIdle(false);
      setDebateIdx(debateIdx + 1);
    }
  }, [debateMessages.length, phase, debateIdx, debateIdle]);

  // When debate is idle AND plan data is ready, advance to plan.
  useEffect(() => {
    if (phase !== "debate") return;
    if (!debateIdle) return;
    if (planBuffer.length === 0 && isStreamMode) return;
    setPhase("plan");
  }, [phase, debateIdle, planBuffer.length, isStreamMode]);

  // Plan reveal — animate up to 5 (full plan size) on phase entry only.
  // Doesn't re-run on planBuffer growth, so items appear smoothly as they arrive.
  useEffect(() => {
    if (phase !== "plan") return;
    setPlanVisible(0);
    setPlanAnimationDone(false);
    const total = 5;
    const timers = [];
    for (let i = 1; i <= total; i++) {
      timers.push(setTimeout(() => setPlanVisible(i), i * 320));
    }
    timers.push(setTimeout(() => setPlanAnimationDone(true), total * 320 + 600));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // Plan animation done AND risk data ready → advance to risk.
  useEffect(() => {
    if (phase !== "plan") return;
    if (!planAnimationDone) return;
    if (!riskOverride && isStreamMode) return;
    setPhase("risk");
  }, [phase, planAnimationDone, riskOverride, isStreamMode]);

  // Risk stamp — fires the stamp animation, then marks done.
  // Reset path selection on every risk-phase entry so jumpTo replays cleanly.
  useEffect(() => {
    if (phase !== "risk") return;
    setRiskStamp(false);
    setRiskStampDone(false);
    setSelectedPath(null);
    const t1 = setTimeout(() => setRiskStamp(true), 250);
    const t2 = setTimeout(() => setRiskStampDone(true), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // Risk stamp done AND final quote ready → advance to final.
  // When fork is active, also wait for the audience to pick a path (or for
  // the auto-select fallback below to fire).
  useEffect(() => {
    if (phase !== "risk") return;
    if (!riskStampDone) return;
    if (!finalQuoteOverride && isStreamMode) return;
    if (forkActive && riskAlternative && !selectedPath) return;
    setPhase("final");
  }, [phase, riskStampDone, finalQuoteOverride, isStreamMode, forkActive, riskAlternative, selectedPath]);

  // Auto-select Path A if the audience hasn't clicked within 8s of stamp done.
  // Protects the demo if Manny doesn't get to "click left" in his pitch.
  useEffect(() => {
    if (!forkActive) return;
    if (phase !== "risk") return;
    if (!riskStampDone) return;
    if (selectedPath) return;
    const t = setTimeout(() => setSelectedPath((p) => p || "A"), PATH_FORK_AUTO_MS);
    return () => clearTimeout(t);
  }, [forkActive, phase, riskStampDone, selectedPath]);

  // Final show
  useEffect(() => {
    if (phase !== "final") return;
    setFinalShow(false);
    const t = setTimeout(() => setFinalShow(true), 200);
    return () => clearTimeout(t);
  }, [phase]);

  // Speaking agent during debate
  const speakingId =
    phase === "debate" && debateIdx >= 0 && debateIdx < debateMessages.length
      ? debateMessages[debateIdx]?.who
      : null;

  // Stage rail jumping
  const jumpTo = (id) => {
    if (id === "input") {
      setTarget(null);
      setPhase("input");
      setCrewVisible(0);
      setDebateIdx(-1);
      setPlanVisible(0);
      setRiskStamp(false);
      setFinalShow(false);
      setDebateBuffer([]);
      setPlanBuffer([]);
      setRiskOverride(null);
      setFinalQuoteOverride(null);
      setDebateIdle(false);
      setPlanAnimationDone(false);
      setRiskStampDone(false);
      setSelectedPath(null);
      speakingCountRef.current = 0;
      streamRunningRef.current = false;
      return;
    }
    if (!target) {
      const t = data.targets[0];
      setTarget(t);
    }
    if (id === "map") setPhase("map");
    if (id === "crew") { setPhase("crew"); }
    if (id === "debate") { setCrewVisible(4); setPhase("debate"); }
    if (id === "plan") { setCrewVisible(4); setPhase("plan"); }
    if (id === "risk") { setCrewVisible(4); setPlanVisible(planPhases.length); setPhase("risk"); }
    if (id === "final") { setCrewVisible(4); setPlanVisible(planPhases.length); setRiskStamp(true); setPhase("final"); }
  };

  // Map phase
  const mapPhase = phase === "input" ? "idle" : phase === "map" ? "zooming" : "locked";

  // Operation number — stable per session
  const opNum = useRef(String(Math.floor(1000 + Math.random() * 9000))).current;

  // Apply tweak: accent
  useEffect(() => {
    const root = document.documentElement;
    if (tweaks.accent === "red") {
      root.style.setProperty("--accent", "#DC0000");
      root.style.setProperty("--accent-2", "#C9A227");
    } else if (tweaks.accent === "gold") {
      root.style.setProperty("--accent", "#C9A227");
      root.style.setProperty("--accent-2", "#DC0000");
    } else if (tweaks.accent === "ice") {
      root.style.setProperty("--accent", "#7CC0E0");
      root.style.setProperty("--accent-2", "#C9A227");
    }
  }, [tweaks.accent]);

  // Density
  useEffect(() => {
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.density]);

  return (
    <div className="app">
      <HeaderBar operationNum={opNum} status={phase === "input" ? "STANDBY" : "LIVE PLANNING"} />

      <TargetReveal
        target={target}
        editable={phase === "input"}
        onSubmit={startSequence}
      />

      <NycMap target={target} phase={mapPhase} />

      <CrewGrid crew={data.crew} visibleCount={crewVisible} speakingId={speakingId} />

      {(phase === "debate" || phase === "plan" || phase === "risk" || phase === "final") && (
        <DebatePanel
          messages={
            phase === "debate"
              ? debateMessages.slice(0, debateIdx + 1 || debateMessages.length)
              : debateMessages
          }
          crew={data.crew}
          activeIdx={phase === "debate" ? debateIdx : -1}
          onLineDone={onLineDone}
        />
      )}

      {(phase === "plan" || phase === "risk" || phase === "final") && (
        forkActive ? (
          // Fork mode: plan takes full width; fork RiskScore mounts only at the
          // risk/final phase as its own full-width row below — never inside the
          // 1fr sidebar slot. Avoids the layout-flash during plan→risk transition.
          <>
            <PlanGrid plan={planPhases} visibleCount={planVisible} />
            {(phase === "risk" || phase === "final") && riskAlternative && (
              <RiskScore
                data={riskData}
                dataAlt={riskAlternative}
                stamp={riskStamp}
                selectedPath={selectedPath}
                onPathSelected={(p) => setSelectedPath((prev) => prev || p)}
              />
            )}
          </>
        ) : (
          <div className="bottom-row">
            <PlanGrid plan={planPhases} visibleCount={planVisible} />
            <RiskScore data={riskData} stamp={riskStamp} />
          </div>
        )
      )}

      {phase === "final" && <FinalCard quote={data.quote} professorQuote={finalProfessorQuote} show={finalShow} selectedPath={selectedPath} />}

      <div className="heist-disclaimer-footer">{data.disclaimerFooter}</div>

      {tweaks.showStageRail && <StageRail phase={phase} onJump={jumpTo} />}

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Pacing">
          <window.TweakSlider
            label="Typewriter speed (ms/char)"
            min={6}
            max={60}
            step={2}
            value={tweaks.typewriterSpeed}
            onChange={(v) => setTweak("typewriterSpeed", v)}
          />
          <window.TweakSlider
            label="Line gap (ms)"
            min={150}
            max={2400}
            step={50}
            value={tweaks.lineGapMs}
            onChange={(v) => setTweak("lineGapMs", v)}
          />
        </window.TweakSection>
        <window.TweakSection title="Visual">
          <window.TweakRadio
            label="Accent"
            value={tweaks.accent}
            options={[
              { label: "Red", value: "red" },
              { label: "Gold", value: "gold" },
              { label: "Ice", value: "ice" },
            ]}
            onChange={(v) => setTweak("accent", v)}
          />
          <window.TweakRadio
            label="Density"
            value={tweaks.density}
            options={[
              { label: "Comfortable", value: "comfortable" },
              { label: "Compact", value: "compact" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
          <window.TweakToggle
            label="Stage rail"
            value={tweaks.showStageRail}
            onChange={(v) => setTweak("showStageRail", v)}
          />
          <window.TweakToggle
            label="Path fork (Path A / Path B)"
            value={tweaks.enablePathFork}
            onChange={(v) => setTweak("enablePathFork", v)}
          />
        </window.TweakSection>
        <window.TweakSection title="Demo">
          <window.TweakButton onClick={() => jumpTo("input")}>Reset to target input</window.TweakButton>
          <window.TweakButton onClick={() => jumpTo("debate")}>Skip to live debate</window.TweakButton>
          <window.TweakButton onClick={() => jumpTo("final")}>Skip to final word</window.TweakButton>
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
