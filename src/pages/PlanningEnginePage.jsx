import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppState.jsx';
import { REQUEST_STATUS } from '../data/blockRequests.js';
import { TRACK_BY_ID } from '../data/tracks.js';
import { buildStageContext, ENGINE_STAGES, runPlanner } from '../lib/planningEngine.js';
import { formatDate, formatDuration } from '../lib/format.js';
import { Badge, Callout, DeptTag, HealthValue, Icon, Panel, ProgressBar, ScorePill, Stat } from '../components/common/UI.jsx';
import ConceptFlow from '../components/common/ConceptFlow.jsx';
import BlockDetail from '../components/planning/BlockDetail.jsx';

const STAGE_MS = 620;

/* ------------------------------------------------------------------ */

function MergeViz({ block }) {
  const serialTotal = block.serialMin;
  return (
    <div className="merge-viz">
      <div className="merge-side">
        <div className="section-label mb-8">Before — departments plan separately</div>
        {block.tasks.map((t, i) => (
          <div key={t.requestId} className={`merge-block ${t.dept}`}>
            <span className="mono dim nowrap" style={{ width: 54 }}>Block {i + 1}</span>
            <DeptTag dept={t.dept} />
            <span className="grow" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.activity}</span>
            <span className="mono bold">{formatDuration(t.durationMin)}</span>
          </div>
        ))}
        <div className="row gap-8 mt-8" style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}>
          <span className="tiny dim">{block.tasks.length} separate blocks</span>
          <span className="spacer" />
          <span className="mono bold" style={{ color: '#ec8582' }}>{formatDuration(serialTotal)}</span>
        </div>
      </div>

      <div className="merge-arrow">
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-3)' }}>AI</div>
        ›
      </div>

      <div className="merge-side after">
        <div className="section-label mb-8">After — one coordinated block</div>
        <div className="merge-block joint" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
          <div className="row gap-8" style={{ width: '100%' }}>
            <span className="mono bold">{block.id}</span>
            <span className="mono dim">{block.start}–{block.end}</span>
            <span className="spacer" />
            <span className="mono bold" style={{ color: '#6ed49a' }}>{formatDuration(block.durationMin)}</span>
          </div>
          <div className="row gap-4 wrap">
            {block.tasks.map((t) => <DeptTag key={t.requestId} dept={t.dept} full />)}
          </div>
          <div className="tiny dim">{block.tasks.map((t) => t.activity).join(' + ')}</div>
        </div>
        <div className="row gap-8 mt-8" style={{ paddingTop: 8, borderTop: '1px solid rgba(67,169,111,0.3)' }}>
          <span className="tiny dim">1 block · {block.depts.length} departments</span>
          <span className="spacer" />
          <span className="delta-chip">− {formatDuration(block.savedMin)}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function PlanningEnginePage() {
  const { requests, planResult, commitPlan, notify, setRequestStatus } = useApp();
  const navigate = useNavigate();

  const selected = useMemo(
    () => requests.filter((r) => r.status === REQUEST_STATUS.SELECTED),
    [requests],
  );

  const [phase, setPhase] = useState(planResult ? 'done' : 'idle'); // idle | running | done
  const [stage, setStage] = useState(-1);
  const [log, setLog] = useState([]);
  const [result, setResult] = useState(planResult);
  const [openBlock, setOpenBlock] = useState(null);
  const timer = useRef(null);
  const consoleRef = useRef(null);

  const ctx = useMemo(() => (result ? buildStageContext(selected.length ? selected : [], result) : null), [result, selected]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [log]);

  const start = () => {
    const r = runPlanner(selected);
    const c = buildStageContext(selected, r);
    setResult(r);
    setPhase('running');
    setStage(0);
    setLog([{ t: 'Engine session initialised', k: 'key' }]);

    const step = (i) => {
      if (i >= ENGINE_STAGES.length) {
        setPhase('done');
        setStage(ENGINE_STAGES.length);
        setLog((l) => [...l, { t: `Optimised block plan generated — ${r.blocks.length} blocks, ${r.metrics.savedHours} hr released`, k: 'ok' }]);
        return;
      }
      const s = ENGINE_STAGES[i];
      setStage(i);
      setLog((l) => [...l, { t: `[${s.source}] ${s.title}… ${s.detail(c)}`, k: i >= 7 ? 'ok' : '' }]);
      timer.current = setTimeout(() => step(i + 1), STAGE_MS);
    };
    timer.current = setTimeout(() => step(0), 260);
  };

  const skip = () => {
    clearTimeout(timer.current);
    const c = buildStageContext(selected, result);
    setLog(ENGINE_STAGES.map((s) => ({ t: `[${s.source}] ${s.title}… ${s.detail(c)}`, k: '' })));
    setStage(ENGINE_STAGES.length);
    setPhase('done');
  };

  const commit = () => {
    commitPlan(result);
    notify(`${result.blocks.length} optimised blocks committed to the divisional block schedule`, 'info');
    navigate('/app/schedule');
  };

  const reset = () => {
    setResult(null);
    setPhase('idle');
    setStage(-1);
    setLog([]);
  };

  const mergedBlocks = result ? result.blocks.filter((b) => b.merged) : [];

  /* ------------------------------------------------------------- idle */

  if (phase === 'idle') {
    return (
      <>
        <div className="page-head">
          <div>
            <div className="page-title">Automatic Block Planning Engine</div>
            <div className="page-sub">
              Prioritises, coordinates and schedules the selected maintenance demands into an optimised block plan
            </div>
          </div>
          <span className="spacer" />
          <button className="btn primary lg" disabled={!selected.length} onClick={start}>
            <Icon name="engine" /> Run planning engine
          </button>
        </div>

        {selected.length === 0 ? (
          <Panel title="No requests selected" icon="alert">
            <div className="empty">
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                The engine runs on the block requests you have selected in BDMS.
              </div>
              <button className="btn primary mt-16" onClick={() => navigate('/app/requests')}>
                <Icon name="list" /> Go to Block Requests
              </button>
            </div>
          </Panel>
        ) : (
          <>
            <div className="grid grid-4 mb-16">
              <Stat tone="accent" label="Requests queued" value={selected.length} foot="Selected for this planning run" />
              <Stat tone="info" label="Sections involved" value={new Set(selected.map((r) => r.section)).size} foot="Across the division" />
              <Stat tone="warn" label="Departments" value={new Set(selected.map((r) => r.dept)).size} foot="Engineering · S&T · Traction" />
              <Stat tone="crit" label="Requested block time" value={(selected.reduce((s, r) => s + r.durationMin, 0) / 60).toFixed(1)} unit=" hr" foot="If each department worked separately" />
            </div>

            <div className="grid grid-2 mb-16">
              <Panel title="Queued for optimisation" icon="list" bodyClass="tight">
                <table className="tbl">
                  <thead><tr><th>Request</th><th>Section</th><th>Dept</th><th>Activity</th><th>Requested</th><th>Duration</th></tr></thead>
                  <tbody>
                    {selected.map((r) => (
                      <tr key={r.id}>
                        <td className="mono tiny">{r.id}</td>
                        <td className="mono bold">{r.section}</td>
                        <td><DeptTag dept={r.dept} /></td>
                        <td style={{ maxWidth: 200 }}>{r.activity}</td>
                        <td className="mono tiny nowrap">{formatDate(r.requestedDate)}<br /><span className="dim">{r.requestedStart}–{r.requestedEnd}</span></td>
                        <td className="mono">{formatDuration(r.durationMin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>

              <Panel title="What the engine will do" icon="engine">
                <ConceptFlow compact />
                <div className="divider" />
                <div className="grid grid-2" style={{ gap: 6 }}>
                  {ENGINE_STAGES.map((s) => (
                    <div key={s.id} className="row gap-8 tiny" style={{ color: 'var(--text-2)' }}>
                      <span className="stage-num" style={{ width: 18, height: 18, flex: '0 0 18px', fontSize: 9 }}>{s.id}</span>
                      {s.title}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn primary lg" onClick={start}>
                <Icon name="engine" /> Run planning engine on {selected.length} requests
              </button>
            </div>
          </>
        )}
      </>
    );
  }

  /* ---------------------------------------------------------- running */

  const progress = Math.round((Math.min(stage, ENGINE_STAGES.length) / ENGINE_STAGES.length) * 100);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title">Automatic Block Planning Engine</div>
          <div className="page-sub">
            {phase === 'running'
              ? `Optimising ${selected.length} block requests…`
              : `Optimised plan generated — ${result.blocks.length} blocks from ${result.metrics.totalRequests} requests`}
          </div>
        </div>
        <span className="spacer" />
        {phase === 'running' ? (
          <button className="btn ghost" onClick={skip}>Skip animation</button>
        ) : (
          <>
            <button className="btn ghost" onClick={reset}><Icon name="refresh" /> Run again</button>
            <button className="btn primary" onClick={commit}>
              <Icon name="calendar" /> Commit plan to schedule
            </button>
          </>
        )}
      </div>

      {/* ---------------- stage runner ---------------- */}
      <div className="grid grid-2 mb-16" style={{ gridTemplateColumns: '1.05fr 0.95fr' }}>
        <Panel
          title="Planning pipeline"
          icon="engine"
          right={phase === 'running'
            ? <span className="row gap-6 tiny"><span className="spin" /> running</span>
            : <Badge tone="ok" dot>COMPLETE</Badge>}
        >
          <div className="mb-12">
            <ProgressBar value={progress} />
            <div className="row tiny dim mt-4">
              <span>Stage {Math.min(stage + 1, ENGINE_STAGES.length)} of {ENGINE_STAGES.length}</span>
              <span className="spacer" />
              <span className="mono">{progress}%</span>
            </div>
          </div>
          <div style={{ maxHeight: 580, overflowY: 'auto' }}>
            {ENGINE_STAGES.map((s, i) => (
              <div key={s.id} className={`engine-stage ${i === stage ? 'active' : i < stage ? 'done' : ''}`}>
                <span className="stage-num">{i < stage ? '✓' : s.id}</span>
                <div className="grow">
                  <div className="row gap-8">
                    <span style={{ fontSize: 12.5, fontWeight: 550 }}>{s.title}</span>
                    <span className="spacer" />
                    <span className="stage-src">{s.source}</span>
                  </div>
                  {i <= stage && ctx && <div className="stage-detail">{s.detail(ctx)}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="col gap-12">
          <Panel title="Engine log" icon="list">
            <div className="console" ref={consoleRef}>
              {log.map((l, i) => (
                <div key={i} className={l.k === 'ok' ? 'ln-ok' : l.k === 'key' ? 'ln-key' : ''}>
                  <span style={{ color: '#4b5866' }}>{String(i).padStart(2, '0')} ›</span> {l.t}
                </div>
              ))}
              {phase === 'running' && <div className="ln-key">▌</div>}
            </div>
          </Panel>

          {phase === 'done' && (
            <div className="grid grid-2" style={{ gap: 12 }}>
              <Stat tone="ok" label="Blocks generated" value={result.blocks.length} foot={`from ${result.metrics.totalRequests} separate requests`} />
              <Stat tone="accent" label="Block time released" value={result.metrics.savedHours} unit=" hr" foot={`${result.metrics.downtimeReduction}% less downtime`} />
              <Stat tone="info" label="Multi-department blocks" value={result.metrics.mergedBlocks} foot={`${result.metrics.combinedActivities} activities combined`} />
              <Stat tone="warn" label="Train paths protected" value={result.metrics.trainsProtected} foot="Versus the requested windows" />
            </div>
          )}
        </div>
      </div>

      {phase === 'done' && (
        <>
          {/* ---------------- before / after ---------------- */}
          <Panel title="Optimisation result — before vs after" icon="dashboard" style={{ marginBottom: 16 }}>
            <div className="ba mb-16">
              <div className="ba-card before">
                <div className="section-label">Before — decentralised planning</div>
                <div className="ba-value" style={{ color: '#ec8582' }}>{result.metrics.beforeHours} hr</div>
                <div className="tiny dim">Total block time across {result.metrics.blocksBefore} separate departmental blocks</div>
                <div className="divider" style={{ margin: '10px 0' }} />
                <div className="dl-row"><span className="k">Blocks required</span><span className="v mono">{result.metrics.blocksBefore}</span></div>
                <div className="dl-row"><span className="k">Train paths affected</span><span className="v mono">{result.metrics.beforeTrains}</span></div>
                <div className="dl-row"><span className="k">Departments coordinated</span><span className="v mono">0</span></div>
              </div>

              <div className="ba-arrow">
                <div className="col center gap-4">
                  <Icon name="engine" size={20} />
                  <span className="tiny upper" style={{ fontSize: 9 }}>optimise</span>
                  ›
                </div>
              </div>

              <div className="ba-card after">
                <div className="section-label">After — AI-coordinated planning</div>
                <div className="ba-value" style={{ color: '#6ed49a' }}>{result.metrics.afterHours} hr</div>
                <div className="tiny dim">Total block time across {result.metrics.blocksAfter} coordinated blocks</div>
                <div className="divider" style={{ margin: '10px 0' }} />
                <div className="dl-row"><span className="k">Blocks required</span><span className="v mono">{result.metrics.blocksAfter}</span></div>
                <div className="dl-row"><span className="k">Train paths affected</span><span className="v mono">{result.metrics.afterTrains}</span></div>
                <div className="dl-row"><span className="k">Departments coordinated</span><span className="v mono">{result.metrics.combinedActivities}</span></div>
              </div>
            </div>

            <div className="grid grid-4">
              <Stat tone="ok" label="Block time saved" value={result.metrics.savedHours} unit=" hr" foot={`${result.metrics.beforeHours} hr → ${result.metrics.afterHours} hr`} />
              <Stat tone="ok" label="Asset downtime reduced" value={result.metrics.downtimeReduction} unit="%" foot="Against serial departmental working" />
              <Stat tone="accent" label="Asset availability gain" value={`+${result.metrics.availabilityGain}`} unit="%" foot={`Across ${result.metrics.sectionsCovered} sections in the horizon`} />
              <Stat tone="info" label="Blocks avoided" value={result.metrics.blocksSaved} foot="Fewer traffic interruptions" />
            </div>

            <div className="divider" />
            <div className="grid grid-4">
              <div><div className="section-label">Total maintenance tasks</div><div className="mono bold" style={{ fontSize: 18 }}>{result.metrics.totalRequests}</div></div>
              <div><div className="section-label">Tasks scheduled</div><div className="mono bold" style={{ fontSize: 18 }}>{result.metrics.totalRequests}</div></div>
              <div><div className="section-label">Multi-dept activities combined</div><div className="mono bold" style={{ fontSize: 18 }}>{result.metrics.combinedActivities}</div></div>
              <div><div className="section-label">Priority mix</div>
                <div className="row gap-4 mt-4">
                  {Object.entries(result.metrics.bands).filter(([, v]) => v).map(([k, v]) => (
                    <span key={k} className={`score-pill score-${k}`} style={{ fontSize: 11 }}>{v}<small> {k}</small></span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* ---------------- multi-department coordination ---------------- */}
          {mergedBlocks.length > 0 && (
            <Panel
              title="Multi-department coordination"
              icon="layers"
              right={<span className="tiny dim">{mergedBlocks.length} blocks combine work from more than one department</span>}
              style={{ marginBottom: 16 }}
            >
              <div className="col gap-16">
                {mergedBlocks.map((b) => (
                  <div key={b.id}>
                    <div className="row gap-8 mb-8">
                      <span className="mono bold">{b.section}</span>
                      <span className="muted">{b.sectionName}</span>
                      <span className="tiny dim">· {formatDate(b.date)}</span>
                      <span className="spacer" />
                      <HealthValue value={b.assetHealth} size={12} />
                      <button className="btn sm ghost" onClick={() => setOpenBlock(b)}>Open block</button>
                    </div>
                    <MergeViz block={b} />
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* ---------------- optimised plan ---------------- */}
          <Panel
            title="Optimised block plan"
            icon="calendar"
            bodyClass="tight"
            right={<button className="btn sm primary" onClick={commit}><Icon name="check" /> Commit to schedule</button>}
            style={{ marginBottom: 16 }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th>Block ID</th><th>Date</th><th>Section</th><th>Window</th><th>Duration</th>
                  <th>Departments</th><th>Maintenance tasks</th><th>Priority</th>
                  <th>Trains affected</th><th>Asset health</th><th>Operational impact</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {result.blocks.map((b) => (
                  <tr key={b.id} className="clickable" onClick={() => setOpenBlock(b)}>
                    <td className="mono bold">{b.id}</td>
                    <td className="mono nowrap tiny">{formatDate(b.date)}</td>
                    <td className="mono">{b.section}</td>
                    <td className="mono nowrap">{b.start}–{b.end}</td>
                    <td className="mono nowrap">{formatDuration(b.durationMin)}</td>
                    <td>
                      <div className="row gap-4">{b.depts.map((d) => <DeptTag key={d} dept={d} />)}</div>
                    </td>
                    <td style={{ maxWidth: 230 }}>
                      <div className="tiny">{b.tasks.map((t) => t.activity).join(' + ')}</div>
                    </td>
                    <td><ScorePill score={b.priorityScore} band={b.priority} /></td>
                    <td className="mono tiny">
                      {b.trainsAffected}
                      <span className="dim"> ({b.trains.express}E/{b.trains.passenger}P/{b.trains.goods}G)</span>
                    </td>
                    <td><HealthValue value={b.assetHealth} size={11.5} /></td>
                    <td className="tiny muted">{b.impact}</td>
                    <td><Badge>{b.state}</Badge></td>
                    <td className="right"><Icon name="chevronR" size={13} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Callout tone="ok" icon="check">
            <strong>Plan ready. </strong>
            {result.metrics.blocksBefore} independent departmental demands have been consolidated into{' '}
            {result.metrics.blocksAfter} coordinated blocks, releasing {result.metrics.savedHours} hours of
            corridor time and reducing asset downtime by {result.metrics.downtimeReduction}%.
            Commit the plan to publish it to the weekly and monthly block schedule.
          </Callout>
        </>
      )}

      <BlockDetail block={openBlock} onClose={() => setOpenBlock(null)} />
    </>
  );
}
