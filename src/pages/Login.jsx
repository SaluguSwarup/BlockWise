import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppState.jsx';
import { USERS } from '../data/plans.js';
import { DIVISION } from '../data/network.js';
import { Icon } from '../components/common/UI.jsx';
import ConceptFlow from '../components/common/ConceptFlow.jsx';

function RoleCard({ role, onPick }) {
  const u = USERS[role];
  const isAdmin = role === 'ADMIN';
  return (
    <button className={`role-card ${isAdmin ? 'admin' : 'staff'}`} onClick={() => onPick(role)}>
      <span className={`role-ico ${isAdmin ? 'admin' : 'staff'}`}>
        <Icon name={isAdmin ? 'shield' : 'wrench'} size={19} />
      </span>
      <div className="grow">
        <div className="row gap-8">
          <span style={{ fontSize: 14, fontWeight: 650 }}>{isAdmin ? 'Administrator' : 'Field Staff'}</span>
          <span className="perm-pill mono">{u.userId}</span>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{u.designation}</div>
        <div className="tiny dim">{u.name} · {u.unit}</div>
        <div className="perm-list">
          {u.permissions.map((p) => <span key={p} className="perm-pill">{p}</span>)}
        </div>
        {!isAdmin && (
          <div className="tiny" style={{ color: 'var(--text-3)', marginTop: 8 }}>
            Block planning modules are hidden for this role.
          </div>
        )}
      </div>
      <span style={{ color: 'var(--text-3)', alignSelf: 'center' }}><Icon name="chevronR" size={16} /></span>
    </button>
  );
}

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();

  const pick = (role) => {
    login(role);
    navigate('/app/dashboard');
  };

  return (
    <div className="login-screen">
      <header className="login-top">
        <span className="brand-mark" style={{ width: 32, height: 32 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="2.5" width="16" height="13" rx="2" stroke="#e0a13a" strokeWidth="1.6" />
            <path d="M4 9h16" stroke="#e0a13a" strokeWidth="1.3" />
            <circle cx="8.5" cy="12.5" r="1.2" fill="#e0a13a" />
            <circle cx="15.5" cy="12.5" r="1.2" fill="#e0a13a" />
            <path d="M7 15.5 5 21M17 15.5 19 21" stroke="#8fa3b8" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M2.5 18.5h19" stroke="#8fa3b8" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <div className="brand-name">Block<span>Wise</span></div>
          <div className="brand-sub">Automatic Block Planning System</div>
        </div>
        <span className="spacer" />
        <div className="right">
          <div style={{ fontSize: 12, fontWeight: 600 }}>{DIVISION.zone} · {DIVISION.division}</div>
          <div className="tiny dim">Prototype build 0.1 · Smart India Hackathon 2026</div>
        </div>
      </header>

      <div className="login-main">
        <div className="login-hero">
          <div className="section-label mb-8">Integrated maintenance block planning</div>
          <h1>
            Departments stop planning blocks<br />in isolation. The <em>division</em> plans them together.
          </h1>
          <p className="lede">
            Engineering, Signal &amp; Telecommunication and Traction Distribution each raise block demands
            through BDMS today. BlockWise reads those demands alongside defect and overdue data from TMS,
            SMMS and TDMS, and corridor availability, the working time table and the goods forecast from the
            Control Office — and generates one optimised, coordinated block plan.
          </p>

          <div className="panel mt-24">
            <div className="panel-body">
              <ConceptFlow />
            </div>
          </div>
        </div>

        <div>
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Sign in to the demonstration</span>
              <span className="spacer" />
              <span className="tiny dim">Role-based access</span>
            </div>
            <div className="panel-body">
              <div className="col gap-12">
                <RoleCard role="ADMIN" onPick={pick} />
                <RoleCard role="STAFF" onPick={pick} />
              </div>
              <div className="callout info mt-16">
                <span className="ico"><Icon name="alert" size={14} /></span>
                <div>
                  This is a front-end prototype. All records — sections, defects, block demands, time table and
                  forecast data — are realistic mock data held in browser state. No live railway system is contacted.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="login-foot">
        Problem statement: Automatic Block Planning for fixed infrastructure maintenance of Engineering,
        Traction Distribution and Signal &amp; Telecommunication departments · {DIVISION.controlOffice}
      </footer>
    </div>
  );
}
