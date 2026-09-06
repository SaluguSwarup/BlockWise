import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STATION_BY_CODE, STATIONS, CORRIDORS, CORRIDOR_BY_ID, LABEL_OFFSET } from '../../data/network.js';
import { TRACKS, healthBand, TRACK_STATUS, HEALTH_THRESHOLD, HEALTH_CRITICAL_THRESHOLD } from '../../data/tracks.js';
import { HealthValue, Icon } from '../common/UI.jsx';

const VB_W = 1440;
const VB_H = 860;

const RAIL_GAUGE = 3.4;   // half-distance between the two rails
const SLEEPER_HALF = 6.2; // sleeper half-length
const SLEEPER_STEP = 13;  // spacing along the segment

const STATUS_GLOW = {
  [TRACK_STATUS.ACTIVE]: '#43a96f',
  [TRACK_STATUS.UNDER_INSPECTION]: '#4a9fdc',
  [TRACK_STATUS.UNDER_MAINTENANCE]: '#d99a2b',
  [TRACK_STATUS.BLOCKED]: '#9b7fd4',
  [TRACK_STATUS.CRITICAL]: '#d9534f',
};

/** Geometry for one section, derived from its two station nodes. */
function geometry(track) {
  const a = STATION_BY_CODE[track.from];
  const b = STATION_BY_CODE[track.to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  // leave a gap at each station node so the track meets the platform cleanly
  const pad = 15;
  const x1 = a.x + ux * pad;
  const y1 = a.y + uy * pad;
  const x2 = b.x - ux * pad;
  const y2 = b.y - uy * pad;
  return { a, b, dx, dy, len, ux, uy, nx, ny, x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
}

function Sleepers({ g, band }) {
  const usable = Math.hypot(g.x2 - g.x1, g.y2 - g.y1);
  const step = band === 'critical' ? SLEEPER_STEP * 1.5 : band === 'warning' ? SLEEPER_STEP * 1.2 : SLEEPER_STEP;
  const n = Math.max(2, Math.floor(usable / step));
  const items = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    // skip a couple of sleepers around the fracture point on critical sections
    if (band === 'critical' && t > 0.44 && t < 0.56) continue;
    const cx = g.x1 + (g.x2 - g.x1) * t;
    const cy = g.y1 + (g.y2 - g.y1) * t;
    const jitter = band === 'critical' ? (i % 3 === 0 ? 1.6 : 0) : 0;
    items.push(
      <line
        key={i}
        x1={cx + g.nx * (SLEEPER_HALF + jitter)}
        y1={cy + g.ny * (SLEEPER_HALF + jitter)}
        x2={cx - g.nx * (SLEEPER_HALF + jitter)}
        y2={cy - g.ny * (SLEEPER_HALF + jitter)}
        className={`seg-sleeper ${band}`}
      />,
    );
  }
  return <g>{items}</g>;
}

/** Visible fracture symbol drawn at the midpoint of a critical section. */
function BreakMarker({ g }) {
  const { mx, my, nx, ny, ux, uy } = g;
  const p = (along, across) => `${mx + ux * along + nx * across},${my + uy * along + ny * across}`;
  return (
    <g className="status-ico">
      <circle cx={mx} cy={my} r="13" fill="#d9534f" opacity="0.16" className="seg-break-glow" />
      <polyline
        className="seg-break"
        points={`${p(-9, 0)} ${p(-4, -5)} ${p(0, 4)} ${p(4, -5)} ${p(9, 0)}`}
      />
    </g>
  );
}

function StatusMark({ track, g }) {
  const { mx, my } = g;
  if (track.status === TRACK_STATUS.BLOCKED) {
    return (
      <g className="status-ico" transform={`translate(${mx} ${my})`}>
        <rect x="-11" y="-11" width="22" height="22" rx="3" fill="#151b24" stroke="#9b7fd4" strokeWidth="1.4" />
        <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#b49ce4" strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }
  if (track.status === TRACK_STATUS.UNDER_MAINTENANCE) {
    return (
      <g className="status-ico" transform={`translate(${mx} ${my})`}>
        <rect x="-11" y="-11" width="22" height="22" rx="3" fill="#151b24" stroke="#d99a2b" strokeWidth="1.4" />
        <g transform="translate(-6.5,-6.5) scale(0.55)" stroke="#e5ae4c" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4a4.5 4.5 0 0 0-5.9 5.9L3 15.5V21h5.5l5.6-5.6A4.5 4.5 0 0 0 20 9.5l-3 3-2.5-2.5 3-3A4.5 4.5 0 0 0 14.5 4z" />
        </g>
      </g>
    );
  }
  if (track.status === TRACK_STATUS.UNDER_INSPECTION) {
    return (
      <g className="status-ico" transform={`translate(${mx} ${my})`}>
        <circle r="10.5" fill="#151b24" stroke="#4a9fdc" strokeWidth="1.4" />
        <g transform="translate(-5,-5) scale(0.42)" stroke="#6bb6e8" strokeWidth="3" fill="none" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </g>
      </g>
    );
  }
  return null;
}

function Station({ s }) {
  const [ox, oy] = LABEL_OFFSET[s.code] || [0, -24];
  const anchor = ox < -4 ? 'end' : ox > 4 ? 'start' : 'middle';
  const isMajor = s.type === 'terminal';
  return (
    <g>
      {isMajor ? (
        <rect x={s.x - 6} y={s.y - 6} width="12" height="12" rx="2" className="stn-node stn-major" />
      ) : s.type === 'junction' ? (
        <g>
          <circle cx={s.x} cy={s.y} r="6" className="stn-node stn-jn" />
          <circle cx={s.x} cy={s.y} r="2.4" fill="#0b1016" />
        </g>
      ) : (
        <circle cx={s.x} cy={s.y} r="4.4" className="stn-node stn-jn" />
      )}
      <text x={s.x + ox} y={s.y + oy} textAnchor={anchor} className="stn-label">
        {s.code}
        <tspan className="nm" x={s.x + ox} dy="10">{s.name}</tspan>
      </text>
    </g>
  );
}

export default function NetworkMap({
  selectedId, onSelect, highlightId, corridorFilter, onCorridorFilter, issuesOnly, onIssuesOnly,
}) {
  const wrapRef = useRef(null);
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 });
  const [drag, setDrag] = useState(null);
  const [hover, setHover] = useState(null);

  const geos = useMemo(() => TRACKS.map((t) => ({ track: t, g: geometry(t) })), []);

  const isDim = useCallback((t) => {
    if (corridorFilter && t.corridor !== corridorFilter) return true;
    if (issuesOnly && t.health >= HEALTH_THRESHOLD && t.status === TRACK_STATUS.ACTIVE) return true;
    return false;
  }, [corridorFilter, issuesOnly]);

  /* --- zoom to a section when it is searched for --- */
  useEffect(() => {
    if (!highlightId) return;
    const entry = geos.find((e) => e.track.id === highlightId);
    if (!entry) return;
    const k = 2.1;
    setView({ k, tx: VB_W / 2 - entry.g.mx * k, ty: VB_H / 2 - entry.g.my * k });
  }, [highlightId, geos]);

  const zoomBy = (factor) => {
    setView((v) => {
      const k = Math.min(4, Math.max(0.6, v.k * factor));
      const cx = VB_W / 2;
      const cy = VB_H / 2;
      return { k, tx: cx - (cx - v.tx) * (k / v.k), ty: cy - (cy - v.ty) * (k / v.k) };
    });
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * VB_W;
    const vy = ((e.clientY - rect.top) / rect.height) * VB_H;
    setView((v) => {
      const k = Math.min(4, Math.max(0.6, v.k * (e.deltaY < 0 ? 1.12 : 0.89)));
      return { k, tx: vx - (vx - v.tx) * (k / v.k), ty: vy - (vy - v.ty) * (k / v.k) };
    });
  };

  const onDown = (e) => {
    setDrag({ x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty });
  };
  const onMove = (e) => {
    if (drag) {
      const rect = wrapRef.current.getBoundingClientRect();
      const sx = VB_W / rect.width;
      const sy = VB_H / rect.height;
      setView((v) => ({ ...v, tx: drag.tx + (e.clientX - drag.x) * sx, ty: drag.ty + (e.clientY - drag.y) * sy }));
    }
    if (hover) {
      const rect = wrapRef.current.getBoundingClientRect();
      setHover((h) => (h ? { ...h, px: e.clientX - rect.left, py: e.clientY - rect.top } : h));
    }
  };
  const endDrag = () => setDrag(null);

  return (
    <div className="map-shell">
      <div className="map-toolbar">
        <span className="section-label">Corridor</span>
        <div className="row gap-6 wrap">
          <button
            className={`radio-chip ${!corridorFilter ? 'on' : ''}`}
            onClick={() => onCorridorFilter(null)}
          >All</button>
          {CORRIDORS.map((c) => (
            <button
              key={c.id}
              className={`radio-chip ${corridorFilter === c.id ? 'on' : ''}`}
              onClick={() => onCorridorFilter(corridorFilter === c.id ? null : c.id)}
              title={c.name}
            >
              <span className="corridor-key">
                <i style={{ background: c.accent }} />
                {c.id} · {c.shortName}
              </span>
            </button>
          ))}
        </div>
        <span className="spacer" />
        <button className={`radio-chip ${issuesOnly ? 'on crit' : ''}`} onClick={() => onIssuesOnly(!issuesOnly)}>
          Attention required only
        </button>
      </div>

      <div
        className={`map-canvas ${drag ? 'dragging' : ''}`}
        ref={wrapRef}
        onWheel={onWheel}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={endDrag}
        onMouseLeave={() => { endDrag(); setHover(null); }}
      >
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="7" stroke="#d99a2b" strokeWidth="2" opacity="0.35" />
            </pattern>
          </defs>

          <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
            {/* corridor spine tint */}
            {geos.map(({ track, g }) => (
              <line
                key={`c-${track.id}`}
                x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y}
                stroke={CORRIDOR_BY_ID[track.corridor]?.accent}
                strokeWidth="30" opacity={isDim(track) ? 0.02 : 0.10} strokeLinecap="round"
              />
            ))}

            {geos.map(({ track, g }) => {
              const band = healthBand(track.health);
              const dim = isDim(track);
              const selected = selectedId === track.id;
              const searched = highlightId === track.id;
              return (
                <g
                  key={track.id}
                  className={`seg-group ${dim ? 'faded' : ''} ${selected ? 'selected' : ''} ${searched ? 'searched' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onSelect(track.id); }}
                  onMouseEnter={(e) => {
                    const rect = wrapRef.current.getBoundingClientRect();
                    setHover({ track, px: e.clientX - rect.left, py: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => setHover(null)}
                >
                  <line
                    className="seg-glow"
                    x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
                    stroke={STATUS_GLOW[track.status] || '#43a96f'}
                  />
                  <line className="seg-ballast" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
                  {track.status === TRACK_STATUS.UNDER_MAINTENANCE && (
                    <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="url(#hatch)" strokeWidth="17" />
                  )}
                  <Sleepers g={g} band={band} />
                  {[1, -1].map((side) => (
                    <line
                      key={side}
                      className={`seg-rail ${band}`}
                      x1={g.x1 + g.nx * RAIL_GAUGE * side}
                      y1={g.y1 + g.ny * RAIL_GAUGE * side}
                      x2={g.x2 + g.nx * RAIL_GAUGE * side}
                      y2={g.y2 + g.ny * RAIL_GAUGE * side}
                    />
                  ))}
                  {band === 'critical' && <BreakMarker g={g} />}
                  <StatusMark track={track} g={g} />

                  {/* section label */}
                  <g transform={`translate(${g.mx + g.nx * 22} ${g.my + g.ny * 22})`} className="status-ico">
                    <rect x="-41" y="-8.5" width="82" height="17" rx="2" className="seg-label-bg" />
                    <text x="-36" y="3.6" className="seg-label">{track.id}</text>
                    <line x1="9" y1="-6" x2="9" y2="6" stroke="#2a3542" strokeWidth="0.8" />
                    <text
                      x="36" y="3.6" textAnchor="end"
                      className="seg-health-txt"
                      fill={band === 'critical' ? '#ec8582' : band === 'warning' ? '#e5ae4c' : '#5cc389'}
                    >{track.health}%</text>
                  </g>

                  <line className="seg-hit" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
                </g>
              );
            })}

            {STATIONS.map((s) => <Station key={s.code} s={s} />)}
          </g>
        </svg>

        {hover && (
          <div
            className="map-tooltip"
            style={{
              left: Math.min(hover.px + 14, (wrapRef.current?.clientWidth || 900) - 220),
              top: Math.max(8, hover.py - 70),
            }}
          >
            <div className="row gap-8" style={{ marginBottom: 4 }}>
              <span className="mono bold" style={{ fontSize: 12 }}>{hover.track.id}</span>
              <span className="spacer" />
              <HealthValue value={hover.track.health} size={12} />
            </div>
            <div style={{ fontSize: 11.5 }}>{hover.track.name}</div>
            <div className="tiny dim mt-4">
              {CORRIDOR_BY_ID[hover.track.corridor]?.name} · {hover.track.lengthKm} km
            </div>
            <div className="tiny mt-4" style={{ color: STATUS_GLOW[hover.track.status] }}>
              ● {hover.track.status}
            </div>
            <div className="tiny dim mt-4">Click for full section record</div>
          </div>
        )}

        <div className="map-legend">
          <div className="section-label" style={{ marginBottom: 2 }}>Track health rendering</div>
          <div className="legend-row">
            <span className="legend-swatch" style={{ background: 'repeating-linear-gradient(90deg,#8fb6a0 0 12px,#8fb6a0 12px 12px)' }} />
            Healthy — continuous rail (≥ {HEALTH_THRESHOLD}%)
          </div>
          <div className="legend-row">
            <span className="legend-swatch" style={{ background: 'repeating-linear-gradient(90deg,#d9a63f 0 7px,transparent 7px 10px)' }} />
            Degraded — worn rail ({HEALTH_CRITICAL_THRESHOLD}–{HEALTH_THRESHOLD - 1}%)
          </div>
          <div className="legend-row">
            <span className="legend-swatch" style={{ background: 'repeating-linear-gradient(90deg,#e0605c 0 5px,transparent 5px 10px)' }} />
            Critical — fractured rail (&lt; {HEALTH_CRITICAL_THRESHOLD}%)
          </div>
          <div className="legend-row" style={{ marginTop: 7, paddingTop: 6, borderTop: '1px solid var(--line)' }}>
            <span style={{ display: 'inline-flex', gap: 6 }}>
              <span style={{ color: '#b49ce4' }}>✕</span> Blocked
              <span style={{ color: '#e5ae4c' }}>⚒</span> Maintenance
              <span style={{ color: '#6bb6e8' }}>◎</span> Inspection
            </span>
          </div>
        </div>

        <div className="map-zoom">
          <button onClick={() => zoomBy(1.25)} title="Zoom in"><Icon name="plus" size={13} /></button>
          <button onClick={() => zoomBy(0.8)} title="Zoom out">−</button>
          <button onClick={() => setView({ k: 1, tx: 0, ty: 0 })} title="Reset view"><Icon name="refresh" size={13} /></button>
        </div>
      </div>
    </div>
  );
}
