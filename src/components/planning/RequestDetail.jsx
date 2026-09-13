import { useMemo } from 'react';
import { TRACK_BY_ID, DEPARTMENTS, healthLabel } from '../../data/tracks.js';
import { CORRIDOR_BY_ID } from '../../data/network.js';
import { GOODS_FORECAST, getWindowsForSection, trainsInWindow } from '../../data/trains.js';
import { REQUEST_STATUS } from '../../data/blockRequests.js';
import { formatDate, formatDuration } from '../../lib/format.js';
import { Badge, CloseButton, DeptTag, Drawer, HealthBar, HealthValue, Icon, KV, ScorePill, Callout } from '../common/UI.jsx';

export function PriorityFactors({ ai }) {
  return (
    <div>
      {ai.factors.map((f) => (
        <div key={f.key} className="factor-row" title={f.note}>
          <span className="tiny" style={{ color: 'var(--text-2)' }}>{f.label}</span>
          <div className="factor-bar"><i style={{ width: `${f.value}%` }} /></div>
          <span className="mono tiny right">
            {f.value} <span className="dim">×{f.weight}</span>
          </span>
        </div>
      ))}
      <div className="dl-row" style={{ marginTop: 6, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
        <span className="k">Weighted priority score</span>
        <span className="v"><ScorePill score={ai.score} band={ai.band} /></span>
      </div>
    </div>
  );
}

export default function RequestDetail({ request, requests, onClose, onApprove, onReject }) {
  const track = request ? TRACK_BY_ID[request.section] : null;

  // request.priority is the baked ScoringOutput score record (src/mocks/requests.json — R3);
  // this component never computes a score itself. See packages/contracts/docs/scoring.md.
  const ai = useMemo(() => (request?.priority
    ? { score: request.priority.priority, band: request.priority.band, factors: request.priority.factors }
    : null), [request]);

  const related = useMemo(() => {
    if (!request) return [];
    return requests.filter(
      (r) => r.section === request.section && r.requestedDate === request.requestedDate && r.id !== request.id,
    );
  }, [request, requests]);

  const trainsDuring = useMemo(() => {
    if (!request || !track) return [];
    return trainsInWindow(track.corridor, request.requestedStart, request.requestedEnd);
  }, [request, track]);

  if (!request || !track) return null;

  const corridor = CORRIDOR_BY_ID[track.corridor];
  const windows = getWindowsForSection(track.id, track.corridor);
  const forecast = GOODS_FORECAST[track.corridor];

  return (
    <Drawer open={!!request} onClose={onClose} wide>
      <header className="drawer-head">
        <div className="row gap-12">
          <div>
            <div className="row gap-8">
              <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{request.id}</span>
              <Badge>{request.status}</Badge>
              <DeptTag dept={request.dept} full />
            </div>
            <div style={{ fontSize: 13.5, marginTop: 3, fontWeight: 550 }}>{request.activity}</div>
            <div className="tiny dim mt-4">
              Raised by {request.requestedBy} on {request.requestedOn} · source {request.system}
            </div>
          </div>
          <span className="spacer" />
          <div className="right">
            <div className="tiny dim">PRIORITY</div>
            <ScorePill score={ai.score} band={ai.band} />
          </div>
          <CloseButton onClick={onClose} />
        </div>
      </header>

      <div className="drawer-body">
        {request.compatibility === 'EXCLUSIVE' && (
          <div className="mb-16">
            <Callout tone="warn">
              <strong>Exclusive occupation required. </strong>{request.exclusiveReason}
            </Callout>
          </div>
        )}
        {related.length > 0 && (
          <div className="mb-16">
            <Callout tone="ok" icon="layers">
              <strong>{related.length} other department{related.length > 1 ? 's have' : ' has'} requested a block on {request.section} for the same date. </strong>
              The planning engine can combine this work into a single block.
            </Callout>
          </div>
        )}

        <div className="grid grid-2" style={{ gap: 16 }}>
          <div>
            <div className="section-label mb-8">Block request</div>
            <KV k="Request ID" v={<span className="mono">{request.id}</span>} />
            <KV k="Track / section" v={<span className="mono bold">{request.section} · {track.trackId}</span>} />
            <KV k="Section name" v={track.name} />
            <KV k="Corridor" v={`${corridor.id} · ${corridor.name}`} />
            <KV k="Department" v={<DeptTag dept={request.dept} full />} />
            <KV k="Maintenance activity" v={request.activity} />
            <KV k="Requested date" v={formatDate(request.requestedDate)} />
            <KV k="Requested time" v={<span className="mono">{request.requestedStart} – {request.requestedEnd}</span>} />
            <KV k="Requested duration" v={formatDuration(request.durationMin)} />
            <KV k="Minimum duration" v={formatDuration(request.minDurationMin)} />
            <KV k="Power block required" v={request.powerBlock ? 'Yes — OHE isolation' : 'No'} />
            <KV k="Resources" v={request.resources} />
            <KV k="Machinery" v={request.machinery} />
          </div>

          <div>
            <div className="section-label mb-8">Assessment</div>
            <KV k="Criticality" v={<Badge tone={request.criticality === 'CRITICAL' ? 'crit' : request.criticality === 'HIGH' ? 'warn' : 'info'}>{request.criticality}</Badge>} />
            <KV k="Urgency" v={<Badge>{request.urgency}</Badge>} />
            <KV k="Safety impact" v={<Badge tone={request.safetyImpact === 'HIGH' ? 'crit' : 'info'}>{request.safetyImpact}</Badge>} />
            <KV k="Asset impact" v={`${request.assetImpact}/100`} />
            <KV k="Impact note" v={request.assetImpactNote} />
            <KV k="Overdue by" v={request.overdueDays ? <span style={{ color: '#ec8582' }}>{request.overdueDays} days</span> : 'Within schedule'} />
            <KV k="Current track health" v={<HealthValue value={track.health} />} />
            <KV k="Current track status" v={<Badge>{track.status}</Badge>} />
            <KV k="Asset availability" v={`${track.assetAvailability}%`} />
            <div className="mt-8"><HealthBar value={track.health} height={7} /></div>
            <div className="tiny dim mt-4">Health {track.health}% — {healthLabel(track.health)} · threshold 75%</div>
          </div>
        </div>

        <div className="divider" />
        <div className="section-label mb-8">Maintenance reason</div>
        <div style={{ fontSize: 12.5 }}>{request.description}</div>

        <div className="divider" />
        <div className="section-label mb-8">Prioritisation — how this score was reached</div>
        <PriorityFactors ai={ai} />

        <div className="divider" />
        <div className="section-label mb-8">Existing defects on {request.section}</div>
        {track.defects.length === 0 && <div className="tiny dim">No open defects recorded.</div>}
        {track.defects.map((d) => (
          <div key={d.id} className={`defect-row ${d.severity}`}>
            <DeptTag dept={d.dept} />
            <div className="grow">
              <div style={{ fontSize: 12.5 }}>{d.description}</div>
              <div className="tiny dim mt-4">
                <span className="mono">{d.id}</span> · {d.system} · reported {d.reportedOn}
                {request.linkedDefects.includes(d.id) && <span style={{ color: 'var(--accent)' }}> · linked to this request</span>}
              </div>
            </div>
            <Badge tone={d.severity === 'CRITICAL' ? 'crit' : d.severity === 'HIGH' ? 'warn' : 'info'}>{d.severity}</Badge>
          </div>
        ))}

        {track.overdue.length > 0 && (
          <>
            <div className="divider" />
            <div className="section-label mb-8">Overdue maintenance on this section</div>
            {track.overdue.map((o) => (
              <div key={o.task} className="defect-row HIGH">
                <DeptTag dept={o.dept} />
                <div className="grow">
                  <div style={{ fontSize: 12.5 }}>{o.task}</div>
                  <div className="tiny dim">Due {o.dueOn} · {o.system}</div>
                </div>
                <Badge tone="crit">{o.overdueDays} d</Badge>
              </div>
            ))}
          </>
        )}

        <div className="divider" />
        <div className="section-label mb-8">Train activity during the requested period ({request.requestedStart} – {request.requestedEnd})</div>
        {trainsDuring.length === 0 ? (
          <div className="callout ok"><span className="ico"><Icon name="check" size={14} /></span>
            <div>No booked passenger or express path falls inside the requested window on this corridor.</div>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr><th>Train</th><th>Description</th><th>Type</th><th>Time</th><th>Remarks</th></tr></thead>
            <tbody>
              {trainsDuring.map((t) => (
                <tr key={t.no}>
                  <td className="mono">{t.no}</td>
                  <td>{t.name}</td>
                  <td><Badge tone={t.type === 'EXPRESS' ? 'crit' : t.type === 'PASSENGER' ? 'info' : 'neutral'}>{t.type}</Badge></td>
                  <td className="mono">{t.time}</td>
                  <td className="tiny muted">{t.halts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="divider" />
        <div className="section-label mb-8">Corridor availability — {corridor.id}</div>
        {windows.map((w) => (
          <div key={w.id} className="dl-row">
            <span className="k mono">{w.start} – {w.end}</span>
            <span className="v row gap-8" style={{ justifyContent: 'flex-end' }}>
              <span className="tiny dim">{w.express}E / {w.passenger}P / {w.goods}G</span>
              <Badge tone={w.coa === 'Available' ? 'ok' : w.coa === 'Restricted' ? 'warn' : 'crit'}>{w.coa}</Badge>
            </span>
          </div>
        ))}
        <div className="tiny dim mt-8">
          Goods forecast: {forecast.rakesPerNight} rakes/night ({forecast.tonnage}), peak {forecast.peakHours}.
        </div>

        <div className="divider" />
        <div className="section-label mb-8">Related department activities on the same section &amp; date</div>
        {related.length === 0 ? (
          <div className="tiny dim">No other departmental demand for {formatDate(request.requestedDate)}.</div>
        ) : related.map((r) => (
          <div key={r.id} className="defect-row" style={{ borderLeftColor: DEPARTMENTS[r.dept].accent }}>
            <DeptTag dept={r.dept} />
            <div className="grow">
              <div style={{ fontSize: 12.5 }}>{r.activity}</div>
              <div className="tiny dim mt-4">
                <span className="mono">{r.id}</span> · {r.requestedStart}–{r.requestedEnd} · {formatDuration(r.durationMin)} · {r.criticality}
              </div>
            </div>
            <Badge>{r.status}</Badge>
          </div>
        ))}
      </div>

      <footer className="drawer-foot">
        {request.status === REQUEST_STATUS.SCHEDULED ? (
          <div className="callout ok" style={{ flex: 1 }}>
            <span className="ico"><Icon name="check" size={14} /></span>
            <div>This request has been scheduled into the optimised block plan.</div>
          </div>
        ) : (
          <>
            <button className="btn ok" onClick={() => onApprove(request.id)} disabled={request.status === REQUEST_STATUS.SELECTED}>
              <Icon name="check" /> {request.status === REQUEST_STATUS.SELECTED ? 'Selected for planning' : 'Approve / select for planning'}
            </button>
            <button className="btn danger" onClick={() => onReject(request.id)} disabled={request.status === REQUEST_STATUS.REJECTED}>
              <Icon name="close" /> Reject
            </button>
          </>
        )}
        <span className="spacer" />
        <button className="btn ghost" onClick={onClose}>Close</button>
      </footer>
    </Drawer>
  );
}
