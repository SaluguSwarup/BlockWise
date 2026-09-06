import { useMemo, useRef, useState } from 'react';
import { TRACKS } from '../../data/tracks.js';
import { CORRIDOR_BY_ID, STATION_BY_CODE } from '../../data/network.js';
import { Badge, HealthValue, Icon } from '../common/UI.jsx';

export function searchTracks(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TRACKS.filter((t) => {
    const corridor = CORRIDOR_BY_ID[t.corridor];
    const from = STATION_BY_CODE[t.from];
    const to = STATION_BY_CODE[t.to];
    return [
      t.id, t.trackId, t.name, t.corridor, corridor.name, corridor.shortName,
      t.status, t.chainage, from.code, from.name, to.code, to.name, t.currentIssue,
    ].join(' ').toLowerCase().includes(q);
  });
}

export default function TrackSearch({ onSelect, placeholder = 'Search section number, track ID, station or corridor…' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef(null);

  const results = useMemo(() => searchTracks(q).slice(0, 8), [q]);

  const choose = (track) => {
    onSelect(track.id, q);
    setOpen(false);
    setQ(track.id);
  };

  const onKey = (e) => {
    if (!open || !results.length) {
      if (e.key === 'Enter' && results.length) choose(results[0]);
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[cursor]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="search-box" ref={boxRef}>
      <span className="s-ico"><Icon name="search" size={13} /></span>
      <input
        value={q}
        placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setCursor(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        onKeyDown={onKey}
      />
      {q && (
        <button className="icon-btn s-clear" onClick={() => { setQ(''); onSelect(null); }}>
          <Icon name="close" size={12} />
        </button>
      )}

      {open && q && (
        <div className="suggest">
          {results.length === 0 && (
            <div className="suggest-empty">
              No section matches “{q}”.<br />
              <span className="tiny">Try a section number such as SEC-104, a station code, or a corridor name.</span>
            </div>
          )}
          {results.map((t, i) => (
            <div
              key={t.id}
              className={`suggest-item ${i === cursor ? 'cursor' : ''}`}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(t); }}
            >
              <span className="mono bold" style={{ width: 62 }}>{t.id}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12 }}>{t.name}</div>
                <div className="tiny dim">{t.corridor} · {t.trackId} · {t.lengthKm} km</div>
              </div>
              <HealthValue value={t.health} size={11.5} />
              <Badge>{t.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
