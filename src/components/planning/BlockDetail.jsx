import { TRACK_BY_ID } from '../../data/tracks.js';
import { CORRIDOR_BY_ID } from '../../data/network.js';
import { TIMETABLE } from '../../data/trains.js';
import { formatDate, formatDuration, toMinutes } from '../../lib/format.js';
import { Badge, CloseButton, DeptTag, Drawer, HealthBar, HealthValue, Icon, KV, ScorePill } from '../common/UI.jsx';

const REASON_ICON = {
  MERGE: 'layers', PRIORITY: 'engine', WINDOW: 'clock',
  ALTERNATIVE: 'filter', GOODS: 'train', SINGLE: 'list', EXCLUSIVE: 'alert',
};

/** 24-hour strip showing the chosen block against the train paths of the day. */
export function DayTimeline({ block, trains = [] }) {
  const startPct = (toMinutes(block.start) / 1440) * 100;
  const widthPct = (block.durationMin / 1440) * 100;
  const wrapped = startPct + widthPct > 100;

  return (
    <div className="tl">
      {Array.from({ length: 12 }, (_, i) => i * 2).map((h) => (
        <div key={h} className="tl-hour" style={{ left: `${(h / 24) * 100}%` }}>
          <span>{String(h).padStart(2, '0')}</span>
        </div>
      ))}
      {trains.map((t, i) => (
        <div
          key={`${t.no}-${i}`}
          className="tl-train"
          title={`${t.no} ${t.name} — ${t.time}`}
          style={{
            left: `${(toMinutes(t.time) / 1440) * 100}%`,
            background: t.type === 'EXPRESS' ? '#e0553a' : t.type === 'PASSENGER' ? '#4a9fdc' : '#8a929e',
          }}
        />
      ))}
      <div
        className="tl-band block"
        style={{ left: `${startPct}%`, width: `${Math.min(widthPct, 100 - startPct)}%` }}
      >
        <span className="mono" style={{ fontSize: 9, whiteSpace: 'nowrap' }}>{block.start}–{block.end}</span>
      </div>
      {wrapped && (
        <div className="tl-band block" style={{ left: 0, width: `${startPct + widthPct - 100}%` }} />
      )}
    </div>
  );
}

