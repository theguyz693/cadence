import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock, Plus, Repeat, CheckSquare, Target, ArrowRight, Check, CalendarClock, Timer, Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { CheckButton, ProgressRing, ProgressBar, EmptyState, Skeleton } from '../components/ui/primitives.jsx';
import TaskRow from '../components/TaskRow.jsx';
import SmartAdd from '../components/SmartAdd.jsx';
import RoutineIcon from '../components/RoutineIcon.jsx';
import RoutineSequence from '../components/RoutineSequence.jsx';
import { getRoutineDayInfo, getCyclePosition, isRoutineCompletedOn, getNextActiveDay } from '../utils/recurrence.js';
import { getTaskDue, getGoalDeadline, formatLongDate, greetingFor, relativeDayLabel, isSameDay, startOfDay, addDays } from '../utils/dates.js';
import { formatMinutesLabel } from '../utils/lockInStorage.js';
import { getItemsForDate, formatTime, toMinutes } from '../utils/schedule.js';
import { useCalendarEvents } from '../hooks/useCalendarEvents.js';
import DayTimeline from '../components/DayTimeline.jsx';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2, none: 3 };
const MAX_TASKS = 7;

/** Rank pending tasks: overdue, due today, then priority, then due date. */
function rankTasks(tasks, today) {
  return tasks
    .map(t => ({ task: t, due: getTaskDue(t, today) }))
    .sort((a, b) => {
      const ad = a.due ? a.due.diff : Infinity;
      const bd = b.due ? b.due.diff : Infinity;
      const aUrgent = ad <= 0 ? 0 : 1;
      const bUrgent = bd <= 0 ? 0 : 1;
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      const pr = (PRIORITY_RANK[a.task.priority] ?? 3) - (PRIORITY_RANK[b.task.priority] ?? 3);
      if (pr) return pr;
      if (ad !== bd) return ad - bd;
      return new Date(a.task.createdAt) - new Date(b.task.createdAt);
    });
}

