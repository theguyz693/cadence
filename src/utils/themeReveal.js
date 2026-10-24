/**
 * Switch theme with a circular reveal that spreads from `origin` (an element
 * or a {x, y} point), using the View Transitions API. A rare action, so it
 * gets a moment of delight; instant where unsupported or under reduced motion.
 */
function resolve(theme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function revealTheme(theme, apply, origin) {
  const root = document.documentElement;
  const next = resolve(theme);
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce || root.dataset.theme === next) {
    apply();
    return;
  }

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  const el = origin instanceof Element ? origin : null;
  if (el) {
    const r = el.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else if (origin && typeof origin.x === 'number') {
    ({ x, y } = origin);
  }
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  root.dataset.vt = 'theme';
  const transition = document.startViewTransition(() => {
    root.dataset.theme = next; // paint the new theme now; React state follows
    apply();
  });
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    })
    .catch(() => {});
  transition.finished.finally(() => { delete root.dataset.vt; });
}
