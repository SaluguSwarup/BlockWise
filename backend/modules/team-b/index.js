/**
 * Team B's server-side foothold — real authentication (B2).
 *
 * Team B's own area inside the backend (see R1/docs/ownership.md: Team B needs a server-side
 * place to issue auth tokens). The route shapes below are placeholders that return 501; B2
 * (Day 1) replaces the handler bodies with real credential checking and session issuance,
 * without touching backend/lib/auth.js's requireAuth/requireRole contract used by A and C.
 */
import express from 'express';
import { fail } from '../../lib/envelope.js';

const router = express.Router();

router.post('/auth/login', (_req, res) => {
  res.status(501).json(fail('NOT_IMPLEMENTED', 'Real authentication is Team B’s Day-1 work (B2).'));
});

router.post('/auth/logout', (_req, res) => {
  res.status(501).json(fail('NOT_IMPLEMENTED', 'Real authentication is Team B’s Day-1 work (B2).'));
});

export default router;
