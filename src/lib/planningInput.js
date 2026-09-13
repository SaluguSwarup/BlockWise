/**
 * Converts today's frontend mock data (src/data/*) into a PlanningInput that satisfies the
 * frozen contract (packages/contracts/docs/planning.md). Used by both /dev/planner
 * (src/dev/team-c/) and scripts/build-fixtures.mjs, so the two always agree.
 *
 * This is a shape adaptation only — it does not add or alter any value the current prototype
 * already computes. See the note on `windows` below.
 */
import { TRACKS, TRACK_BY_ID } from '../data/tracks.js';
import { getWindowsForSection, TIMETABLE, GOODS_FORECAST, CORRIDOR_STATUS } from '../data/trains.js';

function toSectionRecord(t) {
  return {
    id: t.id, trackId: t.trackId, corridor: t.corridor, from: t.from, to: t.to, name: t.name,
    lengthKm: t.lengthKm, chainage: t.chainage, lineConfig: t.lineConfig, sectionalSpeed: t.sectionalSpeed,
    gauge: t.gauge, health: t.health, status: t.status, assetAvailability: t.assetAvailability,
    trainsPerDay: t.trainsPerDay, gmt: t.gmt, inCharge: t.inCharge,
  };
}

/**
 * Builds a PlanningInput for exactly the given requests.
 *
 * `windows`: PlanningInput requires windows per section, per date (see docs/planning.md); today's
 * data is an undated per-corridor template (getWindowsForSection in src/data/trains.js). This
 * stamps that same template with each date a request in this selection actually falls on — a
 * shape adaptation, not a new value. A1/A6 own producing genuinely dated windows on Day 1/2.
 */
export function buildPlanningInputFromRequests(requests) {
  const sectionIds = new Set(requests.map((r) => r.section));
  const sections = TRACKS.filter((t) => sectionIds.has(t.id)).map(toSectionRecord);

  const windows = [];
  const seen = new Set();
  requests.forEach((r) => {
    const key = `${r.section}__${r.requestedDate}`;
    if (seen.has(key)) return;
    seen.add(key);
    const track = TRACK_BY_ID[r.section];
    if (!track) return;
    getWindowsForSection(r.section, track.corridor).forEach((w) => {
      windows.push({ ...w, section: r.section, date: r.requestedDate });
    });
  });

  const dates = requests.map((r) => r.requestedDate).sort();

  return {
    requests,
    sections,
    windows,
    timetable: TIMETABLE,
    goodsForecast: GOODS_FORECAST,
    corridorStatus: CORRIDOR_STATUS,
    context: {
      horizonStart: dates[0] || '2026-09-12',
      horizonEnd: dates[dates.length - 1] || '2026-09-12',
      division: 'Delhi Division',
    },
  };
}
