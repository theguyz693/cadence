/**
 * localStorage persistence layer for Cadence.
 * All data is stored under a single "cadence_data" key as JSON.
 */

const STORAGE_KEY = 'cadence_data';

const DEFAULT_FOCUS_SOUNDS = [
  { id: 'sound_1', name: 'Deep Focus Ambient', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', type: 'preset', isDefault: true },
  { id: 'sound_2', name: 'Rain & Thunderstorm', src: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b71d9d970.mp3?filename=rain-and-thunder-16705.mp3', type: 'preset', isDefault: false },
  { id: 'sound_3', name: 'Night City Lo-Fi', src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3', type: 'preset', isDefault: false },
  { id: 'sound_4', name: 'Synth Meditation Drone', src: 'synth', type: 'preset', isDefault: false },
];

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
    focusSounds: DEFAULT_FOCUS_SOUNDS,
    defaultSoundId: 'sound_1',
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
