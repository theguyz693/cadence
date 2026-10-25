/**
 * Switch theme (and/or visual style) with a circular reveal that spreads from
 * `origin` (an element or a {x, y} point), using the View Transitions API.
 * A rare action, so it gets a moment of delight; instant where unsupported or
 * under reduced motion.
 */
import { resolveMode, resolveUiTheme, loadThemeFonts } from './uiThemes.js';

function originPoint(origin) {
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if (origin && typeof origin.x === 'number') return origin;
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/**
 * next: { ui?, theme? } — the visual theme key and/or the light/dark/system pref.
 * apply: persists the change (React state); the DOM is painted here first.
 */
export function revealAppearance(next, apply, origin) {
  const root = document.documentElement;
  const ui = resolveUiTheme(next.ui || root.dataset.ui);
  const systemDark = !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const mode = resolveMode(ui, next.theme || (root.dataset.theme === 'dark' ? 'dark' : 'light'), systemDark);
  loadThemeFonts(ui);

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const unchanged = root.dataset.ui === ui && root.dataset.theme === mode;
  if (!document.startViewTransition || reduce || unchanged) {
    apply();
    return;
  }

  const { x, y } = originPoint(origin);
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  root.dataset.vt = 'theme';
  const transition = document.startViewTransition(() => {
    root.dataset.ui = ui; // paint the new look now; React state follows
    root.dataset.theme = mode;
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

/** Light / dark / system only. */
export function revealTheme(theme, apply, origin) {
  revealAppearance({ theme }, apply, origin);
}
