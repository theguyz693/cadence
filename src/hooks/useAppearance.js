import { useEffect } from 'react';
import { resolveAccent } from '../utils/helpers.js';

const STORAGE_KEY = 'cadence_appearance';

export function readStoredAppearance() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Applies theme ('light' | 'dark' | 'system') and accent to <html>.
 * The choice is mirrored to localStorage so index.html can apply it before
 * React mounts (no flash of the wrong theme).
 */
export function useAppearance(themePref, accentPref) {
  useEffect(() => {
    const stored = readStoredAppearance();
    const pref = themePref || stored.theme || 'system';
    const accent = resolveAccent(accentPref || stored.accent);
    const root = document.documentElement;

    const apply = () => {
      const theme = resolveTheme(pref);
      root.dataset.theme = theme;
      root.dataset.accent = accent;
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '#111112' : '#f6f5f2');
    };
    apply();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: pref, accent }));
    } catch { /* storage unavailable */ }

    if (pref !== 'system' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themePref, accentPref]);
}
