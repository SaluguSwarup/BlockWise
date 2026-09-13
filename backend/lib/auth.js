/**
 * Authentication placeholder — R5.
 *
 * This is the auth placeholder "in its final shape" that BlockWise.md's R5 calls for: Team A
 * and Team C can protect their routes with requireAuth/requireRole from Day 1, and Team B
 * replaces verifyToken() with real session verification in B2 without any other module changing.
 *
 * Pre-Day-1 default: one documented development token maps to an ADMIN identity. This is not
 * real authentication — it exists only so routes can be protected before B2 exists.
 */
import { fail } from './envelope.js';

const DEV_TOKEN = process.env.BLOCKWISE_DEV_TOKEN || 'dev-any-team';

export const DEV_TOKEN_NOTE =
  `Pre-Day-1 dev token: set "Authorization: Bearer ${DEV_TOKEN}" (override with env var ` +
  'BLOCKWISE_DEV_TOKEN). Replaced by real sessions in B2 — see docs/ownership.md.';

/**
 * Verifies a bearer token and returns { userId, role } or null.
 * Team B replaces this function's body in B2; requireAuth/requireRole below never change.
 */
export function verifyToken(token) {
  if (token && token === DEV_TOKEN) {
    return { userId: 'dev', role: 'ADMIN' };
  }
  return null;
}

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  return match ? match[1] : null;
}

/** Express middleware — 401s without a valid bearer token, else sets req.user. */
export function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return res.status(401).json(fail('UNAUTHORIZED', 'Missing or invalid bearer token'));
  }
  req.user = user;
  next();
}

/** Express middleware factory — 403s if the authenticated user does not hold `role`. */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(fail('UNAUTHORIZED', 'Missing or invalid bearer token'));
    }
    if (req.user.role !== role) {
      return res.status(403).json(fail('FORBIDDEN', `This route requires the ${role} role`));
    }
    next();
  };
}
