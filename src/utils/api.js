/**
 * Frontend API client for Cadence backend.
 * Includes JWT Token handling.
 */

const BASE = '/api';

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
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
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
