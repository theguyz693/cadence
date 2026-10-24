/**
 * Derived routine data computed from real completion history.
 * Nothing here invents progress: a day only counts as done when a completion
 * exists for that date, and days before the routine started are excluded.
 */
import { getCyclePosition, getRoutineDayInfo, getNextActiveDay, isRoutineCompletedOn } from './recurrence.js';
import { addDays, startOfDay, daysBetween } from './dates.js';

/**
 * The first day a routine can be held accountable for: the later of its cycle
 * anchor and the day it was actually created. (Anchoring "today is day 3"
 * moves startDate back, but those earlier days were never real.)
 */
export function getTrackingStart(routine, today = new Date()) {
  const start = startOfDay(routine.startDate || today);
  if (!routine.createdAt) return start;
  const created = startOfDay(routine.createdAt);
  return created > start ? created : start;
}

/**
 * The days of one cycle, with a status for each.
 * offset 0 = the cycle containing today, -1 = the previous cycle, etc.
 *
 * status:
 *   'rest'       — not a scheduled day
 *   'pre'        — scheduled, but before the routine existed
 *   'done'       — scheduled and completed
 *   'missed'     — scheduled, in the past, not completed
 *   'today'      — scheduled today, not yet completed
 *   'upcoming'   — scheduled in the future
 */
export function getCycleDays(routine, completions, offset = 0, today = new Date()) {
  const len = routine.cycleLength || routine.pattern?.length || 0;
  const todayStart = startOfDay(today);
  const pos = getCyclePosition(routine, todayStart);
  const cycleStart = addDays(todayStart, -pos + offset * len);
  const routineStart = getTrackingStart(routine, today);

  return Array.from({ length: len }, (_, index) => {
    const date = addDays(cycleStart, index);
    const info = routine.pattern?.[index] || { active: false, label: '' };
    const diff = daysBetween(todayStart, date);
    const isToday = diff === 0;
    const done = info.active && isRoutineCompletedOn(completions, routine.id, date);

    let status = 'rest';
    if (info.active) {
      if (done) status = 'done';
      else if (date < routineStart) status = 'pre';
      else if (isToday) status = 'today';
      else if (diff < 0) status = 'missed';
      else status = 'upcoming';
    }

    return {
      index,
      date,
      label: info.label || '',
      active: !!info.active,
      isToday,
      isPast: diff < 0,
      isFuture: diff > 0,
      status,
    };
  });
}

/** Earliest cycle offset that contains any day on/after the routine start. */
export function getEarliestCycleOffset(routine, today = new Date()) {
  const len = routine.cycleLength || 1;
  const pos = getCyclePosition(routine, today);
  const daysSinceStart = Math.max(0, daysBetween(getTrackingStart(routine, today), today));
  // Days from the start of the current cycle back to the routine start.
  const back = daysSinceStart - pos;
  return back <= 0 ? 0 : -Math.ceil(back / len);
}

/**
 * Scheduled vs completed days in the last `windowDays` days (today included
 * only if it has been completed, so an unfinished today never counts against).
 */
export function getConsistency(routine, completions, windowDays = 28, today = new Date()) {
  const start = getTrackingStart(routine, today);
  let scheduled = 0;
  let done = 0;
  for (let i = 0; i < windowDays; i++) {
    const date = addDays(startOfDay(today), -i);
    if (date < start) break;
    if (!getRoutineDayInfo(routine, date).active) continue;
    const completed = isRoutineCompletedOn(completions, routine.id, date);
    if (i === 0 && !completed) continue;
    scheduled += 1;
    if (completed) done += 1;
  }
  return { scheduled, done, ratio: scheduled ? done / scheduled : null };
}

/**
 * Consecutive scheduled days completed, counting back from today.
 * An unfinished today does not break the streak.
 */
export function getStreak(routine, completions, today = new Date()) {
  const start = getTrackingStart(routine, today);
  const len = routine.cycleLength || 1;
  if (!routine.pattern?.some(d => d.active)) return 0;
  let streak = 0;
  // Bound the walk: at most a year of history.
  for (let i = 0; i < 366; i++) {
    const date = addDays(startOfDay(today), -i);
    if (date < start) break;
    if (!getRoutineDayInfo(routine, date).active) continue;
    const completed = isRoutineCompletedOn(completions, routine.id, date);
    if (completed) streak += 1;
    else if (i === 0) continue;
    else break;
    if (i > len * 52) break;
  }
  return streak;
}

/** One-line description of a routine's schedule. */
export function describeSchedule(routine) {
  const len = routine.cycleLength;
  const active = routine.pattern?.filter(d => d.active).length || 0;
  if (active === 0) return `${len}-day cycle · no days scheduled`;
  if (active === len) return len === 1 ? 'Every day' : `Every day · ${len}-day cycle`;
  if (len === 7) return `${active} of 7 days a week`;
  return `${active} of every ${len} days`;
}

/** Today's status for a routine, used for compact displays. */
export function getTodayStatus(routine, completions, today = new Date()) {
  const info = getRoutineDayInfo(routine, today);
  const pos = getCyclePosition(routine, today);
  const done = isRoutineCompletedOn(completions, routine.id, today);
  const next = info.active ? null : getNextActiveDay(routine, today);
  return { dueToday: !!info.active, done, label: info.label || '', position: pos, next };
}
