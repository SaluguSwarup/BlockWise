import { useMemo, useState } from 'react';
import { CORRIDOR_BY_ID, STATION_BY_CODE, DIVISION } from '../../data/network.js';
import { DEPARTMENTS, HEALTH_THRESHOLD, healthBand, healthLabel, TRACK_STATUS } from '../../data/tracks.js';
import { GOODS_FORECAST, getWindowsForSection, TIMETABLE } from '../../data/trains.js';
import { Badge, CloseButton, DeptTag, Drawer, HealthBar, HealthValue, Icon, KV, Tabs, Callout } from '../common/UI.jsx';
import { useApp } from '../../context/AppState.jsx';
import { REQUEST_STATUS } from '../../data/blockRequests.js';

const STATUS_CLASS = {
  [TRACK_STATUS.ACTIVE]: 'status-ACTIVE',
  [TRACK_STATUS.UNDER_INSPECTION]: 'status-INSPECTION',
  [TRACK_STATUS.UNDER_MAINTENANCE]: 'status-MAINTENANCE',
  [TRACK_STATUS.BLOCKED]: 'status-BLOCKED',
  [TRACK_STATUS.CRITICAL]: 'status-CRITICAL',
};

function LiveTile({ label, value }) {
  return (
    <div className="live-tile">
      <div className="lt-label">{label}</div>
      <div className="lt-value">{value}</div>
    </div>
  );
}

function DeptCard({ deptId, data, extra }) {
  const d = DEPARTMENTS[deptId];
  return (
    <div className={`dept-card ${deptId}`}>
      <div className="dept-card-head">
        <DeptTag dept={deptId} full />
        <span className="spacer" />
        <span className="tiny dim mono">source: {d.system}</span>
      </div>
      <div className="dept-card-body">
        {extra}
        {Object.entries(data).map(([k, v]) => (
          <KV key={k} k={k} v={v} />
        ))}
      </div>
    </div>
  );
}

