import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppState.jsx';
import { ALL_DEFECTS, ALL_OVERDUE, TRACKS, TRACK_STATUS, DEPARTMENTS } from '../data/tracks.js';
import { REQUEST_STATUS } from '../data/blockRequests.js';
import { TICKET_STATUS } from '../data/tickets.js';
import { SOURCE_SYSTEMS, WEEKLY_UTILISATION, DIVISION_KPI, BLOCK_STATE } from '../data/plans.js';
import { CORRIDOR_STATUS } from '../data/trains.js';
import { CORRIDOR_BY_ID } from '../data/network.js';
import { Badge, DeptTag, HealthBar, HealthValue, Icon, Panel, Stat } from '../components/common/UI.jsx';
import { BarList, DonutChart, HealthHistogram, UtilisationChart } from '../components/dashboard/Charts.jsx';
import ConceptFlow from '../components/common/ConceptFlow.jsx';
import { formatDate } from '../lib/format.js';

export default function DashboardPage() {
  const { isAdmin, requests, tickets, planBlocks, planResult, user } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const active = TRACKS.filter((t) => t.status === TRACK_STATUS.ACTIVE).length;
    const maint = TRACKS.filter((t) => t.status === TRACK_STATUS.UNDER_MAINTENANCE || t.status === TRACK_STATUS.BLOCKED).length;
    const criticalDefects = ALL_DEFECTS.filter((d) => d.severity === 'CRITICAL').length;
    const openTickets = tickets.filter((t) => t.status !== TICKET_STATUS.CLOSED).length;
    const pendingReq = requests.filter((r) => r.status === REQUEST_STATUS.PENDING).length;
    const scheduled = planBlocks.filter((b) => b.state === BLOCK_STATE.SANCTIONED || b.state === 'PROPOSED').length;
    const availability = TRACKS.reduce((s, t) => s + t.assetAvailability, 0) / TRACKS.length;
    return { active, maint, criticalDefects, openTickets, pendingReq, scheduled, availability };
  }, [requests, tickets, planBlocks]);

  const deptDonut = useMemo(() => {
    const counts = { ENGG: 0, SNT: 0, TRD: 0 };
    requests.forEach((r) => { counts[r.dept] += 1; });
    return [
      { label: 'Engineering (TMS)', value: counts.ENGG, color: DEPARTMENTS.ENGG.accent },
      { label: 'Signalling (SMMS)', value: counts.SNT, color: DEPARTMENTS.SNT.accent },
      { label: 'Traction (TDMS)', value: counts.TRD, color: DEPARTMENTS.TRD.accent },
    ];
  }, [requests]);

  const priorityBars = useMemo(() => {
    // r.priority is the baked ScoringOutput score record (src/mocks/requests.json — R3); this
    // screen never computes a score itself.
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    requests.forEach((r) => { counts[r.priority.band] += 1; });
    return [
      { label: 'CRITICAL', value: counts.CRITICAL, color: '#d9534f' },
      { label: 'HIGH', value: counts.HIGH, color: '#d99a2b' },
      { label: 'MEDIUM', value: counts.MEDIUM, color: '#4a9fdc' },
      { label: 'LOW', value: counts.LOW, color: '#5a6675' },
    ];
  }, [requests]);

  const upcoming = useMemo(
    () => [...planBlocks]
      .filter((b) => b.date >= '2026-09-06')
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(0, 7),
    [planBlocks],
  );

  const attention = useMemo(
    () => [...TRACKS].sort((a, b) => a.health - b.health).slice(0, 5),
    [],
  );

  const savedHours = planResult ? planResult.metrics.savedHours : DIVISION_KPI.blockHoursSavedMTD;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Divisional Maintenance Dashboard</div>
          <div className="page-sub">
            Consolidated position of fixed infrastructure, maintenance demand and block planning · 06 Sep 2026, 09:46 hrs
          </div>
        </div>
        <span className="spacer" />
        {isAdmin && (
          <button className="btn primary" onClick={() => navigate('/app/requests')}>
            <Icon name="engine" /> Plan blocks
          </button>
        )}
      </div>

      {/* ---------- source-system integration strip ---------- */}
      <div className="panel mb-16">
        <div className="panel-body" style={{ padding: '10px 14px' }}>
          <div className="row gap-16 wrap">
            <div className="row gap-8">
              <span className="pulse-dot" />
              <span className="section-label">Integrated source systems</span>
            </div>
            {SOURCE_SYSTEMS.map((s) => (
              <div key={s.code} className="row gap-8" title={`${s.name} — last sync ${s.lastSync}`}>
                <span className="mono bold" style={{ fontSize: 11.5, color: 'var(--accent)' }}>{s.code}</span>
                <span className="tiny dim">{s.records.toLocaleString('en-IN')} records</span>
                <Badge tone="ok" dot>{s.status}</Badge>
              </div>
            ))}
            <span className="spacer" />
            <span className="tiny dim">Last synchronisation 09:44 hrs</span>
          </div>
        </div>
      </div>

      {/* ---------- KPI tiles ---------- */}
      <div className="grid grid-4 mb-16">
        <Stat tone="ok" label="Active sections" value={stats.active} unit={`/${TRACKS.length}`} foot="Available for normal train working" />
        <Stat tone="warn" label="Under maintenance / blocked" value={stats.maint} foot="Sections with a block in force" />
        <Stat tone="crit" label="Critical defects" value={stats.criticalDefects} foot={`${ALL_DEFECTS.length} open defects across TMS · SMMS · TDMS`} />
        <Stat tone="info" label="Pending inspection tickets" value={stats.openTickets} foot="Raised by field staff" />
        {isAdmin ? (
          <>
            <Stat tone="accent" label="Pending block requests" value={stats.pendingReq} foot="Awaiting selection in BDMS" />
            <Stat tone="info" label="Scheduled blocks" value={stats.scheduled} foot="Sanctioned + optimised" />
            <Stat tone="ok" label="Infrastructure availability" value={stats.availability.toFixed(1)} unit="%" foot={`Target ${DIVISION_KPI.targetAvailability}%`} />
            <Stat tone="accent" label="Block hours saved" value={savedHours} unit=" hr" foot={planResult ? 'From the last optimisation run' : 'Month to date'} />
          </>
        ) : (
          <>
            <Stat tone="accent" label="Overdue maintenance tasks" value={ALL_OVERDUE.length} foot="Across all departments" />
            <Stat tone="info" label="Sections below threshold" value={TRACKS.filter((t) => t.health < 75).length} foot="Health metric under 75%" />
            <Stat tone="ok" label="Infrastructure availability" value={stats.availability.toFixed(1)} unit="%" foot={`Target ${DIVISION_KPI.targetAvailability}%`} />
            <Stat tone="warn" label="Blocks in force today" value={planBlocks.filter((b) => b.state === BLOCK_STATE.IN_PROGRESS).length} foot="Corridor blocks currently running" />
          </>
        )}
      </div>

      {/* ---------- charts ---------- */}
      <div className="grid grid-2 mb-16">
        <Panel title="Maintenance demand by department" icon="layers"
          right={<span className="tiny dim">{requests.length} block requests</span>}>
          <DonutChart
            data={deptDonut}
            centerValue={requests.length}
            centerLabel="REQUESTS"
          />
        </Panel>

        <Panel title="Track health distribution" icon="dashboard"
          right={<span className="tiny dim">{TRACKS.length} sections</span>}>
          <HealthHistogram tracks={TRACKS} />
        </Panel>

        <Panel title="Block requests by priority" icon="engine"
          right={<span className="tiny dim">scored by the planning engine</span>}>
          <BarList rows={priorityBars} />
          <div className="tiny dim mt-12">
            Priority is derived from criticality, urgency, safety impact, asset health deficit,
            overdue status and impact on asset availability.
          </div>
        </Panel>

        <Panel title="Weekly block utilisation" icon="calendar"
          right={<span className="tiny dim">last 8 weeks</span>}>
          <UtilisationChart data={WEEKLY_UTILISATION} />
          <div className="row gap-16 mt-8">
            <div>
              <div className="section-label">Current utilisation</div>
              <div className="mono bold" style={{ fontSize: 17 }}>{DIVISION_KPI.blockUtilisation}%</div>
            </div>
            <div>
              <div className="section-label">Blocks granted (W35)</div>
              <div className="mono bold" style={{ fontSize: 17 }}>30</div>
            </div>
            <div>
              <div className="section-label">Punctuality</div>
              <div className="mono bold" style={{ fontSize: 17 }}>{DIVISION_KPI.punctuality}%</div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ---------- lists ---------- */}
      <div className="grid grid-2 mb-16">
        <Panel title="Sections requiring attention" icon="alert" bodyClass="tight"
          right={<button className="btn sm ghost" onClick={() => navigate('/app/network')}>Open visualiser</button>}>
          <table className="tbl">
            <thead>
              <tr><th>Section</th><th>Route</th><th style={{ width: 130 }}>Health</th><th>Status</th><th>Open defects</th></tr>
            </thead>
            <tbody>
              {attention.map((t) => (
                <tr key={t.id} className="clickable" onClick={() => navigate('/app/network')}>
                  <td className="mono bold">{t.id}</td>
                  <td>{t.name}</td>
                  <td>
                    <div className="row gap-8">
                      <div style={{ width: 62 }}><HealthBar value={t.health} /></div>
                      <HealthValue value={t.health} size={11.5} />
                    </div>
                  </td>
                  <td><Badge>{t.status}</Badge></td>
                  <td className="mono">{t.defects.length || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Upcoming blocks" icon="calendar" bodyClass="tight"
          right={isAdmin && <button className="btn sm ghost" onClick={() => navigate('/app/schedule')}>Full schedule</button>}>
          <table className="tbl">
            <thead>
              <tr><th>Date</th><th>Block</th><th>Section</th><th>Window</th><th>Departments</th><th>Status</th></tr>
            </thead>
            <tbody>
              {upcoming.map((b) => (
                <tr key={b.id}>
                  <td className="mono nowrap">{formatDate(b.date)}</td>
                  <td className="mono">{b.id}</td>
                  <td className="mono">{b.section}</td>
                  <td className="mono nowrap">{b.start}–{b.end}</td>
                  <td>
                    <div className="row gap-4">
                      {b.depts.map((d) => <DeptTag key={d} dept={d} />)}
                    </div>
                  </td>
                  <td><Badge>{b.state}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* ---------- corridor status ---------- */}
      <div className="grid grid-2 mb-16">
        <Panel title="Corridor availability — Control Office" icon="train" bodyClass="tight">
          <table className="tbl">
            <thead>
              <tr><th>Corridor</th><th>Route</th><th>Trains running</th><th>Punctuality</th><th>Blocked</th><th>Control note</th></tr>
            </thead>
            <tbody>
              {CORRIDOR_STATUS.map((c) => (
                <tr key={c.corridor}>
                  <td>
                    <span className="corridor-key">
                      <i style={{ background: CORRIDOR_BY_ID[c.corridor].accent }} />
                      <span className="mono bold">{c.corridor}</span>
                    </span>
                  </td>
                  <td className="tiny">{CORRIDOR_BY_ID[c.corridor].shortName}</td>
                  <td className="mono">{c.trainsRunning}</td>
                  <td className="mono">{c.punctuality}%</td>
                  <td>{c.sectionsBlocked ? <Badge tone="crit">{c.sectionsBlocked} section</Badge> : <span className="dim">—</span>}</td>
                  <td className="tiny muted">{c.controllerNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Latest inspection tickets" icon="ticket" bodyClass="tight"
          right={<button className="btn sm ghost" onClick={() => navigate('/app/tickets')}>All tickets</button>}>
          <table className="tbl">
            <thead>
              <tr><th>Ticket</th><th>Section</th><th>Dept</th><th>Reason</th><th>Urgency</th><th>Status</th></tr>
            </thead>
            <tbody>
              {tickets.slice(0, 5).map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.id}</td>
                  <td className="mono">{t.section}</td>
                  <td><DeptTag dept={t.dept} /></td>
                  <td className="tiny">{t.reason}</td>
                  <td><Badge>{t.urgency}</Badge></td>
                  <td><Badge>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {isAdmin && (
        <Panel title="How BlockWise plans a block" icon="engine">
          <ConceptFlow />
          <div className="tiny dim mt-16">
            Signed in as {user.name} · {user.designation}. The planning engine and the block schedule are
            available only to divisional administrators.
          </div>
        </Panel>
      )}
    </>
  );
}
