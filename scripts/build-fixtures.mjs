#!/usr/bin/env node
/**
 * Regenerates src/mocks/*.json — Team B's frozen fixtures (R3).
 *
 * This script is a RECORDER, not a planner: it reads today's prototype data (src/data/*) and
 * runs the extracted engine (@blockwise/engine) exactly once per fixture, then writes out
 * whatever comes back. It must never add or alter engine behaviour to produce a "nicer" fixture
 * — see packages/engine/README.md and the R3 section of the Pre-Day-1 plan.
 *
 * Run: npm run fixtures (from the repo root). Regenerating twice must produce byte-identical
 * output (the acceptance condition for A2-style reproducibility, applied to B's fixtures).
 *
 * Integrator-owned. Never hand-edit src/mocks/*.json — regenerate instead.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRACKS, ALL_DEFECTS, ALL_OVERDUE } from '../src/data/tracks.js';
import { BLOCK_REQUESTS } from '../src/data/blockRequests.js';
import { INSPECTION_TICKETS } from '../src/data/tickets.js';
import { SANCTIONED_BLOCKS, SOURCE_SYSTEMS } from '../src/data/plans.js';
import { DIVISION, CORRIDORS, STATIONS } from '../src/data/network.js';
import { TIMETABLE, GOODS_FORECAST, CORRIDOR_STATUS } from '../src/data/trains.js';
import { buildPlanningInputFromRequests } from '../src/lib/planningInput.js';
import { runPlan, scorePlaceholder, toScoringInput } from '../packages/engine/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'src', 'mocks');
mkdirSync(OUT_DIR, { recursive: true });

function envelope(data) {
  return { ok: true, data, error: null, meta: { generatedBy: 'scripts/build-fixtures.mjs', frozen: true } };
}

function write(name, content) {
  const file = path.join(OUT_DIR, `${name}.json`);
  writeFileSync(file, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`wrote src/mocks/${name}.json`);
}

/* ---- sections (list) — A3 shape ---- */
const sectionList = TRACKS.map((t) => ({
  id: t.id, trackId: t.trackId, corridor: t.corridor, from: t.from, to: t.to, name: t.name,
  lengthKm: t.lengthKm, chainage: t.chainage, lineConfig: t.lineConfig, sectionalSpeed: t.sectionalSpeed,
  gauge: t.gauge, health: t.health, status: t.status, assetAvailability: t.assetAvailability,
  trainsPerDay: t.trainsPerDay, gmt: t.gmt, inCharge: t.inCharge,
}));
write('sections', envelope(sectionList));

/* ---- network — A3 shape ---- */
write('network', envelope({ division: DIVISION, corridors: CORRIDORS, stations: STATIONS }));

/* ---- section detail (full record, keyed by id) — A4 shape ---- */
const sectionDetail = {};
TRACKS.forEach((t) => { sectionDetail[t.id] = t; });
write('section-detail', envelope(sectionDetail));

/* ---- defects / overdue — A5 shape ---- */
write('defects', envelope(ALL_DEFECTS));
write('overdue', envelope(ALL_OVERDUE));

/* ---- health (per section, no history yet — Group 2 field, A5's to add) ---- */
write('health', envelope(TRACKS.map((t) => ({ section: t.id, health: t.health, history: [] }))));

/* ---- operations — A6 shape ---- */
write('operations', envelope({ timetable: TIMETABLE, goodsForecast: GOODS_FORECAST, corridorStatus: CORRIDOR_STATUS }));

/* ---- requests — with baked priority (ScoringOutput score shape), so B never scores ---- */
const planningInputAll = buildPlanningInputFromRequests(BLOCK_REQUESTS);
const scoringOutput = scorePlaceholder(toScoringInput(planningInputAll));
const scoreByRequestId = new Map(scoringOutput.scores.map((s) => [s.requestId, s]));
const requestsWithPriority = BLOCK_REQUESTS.map((r) => ({ ...r, priority: scoreByRequestId.get(r.id) || null }));
write('requests', envelope(requestsWithPriority));

/* ---- tickets / blocks / sources — A9/A8 shape ---- */
write('tickets', envelope(INSPECTION_TICKETS));
write('blocks', envelope(SANCTIONED_BLOCKS));
write('sources', envelope(SOURCE_SYSTEMS));

/* ---- plan — the one canned PlanningOutput, C7 shape ----
 * Recorded from a real run of the extracted engine over every block request in the fixture
 * dataset (the same thing "select all, run the planner" does in the UI today). If today's
 * prototype produces the flagship SEC-104 three-department merge for this selection, it is here
 * because the engine produced it — not because this script added it. */
const rawPlanOutput = runPlan(planningInputAll);
// planId/generatedAt are run identifiers (Date.now()-based) — meaningless for a frozen fixture
// and would break reproducibility (regenerating twice must be byte-identical, see A2's rule
// applied here). Freezing them is a recording choice about this static snapshot, not an engine
// behaviour change: a live runPlan() call still stamps the real time.
const planOutput = { ...rawPlanOutput, planId: 'PLAN-FIXTURE-DAY0', generatedAt: '2026-09-06T00:00:00.000Z' };
write('plan', envelope(planOutput));

console.log(`\n${TRACKS.length} sections, ${BLOCK_REQUESTS.length} requests, ${planOutput.blocks.length} blocks in the canned plan.`);
const flagship = planOutput.blocks.find((b) => b.section === 'SEC-104' && b.merged);
console.log(flagship
  ? `Flagship merge present: ${flagship.id} on SEC-104 combines ${flagship.depts.join('+')} (${flagship.tasks.length} requests).`
  : 'No multi-department merge produced for this selection — the fixture reflects that honestly.');
