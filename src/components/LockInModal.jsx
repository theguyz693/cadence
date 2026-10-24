import { useState, useEffect } from 'react';
import { useLockIn } from '../context/LockInContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import Dialog from './ui/Dialog.jsx';
import { Field } from './ui/primitives.jsx';
import { Lock, CheckSquare, Target, Repeat } from 'lucide-react';
import { isRoutineActiveToday } from '../utils/recurrence.js';

const PRESETS = [25, 50, 90];
const BREAKS = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: 'None', value: 0 },
];

export default function LockInModal() {
  const { showSetup, closeSetup, presetTaskTitle, startSession } = useLockIn();
  const { state } = useApp();

  const [taskTitle, setTaskTitle] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [breakMins, setBreakMins] = useState(5);

  useEffect(() => {
    if (showSetup) {
      setTaskTitle(presetTaskTitle || '');
      setIsCustom(false);
      setCustomDuration('');
      setDuration(25);
    }
  }, [showSetup, presetTaskTitle]);

  const suggestions = [
    ...(state?.routines || []).filter(isRoutineActiveToday).slice(0, 2).map(r => ({ id: `r${r.id}`, title: r.name, Icon: Repeat })),
    ...(state?.tasks || []).filter(t => !t.completed).slice(0, 3).map(t => ({ id: `t${t.id}`, title: t.title, Icon: CheckSquare })),
    ...(state?.goals || []).filter(g => !g.completed).slice(0, 2).map(g => ({ id: `g${g.id}`, title: g.title, Icon: Target })),
  ].slice(0, 6);

  const customValue = parseInt(customDuration, 10);
  const customInvalid = isCustom && customDuration !== '' && (isNaN(customValue) || customValue < 1 || customValue > 240);

  const handleStart = () => {
    if (customInvalid) return;
    const finalMins = isCustom ? (customValue || 25) : duration;
    startSession({
      taskTitle: taskTitle.trim() || 'Deep work',
      durationMinutes: Math.max(1, Math.min(240, finalMins)),
      breakMinutes: breakMins,
    });
  };

  return (
    <Dialog
      isOpen={showSetup}
      onClose={closeSetup}
      title="Lock in"
      description="A timed, distraction-free session for one thing."
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={closeSetup}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={customInvalid}>
            <Lock size={14} strokeWidth={2} aria-hidden="true" /> Start session
          </button>
        </>
      }
    >
      <div className="stack gap-5">
        <Field label="What are you working on?">
          {(p) => (
            <input
              {...p}
              className="input"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              placeholder="e.g. Chapter 3 draft"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleStart(); } }}
              data-autofocus
            />
          )}
        </Field>

        {suggestions.length > 0 && (
          <div className="chip-row lockin-suggestions" role="group" aria-label="Pick from your list">
            {suggestions.map(s => (
              <button
                key={s.id}
                type="button"
                className={`chip ${taskTitle === s.title ? 'is-selected' : ''}`}
                aria-pressed={taskTitle === s.title}
                onClick={() => setTaskTitle(s.title)}
              >
                <s.Icon size={12} strokeWidth={1.75} aria-hidden="true" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="field">
          <span className="field-label" id="lockin-duration">Duration</span>
          <div className="duration-grid" role="radiogroup" aria-labelledby="lockin-duration">
            {PRESETS.map(mins => (
              <button
                key={mins}
                type="button"
                role="radio"
                aria-checked={!isCustom && duration === mins}
                className={`duration-option ${!isCustom && duration === mins ? 'is-selected' : ''}`}
                onClick={() => { setIsCustom(false); setDuration(mins); }}
              >
                <span className="duration-value t-num">{mins}</span>
                <span className="duration-unit">min</span>
              </button>
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={isCustom}
              className={`duration-option ${isCustom ? 'is-selected' : ''}`}
              onClick={() => setIsCustom(true)}
            >
              <span className="duration-value">Custom</span>
              <span className="duration-unit">1–240</span>
            </button>
          </div>
          {isCustom && (
            <div className={`field ${customInvalid ? 'has-error' : ''}`} style={{ marginTop: 'var(--space-2)' }}>
              <label className="sr-only" htmlFor="lockin-custom">Custom duration in minutes</label>
              <input
                id="lockin-custom"
                type="number"
                inputMode="numeric"
                className="input"
                placeholder="Minutes"
                min={1}
                max={240}
                value={customDuration}
                onChange={e => setCustomDuration(e.target.value)}
                aria-invalid={customInvalid || undefined}
                autoFocus
              />
              {customInvalid && <div className="field-error">Choose between 1 and 240 minutes.</div>}
            </div>
          )}
        </div>

        <div className="field">
          <span className="field-label" id="lockin-break">Break afterwards</span>
          <div className="chip-row" role="radiogroup" aria-labelledby="lockin-break">
            {BREAKS.map(opt => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={breakMins === opt.value}
                className={`chip ${breakMins === opt.value ? 'is-selected' : ''}`}
                onClick={() => setBreakMins(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
