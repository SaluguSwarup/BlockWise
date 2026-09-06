import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppState.jsx';
import { REQUEST_STATUS } from '../data/blockRequests.js';
import { DEPARTMENTS, TRACK_BY_ID } from '../data/tracks.js';
import { scoreRequest } from '../lib/planningEngine.js';
import { formatDate, formatDuration } from '../lib/format.js';
import { Badge, DeptTag, HealthValue, Icon, Panel, ScorePill, Stat } from '../components/common/UI.jsx';
import RequestDetail from '../components/planning/RequestDetail.jsx';

export default function BlockRequestsPage() {
  const { requests, setRequestStatus, notify } = useApp();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');

  const scored = useMemo(
    () => requests.map((r) => ({ ...r, ai: scoreRequest(r) })),
    [requests],
  );

  const filtered = useMemo(() => {
    let list = scored.filter((r) => {
      if (deptFilter !== 'ALL' && r.dept !== deptFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (query && !`${r.id} ${r.section} ${r.activity} ${r.requestedBy}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'score') return b.ai.score - a.ai.score;
      if (sortBy === 'date') return a.requestedDate < b.requestedDate ? -1 : 1;
      if (sortBy === 'section') return a.section.localeCompare(b.section);
      return 0;
    });
    return list;
  }, [scored, deptFilter, statusFilter, query, sortBy]);

  const selected = requests.filter((r) => r.status === REQUEST_STATUS.SELECTED);
  const pending = requests.filter((r) => r.status === REQUEST_STATUS.PENDING);
  const rejected = requests.filter((r) => r.status === REQUEST_STATUS.REJECTED);

  /** Section-date groups where more than one department has demanded a block. */
  const mergeOpportunities = useMemo(() => {
    const map = new Map();
    requests.filter((r) => r.status !== REQUEST_STATUS.REJECTED).forEach((r) => {
      const k = `${r.section}__${r.requestedDate}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    });
    return [...map.entries()]
      .filter(([, v]) => v.length > 1 && new Set(v.map((x) => x.dept)).size > 1)
      .map(([k, v]) => ({ section: k.split('__')[0], date: k.split('__')[1], items: v }));
  }, [requests]);

  const toggle = (id) => {
    const r = requests.find((x) => x.id === id);
    setRequestStatus(id, r.status === REQUEST_STATUS.SELECTED ? REQUEST_STATUS.PENDING : REQUEST_STATUS.SELECTED);
  };

  const approve = (id) => {
    setRequestStatus(id, REQUEST_STATUS.SELECTED);
    notify(`${id} selected for the planning workflow`, 'info');
  };
  const reject = (id) => {
    setRequestStatus(id, REQUEST_STATUS.REJECTED);
    notify(`${id} rejected`, 'crit');
  };

  const selectAllPending = () => {
    setRequestStatus(pending.map((r) => r.id), REQUEST_STATUS.SELECTED);
    notify(`${pending.length} requests selected for planning`, 'info');
  };

  const openRequest = openId ? requests.find((r) => r.id === openId) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Block Requests — BDMS</div>
          <div className="page-sub">
            Maintenance block and disconnection demands raised independently by Engineering, S&amp;T and Traction
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={selectAllPending} disabled={!pending.length}>
          <Icon name="check" /> Select all pending
        </button>
        <button className="btn primary" disabled={!selected.length} onClick={() => navigate('/app/engine')}>
          <Icon name="engine" /> Send {selected.length || ''} to planning engine
        </button>
      </div>

      <div className="grid grid-4 mb-16">
        <Stat tone="accent" label="Total demands" value={requests.length} foot="Across 3 departments" />
        <Stat tone="warn" label="Pending selection" value={pending.length} foot="Awaiting divisional decision" />
        <Stat tone="ok" label="Selected for planning" value={selected.length} foot="Will be sent to the engine" />
        <Stat tone="info" label="Merge opportunities" value={mergeOpportunities.length} foot="Section-date groups with multi-department demand" />
      </div>

      {mergeOpportunities.length > 0 && (
        <div className="panel mb-16">
          <div className="panel-head">
            <span style={{ color: 'var(--accent)' }}><Icon name="layers" /></span>
            <span className="panel-title">Coordination opportunities detected</span>
            <span className="spacer" />
            <span className="tiny dim">Same section · same date · different departments</span>
          </div>
          <div className="panel-body">
            <div className="grid grid-3">
              {mergeOpportunities.map((m) => {
                const track = TRACK_BY_ID[m.section];
                const serial = m.items.reduce((s, r) => s + r.durationMin, 0);
                const longest = Math.max(...m.items.map((r) => r.durationMin));
                const merged = longest + 10 * (m.items.length - 1);
                return (
                  <div key={`${m.section}${m.date}`} className="defect-row" style={{ borderLeftColor: 'var(--accent)', display: 'block' }}>
                    <div className="row gap-8">
                      <span className="mono bold">{m.section}</span>
                      <span className="tiny dim">{formatDate(m.date)}</span>
                      <span className="spacer" />
                      <HealthValue value={track.health} size={11.5} />
                    </div>
                    <div className="row gap-4 mt-8 wrap">
                      {m.items.map((r) => <DeptTag key={r.id} dept={r.dept} />)}
                    </div>
                    <div className="tiny dim mt-8">
                      Serial working {formatDuration(serial)} → coordinated block {formatDuration(merged)}
                      <span style={{ color: '#6ed49a' }}> · saves {formatDuration(serial - merged)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Panel
        title={`Block request register — ${filtered.length} of ${requests.length}`}
        icon="list"
        bodyClass="tight"
        right={(
          <div className="row gap-8">
            <select className="select" style={{ width: 145, padding: '5px 9px' }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="ALL">All departments</option>
              {Object.values(DEPARTMENTS).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="select" style={{ width: 140, padding: '5px 9px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              {Object.values(REQUEST_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select" style={{ width: 150, padding: '5px 9px' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="score">Sort: AI priority</option>
              <option value="date">Sort: requested date</option>
              <option value="section">Sort: section</option>
            </select>
            <input className="input" style={{ width: 180, padding: '5px 9px' }} placeholder="Search requests…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}
      >
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 34 }} />
              <th>Request ID</th><th>Section</th><th>Dept</th><th>Maintenance activity</th>
              <th>Requested</th><th>Duration</th><th>Criticality</th><th>Urgency</th>
              <th>Asset impact</th><th>AI priority</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`clickable ${r.status === REQUEST_STATUS.SELECTED ? 'selected' : ''} ${r.status === REQUEST_STATUS.REJECTED ? 'rejected' : ''}`}
                onClick={() => setOpenId(r.id)}
              >
                <td onClick={(e) => { e.stopPropagation(); if (r.status !== REQUEST_STATUS.SCHEDULED) toggle(r.id); }}>
                  <span className={`chk ${r.status === REQUEST_STATUS.SELECTED ? 'on' : ''}`} />
                </td>
                <td className="mono" style={{ fontSize: 11.5 }}>{r.id}</td>
                <td className="mono bold">{r.section}</td>
                <td><DeptTag dept={r.dept} /></td>
                <td style={{ maxWidth: 240 }}>{r.activity}</td>
                <td className="mono nowrap tiny">
                  {formatDate(r.requestedDate)}<br />
                  <span className="dim">{r.requestedStart}–{r.requestedEnd}</span>
                </td>
                <td className="mono nowrap">{formatDuration(r.durationMin)}</td>
                <td><Badge tone={r.criticality === 'CRITICAL' ? 'crit' : r.criticality === 'HIGH' ? 'warn' : 'info'}>{r.criticality}</Badge></td>
                <td><Badge>{r.urgency}</Badge></td>
                <td className="mono">{r.assetImpact}</td>
                <td><ScorePill score={r.ai.score} band={r.ai.band} /></td>
                <td><Badge>{r.status}</Badge></td>
                <td className="right"><Icon name="chevronR" size={13} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {selected.length > 0 && (
        <div className="selection-bar">
          <span style={{ color: 'var(--accent)' }}><Icon name="check" size={16} /></span>
          <div>
            <div style={{ fontWeight: 650 }}>{selected.length} block requests selected for planning</div>
            <div className="tiny dim">
              {[...new Set(selected.map((r) => r.section))].length} sections ·
              {' '}{[...new Set(selected.map((r) => r.dept))].length} departments ·
              {' '}{formatDuration(selected.reduce((s, r) => s + r.durationMin, 0))} of requested block time
            </div>
          </div>
          <span className="spacer" />
          <button className="btn ghost" onClick={() => setRequestStatus(selected.map((r) => r.id), REQUEST_STATUS.PENDING)}>
            Clear selection
          </button>
          <button className="btn primary" onClick={() => navigate('/app/engine')}>
            <Icon name="engine" /> Send to Block Planning Engine
          </button>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="tiny dim mt-12">
          {rejected.length} request{rejected.length > 1 ? 's' : ''} rejected and excluded from planning:
          {' '}{rejected.map((r) => r.id).join(', ')}
        </div>
      )}

      <RequestDetail
        request={openRequest}
        requests={requests}
        onClose={() => setOpenId(null)}
        onApprove={approve}
        onReject={reject}
      />
    </>
  );
}
