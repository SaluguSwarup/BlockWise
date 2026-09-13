/**
 * Date/time helpers used by the optimiser.
 *
 * Deliberately duplicated from src/lib/format.js rather than imported — the engine may not
 * import anything from the frontend (see the package README). Kept to exactly the subset the
 * optimiser needs, carried across unchanged from the pre-extraction implementation.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(iso) {
  const d = parseDate(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(min) {
  const v = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
}

/** Window length in minutes, handling windows that cross midnight. */
export function windowLength(start, end) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return e > s ? e - s : e + 1440 - s;
}
