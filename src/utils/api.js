/**
 * Frontend API client for Cadence backend.
 * Includes JWT Token handling.
 */

import { isDemoMode, demoRequest } from '../demo/demoApi.js';

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function getToken() {
  return localStorage.getItem('cadence_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('cadence_token', token);
  } else {
    localStorage.removeItem('cadence_token');
  }
}

async function request(path, options = {}) {
  const endpoint0 = path.startsWith('/') ? path : `/${path}`;
  // Demo mode never talks to the server.
  if (isDemoMode()) return demoRequest(endpoint0, options);

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = path.startsWith('/') ? path : `/${path}`;
  let res;

  try {
    res = await fetch(`${BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error('Unable to connect to backend server. Make sure backend is running and VITE_API_URL is configured.');
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('API server unreachable or endpoint not found (404). If deployed on GitHub Pages/Vercel, deploy your Express server (e.g. Render/Railway) and set VITE_API_URL.');
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ===================== AUTH =====================
export const signupApi = (credentials) => request('/auth/signup', { method: 'POST', body: JSON.stringify(credentials) });
export const loginApi = (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logoutApi = () => request('/auth/logout', { method: 'POST' });
export const fetchMeApi = () => request('/auth/me');

// ===================== TASKS =====================
export const fetchTasks = () => request('/tasks');
export const createTask = (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTaskApi = (id) => request(`/tasks/${id}`, { method: 'DELETE' });

// ===================== GOALS =====================
export const fetchGoals = () => request('/goals');
export const createGoal = (goal) => request('/goals', { method: 'POST', body: JSON.stringify(goal) });
export const updateGoal = (id, data) => request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGoalApi = (id) => request(`/goals/${id}`, { method: 'DELETE' });

// ===================== ROUTINES =====================
export const fetchRoutines = () => request('/routines');
export const createRoutine = (routine) => request('/routines', { method: 'POST', body: JSON.stringify(routine) });
export const updateRoutine = (id, data) => request(`/routines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRoutineApi = (id) => request(`/routines/${id}`, { method: 'DELETE' });

// ===================== COMPLETIONS =====================
export const fetchCompletions = () => request('/completions');
export const saveCompletions = (data) => request('/completions', { method: 'PUT', body: JSON.stringify(data) });

// ===================== SETTINGS =====================
export const fetchSettings = () => request('/settings');
export const saveSettings = (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) });
export const resetSettings = () => request('/settings', { method: 'DELETE' });

// ===================== FOCUS SESSIONS =====================
export const fetchFocusSessions = () => request('/focus-sessions');
export const createFocusSession = (session) => request('/focus-sessions', { method: 'POST', body: JSON.stringify(session) });

// ===================== BULK LOAD =====================
/**
 * Fetch all user data in parallel. Returns shape matching AppContext state.
 */
export async function fetchAllData() {
  const [tasks, goals, routines, completions, settings] = await Promise.all([
    fetchTasks(),
    fetchGoals(),
    fetchRoutines(),
    fetchCompletions(),
    fetchSettings(),
  ]);
  return { tasks, goals, routines, completions, settings };
}

// ===================== CALENDARS =====================
export const fetchCalendarEvents = (from, to) =>
  request(`/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
export const testCalendarUrl = (url) => request('/calendar/test', { method: 'POST', body: JSON.stringify({ url }) });
export const createFeedToken = (timeZone) => request('/calendar/feed-token', { method: 'POST', body: JSON.stringify({ timeZone }) });
export const revokeFeedToken = () => request('/calendar/feed-token', { method: 'DELETE' });

/** Absolute, public URL of the user's Cadence calendar feed. */
export function feedUrlFor(token) {
  const base = /^https?:\/\//.test(BASE) ? BASE : `${window.location.origin}${BASE}`;
  return `${base}/calendar/feed/${token}.ics`;
}
