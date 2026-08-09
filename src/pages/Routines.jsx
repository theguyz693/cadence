import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import RoutineGrid, { RoutineMiniGrid } from '../components/RoutineGrid.jsx';
import { createDefaultPattern, getCyclePosition, getRoutineDayInfo, getNextActiveDay } from '../utils/recurrence.js';
import { Plus, Repeat, Edit3, Trash2 } from 'lucide-react';

const EMOJI_OPTIONS = ['🏋️', '📚', '🧴', '🍳', '💊', '🎵', '🏃', '🧘', '💻', '✍️', '🎨', '🌿', '💤', '🧹', '📋'];

export default function Routines() {
  const { state, addRoutine, editRoutine, deleteRoutine } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📋');
  const [cycleLength, setCycleLength] = useState(7);
  const [pattern, setPattern] = useState(createDefaultPattern(7));

  const openCreate = () => {
    setEditingRoutine(null);
    setName('');
    setEmoji('📋');
    setCycleLength(7);
    setPattern(createDefaultPattern(7));
    setShowModal(true);
  };

  const openEdit = (routine) => {
    setEditingRoutine(routine);
    setName(routine.name);
    setEmoji(routine.emoji || '📋');
    setCycleLength(routine.cycleLength);
    setPattern([...routine.pattern]);
    setShowModal(true);
  };

  const handleCycleLengthChange = (newLength) => {
    const len = Math.max(1, Math.min(20, Number(newLength)));
    setCycleLength(len);
    // Resize pattern: keep existing data, add new or trim
    const newPattern = Array.from({ length: len }, (_, i) =>
      i < pattern.length ? pattern[i] : { active: false, label: '' }
    );
    setPattern(newPattern);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingRoutine) {
      editRoutine(editingRoutine.id, {
        name: name.trim(),
        emoji,
        cycleLength,
        pattern,
      });
    } else {
      addRoutine({
        name: name.trim(),
        emoji,
        cycleLength,
        pattern,
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this routine? This cannot be undone.')) {
      deleteRoutine(id);
      if (expandedId === id) setExpandedId(null);
    }
  };

  const today = new Date();

  return (
    <div className="centered-page-container">
      <div className="page-header">
        <h2>Routines</h2>
        <p>Build repeating patterns that work for you</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={15} strokeWidth={2} /> New Routine
        </button>
      </div>

      {state.routines.length === 0 ? (
        <div className="empty-state">
          <Repeat size={40} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }} />
          <h3>No routines yet</h3>
          <p>Create your first routine and build a custom repeating pattern.</p>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} strokeWidth={2} /> New Routine
          </button>
        </div>
      ) : (
        <div className="card-list">
          {state.routines.map(routine => {
            const cyclePos = getCyclePosition(routine, today);
            const dayInfo = getRoutineDayInfo(routine, today);
            const nextActive = !dayInfo.active ? getNextActiveDay(routine, today) : null;
            const isExpanded = expandedId === routine.id;
            const activeDays = routine.pattern.filter(d => d.active).length;

            return (
              <div key={routine.id} className="card animate-pop">
                {/* Routine Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : routine.id)}
                >
                  <div className="dashboard-card-icon" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    {routine.emoji || '📋'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
                      <span style={{ fontWeight: 500 }}>{routine.name}</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {routine.cycleLength}-day cycle · {activeDays} active
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <RoutineMiniGrid pattern={routine.pattern} currentIndex={cyclePos} />
                      {dayInfo.active ? (
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>
                          Active today{dayInfo.label ? ` · ${dayInfo.label}` : ''}
                        </span>
                      ) : nextActive ? (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          Next in {nextActive.daysUntil}d
                        </span>
                      ) : (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                          No active days
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(routine); }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit3 size={12} strokeWidth={1.75} /> Edit
                    </button>
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(routine.id); }}>
                      <Trash2 size={12} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pattern · Day {cyclePos + 1} of {routine.cycleLength}
                    </div>
                    <RoutineGrid
                      pattern={routine.pattern}
                      onChange={() => {}}
                      readOnly
                      highlightIndex={cyclePos}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoutine ? 'Edit Routine' : 'Create Routine'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
              {editingRoutine ? 'Save Changes' : 'Create Routine'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Gym, Hair Care, Cooking..."
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Emoji</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  border: emoji === e ? '2px solid var(--accent-primary)' : '2px solid var(--border-primary)',
                  background: emoji === e ? 'var(--accent-primary-glow)' : 'var(--bg-card)',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Cycle Length: {cycleLength} days</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <input
              className="range-slider"
              type="range"
              min={1}
              max={20}
              value={cycleLength}
              onChange={e => handleCycleLengthChange(e.target.value)}
            />
            <input
              className="form-input"
              type="number"
              min={1}
              max={20}
              value={cycleLength}
              onChange={e => handleCycleLengthChange(e.target.value)}
              style={{ width: 60, textAlign: 'center', padding: 'var(--space-sm)' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Pattern
            <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 'var(--space-sm)' }}>
              Click to toggle · Double-click active day to add a label
            </span>
          </label>
          <RoutineGrid
            pattern={pattern}
            onChange={setPattern}
          />
          <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            {pattern.filter(d => d.active).length} of {cycleLength} days active
          </div>
        </div>
      </Modal>
    </div>
  );
}
