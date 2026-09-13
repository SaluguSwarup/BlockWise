/**
 * Window evaluation and ranking — the prototype's existing evaluateWindow/rankWindows logic,
 * carried across unchanged. The only change from the pre-extraction version is where the data
 * comes from: instead of importing src/data/trains.js, this reads the timetable and windows
 * supplied on the PlanningInput (see packages/contracts/docs/planning.md — windows are per
 * section, per date).
 */

import { toMinutes, fromMinutes, windowLength } from './time.js';

const TRAIN_WEIGHT = { EXPRESS: 4, PASSENGER: 3, GOODS: 1.5 };

/** Same matching rule as the prototype's trainsInWindow, now taking the corridor's entries directly. */
export function trainsInWindow(timetableForCorridor, start, end) {
  const list = timetableForCorridor || [];
  const toMin = (t) => toMinutes(t);
  const s = toMin(start);
  let e = toMin(end);
  const wrap = e <= s;
  if (wrap) e += 24 * 60;
  return list.filter((t) => {
    let v = toMin(t.time);
    if (wrap && v < s) v += 24 * 60;
    return v >= s && v <= e;
  });
}

export function evaluateWindow(sectionId, corridorId, win, requiredMin, timetableForCorridor) {
  const capacity = windowLength(win.start, win.end);
  const fits = capacity >= requiredMin;

  // Trains are counted over the period the block would actually occupy — the block starts at
  // the top of the window and runs for its own duration, not for the whole window.
  const occupancyMin = Math.min(requiredMin, capacity);
  const occupancyEnd = fromMinutes(toMinutes(win.start) + occupancyMin);
  const trains = trainsInWindow(timetableForCorridor, win.start, occupancyEnd);

  const counts = { express: 0, passenger: 0, goods: 0 };
  trains.forEach((t) => {
    if (t.type === 'EXPRESS') counts.express += 1;
    else if (t.type === 'PASSENGER') counts.passenger += 1;
    else counts.goods += 1;
  });

  const trafficLoad =
    counts.express * TRAIN_WEIGHT.EXPRESS +
    counts.passenger * TRAIN_WEIGHT.PASSENGER +
    counts.goods * TRAIN_WEIGHT.GOODS;

  let disruption = trafficLoad * 2 + win.densityIndex;
  if (win.coa === 'Restricted') disruption += 18;
  if (win.coa === 'Not preferred') disruption += 40;
  if (!fits) disruption += 60;

  return {
    ...win,
    sectionId,
    capacityMin: capacity,
    fits,
    counts,
    trains,
    trafficLoad: +trafficLoad.toFixed(1),
    disruption: Math.round(disruption),
    trainsAffected: counts.express + counts.passenger + counts.goods,
  };
}

/**
 * Ranks the windows already filtered to one section and one date (see optimiser/index.js),
 * lowest disruption first. `timetable` is the PlanningInput's { [corridorId]: entries[] } map.
 */
export function rankWindows(windowsForSectionDate, sectionId, corridorId, requiredMin, timetable) {
  const timetableForCorridor = (timetable || {})[corridorId] || [];
  return windowsForSectionDate
    .map((w) => evaluateWindow(sectionId, corridorId, w, requiredMin, timetableForCorridor))
    .sort((a, b) => a.disruption - b.disruption);
}
