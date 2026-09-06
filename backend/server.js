/**
 * BlockWise API — service skeleton.
 *
 * The block-planning logic currently runs client-side in the SPA
 * (src/lib/planningEngine.js). This service exists so the two-tier
 * architecture and the deployment pipeline are in place from day one:
 * when the real AI / optimisation service is built, it slots in behind
 * POST /api/plan and the frontend just points VITE_API_URL here.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN }));

const info = { service: 'blockwise-api', version: '0.1.0' };

app.get('/', (_req, res) => {
  res.json({ status: 'ok', ...info, ts: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ...info, ts: new Date().toISOString() });
});

app.get('/api/version', (_req, res) => {
  res.json(info);
});

/**
 * Stub — the real optimiser plugs in here. It should accept the selected
 * block requests and return the { blocks, metrics, clusters } shape that
 * runPlanner() produces today.
 */
app.post('/api/plan', (_req, res) => {
  res.status(501).json({
    error: 'not_implemented',
    note:
      'Planning currently runs client-side in the SPA. This endpoint is the integration point for the real optimiser.',
  });
});

app.listen(PORT, () => {
  console.log(`blockwise-api listening on :${PORT} (CORS origin: ${FRONTEND_ORIGIN})`);
});
