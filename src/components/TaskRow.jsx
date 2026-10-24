import { CalendarDays, Flag, Lock, MoreHorizontal, Pencil, Trash2, Timer } from 'lucide-react';
import { CheckButton } from './ui/primitives.jsx';
import Menu from './ui/Menu.jsx';
import { getTaskDue } from '../utils/dates.js';

const PRIORITY_LABEL = { high: 'High priority', medium: 'Medium priority', low: 'Low priority' };

/** Shared task row used on Today and Tasks. */
export default function TaskRow({ task, onToggle, onEdit, onDelete, onFocus, onPriority, showNotes = true }) {
  const due = getTaskDue(task);
  const priority = task.priority && task.priority !== 'none' ? task.priority : null;

  const items = [
    { label: 'Edit', icon: Pencil, onSelect: onEdit },
    onFocus && !task.completed && { label: 'Lock in on this', icon: Lock, onSelect: onFocus },
    onPriority && { type: 'separator' },
    onPriority && { type: 'label', label: 'Priority' },
    ...(onPriority ? ['high', 'medium', 'low', 'none'].map(p => ({
      label: p === 'none' ? 'No priority' : p[0].toUpperCase() + p.slice(1),
      checked: (task.priority || 'none') === p,
      onSelect: () => onPriority(p),
    })) : []),
    { type: 'separator' },
    { label: 'Delete', icon: Trash2, tone: 'danger', onSelect: onDelete },
  ].filter(Boolean);

  return (
    <li className={`item-row task-row ${task.completed ? 'is-done' : ''}`}>
      <CheckButton
        checked={task.completed}
        onChange={onToggle}
        label={task.completed ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`}
      />
      <button type="button" className="item-main" onClick={onEdit}>
        <span className="item-title">{task.title}</span>
        {showNotes && task.description && <span className="item-notes truncate">{task.description}</span>}
      </button>
      <div className="item-meta">
        {priority && (
          <span className={`priority priority-${priority}`} title={PRIORITY_LABEL[priority]}>
            <Flag size={12} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">{PRIORITY_LABEL[priority]}</span>
          </span>
        )}
        {due && !task.completed && (
          <span className={`due due-${due.tone}`}>
            <CalendarDays size={12} strokeWidth={1.75} aria-hidden="true" />
            <span className="t-num">{due.label}</span>
          </span>
        )}
      </div>
      <div className="item-actions">
        {onFocus && !task.completed && (
          <button type="button" className="icon-btn hover-reveal" onClick={onFocus} aria-label={`Lock in on “${task.title}”`} data-tooltip="Lock in">
            <Timer size={15} strokeWidth={1.75} />
          </button>
        )}
        <Menu
          label={`Actions for “${task.title}”`}
          items={items}
          trigger={(props, open) => (
            <button {...props} className={`icon-btn ${open ? 'is-open' : 'hover-reveal'}`}>
              <MoreHorizontal size={16} strokeWidth={1.75} />
            </button>
          )}
        />
      </div>
    </li>
  );
}
