/**
 * localStorage persistence layer for Cadence.
 * All data is stored under a single "cadence_data" key as JSON.
 */

const STORAGE_KEY = 'cadence_data';

const defaultData = () => ({
  tasks: [],
  goals: [],
  routines: [],
  completions: {},   // { [routineId]: { [dateStr]: true } }
  settings: {
    theme: 'dark',
    accentColor: 'indigo',
    showBanner: true,
    bannerUrl: 'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif',
    bgBlur: 25,
    bgDim: 60,
    activeBackground: 'random',
    customBackgrounds: [
      { id: 'slot1', name: 'Cozy Cafe', url: 'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif' },
      { id: 'slot2', name: 'Pixel Cat', url: 'https://media.giphy.com/media/VPlgUzkP5yPba/giphy.gif' },
      { id: 'slot3', name: 'Sunset Train', url: 'https://media.giphy.com/media/43F752JzgNn44/giphy.gif' }
    ],
  },
});

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    const defaults = defaultData();
    // Safely merge nested settings structure
    return {
      ...defaults,
      ...parsed,
      settings: {
        ...defaults.settings,
        ...(parsed.settings || {}),
      }
    };
  } catch {
    return defaultData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}
