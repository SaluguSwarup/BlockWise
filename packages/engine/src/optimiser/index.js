/**
 * The block optimiser — the prototype's existing makeClusters/runPlanner logic (cluster by
 * section+date, merge compatible departmental work, pick a window, explain the result), carried
 * across unchanged. See packages/engine/README.md for what R4 does and does not change.
 *
 * Boundary: this module receives requests that are ALREADY SCORED (each carries `__score`, the
 * ScoringOutput record for that request — see src/index.js) and never imports from src/scoring/.
 * It reads a score's `priority` value and `band` as given; it never computes or overrides one, and
 * it never reads `scorerStatus`.
 */

import { toMinutes, fromMinutes, formatDate } from './time.js';
import { rankWindows, trainsInWindow } from './windows.js';

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

function describeImpact(win, overrunMin = 0) {
  if (overrunMin > 0) return 'Extended block — following paths to be regulated';
  if (win.disruption < 25) return 'Low — minimal path regulation required';
  if (win.disruption < 45) return 'Moderate — goods rakes to be looped';
  if (win.disruption < 70) return 'Elevated — express paths need regulation';
  return 'High — traffic diversion required';
}

/**
 * Runs the optimisation over already-scored requests.
 * `scoredRequests[i].__score` is the ScoringOutput score record for that request.
 * Returns { blocks, clusters }. Metrics are computed separately (see metrics.js).
 */
export function optimise(scoredRequests, planningInput) {
  const sectionById = new Map((planningInput.sections || []).map((s) => [s.id, s]));
  const windowsBySectionDate = new Map();
  (planningInput.windows || []).forEach((w) => {
    const key = `${w.section}__${w.date}`;
    if (!windowsBySectionDate.has(key)) windowsBySectionDate.set(key, []);
    windowsBySectionDate.get(key).push(w);
  });
  const timetable = planningInput.timetable || {};
  const goodsForecast = planningInput.goodsForecast || {};

  const clusters = makeClusters(scoredRequests);
  const blocks = [];

  clusters.forEach((cluster) => {
    const section = sectionById.get(cluster.section);
    const reqs = [...cluster.requests].sort(
      (a, b) => (DEPT_ORDER[a.dept] ?? 9) - (DEPT_ORDER[b.dept] ?? 9),
    );

    const serialMin = reqs.reduce((s, r) => s + r.durationMin, 0);
    const longest = Math.max(...reqs.map((r) => r.durationMin));
    const optimisedMin = reqs.length > 1 ? longest + COORDINATION_MARGIN_MIN * (reqs.length - 1) : longest;

    const candidateWindows = windowsBySectionDate.get(`${cluster.section}__${cluster.date}`) || [];
    const ranked = rankWindows(candidateWindows, cluster.section, section.corridor, optimisedMin, timetable);
    const chosen = ranked.find((w) => w.fits) || ranked[0];

    const startMin = toMinutes(chosen.start);
    const start = chosen.start;
    const end = fromMinutes(startMin + optimisedMin);

    const topScore = Math.max(...reqs.map((r) => r.__score.priority));
    const leadRequest = reqs.find((r) => r.__score.priority === topScore);

    // Baseline: every department takes its own block in its own requested window, so each
    // request disrupts the paths inside that window separately.
    const baselineTrains = reqs.reduce(
      (sum, r) => sum + trainsInWindow(timetable[section.corridor], r.requestedStart, r.requestedEnd).length,
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
      text: `Block priority driven by ${leadRequest.id} (${leadRequest.dept}) with a priority score of ${topScore}/100 — ${leadRequest.criticality} criticality, ${leadRequest.urgency} urgency, section health ${section.health}%.`,
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

    const forecast = goodsForecast[section.corridor];
    if (forecast) {
      reasoning.push({
        type: 'GOODS',
        text: `Goods forecast for ${section.corridor}: ${forecast.rakesPerNight} rakes/night (${forecast.tonnage}), peak ${forecast.peakHours}. ${chosen.counts.goods} rakes to be regulated or looped during this block.`,
      });
    }

    blocks.push({
      id: null, // assigned after the plan is sorted, so IDs read in date order
      date: cluster.date,
      section: cluster.section,
      sectionName: section.name,
      corridor: section.corridor,
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
        score: r.__score.priority,
        band: r.__score.band,
      })),
      priority: leadRequest.__score.band,
      priorityScore: topScore,
      leadRequestId: leadRequest.id,
      trains: chosen.counts,
      trainsAffected: chosen.trainsAffected,
      baselineTrainsAffected: baselineTrains,
      assetHealth: section.health,
      assetAvailability: section.assetAvailability,
      window: chosen,
      alternatives: ranked,
      reasoning,
      merged: reqs.length > 1,
      exclusive: !!cluster.exclusive,
      overrunMin,
      impact: describeImpact(chosen, overrunMin),
      state: 'PROPOSED',
      source: 'OPTIMISED',
    });
  });

  blocks.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : toMinutes(a.start) - toMinutes(b.start)));
  blocks.forEach((b, i) => { b.id = `BLK-AI-${String(i + 1).padStart(3, '0')}`; });

  return { blocks, clusters };
}
