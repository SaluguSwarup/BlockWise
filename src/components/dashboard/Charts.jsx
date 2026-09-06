/** Hand-rolled SVG charts — no chart library, keeps the bundle and the look tight. */

export function DonutChart({ data, size = 148, thickness = 20, centerValue, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="row gap-16">
      <svg width={size} height={size} style={{ flex: `0 0 ${size}px` }}>
        <g transform={`rotate(-90 ${c} ${c})`}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#1b232d" strokeWidth={thickness} />
          {data.map((d) => {
            const len = (d.value / total) * circ;
            const el = (
              <circle
                key={d.label}
                cx={c} cy={c} r={r} fill="none"
                stroke={d.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </g>
        <text x={c} y={c - 2} textAnchor="middle" className="mono" fill="#e7edf5" fontSize="21" fontWeight="700">
          {centerValue}
        </text>
        <text x={c} y={c + 14} textAnchor="middle" fill="#6a7786" fontSize="9.5" letterSpacing="0.08em">
          {centerLabel}
        </text>
      </svg>
      <div className="grow">
        {data.map((d) => (
          <div key={d.label} className="dl-row">
            <span className="k row gap-6">
              <i style={{ width: 9, height: 9, borderRadius: 2, background: d.color, display: 'inline-block' }} />
              {d.label}
            </span>
            <span className="v mono bold">{d.value}<span className="dim" style={{ fontWeight: 400, fontSize: 11 }}> · {Math.round((d.value / total) * 100)}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarList({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="bar-row">
          <span className="tiny" style={{ color: 'var(--text-2)' }}>{r.label}</span>
          <div className="bar-track">
            <i style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
          <span className="mono bold right" style={{ fontSize: 12 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function HealthHistogram({ tracks }) {
  const buckets = [
    { label: '<50', min: 0, max: 50, color: '#c9403c' },
    { label: '50-59', min: 50, max: 60, color: '#d9534f' },
    { label: '60-69', min: 60, max: 70, color: '#c98a2b' },
    { label: '70-74', min: 70, max: 75, color: '#d99a2b' },
    { label: '75-84', min: 75, max: 85, color: '#3d8f61' },
    { label: '85-100', min: 85, max: 101, color: '#43a96f' },
  ];
  const counts = buckets.map((b) => tracks.filter((t) => t.health >= b.min && t.health < b.max).length);
  const max = Math.max(...counts, 1);

  return (
    <div>
      <div className="hist">
        {buckets.map((b, i) => (
          <div key={b.label} className="hist-col" title={`${counts[i]} sections`}>
            <span className="mono tiny" style={{ color: 'var(--text-2)' }}>{counts[i]}</span>
            <div
              className="hist-bar"
              style={{ height: `${(counts[i] / max) * 88}px`, background: b.color, opacity: counts[i] ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        {buckets.map((b) => (
          <div key={b.label} className="tiny dim center" style={{ flex: 1 }}>{b.label}</div>
        ))}
      </div>
      <div className="row gap-12 mt-8 tiny dim" style={{ justifyContent: 'center' }}>
        <span>◀ below threshold (75%)</span><span>above threshold ▶</span>
      </div>
    </div>
  );
}

export function UtilisationChart({ data, height = 130 }) {
  const w = 100;
  // Tight y-domain — utilisation lives in a narrow band, so a 0–100 axis would
  // flatten the trend that matters.
  const LO = 50;
  const HI = 90;
  const PAD_T = 10;
  const PAD_B = 16;
  const yOf = (v) => height - PAD_B - ((v - LO) / (HI - LO)) * (height - PAD_T - PAD_B);

  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, yOf(d.utilisation)]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `${path} L${w},${height - PAD_B} L0,${height - PAD_B} Z`;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <defs>
          <linearGradient id="utilFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0a13a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#e0a13a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[60, 70, 80].map((g) => (
          <line key={g} x1="0" x2={w} y1={yOf(g)} y2={yOf(g)} stroke="#1e2731" strokeWidth="0.6" />
        ))}
        <path d={area} fill="url(#utilFill)" />
        <path d={path} fill="none" stroke="#e0a13a" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <circle key={data[i].week} cx={p[0]} cy={p[1]} r="1.6" fill="#e0a13a" vectorEffect="non-scaling-stroke">
            <title>{`${data[i].week}: ${data[i].utilisation}% utilisation (${data[i].utilised}/${data[i].granted} block hours used)`}</title>
          </circle>
        ))}
      </svg>
      {[60, 70, 80].map((g) => (
        <span
          key={g}
          className="tiny dim mono"
          style={{ position: 'absolute', left: 0, top: yOf(g) - 7, background: 'var(--bg-panel)', paddingRight: 3 }}
        >{g}%</span>
      ))}
      <div className="row" style={{ marginTop: 2 }}>
        {data.map((d) => (
          <div key={d.week} className="tiny dim center" style={{ flex: 1 }}>{d.week}</div>
        ))}
      </div>
    </div>
  );
}
