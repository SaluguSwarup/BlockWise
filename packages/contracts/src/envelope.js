/**
 * BlockWise API response envelope — see docs/envelope.md.
 * Frozen Pre-Day-1. Additive-only after that.
 */

export function ok(data, meta = {}) {
  return { ok: true, data, error: null, meta };
}

export function fail(code, message, details = {}, meta = {}) {
  return { ok: false, data: null, error: { code, message, details }, meta };
}

export function isEnvelope(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof value.ok === 'boolean' &&
    'data' in value &&
    'error' in value &&
    typeof value.meta === 'object' &&
    value.meta !== null
  );
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDate(s) {
  return typeof s === 'string' && DATE_RE.test(s);
}

export function isValidTime(s) {
  return typeof s === 'string' && TIME_RE.test(s);
}
