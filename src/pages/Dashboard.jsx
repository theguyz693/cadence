import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import { RoutineMiniGrid } from '../components/RoutineGrid.jsx';
import {
  Lock,
  Check,
  Plus,
  Clock,
  Target,
  User,
  Sparkles,
} from 'lucide-react';
import {
  getRoutineDayInfo,
  getCyclePosition,
  isRoutineCompletedOn,
  toggleRoutineCompletion,
} from '../utils/recurrence.js';
import {
  getDaysRemaining,
  getCompletionPercentage,
  formatTimeRemaining,
} from '../utils/helpers.js';

export default function Dashboard() {
  const { state, setCompletions, toggleTask, toggleChecklistItem } = useApp();
  const { openLockIn } = useLockIn();
  const navigate = useNavigate();
  const [flashId, setFlashId] = useState(null);
  const [time, setTime] = useState(new Date());

  const today = new Date();

  // Update time periodically for the dashboard greeting area
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get today's routines
  const todaysRoutines = state.routines
    .map(routine => {
      const dayInfo = getRoutineDayInfo(routine, today);
      const cyclePos = getCyclePosition(routine, today);
      const isCompleted = isRoutineCompletedOn(state.completions, routine.id, today);
      return { routine, dayInfo, cyclePos, isCompleted };
    })
    .filter(r => r.dayInfo.active);

  // Active goals
  const activeGoals = state.goals.filter(g => !g.completed);

  // Pending tasks
  const pendingTasks = state.tasks.filter(t => !t.completed).slice(0, 6);

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
    const hrs = time.getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const routinesDoneCount = todaysRoutines.filter(r => r.isCompleted).length;
  const routinesTotalCount = todaysRoutines.length;
  const activeGoalsCount = activeGoals.length;
  const pendingTasksCount = state.tasks.filter(t => !t.completed).length;

  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Entrance animation — add class on mount, remove after animation completes
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setEntering(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-viewport">
      {/* ============ TOP HERO ROW ============ */}
      <div className="dashboard-hero-row cadence-stagger" style={{ '--stagger-i': 0 }}>
        <div className="glass-panel bento-greeting glow-border" style={{ justifyContent: 'center', width: '100%' }}>
          
          {/* Top Header Row with Date on Left & Live Time + Account Icon on Right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              {dateString}
            </div>

            {/* Time & Account Profile Icon in Top Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div className="live-time-display" style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <div className="profile-avatar-circle" onClick={() => navigate('/settings')} title="Settings Profile">
                <User size={18} strokeWidth={1.75} />
              </div>
            </div>
          </div>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--font-size-2xl)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {greeting}, <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Productive Human</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)', marginTop: '4px' }}>
            Maintain your tempo. Build your flow. Keep the rhythm.
          </p>

          <div className="greeting-stats-row" style={{ marginTop: 'var(--space-md)' }}>
            <div className="greeting-stat-pill" onClick={() => navigate('/routines')} style={{ cursor: 'pointer' }}>
              <span className="greeting-stat-num">
                {routinesTotalCount > 0 ? `${routinesDoneCount}/${routinesTotalCount}` : '0/0'}
              </span>
              <span className="greeting-stat-lbl">Routines</span>
            </div>
            <div className="greeting-stat-pill" onClick={() => navigate('/goals')} style={{ cursor: 'pointer' }}>
              <span className="greeting-stat-num">{activeGoalsCount}</span>
              <span className="greeting-stat-lbl">Goals Active</span>
            </div>
            <div className="greeting-stat-pill" onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
              <span className="greeting-stat-num">{pendingTasksCount}</span>
              <span className="greeting-stat-lbl">Tasks Left</span>
            </div>

            {/* Signature Lock In CTA Button */}
            <button
              className="lock-in-hero-btn"
              onClick={() => openLockIn()}
            >
              <span className="lock-in-icon"><Lock size={15} strokeWidth={2} /></span>
              <span className="lock-in-hero-btn-text">LOCK IN</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============ MAIN TWO-COLUMN LAYOUT: LEFT = ACTIVE GOALS (tall) / RIGHT = ROUTINES + TASKS ============ */}
      <div className="dashboard-main-split">
        
        {/* ================= LEFT COLUMN: ACTIVE GOALS (tall primary card) ================= */}
        <div className="dashboard-left-col">

          <div className="glass-panel active-goals-panel glow-border cadence-stagger" style={{ '--stagger-i': 1 }}>
            <div className="glass-panel-header">
              <div>
                <span className="glass-panel-title">Active Goals</span>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                  ALL OBJECTIVES
                </div>
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => navigate('/goals')} 
                style={{ fontSize: '11px', color: 'var(--accent-secondary)' }}
              >
                Manage Goals →
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Target size={36} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }} />
                <h4 style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
                  No Active Goals
                </h4>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)', maxWidth: '240px', lineHeight: 1.5, marginBottom: 'var(--space-lg)' }}>
                  Set up a target to track your major milestones and step-by-step progress.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/goals')}>
                  <Plus size={12} strokeWidth={2} /> Create Goal
                </button>
              </div>
            ) : (
              <div className="active-goals-list">
                {activeGoals.map(goal => {
                  const completed = goal.checklist.filter(i => i.completed).length;
                  const total = goal.checklist.length;
                  const percentage = getCompletionPercentage(completed, total);
                  const daysLeft = getDaysRemaining(goal.createdAt, goal.durationDays);
                  const timeClass = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : '';

                  return (
                    <div 
                      key={goal.id} 
                      className="active-goal-card"
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    >
                      <div className="active-goal-card-top">
                        <span className="active-goal-title">{goal.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLockIn(goal.title);
                            }}
                            title="Lock in on this goal"
                            style={{ fontSize: '10px', padding: '2px 8px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Lock size={10} strokeWidth={1.75} /> Lock In
                          </button>
                          <span className="active-goal-percentage">{percentage}%</span>
                        </div>
                      </div>

                      {/* Compact progress bar */}
                      <div className="progress-bar active-goal-progress-bar">
                        <div
                          className={`progress-bar-fill ${percentage === 100 ? 'complete' : ''}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Counts + Days remaining */}
                      <div className="active-goal-meta-row">
                        <span className="active-goal-count-badge">
                          {completed}/{total}
                        </span>
                        <span className={`active-goal-days-left ${timeClass}`} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} strokeWidth={1.75} /> {formatTimeRemaining(daysLeft)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ================= RIGHT COLUMN: TODAY'S ROUTINES + TASK CHECKLIST ================= */}
        <div className="dashboard-right-col">

          {/* 1. TODAY'S ROUTINES */}
          <div className="glass-panel glow-border bento-todays-routines cadence-stagger" style={{ '--stagger-i': 2 }}>
            <div className="glass-panel-header">
              <span className="glass-panel-title">Today's Routines</span>
              <span className="glass-panel-subtitle" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                {routinesDoneCount}/{routinesTotalCount} Complete
              </span>
            </div>

            {todaysRoutines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Sparkles size={28} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }} />
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  No active routines scheduled for today. Enjoy the peace!
                </p>
              </div>
            ) : (
              <div className="card-list" style={{ marginTop: 'var(--space-xs)' }}>
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
                      <div className="dashboard-card-subtitle" style={{ marginBottom: 'var(--space-xs)' }}>
                        {dayInfo.label ? (
                          <span className="today-action-label">{dayInfo.label}</span>
                        ) : (
                          `Day ${cyclePos + 1} of ${routine.cycleLength}`
                        )}
                      </div>
                      <RoutineMiniGrid pattern={routine.pattern} currentIndex={cyclePos} />
                    </div>
                    <div className="dashboard-card-action" style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openLockIn(routine.name)}
                        title="Lock In on this routine"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Lock size={12} strokeWidth={1.75} /> Focus
                      </button>
                      <button
                        className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        onClick={() => handleToggleRoutineCompletion(routine.id)}
                      >
                        {isCompleted ? <Check size={12} strokeWidth={2} /> : 'Complete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. TASKS CHECKLIST */}
          <div className="glass-panel glow-border bento-tasks-checklist cadence-stagger" style={{ '--stagger-i': 3 }}>
            <div className="glass-panel-header">
              <span className="glass-panel-title">Tasks Checklist</span>
              {pendingTasks.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')} style={{ fontSize: '10px' }}>
                  View all →
                </button>
              )}
            </div>

            {pendingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Check size={28} strokeWidth={1.5} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-sm)' }} />
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  All clear! No pending tasks remaining.
                </p>
              </div>
            ) : (
              <div className="card-list" style={{ marginTop: 'var(--space-xs)' }}>
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
                        <div className="task-row-desc" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} strokeWidth={1.75} /> {formatTimeRemaining(getDaysRemaining(task.createdAt, task.dueWithinDays))}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openLockIn(task.title)}
                      title="Lock in on this task"
                      style={{ fontSize: '11px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Lock size={11} strokeWidth={1.75} /> Lock In
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

