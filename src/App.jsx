import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { LockInProvider } from './context/LockInContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tasks from './pages/Tasks.jsx';
import Goals from './pages/Goals.jsx';
import Routines from './pages/Routines.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import LockInModal from './components/LockInModal.jsx';
import LockInScreen from './components/LockInScreen.jsx';
import LandingPage from './pages/LandingPage.jsx';

function LandingOrDashboard() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-family)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8 }}>
            Cadence
          </div>
          <div style={{ fontSize: '0.85rem' }}>Authenticating rhythm...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <>
        <Layout>
          <Dashboard />
        </Layout>
        <LockInModal />
        <LockInScreen />
      </>
    );
  }

  return <LandingPage />;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-family)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8 }}>
            Cadence
          </div>
          <div style={{ fontSize: '0.85rem' }}>Authenticating rhythm...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function PublicAuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <LockInProvider>
            <Routes>
              {/* Landing Page or Dashboard */}
              <Route
                path="/"
                element={<LandingOrDashboard />}
              />

              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicAuthRoute>
                    <Login />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicAuthRoute>
                    <Signup />
                  </PublicAuthRoute>
                }
              />

              {/* Protected Cadence Dashboard Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/goals" element={<Goals />} />
                        <Route path="/goals/:goalId" element={<Goals />} />
                        <Route path="/routines" element={<Routines />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                    {/* Lock In Setup Modal & Focus Mode Overlay */}
                    <LockInModal />
                    <LockInScreen />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </LockInProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
