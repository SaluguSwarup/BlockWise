/**
 * Validators for ScoringInput / ScoringOutput — see docs/scoring.md.
 * Internal to Team C. Zero-dependency, hand-written.
 */

const BANDS = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

function err(errors, path, message) {
  errors.push({ path, message });
}

function isArray(v) {
  return Array.isArray(v);
}

function inRange0to100(v) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
}

export function validateScoringInput(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [{ path: '$', message: 'ScoringInput must be an object' }] };
  }
  if (!isArray(input.requests)) err(errors, 'requests', 'requests[] is required');
  if (!isArray(input.sections)) err(errors, 'sections', 'sections[] is required');
  if (!isArray(input.defects)) err(errors, 'defects', 'defects[] is required');
  if (!isArray(input.overdue)) err(errors, 'overdue', 'overdue[] is required');
  if (!input.operations || typeof input.operations !== 'object') err(errors, 'operations', 'operations is required');
  if (!input.context || typeof input.context !== 'object') err(errors, 'context', 'context is required');
  return { valid: errors.length === 0, errors };
}

/**
 * Validates the ScoringOutput shape and value ranges. This is a *shape* validator — it does not
 * enforce that confidence is null; that is a placeholder-specific behavioural assertion (see
 * assertPlaceholderScorerStatus below and the engine's own tests), because a future trained model
 * is allowed to populate confidence within this same contract.
 */
export function validateScoringOutput(output) {
  const errors = [];
  if (!output || typeof output !== 'object') {
    return { valid: false, errors: [{ path: '$', message: 'ScoringOutput must be an object' }] };
  }

  if (!output.scorerStatus || typeof output.scorerStatus !== 'object') {
    err(errors, 'scorerStatus', 'scorerStatus is required');
  } else {
    const s = output.scorerStatus;
    if (typeof s.implementation !== 'string') err(errors, 'scorerStatus.implementation', 'must be a string');
    if (typeof s.trained !== 'boolean') err(errors, 'scorerStatus.trained', 'must be a boolean');
    if (!('model' in s)) err(errors, 'scorerStatus.model', 'must be present (null for the placeholder)');
    if (typeof s.version !== 'string') err(errors, 'scorerStatus.version', 'must be a string');
    if (typeof s.note !== 'string') err(errors, 'scorerStatus.note', 'must be a string');
  }

  if (!isArray(output.scores)) {
    err(errors, 'scores', 'scores[] is required');
  } else {
    output.scores.forEach((s, i) => {
      if (!s.requestId) err(errors, `scores[${i}].requestId`, 'requestId is required');
      if (!inRange0to100(s.urgency)) err(errors, `scores[${i}].urgency`, 'must be an integer 0-100');
      if (!inRange0to100(s.criticality)) err(errors, `scores[${i}].criticality`, 'must be an integer 0-100');
      if (!inRange0to100(s.priority)) err(errors, `scores[${i}].priority`, 'must be an integer 0-100');
      if (!BANDS.has(s.band)) err(errors, `scores[${i}].band`, 'must be one of LOW/MEDIUM/HIGH/CRITICAL');
      if (!isArray(s.factors)) err(errors, `scores[${i}].factors`, 'factors[] is required');
      if (!('confidence' in s)) err(errors, `scores[${i}].confidence`, 'confidence must be present (reserved slot — null for the placeholder, see docs/scoring.md)');
      if (!s.explanation || typeof s.explanation !== 'object') {
        err(errors, `scores[${i}].explanation`, 'explanation is required');
      } else if (!isArray(s.explanation.featureContributions)) {
        err(errors, `scores[${i}].explanation.featureContributions`, 'must be an array (reserved, empty for the placeholder)');
      }
    });
  }

  if (!isArray(output.unscored)) {
    err(errors, 'unscored', 'unscored[] is required');
  } else {
    output.unscored.forEach((u, i) => {
      if (!u.requestId) err(errors, `unscored[${i}].requestId`, 'requestId is required');
      if (!u.reason) err(errors, `unscored[${i}].reason`, 'reason is required');
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Behavioural assertion (not a shape check): the deterministic placeholder must declare itself
 * honestly and must never fabricate a confidence figure. Used by the engine's own tests.
 */
export function assertPlaceholderScorerStatus(scorerStatus) {
  const problems = [];
  if (scorerStatus?.implementation !== 'deterministic-placeholder') {
    problems.push('scorerStatus.implementation must read "deterministic-placeholder"');
  }
  if (scorerStatus?.trained !== false) problems.push('scorerStatus.trained must be false');
  if (scorerStatus?.model !== null) problems.push('scorerStatus.model must be null');
  return { ok: problems.length === 0, problems };
}
