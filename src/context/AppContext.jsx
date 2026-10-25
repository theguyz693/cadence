import { createContext, useContext, useEffect, useReducer, useCallback, useRef, useState } from 'react';
import { loadData, saveData, clearData } from '../utils/storage.js';
import { generateId } from '../utils/helpers.js';
import { createDefaultPattern, toggleRoutineCompletion } from '../utils/recurrence.js';
import * as api from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';

const AppContext = createContext(null);

function appReducer(state, action) {
  switch (action.type) {
    // ===================== HYDRATE FROM API =====================
    case 'HYDRATE':
      return { ...action.payload };

    // ===================== TASKS =====================
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, {
          id: action.payload.id || generateId(),
          title: action.payload.title,
          description: action.payload.description || '',
          dueWithinDays: action.payload.dueWithinDays ?? null,
          priority: action.payload.priority || 'none',
          time: action.payload.time || null,
          duration: action.payload.duration || null,
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
        }],
      };

    case 'RESTORE_TASK':
      if (state.tasks.some(t => t.id === action.payload.id)) return state;
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload
            ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
            : t
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      };

    case 'EDIT_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };

    // ===================== GOALS =====================
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, {
          id: action.payload.id || generateId(),
          title: action.payload.title,
          description: action.payload.description || '',
          durationDays: action.payload.durationDays || 7,
          checklist: action.payload.checklist || [],
          completed: false,
          createdAt: new Date().toISOString(),
        }],
      };

    case 'EDIT_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
        ),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
      };

    case 'TOGGLE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g.id === action.payload ? { ...g, completed: !g.completed } : g
        ),
      };

    case 'TOGGLE_CHECKLIST_ITEM': {
      const { goalId, itemId } = action.payload;
      return {
        ...state,
        goals: state.goals.map(g => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            checklist: g.checklist.map(item =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            ),
          };
        }),
      };
    }

    case 'ADD_CHECKLIST_ITEM': {
      const { goalId, text } = action.payload;
      return {
        ...state,
        goals: state.goals.map(g => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            checklist: [...g.checklist, { id: generateId(), text, completed: false }],
          };
        }),
      };
    }

    case 'DELETE_CHECKLIST_ITEM': {
      const { goalId, itemId } = action.payload;
      return {
        ...state,
        goals: state.goals.map(g => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            checklist: g.checklist.filter(item => item.id !== itemId),
          };
        }),
      };
    }

    case 'RESTORE_CHECKLIST_ITEM': {
      const { goalId, item, index } = action.payload;
      return {
        ...state,
        goals: state.goals.map(g => {
          if (g.id !== goalId || g.checklist.some(i => i.id === item.id)) return g;
          const checklist = [...g.checklist];
          checklist.splice(Math.min(index, checklist.length), 0, item);
          return { ...g, checklist };
        }),
      };
    }

    case 'EDIT_CHECKLIST_ITEM': {
      const { goalId, itemId, text } = action.payload;
      return {
        ...state,
        goals: state.goals.map(g => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            checklist: g.checklist.map(item =>
              item.id === itemId ? { ...item, text } : item
            ),
          };
        }),
      };
    }

    // ===================== ROUTINES =====================
    case 'ADD_ROUTINE':
      return {
        ...state,
        routines: [...state.routines, {
          id: action.payload.id || generateId(),
          name: action.payload.name,
          icon: action.payload.icon || 'repeat',
          time: action.payload.time || null,
          duration: action.payload.duration || null,
          emoji: action.payload.emoji || '',
          cycleLength: action.payload.cycleLength || 7,
          pattern: action.payload.pattern || createDefaultPattern(action.payload.cycleLength || 7),
          startDate: action.payload.startDate || new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }],
      };

    case 'EDIT_ROUTINE':
      return {
        ...state,
        routines: state.routines.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };

    case 'DELETE_ROUTINE': {
      const newCompletions = { ...state.completions };
      delete newCompletions[action.payload];
      return {
        ...state,
        routines: state.routines.filter(r => r.id !== action.payload),
        completions: newCompletions,
      };
    }

    // ===================== COMPLETIONS =====================
    case 'SET_COMPLETIONS':
      return {
        ...state,
        completions: action.payload,
      };

    // ===================== SETTINGS =====================
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'RESET_DATA':
      return loadData();

    case 'CLEAR_ALL':
      clearData();
      return {
        tasks: [],
        goals: [],
        routines: [],
        completions: {},
        settings: { ...emptyState.settings, theme: state.settings?.theme, accentColor: state.settings?.accentColor, uiTheme: state.settings?.uiTheme },
      };

    default:
      return state;
  }
}

/**
 * Sync state changes to the backend API.
 * Called after each dispatch with the action and the new state.
 */
