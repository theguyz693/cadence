import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, Sun, Repeat, CheckSquare, Target, Settings as SettingsIcon, Plus, Lock,
  SunMedium, MoonStar, Monitor, CornerDownLeft, Sparkles, CalendarDays,
} from 'lucide-react';
import { parseQuickAdd } from '../utils/quickParse.js';
import { useApp } from '../context/AppContext.jsx';

/**
 * ⌘K command menu: jump anywhere, create anything, find any item.
 * Implements the combobox + listbox pattern for screen readers.
 */
export default function CommandMenu({ isOpen, onClose, actions }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const run = (fn) => { onClose(); setTimeout(fn, 0); };

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s) => !q || s.toLowerCase().includes(q);

    const quick = q ? parseQuickAdd(query) : null;
    const create = quick && quick.title ? [{
      id: 'create-parsed',
      label: `Create ${quick.kind} “${quick.title}”`,
      icon: Sparkles,
      meta: 'Quick add',
      run: () => actions.createFromParse(quick),
    }] : [];

    const commands = [
      { id: 'quick-add', label: 'Quick add…', icon: Sparkles, hint: 'Q', run: () => actions.openQuickAdd() },
      { id: 'new-task', label: 'New task', icon: Plus, hint: 'N', run: () => actions.openTaskEditor() },
      { id: 'new-routine', label: 'New routine', icon: Plus, hint: '⇧R', run: () => actions.openRoutineEditor() },
      { id: 'new-goal', label: 'New goal', icon: Plus, run: () => actions.openGoalEditor() },
      { id: 'lock-in', label: 'Start a focus session', icon: Lock, hint: 'L', run: () => actions.openLockIn() },
    ].filter(c => match(c.label));

    const nav = [
      { id: 'go-today', label: 'Go to Today', icon: Sun, run: () => navigate('/') },
      { id: 'go-routines', label: 'Go to Routines', icon: Repeat, run: () => navigate('/routines') },
      { id: 'go-tasks', label: 'Go to Tasks', icon: CheckSquare, run: () => navigate('/tasks') },
      { id: 'go-goals', label: 'Go to Goals', icon: Target, run: () => navigate('/goals') },
      { id: 'go-calendar', label: 'Go to Calendar', icon: CalendarDays, run: () => navigate('/calendar') },
      { id: 'go-settings', label: 'Go to Settings', icon: SettingsIcon, run: () => navigate('/settings') },
    ].filter(c => match(c.label));

    const appearance = [
      { id: 'theme-light', label: 'Use light theme', icon: SunMedium, run: () => actions.setTheme('light') },
      { id: 'theme-dark', label: 'Use dark theme', icon: MoonStar, run: () => actions.setTheme('dark') },
      { id: 'theme-system', label: 'Match system theme', icon: Monitor, run: () => actions.setTheme('system') },
    ].filter(c => match(c.label));

    const results = !q ? [] : [
      ...state.routines.filter(r => match(r.name)).slice(0, 4).map(r => ({
        id: `r-${r.id}`, label: r.name, icon: Repeat, meta: 'Routine', run: () => navigate(`/routines?open=${r.id}`),
      })),
      ...state.tasks.filter(t => !t.completed && match(t.title)).slice(0, 5).map(t => ({
        id: `t-${t.id}`, label: t.title, icon: CheckSquare, meta: 'Task', run: () => actions.openTaskEditor(t),
      })),
      ...state.goals.filter(g => match(g.title)).slice(0, 4).map(g => ({
        id: `g-${g.id}`, label: g.title, icon: Target, meta: 'Goal', run: () => navigate(`/goals/${g.id}`),
      })),
    ];

    return [
      { label: 'Results', items: results },
      { label: 'Create', items: commands },
      { label: 'Navigate', items: nav },
      { label: 'Appearance', items: appearance },
      // Last, so typing a page name still jumps there on Enter.
      { label: 'Quick add', items: create },
    ].filter(g => g.items.length);
  }, [query, state.routines, state.tasks, state.goals, actions, navigate]);

  const flat = groups.flatMap(g => g.items);
  const activeId = flat[active] ? `${listId}-${flat[active].id}` : undefined;

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  if (!isOpen) return null;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(flat.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = flat[active]; if (it) run(it.run); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  };

  let index = -1;
  return createPortal(
    <div className="dialog-backdrop command-backdrop" data-state="open" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="command" role="dialog" aria-modal="true" aria-label="Command menu">
        <div className="command-search">
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search or jump to…"
            spellCheck={false}
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="command-list" id={listId} role="listbox" ref={listRef} aria-label="Commands">
          {flat.length === 0 && <div className="command-empty">No matches for “{query}”</div>}
          {groups.map(group => (
            <div key={group.label} role="group" aria-label={group.label}>
              <div className="command-group-label" aria-hidden="true">{group.label}</div>
              {group.items.map(item => {
                index += 1;
                const i = index;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    id={`${listId}-${item.id}`}
                    role="option"
                    aria-selected={i === active}
                    className={`command-item ${i === active ? 'is-active' : ''}`}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(item.run)}
                  >
                    <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                    <span className="grow truncate">{item.label}</span>
                    {item.meta && <span className="t-meta">{item.meta}</span>}
                    {item.hint && <kbd className="kbd">{item.hint}</kbd>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="command-footer">
          <span><kbd className="kbd">↑</kbd><kbd className="kbd">↓</kbd> to move</span>
          <span><kbd className="kbd"><CornerDownLeft size={10} /></kbd> to select</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
