/**
 * Validators for PlanningInput / PlanningOutput — see docs/planning.md.
 *
 * Hand-written, zero-dependency, so this package stays dependency-free for A11's
 * valid/invalid indicator and for Team C's tests. Returns { valid, errors: [{ path, message }] }.
 */

import { isValidDate, isValidTime } from './envelope.js';
import { validateScoringOutput } from './validate-scoring.js';

function err(errors, path, message) {
  errors.push({ path, message });
}

function isArray(v) {
  return Array.isArray(v);
}

/** Group 1 fields — everything the current engine already reads. Required. */
export function validatePlanningInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [{ path: '$', message: 'PlanningInput must be an object' }] };
  }

  if (!isArray(input.requests)) err(errors, 'requests', 'requests[] is required');
  if (!isArray(input.sections)) err(errors, 'sections', 'sections[] is required');
  if (!isArray(input.windows)) err(errors, 'windows', 'windows[] is required (per section, per date)');
  if (!input.timetable || typeof input.timetable !== 'object') err(errors, 'timetable', 'timetable map is required');
  if (!input.goodsForecast || typeof input.goodsForecast !== 'object') err(errors, 'goodsForecast', 'goodsForecast map is required');
  if (!isArray(input.corridorStatus)) err(errors, 'corridorStatus', 'corridorStatus[] is required');
  if (!input.context || typeof input.context !== 'object') {
    err(errors, 'context', 'context is required');
  } else {
    if (!isValidDate(input.context.horizonStart)) err(errors, 'context.horizonStart', 'must be YYYY-MM-DD');
    if (!isValidDate(input.context.horizonEnd)) err(errors, 'context.horizonEnd', 'must be YYYY-MM-DD');
  }

  if (isArray(input.windows)) {
    input.windows.forEach((w, i) => {
      if (!w.section) err(errors, `windows[${i}].section`, 'section is required');
      if (!isValidDate(w.date)) err(errors, `windows[${i}].date`, 'windows must be dated (per section, per date) — see docs/planning.md');
      if (!isValidTime(w.start)) err(errors, `windows[${i}].start`, 'must be HH:MM');
      if (!isValidTime(w.end)) err(errors, `windows[${i}].end`, 'must be HH:MM');
    });
  }

  if (isArray(input.requests)) {
    input.requests.forEach((r, i) => {
      if (!r.id) err(errors, `requests[${i}].id`, 'id is required');
      if (!r.section) err(errors, `requests[${i}].section`, 'section is required');
      if (!isValidDate(r.requestedDate)) err(errors, `requests[${i}].requestedDate`, 'must be YYYY-MM-DD');
    });
  }

  // Group 2 (scoring-stage) fields are additive contract requirements for the future scoring
  // stage, not a claim they exist in today's data — see docs/planning.md. Validate shape only
  // when present; never require them.
  if (isArray(input.sections)) {
    input.sections.forEach((s, i) => {
      if (s.healthHistory !== undefined && !isArray(s.healthHistory)) {
        err(errors, `sections[${i}].healthHistory`, 'when present, healthHistory must be an array');
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validatePlanningOutput(output) {
  const errors = [];
  if (!output || typeof output !== 'object') {
    return { valid: false, errors: [{ path: '$', message: 'PlanningOutput must be an object' }] };
  }

  if (!output.planId) err(errors, 'planId', 'planId is required');
  if (!output.generatedAt) err(errors, 'generatedAt', 'generatedAt is required');
  if (!output.engineVersion) err(errors, 'engineVersion', 'engineVersion is required');
  if (!isArray(output.blocks)) err(errors, 'blocks', 'blocks[] is required');
  if (!output.metrics || typeof output.metrics !== 'object') err(errors, 'metrics', 'metrics is required');
  if (!isArray(output.unscheduled)) err(errors, 'unscheduled', 'unscheduled[] is required');
  if (!isArray(output.scores)) err(errors, 'scores', 'scores[] is required');
  if (!isArray(output.unscored)) err(errors, 'unscored', 'unscored[] is required');

  if (!output.scorerStatus) {
    err(errors, 'scorerStatus', 'scorerStatus is required — every plan must declare the scorer behind it');
  } else {
    const scoringErrors = validateScoringOutput({
      scorerStatus: output.scorerStatus,
      scores: output.scores || [],
      unscored: output.unscored || [],
    }).errors;
    scoringErrors.forEach((e) => err(errors, e.path, e.message));
  }

  if (isArray(output.blocks)) {
    output.blocks.forEach((b, i) => {
      if (!b.id) err(errors, `blocks[${i}].id`, 'id is required');
      if (!b.section) err(errors, `blocks[${i}].section`, 'section is required');
      if (!isValidDate(b.date)) err(errors, `blocks[${i}].date`, 'must be YYYY-MM-DD');
      if (!isArray(b.tasks)) err(errors, `blocks[${i}].tasks`, 'tasks[] is required');
      if (!isArray(b.reasoning)) err(errors, `blocks[${i}].reasoning`, 'reasoning[] is required (explainability)');
    });
  }

  if (isArray(output.unscheduled)) {
    output.unscheduled.forEach((u, i) => {
      if (!u.requestId) err(errors, `unscheduled[${i}].requestId`, 'requestId is required');
      if (!u.reason) err(errors, `unscheduled[${i}].reason`, 'reason is required — a missing score must be visible, not invented');
    });
  }

  return { valid: errors.length === 0, errors };
}
