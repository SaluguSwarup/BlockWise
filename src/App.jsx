import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppState.jsx';
import AppShell from './components/layout/AppShell.jsx';
import Login from './pages/Login.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import VisualizerPage from './pages/VisualizerPage.jsx';
import TicketsPage from './pages/TicketsPage.jsx';
import BlockRequestsPage from './pages/BlockRequestsPage.jsx';
import PlanningEnginePage from './pages/PlanningEnginePage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import OperationsPage from './pages/OperationsPage.jsx';
import { Icon } from './components/common/UI.jsx';

/** Any signed-in user. */
function Protected({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  return <AppShell>{children}</AppShell>;
}

/** Admin-only — block planning modules are never rendered for staff. */
function AdminOnly({ children }) {
  const { user, isAdmin } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <AppShell><Denied /></AppShell>;
  return <AppShell>{children}</AppShell>;
}

function Denied() {
  return (
    <div className="panel" style={{ maxWidth: 560, margin: '60px auto' }}>
      <div className="panel-body center">
        <div style={{ color: 'var(--crit)', marginBottom: 10 }}><Icon name="shield" size={26} /></div>
        <div style={{ fontSize: 15, fontWeight: 650 }}>Restricted module</div>
        <div className="muted mt-8" style={{ fontSize: 12.5 }}>
          The Block Planning Engine and the divisional block schedule are available only to
          administrators. Your role has access to the network visualiser, track records and
          inspection tickets.
        </div>
      </div>
    </div>
  );
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast ${toast.tone}`} key={toast.key}>
        <Icon name={toast.tone === 'crit' ? 'alert' : 'check'} size={14} />
        {toast.message}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/app/dashboard" element={<Protected><DashboardPage /></Protected>} />
        <Route path="/app/network" element={<Protected><VisualizerPage /></Protected>} />
        <Route path="/app/tickets" element={<Protected><TicketsPage /></Protected>} />
        <Route path="/app/requests" element={<AdminOnly><BlockRequestsPage /></AdminOnly>} />
        <Route path="/app/engine" element={<AdminOnly><PlanningEnginePage /></AdminOnly>} />
        <Route path="/app/schedule" element={<AdminOnly><SchedulePage /></AdminOnly>} />
        <Route path="/app/operations" element={<AdminOnly><OperationsPage /></AdminOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
