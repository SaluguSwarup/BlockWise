/**
 * Before/after optimisation metrics — the prototype's existing computeMetrics, carried across
 * unchanged. `scoredRequests[i].__score` is the ScoringOutput score record for that request
 * (see optimiser/index.js), replacing the old `.ai` field.
 */
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
  scoredRequests.forEach((r) => { bands[r.__score.band] += 1; });

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
