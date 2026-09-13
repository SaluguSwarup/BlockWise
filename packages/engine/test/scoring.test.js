import { describe, it, expect } from 'vitest';
import { scorePlaceholder, PLACEHOLDER_SCORER_STATUS } from '../src/scoring/index.js';
import { toScoringInput } from '../src/scoring/from-planning-input.js';
import { assertPlaceholderScorerStatus, validateScoringOutput } from '@blockwise/contracts';
import { buildSamplePlanningInput } from './fixtures.js';

describe('deterministic placeholder scorer', () => {
  const scoringInput = toScoringInput(buildSamplePlanningInput());

  it('validates against the frozen ScoringOutput contract', () => {
    const output = scorePlaceholder(scoringInput);
    const { valid, errors } = validateScoringOutput(output);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it('declares itself honestly as a placeholder, never a trained model', () => {
    const output = scorePlaceholder(scoringInput);
    const { ok, problems } = assertPlaceholderScorerStatus(output.scorerStatus);
    expect(problems).toEqual([]);
    expect(ok).toBe(true);
    expect(output.scorerStatus).toEqual(PLACEHOLDER_SCORER_STATUS);
  });

  it('never fabricates a confidence figure', () => {
    const output = scorePlaceholder(scoringInput);
    output.scores.forEach((s) => {
      expect(s.confidence).toBeNull();
    });
  });

  it('leaves the featureContributions explanation slot empty, reserved for a future model', () => {
    const output = scorePlaceholder(scoringInput);
    output.scores.forEach((s) => {
      expect(s.explanation.featureContributions).toEqual([]);
    });
  });

  it('is deterministic — the same input always produces the same output', () => {
    const a = scorePlaceholder(scoringInput);
    const b = scorePlaceholder(scoringInput);
    expect(a).toEqual(b);
  });

  it('every factor contribution reconciles with the total score', () => {
    const output = scorePlaceholder(scoringInput);
    output.scores.forEach((s) => {
      const total = Math.round(s.factors.reduce((sum, f) => sum + f.contribution, 0));
      expect(s.priority).toBe(total);
    });
  });

  it('scores every request in range 0-100', () => {
    const output = scorePlaceholder(scoringInput);
    expect(output.scores).toHaveLength(scoringInput.requests.length);
    output.scores.forEach((s) => {
      expect(s.priority).toBeGreaterThanOrEqual(0);
      expect(s.priority).toBeLessThanOrEqual(100);
    });
  });
});
