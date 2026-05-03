// Hero frame components: Header, TargetReveal, CrewGrid, DebatePanel, PlanGrid, RiskScore, FinalCard

const { useEffect, useRef, useState, useMemo } = React;

// ---------- Header ----------
function HeaderBar({ operationNum, status }) {
  return (
    <header className="hb">
      <div className="hb-l">
        <div className="hb-diamond" />
        <div className="hb-word">THE HEIST CREW</div>
        <div className="hb-meta">OP. {operationNum}</div>
      </div>
      <div className="hb-r">
        <span className="dot-red pulse" />
        <span className="hb-status">{status}</span>
      </div>
    </header>
  );
}

// ---------- Target reveal ----------
function TargetReveal({ target, onSubmit, editable }) {
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editable && inputRef.current) inputRef.current.focus();
  }, [editable]);

  if (target) {
    return (
      <section className="tr">
        <div className="tr-label gold">▸ TARGET ACQUIRED</div>
        <h1 className="tr-name">{target.name}</h1>
        <div className="tr-meta">
          <span>{target.address}</span>
          <span className="dim">·</span>
          <span>{target.coords}</span>
        </div>
      </section>
    );
  }
  return (
    <section className="tr">
      <div className="tr-label red blink">▸ AWAITING TARGET</div>
      <form
        className="tr-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (val.trim()) onSubmit(val.trim());
        }}
      >
        <span className="caret">▸</span>
        <input
          ref={inputRef}
          className="tr-input"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="NAME A TARGET. ANYWHERE IN NEW YORK."
          spellCheck={false}
        />
        <button className="tr-go" type="submit">LOCK ▸</button>
      </form>
      <div className="tr-meta">
        <span className="dim">SUGGESTED:</span>
        {window.HEIST_DATA.targets.slice(0, 3).map((t, i) => (
          <button key={i} className="tr-suggest" onClick={() => onSubmit(t.name)}>
            {t.name.split(" · ")[0]}
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------- Crew grid ----------
function CrewCard({ agent, idx, visible, active, speaking }) {
  return (
    <article
      className={"cc " + (visible ? "cc-in " : "") + (active ? "cc-active " : "") + (speaking ? "cc-speaking " : "")}
      style={{ "--ag": agent.color, "--delay": idx * 100 + "ms" }}
    >
      <div className="cc-bar" />
      <div className="cc-row">
        <span className="cc-num mono">{agent.num}</span>
        <span className="cc-role mono">{agent.role}</span>
      </div>
      <h2 className="cc-name">{agent.name}</h2>
      <p className="cc-desc">{agent.desc}</p>
      <div className="cc-pills">
        {agent.pills.map((p) => (
          <span key={p} className="pill mono">{p}</span>
        ))}
      </div>
      <div className="cc-portrait" aria-hidden="true">
        <svg viewBox="0 0 80 80">
          <rect x="0" y="0" width="80" height="80" fill="none" stroke="var(--ag)" strokeWidth="0.5" opacity="0.3" />
          <text x="6" y="14" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="var(--ag)" opacity="0.6" letterSpacing="1.5">ID/{agent.num}</text>
          <circle cx="40" cy="36" r="14" fill="none" stroke="var(--ag)" strokeWidth="0.6" opacity="0.5" />
          <path d="M 22 70 Q 40 52 58 70" fill="none" stroke="var(--ag)" strokeWidth="0.6" opacity="0.5" />
          <line x1="6" y1="74" x2="74" y2="74" stroke="var(--ag)" strokeWidth="0.4" opacity="0.4" />
          <text x="6" y="78" fontFamily="JetBrains Mono, monospace" fontSize="5" fill="var(--ag)" opacity="0.5" letterSpacing="1">CLASSIFIED</text>
        </svg>
        {speaking && <div className="cc-live mono">▸ ACTIVE</div>}
      </div>
    </article>
  );
}

function CrewGrid({ crew, visibleCount, speakingId }) {
  return (
    <section className="cg">
      <div className="row-head">
        <span className="rh-label mono">▸ CREW · ASSEMBLED</span>
        <span className="rh-meta mono">04 / 04 OPERATORS</span>
      </div>
      <div className="cg-grid">
        {crew.map((a, i) => (
          <CrewCard
            key={a.id}
            agent={a}
            idx={i}
            visible={i < visibleCount}
            active={i < visibleCount}
            speaking={speakingId === a.id}
          />
        ))}
      </div>
    </section>
  );
}

// ---------- Debate panel ----------
function Typewriter({ text, speed = 22, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
  }, [text]);
  useEffect(() => {
    if (n >= text.length) {
      onDone && onDone();
      return;
    }
    const id = setTimeout(() => setN(n + 1), speed);
    return () => clearTimeout(id);
  }, [n, text, speed]);
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span className="caret-blink">▍</span>}
    </span>
  );
}

