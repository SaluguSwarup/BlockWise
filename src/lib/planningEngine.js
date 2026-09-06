/**
 * BlockWise — Automatic Block Planning Engine (MOCK / RULE-BASED)
 *
 * This is deliberately a transparent, deterministic scoring + merging model that
 * stands in for the AI/ML service. It reads the same mock data the rest of the UI
 * reads, so every number shown in the optimised plan is genuinely derived from
 * the requests, the track health and the Control Office windows.
 *
 * When the real service is plugged in, only the two exported entry points
 * (scoreRequest and runPlanner) need to be swapped for API calls — the UI
 * consumes their output shape and nothing else.
 */

import { CRITICALITY_WEIGHT, URGENCY_WEIGHT, SAFETY_WEIGHT } from '../data/blockRequests.js';
import { TRACK_BY_ID } from '../data/tracks.js';
import { getWindowsForSection, trainsInWindow, GOODS_FORECAST } from '../data/trains.js';
import { toMinutes, fromMinutes, windowLength, formatDate } from './format.js';

/* ------------------------------------------------------------------ */
/* 1. AI PRIORITISATION                                                */
/* ------------------------------------------------------------------ */

const FACTOR_WEIGHTS = [
  { key: 'criticality', label: 'Criticality of activity', weight: 0.24 },
  { key: 'urgency', label: 'Urgency raised by department', weight: 0.20 },
  { key: 'safety', label: 'Safety impact', weight: 0.16 },
  { key: 'health', label: 'Asset health deficit', weight: 0.14 },
  { key: 'overdue', label: 'Overdue status', weight: 0.14 },
  { key: 'availability', label: 'Impact on asset availability', weight: 0.12 },
];

export function priorityBand(score) {
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Returns { score, band, factors[] } for one block request.
 * factors carry their raw value, weight and contribution so the UI can show the
 * reasoning instead of an unexplained number.
 */
export function scoreRequest(request) {
  const track = TRACK_BY_ID[request.section];
  const raw = {
    criticality: CRITICALITY_WEIGHT[request.criticality] ?? 40,
    urgency: URGENCY_WEIGHT[request.urgency] ?? 40,
    safety: SAFETY_WEIGHT[request.safetyImpact] ?? 40,
    health: track ? 100 - track.health : 40,
    overdue: Math.min(100, (request.overdueDays || 0) * 4.5),
    availability: request.assetImpact ?? 40,
  };

  const notes = {
    criticality: `${request.criticality} activity as classified by ${request.system}`,
    urgency: `${request.urgency} — raised by ${request.requestedBy}`,
    safety: `${request.safetyImpact} safety consequence if deferred`,
    health: track ? `Section health ${track.health}% (deficit ${100 - track.health} pts)` : 'Section health unavailable',
    overdue: request.overdueDays ? `Overdue by ${request.overdueDays} days` : 'Within schedule',
    availability: `${request.assetImpact}/100 — ${request.assetImpactNote}`,
  };

  const factors = FACTOR_WEIGHTS.map((f) => ({
    key: f.key,
    label: f.label,
    weight: f.weight,
    value: Math.round(raw[f.key]),
    contribution: +(raw[f.key] * f.weight).toFixed(1),
    note: notes[f.key],
  }));

  const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0));
  return { score, band: priorityBand(score), factors };
}

/* ------------------------------------------------------------------ */
/* 2. TRAIN-OPERATION IMPACT OF A WINDOW                               */
/* ------------------------------------------------------------------ */

const TRAIN_WEIGHT = { EXPRESS: 4, PASSENGER: 3, GOODS: 1.5 };

