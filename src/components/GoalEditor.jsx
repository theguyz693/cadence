import { useEffect, useState } from 'react';
import Dialog from './ui/Dialog.jsx';
import { Field } from './ui/primitives.jsx';
import { generateId } from '../utils/helpers.js';
import { deadlineDate, daysFromCreation, toInputDate, fromInputDate, formatFullDate, addDays, startOfDay } from '../utils/dates.js';

const QUICK = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

/**
 * Create / edit a goal. The deadline is picked as a date and stored as
 * `durationDays` from creation, matching the existing data model.
 */
export default function GoalEditor({ isOpen, goal, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(addDays(startOfDay(), 7));
  const [steps, setSteps] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTouched(false);
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      setDeadline(deadlineDate(goal.createdAt, goal.durationDays || 0));
    } else {
      setTitle('');
      setDescription('');
      setDeadline(addDays(startOfDay(), 7));
      setSteps('');
    }
  }, [isOpen, goal]);

  const createdAt = goal?.createdAt || new Date().toISOString();
  const durationDays = Math.max(0, daysFromCreation(createdAt, deadline));
  const titleError = touched && !title.trim() ? 'Give the goal a title.' : '';

  const save = () => {
    setTouched(true);
    if (!title.trim()) return;
    const payload = { title: title.trim(), description: description.trim(), durationDays };
    if (!goal) {
      payload.checklist = steps
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
        .map(text => ({ id: generateId(), text, completed: false }));
    }
    onSave(payload);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Edit goal' : 'New goal'}
      description={goal ? undefined : 'A goal has a deadline and the steps that get you there.'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>{goal ? 'Save changes' : 'Create goal'}</button>
        </>
      }
    >
      <div className="stack gap-4">
        <Field label="Goal" error={titleError}>
          {(p) => (
            <input
              {...p}
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
              placeholder="e.g. Finish 30 practice problems"
              maxLength={120}
              data-autofocus
            />
          )}
        </Field>

        <Field label="Why it matters" optional>
          {(p) => (
            <textarea {...p} className="input textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="A sentence to come back to" />
          )}
        </Field>

        <div className="field">
          <span className="field-label" id="deadline-label">Deadline</span>
          <div className="chip-row" role="group" aria-labelledby="deadline-label">
            {QUICK.map(q => {
              const d = addDays(startOfDay(), q.days);
              const selected = toInputDate(d) === toInputDate(deadline);
              return (
                <button key={q.days} type="button" className={`chip ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={() => setDeadline(d)}>
                  {q.label}
                </button>
              );
            })}
            <label className="chip chip-date">
              <span className="sr-only">Pick a deadline</span>
              <input
                type="date"
                value={toInputDate(deadline)}
                min={toInputDate(createdAt)}
                onChange={e => { const d = fromInputDate(e.target.value); if (d) setDeadline(d); }}
              />
            </label>
          </div>
          <div className="field-hint">Due {formatFullDate(deadline)} · {durationDays} {durationDays === 1 ? 'day' : 'days'} from start</div>
        </div>

        {!goal && (
          <Field label="Steps" optional hint="One per line. You can add more later.">
            {(p) => (
              <textarea
                {...p}
                className="input textarea"
                rows={4}
                value={steps}
                onChange={e => setSteps(e.target.value)}
                placeholder={'Outline chapter 1\nDraft chapter 1\nReview with a friend'}
              />
            )}
          </Field>
        )}
      </div>
    </Dialog>
  );
}
