import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppState.jsx';
import { Icon, LiveClock, ApiStatus } from '../common/UI.jsx';
import { DIVISION } from '../../data/network.js';
import { REQUEST_STATUS } from '../../data/blockRequests.js';
import { TICKET_STATUS } from '../../data/tickets.js';
import { TRACKS } from '../../data/tracks.js';

function BrandMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2.5" width="16" height="13" rx="2" stroke="#e0a13a" strokeWidth="1.6" />
      <path d="M4 9h16" stroke="#e0a13a" strokeWidth="1.3" />
      <circle cx="8.5" cy="12.5" r="1.2" fill="#e0a13a" />
      <circle cx="15.5" cy="12.5" r="1.2" fill="#e0a13a" />
      <path d="M7 15.5 5 21M17 15.5 19 21" stroke="#8fa3b8" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2.5 18.5h19" stroke="#8fa3b8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function AppShell({ children }) {
  const { user, logout, isAdmin, requests, tickets } = useApp();
  const navigate = useNavigate();

  const pendingRequests = requests.filter((r) => r.status === REQUEST_STATUS.PENDING).length;
  const selectedCount = requests.filter((r) => r.status === REQUEST_STATUS.SELECTED).length;
  const openTickets = tickets.filter((t) => t.status !== TICKET_STATUS.CLOSED).length;
  const criticalTracks = TRACKS.filter((t) => t.health < 60).length;

  const initials = user.name.split(' ').filter((w) => w.length > 2).slice(-2).map((w) => w[0]).join('');

  const doLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><BrandMark /></span>
          <div>
            <div className="brand-name">Block<span>Wise</span></div>
            <div className="brand-sub">Automatic Block Planning System</div>
          </div>
        </div>

        <div className="topbar-div">
          <div style={{ fontSize: 12, fontWeight: 600 }}>{DIVISION.division}</div>
          <div className="tiny dim">{DIVISION.zone} · {DIVISION.controlOffice}</div>
        </div>

        <span className="spacer" />

        <div className="row gap-6 tiny" style={{ color: 'var(--text-2)' }}>
          <span className="pulse-dot" />
          <span>5 source systems connected</span>
        </div>

        <ApiStatus />

        <LiveClock />

        <div className="user-chip">
          <span className={`avatar ${isAdmin ? '' : 'staff'}`}>{initials}</span>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{user.name}</div>
            <div className="tiny dim">{user.designation}</div>
          </div>
        </div>

        <button className="icon-btn" onClick={doLogout} title="Sign out">
          <Icon name="logout" size={15} />
        </button>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          <div className="nav-group">
            <div className="nav-group-label section-label">Operations</div>
            <NavLink to="/app/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon name="dashboard" /> Dashboard
            </NavLink>
            <NavLink to="/app/network" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon name="map" /> Network Visualiser
              {criticalTracks > 0 && <span className="nav-count alert">{criticalTracks}</span>}
            </NavLink>
            <NavLink to="/app/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon name="ticket" /> Inspection Tickets
              <span className="nav-count">{openTickets}</span>
            </NavLink>
          </div>

          {isAdmin && (
            <div className="nav-group" style={{ borderTop: '1px solid var(--line)' }}>
              <div className="nav-group-label section-label">Block Planning</div>
              <NavLink to="/app/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon name="list" /> Block Requests
                <span className="nav-count">{pendingRequests}</span>
              </NavLink>
              <NavLink to="/app/engine" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon name="engine" /> Planning Engine
                {selectedCount > 0 && <span className="nav-count alert">{selectedCount}</span>}
              </NavLink>
              <NavLink to="/app/schedule" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon name="calendar" /> Block Schedule
              </NavLink>
              <NavLink to="/app/operations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon name="train" /> Train Operations
              </NavLink>
            </div>
          )}

          <div className="sidebar-foot">
            <div className="tiny dim" style={{ marginBottom: 6 }}>SIGNED IN AS</div>
            <div style={{ fontSize: 11.5, fontWeight: 600 }}>{user.role === 'ADMIN' ? 'Administrator' : 'Field Staff'}</div>
            <div className="tiny dim mono">{user.employeeId}</div>
            {!isAdmin && (
              <div className="callout info" style={{ marginTop: 10, padding: '7px 9px', fontSize: 10.5 }}>
                <div>Block Planning modules are restricted to divisional administrators.</div>
              </div>
            )}
          </div>
        </nav>

        <main className="main">
          <div className="main-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
