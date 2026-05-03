// Main app — stitches stages together with state + timing
const { useEffect, useState, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "typewriterSpeed": 22,
  "lineGapMs": 700,
  "ambientAudio": false,
  "showStageRail": false,
  "accent": "red",
  "density": "comfortable",
  "autoPlay": true
}/*EDITMODE-END*/;

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

  const lockedRef = useRef(false);
  const audioRef = useRef(null);

  // Find target by name from input or pick from cache
  const resolveTarget = useCallback((nameInput) => {
    const found = data.targets.find((t) => t.name.toLowerCase().includes(nameInput.toLowerCase()));
    if (found) return found;
    // Fallback: synth a target with a random map position
    return {
      name: nameInput.toUpperCase(),
      address: "NEW YORK, NY",
      coords: "40.7" + Math.floor(Math.random() * 900) + "° N · 73.9" + Math.floor(Math.random() * 900) + "° W",
      mapX: 0.40 + Math.random() * 0.25,
      mapY: 0.35 + Math.random() * 0.35,
    };
  }, [data]);

  const startSequence = useCallback((nameInput) => {
    const t = resolveTarget(nameInput);
    setTarget(t);
    setPhase("map");
    // Map zooms (1500ms), then locks
    setTimeout(() => setPhase("crew"), 1700);
  }, [resolveTarget]);

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

  // Debate streaming
  useEffect(() => {
    if (phase !== "debate") return;
    setDebateIdx(0);
  }, [phase]);

  const onLineDone = useCallback(() => {
    if (debateIdx < 0) return;
    const next = debateIdx + 1;
    setTimeout(() => {
      if (next >= data.debate.length) {
        setPhase("plan");
      } else {
        setDebateIdx(next);
      }
    }, tweaks.lineGapMs);
  }, [debateIdx, data.debate.length, tweaks.lineGapMs]);

  // Plan reveal
  useEffect(() => {
    if (phase !== "plan") return;
    setPlanVisible(0);
    const timers = [];
    for (let i = 1; i <= data.plan.length; i++) {
      timers.push(setTimeout(() => setPlanVisible(i), i * 320));
    }
    timers.push(setTimeout(() => setPhase("risk"), data.plan.length * 320 + 600));
    return () => timers.forEach(clearTimeout);
  }, [phase, data.plan.length]);

  // Risk stamp
  useEffect(() => {
    if (phase !== "risk") return;
    setRiskStamp(false);
    const t1 = setTimeout(() => setRiskStamp(true), 250);
    const t2 = setTimeout(() => setPhase("final"), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // Final show
  useEffect(() => {
    if (phase !== "final") return;
    setFinalShow(false);
    const t = setTimeout(() => setFinalShow(true), 200);
    return () => clearTimeout(t);
  }, [phase]);

  // Speaking agent during debate
  const speakingId = phase === "debate" && debateIdx >= 0 ? data.debate[debateIdx]?.who : null;

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
      return;
    }
    if (!target) {
      // auto-pick first cached target if jumping ahead
      const t = data.targets[0];
      setTarget(t);
    }
    if (id === "map") setPhase("map");
    if (id === "crew") { setPhase("crew"); }
    if (id === "debate") { setCrewVisible(4); setPhase("debate"); }
    if (id === "plan") { setCrewVisible(4); setPhase("plan"); }
    if (id === "risk") { setCrewVisible(4); setPlanVisible(data.plan.length); setPhase("risk"); }
    if (id === "final") { setCrewVisible(4); setPlanVisible(data.plan.length); setRiskStamp(true); setPhase("final"); }
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
          messages={data.debate.slice(0, debateIdx + 1 || data.debate.length)}
          crew={data.crew}
          activeIdx={phase === "debate" ? debateIdx : -1}
          onLineDone={onLineDone}
        />
      )}

      {(phase === "plan" || phase === "risk" || phase === "final") && (
        <div className="bottom-row">
          <PlanGrid plan={data.plan} visibleCount={planVisible} />
          <RiskScore data={data.risk} stamp={riskStamp} />
        </div>
      )}

      {phase === "final" && <FinalCard quote={data.quote} professorQuote={data.professorQuote} show={finalShow} />}

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
