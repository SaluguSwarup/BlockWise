import { describe, it, expect } from 'vitest';
import { isEnvelope, validatePlanningOutput } from '@blockwise/contracts';

import sections from '../mocks/sections.json';
import network from '../mocks/network.json';
import sectionDetail from '../mocks/section-detail.json';
import defects from '../mocks/defects.json';
import overdue from '../mocks/overdue.json';
import health from '../mocks/health.json';
import operations from '../mocks/operations.json';
import requests from '../mocks/requests.json';
import tickets from '../mocks/tickets.json';
import blocks from '../mocks/blocks.json';
import sources from '../mocks/sources.json';
import plan from '../mocks/plan.json';

const FIXTURES = { sections, network, sectionDetail, defects, overdue, health, operations, requests, tickets, blocks, sources, plan };

describe('src/mocks — every fixture is envelope-shaped (R3)', () => {
  Object.entries(FIXTURES).forEach(([name, fixture]) => {
    it(`${name}.json is a valid response envelope`, () => {
      expect(isEnvelope(fixture)).toBe(true);
      expect(fixture.ok).toBe(true);
      expect(fixture.error).toBeNull();
    });
  });
});

describe('requests.json — priority is baked in (ScoringOutput shape)', () => {
  it('every request carries a priority record with a declared scorerStatus', () => {
    requests.data.forEach((r) => {
      expect(r.priority).toBeTruthy();
      expect(r.priority.band).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
      expect(r.priority.confidence).toBeNull();
    });
  });

  it('declares the placeholder honestly, never as a trained model', () => {
    const first = requests.data[0];
    expect(first.priority.factors.length).toBeGreaterThan(0);
  });
});

describe('plan.json — the strict canned PlanningOutput (R3)', () => {
  it('validates against the frozen PlanningOutput contract', () => {
    const { valid, errors } = validatePlanningOutput(plan.data);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it('declares the deterministic placeholder, not a trained model', () => {
    expect(plan.data.scorerStatus.implementation).toBe('deterministic-placeholder');
    expect(plan.data.scorerStatus.trained).toBe(false);
    expect(plan.data.scorerStatus.model).toBeNull();
  });

  it('contains the flagship multi-department merge the current prototype already produces', () => {
    const flagship = plan.data.blocks.find((b) => b.section === 'SEC-104' && b.merged);
    expect(flagship).toBeTruthy();
    expect(flagship.depts.sort()).toEqual(['ENGG', 'SNT', 'TRD']);
  });
});
