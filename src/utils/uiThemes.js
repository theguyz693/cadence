/**
 * Cadence's visual themes. Each is a full design system scoped under
 * html[data-ui="<key>"] (styles/themes/*.css), built from docs/theme-prompts.md.
 *
 * modes: which light/dark renderings exist. A single-mode theme fixes the mode
 * and the Light/Dark/System control is disabled while it is active.
 * fonts: Google Fonts families loaded on demand when the theme is chosen.
 * preview: colours for the Settings picker card (ground, surface, accent, ink).
 */
export const UI_THEMES = {
  standard: {
    name: 'Cadence',
    description: 'Software by day, Modern Dark by night. The default.',
    modes: ['light', 'dark'],
    fonts: ['Host+Grotesk:wght@400;500;600;700;800', 'Instrument+Sans:wght@400;500;600;700', 'Geist:wght@400..700', 'Geist+Mono:wght@400..600'],
    preview: { light: ['#fcfcfd', '#ffffff', '#074ce0', '#16191f'], dark: ['#050505', '#0e0e0e', '#f2f2f2', '#a6a9ad'] },
  },
  hearth: {
    name: 'Hearth',
    description: 'A warm workshop at night: ember, smoked glass, brutal edges.',
    modes: ['light', 'dark'],
    fonts: ['Geist:wght@400..700', 'Geist+Mono:wght@400..600'],
    preview: { light: ['#f2eee8', '#fdfbf8', '#e0822f', '#2a1f18'], dark: ['#151110', '#211b18', '#f0a35a', '#efe6da'] },
    accents: true,
  },
  cyberpunk: {
    name: 'Cyberpunk',
    description: 'Black field, electric green signals, static interference.',
    modes: ['dark'],
    fonts: ['IBM+Plex+Sans:wght@400;500;600;700', 'IBM+Plex+Mono:wght@400;500;600'],
    preview: { dark: ['#020303', '#090e0b', '#38ff8e', '#f8fffa'] },
  },
  clay: {
    name: 'Claymorphism',
    description: 'Soft inflated forms, pink cushions, cream trays.',
    modes: ['light'],
    fonts: ['Instrument+Sans:wght@400;500;600;700'],
    preview: { light: ['#f1f2fa', '#fffdf7', '#f6a3ca', '#383139'] },
  },
  organic: {
    name: 'Organic',
    description: 'Sand paper, moss and fired clay, serif headings.',
    modes: ['light'],
    fonts: ['Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600', 'Instrument+Sans:wght@400;500;600'],
    preview: { light: ['#eee6d6', '#f5eddf', '#35422d', '#29251d'] },
  },
  playful: {
    name: 'Playful',
    description: 'Activity-book geometry, hard offsets, violet and mint.',
    modes: ['light'],
    fonts: ['Host+Grotesk:wght@500;600;700;800', 'Instrument+Sans:wght@400;500;600;700'],
    preview: { light: ['#fffdf5', '#ffffff', '#6434df', '#253044'] },
  },
  sketch: {
    name: 'Sketch',
    description: 'A working sheet: handwriting, tape, red corrections.',
    modes: ['light'],
    fonts: ['Kalam:wght@400;700', 'Patrick+Hand'],
    preview: { light: ['#f7f2e7', '#fcf8ef', '#9e3a2e', '#38352f'] },
  },
  industrial: {
    name: 'Industrial',
    description: 'An instrument chassis: raised keys, recessed screens, orange lamps.',
    modes: ['light'],
    fonts: ['Host+Grotesk:wght@400;500;600;700', 'IBM+Plex+Mono:wght@400;500;600'],
    preview: { light: ['#cbd0d2', '#e7eaeb', '#f15b22', '#181e22'] },
  },
  retro: {
    name: 'Retro',
    description: 'A crowded 90s desktop: bevels, title bars, loud fields.',
    modes: ['light'],
    fonts: ['Host+Grotesk:wght@600;700;800', 'IBM+Plex+Sans:wght@400;500;600;700', 'IBM+Plex+Mono:wght@400;500'],
    preview: { light: ['#008080', '#d4d4d4', '#6600ff', '#000080'] },
  },
};

export const DEFAULT_UI = 'standard';

/** Old stored values (pre-v4 novelty themes) map onto the new set. */
const LEGACY_UI = { default: 'standard', monochrome: 'standard' };

export function resolveUiTheme(key) {
  if (UI_THEMES[key]) return key;
  return LEGACY_UI[key] || DEFAULT_UI;
}

/** The mode a theme actually renders in, given the user's preference. */
export function resolveMode(uiKey, pref, systemDark) {
  const theme = UI_THEMES[resolveUiTheme(uiKey)];
  if (theme.modes.length === 1) return theme.modes[0];
  if (pref === 'light' || pref === 'dark') return pref;
  return systemDark ? 'dark' : 'light';
}

const loaded = new Set();

/** Load a theme's fonts once, on demand. */
export function loadThemeFonts(uiKey) {
  const theme = UI_THEMES[resolveUiTheme(uiKey)];
  if (typeof document === 'undefined' || loaded.has(uiKey)) return;
  loaded.add(uiKey);
  const families = theme.fonts.map(f => `family=${f}`).join('&');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  link.dataset.themeFonts = uiKey;
  document.head.appendChild(link);
}
