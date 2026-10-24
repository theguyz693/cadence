import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, MoreHorizontal, Pencil, Plus, RotateCcw, Target, Timer, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { PageHeader, Segmented, EmptyState, ProgressBar, CheckButton, IconButton } from '../components/ui/primitives.jsx';
import Menu from '../components/ui/Menu.jsx';
import { getGoalDeadline, formatFullDate } from '../utils/dates.js';

function goalProgress(goal) {
  const total = goal.checklist?.length || 0;
  const done = goal.checklist?.filter(i => i.completed).length || 0;
  return { total, done, pct: total ? Math.round((done / total) * 100) : null };
}

export default function Goals() {
  const { goalId } = useParams();
  const { state } = useApp();
  const selected = goalId ? state.goals.find(g => g.id === goalId) : null;

  if (goalId && !selected) {
    return (
      <div className="page page-narrow">
        <section className="panel">
          <EmptyState
            icon={Target}
            title="This goal doesn't exist anymore"
            description="It may have been deleted on another device."
            action={<Link className="btn btn-secondary" to="/goals">Back to goals</Link>}
          />
        </section>
      </div>
    );
  }
  if (selected) return <GoalDetail goal={selected} />;
  return <GoalList />;
}

/* ------------------------------------------------------------------------ */

function GoalList() {
  const { state } = useApp();
  const { openGoalEditor } = useWorkspace();
  const [filter, setFilter] = useState('active');

  const active = state.goals.filter(g => !g.completed);
  const done = state.goals.filter(g => g.completed);
  const list = (filter === 'active' ? active : filter === 'done' ? done : state.goals)
    .slice()
    .sort((a, b) => Number(a.completed) - Number(b.completed) || getGoalDeadline(a).diff - getGoalDeadline(b).diff);

  return (
    <div className="page page-narrow">
      <PageHeader
        title="Goals"
        description="Bigger outcomes with a deadline, broken into steps you can finish one day at a time."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openGoalEditor()}>
            <Plus size={15} strokeWidth={2} aria-hidden="true" /> New goal
          </button>
        }
      />

      <div className="toolbar">
        <Segmented
          label="Filter goals"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: 'Active', count: active.length },
            { value: 'done', label: 'Achieved', count: done.length },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <section className="panel">
          <EmptyState
            icon={Target}
            title={filter === 'done' ? 'No goals achieved yet' : state.goals.length ? 'No active goals' : 'Set your first goal'}
            description={filter === 'done' ? 'When you complete a goal, it moves here.' : 'Give it a deadline and a few concrete steps. Cadence shows the next step on your Today page.'}
            action={filter !== 'done' && (
              <button type="button" className="btn btn-primary" onClick={() => openGoalEditor()}>
                <Plus size={15} strokeWidth={2} /> New goal
              </button>
            )}
          />
        </section>
      ) : (
        <ul className="goal-list">
          {list.map(goal => {
            const { total, done: stepsDone, pct } = goalProgress(goal);
            const deadline = getGoalDeadline(goal);
            const next = goal.checklist.find(i => !i.completed);
            return (
              <li key={goal.id}>
                <Link to={`/goals/${goal.id}`} className={`goal-card ${goal.completed ? 'is-done' : ''}`}>
                  <div className="goal-card-head">
                    <h2 className="goal-card-title">{goal.title}</h2>
                    {goal.completed
                      ? <span className="badge badge-success"><Check size={12} strokeWidth={2.5} /> Achieved</span>
                      : <span className={`due due-${deadline.tone}`}><CalendarDays size={12} strokeWidth={1.75} /> {deadline.label}</span>}
                  </div>
                  {goal.description && <p className="goal-card-desc">{goal.description}</p>}
                  {total > 0 ? (
                    <div className="goal-card-progress">
                      <ProgressBar value={stepsDone} max={total} label={`${goal.title} progress`} tone={goal.completed ? 'success' : 'accent'} />
                      <span className="t-meta t-num">{stepsDone} of {total} steps · {pct}%</span>
                    </div>
                  ) : (
                    <div className="t-meta">No steps yet — open the goal to add some.</div>
                  )}
                  {!goal.completed && next && (
                    <div className="goal-card-next"><span className="t-caps">Next</span> <span className="truncate">{next.text}</span></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function GoalDetail({ goal }) {
  const {
    toggleGoal, toggleChecklistItem, addChecklistItem, deleteChecklistItem, editChecklistItem, restoreChecklistItem,
  } = useApp();
  const { openLockIn } = useLockIn();
  const { openGoalEditor, deleteGoal } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [newStep, setNewStep] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const editRef = useRef(null);
  const newRef = useRef(null);

  useEffect(() => {
    if (editingId) { editRef.current?.focus(); editRef.current?.select(); }
  }, [editingId]);

  const { total, done, pct } = goalProgress(goal);
  const deadline = getGoalDeadline(goal);

  const addStep = (e) => {
    e.preventDefault();
    if (!newStep.trim()) return;
    addChecklistItem(goal.id, newStep.trim());
    setNewStep('');
    newRef.current?.focus();
  };

  const commitEdit = (item) => {
    const text = editText.trim();
    if (text && text !== item.text) editChecklistItem(goal.id, item.id, text);
    setEditingId(null);
  };

  const removeStep = (item, index) => {
    deleteChecklistItem(goal.id, item.id);
    toast({ title: 'Step deleted', description: item.text, action: { label: 'Undo', onClick: () => restoreChecklistItem(goal.id, item, index) } });
  };

  const toggleComplete = () => {
    toggleGoal(goal.id);
    if (!goal.completed) toast({ tone: 'success', title: 'Goal achieved', description: goal.title });
  };

  return (
    <div className="page page-narrow">
      <Link to="/goals" className="back-link"><ArrowLeft size={14} strokeWidth={1.75} /> Goals</Link>

      <header className="goal-detail-head">
        <div className="grow">
          <h1 className={`t-title ${goal.completed ? 'is-done-text' : ''}`}>{goal.title}</h1>
          {goal.description && <p className="page-description">{goal.description}</p>}
        </div>
        <div className="page-actions">
          {!goal.completed && (
            <IconButton icon={Timer} label="Lock in on this goal" onClick={() => openLockIn(goal.title)} />
          )}
          <button type="button" className={`btn ${goal.completed ? 'btn-secondary' : 'btn-primary'}`} onClick={toggleComplete}>
            {goal.completed ? <><RotateCcw size={14} strokeWidth={2} /> Reopen</> : <><Check size={14} strokeWidth={2.25} /> Mark achieved</>}
          </button>
          <Menu
            label="Goal actions"
            items={[
              { label: 'Edit goal', icon: Pencil, onSelect: () => openGoalEditor(goal) },
              { type: 'separator' },
              { label: 'Delete goal', icon: Trash2, tone: 'danger', onSelect: () => deleteGoal(goal, () => navigate('/goals')) },
            ]}
            trigger={(props) => <button {...props} className="icon-btn"><MoreHorizontal size={16} strokeWidth={1.75} /></button>}
          />
        </div>
      </header>

      <section className="goal-stats" aria-label="Goal progress">
        <div className="goal-stat">
          <span className="t-caps">Progress</span>
          <span className="goal-stat-value t-num">{pct === null ? '—' : `${pct}%`}</span>
          <span className="t-meta t-num">{total ? `${done} of ${total} steps` : 'Add steps to track progress'}</span>
        </div>
        <div className="goal-stat">
          <span className="t-caps">Deadline</span>
          <span className="goal-stat-value">{formatFullDate(deadline.date)}</span>
          <span className={`t-meta due-${goal.completed ? 'later' : deadline.tone}`}>{goal.completed ? 'Achieved' : deadline.label}</span>
        </div>
        {total > 0 && (
          <div className="goal-stat goal-stat-bar">
            <ProgressBar value={done} max={total} label="Steps completed" tone={goal.completed ? 'success' : 'accent'} />
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="steps-heading">
        <div className="panel-header">
          <h2 id="steps-heading" className="t-section">Steps</h2>
          <span className="t-meta t-num">{done}/{total}</span>
        </div>

        <form className="quick-add quick-add-bordered" onSubmit={addStep}>
          <Plus size={15} strokeWidth={2} aria-hidden="true" />
          <label htmlFor="new-step" className="sr-only">Add a step</label>
          <input
            id="new-step"
            ref={newRef}
            value={newStep}
            onChange={e => setNewStep(e.target.value)}
            placeholder="Add a step — press Enter to save"
            maxLength={200}
            autoComplete="off"
          />
        </form>

        {total === 0 ? (
          <p className="t-meta panel-pad">Break the goal into steps small enough to finish in a sitting.</p>
        ) : (
          <ul className="item-list">
            {goal.checklist.map((item, index) => (
              <li key={item.id} className={`item-row step-row ${item.completed ? 'is-done' : ''}`}>
                <CheckButton
                  shape="square"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(goal.id, item.id)}
                  label={item.completed ? `Mark step “${item.text}” as not done` : `Complete step “${item.text}”`}
                />
                {editingId === item.id ? (
                  <input
                    ref={editRef}
                    className="input input-sm grow"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={() => commitEdit(item)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(item);
                      if (e.key === 'Escape') { e.stopPropagation(); setEditingId(null); }
                    }}
                    aria-label="Edit step"
                  />
                ) : (
                  <span className="item-main item-main-static" onDoubleClick={() => { setEditingId(item.id); setEditText(item.text); }}>
                    <span className="item-title">{item.text}</span>
                  </span>
                )}
                <div className="item-actions">
                  <IconButton icon={Pencil} size={14} label="Edit step" className="hover-reveal" onClick={() => { setEditingId(item.id); setEditText(item.text); }} />
                  <IconButton icon={Trash2} size={14} label="Delete step" tone="danger" className="hover-reveal" onClick={() => removeStep(item, index)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
