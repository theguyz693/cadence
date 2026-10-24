/**
 * In-browser stand-in for the Cadence API, used only in demo mode.
 * Mirrors the real routes' request/response shapes so the rest of the app
 * runs unchanged. Data lives in localStorage and never leaves the device.
 */
import { createDemoData, DEMO_USER, demoCalendarEvents } from './demoSeed.js';

const FLAG_KEY = 'cadence_demo';
const STORE_KEY = 'cadence_demo_store';

export function isDemoMode() {
  try { return localStorage.getItem(FLAG_KEY) === '1'; } catch { return false; }
}

export function enterDemoMode() {
  localStorage.setItem(FLAG_KEY, '1');
  localStorage.setItem(STORE_KEY, JSON.stringify(createDemoData()));
  return DEMO_USER;
}

export function exitDemoMode() {
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(STORE_KEY);
  // The app's offline cache and focus history would otherwise show demo data.
  localStorage.removeItem('cadence_data');
  localStorage.removeItem('cadence_lock_in_history');
  localStorage.removeItem('cadence_lock_in_active');
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to a fresh seed */ }
  const fresh = createDemoData();
  save(fresh);
  return fresh;
}

function save(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

const clone = (v) => JSON.parse(JSON.stringify(v));
const delay = () => new Promise(r => setTimeout(r, 60 + Math.random() * 80));

function collection(store, name, method, id, body) {
  const list = store[name];
  if (method === 'GET' && !id) return clone(list);
  if (method === 'POST') {
    if (!body?.id) throw new Error(`${name} requires an id`);
    list.push(body);
    return clone(body);
  }
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) throw new Error('Not found');
  if (method === 'PUT') {
    const { _id, userId, ...updates } = body || {};
    list[idx] = { ...list[idx], ...updates };
    return { success: true };
  }
  if (method === 'DELETE') {
    list.splice(idx, 1);
    return { success: true };
  }
  throw new Error('Unsupported');
}

/** Handle a request path the same way the Express routes would. */
export async function demoRequest(path, options = {}) {
  await delay();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : undefined;
  const [, resource, id] = path.split('?')[0].split('/');
  const store = load();
  let result;

  switch (resource) {
    case 'auth':
      if (id === 'me') result = DEMO_USER;
      else if (id === 'logout') result = { message: 'Logged out' };
      else throw new Error('Sign-in is disabled in the demo.');
      break;
    case 'tasks':
    case 'goals':
    case 'routines':
      result = collection(store, resource, method, id, body);
      break;
    case 'completions':
      if (method === 'PUT') { store.completions = body || {}; result = { success: true }; }
      else result = clone(store.completions);
      break;
    case 'settings':
      if (method === 'PUT') { store.settings = { ...store.settings, ...body }; result = { success: true }; }
      else if (method === 'DELETE') { store.settings = createDemoData().settings; result = { success: true }; }
      else result = clone(store.settings);
      break;
    case 'focus-sessions':
      if (method === 'POST') {
        const entry = { _id: `demo_f${Date.now()}`, ...body };
        store.focusSessions.unshift(entry);
        result = clone(entry);
      } else {
        result = clone(store.focusSessions);
      }
      break;
    case 'calendar': {
      if (id === 'events') {
        const q = new URLSearchParams(path.split('?')[1] || '');
        const enabled = (store.settings.calendars || []).some(c => c.enabled !== false);
        result = { events: enabled ? demoCalendarEvents(new Date(q.get('from')), new Date(q.get('to'))) : [], errors: [] };
      } else if (id === 'test') {
        result = { ok: true, name: 'Sample calendar', count: 24 };
      } else {
        throw new Error('Calendar feeds need a real account.');
      }
      break;
    }
    default:
      throw new Error('Not available in the demo.');
  }

  if (method !== 'GET') save(store);
  return result;
}
