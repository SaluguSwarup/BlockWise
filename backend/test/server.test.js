import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, ready } from '../server.js';
import { isEnvelope } from '@blockwise/contracts';

describe('backend shell (R5)', () => {
  let mounted;

  beforeAll(async () => {
    mounted = await ready();
  });

  it('/health responds 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('/api/version responds in the contract envelope', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(isEnvelope(res.body)).toBe(true);
    expect(res.body.ok).toBe(true);
  });

  it('auto-mounts all three team modules without server.js listing them', async () => {
    expect(mounted.sort()).toEqual(['team-a', 'team-b', 'team-c']);
  });

  it('POST /api/plan is still a 501 stub (C7 has not shipped yet)', async () => {
    const res = await request(app).post('/api/plan').send({});
    expect(res.status).toBe(501);
    expect(res.body.ok).toBe(false);
  });

  it('requireAuth 401s without a bearer token, and accepts the documented dev token', async () => {
    const { requireAuth } = await import('../lib/auth.js');
    const express = (await import('express')).default;
    const testApp = express();
    testApp.get('/protected', requireAuth, (req, res) => res.json({ ok: true, user: req.user }));

    const noAuth = await request(testApp).get('/protected');
    expect(noAuth.status).toBe(401);

    const withAuth = await request(testApp).get('/protected').set('Authorization', 'Bearer dev-any-team');
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.user.role).toBe('ADMIN');
  });
});
