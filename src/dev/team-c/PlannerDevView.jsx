/**
 * /dev/planner — Team C's development view (R6 shell; C4/C8/C11 build the real proof material
 * on Day 1-3).
 *
 * Runs the extracted engine (@blockwise/engine) on a sample PlanningInput built from today's
 * data, and shows the four stages BlockWise.md calls for as distinct, not one opaque run:
 *   1. scoring input   2. scoring output (scorerStatus printed verbatim)
 *   3. optimiser input 4. optimiser output
 * This is the visible proof that the R4 scorer/optimiser boundary is real.
 *
 * Team C's folder alone — nobody else edits this file (see docs/ownership.md).
 */
import { useMemo } from 'react';
import { toScoringInput, scorePlaceholder, optimise, computeMetrics } from '@blockwise/engine';
import { BLOCK_REQUESTS } from '../../data/blockRequests.js';
import { buildPlanningInputFromRequests } from '../../lib/planningInput.js';

function Stage({ n, title, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8fa3b8', marginBottom: 8 }}>
        Stage {n} — {title}
      </h2>
      <pre style={{ background: '#161b22', padding: 12, borderRadius: 6, overflowX: 'auto', fontSize: 12, maxHeight: 260 }}>
        {children}
      </pre>
    </section>
  );
}

export default function PlannerDevView() {
  const run = useMemo(() => {
    // Runs the engine over every block request in the fixture dataset — the same thing the
    // planning screen does when everything is selected. Not a new scenario: this is Team C's
    // own scenario library (C1) to build out on Day 1; this view just needs something to show.
    const planningInput = buildPlanningInputFromRequests(BLOCK_REQUESTS);
    const scoringInput = toScoringInput(planningInput);
    const scoringOutput = scorePlaceholder(scoringInput);
    const scoreByRequestId = new Map(scoringOutput.scores.map((s) => [s.requestId, s]));
    const scoredRequests = planningInput.requests.map((r) => ({ ...r, __score: scoreByRequestId.get(r.id) }));
    const { blocks } = optimise(scoredRequests, planningInput);
    const metrics = computeMetrics(scoredRequests, blocks);
    return { planningInput, scoringInput, scoringOutput, blocks, metrics };
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#e8edf2', background: '#0d1117', borderRadius: 8 }}>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>/dev/planner — Team C</h1>
      <p style={{ color: '#8fa3b8', fontSize: 13, marginBottom: 20 }}>
        Development-only view (excluded from production builds). Every response below declares
        <code> scorerStatus</code> — this is a deterministic placeholder, not a trained ML model.
        <code> confidence</code> is reserved for a future model and is <code>null</code> here.
      </p>

      <Stage n={1} title="Scoring input">
        {`${run.scoringInput.requests.length} requests · ${run.scoringInput.sections.length} sections\n\n` +
          JSON.stringify(run.scoringInput.requests.slice(0, 2), null, 2)}
      </Stage>

      <Stage n={2} title="Scoring output (scorerStatus verbatim)">
        {JSON.stringify(
          { scorerStatus: run.scoringOutput.scorerStatus, scores: run.scoringOutput.scores.slice(0, 2), unscored: run.scoringOutput.unscored },
          null, 2,
        )}
      </Stage>

      <Stage n={3} title="Optimiser input (scored requests + windows + resources)">
        {`${run.planningInput.windows.length} candidate windows across ${run.planningInput.sections.length} sections\n\n` +
          JSON.stringify(run.planningInput.requests.slice(0, 1).map((r) => ({ ...r, priority: run.scoringOutput.scores.find((s) => s.requestId === r.id)?.priority })), null, 2)}
      </Stage>

      <Stage n={4} title={`Optimiser output — ${run.blocks.length} blocks, ${run.metrics.savedHours} hr saved`}>
        {JSON.stringify(run.blocks.map((b) => ({
          id: b.id, section: b.section, depts: b.depts, merged: b.merged,
          start: b.start, end: b.end, savedMin: b.savedMin, priority: b.priority,
        })), null, 2)}
      </Stage>
    </div>
  );
}
