/**
 * Team C's API module — the real planning and optimisation engine, exposed over HTTP.
 *
 * POST /api/plan stays a 501 stub through Pre-Day-1 (moved here unchanged from the old
 * server.js) — C7 (Day 2) is what wires @blockwise/engine's runPlan() behind this route.
 * Wiring the engine in now would be doing Team C's Day-1/2 work; R5's job is only to give Team C
 * its own module so that work never requires editing server.js. See docs/ownership.md.
 *
 * POST /api/ml/score (the scoring interface over HTTP, internal to Team C — not for Team B)
 * mounts here too, alongside C7 on Day 2.
 */
import express from 'express';
import { fail } from '../../lib/envelope.js';

const router = express.Router();

router.post('/plan', (_req, res) => {
  res.status(501).json(fail(
    'NOT_IMPLEMENTED',
    'Planning currently runs against a frozen fixture in the SPA (src/mocks/plan.json). This endpoint is the integration point for the real optimiser — see C7 in BlockWise.md.',
  ));
});

export default router;
