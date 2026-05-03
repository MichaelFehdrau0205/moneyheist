// Pure adapters: backend emit shape → prototype data shape.
// Load this script before app.jsx; functions are exposed on window.
//
// TODO (post-demo): when Michael's real SSE endpoint goes live, Manny's wire
// Message schema only carries `content: str` (no structured `payload`). For
// plan_section the content is "[T-04:00] TITLE — detail"; for risk_score it's
// "Risk 7.5 — detection 6, difficulty 8, coordination 7, style 9.". Add parsers
// here that extract structured fields from those strings, OR ask Manny to add a
// `payload` field to schema.py. The stub at lib/stub_stream.js currently
// supplies `payload` directly so this isn't blocking today.

const RISK_SUB_KEYS = ["detection", "difficulty", "coordination", "style"];

function normalizeRiskScore(rawRisk) {
  if (!rawRisk || typeof rawRisk !== "object") {
    console.warn("normalizeRiskScore: missing or invalid input, returning current data.risk", rawRisk);
    return window.HEIST_DATA && window.HEIST_DATA.risk;
  }
  for (const key of RISK_SUB_KEYS) {
    if (typeof rawRisk[key] !== "number") {
      console.warn(`normalizeRiskScore: missing field "${key}", returning current data.risk`, rawRisk);
      return window.HEIST_DATA && window.HEIST_DATA.risk;
    }
  }
  const sub = RISK_SUB_KEYS.map((key) => ({
    label: key.toUpperCase(),
    value: rawRisk[key] * 10,
  }));
  const score = sub.reduce((acc, s) => acc + s.value, 0) / sub.length;
  return { score, sub };
}

function normalizePlanPhase(rawPhase) {
  if (!rawPhase || typeof rawPhase !== "object") {
    console.warn("normalizePlanPhase: missing or invalid input", rawPhase);
    return null;
  }
  return {
    t: rawPhase.timestamp,
    title: typeof rawPhase.title === "string" ? rawPhase.title.toUpperCase() : rawPhase.title,
    body: rawPhase.detail,
  };
}

window.normalizeRiskScore = normalizeRiskScore;
window.normalizePlanPhase = normalizePlanPhase;
