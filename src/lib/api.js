/**
 * Thin client for the BlockWise API (backend/).
 *
 * Nothing in the UI depends on the backend yet — the planning engine runs
 * client-side. This module is the seam: set VITE_API_URL at build time and
 * start calling the service when the real endpoints exist.
 */

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Quick reachability check against the backend's /health endpoint. */
export async function pingBackend() {
  if (!API_URL) return { ok: false, reason: 'VITE_API_URL not configured' };
  try {
    const res = await fetch(`${API_URL}/health`);
    return { ok: res.ok, data: res.ok ? await res.json() : null };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

/** Server time from the backend — returns { epoch, iso, ist } on success. */
export async function getServerTime() {
  if (!API_URL) return { ok: false, reason: 'VITE_API_URL not configured' };
  try {
    const res = await fetch(`${API_URL}/api/time`);
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const body = await res.json();
    return { ok: true, data: body.time };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}
