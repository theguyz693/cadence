import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Repeat, MoreHorizontal, Pencil, Trash2, Timer, History, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { PageHeader, EmptyState, CheckButton } from '../components/ui/primitives.jsx';
import Menu from '../components/ui/Menu.jsx';
import RoutineIcon from '../components/RoutineIcon.jsx';
import RoutineSequence from '../components/RoutineSequence.jsx';
import { describeSchedule, getConsistency, getStreak, getTodayStatus } from '../utils/routineStats.js';
import { relativeDayLabel } from '../utils/dates.js';

export default function Routines() {
  const { state, toggleRoutineDay } = useApp();
  const { openLockIn } = useLockIn();
  const { openRoutineEditor, deleteRoutine } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState(() => params.get('open'));
  const refs = useRef({});

  // Deep link (?open=id) from Today / command menu: expand and scroll into view.
  useEffect(() => {
    const id = params.get('open');
    if (!id) return;
    setExpanded(id);
    requestAnimationFrame(() => refs.current[id]?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    params.delete('open');
    setParams(params, { replace: true });
  }, [params, setParams]);

  // Due today first, then the rest in creation order.
  const routines = [...state.routines].sort((a, b) => {
    const sa = getTodayStatus(a, state.completions);
    const sb = getTodayStatus(b, state.completions);
    const rank = (s) => (s.dueToday ? (s.done ? 1 : 0) : 2);
    return rank(sa) - rank(sb);
  });

  return (
    <div className="page page-narrow">
      <PageHeader
        title="Routines"
        description="Repeating rhythms on a 1–20 day cycle. Check off today, or catch up on a day you missed."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openRoutineEditor()}>
            <Plus size={15} strokeWidth={2} aria-hidden="true" /> New routine
          </button>
        }
      />

      {routines.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={Repeat}
            title="Design your first routine"
            description="Choose how long the cycle is — a week, ten days, any length up to 20 — then pick which days it runs. Cadence keeps your place in the sequence."
            action={
              <button type="button" className="btn btn-primary" onClick={() => openRoutineEditor()}>
                <Plus size={15} strokeWidth={2} /> New routine
              </button>
            }
          />
        </section>
      ) : (
        <ul className="routine-list">
          {routines.map(routine => {
            const status = getTodayStatus(routine, state.completions);
            const consistency = getConsistency(routine, state.completions, 28);
            const streak = getStreak(routine, state.completions);
            const isOpen = expanded === routine.id;

            return (
              <li
                key={routine.id}
                ref={el => { refs.current[routine.id] = el; }}
                className={`routine-card ${status.dueToday && !status.done ? 'is-due' : ''}`}
              >
                <div className="routine-card-head">
                  <RoutineIcon routine={routine} size="lg" />
                  <div className="grow">
                    <h2 className="routine-card-title">{routine.name}</h2>
                    <div className="t-meta t-num">
                      {describeSchedule(routine)} · Day {status.position + 1} of {routine.cycleLength}
                    </div>
                  </div>

                  <div className="routine-card-status">
                    {status.dueToday ? (
                      <label className={`today-toggle ${status.done ? 'is-done' : ''}`}>
                        <CheckButton
                          checked={status.done}
                          onChange={() => toggleRoutineDay(routine.id)}
                          label={status.done ? `Mark ${routine.name} as not done today` : `Complete ${routine.name} for today`}
                        />
                        <span>{status.done ? 'Done today' : status.label ? `Today · ${status.label}` : 'Due today'}</span>
                      </label>
                    ) : (
                      <span className="t-meta">
                        {status.next ? `Next: ${relativeDayLabel(status.next.date)}` : 'No days scheduled'}
                      </span>
                    )}
                  </div>

                  <Menu
                    label={`Actions for ${routine.name}`}
                    items={[
                      { label: 'Edit routine', icon: Pencil, onSelect: () => openRoutineEditor(routine) },
                      { label: isOpen ? 'Hide history' : 'View history', icon: History, onSelect: () => setExpanded(isOpen ? null : routine.id) },
                      { label: 'Lock in on this', icon: Timer, onSelect: () => openLockIn(routine.name) },
                      { type: 'separator' },
                      { label: 'Delete', icon: Trash2, tone: 'danger', onSelect: () => deleteRoutine(routine) },
                    ]}
                    trigger={(props) => (
                      <button {...props} className="icon-btn"><MoreHorizontal size={16} strokeWidth={1.75} /></button>
                    )}
                  />
                </div>

                <RoutineSequence
                  key={isOpen ? 'history' : 'current'}
                  routine={routine}
                  completions={state.completions}
                  onToggleDay={(date) => toggleRoutineDay(routine.id, date)}
                  navigable={isOpen}
                />

                <div className="routine-card-foot">
                  {consistency.scheduled > 0 ? (
                    <span className="t-meta t-num">
                      <strong>{consistency.done}</strong> of {consistency.scheduled} scheduled days in the last 4 weeks
                    </span>
                  ) : (
                    <span className="t-meta">History builds as you check days off</span>
                  )}
                  {streak >= 2 && (
                    <span className="streak t-num" title="Consecutive scheduled days completed">
                      <Flame size={12} strokeWidth={2} aria-hidden="true" /> {streak} in a row
                    </span>
                  )}
                  <button type="button" className="btn btn-ghost btn-xs ml-auto" onClick={() => setExpanded(isOpen ? null : routine.id)} aria-expanded={isOpen}>
                    {isOpen ? 'Hide history' : 'History'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
