/**
 * Ambient background: built-in animated scenes (pure CSS, no network) plus
 * up to three user-saved image/GIF links.
 *
 * settings.activeBackground is one of:
 *   'random'        → a built-in scene picked once per load
 *   'scene:<id>'    → a specific built-in scene
 *   '<slot id>'     → one of settings.customBackgrounds (falls back to random)
 */

export const SCENES = [
  { id: 'aurora', name: 'Aurora', description: 'Slow ribbons of colour' },
  { id: 'dusk', name: 'Dusk', description: 'A warm sky, sun going down' },
  { id: 'tide', name: 'Tide', description: 'Layered waves rolling past' },
  { id: 'fireflies', name: 'Fireflies', description: 'Small lights drifting at night' },
];

export const SCENE_IDS = SCENES.map(s => s.id);

// The old preset GIF links. Giphy pulled them, so they render a
// "content not available" placeholder; treat them as empty slots.
const DEAD_URLS = new Set([
  'https://media.giphy.com/media/l0HlS53Vd2eK2WvSw/giphy.gif',
  'https://media.giphy.com/media/VPlgUzkP5yPba/giphy.gif',
  'https://media.giphy.com/media/XIqCQx02E1U9W/giphy.gif',
  'https://media.giphy.com/media/43F752JzgNn44/giphy.gif',
  'https://media.giphy.com/media/jP4pKgC0Q2Tpa2k4p8/giphy.gif',
]);
const OLD_SLOT_NAMES = new Set(['Cozy Cafe', 'Pixel Cat', 'Sunset Train']);

export const DEFAULT_CUSTOM_BACKGROUNDS = [
  { id: 'slot1', name: '', url: '' },
  { id: 'slot2', name: '', url: '' },
  { id: 'slot3', name: '', url: '' },
];

/** Saved slots with the retired preset links (and their preset names) cleared. */
export function cleanSlots(slots) {
  const list = Array.isArray(slots) && slots.length ? slots : DEFAULT_CUSTOM_BACKGROUNDS;
  return list.map(s => DEAD_URLS.has(s.url)
    ? { ...s, url: '', name: OLD_SLOT_NAMES.has(s.name) ? '' : s.name }
    : s);
}

export function randomSceneId() {
  return SCENE_IDS[Math.floor(Math.random() * SCENE_IDS.length)];
}

/**
 * What to draw behind the app, or null when the setting is off.
 * @returns {{ kind: 'scene', id: string } | { kind: 'image', url: string } | null}
 */
export function resolveAmbient(settings, fallbackSceneId) {
  if (settings?.showBanner !== true) return null;
  const active = settings.activeBackground || 'random';
  if (active.startsWith('scene:')) {
    const id = active.slice(6);
    if (SCENE_IDS.includes(id)) return { kind: 'scene', id };
  }
  if (active !== 'random') {
    const url = cleanSlots(settings.customBackgrounds).find(s => s.id === active)?.url;
    if (url) return { kind: 'image', url };
  }
  return { kind: 'scene', id: fallbackSceneId };
}
