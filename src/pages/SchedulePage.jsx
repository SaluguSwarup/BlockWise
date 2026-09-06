import { useMemo, useState } from 'react';
import { useApp } from '../context/AppState.jsx';
import { DEPARTMENTS } from '../data/tracks.js';
import { CORRIDORS } from '../data/network.js';
import { BLOCK_STATE } from '../data/plans.js';
import {
  addDays, addMonths, DAYS_SHORT, formatDate, formatDateShort, formatDuration,
  MONTHS, parseDate, startOfWeek, toISO,
} from '../lib/format.js';
import { Badge, DeptTag, Icon, Panel, ScorePill, Segmented, Stat } from '../components/common/UI.jsx';
import BlockDetail from '../components/planning/BlockDetail.jsx';

const TODAY = '2026-09-06';

function BlockCard({ block, onClick }) {
  const isAI = block.source === 'AI-OPTIMISED';
  return (
    <div
      className={`blk-card ${isAI ? 'ai' : 'sanctioned'} ${block.priority === 'CRITICAL' ? 'crit' : ''}`}
      onClick={() => onClick(block)}
    >
      <div className="row gap-6">
        <span className="bs mono">{block.section}</span>
        <span className="spacer" />
        {isAI && <span className="tiny" style={{ color: 'var(--accent)' }}>AI</span>}
      </div>
      <div className="bt">{block.start}–{block.end} · {formatDuration(block.durationMin)}</div>
      <div className="row gap-4 mt-4 wrap">
        {block.depts.map((d) => <DeptTag key={d} dept={d} />)}
      </div>
      <div className="tiny dim mt-4" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {block.tasks.map((t) => t.activity).join(' + ')}
      </div>
      <div className="row gap-4 mt-4">
        <Badge tone={block.priority === 'CRITICAL' ? 'crit' : block.priority === 'HIGH' ? 'warn' : 'info'}>{block.priority}</Badge>
        <span className="spacer" />
        <span className="tiny dim">{block.state}</span>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const { planBlocks, planResult } = useApp();
  const [mode, setMode] = useState('week');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(2026, 8, 7)));
  const [month, setMonth] = useState(() => new Date(2026, 8, 1));
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [corridorFilter, setCorridorFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [openBlock, setOpenBlock] = useState(null);

  const blocks = useMemo(() => planBlocks.filter((b) => {
    if (deptFilter !== 'ALL' && !b.depts.includes(deptFilter)) return false;
    if (corridorFilter !== 'ALL' && b.corridor !== corridorFilter) return false;
    if (sourceFilter === 'AI' && b.source !== 'AI-OPTIMISED') return false;
    if (sourceFilter === 'SANCTIONED' && b.source === 'AI-OPTIMISED') return false;
    return true;
  }), [planBlocks, deptFilter, corridorFilter, sourceFilter]);

  const byDate = useMemo(() => {
    const m = new Map();
    blocks.forEach((b) => {
      if (!m.has(b.date)) m.set(b.date, []);
      m.get(b.date).push(b);
    });
    m.forEach((v) => v.sort((a, b) => a.start.localeCompare(b.start)));
    return m;
  }, [blocks]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const weekBlocks = useMemo(
    () => weekDays.flatMap((d) => byDate.get(toISO(d)) || []),
    [weekDays, byDate],
  );

  const monthCells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const gridStart = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [month]);

  const monthBlocks = useMemo(
    () => blocks.filter((b) => {
      const d = parseDate(b.date);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    }),
    [blocks, month],
  );

  const scope = mode === 'week' ? weekBlocks : monthBlocks;
  const scopeMinutes = scope.reduce((s, b) => s + b.durationMin, 0);
  const aiBlocks = scope.filter((b) => b.source === 'AI-OPTIMISED');
  const multiDept = scope.filter((b) => b.depts.length > 1);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Block Schedule</div>
          <div className="page-sub">
            Sanctioned and AI-optimised blocks across short-term (weekly) and long-term (monthly) horizons
          </div>
        </div>
        <span className="spacer" />
        <Segmented
          value={mode}
          onChange={setMode}
          options={[{ value: 'week', label: 'Weekly plan' }, { value: 'month', label: 'Monthly plan' }]}
        />
      </div>

      <div className="grid grid-4 mb-16">
        <Stat tone="accent" label={mode === 'week' ? 'Blocks this week' : 'Blocks this month'} value={scope.length} foot={`${aiBlocks.length} AI-optimised`} />
        <Stat tone="info" label="Total block time" value={(scopeMinutes / 60).toFixed(1)} unit=" hr" foot="Corridor time committed" />
        <Stat tone="ok" label="Multi-department blocks" value={multiDept.length} foot="Coordinated across departments" />
        <Stat
          tone="warn"
          label="Block time saved"
          value={planResult ? planResult.metrics.savedHours : '—'}
          unit={planResult ? ' hr' : ''}
          foot={planResult ? 'From the committed optimisation' : 'Run the planning engine to optimise'}
        />
      </div>

      <div className="panel mb-12">
        <div className="panel-body" style={{ padding: '9px 12px' }}>
          <div className="row gap-12 wrap">
            <div className="row gap-8">
              <button className="btn sm ghost" onClick={() => (mode === 'week' ? setWeekStart(addDays(weekStart, -7)) : setMonth(addMonths(month, -1)))}>
                <Icon name="chevronL" size={12} />
              </button>
              <span className="bold" style={{ minWidth: 210, textAlign: 'center' }}>
                {mode === 'week'
                  ? `${formatDateShort(toISO(weekStart))} – ${formatDate(toISO(addDays(weekStart, 6)))}`
                  : `${MONTHS[month.getMonth()]} ${month.getFullYear()}`}
              </span>
              <button className="btn sm ghost" onClick={() => (mode === 'week' ? setWeekStart(addDays(weekStart, 7)) : setMonth(addMonths(month, 1)))}>
                <Icon name="chevronR" size={12} />
              </button>
              <button className="btn sm ghost" onClick={() => { setWeekStart(startOfWeek(new Date(2026, 8, 7))); setMonth(new Date(2026, 8, 1)); }}>
                Reset
              </button>
            </div>

            <span className="spacer" />

            <select className="select" style={{ width: 150, padding: '5px 9px' }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="ALL">All departments</option>
              {Object.values(DEPARTMENTS).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="select" style={{ width: 175, padding: '5px 9px' }} value={corridorFilter} onChange={(e) => setCorridorFilter(e.target.value)}>
              <option value="ALL">All corridors</option>
              {CORRIDORS.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.shortName}</option>)}
            </select>
            <select className="select" style={{ width: 165, padding: '5px 9px' }} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="ALL">All blocks</option>
              <option value="AI">AI-optimised only</option>
              <option value="SANCTIONED">Previously sanctioned</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------- weekly ------------------------------- */}
      {mode === 'week' && (
        <>
          <div className="week-grid mb-16">
            {weekDays.map((d, i) => {
              const iso = toISO(d);
              const dayBlocks = byDate.get(iso) || [];
              const mins = dayBlocks.reduce((s, b) => s + b.durationMin, 0);
              return (
                <div key={iso} className={`week-day ${iso === TODAY ? 'today' : ''}`}>
                  <div className="week-day-head">
                    <span className="section-label">{DAYS_SHORT[i]}</span>
                    <span className="mono bold">{String(d.getDate()).padStart(2, '0')}</span>
                    <span className="spacer" />
                    {dayBlocks.length > 0 && (
                      <span className="tiny dim mono">{(mins / 60).toFixed(1)}h</span>
                    )}
                  </div>
                  <div className="week-day-body">
                    {dayBlocks.length === 0 && <div className="tiny dim center" style={{ padding: '18px 0' }}>No block</div>}
                    {dayBlocks.map((b) => <BlockCard key={b.id} block={b} onClick={setOpenBlock} />)}
                  </div>
                </div>
              );
            })}
          </div>

          <Panel title={`Weekly block schedule — ${weekBlocks.length} blocks`} icon="calendar" bodyClass="tight">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th><th>Day</th><th>Block ID</th><th>Section</th><th>Corridor</th>
                  <th>Time</th><th>Duration</th><th>Departments</th><th>Maintenance activities</th>
                  <th>Priority</th><th>Status</th><th>Source</th>
                </tr>
              </thead>
              <tbody>
                {weekBlocks.map((b) => (
                  <tr key={b.id} className="clickable" onClick={() => setOpenBlock(b)}>
                    <td className="mono nowrap">{formatDate(b.date)}</td>
                    <td className="tiny">{DAYS_SHORT[(parseDate(b.date).getDay() + 6) % 7]}</td>
                    <td className="mono">{b.id}</td>
                    <td className="mono bold">{b.section}</td>
                    <td className="tiny">{b.corridor}</td>
                    <td className="mono nowrap">{b.start}–{b.end}</td>
                    <td className="mono nowrap">{formatDuration(b.durationMin)}</td>
                    <td><div className="row gap-4">{b.depts.map((d) => <DeptTag key={d} dept={d} />)}</div></td>
                    <td className="tiny" style={{ maxWidth: 260 }}>{b.tasks.map((t) => t.activity).join(' + ')}</td>
                    <td>{b.priorityScore ? <ScorePill score={b.priorityScore} band={b.priority} /> : <Badge>{b.priority}</Badge>}</td>
                    <td><Badge>{b.state}</Badge></td>
                    <td className="tiny">{b.source === 'AI-OPTIMISED' ? <Badge tone="ok">AI</Badge> : <span className="dim">BDMS</span>}</td>
                  </tr>
                ))}
                {weekBlocks.length === 0 && (
                  <tr><td colSpan={12}><div className="empty">No blocks scheduled in this week for the current filters.</div></td></tr>
                )}
              </tbody>
            </table>
          </Panel>
        </>
      )}

      {/* ------------------------------- monthly ------------------------------- */}
      {mode === 'month' && (
        <>
          <div className="panel mb-16">
            <div className="panel-body">
              <div className="month-grid" style={{ marginBottom: 4 }}>
                {DAYS_SHORT.map((d) => <div key={d} className="month-head-cell center">{d}</div>)}
              </div>
              <div className="month-grid">
                {monthCells.map((d) => {
                  const iso = toISO(d);
                  const out = d.getMonth() !== month.getMonth();
                  const dayBlocks = byDate.get(iso) || [];
                  return (
                    <div key={iso} className={`month-cell ${out ? 'out' : ''} ${iso === TODAY ? 'today' : ''}`}>
                      <div className="row">
                        <span className="month-date">{String(d.getDate()).padStart(2, '0')}</span>
                        <span className="spacer" />
                        {dayBlocks.length > 0 && <span className="tiny dim mono">{dayBlocks.length}</span>}
                      </div>
                      {dayBlocks.map((b) => (
                        <div
                          key={b.id}
                          className={`month-chip ${b.priority === 'CRITICAL' ? 'crit' : ''} ${b.source !== 'AI-OPTIMISED' ? 'sanctioned' : ''}`}
                          onClick={() => setOpenBlock(b)}
                          title={`${b.id} · ${b.section} · ${b.start}–${b.end} · ${b.depts.map((d) => DEPARTMENTS[d].abbr).join(', ')}`}
                        >
                          <span className="mono">{b.start}</span> {b.section} · {b.depts.map((d) => DEPARTMENTS[d].abbr).join('+')}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="row gap-16 mt-12 tiny dim wrap">
                <span className="row gap-6"><i style={{ width: 10, height: 10, borderLeft: '2px solid var(--accent)', background: 'var(--bg-input)', display: 'inline-block' }} /> AI-optimised block</span>
                <span className="row gap-6"><i style={{ width: 10, height: 10, borderLeft: '2px solid var(--text-3)', background: 'var(--bg-input)', display: 'inline-block' }} /> Previously sanctioned block</span>
                <span className="row gap-6"><i style={{ width: 10, height: 10, borderLeft: '2px solid var(--crit)', background: 'var(--bg-input)', display: 'inline-block' }} /> Critical priority</span>
              </div>
            </div>
          </div>

          <Panel title={`Monthly block plan — ${MONTHS[month.getMonth()]} ${month.getFullYear()} · ${monthBlocks.length} blocks`} icon="calendar" bodyClass="tight">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th><th>Block ID</th><th>Section</th><th>Corridor</th><th>Time</th>
                  <th>Duration</th><th>Departments</th><th>Maintenance activities</th>
                  <th>Priority</th><th>Trains</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...monthBlocks].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.start.localeCompare(b.start))).map((b) => (
                  <tr key={b.id} className="clickable" onClick={() => setOpenBlock(b)}>
                    <td className="mono nowrap">{formatDate(b.date)}</td>
                    <td className="mono">{b.id}</td>
                    <td className="mono bold">{b.section}</td>
                    <td className="tiny">{b.corridor}</td>
                    <td className="mono nowrap">{b.start}–{b.end}</td>
                    <td className="mono nowrap">{formatDuration(b.durationMin)}</td>
                    <td><div className="row gap-4">{b.depts.map((d) => <DeptTag key={d} dept={d} />)}</div></td>
                    <td className="tiny" style={{ maxWidth: 250 }}>{b.tasks.map((t) => t.activity).join(' + ')}</td>
                    <td>{b.priorityScore ? <ScorePill score={b.priorityScore} band={b.priority} /> : <Badge>{b.priority}</Badge>}</td>
                    <td className="mono tiny">{b.trains.express}E/{b.trains.passenger}P/{b.trains.goods}G</td>
                    <td><Badge>{b.state}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <div className="grid grid-3 mt-16">
            <Panel title="Monthly load by corridor" icon="train">
              {CORRIDORS.map((c) => {
                const list = monthBlocks.filter((b) => b.corridor === c.id);
                const mins = list.reduce((s, b) => s + b.durationMin, 0);
                return (
                  <div key={c.id} className="dl-row">
                    <span className="k row gap-6"><i style={{ width: 9, height: 9, background: c.accent, borderRadius: 2, display: 'inline-block' }} />{c.id} · {c.shortName}</span>
                    <span className="v mono">{list.length} blocks · {(mins / 60).toFixed(1)} hr</span>
                  </div>
                );
              })}
            </Panel>
            <Panel title="Monthly load by department" icon="layers">
              {Object.values(DEPARTMENTS).map((d) => {
                const list = monthBlocks.filter((b) => b.depts.includes(d.id));
                return (
                  <div key={d.id} className="dl-row">
                    <span className="k"><DeptTag dept={d.id} full /></span>
                    <span className="v mono">{list.length} blocks</span>
                  </div>
                );
              })}
            </Panel>
            <Panel title="Block states" icon="list">
              {Object.values(BLOCK_STATE).map((s) => (
                <div key={s} className="dl-row">
                  <span className="k"><Badge>{s}</Badge></span>
                  <span className="v mono">{monthBlocks.filter((b) => b.state === s).length}</span>
                </div>
              ))}
            </Panel>
          </div>
        </>
      )}

      <BlockDetail block={openBlock} onClose={() => setOpenBlock(null)} />
    </>
  );
}
