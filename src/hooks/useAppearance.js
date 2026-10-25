import { useEffect } from 'react';
import { resolveAccent } from '../utils/helpers.js';
import { UI_THEMES, resolveUiTheme, resolveMode, loadThemeFonts } from '../utils/uiThemes.js';

const STORAGE_KEY = 'cadence_appearance';

export function readStoredAppearance() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function storeAppearance(patch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStoredAppearance(), ...patch }));
  } catch { /* storage unavailable */ }
}

/**
 * Applies the visual theme (data-ui), its light/dark mode (data-theme) and the
 * accent (data-accent) to <html>, loads the theme's fonts, and mirrors the
 * choice to localStorage so index.html can apply it before React mounts.
 *
 * themePref: 'light' | 'dark' | 'system'. Single-mode themes ignore it.
 */
export function useAppearance(themePref, accentPref, uiPref) {
  useEffect(() => {
    const stored = readStoredAppearance();
    const pref = themePref || stored.theme || 'system';
    const accent = resolveAccent(accentPref || stored.accent);
    const ui = resolveUiTheme(uiPref || stored.ui);
    const root = document.documentElement;
    loadThemeFonts(ui);

    const apply = () => {
      const systemDark = !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      const mode = resolveMode(ui, pref, systemDark);
      root.dataset.ui = ui;
      root.dataset.theme = mode;
      root.dataset.accent = accent;
      const ground = UI_THEMES[ui].preview[mode]?.[0];
      if (ground) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', ground);
    };
    apply();
    storeAppearance({ theme: pref, accent, ui });

    if (pref !== 'system' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [themePref, accentPref, uiPref]);
}
