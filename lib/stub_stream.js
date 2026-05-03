// Stub stream: emits 11 messages on Manny's locked wire format at 600ms cadence.
// Sequence: 4 speaking → 5 plan_section → 1 risk_score → 1 final_word.
// Content sourced from window.HEIST_DATA so the stub stays in sync with Paula's copy.
//
// Note on payload field: Manny's Message schema only has {agent, content, timestamp,
// type, agent_id}. plan_section/risk_score encode structured data inside `content`
// as a formatted string. The stub also attaches `payload` for the adapter to consume.
// When real SSE comes online, we'll either extend Manny's schema with `payload` or
// add a content-string parser in the adapters.

const STUB_CADENCE_MS = 3000;

const SPEAKING_AGENTS = [
  { name: "The Professor", id: "professor" },
  { name: "Brooklyn",      id: "brooklyn"  },
  { name: "Houston",       id: "houston"   },
  { name: "Detroit",       id: "detroit"   },
];

const PLAN_AGENT_ASSIGNMENTS = [
  { name: "Houston",       id: "houston"   },
  { name: "Brooklyn",      id: "brooklyn"  },
  { name: "The Professor", id: "professor" },
  { name: "Detroit",       id: "detroit"   },
  { name: "Detroit",       id: "detroit"   },
];

const RISK_PAYLOAD = { detection: 6, difficulty: 8, coordination: 7, style: 9 };

function nowIso() {
  return new Date().toISOString();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* createHeistStream(target) {
  const data = window.HEIST_DATA;
  if (!data) throw new Error("createHeistStream: window.HEIST_DATA not loaded");

  for (let i = 0; i < SPEAKING_AGENTS.length; i++) {
    await delay(STUB_CADENCE_MS);
    const { name, id } = SPEAKING_AGENTS[i];
    const source = data.debate.find((d) => d.who === id) || data.debate[i];
    yield {
      agent: name,
      agent_id: id,
      type: "speaking",
      timestamp: nowIso(),
      content: source.text,
    };
  }

  for (let i = 0; i < data.plan.length; i++) {
    await delay(STUB_CADENCE_MS);
    const phase = data.plan[i];
    const { name, id } = PLAN_AGENT_ASSIGNMENTS[i] || PLAN_AGENT_ASSIGNMENTS[PLAN_AGENT_ASSIGNMENTS.length - 1];
    yield {
      agent: name,
      agent_id: id,
      type: "plan_section",
      timestamp: nowIso(),
      content: `[${phase.t}] ${phase.title} \u2014 ${phase.body}`,
      payload: {
        timestamp: phase.t,
        title: phase.title,
        agent: name,
        detail: phase.body,
      },
    };
  }

  await delay(STUB_CADENCE_MS);
  const rs = RISK_PAYLOAD;
  const total = (rs.detection + rs.difficulty + rs.coordination + rs.style) / 4;
  yield {
    agent: "The Professor",
    agent_id: "professor",
    type: "risk_score",
    timestamp: nowIso(),
    content: `Risk ${total.toFixed(1)} \u2014 detection ${rs.detection}, difficulty ${rs.difficulty}, coordination ${rs.coordination}, style ${rs.style}.`,
    payload: rs,
  };

  await delay(STUB_CADENCE_MS);
  yield {
    agent: "The Professor",
    agent_id: "professor",
    type: "final_word",
    timestamp: nowIso(),
    content: data.professorQuote,
  };
}

window.createHeistStream = createHeistStream;
