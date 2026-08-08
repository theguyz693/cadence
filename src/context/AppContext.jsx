import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { loadData, saveData, clearData } from '../utils/storage.js';
import { generateId } from '../utils/helpers.js';
import { createDefaultPattern } from '../utils/recurrence.js';

const AppContext = createContext(null);

function appReducer(state, action) {
  switch (action.type) {
    // ===================== TASKS =====================
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, {
          id: generateId(),
          title: action.payload.title,
          description: action.payload.description || '',
          dueWithinDays: action.payload.dueWithinDays || null,
          completed: false,
          createdAt: new Date().toISOString(),
        }],
      };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload ? { ...t, completed: !t.completed } : t
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
          id: generateId(),
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
          id: generateId(),
          name: action.payload.name,
          emoji: action.payload.emoji || '📋',
          cycleLength: action.payload.cycleLength || 7,
          pattern: action.payload.pattern || createDefaultPattern(action.payload.cycleLength || 7),
          startDate: new Date().toISOString(),
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
        settings: { theme: 'dark' },
      };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadData);

  // Auto-save on every state change
  useEffect(() => {
    if (state) {
      saveData(state);
    }
  }, [state]);

  const value = {
    state,
    dispatch,
    // Convenience action creators
    addTask: useCallback((payload) => dispatch({ type: 'ADD_TASK', payload }), []),
    toggleTask: useCallback((id) => dispatch({ type: 'TOGGLE_TASK', payload: id }), []),
    deleteTask: useCallback((id) => dispatch({ type: 'DELETE_TASK', payload: id }), []),
    editTask: useCallback((id, updates) => dispatch({ type: 'EDIT_TASK', payload: { id, updates } }), []),

    addGoal: useCallback((payload) => dispatch({ type: 'ADD_GOAL', payload }), []),
    editGoal: useCallback((id, updates) => dispatch({ type: 'EDIT_GOAL', payload: { id, updates } }), []),
    deleteGoal: useCallback((id) => dispatch({ type: 'DELETE_GOAL', payload: id }), []),
    toggleGoal: useCallback((id) => dispatch({ type: 'TOGGLE_GOAL', payload: id }), []),
    toggleChecklistItem: useCallback((goalId, itemId) => dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: { goalId, itemId } }), []),
    addChecklistItem: useCallback((goalId, text) => dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { goalId, text } }), []),
    deleteChecklistItem: useCallback((goalId, itemId) => dispatch({ type: 'DELETE_CHECKLIST_ITEM', payload: { goalId, itemId } }), []),
    editChecklistItem: useCallback((goalId, itemId, text) => dispatch({ type: 'EDIT_CHECKLIST_ITEM', payload: { goalId, itemId, text } }), []),

    addRoutine: useCallback((payload) => dispatch({ type: 'ADD_ROUTINE', payload }), []),
    editRoutine: useCallback((id, updates) => dispatch({ type: 'EDIT_ROUTINE', payload: { id, updates } }), []),
    deleteRoutine: useCallback((id) => dispatch({ type: 'DELETE_ROUTINE', payload: id }), []),
    setCompletions: useCallback((completions) => dispatch({ type: 'SET_COMPLETIONS', payload: completions }), []),

    updateSettings: useCallback((payload) => dispatch({ type: 'UPDATE_SETTINGS', payload }), []),
    clearAll: useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
