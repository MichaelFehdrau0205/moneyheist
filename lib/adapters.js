// Pure adapters: backend emit shape → prototype data shape.
// Load this script before app.jsx; functions are exposed on window.
//
// Manny's Message schema only carries `content: str`. For plan_section content
// is "[T-04:00] TITLE — detail"; for risk_score "Risk 7.5 — detection 6,
// difficulty 8, coordination 7, style 9.". Parsers below extract the structured
// shape. The stub at lib/stub_stream.js also attaches a `payload` field — when
// present we prefer it over parsing.

const RISK_SUB_KEYS = ["detection", "difficulty", "coordination", "style"];

function parsePlanContent(content) {
  if (typeof content !== "string") return null;
  // "[T-04:00] ASSEMBLY — Crew converges..."  (em-dash, en-dash, or hyphen)
  const match = content.match(/^\[([^\]]+)\]\s+(.+?)\s+[\u2014\u2013-]\s+(.+)$/);
  if (!match) return null;
  return {
    timestamp: match[1].trim(),
    title: match[2].trim(),
    detail: match[3].trim(),
    agent: null,
  };
}

function parseRiskContent(content) {
  if (typeof content !== "string") return null;
  // "Risk 7.5 — detection 6, difficulty 8, coordination 7, style 9."
  const match = content.match(/Risk\s+[\d.]+\s+[\u2014\u2013-]\s+detection\s+(\d+)[\s,]+difficulty\s+(\d+)[\s,]+coordination\s+(\d+)[\s,]+style\s+(\d+)/i);
  if (!match) return null;
  return {
    detection: parseInt(match[1], 10),
    difficulty: parseInt(match[2], 10),
    coordination: parseInt(match[3], 10),
    style: parseInt(match[4], 10),
  };
}

function normalizeRiskScore(input) {
  let raw = input;
  if (input && typeof input === "object" && typeof input.detection !== "number" && typeof input.content === "string") {
    raw = parseRiskContent(input.content);
  } else if (typeof input === "string") {
    raw = parseRiskContent(input);
  }
  if (!raw || typeof raw !== "object") {
    console.warn("normalizeRiskScore: could not extract payload, falling back to data.risk", input);
    return window.HEIST_DATA && window.HEIST_DATA.risk;
  }
  for (const key of RISK_SUB_KEYS) {
    if (typeof raw[key] !== "number") {
      console.warn(`normalizeRiskScore: missing field "${key}", falling back to data.risk`, input);
      return window.HEIST_DATA && window.HEIST_DATA.risk;
    }
  }
  const sub = RISK_SUB_KEYS.map((key) => ({
    label: key.toUpperCase(),
    value: raw[key] * 10,
  }));
  const score = sub.reduce((acc, s) => acc + s.value, 0) / sub.length;
  return { score, sub };
}

function normalizePlanPhase(input) {
  let raw = input;
  // Stub passes a structured payload with `title`; real backend passes the raw
  // Message (content is a "[T-04:00] TITLE — DETAIL" string, no `title` field).
  if (input && typeof input === "object" && typeof input.title !== "string" && typeof input.content === "string") {
    raw = parsePlanContent(input.content);
    if (raw && input.agent) raw.agent = input.agent;
  } else if (typeof input === "string") {
    raw = parsePlanContent(input);
  }
  if (!raw || typeof raw !== "object") {
    console.warn("normalizePlanPhase: missing or invalid input", input);
    return null;
  }
  return {
    t: raw.timestamp,
    title: typeof raw.title === "string" ? raw.title.toUpperCase() : raw.title,
    body: raw.detail,
  };
}

window.parsePlanContent = parsePlanContent;
window.parseRiskContent = parseRiskContent;
window.normalizeRiskScore = normalizeRiskScore;
window.normalizePlanPhase = normalizePlanPhase;
