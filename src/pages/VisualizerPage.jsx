import { useMemo, useState } from 'react';
import NetworkMap from '../components/visualizer/NetworkMap.jsx';
import TrackDetailDrawer from '../components/visualizer/TrackDetailDrawer.jsx';
import TicketForm from '../components/visualizer/TicketForm.jsx';
import TrackSearch from '../components/visualizer/TrackSearch.jsx';
import { TRACKS, TRACK_BY_ID, TRACK_STATUS, healthBand } from '../data/tracks.js';
import { CORRIDOR_BY_ID } from '../data/network.js';
import { Badge, HealthBar, HealthValue, Icon, Panel } from '../components/common/UI.jsx';

export default function VisualizerPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [corridorFilter, setCorridorFilter] = useState(null);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [ticketFor, setTicketFor] = useState(null);
  const [registerQuery, setRegisterQuery] = useState('');

  const selected = selectedId ? TRACK_BY_ID[selectedId] : null;
  const highlighted = highlightId ? TRACK_BY_ID[highlightId] : null;

  const register = useMemo(() => {
    const q = registerQuery.trim().toLowerCase();
    return TRACKS.filter((t) => {
      if (corridorFilter && t.corridor !== corridorFilter) return false;
      if (issuesOnly && t.health >= 75 && t.status === TRACK_STATUS.ACTIVE) return false;
      if (!q) return true;
      return `${t.id} ${t.name} ${t.trackId} ${t.corridor} ${t.status}`.toLowerCase().includes(q);
    });
  }, [registerQuery, corridorFilter, issuesOnly]);

  const onSearchSelect = (id) => {
    setHighlightId(id);
    if (id) setSelectedId(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Network Visualiser</div>
          <div className="page-sub">
            Live schematic of the fixed infrastructure — click any section to open its full record
          </div>
        </div>
        <span className="spacer" />
        <TrackSearch onSelect={onSearchSelect} />
      </div>

      {highlighted && (
        <div
          className={`status-banner ${
            highlighted.status === TRACK_STATUS.ACTIVE ? 'status-ACTIVE'
              : highlighted.status === TRACK_STATUS.CRITICAL ? 'status-CRITICAL'
                : highlighted.status === TRACK_STATUS.BLOCKED ? 'status-BLOCKED'
                  : highlighted.status === TRACK_STATUS.UNDER_MAINTENANCE ? 'status-MAINTENANCE' : 'status-INSPECTION'
          }`}
        >
          <span className="pulse-dot" style={{ background: 'currentColor' }} />
          <div>
            <div className="row gap-8">
              <span className="mono bold" style={{ fontSize: 14 }}>{highlighted.id}</span>
              <span style={{ fontSize: 13 }}>{highlighted.name}</span>
            </div>
            <div style={{ fontSize: 11.5, opacity: 0.92, marginTop: 2 }}>
              {highlighted.status === TRACK_STATUS.ACTIVE
                ? `Section is ACTIVE and available for traffic — located on the map. ${highlighted.currentActivity}.`
                : `Section is not available for normal working — ${highlighted.status}. ${highlighted.currentIssue}`}
            </div>
          </div>
          <span className="spacer" />
          <div className="right" style={{ marginRight: 10 }}>
            <div className="tiny" style={{ opacity: 0.75 }}>HEALTH</div>
            <div className="mono bold" style={{ fontSize: 16 }}>{highlighted.health}%</div>
          </div>
          <button className="btn sm" onClick={() => setSelectedId(highlighted.id)}>
            Go to track details <Icon name="chevronR" size={12} />
          </button>
          <button className="icon-btn" onClick={() => setHighlightId(null)}><Icon name="close" size={14} /></button>
        </div>
      )}

      <NetworkMap
        selectedId={selectedId}
        highlightId={highlightId}
        onSelect={setSelectedId}
        corridorFilter={corridorFilter}
        onCorridorFilter={setCorridorFilter}
        issuesOnly={issuesOnly}
        onIssuesOnly={setIssuesOnly}
      />

      <div className="mt-12">
        <Panel
          title={`Section register — ${register.length} of ${TRACKS.length} sections`}
          icon="list"
          bodyClass="tight"
          right={(
            <input
              className="input" style={{ width: 220, padding: '5px 9px' }}
              placeholder="Filter register…"
              value={registerQuery}
              onChange={(e) => setRegisterQuery(e.target.value)}
            />
          )}
        >
          <div className="tbl-scroll" style={{ maxHeight: 360 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Section</th><th>Route</th><th>Corridor</th><th>Length</th>
                  <th style={{ width: 150 }}>Track health</th><th>Status</th><th>Open defects</th>
                  <th>Next block window</th><th />
                </tr>
              </thead>
              <tbody>
                {register.map((t) => (
                  <tr
                    key={t.id}
                    className="clickable"
                    onClick={() => setSelectedId(t.id)}
                  >
                    <td className="mono bold">{t.id}</td>
                    <td>{t.name}</td>
                    <td>
                      <span className="corridor-key">
                        <i style={{ background: CORRIDOR_BY_ID[t.corridor].accent }} />
                        {t.corridor}
                      </span>
                    </td>
                    <td className="mono">{t.lengthKm} km</td>
                    <td>
                      <div className="row gap-8">
                        <div style={{ width: 82 }}><HealthBar value={t.health} /></div>
                        <HealthValue value={t.health} size={11.5} />
                      </div>
                    </td>
                    <td><Badge>{t.status}</Badge></td>
                    <td className="mono">{t.defects.length || '—'}</td>
                    <td className="tiny muted">{t.nextBlockWindow}</td>
                    <td className="right"><Icon name="chevronR" size={13} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <TrackDetailDrawer
        track={selected}
        onClose={() => setSelectedId(null)}
        onRaiseTicket={(t) => setTicketFor(t)}
      />

      <TicketForm track={ticketFor} open={!!ticketFor} onClose={() => setTicketFor(null)} />
    </>
  );
}
