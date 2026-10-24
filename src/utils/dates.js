/**
 * Date helpers shared across Cadence.
 *
 * Tasks and goals store deadlines relative to their creation date
 * (`dueWithinDays` / `durationDays`). These helpers translate between that
 * stored shape and real calendar dates for display and editing.
 */

const DAY_MS = 1000 * 60 * 60 * 24;

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Whole calendar days from a to b (negative when b is before a). */
export function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

export function isSameDay(a, b) {
  return daysBetween(a, b) === 0;
}

/** Calendar date a relative deadline falls on. */
export function deadlineDate(createdAt, days) {
  return addDays(startOfDay(createdAt || new Date()), days);
}

/** Inverse of deadlineDate — the relative day count for a chosen date. */
export function daysFromCreation(createdAt, date) {
  return daysBetween(createdAt || new Date(), date);
}

const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const shortFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const fullFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export function formatShortDate(date) {
  return shortFmt.format(new Date(date));
}

export function formatLongDate(date) {
  return longFmt.format(new Date(date));
}

export function formatFullDate(date) {
  return fullFmt.format(new Date(date));
}

/**
 * Human label for a date relative to today: "Today", "Tomorrow", "Yesterday",
 * a weekday within the coming week, or a short date otherwise.
 */
export function relativeDayLabel(date, today = new Date()) {
  const diff = daysBetween(today, date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return weekdayFmt.format(new Date(date));
  return formatShortDate(date);
}

/**
 * Describe a task's due state. Returns null when the task has no due date.
 * tone: 'overdue' | 'today' | 'soon' | 'later'
 */
export function getTaskDue(task, today = new Date()) {
  if (task.dueWithinDays === null || task.dueWithinDays === undefined || task.dueWithinDays === '') {
    return null;
  }
  const date = deadlineDate(task.createdAt, Number(task.dueWithinDays));
  const diff = daysBetween(today, date);
  let tone = 'later';
  if (diff < 0) tone = 'overdue';
  else if (diff === 0) tone = 'today';
  else if (diff <= 2) tone = 'soon';

  let label;
  if (diff < 0) label = diff === -1 ? 'Yesterday' : `${Math.abs(diff)}d overdue`;
  else label = relativeDayLabel(date, today);

  return { date, diff, tone, label };
}

/** Describe a goal's deadline. */
export function getGoalDeadline(goal, today = new Date()) {
  const date = deadlineDate(goal.createdAt, Number(goal.durationDays) || 0);
  const diff = daysBetween(today, date);
  let label;
  if (diff < 0) label = `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'day' : 'days'} past deadline`;
  else if (diff === 0) label = 'Due today';
  else if (diff === 1) label = '1 day left';
  else label = `${diff} days left`;
  const tone = diff < 0 ? 'overdue' : diff <= 1 ? 'today' : diff <= 3 ? 'soon' : 'later';
  return { date, diff, label, tone };
}

/** Value for an <input type="date"> from a Date. */
export function toInputDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse an <input type="date"> value as a local date. */
export function fromInputDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
