import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getCycleDays, getEarliestCycleOffset } from '../utils/routineStats.js';
import { formatFullDate, formatShortDate } from '../utils/dates.js';

const STATUS_TEXT = {
  done: 'completed',
  missed: 'missed',
  today: 'scheduled today',
  upcoming: 'upcoming',
  rest: 'rest day',
  pre: 'before this routine started',
};

/**
 * The Cadence sequencer: one cycle of a routine shown as a row of steps.
 *
 * Every state comes from real data — a step is only "done" if a completion
 * exists for that date. Past and current scheduled days can be toggled
 * (to catch up on a forgotten check-in); future days cannot.
 */
export default function RoutineSequence({
  routine,
  completions,
  onToggleDay,
  compact = false,
  navigable = false,
}) {
  const [offset, setOffset] = useState(0);
  const days = getCycleDays(routine, completions, offset);
  const earliest = getEarliestCycleOffset(routine);
  const todayIdx = days.findIndex(d => d.isToday);
  // Fraction of the track that is "behind" today, for the progress line.
  const trackPct = offset < 0 ? 100 : offset > 0 ? 0 : days.length > 1 ? (todayIdx / (days.length - 1)) * 100 : 0;

  const rangeLabel = days.length
    ? `${formatShortDate(days[0].date)} – ${formatShortDate(days[days.length - 1].date)}`
    : '';

  return (
    <div className={`sequence ${compact ? 'sequence-compact' : ''}`}>
      {navigable && (
        <div className="sequence-nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setOffset(o => o - 1)}
            disabled={offset <= earliest}
            aria-label="Previous cycle"
            data-tooltip="Previous cycle"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <div className="sequence-range" aria-live="polite">
            <span className="t-section">{offset === 0 ? 'This cycle' : offset === -1 ? 'Last cycle' : `${Math.abs(offset)} cycles ago`}</span>
            <span className="t-meta t-num">{rangeLabel}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setOffset(o => o + 1)}
            disabled={offset >= 0}
            aria-label="Next cycle"
            data-tooltip="Next cycle"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
          {offset !== 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOffset(0)}>Today</button>
          )}
        </div>
      )}

      <ol className="sequence-track" style={{ '--track-progress': `${trackPct}%` }} aria-label={`${routine.name} cycle`}>
        {days.map(day => {
          const canToggle = !!onToggleDay && day.active && !day.isFuture && day.status !== 'pre';
          const name = `Day ${day.index + 1}, ${formatFullDate(day.date)}${day.label ? `, ${day.label}` : ''}: ${STATUS_TEXT[day.status]}`;
          const content = (
            <>
              <span className="sequence-num t-num" aria-hidden="true">{day.index + 1}</span>
              <span className="sequence-step" aria-hidden="true">
                {day.status === 'done' && <Check size={compact ? 11 : 14} strokeWidth={2.5} />}
                {day.status === 'missed' && !compact && <X size={12} strokeWidth={2} />}
              </span>
              {!compact && (
                <span className="sequence-label" aria-hidden="true">
                  {day.isToday ? 'Today' : day.label}
                </span>
              )}
            </>
          );
          return (
            <li
              key={day.index}
              className={`sequence-day is-${day.status} ${day.isToday ? 'is-current' : ''}`}
              title={compact ? name : undefined}
            >
              {canToggle ? (
                <button
                  type="button"
                  className="sequence-hit"
                  onClick={() => onToggleDay(day.date)}
                  aria-label={`${name}. ${day.status === 'done' ? 'Mark as not done' : 'Mark as done'}`}
                  aria-pressed={day.status === 'done'}
                >
                  {content}
                </button>
              ) : (
                <div className="sequence-hit" role="img" aria-label={name}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>

      {navigable && (
        <div className="sequence-legend" aria-hidden="true">
          <span><i className="lg lg-done" /> Done</span>
          <span><i className="lg lg-missed" /> Missed</span>
          <span><i className="lg lg-upcoming" /> Scheduled</span>
          <span><i className="lg lg-rest" /> Rest</span>
        </div>
      )}
    </div>
  );
}
