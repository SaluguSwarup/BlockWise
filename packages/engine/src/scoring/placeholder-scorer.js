/**
 * BlockWise — deterministic placeholder scorer.
 *
 * This is the prototype's existing `scoreRequest` logic (previously
 * src/lib/planningEngine.js), carried across unchanged and relabelled as the placeholder it is.
 * No new factor, weight or scoring rule is introduced here — see packages/engine/README.md.
 *
 * NOT A TRAINED ML MODEL. A transparent deterministic weighted combination of six factors, chosen
 * because it is explainable and reproducible. No accuracy, precision, recall or other
 * model-performance figure is claimed for it anywhere.
 */

// Duplicated from src/data/blockRequests.js — the scorer may not import frontend data modules.
const CRITICALITY_WEIGHT = { CRITICAL: 100, HIGH: 78, MEDIUM: 52, LOW: 28 };
const URGENCY_WEIGHT = { IMMEDIATE: 100, HIGH: 76, NORMAL: 48, PLANNED: 24 };
const SAFETY_WEIGHT = { HIGH: 100, MEDIUM: 60, LOW: 30 };

export const FACTOR_WEIGHTS = [
  { key: 'criticality', label: 'Criticality of activity', weight: 0.24 },
  { key: 'urgency', label: 'Urgency raised by department', weight: 0.20 },
  { key: 'safety', label: 'Safety impact', weight: 0.16 },
  { key: 'health', label: 'Asset health deficit', weight: 0.14 },
  { key: 'overdue', label: 'Overdue status', weight: 0.14 },
  { key: 'availability', label: 'Impact on asset availability', weight: 0.12 },
];

export function priorityBand(score) {
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Scores one request against its section. Same arithmetic as the pre-extraction
 * `scoreRequest(request)` — `section` replaces the old `TRACK_BY_ID[request.section]` lookup,
 * which the caller (src/scoring/index.js) now performs from ScoringInput.sections[].
 *
 * Returns { score, band, factors[] } — unchanged shape from the prototype.
 */
export function scoreOneRequest(request, section) {
  const raw = {
    criticality: CRITICALITY_WEIGHT[request.criticality] ?? 40,
    urgency: URGENCY_WEIGHT[request.urgency] ?? 40,
    safety: SAFETY_WEIGHT[request.safetyImpact] ?? 40,
    health: section ? 100 - section.health : 40,
    overdue: Math.min(100, (request.overdueDays || 0) * 4.5),
    availability: request.assetImpact ?? 40,
  };

  const notes = {
    criticality: `${request.criticality} activity as classified by ${request.system}`,
    urgency: `${request.urgency} — raised by ${request.requestedBy}`,
    safety: `${request.safetyImpact} safety consequence if deferred`,
    health: section ? `Section health ${section.health}% (deficit ${100 - section.health} pts)` : 'Section health unavailable',
    overdue: request.overdueDays ? `Overdue by ${request.overdueDays} days` : 'Within schedule',
    availability: `${request.assetImpact}/100 — ${request.assetImpactNote}`,
  };

  const factors = FACTOR_WEIGHTS.map((f) => ({
    key: f.key,
    label: f.label,
    weight: f.weight,
    value: Math.round(raw[f.key]),
    contribution: +(raw[f.key] * f.weight).toFixed(1),
    note: notes[f.key],
  }));

  const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0));
  return { score, band: priorityBand(score), factors };
}
