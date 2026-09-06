import { useState } from 'react';
import { CORRIDORS, CORRIDOR_BY_ID } from '../data/network.js';
import { CORRIDOR_STATUS, GOODS_FORECAST, TIMETABLE, getWindowsForSection } from '../data/trains.js';
import { TRACKS } from '../data/tracks.js';
import { toMinutes } from '../lib/format.js';
import { Badge, Icon, Panel, Stat, Tabs } from '../components/common/UI.jsx';

function CorridorTimeline({ corridorId }) {
  const trains = TIMETABLE[corridorId] || [];
  const windows = getWindowsForSection('__none__', corridorId);
  return (
    <div>
      <div className="tl" style={{ height: 46 }}>
        {Array.from({ length: 12 }, (_, i) => i * 2).map((h) => (
          <div key={h} className="tl-hour" style={{ left: `${(h / 24) * 100}%` }}>
            <span>{String(h).padStart(2, '0')}</span>
          </div>
        ))}
        {windows.map((w) => {
          const s = (toMinutes(w.start) / 1440) * 100;
          const e = (toMinutes(w.end) / 1440) * 100;
          const width = e > s ? e - s : 100 - s;
          return (
            <div
              key={w.id}
              className="tl-band window"
              style={{ left: `${s}%`, width: `${width}%`, top: 24, height: 16, opacity: w.coa === 'Available' ? 1 : 0.45 }}
              title={`${w.start}–${w.end} · ${w.coa} · ${w.note}`}
            >
              <span className="mono" style={{ fontSize: 8.5 }}>{w.id}</span>
            </div>
          );
        })}
        {trains.map((t, i) => (
          <div
            key={`${t.no}-${i}`}
            className="tl-train"
            style={{
              left: `${(toMinutes(t.time) / 1440) * 100}%`,
              height: 14, top: 6,
              background: t.type === 'EXPRESS' ? '#e0553a' : t.type === 'PASSENGER' ? '#4a9fdc' : '#8a929e',
            }}
            title={`${t.no} ${t.name} — ${t.time} (${t.type})`}
          />
        ))}
      </div>
      <div className="row gap-16 mt-8 tiny dim wrap">
        <span className="row gap-4"><i style={{ width: 8, height: 8, background: '#e0553a', display: 'inline-block' }} /> Express</span>
        <span className="row gap-4"><i style={{ width: 8, height: 8, background: '#4a9fdc', display: 'inline-block' }} /> Passenger</span>
        <span className="row gap-4"><i style={{ width: 8, height: 8, background: '#8a929e', display: 'inline-block' }} /> Goods</span>
        <span className="row gap-4"><i style={{ width: 14, height: 8, background: 'rgba(67,169,111,0.3)', border: '1px solid rgba(67,169,111,0.6)', display: 'inline-block' }} /> Block window published by COA</span>
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const [corridor, setCorridor] = useState('GC-1');
  const c = CORRIDOR_BY_ID[corridor];
  const forecast = GOODS_FORECAST[corridor];
  const status = CORRIDOR_STATUS.find((s) => s.corridor === corridor);
  const windows = getWindowsForSection('__none__', corridor);
  const sections = TRACKS.filter((t) => t.corridor === corridor);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Train Operations</div>
          <div className="page-sub">
            Working time table, goods forecast and corridor block availability received from the Control Office Application
          </div>
        </div>
        <span className="spacer" />
        <Badge tone="ok" dot>COA CONNECTED · 09:44 hrs</Badge>
      </div>

      <div className="grid grid-4 mb-16">
        <Stat tone="info" label="Trains running (division)" value={CORRIDOR_STATUS.reduce((s, x) => s + x.trainsRunning, 0)} foot="Currently on run" />
        <Stat tone="accent" label="Goods rakes forecast / night" value={Object.values(GOODS_FORECAST).reduce((s, g) => s + g.rakesPerNight, 0)} foot="Across all corridors" />
        <Stat tone="warn" label="Corridors with a block in force" value={CORRIDOR_STATUS.filter((s) => s.sectionsBlocked > 0).length} foot="Traffic being regulated" />
        <Stat tone="ok" label="Average punctuality" value={(CORRIDOR_STATUS.reduce((s, x) => s + x.punctuality, 0) / CORRIDOR_STATUS.length).toFixed(1)} unit="%" foot="Divisional average" />
      </div>

      <Tabs
        tabs={CORRIDORS.map((x) => ({ id: x.id, label: `${x.id} · ${x.shortName}`, color: x.accent }))}
        value={corridor}
        onChange={setCorridor}
      />

      <div className="mt-16 grid grid-2 mb-16">
        <Panel title={`${c.name} — 24 hour traffic profile`} icon="train">
          <CorridorTimeline corridorId={corridor} />
          <div className="divider" />
          <div className="grid grid-3">
            <div><div className="section-label">Classification</div><div className="tiny mt-4">{c.classification}</div></div>
            <div><div className="section-label">Route length</div><div className="mono bold mt-4">{c.routeKm} km</div></div>
            <div><div className="section-label">Traffic density</div><div className="tiny mt-4">{c.trafficDensity}</div></div>
          </div>
        </Panel>

        <Panel title="Goods train forecast" icon="layers"
          right={<Badge tone={forecast.trend === 'up' ? 'warn' : forecast.trend === 'down' ? 'ok' : 'neutral'}>{forecast.trend.toUpperCase()}</Badge>}>
          <div className="grid grid-2 mb-12" style={{ gap: 8 }}>
            <div className="live-tile"><div className="lt-label">Rakes per night</div><div className="lt-value mono">{forecast.rakesPerNight}</div></div>
            <div className="live-tile"><div className="lt-label">Forecast tonnage</div><div className="lt-value mono">{forecast.tonnage}</div></div>
            <div className="live-tile"><div className="lt-label">Peak hours</div><div className="lt-value mono">{forecast.peakHours}</div></div>
            <div className="live-tile"><div className="lt-label">Priority rakes</div><div className="lt-value mono">{forecast.priorityRakes}</div></div>
          </div>
          <div className="callout info">
            <span className="ico"><Icon name="train" size={14} /></span>
            <div>{forecast.note}</div>
          </div>
          <div className="divider" />
          <div className="section-label mb-8">Control office position</div>
          <div className="dl-row"><span className="k">Trains running</span><span className="v mono">{status.trainsRunning}</span></div>
          <div className="dl-row"><span className="k">Punctuality</span><span className="v mono">{status.punctuality}%</span></div>
          <div className="dl-row"><span className="k">Sections blocked</span><span className="v mono">{status.sectionsBlocked}</span></div>
          <div className="dl-row"><span className="k">Controller note</span><span className="v tiny">{status.controllerNote}</span></div>
        </Panel>
      </div>

      <div className="grid grid-2 mb-16">
        <Panel title="Working time table extract" icon="clock" bodyClass="tight">
          <table className="tbl">
            <thead><tr><th>Train no.</th><th>Description</th><th>Type</th><th>Time</th><th>Direction</th><th>Halts / remarks</th></tr></thead>
            <tbody>
              {(TIMETABLE[corridor] || []).map((t) => (
                <tr key={t.no}>
                  <td className="mono bold">{t.no}</td>
                  <td>{t.name}</td>
                  <td><Badge tone={t.type === 'EXPRESS' ? 'crit' : t.type === 'PASSENGER' ? 'info' : 'neutral'}>{t.type}</Badge></td>
                  <td className="mono">{t.time}</td>
                  <td className="mono">{t.dir}</td>
                  <td className="tiny muted">{t.halts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Corridor block availability" icon="calendar" bodyClass="tight">
          <table className="tbl">
            <thead><tr><th>Window</th><th>Period</th><th>Express</th><th>Passenger</th><th>Goods</th><th>Density index</th><th>COA status</th></tr></thead>
            <tbody>
              {windows.map((w) => (
                <tr key={w.id}>
                  <td className="mono bold">{w.id}</td>
                  <td className="mono nowrap">{w.start}–{w.end}</td>
                  <td className="mono">{w.express}</td>
                  <td className="mono">{w.passenger}</td>
                  <td className="mono">{w.goods}</td>
                  <td className="mono">{w.densityIndex}</td>
                  <td><Badge tone={w.coa === 'Available' ? 'ok' : w.coa === 'Restricted' ? 'warn' : 'crit'}>{w.coa}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 12px' }}>
            {windows.map((w) => (
              <div key={w.id} className="tiny dim" style={{ marginBottom: 3 }}>
                <span className="mono" style={{ color: 'var(--accent)' }}>{w.id}</span> — {w.note}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title={`Sections on ${c.id} — ${sections.length}`} icon="map" bodyClass="tight">
        <table className="tbl">
          <thead><tr><th>Section</th><th>Route</th><th>Length</th><th>Trains / day</th><th>GMT</th><th>Status</th><th>Corridor availability</th></tr></thead>
          <tbody>
            {sections.map((t) => (
              <tr key={t.id}>
                <td className="mono bold">{t.id}</td>
                <td>{t.name}</td>
                <td className="mono">{t.lengthKm} km</td>
                <td className="mono">{t.trainsPerDay}</td>
                <td className="mono">{t.gmt}</td>
                <td><Badge>{t.status}</Badge></td>
                <td className="tiny muted">{t.corridorAvailability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
