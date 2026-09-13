import { describe, it, expect } from 'vitest';
import { validatePlanningInput, validateScoringOutput, ok, fail, isEnvelope } from '../src/index.js';

const samplePlanningInput = {
  requests: [{ id: 'REQ-1', section: 'SEC-A', requestedDate: '2026-09-12' }],
  sections: [{ id: 'SEC-A', health: 80 }],
  windows: [{ section: 'SEC-A', date: '2026-09-12', start: '01:00', end: '03:00' }],
  timetable: {},
  goodsForecast: {},
  corridorStatus: [],
  context: { horizonStart: '2026-09-12', horizonEnd: '2026-09-12' },
};

describe('validatePlanningInput', () => {
  it('accepts a well-formed PlanningInput', () => {
    const { valid, errors } = validatePlanningInput(samplePlanningInput);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it('reports the reason when a required field is missing', () => {
    const broken = { ...samplePlanningInput, sections: undefined };
    const { valid, errors } = validatePlanningInput(broken);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.path === 'sections')).toBe(true);
  });

  it('rejects an undated window — windows must be per section, per date', () => {
    const broken = { ...samplePlanningInput, windows: [{ section: 'SEC-A', start: '01:00', end: '03:00' }] };
    const { valid, errors } = validatePlanningInput(broken);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.path === 'windows[0].date')).toBe(true);
  });

  it('does not require Group 2 (future scoring-stage) fields to be present', () => {
    // sections[] here carries none of the scoring-stage extras (health history, track class, ...)
    // — that must not fail validation, per docs/planning.md.
    const { valid, errors } = validatePlanningInput(samplePlanningInput);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });
});

describe('envelope helpers', () => {
  it('ok() wraps data in a valid envelope', () => {
    const env = ok({ hello: 'world' });
    expect(isEnvelope(env)).toBe(true);
    expect(env.ok).toBe(true);
    expect(env.error).toBeNull();
  });

  it('fail() wraps an error in a valid envelope', () => {
    const env = fail('NOT_FOUND', 'nope');
    expect(isEnvelope(env)).toBe(true);
    expect(env.ok).toBe(false);
    expect(env.data).toBeNull();
    expect(env.error.code).toBe('NOT_FOUND');
  });
});

describe('validateScoringOutput', () => {
  it('requires confidence to be present (reserved slot) on every score', () => {
    const output = {
      scorerStatus: { implementation: 'x', trained: false, model: null, version: '0.1', note: 'n' },
      scores: [{ requestId: 'REQ-1', urgency: 50, criticality: 50, priority: 50, band: 'MEDIUM', factors: [], explanation: { summary: '', featureContributions: [] } }],
      unscored: [],
    };
    const { valid, errors } = validateScoringOutput(output);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.path === 'scores[0].confidence')).toBe(true);
  });
});