export default function Dashboard() {
  const { state, loading, toggleTask, editTask, toggleChecklistItem, toggleRoutineDay } = useApp();
  const { user } = useAuth();
  const { openLockIn, todayStats } = useLockIn();
  const { openTaskEditor, openRoutineEditor, openGoalEditor, deleteTaskWithUndo } = useWorkspace();
  const navigate = useNavigate();
  // Tasks checked off during this visit stay visible (struck through) until reload.
  const [recentlyDone, setRecentlyDone] = useState(() => new Set());

  const today = new Date();

  // ---------- Derived data (all from real state) ----------
  const routinesToday = useMemo(() => state.routines
    .map(routine => ({
      routine,
      info: getRoutineDayInfo(routine, today),
      pos: getCyclePosition(routine, today),
      done: isRoutineCompletedOn(state.completions, routine.id, today),
    }))
    .filter(r => r.info.active)
    .sort((a, b) => Number(a.done) - Number(b.done)), [state.routines, state.completions]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTasks = state.tasks.filter(t => !t.completed);
  const ranked = rankTasks(openTasks, today);
  const visibleTasks = [
    ...ranked.slice(0, MAX_TASKS).map(r => r.task),
    ...state.tasks.filter(t => t.completed && recentlyDone.has(t.id)),
  ];
  const tasksDueToday = ranked.filter(r => r.due && r.due.diff <= 0);
  const tasksDoneToday = state.tasks.filter(t => t.completed && t.completedAt && isSameDay(t.completedAt, today));

  const activeGoals = state.goals.filter(g => !g.completed);

  const routinesDone = routinesToday.filter(r => r.done).length;
  // "Today's plan" = routines scheduled today + tasks due today/overdue (+ ones finished today).
  const planTotal = routinesToday.length + tasksDueToday.length + tasksDoneToday.length;
  const planDone = routinesDone + tasksDoneToday.length;

  // Coming up: the next few scheduled routine days and dated tasks.
  const comingUp = useMemo(() => {
    const items = [];
    state.routines.forEach(r => {
      const next = getNextActiveDay(r, today);
      if (next && next.daysUntil <= 6) {
        items.push({ key: `r-${r.id}`, date: next.date, title: r.name, sub: next.dayInfo.label, kind: 'routine', routine: r });
      }
    });
    openTasks.forEach(t => {
      const due = getTaskDue(t, today);
      if (due && due.diff > 0 && due.diff <= 6) items.push({ key: `t-${t.id}`, date: due.date, title: t.title, kind: 'task', task: t });
    });
    return items.sort((a, b) => a.date - b.date).slice(0, 6);
  }, [state.routines, state.tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Today's schedule: timed routines/tasks plus subscribed calendar events.
  const dayStart = startOfDay(today);
  const { events } = useCalendarEvents(dayStart, addDays(dayStart, 1));
  const scheduleItems = getItemsForDate(state, today, events);
  const timedCount = scheduleItems.filter(i => !i.allDay).length;
  const nowMin = today.getHours() * 60 + today.getMinutes();

  // The single most meaningful next action — something starting soon wins.
  const nextAction = (() => {
    const soon = scheduleItems
      .filter(i => !i.allDay && !i.done && (i.kind === 'routine' || i.kind === 'task'))
      .find(i => toMinutes(i.time) + (i.duration || 30) > nowMin && toMinutes(i.time) - nowMin <= 90);
    if (soon?.kind === 'routine') {
      const r = routinesToday.find(x => x.routine.id === soon.ref.id);
      if (r && !r.done) return { kind: 'routine', ...r, at: soon.time };
    }
    if (soon?.kind === 'task') return { kind: 'task', task: soon.ref, due: getTaskDue(soon.ref, today), at: soon.time };
    const routine = routinesToday.find(r => !r.done);
    if (routine) return { kind: 'routine', ...routine };
    const urgent = ranked[0];
    if (urgent && (urgent.due?.diff <= 0 || urgent.task.priority === 'high')) return { kind: 'task', task: urgent.task, due: urgent.due };
    return null;
  })();

  const isEmpty = state.routines.length === 0 && state.tasks.length === 0 && state.goals.length === 0;
  const showSkeleton = loading && isEmpty;

  // ---------- Handlers ----------
  const toggleTaskTracked = (task) => {
    if (!task.completed) setRecentlyDone(s => new Set(s).add(task.id));
    toggleTask(task.id);
  };

  const firstName = user?.username ? user.username.split(/[\s._-]/)[0] : '';

  // ---------- Render ----------
  return (
    <div className="page page-today">
      <header className="today-header">
        <div className="grow">
          <div className="page-eyebrow">{formatLongDate(today)}</div>
          <h1 className="t-title">{greetingFor(today)}{firstName ? `, ${firstName}` : ''}</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openLockIn(nextAction?.kind === 'task' ? nextAction.task.title : nextAction?.routine?.name || '')}>
          <Lock size={15} strokeWidth={2} aria-hidden="true" /> Lock in
        </button>
      </header>

      {showSkeleton ? <TodaySkeleton /> : isEmpty ? (
        <Onboarding
          onRoutine={() => openRoutineEditor()}
          onTask={() => openTaskEditor(null, { dueOffset: 0 })}
          onGoal={() => openGoalEditor()}
        />
      ) : (
        <>
          {/* ---------- Summary strip ---------- */}
          <section className="summary" aria-label="Today at a glance">
            <div className="summary-main">
              <ProgressRing value={planDone} max={Math.max(planTotal, 1)} size={48} stroke={4} label="Today's progress">
                <span className="t-num summary-ring-num">{planTotal ? Math.round((planDone / planTotal) * 100) : 0}<small>%</small></span>
              </ProgressRing>
              <div>
                <div className="summary-headline">
                  {planTotal === 0
                    ? 'Nothing scheduled today'
                    : planDone === planTotal
                      ? 'Everything for today is done'
                      : <><span className="t-num">{planDone}</span> of <span className="t-num">{planTotal}</span> done today</>}
                </div>
                <div className="t-meta">
                  {planTotal === 0 ? 'A good day to get ahead on a goal.' : 'Routines due today plus tasks due today or overdue.'}
                </div>
              </div>
            </div>
            <dl className="summary-stats">
              <div>
                <dt>Routines</dt>
                <dd className="t-num">{routinesDone}<span>/{routinesToday.length}</span></dd>
              </div>
              <div>
                <dt>Tasks done</dt>
                <dd className="t-num">{tasksDoneToday.length}</dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd className="t-num">{formatMinutesLabel(todayStats.totalMinutes)}</dd>
              </div>
            </dl>
          </section>

          {/* ---------- Up next ---------- */}
          {nextAction && (
            <section className="up-next" aria-label="Up next">
              <div className="up-next-label">Up next</div>
              {nextAction.kind === 'routine' ? (
                <div className="up-next-body">
                  <RoutineIcon routine={nextAction.routine} />
                  <div className="grow">
                    <div className="up-next-title">{nextAction.routine.name}{nextAction.info.label ? ` · ${nextAction.info.label}` : ''}</div>
                    <div className="t-meta t-num">{nextAction.at ? `${formatTime(nextAction.at)} · ` : ''}Day {nextAction.pos + 1} of {nextAction.routine.cycleLength}</div>
                  </div>
                  <div className="up-next-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openLockIn(nextAction.routine.name)}>
                      <Timer size={14} strokeWidth={1.75} /> Focus
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => toggleRoutineDay(nextAction.routine.id)}>
                      <Check size={14} strokeWidth={2.25} /> Mark done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="up-next-body">
                  <span className="routine-icon" aria-hidden="true"><CheckSquare size={16} strokeWidth={1.75} /></span>
                  <div className="grow">
                    <div className="up-next-title">{nextAction.task.title}</div>
                    <div className="t-meta">{nextAction.at ? `${formatTime(nextAction.at)} · ` : ''}{nextAction.due ? nextAction.due.label : 'High priority'}</div>
                  </div>
                  <div className="up-next-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openLockIn(nextAction.task.title)}>
                      <Timer size={14} strokeWidth={1.75} /> Focus
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => toggleTaskTracked(nextAction.task)}>
                      <Check size={14} strokeWidth={2.25} /> Complete
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <div className="today-grid">
            <div className="today-primary">
              {/* ---------- Schedule ---------- */}
              <section className="panel" aria-labelledby="today-schedule">
                <div className="panel-header">
                  <h2 id="today-schedule" className="t-section">Schedule</h2>
                  {timedCount > 0 && <span className="t-meta t-num">{timedCount} timed</span>}
                  <Link to="/calendar" className="panel-link">Calendar</Link>
                </div>
                <DayTimeline
                  items={scheduleItems}
                  isToday
                  minHours={[Math.max(6, Math.floor(nowMin / 60) - 1), Math.min(24, Math.floor(nowMin / 60) + 6)]}
                  onToggle={(item) => item.kind === 'routine' ? toggleRoutineDay(item.ref.id) : toggleTaskTracked(item.ref)}
                  onOpen={(item) => item.kind === 'task' ? openTaskEditor(item.ref) : item.kind === 'routine' ? navigate(`/routines?open=${item.ref.id}`) : item.kind === 'goal' ? navigate(`/goals/${item.ref.id}`) : null}
                  emptyHint={<>Nothing at a set time today. Give a task or routine a time — or type “call mom 6pm” above — and it shows up here. You can also <Link to="/settings#s-calendars" className="link">connect a calendar</Link>.</>}
                />
              </section>

              {/* ---------- Routines ---------- */}
              <section className="panel" aria-labelledby="today-routines">
                <div className="panel-header">
                  <h2 id="today-routines" className="t-section">Routines</h2>
                  <span className="t-meta t-num">{routinesDone} of {routinesToday.length}</span>
                  <Link to="/routines" className="panel-link">All routines</Link>
                </div>
                {routinesToday.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Repeat}
                    title={state.routines.length ? 'No routines scheduled today' : 'No routines yet'}
                    description={state.routines.length ? 'Rest days are part of the rhythm.' : 'Routines repeat on a cycle you design — every day, every other day, or a custom 1–20 day sequence.'}
                    action={!state.routines.length && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openRoutineEditor()}>
                        <Plus size={14} strokeWidth={2} /> New routine
                      </button>
                    )}
                  />
                ) : (
                  <ul className="item-list">
                    {routinesToday.map(({ routine, info, pos, done }) => (
                      <li key={routine.id} className={`item-row routine-row ${done ? 'is-done' : ''}`}>
                        <CheckButton
                          checked={done}
                          onChange={() => toggleRoutineDay(routine.id)}
                          label={done ? `Mark ${routine.name} as not done today` : `Complete ${routine.name} for today`}
                        />
                        <button type="button" className="item-main" onClick={() => navigate(`/routines?open=${routine.id}`)}>
                          <span className="item-title">
                            {routine.name}
                            {info.label && <span className="item-tag">{info.label}</span>}
                          </span>
                          <span className="item-notes t-num">Day {pos + 1} of {routine.cycleLength}</span>
                        </button>
                        <div className="routine-row-seq">
                          <RoutineSequence routine={routine} completions={state.completions} compact />
                        </div>
                        <div className="item-actions">
                          <button type="button" className="icon-btn hover-reveal" onClick={() => openLockIn(routine.name)} aria-label={`Lock in on ${routine.name}`} data-tooltip="Lock in">
                            <Timer size={15} strokeWidth={1.75} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ---------- Tasks ---------- */}
              <section className="panel" aria-labelledby="today-tasks">
                <div className="panel-header">
                  <h2 id="today-tasks" className="t-section">Tasks</h2>
                  <span className="t-meta t-num">{openTasks.length} open</span>
                  <Link to="/tasks" className="panel-link">All tasks</Link>
                </div>
                <SmartAdd id="today-quick-add" defaultDueToday placeholder="Add for today — try “call mom 6pm” or “gym mon wed fri”" />
                {visibleTasks.length === 0 ? (
                  <EmptyState compact icon={CheckSquare} title="No open tasks" description="Your list is clear. Add something above when it comes up." />
                ) : (
                  <ul className="item-list">
                    {visibleTasks.map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        showNotes={false}
                        onToggle={() => toggleTaskTracked(task)}
                        onEdit={() => openTaskEditor(task)}
                        onDelete={() => deleteTaskWithUndo(task)}
                        onFocus={() => openLockIn(task.title)}
                        onPriority={(p) => editTask(task.id, { priority: p })}
                      />
                    ))}
                  </ul>
                )}
                {openTasks.length > MAX_TASKS && (
                  <Link to="/tasks" className="panel-more">
                    {openTasks.length - MAX_TASKS} more open {openTasks.length - MAX_TASKS === 1 ? 'task' : 'tasks'} <ArrowRight size={13} />
                  </Link>
                )}
              </section>
            </div>

            <aside className="today-secondary">
              {/* ---------- Goals ---------- */}
              <section className="panel" aria-labelledby="today-goals">
                <div className="panel-header">
                  <h2 id="today-goals" className="t-section">Goals</h2>
                  <Link to="/goals" className="panel-link">All goals</Link>
                </div>
                {activeGoals.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Target}
                    title="No active goals"
                    description="Goals give your days a direction."
                    action={<button type="button" className="btn btn-secondary btn-sm" onClick={() => openGoalEditor()}><Plus size={14} strokeWidth={2} /> New goal</button>}
                  />
                ) : (
                  <ul className="goal-mini-list">
                    {activeGoals.slice(0, 4).map(goal => {
                      const done = goal.checklist.filter(i => i.completed).length;
                      const total = goal.checklist.length;
                      const deadline = getGoalDeadline(goal, today);
                      const nextStep = goal.checklist.find(i => !i.completed);
                      return (
                        <li key={goal.id} className="goal-mini">
                          <Link to={`/goals/${goal.id}`} className="goal-mini-head">
                            <span className="goal-mini-title truncate">{goal.title}</span>
                            <span className={`t-meta due-${deadline.tone} goal-mini-deadline`}>{deadline.label}</span>
                          </Link>
                          {total > 0 ? (
                            <div className="goal-mini-progress">
                              <ProgressBar value={done} max={total} size="sm" label={`${goal.title} progress`} />
                              <span className="t-meta t-num">{done}/{total}</span>
                            </div>
                          ) : (
                            <div className="t-meta">No steps yet</div>
                          )}
                          {nextStep && (
                            <div className="goal-next-step">
                              <CheckButton
                                size="sm"
                                shape="square"
                                checked={false}
                                onChange={() => toggleChecklistItem(goal.id, nextStep.id)}
                                label={`Complete step: ${nextStep.text}`}
                              />
                              <span className="truncate">{nextStep.text}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* ---------- Coming up ---------- */}
              <section className="panel" aria-labelledby="today-upcoming">
                <div className="panel-header">
                  <h2 id="today-upcoming" className="t-section">Coming up</h2>
                </div>
                {comingUp.length === 0 ? (
                  <p className="t-meta panel-pad">Nothing scheduled in the next few days.</p>
                ) : (
                  <ul className="upcoming-list">
                    {comingUp.map(item => (
                      <li key={item.key}>
                        <button
                          type="button"
                          className="upcoming-item"
                          onClick={() => item.kind === 'task' ? openTaskEditor(item.task) : navigate(`/routines?open=${item.routine.id}`)}
                        >
                          <span className="upcoming-day">{relativeDayLabel(item.date, today)}</span>
                          <span className="grow truncate">{item.title}{item.sub ? <span className="t-tertiary"> · {item.sub}</span> : null}</span>
                          {item.kind === 'routine'
                            ? <Repeat size={13} strokeWidth={1.75} className="t-tertiary" aria-label="Routine" />
                            : <CalendarClock size={13} strokeWidth={1.75} className="t-tertiary" aria-label="Task due" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ---------- Focus today ---------- */}
              {todayStats.count > 0 && (
                <section className="panel" aria-labelledby="today-focus">
                  <div className="panel-header">
                    <h2 id="today-focus" className="t-section">Focus sessions</h2>
                    <span className="t-meta t-num">{formatMinutesLabel(todayStats.totalMinutes)}</span>
                  </div>
                  <ul className="focus-list">
                    {todayStats.sessions.slice(0, 5).map(s => (
                      <li key={s.id || s._id || s.completedAt}>
                        <span className="grow truncate">{s.taskTitle}</span>
                        <span className="t-meta t-num">{Math.round((s.durationSec || 0) / 60)}m</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Onboarding({ onRoutine, onTask, onGoal }) {
  const steps = [
    {
      icon: Repeat,
      title: 'Design a routine',
      text: 'Pick the days it repeats — every day, every other day, or a custom sequence up to 20 days.',
      cta: 'Create a routine',
      onClick: onRoutine,
      primary: true,
    },
    { icon: CheckSquare, title: 'Add a task for today', text: 'Capture one thing you want to get done.', cta: 'Add a task', onClick: onTask },
    { icon: Target, title: 'Set a goal', text: 'Give it a deadline and a few steps.', cta: 'Set a goal', onClick: onGoal },
  ];
  return (
    <section className="onboarding" aria-labelledby="onboarding-title">
      <div className="onboarding-intro">
        <span className="onboarding-badge"><Sparkles size={13} strokeWidth={2} aria-hidden="true" /> Getting started</span>
        <h2 id="onboarding-title" className="t-heading">Build your rhythm in three small steps</h2>
        <p className="t-secondary">Cadence works best when it holds the things you repeat. Start with one routine — you can always add more later.</p>
      </div>
      <ol className="onboarding-steps">
        {steps.map((s, i) => (
          <li key={s.title} className="onboarding-step">
            <span className="onboarding-num t-num" aria-hidden="true">{i + 1}</span>
            <div className="grow">
              <div className="onboarding-step-title">{s.title}</div>
              <p className="t-meta">{s.text}</p>
            </div>
            <button type="button" className={`btn btn-sm ${s.primary ? 'btn-primary' : 'btn-secondary'}`} onClick={s.onClick}>
              {s.cta}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <div className="stack gap-4" aria-busy="true" aria-label="Loading your day">
      <div className="summary"><Skeleton width={48} height={48} radius="50%" /><div className="grow stack gap-2"><Skeleton width="40%" /><Skeleton width="25%" height={10} /></div></div>
      <div className="today-grid">
        <div className="panel panel-pad stack gap-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} height={18} width={`${80 - i * 10}%`} />)}</div>
        <div className="panel panel-pad stack gap-3">{[0, 1, 2].map(i => <Skeleton key={i} height={14} />)}</div>
      </div>
    </div>
  );
}