async function syncToApi(action, newState, prevState, onError) {
  try {
    switch (action.type) {
      // --- TASKS ---
      case 'ADD_TASK': {
        const newTask = newState.tasks[newState.tasks.length - 1];
        await api.createTask(newTask);
        break;
      }
      case 'RESTORE_TASK':
        await api.createTask(action.payload);
        break;
      case 'TOGGLE_TASK':
      case 'EDIT_TASK': {
        const id = action.type === 'TOGGLE_TASK' ? action.payload : action.payload.id;
        const task = newState.tasks.find(t => t.id === id);
        if (task) await api.updateTask(id, task);
        break;
      }
      case 'DELETE_TASK':
        await api.deleteTaskApi(action.payload);
        break;

      // --- GOALS ---
      case 'ADD_GOAL': {
        const newGoal = newState.goals[newState.goals.length - 1];
        await api.createGoal(newGoal);
        break;
      }
      case 'EDIT_GOAL':
      case 'TOGGLE_GOAL':
      case 'TOGGLE_CHECKLIST_ITEM':
      case 'ADD_CHECKLIST_ITEM':
      case 'DELETE_CHECKLIST_ITEM':
      case 'RESTORE_CHECKLIST_ITEM':
      case 'EDIT_CHECKLIST_ITEM': {
        // Find the affected goal ID
        let goalId;
        if (action.type === 'TOGGLE_GOAL') {
          goalId = action.payload;
        } else if (action.type === 'EDIT_GOAL') {
          goalId = action.payload.id;
        } else {
          goalId = action.payload.goalId;
        }
        const goal = newState.goals.find(g => g.id === goalId);
        if (goal) {
          // Send the full goal object (with updated checklist)
          const { _id, ...goalData } = goal;
          await api.updateGoal(goalId, goalData);
        }
        break;
      }
      case 'DELETE_GOAL':
        await api.deleteGoalApi(action.payload);
        break;

      // --- ROUTINES ---
      case 'ADD_ROUTINE': {
        const newRoutine = newState.routines[newState.routines.length - 1];
        await api.createRoutine(newRoutine);
        break;
      }
      case 'EDIT_ROUTINE': {
        const routine = newState.routines.find(r => r.id === action.payload.id);
        if (routine) {
          const { _id, ...routineData } = routine;
          await api.updateRoutine(action.payload.id, routineData);
        }
        break;
      }
      case 'DELETE_ROUTINE':
        await api.deleteRoutineApi(action.payload);
        // Also sync updated completions (routine key was removed)
        await api.saveCompletions(newState.completions);
        break;

      // --- COMPLETIONS ---
      case 'SET_COMPLETIONS':
        await api.saveCompletions(newState.completions);
        break;

      // --- SETTINGS ---
      case 'UPDATE_SETTINGS':
        await api.saveSettings(newState.settings);
        break;

      // --- CLEAR ALL ---
      case 'CLEAR_ALL':
        // Wipe all backend collections by sending empty data
        await Promise.all([
          api.saveCompletions({}),
          api.resetSettings(),
          // For tasks/goals/routines we need to delete individually or we can
          // just let them be cleared by sending the whole state on next load.
          // For simplicity, delete each item from the previous state.
          ...prevState.tasks.map(t => api.deleteTaskApi(t.id).catch(() => {})),
          ...prevState.goals.map(g => api.deleteGoalApi(g.id).catch(() => {})),
          ...prevState.routines.map(r => api.deleteRoutineApi(r.id).catch(() => {})),
        ]);
        break;

      // HYDRATE and RESET_DATA don't need API sync
      default:
        break;
    }
  } catch (err) {
    console.warn('API sync failed:', err.message);
    onError?.(err);
  }
}

const emptyState = {
  tasks: [],
  goals: [],
  routines: [],
  completions: {},
  settings: {
    theme: 'system',
    uiTheme: 'standard',
    accentColor: 'ember',
    showBanner: false,
    bgBlur: 25,
    bgDim: 60,
    activeBackground: 'random',
    customBackgrounds: [],
  },
};

