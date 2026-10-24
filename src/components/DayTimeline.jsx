import { useEffect, useRef, useState } from 'react';
import { Check, CalendarDays, Repeat, Target } from 'lucide-react';
import { layoutTimed, formatRange, formatTime, toMinutes } from '../utils/schedule.js';

const PX_PER_MIN = 0.9; // 54px per hour

const KIND_ICON = { routine: Repeat, task: Check, goal: Target, event: CalendarDays };

function useNowMinutes() {
  const [now, setNow] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  useEffect(() => {
    const t = setInterval(() => { const d = new Date(); setNow(d.getHours() * 60 + d.getMinutes()); }, 60000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/**
 * A single day's timeline: an all-day strip on top, then timed blocks
 * positioned by start/duration with overlaps split into columns.
 */
export default function DayTimeline({ items, isToday = false, onOpen, onToggle, minHours = [8, 20], emptyHint }) {
  const now = useNowMinutes();
  const scrollRef = useRef(null);
  const allDay = items.filter(i => i.allDay);
  const timed = layoutTimed(items);

  // Visible window: at least minHours, widened to fit everything (and now).
  let startH = minHours[0];
  let endH = minHours[1];
  timed.forEach(i => {
    startH = Math.min(startH, Math.floor(i.start / 60));
    endH = Math.max(endH, Math.ceil(i.end / 60));
  });
  if (isToday) { startH = Math.min(startH, Math.floor(now / 60)); endH = Math.max(endH, Math.ceil((now + 1) / 60)); }
  endH = Math.min(24, endH);
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const top = (min) => (min - startH * 60) * PX_PER_MIN;

  useEffect(() => {
    // Bring "now" (or the first item) into view inside the scroll area.
    const el = scrollRef.current;
    if (!el) return;
    const focus = isToday ? now : timed[0]?.start;
    if (focus !== undefined) el.scrollTop = Math.max(0, top(focus) - 60);
  }, [isToday]); // eslint-disable-line react-hooks/exhaustive-deps

  const block = (item) => {
    const Icon = KIND_ICON[item.kind];
    const height = Math.max(24, (item.end - item.start) * PX_PER_MIN - 2);
    const width = `calc((100% - 4px) / ${item.cols})`;
    const past = isToday && item.end <= now;
    const toggleable = (item.kind === 'routine' || item.kind === 'task') && onToggle && item.status !== 'missed';
    return (
      <div
        key={item.key}
        className={`tl-block kind-${item.kind} ${item.done ? 'is-done' : ''} ${past && !item.done ? 'is-past' : ''} ${height < 40 ? 'is-short' : ''}`}
        style={{ top: top(item.start), height, left: `calc(${width} * ${item.col})`, width, '--event-color': item.color }}
      >
        {toggleable && (
          <button
            type="button"
            className={`tl-check ${item.done ? 'is-checked' : ''}`}
            onClick={() => onToggle(item)}
            aria-label={item.done ? `Mark ${item.title} as not done` : `Complete ${item.title}`}
            aria-pressed={item.done}
          >
            {item.done && <Check size={10} strokeWidth={3} />}
          </button>
        )}
        <button type="button" className="tl-body" onClick={() => onOpen?.(item)} disabled={!onOpen || item.kind === 'event'}>
          <span className="tl-title truncate">
            {!toggleable && <Icon size={11} strokeWidth={2} aria-hidden="true" />}
            {item.title}
          </span>
          <span className="tl-time t-num">{formatRange(item.time, item.duration)}{item.sub ? ` · ${item.sub}` : ''}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="timeline">
      {allDay.length > 0 && (
        <ul className="tl-allday" aria-label="All day">
          {allDay.map(item => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`tl-pill kind-${item.kind} ${item.done ? 'is-done' : ''}`}
                  onClick={() => onOpen?.(item)}
                  disabled={!onOpen || item.kind === 'event'}
                  style={{ '--event-color': item.color }}
                >
                  <Icon size={11} strokeWidth={2} aria-hidden="true" />
                  <span className="truncate">{item.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {timed.length === 0 && emptyHint ? (
        <p className="tl-empty t-meta">{emptyHint}</p>
      ) : (
        <div className="tl-scroll" ref={scrollRef}>
          <div className="tl-grid" style={{ height: hours.length * 60 * PX_PER_MIN }}>
            {hours.map(h => (
              <div key={h} className="tl-hour" style={{ top: top(h * 60) }}>
                <span className="tl-hour-label t-num">{formatTime(`${String(h).padStart(2, '0')}:00`).replace(':00', '')}</span>
              </div>
            ))}
            <div className="tl-lane" role="list" aria-label="Timed items">
              {timed.map(item => <div role="listitem" key={item.key} style={{ display: 'contents' }}>{block(item)}</div>)}
            </div>
            {isToday && now >= startH * 60 && now <= endH * 60 && (
              <div className="tl-now" style={{ top: top(now) }} aria-label={`Now, ${formatTime(`${String(Math.floor(now / 60)).padStart(2, '0')}:${String(now % 60).padStart(2, '0')}`)}`}>
                <span />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

