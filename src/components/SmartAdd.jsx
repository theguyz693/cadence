import { useId, useMemo, useState } from 'react';
import { CalendarDays, Clock, Flag, Plus, Repeat, CheckSquare, Target, Sparkles } from 'lucide-react';
import { parseQuickAdd } from '../utils/quickParse.js';
import { formatRange, formatTime } from '../utils/schedule.js';
import { relativeDayLabel, formatShortDate, daysBetween } from '../utils/dates.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';

const KINDS = [
  { value: 'task', label: 'Task', Icon: CheckSquare },
  { value: 'routine', label: 'Routine', Icon: Repeat },
  { value: 'goal', label: 'Goal', Icon: Target },
];

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function chipsFor(parsed, kind, defaultDueToday) {
  const chips = [];
  if (kind === 'routine') {
    const r = parsed.recurrence;
    chips.push({ Icon: Repeat, text: r ? (r.label || r.weekdays.map(i => WEEKDAY_SHORT[i]).join(', ')) : 'Every day' });
  }
  if (kind !== 'routine') {
    if (parsed.date) {
      const diff = daysBetween(new Date(), parsed.date);
      chips.push({ Icon: CalendarDays, text: kind === 'goal' ? `By ${formatShortDate(parsed.date)}` : diff >= 0 && diff < 7 ? relativeDayLabel(parsed.date) : formatShortDate(parsed.date) });
    } else if (kind === 'goal') {
      chips.push({ Icon: CalendarDays, text: 'In 30 days' });
    } else if (defaultDueToday) {
      chips.push({ Icon: CalendarDays, text: 'Today', muted: true });
    }
  }
  if (parsed.time && kind !== 'goal') chips.push({ Icon: Clock, text: formatRange(parsed.time, parsed.duration) });
  else if (parsed.duration && kind !== 'goal') chips.push({ Icon: Clock, text: `${parsed.duration} min` });
  if (parsed.priority && kind === 'task') chips.push({ Icon: Flag, text: `${parsed.priority[0].toUpperCase()}${parsed.priority.slice(1)}`, tone: parsed.priority });
  return chips;
}

/**
 * One input for everything. Type naturally — "gym 7am mon wed fri",
 * "pay rent friday !high", "learn spanish by dec 31" — and Cadence shows
 * what it understood before you press Enter. The type can be switched.
 */
export default function SmartAdd({
  placeholder = 'Add anything — try “gym 7am mon wed fri”',
  defaultDueToday = false,
  autoFocus = false,
  bordered = false,
  onCreated,
  id,
}) {
  const { createFromParse } = useWorkspace();
  const [text, setText] = useState('');
  const [kindOverride, setKindOverride] = useState(null);
  const autoId = useId();
  const inputId = id || `smart-add-${autoId}`;
  const previewId = `${inputId}-preview`;

  const parsed = useMemo(() => (text.trim() ? parseQuickAdd(text) : null), [text]);
  const kind = kindOverride || parsed?.kind || 'task';
  const understood = parsed && (parsed.matches.length > 0 || kind !== 'task');
  const chips = parsed ? chipsFor(parsed, kind, defaultDueToday) : [];

  const submit = (e) => {
    e.preventDefault();
    if (!parsed) return;
    const title = parsed.title || text.trim();
    if (!title) return;
    createFromParse({ ...parsed, title }, { kind, defaultDueToday });
    setText('');
    setKindOverride(null);
    onCreated?.();
  };

  return (
    <div className={`smart-add ${bordered ? 'is-bordered' : ''} ${understood ? 'has-preview' : ''}`}>
      <form className="quick-add" onSubmit={submit}>
        {understood ? <Sparkles size={15} strokeWidth={2} aria-hidden="true" /> : <Plus size={15} strokeWidth={2} aria-hidden="true" />}
        <label htmlFor={inputId} className="sr-only">Add a task, routine or goal</label>
        <input
          id={inputId}
          value={text}
          onChange={e => { setText(e.target.value); if (!e.target.value) setKindOverride(null); }}
          onKeyDown={e => { if (e.key === 'Escape' && text) { e.stopPropagation(); setText(''); setKindOverride(null); } }}
          placeholder={placeholder}
          maxLength={240}
          autoComplete="off"
          spellCheck
          autoFocus={autoFocus}
          aria-describedby={understood ? previewId : undefined}
          data-autofocus={autoFocus || undefined}
        />
        {text && <kbd className="kbd">Enter</kbd>}
      </form>
      {understood && (
        <div className="smart-preview" id={previewId} aria-live="polite">
          <div className="smart-kinds" role="radiogroup" aria-label="Create as">
            {KINDS.map(k => (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={kind === k.value}
                className={`smart-kind ${kind === k.value ? 'is-selected' : ''}`}
                onClick={() => setKindOverride(k.value)}
              >
                <k.Icon size={12} strokeWidth={2} aria-hidden="true" /> {k.label}
              </button>
            ))}
          </div>
          <span className="smart-title truncate">{parsed.title || <span className="t-tertiary">Untitled</span>}</span>
          <span className="smart-chips">
            {chips.map((c, i) => (
              <span key={i} className={`smart-chip ${c.muted ? 'is-muted' : ''} ${c.tone ? `priority-${c.tone}` : ''}`}>
                <c.Icon size={11} strokeWidth={2} aria-hidden="true" /> {c.text}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

