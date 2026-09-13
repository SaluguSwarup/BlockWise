import { lazy } from 'react';
import { DEV_VIEWS_ENABLED } from './flag.js';

/**
 * The single integration point App.jsx needs for the dev views (R6) — this is the "one line"
 * (in practice, one import plus one map over this array) that App.jsx gains, then this file and
 * flag.js are frozen for that purpose. Team A and Team C only ever touch their own view files
 * under team-a/ and team-c/.
 *
 * DEV_ROUTES is built as an EMPTY array, not merely hidden, when dev views are disabled — that
 * lets Vite's dead-code elimination remove the dynamic imports (and their chunks) from a
 * production build entirely. See the verification step that greps dist/ for these views.
 */
export const DEV_ROUTES = DEV_VIEWS_ENABLED
  ? [
      { path: '/dev/data', Component: lazy(() => import('./team-a/DataDevView.jsx')) },
      { path: '/dev/planner', Component: lazy(() => import('./team-c/PlannerDevView.jsx')) },
    ]
  : [];
