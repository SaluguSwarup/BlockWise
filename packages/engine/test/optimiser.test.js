import { describe, it, expect } from 'vitest';
import { runPlan } from '../src/index.js';
import { validatePlanningOutput } from '@blockwise/contracts';
import { buildSamplePlanningInput } from './fixtures.js';

describe('runPlan (scoring + optimiser end to end)', () => {
  it('produces a PlanningOutput that validates against the frozen contract', () => {
    const output = runPlan(buildSamplePlanningInput());
    const { valid, errors } = validatePlanningOutput(output);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it('merges three compatible departmental requests on one section/date into one block', () => {
    const output = runPlan(buildSamplePlanningInput());
    expect(output.blocks).toHaveLength(1);
    expect(output.blocks[0].merged).toBe(true);
    expect(output.blocks[0].depts.sort()).toEqual(['ENGG', 'SNT', 'TRD']);
    expect(output.blocks[0].tasks).toHaveLength(3);
  });

  it('reports a real before/after time saving for the merged block', () => {
    const output = runPlan(buildSamplePlanningInput());
    expect(output.metrics.savedMin).toBeGreaterThan(0);
    expect(output.metrics.blocksBefore).toBe(3);
    expect(output.metrics.blocksAfter).toBe(1);
  });

  it('is deterministic given the same input (ids aside)', () => {
    const a = runPlan(buildSamplePlanningInput());
    const b = runPlan(buildSamplePlanningInput());
    // planId/generatedAt are run identifiers, not part of the optimisation result.
    const strip = (o) => ({ ...o, planId: undefined, generatedAt: undefined });
    expect(strip(a)).toEqual(strip(b));
  });

  it('every block carries a non-empty reasoning trail', () => {
    const output = runPlan(buildSamplePlanningInput());
    output.blocks.forEach((b) => {
      expect(b.reasoning.length).toBeGreaterThan(0);
      b.reasoning.forEach((r) => expect(typeof r.text).toBe('string'));
    });
  });

  it('unscheduled[] is empty when nothing is unscored', () => {
    const output = runPlan(buildSamplePlanningInput());
    expect(output.unscheduled).toEqual([]);
  });
});
