import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext.jsx';
import { useLockIn } from './LockInContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import TaskEditor from '../components/TaskEditor.jsx';
import RoutineEditor from '../components/RoutineEditor.jsx';
import GoalEditor from '../components/GoalEditor.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import CommandMenu from '../components/CommandMenu.jsx';
import QuickAddDialog from '../components/QuickAddDialog.jsx';
import { generateId } from '../utils/helpers.js';
import { mondayOnOrBefore } from '../utils/quickParse.js';
import { daysBetween, startOfDay } from '../utils/dates.js';

const WorkspaceContext = createContext(null);

function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * App-wide workspace actions: the shared editors (so any screen or the
 * command menu can create/edit), task actions with undo, destructive
 * confirmations, and global keyboard shortcuts.
 */
export function WorkspaceProvider({ children }) {
  const app = useApp();
  const { activeSession, showSetup, openLockIn } = useLockIn();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [taskEditor, setTaskEditor] = useState({ open: false, task: null, defaults: null });
  const [routineEditor, setRoutineEditor] = useState({ open: false, routine: null });
  const [goalEditor, setGoalEditor] = useState({ open: false, goal: null });
  const [confirm, setConfirm] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const openTaskEditor = useCallback((task = null, defaults = null) => setTaskEditor({ open: true, task, defaults }), []);
  const openRoutineEditor = useCallback((routine = null) => setRoutineEditor({ open: true, routine }), []);
  const openGoalEditor = useCallback((goal = null) => setGoalEditor({ open: true, goal }), []);
  const closeTaskEditor = () => setTaskEditor(s => ({ ...s, open: false }));
  const closeRoutineEditor = () => setRoutineEditor(s => ({ ...s, open: false }));
  const closeGoalEditor = () => setGoalEditor(s => ({ ...s, open: false }));

  // ---- Task actions ----
  const deleteTaskWithUndo = useCallback((task) => {
    app.deleteTask(task.id);
    toast({
      title: 'Task deleted',
      description: task.title,
      action: { label: 'Undo', onClick: () => app.restoreTask(task) },
    });
  }, [app, toast]);

  const askConfirm = useCallback((opts) => setConfirm(opts), []);

  const deleteRoutine = useCallback((routine, after) => {
    askConfirm({
      title: `Delete “${routine.name}”?`,
      message: 'The routine and its completion history will be permanently removed.',
      confirmLabel: 'Delete routine',
      onConfirm: () => {
        app.deleteRoutine(routine.id);
        toast({ title: 'Routine deleted', description: routine.name });
        after?.();
      },
    });
  }, [app, askConfirm, toast]);

  const deleteGoal = useCallback((goal, after) => {
    askConfirm({
      title: `Delete “${goal.title}”?`,
      message: `This removes the goal and its ${goal.checklist?.length || 0} steps. This can't be undone.`,
      confirmLabel: 'Delete goal',
      onConfirm: () => {
        app.deleteGoal(goal.id);
        toast({ title: 'Goal deleted', description: goal.title });
        after?.();
      },
    });
  }, [app, askConfirm, toast]);

  // ---- Save handlers ----
  const saveTask = (data) => {
    if (taskEditor.task) {
      app.editTask(taskEditor.task.id, data);
      toast({ tone: 'success', title: 'Task updated' });
    } else {
      app.addTask(data);
      toast({ tone: 'success', title: 'Task added', description: data.title });
    }
    closeTaskEditor();
  };

  const saveRoutine = (data) => {
    if (routineEditor.routine) {
      app.editRoutine(routineEditor.routine.id, data);
      toast({ tone: 'success', title: 'Routine updated' });
    } else {
      app.addRoutine(data);
      toast({ tone: 'success', title: 'Routine created', description: data.name });
    }
    closeRoutineEditor();
  };

  const saveGoal = (data) => {
    if (goalEditor.goal) {
      app.editGoal(goalEditor.goal.id, data);
      toast({ tone: 'success', title: 'Goal updated' });
    } else {
      app.addGoal(data);
      toast({ tone: 'success', title: 'Goal created', description: data.title });
    }
    closeGoalEditor();
  };

  const setTheme = useCallback((theme) => app.updateSettings({ theme }), [app]);

  // Latest state for toast actions that run after the create has landed.
  const stateRef = useRef(app.state);
  stateRef.current = app.state;

  /**
   * Create a task / routine / goal from a natural-language parse
   * (see utils/quickParse.js), then offer to open it for more detail.
   */
  const createFromParse = useCallback((parsed, { kind = parsed.kind, defaultDueToday = false } = {}) => {
    const id = generateId();
    const today = startOfDay();
    const title = parsed.title;

    if (kind === 'routine') {
      const rec = parsed.recurrence || { cycleLength: 1, active: [0] };
      const weekly = !!rec.weekdays;
      app.addRoutine({
        id,
        name: title,
        icon: 'repeat',
        cycleLength: rec.cycleLength,
        pattern: Array.from({ length: rec.cycleLength }, (_, i) => ({ active: rec.active.includes(i), label: '' })),
        // Weekly routines anchor day 1 to Monday so the pattern lines up with real weekdays.
        startDate: (weekly ? mondayOnOrBefore(today) : today).toISOString(),
        time: parsed.time,
        duration: parsed.duration,
      });
      toast({
        tone: 'success',
        title: 'Routine created',
        description: title,
        action: { label: 'Edit', onClick: () => { const r = stateRef.current.routines.find(x => x.id === id); if (r) setRoutineEditor({ open: true, routine: r }); } },
      });
    } else if (kind === 'goal') {
      const durationDays = parsed.date ? Math.max(1, daysBetween(today, parsed.date)) : 30;
      app.addGoal({ id, title, description: '', durationDays, checklist: [] });
      toast({
        tone: 'success',
        title: 'Goal created',
        description: title,
        action: { label: 'Add steps', onClick: () => navigate(`/goals/${id}`) },
      });
    } else {
      const dueWithinDays = parsed.date ? daysBetween(today, parsed.date) : defaultDueToday ? 0 : null;
      app.addTask({ id, title, dueWithinDays, priority: parsed.priority || 'none', time: parsed.time, duration: parsed.duration });
      toast({
        tone: 'success',
        title: 'Task added',
        description: title,
        action: { label: 'Edit', onClick: () => { const t = stateRef.current.tasks.find(x => x.id === id); if (t) setTaskEditor({ open: true, task: t, defaults: null }); } },
      });
    }
  }, [app, toast, navigate]);

  // ---- Global shortcuts ----
  const anyOverlay = taskEditor.open || routineEditor.open || goalEditor.open || quickAddOpen || !!confirm || showSetup || !!activeSession;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (activeSession) return;
        e.preventDefault();
        setCommandOpen(o => !o);
        return;
      }
      if (anyOverlay || commandOpen || isTyping(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="menu"]')) return;
      const k = e.key.toLowerCase();
      if (k === 'q') { e.preventDefault(); setQuickAddOpen(true); }
      else if (k === 'n') { e.preventDefault(); openTaskEditor(); }
      else if (k === 'r' && e.shiftKey) { e.preventDefault(); openRoutineEditor(); }
      else if (k === 'l') { e.preventDefault(); openLockIn(); }
      else if (k === '/') { e.preventDefault(); setCommandOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyOverlay, commandOpen, activeSession, openTaskEditor, openRoutineEditor, openLockIn]);

  const value = useMemo(() => ({
    openTaskEditor,
    openRoutineEditor,
    openGoalEditor,
    openCommandMenu: () => setCommandOpen(true),
    openQuickAdd: () => setQuickAddOpen(true),
    createFromParse,
    deleteTaskWithUndo,
    deleteRoutine,
    deleteGoal,
    askConfirm,
    setTheme,
  }), [openTaskEditor, openRoutineEditor, openGoalEditor, createFromParse, deleteTaskWithUndo, deleteRoutine, deleteGoal, askConfirm, setTheme]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}

      <TaskEditor
        isOpen={taskEditor.open}
        task={taskEditor.task}
        defaults={taskEditor.defaults}
        onClose={closeTaskEditor}
        onSave={saveTask}
        onDelete={taskEditor.task ? () => { const t = taskEditor.task; closeTaskEditor(); deleteTaskWithUndo(t); } : undefined}
      />
      <RoutineEditor
        isOpen={routineEditor.open}
        routine={routineEditor.routine}
        onClose={closeRoutineEditor}
        onSave={saveRoutine}
        onDelete={routineEditor.routine ? () => { const r = routineEditor.routine; closeRoutineEditor(); deleteRoutine(r, () => navigate('/routines')); } : undefined}
      />
      <GoalEditor
        isOpen={goalEditor.open}
        goal={goalEditor.goal}
        onClose={closeGoalEditor}
        onSave={saveGoal}
      />
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { const c = confirm; setConfirm(null); c?.onConfirm?.(); }}
      />
      <CommandMenu
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        actions={{ openTaskEditor, openRoutineEditor, openGoalEditor, openLockIn, setTheme, openQuickAdd: () => setQuickAddOpen(true), createFromParse }}
      />
      <QuickAddDialog isOpen={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