export default function BlockDetail({ block, onClose }) {
  if (!block) return null;
  const track = TRACK_BY_ID[block.section];
  const corridor = CORRIDOR_BY_ID[block.corridor];
  const isAI = block.source === 'OPTIMISED'; // not "AI-OPTIMISED" — see packages/contracts/docs/scoring.md
  const totalTrains = block.trainsAffected
    ?? block.trains.express + block.trains.passenger + block.trains.goods;
  // Sanctioned blocks carry no engine-evaluated window, so fall back to the
  // corridor's working time table for the traffic strip.
  const stripTrains = block.window?.trains || TIMETABLE[block.corridor] || [];

  return (
    <Drawer open={!!block} onClose={onClose} wide>
      <header className="drawer-head">
        <div className="row gap-12">
          <div>
            <div className="row gap-8">
              <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{block.id}</span>
              <Badge>{block.state}</Badge>
              {isAI && <Badge tone="ok" dot>OPTIMISED</Badge>}
              {block.merged && <Badge tone="ok">MULTI-DEPARTMENT</Badge>}
            </div>
            <div style={{ fontSize: 13, marginTop: 3 }}>
              <span className="mono bold">{block.section}</span> · {track?.name || block.sectionName}
            </div>
            <div className="tiny dim mt-4">
              {formatDate(block.date)} · {block.start}–{block.end} · {formatDuration(block.durationMin)} · {corridor?.name}
            </div>
          </div>
          <span className="spacer" />
          <div className="right">
            <div className="tiny dim">PRIORITY</div>
            <ScorePill score={block.priorityScore} band={block.priority} />
          </div>
          <CloseButton onClick={onClose} />
        </div>
      </header>

      <div className="drawer-body">
        <div className="grid grid-4 mb-16" style={{ gap: 8 }}>
          <div className="live-tile"><div className="lt-label">Start</div><div className="lt-value mono">{block.start}</div></div>
          <div className="live-tile"><div className="lt-label">End</div><div className="lt-value mono">{block.end}</div></div>
          <div className="live-tile"><div className="lt-label">Duration</div><div className="lt-value mono">{formatDuration(block.durationMin)}</div></div>
          <div className="live-tile"><div className="lt-label">Trains affected</div><div className="lt-value mono">{totalTrains}</div></div>
        </div>

        {isAI && block.savedMin > 0 && (
          <div className="callout ok mb-16">
            <span className="ico"><Icon name="check" size={14} /></span>
            <div>
              <strong>{formatDuration(block.savedMin)} of block time released. </strong>
              Working these {block.tasks.length} activities serially would have needed {formatDuration(block.serialMin)};
              coordinated in one block they need {formatDuration(block.durationMin)}.
            </div>
          </div>
        )}

        <div className="section-label mb-8">Block window against the day's traffic</div>
        <DayTimeline block={block} trains={stripTrains} />
        <div className="row gap-16 mt-8 tiny dim">
          <span className="row gap-4"><i style={{ width: 8, height: 8, background: '#e0553a', display: 'inline-block' }} /> Express</span>
          <span className="row gap-4"><i style={{ width: 8, height: 8, background: '#4a9fdc', display: 'inline-block' }} /> Passenger</span>
          <span className="row gap-4"><i style={{ width: 8, height: 8, background: '#8a929e', display: 'inline-block' }} /> Goods</span>
          <span className="row gap-4"><i style={{ width: 12, height: 8, background: 'rgba(224,161,58,0.5)', border: '1px solid var(--accent)', display: 'inline-block' }} /> Block</span>
        </div>

        <div className="divider" />
        <div className="section-label mb-8">Maintenance tasks in this block</div>
        {block.tasks.map((t) => (
          <div key={t.requestId} className="defect-row" style={{ borderLeftColor: t.dept === 'ENGG' ? 'var(--engg)' : t.dept === 'SNT' ? 'var(--snt)' : 'var(--trd)' }}>
            <DeptTag dept={t.dept} full />
            <div className="grow">
              <div style={{ fontSize: 12.5 }}>{t.activity}</div>
              <div className="tiny dim mt-4">
                <span className="mono">{t.requestId}</span>
                {t.durationMin ? ` · ${formatDuration(t.durationMin)} of work` : ''}
              </div>
            </div>
            {t.score != null && <ScorePill score={t.score} band={t.band} />}
          </div>
        ))}

        <div className="divider" />
        <div className="grid grid-2" style={{ gap: 16 }}>
          <div>
            <div className="section-label mb-8">Block record</div>
            <KV k="Block ID" v={<span className="mono">{block.id}</span>} />
            <KV k="Date" v={formatDate(block.date)} />
            <KV k="Section" v={<span className="mono bold">{block.section}</span>} />
            <KV k="Corridor" v={`${block.corridor} · ${corridor?.shortName}`} />
            <KV k="Start / end" v={<span className="mono">{block.start} – {block.end}</span>} />
            <KV k="Duration" v={formatDuration(block.durationMin)} />
            <KV k="Departments" v={<div className="row gap-4">{block.depts.map((d) => <DeptTag key={d} dept={d} />)}</div>} />
            <KV k="Priority" v={<Badge tone={block.priority === 'CRITICAL' ? 'crit' : block.priority === 'HIGH' ? 'warn' : 'info'}>{block.priority}</Badge>} />
            <KV k="Status" v={<Badge>{block.state}</Badge>} />
            <KV k="Source" v={block.source} />
          </div>
          <div>
            <div className="section-label mb-8">Operational impact</div>
            <KV k="Express paths" v={<span className="mono">{block.trains.express}</span>} />
            <KV k="Passenger paths" v={<span className="mono">{block.trains.passenger}</span>} />
            <KV k="Goods rakes" v={<span className="mono">{block.trains.goods}</span>} />
            <KV k="Total trains affected" v={<span className="mono bold">{totalTrains}</span>} />
            <KV k="Operational impact" v={block.impact} />
            <KV k="Asset health" v={<HealthValue value={block.assetHealth} />} />
            {block.assetAvailability && <KV k="Asset availability" v={`${block.assetAvailability}%`} />}
            <div className="mt-8"><HealthBar value={block.assetHealth} height={7} /></div>
          </div>
        </div>

        {isAI && block.reasoning && (
          <>
            <div className="divider" />
            <div className="section-label mb-8">Engine reasoning</div>
            {block.reasoning.map((r, i) => (
              <div key={i} className="defect-row" style={{ borderLeftColor: 'var(--accent)' }}>
                <span style={{ color: 'var(--accent)', marginTop: 2 }}><Icon name={REASON_ICON[r.type] || 'list'} size={13} /></span>
                <div className="grow">
                  <div className="tiny upper" style={{ color: 'var(--text-3)', letterSpacing: '0.09em' }}>{r.type}</div>
                  <div style={{ fontSize: 12.5, marginTop: 2 }}>{r.text}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {isAI && block.alternatives && (
          <>
            <div className="divider" />
            <div className="section-label mb-8">Candidate windows evaluated (Control Office)</div>
            <table className="tbl">
              <thead>
                <tr><th>Window</th><th>Capacity</th><th>Express</th><th>Passenger</th><th>Goods</th><th>Disruption index</th><th>COA status</th><th>Decision</th></tr>
              </thead>
              <tbody>
                {block.alternatives.map((w) => (
                  <tr key={w.id} className={w.id === block.window.id ? 'selected' : ''}>
                    <td className="mono">{w.start}–{w.end}</td>
                    <td className="mono">{formatDuration(w.capacityMin)}</td>
                    <td className="mono">{w.counts.express}</td>
                    <td className="mono">{w.counts.passenger}</td>
                    <td className="mono">{w.counts.goods}</td>
                    <td className="mono bold" style={{ color: w.id === block.window.id ? '#6ed49a' : 'var(--text-2)' }}>{w.disruption}</td>
                    <td><Badge tone={w.coa === 'Available' ? 'ok' : w.coa === 'Restricted' ? 'warn' : 'crit'}>{w.coa}</Badge></td>
                    <td>
                      {w.id === block.window.id
                        ? <Badge tone="ok">SELECTED</Badge>
                        : <span className="tiny dim">{!w.fits ? 'Too short' : 'Higher disruption'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tiny dim mt-8">
              Disruption index weighs express paths ×4, passenger ×3 and goods ×1.5 against the corridor
              density published by the Control Office, with penalties for restricted windows.
            </div>
          </>
        )}
      </div>

      <footer className="drawer-foot">
        <span className="tiny dim">
          {isAI ? 'Generated by the Automatic Block Planning Engine' : 'Sanctioned through BDMS'}
        </span>
        <span className="spacer" />
        <button className="btn ghost" onClick={onClose}>Close</button>
      </footer>
    </Drawer>
  );
}
