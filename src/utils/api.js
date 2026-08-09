/**
 * Frontend API client for Cadence backend.
 * All functions return parsed JSON. Errors are thrown as exceptions.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

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

// ===================== BULK LOAD =====================
/**
 * Fetch all data in parallel. Returns shape matching AppContext state.
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
