import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarPlus, CircleAlert, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { PageHeader, Segmented } from '../components/ui/primitives.jsx';
import DayTimeline from '../components/DayTimeline.jsx';
import { useCalendarEvents } from '../hooks/useCalendarEvents.js';
import { getItemsForDate, layoutTimed, formatRange, formatTime } from '../utils/schedule.js';
import { addDays, startOfDay, isSameDay, formatShortDate } from '../utils/dates.js';
import { mondayOnOrBefore } from '../utils/quickParse.js';

const HOUR_PX = 48;
const MAX_ALLDAY = 3;

const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const longFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

export default function CalendarPage() {
  const { state, toggleRoutineDay, toggleTask } = useApp();
  const { openTaskEditor } = useWorkspace();
  const navigate = useNavigate();
  const narrow = useMediaQuery('(max-width: 760px)');
  const [view, setView] = useState(narrow ? 'day' : 'week');
  const [anchor, setAnchor] = useState(() => startOfDay());
  const scrollRef = useRef(null);

  useEffect(() => { if (narrow) setView('day'); }, [narrow]);

  const weekStart = mondayOnOrBefore(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // Fetch the whole week even in day view so the day strip can show dots.
  const { events, loading, error } = useCalendarEvents(weekStart, addDays(weekStart, 7));
  const hasCalendars = (state.settings?.calendars || []).some(c => c.enabled !== false);

  const itemsByDay = useMemo(
    () => weekDays.map(d => getItemsForDate(state, d, events)),
    [state, events, weekStart.getTime()], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (view === 'week' && scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_PX - 8;
  }, [view]);

  const today = startOfDay();
  const step = view === 'week' ? 7 : 1;
  const open = (item) => {
    if (item.kind === 'task') openTaskEditor(item.ref);
    else if (item.kind === 'routine') navigate(`/routines?open=${item.ref.id}`);
    else if (item.kind === 'goal') navigate(`/goals/${item.ref.id}`);
  };
  const toggle = (item, date) => {
    if (item.kind === 'routine') toggleRoutineDay(item.ref.id, date);
    else if (item.kind === 'task') toggleTask(item.ref.id);
  };

  const title = view === 'week'
    ? (weekDays[0].getMonth() === weekDays[6].getMonth()
      ? monthFmt.format(weekDays[0])
      : `${formatShortDate(weekDays[0])} – ${formatShortDate(weekDays[6])}`)
    : longFmt.format(anchor);

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div className="page page-calendar">
      <PageHeader
        title="Calendar"
        description="Routines, timed tasks, goal deadlines and your connected calendars in one place."
      />

      <div className="cal-toolbar">
        <div className="row gap-1">
          <button type="button" className="icon-btn" onClick={() => setAnchor(a => addDays(a, -step))} aria-label={view === 'week' ? 'Previous week' : 'Previous day'} data-tooltip="Previous">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setAnchor(a => addDays(a, step))} aria-label={view === 'week' ? 'Next week' : 'Next day'} data-tooltip="Next">
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAnchor(startOfDay())}>Today</button>
        </div>
        <h2 className="cal-title" aria-live="polite">{title}</h2>
        <div className="row gap-2 cal-toolbar-end">
          {loading && <span className="t-meta">Syncing…</span>}
          {!narrow && (
            <Segmented size="sm" label="View" value={view} onChange={setView} options={[{ value: 'week', label: 'Week' }, { value: 'day', label: 'Day' }]} />
          )}
        </div>
      </div>

      {error && (
        <div className="cal-notice is-error" role="status">
          <CircleAlert size={14} strokeWidth={2} aria-hidden="true" />
          <span>Couldn’t load {error.length === 1 && error[0].calendar ? `“${error[0].calendar}”` : 'some calendars'}. Check the link in <Link to="/settings#s-calendars" className="link">Settings</Link>.</span>
        </div>
      )}

      {view === 'week' ? (
        <section className="cal-week panel" aria-label={`Week of ${formatShortDate(weekStart)}`}>
          <div className="cal-head">
            <div className="cal-gutter" />
            {weekDays.map((d, i) => (
              <button
                key={i}
                type="button"
                className={`cal-day-head ${isSameDay(d, today) ? 'is-today' : ''}`}
                onClick={() => { setAnchor(d); setView('day'); }}
                aria-label={`Open ${longFmt.format(d)}`}
              >
                <span className="cal-dow">{weekdayFmt.format(d)}</span>
                <span className="cal-dom t-num">{d.getDate()}</span>
              </button>
            ))}
          </div>

          <div className="cal-allday">
            <div className="cal-gutter t-meta">All day</div>
            {itemsByDay.map((items, i) => {
              const all = items.filter(x => x.allDay);
              return (
                <ul key={i} className="cal-allday-col">
                  {all.slice(0, MAX_ALLDAY).map(item => (
                    <li key={item.key}>
                      <button
                        type="button"
                        className={`tl-pill kind-${item.kind} status-${item.status} ${item.done ? 'is-done' : ''}`}
                        onClick={() => open(item)}
                        disabled={item.kind === 'event'}
                        style={{ '--event-color': item.color }}
                        title={`${item.title}${item.sub ? ` · ${item.sub}` : ''}`}
                      >
                        {item.status === 'done' && <Check size={10} strokeWidth={3} aria-hidden="true" />}
                        {item.status === 'missed' && <X size={10} strokeWidth={3} aria-hidden="true" />}
                        <span className="truncate">{item.title}</span>
                        <span className="sr-only">{item.status === 'missed' ? ' (missed)' : item.done ? ' (done)' : ''}</span>
                      </button>
                    </li>
                  ))}
                  {all.length > MAX_ALLDAY && (
                    <li>
                      <button type="button" className="cal-more" onClick={() => { setAnchor(weekDays[i]); setView('day'); }}>
                        +{all.length - MAX_ALLDAY} more
                      </button>
                    </li>
                  )}
                </ul>
              );
            })}
          </div>

          <div className="cal-scroll" ref={scrollRef}>
            <div className="cal-body" style={{ height: 24 * HOUR_PX }}>
              <div className="cal-gutter cal-hours" aria-hidden="true">
                {Array.from({ length: 24 }, (_, h) => (
                  <span key={h} className="cal-hour-label t-num" style={{ top: h * HOUR_PX }}>
                    {h === 0 ? '' : formatTime(`${String(h).padStart(2, '0')}:00`).replace(':00', '')}
                  </span>
                ))}
              </div>
              {itemsByDay.map((items, i) => {
                const timed = layoutTimed(items);
                const isToday = isSameDay(weekDays[i], today);
                return (
                  <div key={i} className={`cal-col ${isToday ? 'is-today' : ''}`} role="list" aria-label={longFmt.format(weekDays[i])}>
                    {timed.map(item => (
                      <div
                        key={item.key}
                        role="listitem"
                        className={`tl-block cal-block kind-${item.kind} ${item.done ? 'is-done' : ''} ${item.status === 'missed' ? 'is-missed' : ''} ${(item.end - item.start) * HOUR_PX / 60 < 36 ? 'is-short' : ''}`}
                        style={{
                          top: (item.start * HOUR_PX) / 60,
                          height: Math.max(20, ((item.end - item.start) * HOUR_PX) / 60 - 2),
                          left: `calc((100% - 2px) / ${item.cols} * ${item.col})`,
                          width: `calc((100% - 2px) / ${item.cols})`,
                          '--event-color': item.color,
                        }}
                      >
                        {(item.kind === 'routine' || item.kind === 'task') && item.status !== 'missed' && (
                          <button
                            type="button"
                            className={`tl-check ${item.done ? 'is-checked' : ''}`}
                            onClick={() => toggle(item, weekDays[i])}
                            aria-label={item.done ? `Mark ${item.title} as not done` : `Complete ${item.title}`}
                            aria-pressed={item.done}
                            disabled={weekDays[i] > today}
                          >
                            {item.done && <Check size={10} strokeWidth={3} />}
                          </button>
                        )}
                        <button type="button" className="tl-body" onClick={() => open(item)} disabled={item.kind === 'event'}>
                          <span className="tl-title truncate">{item.title}</span>
                          <span className="tl-time t-num">{formatRange(item.time, item.duration)}</span>
                        </button>
                      </div>
                    ))}
                    {isToday && (
                      <div className="tl-now cal-now" style={{ top: (nowMin * HOUR_PX) / 60 }} aria-hidden="true"><span /></div>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="cal-line" style={{ top: h * HOUR_PX }} aria-hidden="true" />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="cal-strip" role="tablist" aria-label="Days this week">
            {weekDays.map((d, i) => {
              const count = itemsByDay[i].length;
              const selected = isSameDay(d, anchor);
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`cal-strip-day ${selected ? 'is-selected' : ''} ${isSameDay(d, today) ? 'is-today' : ''}`}
                  onClick={() => setAnchor(d)}
                >
                  <span className="cal-dow">{weekdayFmt.format(d)}</span>
                  <span className="cal-dom t-num">{d.getDate()}</span>
                  <span className="cal-dots" aria-label={`${count} items`}>
                    {Array.from({ length: Math.min(3, count) }, (_, k) => <i key={k} />)}
                  </span>
                </button>
              );
            })}
          </div>
          <section className="panel">
            <DayTimeline
              key={anchor.getTime()}
              items={getItemsForDate(state, anchor, events)}
              isToday={isSameDay(anchor, today)}
              minHours={[7, 22]}
              onOpen={open}
              onToggle={anchor <= today ? (item) => toggle(item, anchor) : undefined}
              emptyHint="Nothing timed on this day."
            />
          </section>
        </>
      )}

      {!hasCalendars && (
        <div className="cal-notice">
          <CalendarPlus size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="grow">See your Google, Outlook or Apple calendar here too.</span>
          <Link to="/settings#s-calendars" className="btn btn-secondary btn-sm">Connect a calendar</Link>
        </div>
      )}
    </div>
  );
}
