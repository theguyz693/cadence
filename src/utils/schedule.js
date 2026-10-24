/**
 * What happens on a given day — routines scheduled that day, tasks due,
 * goal deadlines and (optionally) external calendar events — normalised
 * into one shape for the Today timeline and the Calendar view.
 */
import { getCyclePosition, getRoutineDayInfo, isRoutineCompletedOn } from './recurrence.js';
import { getTrackingStart } from './routineStats.js';
import { deadlineDate, isSameDay, startOfDay, daysBetween, toInputDate } from './dates.js';

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** "07:30" → "7:30 AM" (locale aware). */
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return timeFmt.format(d);
}

export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatRange(time, duration) {
  if (!time) return '';
  if (!duration) return formatTime(time);
  return `${formatTime(time)} – ${formatTime(fromMinutes(toMinutes(time) + duration))}`;
}

const DEFAULT_DURATION = 30;

/**
 * @returns {Array<{
 *   key, kind: 'routine'|'task'|'goal'|'event', title, sub, time, duration,
 *   allDay, done, status, ref, color?
 * }>}
 */
export function getItemsForDate(state, date, events = []) {
  const day = startOfDay(date);
  const today = startOfDay(new Date());
  const items = [];

  state.routines.forEach(routine => {
    const info = getRoutineDayInfo(routine, day);
    if (!info.active) return;
    if (day < getTrackingStart(routine)) return;
    const done = isRoutineCompletedOn(state.completions, routine.id, day);
    const time = info.time || routine.time || null;
    const diff = daysBetween(today, day);
    items.push({
      key: `r-${routine.id}-${day.getTime()}`,
      kind: 'routine',
      title: routine.name,
      sub: info.label || `Day ${getCyclePosition(routine, day) + 1} of ${routine.cycleLength}`,
      time,
      duration: time ? routine.duration || DEFAULT_DURATION : null,
      allDay: !time,
      done,
      status: done ? 'done' : diff < 0 ? 'missed' : diff === 0 ? 'today' : 'upcoming',
      ref: routine,
    });
  });

  state.tasks.forEach(task => {
    if (task.dueWithinDays === null || task.dueWithinDays === undefined) return;
    const due = deadlineDate(task.createdAt, Number(task.dueWithinDays));
    if (!isSameDay(due, day)) return;
    items.push({
      key: `t-${task.id}`,
      kind: 'task',
      title: task.title,
      sub: task.priority && task.priority !== 'none' ? `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority` : 'Task',
      time: task.time || null,
      duration: task.time ? task.duration || DEFAULT_DURATION : null,
      allDay: !task.time,
      done: !!task.completed,
      status: task.completed ? 'done' : 'open',
      ref: task,
    });
  });

  state.goals.forEach(goal => {
    if (goal.completed) return;
    const due = deadlineDate(goal.createdAt, Number(goal.durationDays) || 0);
    if (!isSameDay(due, day)) return;
    items.push({
      key: `g-${goal.id}`,
      kind: 'goal',
      title: goal.title,
      sub: 'Goal deadline',
      time: null,
      duration: null,
      allDay: true,
      done: false,
      status: 'deadline',
      ref: goal,
    });
  });

  events.forEach(ev => {
    if (ev.allDay) {
      // All-day events carry local dates; endDate is exclusive (iCal convention).
      const key = toInputDate(day);
      if (key >= ev.date && key < (ev.endDate || ev.date) || key === ev.date) {
        items.push({ key: `e-${ev.id}`, kind: 'event', title: ev.title, sub: ev.calendar, allDay: true, time: null, duration: null, done: false, status: 'event', ref: ev, color: ev.color });
      }
      return;
    }
    const start = new Date(ev.start);
    if (!isSameDay(start, day)) return;
    const end = ev.end ? new Date(ev.end) : null;
    const time = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    items.push({
      key: `e-${ev.id}`,
      kind: 'event',
      title: ev.title,
      sub: ev.location || ev.calendar,
      time,
      duration: end ? Math.max(15, Math.round((end - start) / 60000)) : 60,
      allDay: false,
      done: false,
      status: 'event',
      ref: ev,
      color: ev.color,
    });
  });

  return items.sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    if (a.time && b.time) return toMinutes(a.time) - toMinutes(b.time);
    return 0;
  });
}

/**
 * Lay out overlapping timed items into columns (like a calendar day view).
 * Adds `col` and `cols` to each item.
 */
export function layoutTimed(items) {
  const timed = items.filter(i => !i.allDay).map(i => ({ ...i, start: toMinutes(i.time), end: toMinutes(i.time) + (i.duration || DEFAULT_DURATION) }));
  timed.sort((a, b) => a.start - b.start || b.end - a.end);
  const groups = [];
  let current = [];
  let groupEnd = -1;
  timed.forEach(item => {
    if (item.start >= groupEnd && current.length) { groups.push(current); current = []; }
    current.push(item);
    groupEnd = Math.max(groupEnd, item.end);
  });
  if (current.length) groups.push(current);

  groups.forEach(group => {
    const colsEnd = [];
    group.forEach(item => {
      let col = colsEnd.findIndex(end => end <= item.start);
      if (col === -1) { col = colsEnd.length; colsEnd.push(item.end); } else colsEnd[col] = item.end;
      item.col = col;
    });
    group.forEach(item => { item.cols = colsEnd.length; });
  });
  return timed;
}
