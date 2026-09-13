import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPlan } from '../src/index.js';
import { buildSamplePlanningInput } from './fixtures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('scorer <-> optimiser boundary (R4)', () => {
  it('the optimiser source imports nothing from src/scoring/', () => {
    const optimiserDir = path.join(__dirname, '..', 'src', 'optimiser');
    const files = fs.readdirSync(optimiserDir).filter((f) => f.endsWith('.js'));
    files.forEach((file) => {
      const content = fs.readFileSync(path.join(optimiserDir, file), 'utf8');
      expect(content).not.toMatch(/from ['"].*scoring/);
    });
  });

  it('substituting a different scorer behind the same interface changes the plan with zero optimiser changes', () => {
    const planningInput = buildSamplePlanningInput();

    // A deliberately different stub scorer: same shape, inverted ranking (lowest input score
    // wins). If the optimiser only reads what the scorer hands it, the plan changes; if it does
    // not change, the optimiser must be reaching around the interface.
    function invertedStubScorer(scoringInput) {
      const max = 100;
      return {
        scorerStatus: {
          implementation: 'stub-inverted-for-test',
          trained: false,
          model: null,
          version: 'test-0.1',
          note: 'Test-only stub scorer, not a placeholder or a trained model.',
        },
        scores: scoringInput.requests.map((r, i) => {
          // Reversed order relative to array position — deliberately different from whatever
          // order the placeholder's own arithmetic produces, so the top-scored request changes.
          const value = max - (scoringInput.requests.length - 1 - i) * 10;
          return {
            requestId: r.id,
            urgency: value,
            criticality: value,
            priority: value,
            band: value >= 70 ? 'HIGH' : 'MEDIUM',
            factors: [],
            explanation: { summary: '', featureContributions: [] },
            confidence: null,
          };
        }),
        unscored: [],
      };
    }

    const withPlaceholder = runPlan(planningInput);
    const withStub = runPlan(planningInput, { scorer: invertedStubScorer });

    // Same three requests still merge into one block (the optimiser's clustering logic didn't
    // change), but the priority/lead-request bookkeeping — which is scorer-derived — differs.
    expect(withPlaceholder.blocks).toHaveLength(1);
    expect(withStub.blocks).toHaveLength(1);
    expect(withPlaceholder.blocks[0].leadRequestId).not.toBe(withStub.blocks[0].leadRequestId);
    expect(withPlaceholder.blocks[0].priorityScore).not.toBe(withStub.blocks[0].priorityScore);
    expect(withStub.scorerStatus.implementation).toBe('stub-inverted-for-test');
  });

  it('a request the scorer withholds is excluded from the plan and reported in unscheduled[]', () => {
    const planningInput = buildSamplePlanningInput();

    function withholdingScorer(scoringInput) {
      const [withheld, ...rest] = scoringInput.requests;
      return {
        scorerStatus: {
          implementation: 'stub-withholding-for-test',
          trained: false,
          model: null,
          version: 'test-0.1',
          note: 'Test-only stub scorer.',
        },
        scores: rest.map((r) => ({
          requestId: r.id,
          urgency: 50,
          criticality: 50,
          priority: 50,
          band: 'MEDIUM',
          factors: [],
          explanation: { summary: '', featureContributions: [] },
          confidence: null,
        })),
        unscored: [{ requestId: withheld.id, reason: 'Test: missing required feature for this scenario.' }],
      };
    }

    const output = runPlan(planningInput, { scorer: withholdingScorer });
    expect(output.unscheduled).toEqual([
      { requestId: 'REQ-1', reason: 'Test: missing required feature for this scenario.' },
    ]);
    const scoredIds = output.scores.map((s) => s.requestId);
    expect(scoredIds).not.toContain('REQ-1');
    output.blocks.forEach((b) => {
      expect(b.tasks.map((t) => t.requestId)).not.toContain('REQ-1');
    });
  });
});
