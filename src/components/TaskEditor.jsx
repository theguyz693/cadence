import { useEffect, useState } from 'react';
import Dialog from './ui/Dialog.jsx';
import { Field, Segmented } from './ui/primitives.jsx';
import TimeField from './TimeField.jsx';
import { addDays, startOfDay, deadlineDate, daysFromCreation, toInputDate, fromInputDate, formatFullDate } from '../utils/dates.js';

export const PRIORITIES = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const QUICK_DUE = [
  { key: 'none', label: 'No date' },
  { key: 'today', label: 'Today', offset: 0 },
  { key: 'tomorrow', label: 'Tomorrow', offset: 1 },
  { key: 'week', label: 'Next week', offset: 7 },
];

/**
 * Create / edit a task. Due dates are chosen as calendar dates and stored in
 * the existing `dueWithinDays` shape (days after creation).
 */
export default function TaskEditor({ isOpen, task, defaults, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState('none');
  const [slot, setSlot] = useState({ time: null, duration: null });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTouched(false);
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueWithinDays !== null && task.dueWithinDays !== undefined
        ? deadlineDate(task.createdAt, Number(task.dueWithinDays))
        : null);
      setPriority(task.priority || 'none');
      setSlot({ time: task.time || null, duration: task.duration || null });
    } else {
      setTitle(defaults?.title || '');
      setDescription('');
      setDueDate(defaults?.dueOffset !== undefined ? addDays(startOfDay(), defaults.dueOffset) : null);
      setPriority(defaults?.priority || 'none');
      setSlot({ time: null, duration: null });
    }
  }, [isOpen, task, defaults]);

  const titleError = touched && !title.trim() ? 'Give the task a title.' : '';

  const save = () => {
    setTouched(true);
    if (!title.trim()) return;
    const createdAt = task?.createdAt || new Date().toISOString();
    onSave({
      title: title.trim(),
      description: description.trim(),
      dueWithinDays: dueDate ? daysFromCreation(createdAt, dueDate) : null,
      priority,
      // A time only means something on a dated task.
      time: dueDate ? slot.time : null,
      duration: dueDate && slot.time ? slot.duration : null,
    });
  };

  const activeQuick = (() => {
    if (!dueDate) return 'none';
    const match = QUICK_DUE.find(q => q.offset !== undefined && toInputDate(addDays(startOfDay(), q.offset)) === toInputDate(dueDate));
    return match?.key || 'custom';
  })();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      footer={
        <>
          {task && onDelete && (
            <button type="button" className="btn btn-ghost btn-danger-text mr-auto" onClick={onDelete}>Delete</button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>
            {task ? 'Save changes' : 'Add task'}
          </button>
        </>
      }
    >
      <form
        className="stack gap-4"
        onSubmit={(e) => { e.preventDefault(); save(); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || e.target.tagName === 'INPUT')) {
            if (e.target.type === 'date') return;
            e.preventDefault();
            save();
          }
        }}
      >
        <Field label="Title" error={titleError}>
          {(p) => (
            <input
              {...p}
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => title && setTouched(true)}
              placeholder="What needs to be done?"
              maxLength={200}
              data-autofocus
            />
          )}
        </Field>

        <Field label="Notes" optional>
          {(p) => (
            <textarea
              {...p}
              className="input textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details, links or context"
              rows={3}
            />
          )}
        </Field>

        <div className="field">
          <span className="field-label" id="due-label">Due</span>
          <div className="chip-row" role="group" aria-labelledby="due-label">
            {QUICK_DUE.map(q => (
              <button
                key={q.key}
                type="button"
                className={`chip ${activeQuick === q.key ? 'is-selected' : ''}`}
                aria-pressed={activeQuick === q.key}
                onClick={() => setDueDate(q.offset === undefined ? null : addDays(startOfDay(), q.offset))}
              >
                {q.label}
              </button>
            ))}
            <label className={`chip chip-date ${activeQuick === 'custom' ? 'is-selected' : ''}`}>
              <span className="sr-only">Pick a date</span>
              <input
                type="date"
                value={dueDate ? toInputDate(dueDate) : ''}
                min={task ? toInputDate(task.createdAt) : toInputDate(new Date())}
                onChange={e => setDueDate(fromInputDate(e.target.value))}
              />
            </label>
          </div>
          {dueDate && <div className="field-hint">Due {formatFullDate(dueDate)}</div>}
        </div>

        {dueDate && (
          <TimeField
            time={slot.time}
            duration={slot.duration}
            onChange={setSlot}
            hint="Timed tasks appear on your Today timeline and calendar."
          />
        )}

        <div className="field">
          <span className="field-label">Priority</span>
          <Segmented label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
        </div>
      </form>
    </Dialog>
  );
}
