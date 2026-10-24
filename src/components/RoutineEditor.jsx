import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import Dialog from './ui/Dialog.jsx';
import { Field } from './ui/primitives.jsx';
import RoutineGrid from './RoutineGrid.jsx';
import RoutineIcon from './RoutineIcon.jsx';
import TimeField from './TimeField.jsx';
import { ROUTINE_ICONS, resolveRoutineIcon } from '../utils/icons.js';
import { createDefaultPattern, getCyclePosition } from '../utils/recurrence.js';
import { addDays, startOfDay } from '../utils/dates.js';

const MIN_CYCLE = 1;
const MAX_CYCLE = 20;

function resize(pattern, len) {
  return Array.from({ length: len }, (_, i) => pattern[i] || { active: false, label: '' });
}

/**
 * Create / edit a routine: name, icon, cycle length (1–20 days), which days
 * are scheduled, and where today falls in the cycle.
 */
export default function RoutineEditor({ isOpen, routine, onClose, onSave, onDelete }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('repeat');
  const [cycleLength, setCycleLength] = useState(7);
  const [pattern, setPattern] = useState(createDefaultPattern(7));
  const [todayDay, setTodayDay] = useState(1);
  const [slot, setSlot] = useState({ time: null, duration: null });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTouched(false);
    if (routine) {
      setName(routine.name);
      setIcon(resolveRoutineIcon(routine));
      setCycleLength(routine.cycleLength);
      setPattern(resize(routine.pattern || [], routine.cycleLength));
      setTodayDay(getCyclePosition(routine, new Date()) + 1);
      setSlot({ time: routine.time || null, duration: routine.duration || null });
    } else {
      setName('');
      setIcon('repeat');
      setCycleLength(7);
      setPattern(createDefaultPattern(7).map(() => ({ active: true, label: '' })));
      setTodayDay(1);
      setSlot({ time: null, duration: null });
    }
  }, [isOpen, routine]);

  const changeLength = (len) => {
    const n = Math.max(MIN_CYCLE, Math.min(MAX_CYCLE, Number(len) || MIN_CYCLE));
    setCycleLength(n);
    setPattern(p => resize(p, n));
    setTodayDay(d => Math.min(d, n));
  };

  const activeCount = pattern.filter(d => d.active).length;
  const nameError = touched && !name.trim() ? 'Name your routine.' : '';
  const patternError = touched && activeCount === 0 ? 'Choose at least one day in the cycle.' : '';

  const save = () => {
    setTouched(true);
    if (!name.trim() || activeCount === 0) return;
    // Anchor the cycle so that today lands on the chosen day.
    const startDate = addDays(startOfDay(), -(todayDay - 1)).toISOString();
    const originalPos = routine ? getCyclePosition(routine, new Date()) + 1 : null;
    const keepStart = routine && originalPos === todayDay && routine.cycleLength === cycleLength;
    onSave({
      name: name.trim(),
      icon,
      cycleLength,
      pattern,
      startDate: keepStart ? routine.startDate : startDate,
      time: slot.time,
      duration: slot.time ? slot.duration : null,
      // Routines created before createdAt existed were created on their startDate.
      ...(routine && !routine.createdAt ? { createdAt: routine.startDate } : {}),
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={routine ? 'Edit routine' : 'New routine'}
      description="A routine repeats on a cycle of 1–20 days. Pick the days it's scheduled."
      footer={
        <>
          {routine && onDelete && (
            <button type="button" className="btn btn-ghost btn-danger-text mr-auto" onClick={onDelete}>Delete routine</button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={save}>
            {routine ? 'Save changes' : 'Create routine'}
          </button>
        </>
      }
    >
      <div className="stack gap-5">
        <div className="routine-editor-top">
          <Field label="Name" error={nameError} className="grow">
            {(p) => (
              <input
                {...p}
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
                placeholder="e.g. Strength training, Reading, Skincare"
                maxLength={60}
                data-autofocus
              />
            )}
          </Field>
        </div>

        <div className="field">
          <span className="field-label" id="icon-label">Icon</span>
          <div className="icon-picker" role="radiogroup" aria-labelledby="icon-label">
            {Object.entries(ROUTINE_ICONS).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                aria-label={label}
                data-tooltip={label}
                className={`icon-picker-item ${icon === key ? 'is-selected' : ''}`}
                onClick={() => setIcon(key)}
              >
                <RoutineIcon iconKey={key} size="sm" />
              </button>
            ))}
          </div>
        </div>

        <div className="routine-editor-row">
          <div className="field">
            <span className="field-label" id="cycle-label">Cycle length</span>
            <div className="stepper" role="group" aria-labelledby="cycle-label">
              <button type="button" className="icon-btn" onClick={() => changeLength(cycleLength - 1)} disabled={cycleLength <= MIN_CYCLE} aria-label="Shorter cycle">
                <Minus size={14} strokeWidth={2} />
              </button>
              <input
                className="stepper-input t-num"
                type="number"
                inputMode="numeric"
                min={MIN_CYCLE}
                max={MAX_CYCLE}
                value={cycleLength}
                onChange={e => changeLength(e.target.value)}
                aria-label="Cycle length in days"
              />
              <span className="stepper-unit">days</span>
              <button type="button" className="icon-btn" onClick={() => changeLength(cycleLength + 1)} disabled={cycleLength >= MAX_CYCLE} aria-label="Longer cycle">
                <Plus size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          <Field label="Today is" hint="Where today falls in the cycle">
            {(p) => (
              <select {...p} className="input select" value={todayDay} onChange={e => setTodayDay(Number(e.target.value))}>
                {Array.from({ length: cycleLength }, (_, i) => (
                  <option key={i} value={i + 1}>Day {i + 1} of {cycleLength}</option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <TimeField
          label="Usual time"
          time={slot.time}
          duration={slot.duration}
          onChange={setSlot}
          hint="Shows the routine on your timeline. Individual days can use a different time below."
        />

        <div className={`field ${patternError ? 'has-error' : ''}`}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="field-label">Schedule</span>
            <span className="t-meta t-num">{activeCount} of {cycleLength} days</span>
          </div>
          <RoutineGrid pattern={pattern} onChange={setPattern} defaultTime={slot.time} />
          {patternError && <div className="field-error" role="alert">{patternError}</div>}
        </div>
      </div>
    </Dialog>
  );
}