export function evaluateWindow(sectionId, corridorId, win, requiredMin) {
  const capacity = windowLength(win.start, win.end);
  const fits = capacity >= requiredMin;

  // Trains are counted over the period the block would actually occupy — the
  // block starts at the top of the window and runs for its own duration, not
  // for the whole window. Counting the occupancy (rather than the window) keeps
  // the "before" and "after" figures measured the same way.
  const occupancyMin = Math.min(requiredMin, capacity);
  const occupancyEnd = fromMinutes(toMinutes(win.start) + occupancyMin);
  const trains = trainsInWindow(corridorId, win.start, occupancyEnd);

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

export function rankWindows(sectionId, corridorId, requiredMin) {
  const windows = getWindowsForSection(sectionId, corridorId);
  return windows
    .map((w) => evaluateWindow(sectionId, corridorId, w, requiredMin))
    .sort((a, b) => a.disruption - b.disruption);
}

/* ------------------------------------------------------------------ */
/* 3. MULTI-DEPARTMENT MERGING + SCHEDULING                            */
/* ------------------------------------------------------------------ */

/** Extra minutes added per additional department for handover / safety clearance. */
const COORDINATION_MARGIN_MIN = 10;

const DEPT_ORDER = { ENGG: 0, TRD: 1, SNT: 2 };

function makeClusters(requests) {
  const groups = new Map();
  requests.forEach((r) => {
    const key = `${r.section}__${r.requestedDate}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  });

  const clusters = [];
  groups.forEach((items, key) => {
    const [section, date] = key.split('__');
    const exclusive = items.filter((r) => r.compatibility === 'EXCLUSIVE');
    const compatible = items.filter((r) => r.compatibility !== 'EXCLUSIVE');
    if (compatible.length) clusters.push({ section, date, requests: compatible, merged: compatible.length > 1 });
    exclusive.forEach((r) => clusters.push({ section, date, requests: [r], merged: false, exclusive: true }));
  });

  return clusters.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.section.localeCompare(b.section)));
}

/**
 * Runs the full optimisation over the selected requests.
 * Returns { blocks, metrics, clusters, unplanned }.
 */
export function runPlanner(selectedRequests) {
  const scored = selectedRequests.map((r) => ({ ...r, ai: scoreRequest(r) }));
  const clusters = makeClusters(scored);
  const blocks = [];

  clusters.forEach((cluster) => {
    const track = TRACK_BY_ID[cluster.section];
    const reqs = [...cluster.requests].sort(
      (a, b) => (DEPT_ORDER[a.dept] ?? 9) - (DEPT_ORDER[b.dept] ?? 9),
    );

    const serialMin = reqs.reduce((s, r) => s + r.durationMin, 0);
    const longest = Math.max(...reqs.map((r) => r.durationMin));
    const optimisedMin = reqs.length > 1 ? longest + COORDINATION_MARGIN_MIN * (reqs.length - 1) : longest;

    const ranked = rankWindows(cluster.section, track.corridor, optimisedMin);
    const chosen = ranked.find((w) => w.fits) || ranked[0];

    const startMin = toMinutes(chosen.start);
    const start = chosen.start;
    const end = fromMinutes(startMin + optimisedMin);

    const topScore = Math.max(...reqs.map((r) => r.ai.score));
    const leadRequest = reqs.find((r) => r.ai.score === topScore);

    // Baseline: every department takes its own block in its own requested
    // window, so each request disrupts the paths inside that window separately.
    const baselineTrains = reqs.reduce(
      (sum, r) => sum + trainsInWindow(track.corridor, r.requestedStart, r.requestedEnd).length,
      0,
    );

    const overrunMin = Math.max(0, optimisedMin - chosen.capacityMin);

    const reasoning = [];
    if (reqs.length > 1) {
      reasoning.push({
        type: 'MERGE',
        text: `${reqs.length} departmental requests on ${cluster.section} for ${formatDate(cluster.date)} are compatible and have been merged into a single corridor block. Serial working would have needed ${Math.round(serialMin / 60 * 10) / 10} hr; coordinated working needs ${Math.round(optimisedMin / 60 * 10) / 10} hr.`,
      });
    } else if (cluster.exclusive) {
      reasoning.push({
        type: 'EXCLUSIVE',
        text: `${reqs[0].id} requires sole occupation (${reqs[0].exclusiveReason}) and has been kept as a stand-alone block.`,
      });
    } else {
      reasoning.push({ type: 'SINGLE', text: `No other departmental demand exists on ${cluster.section} for ${formatDate(cluster.date)}; scheduled as a stand-alone block.` });
    }

    reasoning.push({
      type: 'PRIORITY',
      text: `Block priority driven by ${leadRequest.id} (${leadRequest.dept}) with an AI priority score of ${topScore}/100 — ${leadRequest.criticality} criticality, ${leadRequest.urgency} urgency, section health ${track.health}%.`,
    });

    reasoning.push({
      type: 'WINDOW',
      text: `Window ${chosen.start}–${chosen.end} selected from ${ranked.length} Control Office windows: lowest operational disruption index (${chosen.disruption}) with ${chosen.trainsAffected} train paths in the window. ${chosen.note}`,
    });

    const rejectedWindow = ranked.find((w) => w.id !== chosen.id);
    if (rejectedWindow) {
      reasoning.push({
        type: 'ALTERNATIVE',
        text: `Next-best window ${rejectedWindow.start}–${rejectedWindow.end} rejected — disruption index ${rejectedWindow.disruption} (${rejectedWindow.counts.express} express, ${rejectedWindow.counts.passenger} passenger, ${rejectedWindow.counts.goods} goods paths).`,
      });
    }

    if (overrunMin > 0) {
      reasoning.push({
        type: 'EXTENDED',
        text: `No published window is long enough for ${Math.round(optimisedMin / 60 * 10) / 10} hr of work. Window ${chosen.start}–${chosen.end} has been extended by ${overrunMin} minutes — the Control Office must regulate the paths immediately following the window.`,
      });
    }

    const forecast = GOODS_FORECAST[track.corridor];
    if (forecast) {
      reasoning.push({
        type: 'GOODS',
        text: `Goods forecast for ${track.corridor}: ${forecast.rakesPerNight} rakes/night (${forecast.tonnage}), peak ${forecast.peakHours}. ${chosen.counts.goods} rakes to be regulated or looped during this block.`,
      });
    }

    blocks.push({
      id: null, // assigned after the plan is sorted, so IDs read in date order
      date: cluster.date,
      section: cluster.section,
      sectionName: track.name,
      corridor: track.corridor,
      start,
      end,
      durationMin: optimisedMin,
      serialMin,
      savedMin: serialMin - optimisedMin,
      depts: [...new Set(reqs.map((r) => r.dept))],
      tasks: reqs.map((r) => ({
        dept: r.dept,
        activity: r.activity,
        requestId: r.id,
        durationMin: r.durationMin,
        score: r.ai.score,
        band: r.ai.band,
      })),
      priority: priorityBand(topScore),
      priorityScore: topScore,
      leadRequestId: leadRequest.id,
      trains: chosen.counts,
      trainsAffected: chosen.trainsAffected,
      baselineTrainsAffected: baselineTrains,
      assetHealth: track.health,
      assetAvailability: track.assetAvailability,
      window: chosen,
      alternatives: ranked,
      reasoning,
      merged: reqs.length > 1,
      exclusive: !!cluster.exclusive,
      overrunMin,
      impact: describeImpact(chosen, overrunMin),
      state: 'PROPOSED',
      source: 'AI-OPTIMISED',
    });
  });

  blocks.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : toMinutes(a.start) - toMinutes(b.start)));
  blocks.forEach((b, i) => { b.id = `BLK-AI-${String(i + 1).padStart(3, '0')}`; });

  return { blocks, metrics: computeMetrics(scored, blocks), clusters };
}

function describeImpact(win, overrunMin = 0) {
  if (overrunMin > 0) return 'Extended block — following paths to be regulated';
  if (win.disruption < 25) return 'Low — minimal path regulation required';
  if (win.disruption < 45) return 'Moderate — goods rakes to be looped';
  if (win.disruption < 70) return 'Elevated — express paths need regulation';
  return 'High — traffic diversion required';
}

/* ------------------------------------------------------------------ */
/* 4. OPTIMISATION METRICS (BEFORE vs AFTER)                           */
/* ------------------------------------------------------------------ */

export function computeMetrics(scoredRequests, blocks) {
  const beforeMin = scoredRequests.reduce((s, r) => s + r.durationMin, 0);
  const afterMin = blocks.reduce((s, b) => s + b.durationMin, 0);
  const savedMin = beforeMin - afterMin;

  const beforeTrains = blocks.reduce((s, b) => s + b.baselineTrainsAffected, 0);
  const afterTrains = blocks.reduce((s, b) => s + b.trainsAffected, 0);

  const mergedBlocks = blocks.filter((b) => b.merged);
  const combinedActivities = mergedBlocks.reduce((s, b) => s + b.tasks.length, 0);

  const sections = new Set(blocks.map((b) => b.section));
  const downtimeReduction = beforeMin ? (savedMin / beforeMin) * 100 : 0;
  // Availability gain expressed against the total section-time in the planning horizon.
  const horizonMin = sections.size * 24 * 60;
  const availabilityGain = horizonMin ? (savedMin / horizonMin) * 100 : 0;

  const bands = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  scoredRequests.forEach((r) => { bands[r.ai.band] += 1; });

  const deptCount = { ENGG: 0, SNT: 0, TRD: 0 };
  scoredRequests.forEach((r) => { deptCount[r.dept] += 1; });

  return {
    totalRequests: scoredRequests.length,
    blocksBefore: scoredRequests.length,
    blocksAfter: blocks.length,
    blocksSaved: scoredRequests.length - blocks.length,
    beforeMin,
    afterMin,
    savedMin,
    beforeHours: +(beforeMin / 60).toFixed(1),
    afterHours: +(afterMin / 60).toFixed(1),
    savedHours: +(savedMin / 60).toFixed(1),
    downtimeReduction: +downtimeReduction.toFixed(1),
    availabilityGain: +availabilityGain.toFixed(1),
    beforeTrains,
    afterTrains,
    trainsProtected: Math.max(0, beforeTrains - afterTrains),
    mergedBlocks: mergedBlocks.length,
    combinedActivities,
    sectionsCovered: sections.size,
    bands,
    deptCount,
    utilisationBefore: beforeMin ? Math.round((beforeMin / (scoredRequests.length * 240)) * 100) : 0,
    utilisationAfter: afterMin ? Math.round((beforeMin / (blocks.length * 240)) * 100) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* 5. ENGINE STAGES (used for the run animation)                       */
/* ------------------------------------------------------------------ */

export const ENGINE_STAGES = [
  { id: 1, title: 'Collecting maintenance requirements', source: 'BDMS', detail: (c) => `${c.requests} block requests pulled across ${c.sections} sections and ${c.depts} departments` },
  { id: 2, title: 'Reading asset health', source: 'TMS / SMMS / TDMS', detail: (c) => `Track, signalling and traction health indices read for ${c.sections} sections — ${c.criticalSections} below the ${c.threshold}% health threshold` },
  { id: 3, title: 'Evaluating criticality & urgency', source: 'AI Prioritisation Model', detail: (c) => `${c.critical} CRITICAL and ${c.high} HIGH priority demands identified` },
  { id: 4, title: 'Reading defects & overdue register', source: 'TMS / SMMS / TDMS', detail: (c) => `${c.defects} open defects and ${c.overdue} overdue maintenance tasks correlated to the requests` },
  { id: 5, title: 'Checking corridor availability', source: 'COA', detail: (c) => `${c.windows} block windows published by the Control Office evaluated` },
  { id: 6, title: 'Checking passenger train timetable', source: 'Working Time Table', detail: (c) => `Express and passenger paths mapped against every candidate window` },
  { id: 7, title: 'Checking goods train forecast', source: 'COA Freight Forecast', detail: (c) => `${c.goodsRakes} goods rakes forecast across ${c.corridors} corridors for the planning horizon` },
  { id: 8, title: 'Detecting overlapping maintenance opportunities', source: 'Coordination Model', detail: (c) => `${c.mergeGroups} section-date groups found where multiple departments can share one block` },
  { id: 9, title: 'Coordinating Engineering / Signalling / Traction work', source: 'Coordination Model', detail: (c) => `${c.combined} departmental activities combined into ${c.mergedBlocks} joint blocks` },
  { id: 10, title: 'Assigning priorities & generating optimised plan', source: 'Optimiser', detail: (c) => `${c.blocks} optimised blocks generated — ${c.savedHours} hr of block time released` },
];

/** Builds the substitution context used by the stage detail strings. */
export function buildStageContext(selectedRequests, result) {
  const sections = new Set(selectedRequests.map((r) => r.section));
  const corridors = new Set(result.blocks.map((b) => b.corridor));
  const depts = new Set(selectedRequests.map((r) => r.dept));
  const scored = selectedRequests.map((r) => scoreRequest(r));
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
    requests: selectedRequests.length,
    sections: sections.size,
    corridors: corridors.size || 1,
    depts: depts.size,
    threshold: 75,
    criticalSections,
    critical: scored.filter((s) => s.band === 'CRITICAL').length,
    high: scored.filter((s) => s.band === 'HIGH').length,
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
