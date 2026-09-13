/**
 * BlockWise API — integrator-owned shell (R5).
 *
 * This file is frozen: adding a team's API area means adding backend/modules/<team>/index.js,
 * never editing this file. See backend/lib/registerModules.js and docs/ownership.md.
 *
 * The block-planning logic currently runs against a frozen fixture in the SPA
 * (src/mocks/plan.json). This service exists so the two-tier architecture and the deployment
 * pipeline are in place from day one: when the real engine is wired in (C7), it slots in behind
 * POST /api/plan (backend/modules/team-c/) and the frontend just points VITE_API_URL here.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { ok } from './lib/envelope.js';
import { registerModules } from './lib/registerModules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN }));

const info = { service: 'blockwise-api', version: '0.1.0' };

/** Current time as UTC ISO plus a human-readable IST string. */
function clock() {
  const d = new Date();
  return {
    epoch: d.getTime(),
    iso: d.toISOString(),
    ist: d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }),
  };
}

app.get('/', (_req, res) => {
  res.json({ status: 'ok', ...info, time: clock() });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ...info, time: clock() });
});

app.get('/api/version', (_req, res) => {
  res.json(ok(info));
});

/** Server time — used by the frontend to prove the API is reachable. */
app.get('/api/time', (_req, res) => {
  res.json(ok({ ...info, time: clock() }));
});

/** Which team modules are mounted — exposed for /dev/data's reachability check and for tests. */
let mountedModules = [];
export async function ready() {
  mountedModules = await registerModules(app, path.join(__dirname, 'modules'));
  return mountedModules;
}
app.get('/api/_modules', (_req, res) => {
  res.json(ok({ mounted: mountedModules }));
});

// Only bind a port when run directly (`node server.js`), never when imported by tests.
const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isMain) {
  ready().then((mounted) => {
    app.listen(PORT, () => {
      console.log(`blockwise-api listening on :${PORT} (CORS origin: ${FRONTEND_ORIGIN})`);
      console.log(`Mounted modules: ${mounted.join(', ') || '(none yet)'}`);
    });
  });
}
