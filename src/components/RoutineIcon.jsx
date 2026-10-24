import { ROUTINE_ICONS, resolveRoutineIcon } from '../utils/icons.js';

/** Routine glyph in a quiet tinted tile. */
export default function RoutineIcon({ routine, iconKey, size = 'md' }) {
  const key = iconKey || resolveRoutineIcon(routine);
  const { Icon } = ROUTINE_ICONS[key] || ROUTINE_ICONS.repeat;
  const px = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  return (
    <span className={`routine-icon routine-icon-${size}`} aria-hidden="true">
      <Icon size={px} strokeWidth={1.75} />
    </span>
  );
}
