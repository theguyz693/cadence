/**
 * Storage utility for Lock In focus sessions.
 * Uses timestamps to ensure accurate time tracking across refreshes.
 */

const ACTIVE_SESSION_KEY = 'cadence_lock_in_active';
const HISTORY_KEY = 'cadence_lock_in_history';

/**
 * Load active session from localStorage.
 */
export function loadActiveSession() {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save active session to localStorage.
 */
export function saveActiveSession(session) {
  try {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error('Failed to save active Lock In session:', err);
  }
}

/**
 * Clear active session.
 */
export function clearActiveSession() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (err) {
    console.error('Failed to clear active session:', err);
  }
}

/**
 * Load session history array.
 */
export function loadFocusHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Add a completed session to history.
 */
export function recordCompletedSession(sessionData) {
  try {
    const history = loadFocusHistory();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      taskTitle: sessionData.taskTitle || 'Focus Session',
      durationSec: sessionData.durationSec || 0,
      completedAt: new Date().toISOString(),
      isBreak: sessionData.isBreak || false,
    };
    const updated = [entry, ...history];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to record completed session:', err);
    return loadFocusHistory();
  }
}

/**
 * Get today's focus stats summary.
 */
export function getTodayFocusStats(historyList = null) {
  const history = historyList || loadFocusHistory();
  const todayStr = new Date().toDateString();

  const todaySessions = history.filter(s => {
    if (s.isBreak) return false;
    return new Date(s.completedAt).toDateString() === todayStr;
  });

  const totalSeconds = todaySessions.reduce((acc, s) => acc + (s.durationSec || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  return {
    count: todaySessions.length,
    totalMinutes,
    totalSeconds,
    sessions: todaySessions,
  };
}

/**
 * Format seconds into MM:SS string.
 */
export function formatTimerDisplay(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format minutes into human-readable duration string (e.g. "1h 40m" or "25m").
 */
export function formatMinutesLabel(totalMinutes) {
  if (totalMinutes <= 0) return '0m';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}
