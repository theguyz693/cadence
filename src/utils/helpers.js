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
  amber: {
    name: 'Sunset Amber',
    primary: '#FF8A3D',
    secondary: '#FFB454',
    hover: '#FF9E54',
    glow: 'rgba(255, 138, 61, 0.22)',
    gradient: 'linear-gradient(135deg, #FF8A3D, #FFB454)',
  },
  emerald: {
    name: 'Emerald Mint',
    primary: '#10b981',
    secondary: '#34d399',
    hover: '#059669',
    glow: 'rgba(16, 185, 129, 0.2)',
    gradient: 'linear-gradient(135deg, #10b981, #34d399, #a7f3d0)',
  },
  rose: {
    name: 'Rose Quartz',
    primary: '#ec4899',
    secondary: '#f472b6',
    hover: '#db2777',
    glow: 'rgba(236, 72, 153, 0.2)',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6, #fbcfe8)',
  },
  ocean: {
    name: 'Ocean Breeze',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    hover: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.2)',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa, #bfdbfe)',
  },
  indigo: {
    name: 'Indigo Violet',
    primary: '#7c6bf5',
    secondary: '#a78bfa',
    hover: '#8e7ff7',
    glow: 'rgba(124, 107, 245, 0.2)',
    gradient: 'linear-gradient(135deg, #7c6bf5, #a78bfa, #c4b5fd)',
  },
  teal: {
    name: 'Nordic Cyan',
    primary: '#14b8a6',
    secondary: '#5EEAD4',
    hover: '#0d9488',
    glow: 'rgba(94, 234, 212, 0.2)',
    gradient: 'linear-gradient(135deg, #14b8a6, #5EEAD4, #ccfbf1)',
  }
};

export const UI_THEMES = {
  default: { name: 'Default (Dark Glass)', key: 'default', description: 'Premium dark mode with glassmorphism' },
  retro:   { name: 'Retro 90s', key: 'retro', description: 'Windows 95 vibes — bevels, system fonts, pure nostalgia' },
  monochrome: { name: 'Monochrome', key: 'monochrome', description: 'Minimalist editorial design — pure black, white, and timeless serif typography' },
  clay: { name: 'Clay', key: 'clay', description: 'High-fidelity claymorphism — soft 3D shapes, playful rounded lines, and bouncy motion' },
  sketch: { name: 'Sketch', key: 'sketch', description: 'Hand-drawn notebook — scribbles, wobbly borders, hard pencil shadows, and handwriting' },
  cyberpunk: { name: 'Cyberpunk', key: 'cyberpunk', description: 'Low-life high-tech — absolute black, glowing neon borders, chamfered corner cuts, and scanlines' },
};

