/**
 * Recurrence Engine for Cadence Routines.
 *
 * A routine has:
 *   - id: unique identifier
 *   - name: display name
 *   - cycleLength: 1–20
 *   - pattern: array of { active: bool, label?: string } for each day in the cycle
 *   - startDate: ISO date string of when the routine was created
 *
 * The cycle repeats infinitely from the startDate.
 * Day position is calculated as: (daysSinceStart % cycleLength)
 */

/**
 * Get the number of days between two dates (ignoring time).
 */
function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Get the current cycle position (0-indexed) for a given date.
 */
export function getCyclePosition(routine, date = new Date()) {
  const days = daysBetween(routine.startDate, date);
  if (days < 0) return 0;
  return ((days % routine.cycleLength) + routine.cycleLength) % routine.cycleLength;
}

/**
 * Check if a routine is active on a given date.
 * Returns the pattern entry for that day.
 */
export function getRoutineDayInfo(routine, date = new Date()) {
  if (!routine.pattern || routine.pattern.length === 0) {
    return { active: false, label: '' };
  }
  const pos = getCyclePosition(routine, date);
  return routine.pattern[pos] || { active: false, label: '' };
}

/**
 * Check if a routine is active today.
 */
export function isRoutineActiveToday(routine) {
  return getRoutineDayInfo(routine, new Date()).active;
}

/**
 * Get the next active day for a routine from a given date.
 * Returns { date: Date, dayInfo: {...}, daysUntil: number } or null if no active days exist.
 */
export function getNextActiveDay(routine, fromDate = new Date()) {
  if (!routine.pattern || routine.pattern.length === 0) return null;

  // Check if there are any active days at all
  const hasActiveDay = routine.pattern.some(d => d.active);
  if (!hasActiveDay) return null;

  for (let i = 1; i <= routine.cycleLength; i++) {
    const checkDate = new Date(fromDate);
    checkDate.setDate(checkDate.getDate() + i);
    const info = getRoutineDayInfo(routine, checkDate);
    if (info.active) {
      return {
        date: checkDate,
        dayInfo: info,
        daysUntil: i,
      };
    }
  }
  return null;
}

/**
 * Get a date string in YYYY-MM-DD format.
 */
export function toDateKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a routine was completed on a given date.
 */
export function isRoutineCompletedOn(completions, routineId, date = new Date()) {
  const key = toDateKey(date);
  return !!(completions[routineId] && completions[routineId][key]);
}

/**
 * Mark a routine as complete/incomplete on a given date.
 * Returns a new completions object.
 */
export function toggleRoutineCompletion(completions, routineId, date = new Date()) {
  const key = toDateKey(date);
  const newCompletions = { ...completions };

  if (!newCompletions[routineId]) {
    newCompletions[routineId] = {};
  }

  if (newCompletions[routineId][key]) {
    const routineCompletions = { ...newCompletions[routineId] };
    delete routineCompletions[key];
    newCompletions[routineId] = routineCompletions;
  } else {
    newCompletions[routineId] = {
      ...newCompletions[routineId],
      [key]: true,
    };
  }

  return newCompletions;
}

/**
 * Create a default pattern for a given cycle length.
 */
export function createDefaultPattern(cycleLength) {
  return Array.from({ length: cycleLength }, () => ({
    active: false,
    label: '',
  }));
}
