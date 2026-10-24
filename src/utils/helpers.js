/**
 * Simple ID generator using timestamp + random suffix.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Format a relative time remaining string.
 */
export function formatTimeRemaining(days) {
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/**
 * Calculate days remaining for a goal from its creation date and duration.
 */
export function getDaysRemaining(createdAt, durationDays) {
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);
  const deadline = new Date(created);
  deadline.setDate(deadline.getDate() + durationDays);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
}

/**
 * Get completion percentage.
 */
export function getCompletionPercentage(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Format a date to a display string.
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Accent palettes. The actual per-theme colors live in styles/tokens.css
 * ([data-accent]); `swatch` is only used to preview the choice in Settings.
 * Legacy keys (e.g. "ocean") are mapped in resolveAccent().
 */
export const ACCENT_THEMES = {
  cobalt: { name: 'Cobalt', swatch: '#2c5be0' },
  indigo: { name: 'Indigo', swatch: '#5146d8' },
  teal: { name: 'Teal', swatch: '#0e7469' },
  emerald: { name: 'Green', swatch: '#217a45' },
  amber: { name: 'Amber', swatch: '#b05a0a' },
  rose: { name: 'Rose', swatch: '#c0306a' },
  graphite: { name: 'Graphite', swatch: '#2b2a27' },
};

const LEGACY_ACCENTS = { ocean: 'cobalt' };

export function resolveAccent(key) {
  if (ACCENT_THEMES[key]) return key;
  return LEGACY_ACCENTS[key] || 'cobalt';
}
