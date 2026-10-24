import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { LockInProvider } from './context/LockInContext.jsx';
import { WorkspaceProvider } from './context/WorkspaceContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { useAppearance } from './hooks/useAppearance.js';
import Layout from './components/Layout.jsx';
import Logo from './components/Logo.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tasks from './pages/Tasks.jsx';
import Goals from './pages/Goals.jsx';
import Routines from './pages/Routines.jsx';
import Settings from './pages/Settings.jsx';
import CalendarPage from './pages/Calendar.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import LockInModal from './components/LockInModal.jsx';
import LockInScreen from './components/LockInScreen.jsx';
import LandingPage from './pages/LandingPage.jsx';

function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <Logo size={28} />
      <span className="sr-only">Loading Cadence</span>
      <span className="splash-bar" aria-hidden="true" />
    </div>
  );
}

/** Applies the signed-in user's theme/accent; falls back to the device preference. */
function AppearanceController() {
  const { isAuthenticated } = useAuth();
  const { state } = useApp();
  useAppearance(
    isAuthenticated ? state.settings?.theme : undefined,
    isAuthenticated ? state.settings?.accentColor : undefined,
  );
  return null;
}

/** Everything a signed-in user sees: workspace actions, shell, focus mode. */
function AuthedShell({ children }) {
  return (
    <WorkspaceProvider>
      <Layout>{children}</Layout>
      <LockInModal />
      <LockInScreen />
    </WorkspaceProvider>
  );
}

/**
 * Single gate for every non-auth URL, so the app shell mounts once and stays
 * mounted while moving between pages.
 */
function RootGate() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!isAuthenticated) {
    if (location.pathname === '/') return <LandingPage />;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return (
    <AuthedShell>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="goals" element={<Goals />} />
        <Route path="goals/:goalId" element={<Goals />} />
        <Route path="routines" element={<Routines />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthedShell>
  );
}

function PublicAuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Splash />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <LockInProvider>
              <AppearanceController />
              <Routes>
                <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
                <Route path="/signup" element={<PublicAuthRoute><Signup /></PublicAuthRoute>} />
                <Route path="/*" element={<RootGate />} />
              </Routes>
            </LockInProvider>
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
