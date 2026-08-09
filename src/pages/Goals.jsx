import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import Modal from '../components/Modal.jsx';
import {
  Lock,
  Clock,
  Edit3,
  Trash2,
  Plus,
  Target,
  ArrowLeft,
  Check
} from 'lucide-react';
import {
  getDaysRemaining,
  getCompletionPercentage,
  formatTimeRemaining,
} from '../utils/helpers.js';

export default function Goals() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { openLockIn } = useLockIn();
  const {
    state, addGoal, editGoal, deleteGoal, toggleGoal,
    toggleChecklistItem, addChecklistItem, deleteChecklistItem, editChecklistItem,
  } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [filter, setFilter] = useState('active');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [initialItems, setInitialItems] = useState('');

  // Detail view state
  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemText, setEditItemText] = useState('');
  const editInputRef = useRef(null);
  const newItemRef = useRef(null);

  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingItemId]);

  // If goalId is set, show goal detail view
  const selectedGoal = goalId ? state.goals.find(g => g.id === goalId) : null;

  if (selectedGoal) {
    return <GoalDetail
      goal={selectedGoal}
      onBack={() => navigate('/goals')}
      toggleChecklistItem={toggleChecklistItem}
      addChecklistItem={addChecklistItem}
      deleteChecklistItem={deleteChecklistItem}
      editChecklistItem={editChecklistItem}
      toggleGoal={toggleGoal}
      deleteGoal={(id) => { deleteGoal(id); navigate('/goals'); }}
      editGoal={editGoal}
    />;
  }

  const filteredGoals = state.goals.filter(g => {
    if (filter === 'active') return !g.completed;
    if (filter === 'completed') return g.completed;
    return true;
  });

  const openCreate = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setDurationDays(7);
    setInitialItems('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const checklistItems = initialItems
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(text => ({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        text,
        completed: false,
      }));

    if (editingGoal) {
      editGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim(),
        durationDays: Number(durationDays) || 7,
      });
    } else {
      addGoal({
        title: title.trim(),
        description: description.trim(),
        durationDays: Number(durationDays) || 7,
        checklist: checklistItems,
      });
    }
    setShowModal(false);
  };

  return (
    <div className="centered-page-container">
      <div className="page-header">
        <h2>Goals</h2>
        <p>Track deadlines and progress on larger objectives</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div className="filter-tabs">
          {['active', 'completed', 'all'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={15} strokeWidth={2} /> New Goal
        </button>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="empty-state">
          <Target size={40} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h3>{filter === 'completed' ? 'No completed goals yet' : 'No active goals'}</h3>
          <p>Create a goal with a deadline and checklist to track your progress.</p>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} strokeWidth={2} /> New Goal
          </button>
        </div>
      ) : (
        <div className="card-list">
          {filteredGoals.map(goal => {
            const completed = goal.checklist.filter(i => i.completed).length;
            const total = goal.checklist.length;
            const percentage = getCompletionPercentage(completed, total);
            const daysLeft = getDaysRemaining(goal.createdAt, goal.durationDays);
            const timeClass = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : '';

            return (
              <div
                key={goal.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/goals/${goal.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                      <h3 className="card-title" style={{ textDecoration: goal.completed ? 'line-through' : 'none', opacity: goal.completed ? 0.6 : 1 }}>
                        {goal.title}
                      </h3>
                      {goal.completed && <span className="badge badge-success">Complete</span>}
                    </div>
                    {goal.description && (
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                        {goal.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${percentage === 100 ? 'complete' : ''}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {completed}/{total} · {percentage}%
                      </span>
                      {!goal.completed && (
                        <span className={`time-remaining ${timeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                          <Clock size={12} strokeWidth={1.75} /> {formatTimeRemaining(daysLeft)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                    {!goal.completed && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLockIn(goal.title);
                        }}
                        title="Start Lock In session for this goal"
                        style={{ color: 'var(--accent-secondary)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Lock size={12} strokeWidth={1.75} /> Lock In
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={(e) => { e.stopPropagation(); openEdit(goal); }}
                      title="Edit Goal"
                    >
                      <Edit3 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGoal ? 'Edit Goal' : 'New Goal'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Finish 30 DSA questions"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What's this goal about?"
            rows={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Duration (days)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <input
              className="range-slider"
              type="range"
              min={1}
              max={90}
              value={durationDays}
              onChange={e => setDurationDays(Number(e.target.value))}
            />
            <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
              {durationDays}d
            </span>
          </div>
        </div>

        {!editingGoal && (
          <div className="form-group">
            <label className="form-label">Checklist items (one per line)</label>
            <textarea
              className="form-input"
              value={initialItems}
              onChange={e => setInitialItems(e.target.value)}
              placeholder={"LC 209\nLC 3\nLC 424\nLC 76"}
              rows={5}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============================================================
   Goal Detail Component
   ============================================================ */
function GoalDetail({
  goal, onBack, toggleChecklistItem, addChecklistItem,
  deleteChecklistItem, editChecklistItem, toggleGoal, deleteGoal, editGoal,
}) {
  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemText, setEditItemText] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDesc, setEditDesc] = useState(goal.description);
  const [editDuration, setEditDuration] = useState(goal.durationDays);
  const editInputRef = useRef(null);
  const newItemRef = useRef(null);

  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingItemId]);

  const completed = goal.checklist.filter(i => i.completed).length;
  const total = goal.checklist.length;
  const percentage = getCompletionPercentage(completed, total);
  const daysLeft = getDaysRemaining(goal.createdAt, goal.durationDays);
  const timeClass = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : '';

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    addChecklistItem(goal.id, newItemText.trim());
    setNewItemText('');
    newItemRef.current?.focus();
  };

  const handleEditItem = (itemId) => {
    if (!editItemText.trim()) return;
    editChecklistItem(goal.id, itemId, editItemText.trim());
    setEditingItemId(null);
  };

  const handleSaveGoalEdit = () => {
    editGoal(goal.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      durationDays: Number(editDuration) || 7,
    });
    setShowEdit(false);
  };

  return (
    <div className="centered-page-container">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 'var(--space-md)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} strokeWidth={1.75} /> Back to Goals
        </button>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, textDecoration: goal.completed ? 'line-through' : 'none' }}>
                {goal.title}
              </h2>
              {goal.completed && <span className="badge badge-success">Complete</span>}
            </div>
            {goal.description && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>{goal.description}</p>
            )}

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
              <div className="progress-bar" style={{ flex: 1, minWidth: 150 }}>
                <div
                  className={`progress-bar-fill ${percentage === 100 ? 'complete' : ''}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {percentage}%
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap', fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {completed} / {total} items
              </span>
              {!goal.completed && (
                <span className={`time-remaining ${timeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} strokeWidth={1.75} /> {formatTimeRemaining(daysLeft)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexShrink: 0 }}>
            <button
              className={`btn btn-sm ${goal.completed ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => toggleGoal(goal.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {goal.completed ? 'Reopen' : <><Check size={12} strokeWidth={2} /> Complete</>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setEditTitle(goal.title);
              setEditDesc(goal.description);
              setEditDuration(goal.durationDays);
              setShowEdit(true);
            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Edit3 size={12} strokeWidth={1.75} /> Edit
            </button>
            <button className="btn btn-ghost btn-sm btn-danger" onClick={() => deleteGoal(goal.id)}>
              <Trash2 size={12} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Checklist</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {completed}/{total}
          </span>
        </div>

        {/* Add new item */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <input
            ref={newItemRef}
            className="form-input"
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            placeholder="Add a checklist item..."
            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
          />
          <button className="btn btn-primary btn-sm" onClick={handleAddItem} disabled={!newItemText.trim()}>
            Add
          </button>
        </div>

        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            No items yet. Add checklist items above to track your progress.
          </div>
        ) : (
          <div className="checklist">
            {goal.checklist.map(item => (
              <div key={item.id} className="checklist-item">
                <div
                  className={`checklist-checkbox ${item.completed ? 'checked' : ''}`}
                  onClick={() => toggleChecklistItem(goal.id, item.id)}
                />
                {editingItemId === item.id ? (
                  <input
                    ref={editInputRef}
                    className="form-input"
                    value={editItemText}
                    onChange={e => setEditItemText(e.target.value)}
                    onBlur={() => handleEditItem(item.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditItem(item.id);
                      if (e.key === 'Escape') setEditingItemId(null);
                    }}
                    style={{ padding: 'var(--space-xs) var(--space-sm)' }}
                  />
                ) : (
                  <span
                    className={`checklist-text ${item.completed ? 'completed' : ''}`}
                    onDoubleClick={() => { setEditingItemId(item.id); setEditItemText(item.text); }}
                  >
                    {item.text}
                  </span>
                )}
                <div className="checklist-actions">
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => { setEditingItemId(item.id); setEditItemText(item.text); }}
                    title="Edit"
                  >
                    <Edit3 size={13} strokeWidth={1.75} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon btn-danger"
                    onClick={() => deleteChecklistItem(goal.id, item.id)}
                    title="Delete"
                  >
                    <Trash2 size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Goal"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveGoalEdit} disabled={!editTitle.trim()}>Save</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} />
        </div>
        <div className="form-group">
          <label className="form-label">Duration (days)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <input
              className="range-slider"
              type="range"
              min={1}
              max={90}
              value={editDuration}
              onChange={e => setEditDuration(Number(e.target.value))}
            />
            <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
              {editDuration}d
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
