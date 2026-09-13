/**
 * The frozen scoring boundary — score(ScoringInput) → ScoringOutput.
 * See packages/contracts/docs/scoring.md.
 *
 * This module is the interface. The arithmetic behind it (scoreOneRequest) is the prototype's
 * existing scoring logic, wrapped here as the deterministic placeholder — see
 * placeholder-scorer.js and the package README for what is and is not in scope for R4.
 */

import { scoreOneRequest } from './placeholder-scorer.js';

export const PLACEHOLDER_SCORER_STATUS = Object.freeze({
  implementation: 'deterministic-placeholder',
  trained: false,
  model: null,
  version: 'placeholder-0.1',
  note: 'Placeholder for a future ML scorer. Not a trained ML model.',
});

/**
 * The placeholder scorer, implementing the frozen score(ScoringInput) → ScoringOutput interface.
 *
 * Pre-Day-1 note on unscored[]: the pre-extraction prototype never withheld a score — a request
 * missing a section or a rated field was given a neutral default (see placeholder-scorer.js) and
 * scored anyway. That behaviour is carried across unchanged, so unscored[] is always empty here.
 * Real "cannot be scored" detection is Team C's Day-1 work (C2) and is layered on top of this same
 * interface without changing its shape.
 */
export function scorePlaceholder(scoringInput) {
  const sectionById = new Map((scoringInput.sections || []).map((s) => [s.id, s]));

  const scores = (scoringInput.requests || []).map((request) => {
    const section = sectionById.get(request.section);
    const { score, band, factors } = scoreOneRequest(request, section);
    // The pre-extraction prototype computed one combined score, not three distinct dimensions.
    // ScoringOutput requires urgency/criticality/priority separately (docs/scoring.md §3); until
    // Team C's Day-1 work (C2) distinguishes them, all three carry the same combined value. This
    // is a contract-shape necessity, not a new scoring rule — no new arithmetic is introduced.
    return {
      requestId: request.id,
      urgency: score,
      criticality: score,
      priority: score,
      band,
      factors,
      explanation: { summary: '', featureContributions: [] },
      confidence: null, // reserved for a future trained model — see docs/scoring.md
    };
  });

  return {
    scorerStatus: PLACEHOLDER_SCORER_STATUS,
    scores,
    unscored: [],
  };
}
