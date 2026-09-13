/**
 * Presentation-only stage list and substitution context for the planning-run animation on
 * PlanningEnginePage. NOT part of the engine (packages/engine) — this reads numbers off an
 * already-produced PlanningOutput (the canned fixture, until B7 switches to the real
 * POST /api/plan on Day 3) rather than recomputing anything, and lives in Team B's area.
 *
 * Moved here from the old src/lib/planningEngine.js (ENGINE_STAGES / buildStageContext) as part
 * of R4's extraction — see packages/engine/README.md.
 */
import { TRACK_BY_ID } from '../data/tracks.js';
import { GOODS_FORECAST } from '../data/trains.js';

export const ENGINE_STAGES = [
  { id: 1, title: 'Collecting maintenance requirements', source: 'BDMS', detail: (c) => `${c.requests} block requests pulled across ${c.sections} sections and ${c.depts} departments` },
  { id: 2, title: 'Reading asset health', source: 'TMS / SMMS / TDMS', detail: (c) => `Track, signalling and traction health indices read for ${c.sections} sections — ${c.criticalSections} below the ${c.threshold}% health threshold` },
  { id: 3, title: 'Evaluating criticality & urgency', source: 'Placeholder scoring stage', detail: (c) => `${c.critical} CRITICAL and ${c.high} HIGH priority demands identified — deterministic placeholder, not a trained model` },
  { id: 4, title: 'Reading defects & overdue register', source: 'TMS / SMMS / TDMS', detail: (c) => `${c.defects} open defects and ${c.overdue} overdue maintenance tasks correlated to the requests` },
  { id: 5, title: 'Checking corridor availability', source: 'COA', detail: (c) => `${c.windows} block windows published by the Control Office evaluated` },
  { id: 6, title: 'Checking passenger train timetable', source: 'Working Time Table', detail: () => `Express and passenger paths mapped against every candidate window` },
  { id: 7, title: 'Checking goods train forecast', source: 'COA Freight Forecast', detail: (c) => `${c.goodsRakes} goods rakes forecast across ${c.corridors} corridors for the planning horizon` },
  { id: 8, title: 'Detecting overlapping maintenance opportunities', source: 'Optimiser', detail: (c) => `${c.mergeGroups} section-date groups found where multiple departments can share one block` },
  { id: 9, title: 'Coordinating Engineering / Signalling / Traction work', source: 'Optimiser', detail: (c) => `${c.combined} departmental activities combined into ${c.mergedBlocks} joint blocks` },
  { id: 10, title: 'Assigning priorities & generating optimised plan', source: 'Optimiser', detail: (c) => `${c.blocks} optimised blocks generated — ${c.savedHours} hr of block time released` },
];

/** Builds the substitution context used by the stage detail strings, from a PlanningOutput. */
export function buildStageContext(result) {
  const sections = new Set(result.blocks.map((b) => b.section));
  const corridors = new Set(result.blocks.map((b) => b.corridor));
  const depts = new Set(result.blocks.flatMap((b) => b.depts));

  let defects = 0;
  let overdue = 0;
  let criticalSections = 0;
  sections.forEach((s) => {
    const t = TRACK_BY_ID[s];
    if (!t) return;
    defects += t.defects.length;
    overdue += t.overdue.length;
    if (t.health < 75) criticalSections += 1;
  });
  const goodsRakes = [...corridors].reduce((sum, c) => sum + (GOODS_FORECAST[c]?.rakesPerNight || 0), 0);

  return {
    requests: result.scores.length,
    sections: sections.size,
    corridors: corridors.size || 1,
    depts: depts.size,
    threshold: 75,
    criticalSections,
    critical: result.scores.filter((s) => s.band === 'CRITICAL').length,
    high: result.scores.filter((s) => s.band === 'HIGH').length,
    defects,
    overdue,
    windows: result.blocks.reduce((s, b) => s + b.alternatives.length, 0),
    goodsRakes,
    mergeGroups: result.metrics.mergedBlocks,
    combined: result.metrics.combinedActivities,
    mergedBlocks: result.metrics.mergedBlocks,
    blocks: result.blocks.length,
    savedHours: result.metrics.savedHours,
  };
}
