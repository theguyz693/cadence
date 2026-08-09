import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import { ACCENT_THEMES } from '../utils/helpers.js';

import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Repeat,
  Settings as SettingsIcon,
  Lock,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { to: '/', Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', Icon: CheckSquare, label: 'Tasks' },
  { to: '/goals', Icon: Target, label: 'Goals' },
  { to: '/routines', Icon: Repeat, label: 'Routines' },
  { to: '/settings', Icon: SettingsIcon, label: 'Settings' },
];

const BACKGROUND_GIFS = [
  'https://media.giphy.com/media/l0HlS53Vd2eK2WvSw/giphy.gif', // Lofi room night rain
  'https://media.giphy.com/media/VPlgUzkP5yPba/giphy.gif', // Lofi cozy laptop cat
  'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif', // Cozy Cafe
  'https://media.giphy.com/media/43F752JzgNn44/giphy.gif', // Sunset train / cyber city
  'https://media.giphy.com/media/jP4pKgC0Q2Tpa2k4p8/giphy.gif'  // Coffee cup pixel art
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { state } = useApp();
  const { openLockIn } = useLockIn();
  const [backgroundUrl, setBackgroundUrl] = useState('');
  
  const accentTheme = state?.settings?.accentColor || 'indigo';
  const bgBlur = state?.settings?.bgBlur ?? 25;
  const bgDim = state?.settings?.bgDim ?? 60;
  const activeBackground = state?.settings?.activeBackground || 'random';
  const customBackgrounds = state?.settings?.customBackgrounds || [];

  useEffect(() => {
    const themeData = ACCENT_THEMES[accentTheme] || ACCENT_THEMES.indigo;
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', themeData.primary);
    root.style.setProperty('--accent-primary-hover', themeData.hover);
    root.style.setProperty('--accent-primary-glow', themeData.glow);
    root.style.setProperty('--accent-secondary', themeData.secondary);
    root.style.setProperty('--accent-gradient', themeData.gradient);
  }, [accentTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-bg-blur', `${bgBlur}px`);
    root.style.setProperty('--app-bg-dim', `${bgDim / 100}`);
  }, [bgBlur, bgDim]);

  // Handle ambient background GIF selection on mount
  useEffect(() => {
    const randomGif = BACKGROUND_GIFS[Math.floor(Math.random() * BACKGROUND_GIFS.length)];
    if (activeBackground === 'random') {
      setBackgroundUrl(randomGif);
    } else {
      const activeSlot = customBackgrounds.find(bg => bg.id === activeBackground);
      setBackgroundUrl(activeSlot?.url || randomGif);
    }
  }, []);

  // Update background when user changes active slot or edits a slot's URL in Settings
  useEffect(() => {
    if (activeBackground !== 'random') {
      const activeSlot = customBackgrounds.find(bg => bg.id === activeBackground);
      if (activeSlot?.url) {
        setBackgroundUrl(activeSlot.url);
      }
    } else {
      // If switched back to random, select a random preset if not already loaded from presets
      const isPresetLoaded = BACKGROUND_GIFS.includes(backgroundUrl);
      if (!isPresetLoaded) {
        const randomGif = BACKGROUND_GIFS[Math.floor(Math.random() * BACKGROUND_GIFS.length)];
        setBackgroundUrl(randomGif);
      }
    }
  }, [activeBackground, customBackgrounds]);

  const closeSidebar = () => setSidebarOpen(false);

  const bannerActive = state?.settings?.showBanner !== false;

  return (
    <div className="app-layout">
      {/* Full screen ambient GIF background */}
      {bannerActive && backgroundUrl && (
        <>
          <div className="app-ambient-bg" style={{ backgroundImage: `url(${backgroundUrl})` }} />
          <div className="app-ambient-overlay" />
        </>
      )}

      {/* Mobile toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
      </button>

      {/* Overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>Cadence</h1>
          <div className="brand-tagline">Your rhythm, your rules</div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className="nav-link lock-in-sidebar-btn"
            onClick={() => {
              closeSidebar();
              openLockIn();
            }}
            style={{
              background: 'var(--accent-primary-glow)',
              color: 'var(--accent-secondary)',
              fontWeight: 600,
              marginBottom: 'var(--space-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <Lock size={18} strokeWidth={1.75} />
            </span>
            <span>LOCK IN</span>
          </button>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
                <item.Icon size={18} strokeWidth={1.75} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
