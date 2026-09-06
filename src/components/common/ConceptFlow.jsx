import { Icon } from './UI.jsx';

const INPUTS = [
  { label: 'Maintenance requirements', src: 'BDMS' },
  { label: 'Track / asset health', src: 'TMS · SMMS · TDMS' },
  { label: 'Train time table', src: 'COA' },
  { label: 'Goods train forecast', src: 'COA' },
  { label: 'Corridor availability', src: 'COA' },
];

const ENGINE_STEPS = ['Prioritisation', 'Coordination', 'Optimisation'];

const OUTPUTS = [
  'Optimised block plan (weekly + monthly)',
  'Multi-department blocks combined',
  'Less downtime · better asset availability',
];

export default function ConceptFlow({ compact = false }) {
  return (
    <div className="flow">
      <div className="flow-col">
        {!compact && <div className="section-label" style={{ marginBottom: 2 }}>Integrated inputs</div>}
        {INPUTS.map((i) => (
          <div key={i.label} className="flow-item">
            <span style={{ color: 'var(--text-3)' }}><Icon name="layers" size={12} /></span>
            {i.label}
            <span className="src">{i.src}</span>
          </div>
        ))}
      </div>

      <div className="flow-arrow">›</div>

      <div className="flow-col">
        <div className="flow-engine">
          <div className="t">Automatic Block Planning Engine</div>
          <div className="s">AI / ML scheduling</div>
          <div className="row gap-4 mt-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {ENGINE_STEPS.map((s) => (
              <span key={s} className="perm-pill" style={{ borderColor: 'rgba(224,161,58,0.35)', color: 'var(--accent)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flow-arrow">›</div>

      <div className="flow-col">
        {!compact && <div className="section-label" style={{ marginBottom: 2 }}>Result</div>}
        {OUTPUTS.map((o) => (
          <div key={o} className="flow-out">{o}</div>
        ))}
      </div>
    </div>
  );
}