function DebatePanel({ messages, crew, activeIdx, onLineDone }) {
  const colRefs = useRef({});

  // Group messages by agent; remember each msg's global index for active state + ordering
  const byAgent = {};
  crew.forEach((c) => { byAgent[c.id] = []; });
  messages.forEach((m, i) => {
    if (byAgent[m.who]) byAgent[m.who].push({ ...m, _i: i });
  });

  // Auto-scroll the active agent's column to the bottom
  useEffect(() => {
    if (activeIdx < 0) return;
    const active = messages[activeIdx];
    if (!active) return;
    const el = colRefs.current[active.who];
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, activeIdx]);

  return (
    <section className="dp">
      <div className="row-head">
        <span className="rh-label mono">
          <span className="dot-red pulse" /> ▸ LIVE DEBATE · IN PROGRESS
        </span>
        <span className="rh-meta mono">CHAN · 04 · ENCRYPTED · 04 OPERATORS</span>
      </div>
      <div className="dp-grid">
        {crew.map((c) => {
          const msgs = byAgent[c.id];
          const isSpeaking = activeIdx >= 0 && messages[activeIdx]?.who === c.id;
          return (
            <div
              key={c.id}
              className={"dp-col " + (isSpeaking ? "dp-col-active" : "")}
              style={{ "--ag": c.color }}
            >
              <div className="dp-col-head">
                <span className="dp-col-bar" />
                <span className="mono dp-col-num">{c.num}</span>
                <span className="mono dp-col-name" style={{ color: c.color }}>{c.name}</span>
                {isSpeaking && (
                  <span className="dp-col-live mono">
                    <span className="dp-live-dot" /> LIVE
                  </span>
                )}
              </div>
              <div className="dp-col-body" ref={(el) => { if (el) colRefs.current[c.id] = el; }}>
                {msgs.length === 0 && (
                  <div className="dp-empty mono">— STANDBY —</div>
                )}
                {msgs.map((m) => {
                  const isActive = m._i === activeIdx;
                  return (
                    <div key={m._i} className="dp-msg">
                      <div className="dp-meta mono">
                        <span className="dp-t">{m.t}</span>
                      </div>
                      <div className="dp-text">
                        {isActive ? (
                          <Typewriter text={m.text} onDone={onLineDone} />
                        ) : (
                          m.text
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Plan grid ----------
function PlanGrid({ plan, visibleCount }) {
  return (
    <section className="pg">
      <div className="row-head">
        <span className="rh-label mono">▸ THE PLAN · 5 PHASES</span>
        <span className="rh-meta mono">T-04:00 → T+04:00</span>
      </div>
      <ol className="pg-list">
        {plan.map((p, i) => (
          <li
            key={i}
            className={"phase " + (i < visibleCount ? "phase-in" : "")}
            style={{ "--delay": i * 150 + "ms" }}
          >
            <div className="phase-num mono">{String(i + 1).padStart(2, "0")}</div>
            <div className="phase-t mono">{p.t}</div>
            <div className="phase-body">
              <div className="phase-title">{p.title}</div>
              <div className="phase-desc">{p.body}</div>
            </div>
            <div className="phase-rule" />
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------- Risk score ----------
function RiskScore({ data, stamp }) {
  return (
    <section className="rs">
      <div className="row-head">
        <span className="rh-label mono">▸ RISK · COMPUTED</span>
        <span className="rh-meta mono">N=10⁴ · MONTE CARLO</span>
      </div>
      <div className="rs-body">
        <div className={"rs-num " + (stamp ? "rs-stamp" : "")}>
          <div className="rs-num-val">{data.score}</div>
          <div className="rs-num-unit mono">/ 100 · MODERATE</div>
        </div>
        <div className="rs-bars">
          {data.sub.map((s) => (
            <div key={s.label} className="rs-bar">
              <div className="rs-bar-row">
                <span className="rs-bar-label mono">{s.label}</span>
                <span className="rs-bar-val mono">{String(s.value).padStart(2, "0")}</span>
              </div>
              <div className="rs-bar-track">
                <div
                  className="rs-bar-fill"
                  style={{ width: stamp ? s.value + "%" : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Final card ----------
function FinalCard({ quote, professorQuote, show }) {
  const lines = quote.split("\n");
  return (
    <section className={"fc " + (show ? "fc-in" : "")}>
      <div className="fc-label mono gold">— THE PROFESSOR —</div>
      {professorQuote && (
        <p className="fc-professor-quote">"{professorQuote}"</p>
      )}
      {lines.map((line, i) => (
        <p key={i} className="fc-disclaimer">{line}</p>
      ))}
      <div className="fc-foot mono">
        <span>END · TRANSMISSION</span>
        <span className="dim">FILE 04 · CLOSED</span>
      </div>
    </section>
  );
}

// ---------- Stage rail ----------
function StageRail({ phase, onJump }) {
  const stages = [
    { id: "input", label: "TARGET" },
    { id: "map", label: "MAP" },
    { id: "crew", label: "CREW" },
    { id: "debate", label: "DEBATE" },
    { id: "plan", label: "PLAN" },
    { id: "risk", label: "RISK" },
    { id: "final", label: "QUOTE" },
  ];
  const idx = stages.findIndex((s) => s.id === phase);
  return (
    <div className="sr">
      {stages.map((s, i) => (
        <button
          key={s.id}
          className={"sr-step " + (i <= idx ? "done " : "") + (i === idx ? "active" : "")}
          onClick={() => onJump(s.id)}
        >
          <span className="sr-tick" />
          <span className="sr-label mono">{String(i + 1).padStart(2, "0")} · {s.label}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, {
  HeaderBar,
  TargetReveal,
  CrewCard,
  CrewGrid,
  DebatePanel,
  PlanGrid,
  RiskScore,
  FinalCard,
  StageRail,
});
