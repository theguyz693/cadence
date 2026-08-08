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
  if (total === 0) return 100;
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

export const ACCENT_THEMES = {
  indigo: {
    name: 'Indigo Sunset',
    primary: '#7c6bf5',
    secondary: '#a78bfa',
    hover: '#8e7ff7',
    glow: 'rgba(124, 107, 245, 0.15)',
    gradient: 'linear-gradient(135deg, #7c6bf5, #a78bfa, #c4b5fd)',
  },
  emerald: {
    name: 'Emerald Mint',
    primary: '#10b981',
    secondary: '#34d399',
    hover: '#059669',
    glow: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(135deg, #10b981, #34d399, #a7f3d0)',
  },
  rose: {
    name: 'Rose Quartz',
    primary: '#ec4899',
    secondary: '#f472b6',
    hover: '#db2777',
    glow: 'rgba(236, 72, 153, 0.15)',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6, #fbcfe8)',
  },
  ocean: {
    name: 'Ocean Breeze',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    hover: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa, #bfdbfe)',
  },
  amber: {
    name: 'Sunset Amber',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    hover: '#d97706',
    glow: 'rgba(245, 158, 11, 0.15)',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fde68a)',
  },
  teal: {
    name: 'Nordic Frost',
    primary: '#14b8a6',
    secondary: '#2dd4bf',
    hover: '#0d9488',
    glow: 'rgba(20, 184, 166, 0.15)',
    gradient: 'linear-gradient(135deg, #14b8a6, #2dd4bf, #ccfbf1)',
  }
};

