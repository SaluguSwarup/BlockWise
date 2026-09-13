/**
 * /dev/data — Team A's development view (R6 shell; A3/A7/A11 build the real thing on Day 1-3).
 *
 * Shows the API base URL, /health reachability, and per-entity record counts read through the
 * same app state every other screen uses — proving, once A1-A3 exist, that this view reads the
 * real database through the real API rather than bypassing it. Until then it is explicitly
 * labelled as reading the Day-0 fixture dataset.
 *
 * Team A's folder alone — nobody else edits this file (see docs/ownership.md).
 */
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppState.jsx';
import { API_URL, pingBackend } from '../../lib/api.js';

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2a2f38' }}>
      <span style={{ color: '#8fa3b8' }}>{label}</span>
      <span style={{ fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

export default function DataDevView() {
  const { tracks, requests, tickets, planBlocks } = useApp();
  const [health, setHealth] = useState({ ok: false, reason: 'checking…' });

  useEffect(() => {
    let cancelled = false;
    pingBackend().then((res) => { if (!cancelled) setHealth(res); });
    return () => { cancelled = true; };
  }, []);

  const defectCount = tracks.reduce((s, t) => s + (t.defects?.length || 0), 0);
  const overdueCount = tracks.reduce((s, t) => s + (t.overdue?.length || 0), 0);

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#e8edf2', background: '#0d1117', borderRadius: 8 }}>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>/dev/data — Team A</h1>
      <p style={{ color: '#8fa3b8', fontSize: 13, marginBottom: 20 }}>
        Development-only view (excluded from production builds). Record counts below come from the
        Pre-Day-1 fixture dataset — A1/A2/A3 replace this with the real database and live API on Day 1.
      </p>

      <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8fa3b8', marginBottom: 8 }}>Backend connectivity</h2>
      <Row label="API base URL" value={API_URL || '(not configured — VITE_API_URL unset)'} />
      <Row label="/health" value={health.ok ? 'reachable' : `unreachable (${health.reason || 'n/a'})`} />

      <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8fa3b8', margin: '20px 0 8px' }}>Record counts (Day-0 fixture)</h2>
      <Row label="Sections" value={tracks.length} />
      <Row label="Defects" value={defectCount} />
      <Row label="Overdue items" value={overdueCount} />
      <Row label="Block requests" value={requests.length} />
      <Row label="Inspection tickets" value={tickets.length} />
      <Row label="Blocks (sanctioned + optimised)" value={planBlocks.length} />

      <h2 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8fa3b8', margin: '20px 0 8px' }}>Sections</h2>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {tracks.map((t) => (
          <Row key={t.id} label={`${t.id} — ${t.name}`} value={`health ${t.health}%`} />
        ))}
      </div>
    </div>
  );
}
