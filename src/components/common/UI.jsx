import { useEffect, useState } from 'react';
import { HEALTH_THRESHOLD, healthBand, DEPARTMENTS } from '../../data/tracks.js';
import { getServerTime } from '../../lib/api.js';

/* ----------------------------------------------------------------- icons */

const PATHS = {
  dashboard: 'M3 3h7v7H3zM14 3h7v4h-7zM14 10h7v11h-7zM3 13h7v8H3z',
  map: 'M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6zM9 3v15M15 6v15',
  ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM10 7v10',
  list: 'M4 6h16M4 12h16M4 18h16',
  engine: 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  calendar: 'M3 6h18v15H3zM3 10h18M8 3v4M16 3v4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  close: 'M6 6l12 12M18 6 6 18',
  chevronR: 'M9 5l7 7-7 7',
  chevronL: 'M15 5l-7 7 7 7',
  chevronD: 'M6 9l6 6 6-6',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M9 12h10',
  train: 'M6 3h12v11H6zM6 9h12M8 18l-2 3M16 18l2 3M6 14h12v4H6zM9 6h2M13 6h2',
  wrench: 'M14.5 4a4.5 4.5 0 0 0-5.9 5.9L3 15.5V21h5.5l5.6-5.6A4.5 4.5 0 0 0 20 9.5l-3 3-2.5-2.5 3-3A4.5 4.5 0 0 0 14.5 4z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  signal: 'M12 3v18M8 6h8M8 10h8M6 21h12',
  alert: 'M12 3 2 20h20zM12 9v5M12 17.5v.5',
  check: 'M4 12l5 5L20 6',
  plus: 'M12 5v14M5 12h14',
  layers: 'M12 3 2 8l10 5 10-5zM2 14l10 5 10-5',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
  shield: 'M12 3 4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  download: 'M12 3v12M7 11l5 5 5-5M4 20h16',
};

export function Icon({ name, size = 14, style, className }) {
  const d = PATHS[name] || PATHS.list;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      <path d={d} />
    </svg>
  );
}

/* ----------------------------------------------------------------- badges */

const STATUS_TONE = {
  ACTIVE: 'ok',
  'UNDER INSPECTION': 'info',
  'UNDER MAINTENANCE': 'warn',
  BLOCKED: 'violet',
  CRITICAL: 'crit',
  OPEN: 'warn',
  ACKNOWLEDGED: 'info',
  'INSPECTION SCHEDULED': 'info',
  CLOSED: 'neutral',
  PENDING: 'neutral',
  SELECTED: 'ok',
  REJECTED: 'crit',
  SCHEDULED: 'info',
  COMPLETED: 'neutral',
  'IN PROGRESS': 'warn',
  SANCTIONED: 'info',
  PROPOSED: 'ok',
  IMMEDIATE: 'crit',
  HIGH: 'warn',
  NORMAL: 'info',
  PLANNED: 'neutral',
  MEDIUM: 'info',
  LOW: 'neutral',
};

export function Badge({ children, tone, dot = false }) {
  const t = tone || STATUS_TONE[children] || 'neutral';
  return (
    <span className={`badge ${t}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function DeptTag({ dept, full = false }) {
  const d = DEPARTMENTS[dept];
  if (!d) return null;
  return (
    <span className={`dept-tag dept-${dept}`} title={`${d.full} · source: ${d.system}`}>
      <span className="bar" />
      {full ? d.name : d.abbr}
    </span>
  );
}

/* ----------------------------------------------------------------- health */

export function HealthBar({ value, showThreshold = true, height = 5 }) {
  const band = healthBand(value);
  return (
    <div className="health-bar" style={{ height }}>
      <i className={`health-fill-${band}`} style={{ width: `${value}%` }} />
      {showThreshold && <span className="thresh" style={{ left: `${HEALTH_THRESHOLD}%` }} />}
    </div>
  );
}

export function HealthValue({ value, size = 13 }) {
  const band = healthBand(value);
  return <span className={`health-num health-${band}`} style={{ fontSize: size }}>{value}%</span>;
}

/* ----------------------------------------------------------------- layout bits */

export function Panel({ title, right, children, icon, bodyClass = '', style }) {
  return (
    <section className="panel" style={style}>
      {(title || right) && (
        <header className="panel-head">
          {icon && <span style={{ color: 'var(--text-3)' }}><Icon name={icon} /></span>}
          <span className="panel-title">{title}</span>
          <span className="spacer" />
          {right}
        </header>
      )}
      <div className={`panel-body ${bodyClass}`}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, unit, foot, tone = '' }) {
  return (
    <div className={`stat ${tone ? `t-${tone}` : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}{unit && <small>{unit}</small>}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  );
}

export function KV({ k, v }) {
  return (
    <div className="dl-row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={`tab ${value === t.id ? 'on' : ''}`} onClick={() => onChange(t.id)}>
          {t.color && <span className="tab-dot" style={{ background: t.color }} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- overlays */

export function Drawer({ open, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className={`drawer ${wide ? 'wide' : ''}`}>{children}</aside>
    </>
  );
}

export function Modal({ open, onClose, children, width }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={width ? { width } : undefined}>{children}</div>
    </>
  );
}

export function CloseButton({ onClick }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label="Close">
      <Icon name="close" size={15} />
    </button>
  );
}

/* ----------------------------------------------------------------- misc */

export function Callout({ tone = 'info', icon = 'alert', children }) {
  return (
    <div className={`callout ${tone}`}>
      <span className="ico"><Icon name={icon} size={14} /></span>
      <div>{children}</div>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const [hh, mm, ss] = now
    .toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })
    .split(':');
  const date = now
    .toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();
  return (
    <div className="top-clock" title="Divisional clock (IST)">
      {hh}:{mm}<span style={{ color: 'var(--text-3)' }}>:{ss}</span>
      <span style={{ color: 'var(--text-3)', marginLeft: 7, fontSize: 11 }}>{date}</span>
    </div>
  );
}

/**
 * Backend connectivity indicator. Polls the API's /api/time every 30s so the
 * topbar shows whether the Render service is reachable from the browser.
 */
export function ApiStatus() {
  const [state, setState] = useState({ status: 'checking' });
  useEffect(() => {
    let alive = true;
    const check = () => {
      getServerTime().then((r) => {
        if (!alive) return;
        setState(r.ok ? { status: 'online', ist: r.data?.ist } : { status: 'offline', reason: r.reason });
      });
    };
    check();
    const t = setInterval(check, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const map = {
    checking: { color: 'var(--text-3)', dot: 'var(--text-3)', label: 'Checking API…' },
    online: { color: 'var(--text-2)', dot: 'var(--ok)', label: 'API online' },
    offline: { color: 'var(--crit)', dot: 'var(--crit)', label: 'API offline' },
  };
  const s = map[state.status];
  const title = state.status === 'online'
    ? `Backend time: ${state.ist || 'n/a'}`
    : state.status === 'offline'
      ? `Backend unreachable — ${state.reason || 'unknown error'}`
      : 'Contacting backend…';

  return (
    <div className="row gap-6 tiny" style={{ color: s.color }} title={title}>
      <span className="pulse-dot" style={{ background: s.dot }} />
      <span>{s.label}</span>
    </div>
  );
}

export function ScorePill({ score, band }) {
  return (
    <span className={`score-pill score-${band}`}>
      {score}<small>/100</small>
    </span>
  );
}

export function ProgressBar({ value }) {
  return <div className="progress"><i style={{ width: `${value}%` }} /></div>;
}