export default function TrackDetailDrawer({ track, onClose, onRaiseTicket }) {
  const [tab, setTab] = useState('overview');
  const { requests, tickets } = useApp();

  const corridor = track ? CORRIDOR_BY_ID[track.corridor] : null;

  const relatedRequests = useMemo(
    () => (track ? requests.filter((r) => r.section === track.id) : []),
    [requests, track],
  );
  const relatedTickets = useMemo(
    () => (track ? tickets.filter((t) => t.section === track.id) : []),
    [tickets, track],
  );

  if (!track) return null;

  const band = healthBand(track.health);
  const windows = getWindowsForSection(track.id, track.corridor);
  const forecast = GOODS_FORECAST[track.corridor];
  const timetable = TIMETABLE[track.corridor] || [];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'ENGG', label: 'Engineering', color: 'var(--engg)' },
    { id: 'SNT', label: 'Signalling', color: 'var(--snt)' },
    { id: 'TRD', label: 'Traction', color: 'var(--trd)' },
    { id: 'defects', label: `Defects (${track.defects.length})` },
    { id: 'ops', label: 'Train Operations' },
  ];

  return (
    <Drawer open={!!track} onClose={onClose}>
      <header className="drawer-head">
        <div className="row gap-12">
          <div>
            <div className="row gap-8">
              <span className="mono" style={{ fontSize: 17, fontWeight: 700 }}>{track.id}</span>
              <Badge>{track.status}</Badge>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{track.name}</div>
            <div className="tiny dim mt-4">
              {corridor.name} · {corridor.id} · {DIVISION.division}
            </div>
          </div>
          <span className="spacer" />
          <CloseButton onClick={onClose} />
        </div>
      </header>

      <div className="drawer-body">
        <div className={`status-banner ${STATUS_CLASS[track.status]}`}>
          <span className={`pulse-dot ${band === 'critical' ? 'crit' : ''}`} style={{ background: 'currentColor' }} />
          <div>
            <div className="big">{track.status}</div>
            <div style={{ fontSize: 11.5, opacity: 0.9 }}>{track.currentActivity}</div>
          </div>
          <span className="spacer" />
          <div className="right">
            <div className="tiny" style={{ opacity: 0.75 }}>TRACK HEALTH</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{track.health}%</div>
            <div className="tiny" style={{ opacity: 0.8 }}>{healthLabel(track.health)}</div>
          </div>
        </div>

        <div className="mb-16">
          <div className="row gap-8" style={{ marginBottom: 5 }}>
            <span className="section-label">Health check metric</span>
            <span className="spacer" />
            <span className="tiny dim">Threshold {HEALTH_THRESHOLD}% · Critical below 60%</span>
          </div>
          <HealthBar value={track.health} height={8} />
          <div className="row tiny dim mt-4">
            <span>0%</span><span className="spacer" />
            <span>Threshold {HEALTH_THRESHOLD}%</span><span className="spacer" />
            <span>100%</span>
          </div>
        </div>

        {track.health < HEALTH_THRESHOLD && (
          <div className="mb-16">
            <Callout tone={band === 'critical' ? 'crit' : 'warn'}>
              <strong>{band === 'critical' ? 'Critical asset condition. ' : 'Asset condition below threshold. '}</strong>
              {track.currentIssue}
            </Callout>
          </div>
        )}

        <div className="grid grid-3 mb-16" style={{ gap: 8 }}>
          <LiveTile label="Current block status" value={track.currentBlockStatus} />
          <LiveTile label="Next available block window" value={track.nextBlockWindow} />
          <LiveTile label="Trains expected / day" value={`${track.trainsPerDay} trains`} />
          <LiveTile label="Corridor availability" value={track.corridorAvailability} />
          <LiveTile label="Asset availability" value={`${track.assetAvailability}%`} />
          <LiveTile label="Open block requests" value={`${relatedRequests.filter((r) => r.status !== REQUEST_STATUS.REJECTED).length} in BDMS`} />
        </div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} />

        <div className="mt-16">
          {tab === 'overview' && (
            <>
              <div className="grid grid-2" style={{ gap: 14 }}>
                <div>
                  <div className="section-label mb-8">Section identification</div>
                  <KV k="Section number" v={<span className="mono">{track.id}</span>} />
                  <KV k="Track ID" v={<span className="mono">{track.trackId}</span>} />
                  <KV k="Route / corridor" v={`${corridor.id} · ${corridor.shortName}`} />
                  <KV k="Between" v={`${STATION_BY_CODE[track.from].name} – ${STATION_BY_CODE[track.to].name}`} />
                  <KV k="Chainage" v={<span className="mono">{track.chainage}</span>} />
                  <KV k="Length" v={`${track.lengthKm} km`} />
                  <KV k="Line configuration" v={track.lineConfig} />
                  <KV k="Gauge" v={track.gauge} />
                  <KV k="Sectional speed" v={`${track.sectionalSpeed} kmph`} />
                </div>
                <div>
                  <div className="section-label mb-8">Condition & maintenance</div>
                  <KV k="Current status" v={<Badge>{track.status}</Badge>} />
                  <KV k="Health metric" v={<HealthValue value={track.health} />} />
                  <KV k="Health threshold" v={`${HEALTH_THRESHOLD}%`} />
                  <KV k="Asset availability" v={`${track.assetAvailability}%`} />
                  <KV k="Maintenance frequency" v={track.maintenanceFrequency} />
                  <KV k="Last inspection" v={track.lastInspection} />
                  <KV k="Next scheduled maintenance" v={track.nextScheduledMaintenance} />
                  <KV k="Last modified" v={track.lastModified} />
                  <KV k="Section in charge" v={track.inCharge} />
                </div>
              </div>

              <div className="divider" />
              <div className="section-label mb-8">Current issue</div>
              <div style={{ fontSize: 12.5 }}>{track.currentIssue}</div>

              {track.overdue.length > 0 && (
                <>
                  <div className="divider" />
                  <div className="section-label mb-8">Overdue maintenance</div>
                  {track.overdue.map((o) => (
                    <div key={o.task} className="defect-row HIGH">
                      <DeptTag dept={o.dept} />
                      <div className="grow">
                        <div style={{ fontSize: 12.5 }}>{o.task}</div>
                        <div className="tiny dim">Due {o.dueOn} · source {o.system}</div>
                      </div>
                      <Badge tone="crit">{o.overdueDays} d overdue</Badge>
                    </div>
                  ))}
                </>
              )}

              {relatedTickets.length > 0 && (
                <>
                  <div className="divider" />
                  <div className="section-label mb-8">Inspection tickets on this section</div>
                  {relatedTickets.map((t) => (
                    <div key={t.id} className="defect-row MEDIUM">
                      <div className="grow">
                        <div className="row gap-8">
                          <span className="mono" style={{ fontSize: 11.5 }}>{t.id}</span>
                          <Badge>{t.status}</Badge>
                        </div>
                        <div className="tiny dim mt-4">{t.reason} · raised {t.raisedOn} by {t.raisedBy}</div>
                      </div>
                      <Badge>{t.urgency}</Badge>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {tab === 'ENGG' && (
            <DeptCard
              deptId="ENGG"
              extra={<div className="mb-12"><Callout tone={track.engineering.tqi > 250 ? 'crit' : track.engineering.tqi > 200 ? 'warn' : 'ok'} icon="wrench">
                Track condition: <strong>{track.engineering.condition}</strong>
              </Callout></div>}
              data={{
                'Track condition': track.engineering.condition,
                'Track Quality Index': `${track.engineering.tqi} (lower is better)`,
                'Rails': track.engineering.rails,
                'Ballast': track.engineering.ballast,
                'Track defects': track.defects.filter((d) => d.dept === 'ENGG').length
                  ? `${track.defects.filter((d) => d.dept === 'ENGG').length} open — see Defects tab`
                  : 'Nil open defects',
                'Maintenance status': track.engineering.maintenanceStatus,
                'Last engineering inspection': track.engineering.lastInspection,
                'Upcoming engineering maintenance': track.engineering.upcoming,
              }}
            />
          )}

          {tab === 'SNT' && (
            <DeptCard
              deptId="SNT"
              extra={<div className="mb-12"><div className="row gap-12">
                <div className="grow">
                  <div className="section-label mb-8">Signal health</div>
                  <HealthBar value={track.signalling.health} />
                </div>
                <HealthValue value={track.signalling.health} size={18} />
              </div></div>}
              data={{
                'Signal health': `${track.signalling.health}%`,
                'Signal status': track.signalling.status,
                'Interlocking': track.signalling.interlocking,
                'Axle counters': track.signalling.axleCounters,
                'Signal defects': track.defects.filter((d) => d.dept === 'SNT').length
                  ? `${track.defects.filter((d) => d.dept === 'SNT').length} open — see Defects tab`
                  : 'Nil open defects',
                'Signal maintenance status': track.signalling.maintenanceStatus,
                'Last signalling inspection': track.signalling.lastInspection,
                'Upcoming signalling maintenance': track.signalling.upcoming,
              }}
            />
          )}

          {tab === 'TRD' && (
            <DeptCard
              deptId="TRD"
              extra={<div className="mb-12"><div className="row gap-12">
                <div className="grow">
                  <div className="section-label mb-8">Traction equipment health</div>
                  <HealthBar value={track.traction.health} />
                </div>
                <HealthValue value={track.traction.health} size={18} />
              </div></div>}
              data={{
                'Traction equipment status': track.traction.status,
                'OHE configuration': track.traction.ohe,
                'Pantograph incidents': track.traction.pantographCheck,
                'Electrical defects': track.defects.filter((d) => d.dept === 'TRD').length
                  ? `${track.defects.filter((d) => d.dept === 'TRD').length} open — see Defects tab`
                  : 'Nil open defects',
                'Maintenance status': track.traction.maintenanceStatus,
                'Last traction inspection': track.traction.lastInspection,
                'Upcoming traction maintenance': track.traction.upcoming,
              }}
            />
          )}

          {tab === 'defects' && (
            <>
              <div className="section-label mb-8">
                Open defects — integrated from TMS / SMMS / TDMS
              </div>
              {track.defects.length === 0 && <div className="empty">No open defects recorded on this section.</div>}
              {track.defects.map((d) => (
                <div key={d.id} className={`defect-row ${d.severity}`}>
                  <DeptTag dept={d.dept} />
                  <div className="grow">
                    <div style={{ fontSize: 12.5 }}>{d.description}</div>
                    <div className="tiny dim mt-4">
                      <span className="mono">{d.id}</span> · reported {d.reportedOn} · source {d.system} · {d.status}
                    </div>
                  </div>
                  <Badge tone={d.severity === 'CRITICAL' ? 'crit' : d.severity === 'HIGH' ? 'warn' : 'info'}>{d.severity}</Badge>
                </div>
              ))}
            </>
          )}

          {tab === 'ops' && (
            <>
              <div className="section-label mb-8">Block windows published by the Control Office</div>
              {windows.map((w) => (
                <div key={w.id} className="defect-row" style={{ borderLeftColor: w.coa === 'Available' ? 'var(--ok)' : 'var(--warn)' }}>
                  <div className="grow">
                    <div className="row gap-8">
                      <span className="mono bold">{w.start} – {w.end}</span>
                      <Badge tone={w.coa === 'Available' ? 'ok' : w.coa === 'Restricted' ? 'warn' : 'crit'}>{w.coa}</Badge>
                    </div>
                    <div className="tiny dim mt-4">{w.note}</div>
                  </div>
                  <div className="right tiny">
                    <div><span className="mono">{w.express}</span> express</div>
                    <div><span className="mono">{w.passenger}</span> passenger</div>
                    <div><span className="mono">{w.goods}</span> goods</div>
                  </div>
                </div>
              ))}

              <div className="divider" />
              <div className="section-label mb-8">Goods train forecast — {corridor.id}</div>
              <KV k="Rakes per night" v={`${forecast.rakesPerNight} rakes`} />
              <KV k="Forecast tonnage" v={forecast.tonnage} />
              <KV k="Peak hours" v={forecast.peakHours} />
              <KV k="Priority rakes" v={`${forecast.priorityRakes}`} />
              <KV k="Control note" v={forecast.note} />

              <div className="divider" />
              <div className="section-label mb-8">Working time table extract</div>
              <table className="tbl">
                <thead>
                  <tr><th>Train</th><th>Description</th><th>Type</th><th>Time</th><th>Dir</th></tr>
                </thead>
                <tbody>
                  {timetable.map((t) => (
                    <tr key={t.no}>
                      <td className="mono">{t.no}</td>
                      <td>{t.name}</td>
                      <td><Badge tone={t.type === 'EXPRESS' ? 'crit' : t.type === 'PASSENGER' ? 'info' : 'neutral'}>{t.type}</Badge></td>
                      <td className="mono">{t.time}</td>
                      <td className="mono">{t.dir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <footer className="drawer-foot">
        <button className="btn primary" onClick={() => onRaiseTicket(track)}>
          <Icon name="ticket" /> Raise Inspection Ticket
        </button>
        <span className="tiny dim">Section details will be attached to the ticket automatically</span>
        <span className="spacer" />
        <button className="btn ghost" onClick={onClose}>Close</button>
      </footer>
    </Drawer>
  );
}
