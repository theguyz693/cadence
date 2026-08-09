import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { LockInProvider } from './context/LockInContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tasks from './pages/Tasks.jsx';
import Goals from './pages/Goals.jsx';
import Routines from './pages/Routines.jsx';
import Settings from './pages/Settings.jsx';
import LockInModal from './components/LockInModal.jsx';
import LockInScreen from './components/LockInScreen.jsx';

export default function App() {
  return (
    <AppProvider>
      <LockInProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goals/:goalId" element={<Goals />} />
              <Route path="/routines" element={<Routines />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          {/* Lock In Setup Modal & Focus Mode Overlay */}
          <LockInModal />
          <LockInScreen />
        </BrowserRouter>
      </LockInProvider>
    </AppProvider>
  );
}
