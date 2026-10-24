import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun, Repeat, CheckSquare, Target, Settings as SettingsIcon, Lock, Plus, Search,
  LogOut, ChevronsUpDown, WifiOff, RotateCw, FlaskConical, Sparkles, CalendarDays,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import Menu from './ui/Menu.jsx';
import Logo from './Logo.jsx';
import { isRoutineActiveToday, isRoutineCompletedOn } from '../utils/recurrence.js';
import { getTaskDue } from '../utils/dates.js';

const BACKGROUND_GIFS = [
  'https://media.giphy.com/media/l0HlS53Vd2eK2WvSw/giphy.gif',
  'https://media.giphy.com/media/VPlgUzkP5yPba/giphy.gif',
  'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif',
  'https://media.giphy.com/media/43F752JzgNn44/giphy.gif',
  'https://media.giphy.com/media/jP4pKgC0Q2Tpa2k4p8/giphy.gif',
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
export const MOD_KEY = isMac ? '⌘' : 'Ctrl';

function useAmbientBackground(settings) {
  const enabled = settings?.showBanner === true;
  const active = settings?.activeBackground || 'random';
  const slots = settings?.customBackgrounds || [];
  const [randomUrl] = useState(() => BACKGROUND_GIFS[Math.floor(Math.random() * BACKGROUND_GIFS.length)]);
  if (!enabled) return null;
  if (active === 'random') return randomUrl;
  return slots.find(s => s.id === active)?.url || randomUrl;
}

export default function Layout({ children }) {
  const { state, apiAvailable, retryConnection } = useApp();
  const { openLockIn, activeSession } = useLockIn();
  const { user, logout, isDemo } = useAuth();
  const { openTaskEditor, openRoutineEditor, openGoalEditor, openCommandMenu, openQuickAdd } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [retrying, setRetrying] = useState(false);

  const ambientUrl = useAmbientBackground(state.settings);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ambient-blur', `${state.settings?.bgBlur ?? 25}px`);
    root.style.setProperty('--ambient-dim', `${(state.settings?.bgDim ?? 60) / 100}`);
  }, [state.settings?.bgBlur, state.settings?.bgDim]);

  // Scroll to top on route change
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);

  const counts = useMemo(() => {
    const today = new Date();
    const routinesDue = state.routines.filter(r => isRoutineActiveToday(r) && !isRoutineCompletedOn(state.completions, r.id, today)).length;
    const tasksDue = state.tasks.filter(t => {
      if (t.completed) return false;
      const due = getTaskDue(t, today);
      return due && due.diff <= 0;
    }).length;
    return { routinesDue, tasksDue };
  }, [state.routines, state.tasks, state.completions]);

  const nav = [
    { to: '/', label: 'Today', Icon: Sun, count: counts.routinesDue + counts.tasksDue },
    { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
    { to: '/routines', label: 'Routines', Icon: Repeat },
    { to: '/tasks', label: 'Tasks', Icon: CheckSquare },
    { to: '/goals', label: 'Goals', Icon: Target },
  ];

  const createItems = [
    { label: 'Quick add…', icon: Sparkles, shortcut: 'Q', onSelect: () => openQuickAdd() },
    { type: 'separator' },
    { label: 'Task', icon: CheckSquare, shortcut: 'N', onSelect: () => openTaskEditor() },
    { label: 'Routine', icon: Repeat, shortcut: '⇧R', onSelect: () => openRoutineEditor() },
    { label: 'Goal', icon: Target, onSelect: () => openGoalEditor() },
  ];

  // Leave the protected route first so the auth gate lands on the home page, not /login.
  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  // A full page load guarantees no demo state lingers in memory.
  const exitDemo = async (to) => {
    await logout();
    window.location.assign(to);
  };

  const handleRetry = async () => {
    setRetrying(true);
    await retryConnection();
    setRetrying(false);
  };

  const initial = (user?.username || '?').slice(0, 1).toUpperCase();

  return (
    <div className={`shell ${ambientUrl ? 'has-ambient' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>

      {ambientUrl && (
        <div className="ambient" aria-hidden="true">
          <div className="ambient-image" style={{ backgroundImage: `url(${ambientUrl})` }} />
          <div className="ambient-dim" />
        </div>
      )}

      {/* ---------------- Desktop sidebar ---------------- */}
      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar-top">
          <NavLink to="/" className="brand" aria-label="Cadence — Today">
            <Logo size={20} />
            <span className="brand-name">Cadence</span>
          </NavLink>
          <Menu
            label="Create new"
            align="start"
            items={createItems}
            trigger={(props) => (
              <button {...props} className="icon-btn" data-tooltip="Create">
                <Plus size={16} strokeWidth={2} />
              </button>
            )}
          />
        </div>

        <button type="button" className="sidebar-search" onClick={openCommandMenu}>
          <Search size={14} strokeWidth={1.75} aria-hidden="true" />
          <span className="grow">Search</span>
          <kbd className="kbd">{MOD_KEY} K</kbd>
        </button>

        <nav className="sidebar-nav">
          {nav.map(({ to, label, Icon, count }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="grow">{label}</span>
              {count > 0 && <span className="nav-count t-num" aria-label={`${count} due`}>{count}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section">
          <button
            type="button"
            className={`lockin-launch ${activeSession ? 'is-live' : ''}`}
            onClick={() => openLockIn()}
          >
            <Lock size={15} strokeWidth={1.9} aria-hidden="true" />
            <span className="grow">{activeSession ? 'Session in progress' : 'Lock in'}</span>
            <kbd className="kbd">L</kbd>
          </button>
        </div>

        <div className="sidebar-bottom">
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
            <SettingsIcon size={16} strokeWidth={1.75} aria-hidden="true" />
            <span className="grow">Settings</span>
          </NavLink>
          {user && (
            <Menu
              label="Account"
              align="start"
              width={220}
              items={[
                { type: 'label', label: isDemo ? 'Demo workspace' : `Signed in as ${user.username}` },
                { label: 'Settings', icon: SettingsIcon, onSelect: () => navigate('/settings') },
                { type: 'separator' },
                isDemo
                  ? { label: 'Exit demo', icon: LogOut, onSelect: () => exitDemo('/') }
                  : { label: 'Sign out', icon: LogOut, onSelect: handleLogout },
              ]}
              trigger={(props) => (
                <button {...props} className="account-btn">
                  <span className="avatar" aria-hidden="true">{initial}</span>
                  <span className="grow truncate">{user.username}</span>
                  <ChevronsUpDown size={14} strokeWidth={1.75} aria-hidden="true" className="t-tertiary" />
                </button>
              )}
            />
          )}
        </div>
      </aside>

      {/* ---------------- Mobile top bar ---------------- */}
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Cadence — Today">
          <Logo size={18} />
          <span className="brand-name">Cadence</span>
        </NavLink>
        <div className="row gap-1">
          <button type="button" className="icon-btn" onClick={openCommandMenu} aria-label="Search">
            <Search size={18} strokeWidth={1.75} />
          </button>
          <NavLink to="/settings" className={({ isActive }) => `icon-btn ${isActive ? 'is-live' : ''}`} aria-label="Settings">
            <SettingsIcon size={18} strokeWidth={1.75} />
          </NavLink>
          <button type="button" className={`icon-btn ${activeSession ? 'is-live' : ''}`} onClick={() => openLockIn()} aria-label="Lock in">
            <Lock size={18} strokeWidth={1.75} />
          </button>
          <Menu
            label="Create new"
            items={createItems.map(({ shortcut, ...i }) => i)}
            trigger={(props) => (
              <button {...props} className="icon-btn icon-btn-accent">
                <Plus size={18} strokeWidth={2} />
              </button>
            )}
          />
        </div>
      </header>

      {/* ---------------- Main ---------------- */}
      <main id="main" className="main" tabIndex={-1}>
        {isDemo && (
          <div className="demo-banner" role="status">
            <FlaskConical size={15} strokeWidth={1.75} aria-hidden="true" />
            <span className="grow">
              <strong>You're exploring a demo.</strong> Try anything — it's sample data saved only in this browser.
            </span>
            <div className="demo-banner-actions">
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => exitDemo('/')}>Exit demo</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => exitDemo('/signup')}>Create your account</button>
            </div>
          </div>
        )}
        {!apiAvailable && !isDemo && (
          <div className="offline-banner" role="status">
            <WifiOff size={15} strokeWidth={1.75} aria-hidden="true" />
            <span className="grow">Can’t reach the Cadence server. You’re viewing the copy saved on this device, and changes may not be saved.</span>
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleRetry} disabled={retrying}>
              <RotateCw size={13} strokeWidth={2} className={retrying ? 'spin' : ''} /> Retry
            </button>
          </div>
        )}
        <div className="main-inner" key={location.pathname.split('/')[1] || 'today'}>
          {children}
        </div>
      </main>

      {/* ---------------- Mobile tab bar ---------------- */}
      <nav className="tabbar" aria-label="Primary">
        {nav.map(({ to, label, Icon, count }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}>
            <span className="tab-icon">
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              {count > 0 && <span className="tab-dot" aria-hidden="true" />}
            </span>
            <span className="tab-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
