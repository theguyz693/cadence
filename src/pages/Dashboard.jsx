import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { RoutineMiniGrid } from '../components/RoutineGrid.jsx';
import {
  getRoutineDayInfo,
  getCyclePosition,
  isRoutineCompletedOn,
  toggleRoutineCompletion,
  getNextActiveDay,
} from '../utils/recurrence.js';
import {
  getDaysRemaining,
  getCompletionPercentage,
  formatTimeRemaining,
} from '../utils/helpers.js';

export default function Dashboard() {
  const { state, setCompletions, toggleTask } = useApp();
  const navigate = useNavigate();
  const [flashId, setFlashId] = useState(null);

  const today = new Date();

  // Get today's routines
  const todaysRoutines = state.routines
    .map(routine => {
      const dayInfo = getRoutineDayInfo(routine, today);
      const cyclePos = getCyclePosition(routine, today);
      const isCompleted = isRoutineCompletedOn(state.completions, routine.id, today);
      return { routine, dayInfo, cyclePos, isCompleted };
    })
    .filter(r => r.dayInfo.active);

  // Routines that are rest today — show the next occurrence
  const restRoutines = state.routines
    .map(routine => {
      const dayInfo = getRoutineDayInfo(routine, today);
      if (dayInfo.active) return null;
      const next = getNextActiveDay(routine, today);
      return next ? { routine, next } : null;
    })
    .filter(Boolean);

  // Active goals
  const activeGoals = state.goals.filter(g => !g.completed);

  // Pending tasks
  const pendingTasks = state.tasks.filter(t => !t.completed).slice(0, 5);

  const handleToggleRoutineCompletion = (routineId) => {
    const newCompletions = toggleRoutineCompletion(state.completions, routineId, today);
    setCompletions(newCompletions);
    setFlashId(routineId);
    setTimeout(() => setFlashId(null), 400);
  };

  const handleToggleTask = (taskId) => {
    toggleTask(taskId);
    setFlashId(taskId);
    setTimeout(() => setFlashId(null), 400);
  };

  const greeting = (() => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const routinesDoneCount = todaysRoutines.filter(r => r.isCompleted).length;
  const routinesTotalCount = todaysRoutines.length;
  const activeGoalsCount = activeGoals.length;
  const pendingTasksCount = state.tasks.filter(t => !t.completed).length;

  return (
    <div>
      {/* Hero Welcome Card */}
      <div className="dashboard-hero animate-pop">
        <div className="dashboard-hero-content">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1>
            {greeting}, <span className="hero-accent">Productive Human</span>
          </h1>
          <p>Keep your momentum going. Stay in rhythm.</p>
          
          <div className="dashboard-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">
                {routinesTotalCount > 0 ? `${routinesDoneCount}/${routinesTotalCount}` : '—'}
              </span>
              <span className="hero-stat-label">Routines</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{activeGoalsCount}</span>
              <span className="hero-stat-label">Active Goals</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{pendingTasksCount}</span>
              <span className="hero-stat-label">Tasks Left</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ TODAY'S ROUTINES ============ */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Today's Routines</span>
          <span className="section-title" style={{ color: 'var(--text-tertiary)' }}>
            {todaysRoutines.filter(r => r.isCompleted).length}/{todaysRoutines.length} done
          </span>
        </div>

        {todaysRoutines.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)', opacity: 0.5 }}>🌿</div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              No routines scheduled for today. Enjoy the break!
            </p>
          </div>
        ) : (
          <div className="card-list">
            {todaysRoutines.map(({ routine, dayInfo, cyclePos, isCompleted }) => (
              <div
                key={routine.id}
                className={`dashboard-card ${flashId === routine.id ? 'completion-flash' : ''}`}
              >
                <div className="dashboard-card-icon">
                  {routine.emoji || '📋'}
                </div>
                <div className="dashboard-card-content">
                  <div className="dashboard-card-title">{routine.name}</div>
                  <div className="dashboard-card-subtitle">
                    {dayInfo.label ? (
                      <span className="today-action-label">{dayInfo.label}</span>
                    ) : (
                      `Day ${cyclePos + 1} of ${routine.cycleLength}`
                    )}
                  </div>
                  <RoutineMiniGrid pattern={routine.pattern} currentIndex={cyclePos} />
                </div>
                <div className="dashboard-card-action">
                  <button
                    className={`btn ${isCompleted ? 'btn-secondary' : 'btn-success'} btn-sm`}
                    onClick={() => handleToggleRoutineCompletion(routine.id)}
                  >
                    {isCompleted ? '✓ Done' : 'Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ UPCOMING ROUTINES ============ */}
      {restRoutines.length > 0 && (
        <div className="section">
          <div className="section-header">
            <span className="section-title">Upcoming</span>
          </div>
          <div className="card-list">
            {restRoutines.map(({ routine, next }) => (
              <div key={routine.id} className="dashboard-card" style={{ opacity: 0.7 }}>
                <div className="dashboard-card-icon" style={{ opacity: 0.6 }}>
                  {routine.emoji || '📋'}
                </div>
                <div className="dashboard-card-content">
                  <div className="dashboard-card-title">{routine.name}</div>
                  <div className="dashboard-card-subtitle">
                    {next.daysUntil === 1 ? 'Tomorrow' : `In ${next.daysUntil} days`}
                    {next.dayInfo.label && (
                      <> · <span className="today-action-label">{next.dayInfo.label}</span></>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ GOALS / DEADLINES ============ */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Active Goals</span>
          {activeGoals.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/goals')}>
              View all →
            </button>
          )}
        </div>

        {activeGoals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)', opacity: 0.5 }}>🎯</div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              No active goals. Create one to track your progress!
            </p>
          </div>
        ) : (
          <div className="card-list">
            {activeGoals.map(goal => {
              const completed = goal.checklist.filter(i => i.completed).length;
              const total = goal.checklist.length;
              const percentage = getCompletionPercentage(completed, total);
              const daysLeft = getDaysRemaining(goal.createdAt, goal.durationDays);
              const timeClass = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : '';

              return (
                <div
                  key={goal.id}
                  className="dashboard-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                >
                  <div className="dashboard-card-icon">🎯</div>
                  <div className="dashboard-card-content">
                    <div className="dashboard-card-title">{goal.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div
                          className={`progress-bar-fill ${percentage === 100 ? 'complete' : ''}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {completed}/{total}
                      </span>
                    </div>
                    <div className={`time-remaining ${timeClass}`} style={{ marginTop: 'var(--space-xs)' }}>
                      ⏱ {formatTimeRemaining(daysLeft)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ TASKS ============ */}
      <div className="section">
        <div className="section-header">
          <span className="section-title">Tasks</span>
          {pendingTasks.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>
              View all →
            </button>
          )}
        </div>

        {pendingTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)', opacity: 0.5 }}>✅</div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              All caught up! No pending tasks.
            </p>
          </div>
        ) : (
          <div className="card-list">
            {pendingTasks.map(task => (
              <div
                key={task.id}
                className={`task-row ${flashId === task.id ? 'completion-flash' : ''}`}
              >
                <div
                  className={`checklist-checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={() => handleToggleTask(task.id)}
                />
                <div className="task-row-content">
                  <div className={`task-row-title ${task.completed ? 'completed' : ''}`}>
                    {task.title}
                  </div>
                  {task.dueWithinDays && (
                    <div className="task-row-desc">
                      {formatTimeRemaining(getDaysRemaining(task.createdAt, task.dueWithinDays))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
