/**
 * @blockwise/engine — takes a PlanningInput and returns a PlanningOutput.
 *
 * Forbidden from importing the database, the backend or the frontend (see README.md). This is
 * the extraction of the prototype's existing src/lib/planningEngine.js (R4) — no new scoring or
 * optimisation behaviour is introduced here.
 */

import { toScoringInput } from './scoring/from-planning-input.js';
import { scorePlaceholder } from './scoring/index.js';
import { optimise } from './optimiser/index.js';
import { computeMetrics } from './optimiser/metrics.js';

export { scorePlaceholder, PLACEHOLDER_SCORER_STATUS } from './scoring/index.js';
export { scoreOneRequest, priorityBand, FACTOR_WEIGHTS } from './scoring/placeholder-scorer.js';
export { toScoringInput } from './scoring/from-planning-input.js';
export { optimise } from './optimiser/index.js';
export { computeMetrics } from './optimiser/metrics.js';
export { rankWindows, evaluateWindow, trainsInWindow } from './optimiser/windows.js';

export const ENGINE_VERSION = '0.1.0-pre-day-1';

/**
 * Runs the full two-stage plan: score every request, hand the scored requests to the optimiser,
 * and report anything left unscheduled.
 *
 * `options.scorer` — a function ScoringInput -> ScoringOutput — defaults to the deterministic
 * placeholder. Substituting a different scorer here and observing the plan change without any
 * optimiser code changing is the boundary proof required by BlockWise.md (C2's acceptance
 * condition) and asserted in test/boundary.test.js.
 */
export function runPlan(planningInput, options = {}) {
  const scorer = options.scorer || scorePlaceholder;

  const scoringInput = toScoringInput(planningInput);
  const scoringOutput = scorer(scoringInput);

  const scoreByRequestId = new Map(scoringOutput.scores.map((s) => [s.requestId, s]));
  const unscoredIds = new Set((scoringOutput.unscored || []).map((u) => u.requestId));

  const unscheduled = (scoringOutput.unscored || []).map((u) => ({ requestId: u.requestId, reason: u.reason }));

  const scorable = (planningInput.requests || []).filter((r) => !unscoredIds.has(r.id));
  const scoredRequests = scorable.map((r) => ({ ...r, __score: scoreByRequestId.get(r.id) }));

  const { blocks } = optimise(scoredRequests, planningInput);
  const metrics = computeMetrics(scoredRequests, blocks);

  return {
    planId: `PLAN-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    scorerStatus: scoringOutput.scorerStatus,
    scores: scoringOutput.scores,
    unscored: scoringOutput.unscored || [],
    blocks,
    metrics,
    unscheduled,
  };
}