export function AppProvider({ children }) {

  const { user } = useAuth();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(appReducer, null, loadData);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const prevStateRef = useRef(state);

  const actionQueueRef = useRef([]);

  const trackedDispatch = useCallback((action) => {
    prevStateRef.current = state;
    actionQueueRef.current.push({ action, prevState: state });
    dispatch(action);
  }, [state]);

  // Hydrate from API whenever user logs in or mounts
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!user) {
        dispatch({ type: 'HYDRATE', payload: emptyState });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await api.fetchAllData();
        if (!cancelled) {
          dispatch({ type: 'HYDRATE', payload: data });
          saveData(data);
          setApiAvailable(true);
        }
      } catch (err) {
        console.warn('API fetch failed:', err.message);
        setApiAvailable(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, [user]);

  // Sync to localStorage on every state change (write-through cache)
  useEffect(() => {
    if (state) {
      saveData(state);
    }
  }, [state]);

  // Process action queue — sync to API after state updates
  useEffect(() => {
    if (!apiAvailable) return;
    const queue = actionQueueRef.current;
    if (queue.length === 0) return;

    // Process all queued actions
    const items = queue.splice(0, queue.length);
    for (const { action, prevState } of items) {
      syncToApi(action, state, prevState, notifySyncError);
    }
  }, [state, apiAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Surface sync failures once per burst instead of failing silently.
  const lastSyncErrorRef = useRef(0);
  function notifySyncError(err) {
    const now = Date.now();
    if (now - lastSyncErrorRef.current < 4000) return;
    lastSyncErrorRef.current = now;
    toast({
      tone: 'error',
      title: "Couldn't save your last change",
      description: err?.message?.startsWith('Unable to connect')
        ? "Cadence can't reach the server. Check your connection and try again."
        : err?.message || 'Please try again.',
    });
  }

  const retryConnection = useCallback(async () => {
    if (!user) return false;
    setLoading(true);
    try {
      const data = await api.fetchAllData();
      dispatch({ type: 'HYDRATE', payload: data });
      saveData(data);
      setApiAvailable(true);
      return true;
    } catch {
      setApiAvailable(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value = {
    state,
    loading,
    apiAvailable,
    retryConnection,
    dispatch: trackedDispatch,
    // Convenience action creators
    addTask: useCallback((payload) => trackedDispatch({ type: 'ADD_TASK', payload }), [trackedDispatch]),
    toggleTask: useCallback((id) => trackedDispatch({ type: 'TOGGLE_TASK', payload: id }), [trackedDispatch]),
    deleteTask: useCallback((id) => trackedDispatch({ type: 'DELETE_TASK', payload: id }), [trackedDispatch]),
    editTask: useCallback((id, updates) => trackedDispatch({ type: 'EDIT_TASK', payload: { id, updates } }), [trackedDispatch]),
    restoreTask: useCallback((task) => trackedDispatch({ type: 'RESTORE_TASK', payload: task }), [trackedDispatch]),

    addGoal: useCallback((payload) => trackedDispatch({ type: 'ADD_GOAL', payload }), [trackedDispatch]),
    editGoal: useCallback((id, updates) => trackedDispatch({ type: 'EDIT_GOAL', payload: { id, updates } }), [trackedDispatch]),
    deleteGoal: useCallback((id) => trackedDispatch({ type: 'DELETE_GOAL', payload: id }), [trackedDispatch]),
    toggleGoal: useCallback((id) => trackedDispatch({ type: 'TOGGLE_GOAL', payload: id }), [trackedDispatch]),
    toggleChecklistItem: useCallback((goalId, itemId) => trackedDispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: { goalId, itemId } }), [trackedDispatch]),
    addChecklistItem: useCallback((goalId, text) => trackedDispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { goalId, text } }), [trackedDispatch]),
    deleteChecklistItem: useCallback((goalId, itemId) => trackedDispatch({ type: 'DELETE_CHECKLIST_ITEM', payload: { goalId, itemId } }), [trackedDispatch]),
    editChecklistItem: useCallback((goalId, itemId, text) => trackedDispatch({ type: 'EDIT_CHECKLIST_ITEM', payload: { goalId, itemId, text } }), [trackedDispatch]),
    restoreChecklistItem: useCallback((goalId, item, index) => trackedDispatch({ type: 'RESTORE_CHECKLIST_ITEM', payload: { goalId, item, index } }), [trackedDispatch]),

    addRoutine: useCallback((payload) => trackedDispatch({ type: 'ADD_ROUTINE', payload }), [trackedDispatch]),
    editRoutine: useCallback((id, updates) => trackedDispatch({ type: 'EDIT_ROUTINE', payload: { id, updates } }), [trackedDispatch]),
    deleteRoutine: useCallback((id) => trackedDispatch({ type: 'DELETE_ROUTINE', payload: id }), [trackedDispatch]),
    setCompletions: useCallback((completions) => trackedDispatch({ type: 'SET_COMPLETIONS', payload: completions }), [trackedDispatch]),
    toggleRoutineDay: useCallback((routineId, date = new Date()) => trackedDispatch({
      type: 'SET_COMPLETIONS',
      payload: toggleRoutineCompletion(state.completions, routineId, date),
    }), [trackedDispatch, state.completions]),

    updateSettings: useCallback((payload) => trackedDispatch({ type: 'UPDATE_SETTINGS', payload }), [trackedDispatch]),
    clearAll: useCallback(() => trackedDispatch({ type: 'CLEAR_ALL' }), [trackedDispatch]),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
