import { X } from 'lucide-react';

export const DURATIONS = [15, 30, 45, 60, 90, 120, 180];

const durationLabel = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60} h`);

/**
 * Optional time slot: a start time plus a duration. Empty time = untimed
 * (shows in lists and the all-day row, not on the timeline).
 */
export default function TimeField({ time, duration, onChange, label = 'Time', hint, compact = false }) {
  const id = `time-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className={`field ${compact ? 'time-field-compact' : ''}`}>
      {!compact && <label className="field-label" htmlFor={id}>{label} <span className="field-optional">Optional</span></label>}
      <div className="time-field">
        <input
          id={id}
          type="time"
          className="input input-time"
          value={time || ''}
          step={300}
          onChange={e => onChange({ time: e.target.value || null, duration: e.target.value ? duration || 30 : null })}
          aria-label={compact ? label : undefined}
        />
        {time && (
          <>
            <select
              className="input select input-duration"
              value={duration || 30}
              onChange={e => onChange({ time, duration: Number(e.target.value) })}
              aria-label="Duration"
            >
              {DURATIONS.map(m => <option key={m} value={m}>{durationLabel(m)}</option>)}
              {duration && !DURATIONS.includes(duration) && <option value={duration}>{durationLabel(duration)}</option>}
            </select>
            <button type="button" className="icon-btn" onClick={() => onChange({ time: null, duration: null })} aria-label="Remove time" data-tooltip="Remove time">
              <X size={14} strokeWidth={2} />
            </button>
          </>
        )}
      </div>
      {hint && !compact && <div className="field-hint">{hint}</div>}
    </div>
  );
}
