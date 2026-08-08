import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import { getDaysRemaining, formatTimeRemaining } from '../utils/helpers.js';

export default function Tasks() {
  const { state, addTask, toggleTask, deleteTask, editTask } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending | completed | all
  const [flashId, setFlashId] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueWithinDays, setDueWithinDays] = useState('');

  const filteredTasks = state.tasks.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const openCreate = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueWithinDays('');
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueWithinDays(task.dueWithinDays || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (editingTask) {
      editTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        dueWithinDays: dueWithinDays ? Number(dueWithinDays) : null,
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim(),
        dueWithinDays: dueWithinDays ? Number(dueWithinDays) : null,
      });
    }
    setShowModal(false);
  };

  const handleToggle = (id) => {
    toggleTask(id);
    setFlashId(id);
    setTimeout(() => setFlashId(null), 400);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Tasks</h2>
        <p>Simple one-off tasks to keep track of</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div className="filter-tabs">
          {['pending', 'completed', 'all'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Task
        </button>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">☑</div>
          <h3>{filter === 'completed' ? 'No completed tasks yet' : filter === 'pending' ? 'No pending tasks' : 'No tasks yet'}</h3>
          <p>Create your first task to get started.</p>
          <button className="btn btn-primary" onClick={openCreate}>+ New Task</button>
        </div>
      ) : (
        <div className="card-list">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`task-row ${flashId === task.id ? 'completion-flash' : ''}`}
            >
              <div
                className={`checklist-checkbox ${task.completed ? 'checked' : ''}`}
                onClick={() => handleToggle(task.id)}
              />
              <div className="task-row-content">
                <div className={`task-row-title ${task.completed ? 'completed' : ''}`}>
                  {task.title}
                </div>
                {task.description && (
                  <div className="task-row-desc">{task.description}</div>
                )}
              </div>
              <div className="task-row-meta">
                {task.dueWithinDays && !task.completed && (
                  <span className={`time-remaining ${getDaysRemaining(task.createdAt, task.dueWithinDays) <= 1 ? 'urgent' : getDaysRemaining(task.createdAt, task.dueWithinDays) <= 3 ? 'warning' : ''}`}>
                    ⏱ {formatTimeRemaining(getDaysRemaining(task.createdAt, task.dueWithinDays))}
                  </span>
                )}
              </div>
              <div className="task-row-actions">
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(task)} title="Edit">✎</button>
                <button className="btn btn-ghost btn-icon btn-danger" onClick={() => deleteTask(task.id)} title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
              {editingTask ? 'Save Changes' : 'Create Task'}
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
            placeholder="What needs to be done?"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add some details..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Due within (days, optional)</label>
          <input
            className="form-input"
            type="number"
            min={1}
            max={365}
            value={dueWithinDays}
            onChange={e => setDueWithinDays(e.target.value)}
            placeholder="e.g. 3"
          />
        </div>
      </Modal>
    </div>
  );
}
