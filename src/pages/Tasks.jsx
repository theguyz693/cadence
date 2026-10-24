import { useMemo, useState } from 'react';
import { ArrowUpDown, CheckSquare, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useLockIn } from '../context/LockInContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { PageHeader, Segmented, EmptyState } from '../components/ui/primitives.jsx';
import Menu from '../components/ui/Menu.jsx';
import TaskRow from '../components/TaskRow.jsx';
import SmartAdd from '../components/SmartAdd.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { getTaskDue } from '../utils/dates.js';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2, none: 3 };

const SORTS = {
  smart: 'Smart',
  due: 'Due date',
  priority: 'Priority',
  newest: 'Newest first',
};

function compare(sort) {
  const dueOf = (t) => getTaskDue(t)?.diff ?? Infinity;
  const pr = (t) => PRIORITY_RANK[t.priority] ?? 3;
  const created = (t) => new Date(t.createdAt).getTime() || 0;
  switch (sort) {
    case 'due': return (a, b) => dueOf(a) - dueOf(b) || pr(a) - pr(b);
    case 'priority': return (a, b) => pr(a) - pr(b) || dueOf(a) - dueOf(b);
    case 'newest': return (a, b) => created(b) - created(a);
    default: return (a, b) => pr(a) - pr(b) || dueOf(a) - dueOf(b) || created(a) - created(b);
  }
}

/** Group open tasks by when they're due (smart view only). */
function groupTasks(tasks) {
  const groups = { overdue: [], today: [], upcoming: [], later: [] };
  tasks.forEach(t => {
    const due = getTaskDue(t);
    if (!due) groups.later.push(t);
    else if (due.diff < 0) groups.overdue.push(t);
    else if (due.diff === 0) groups.today.push(t);
    else groups.upcoming.push(t);
  });
  return [
    { key: 'overdue', label: 'Overdue', tasks: groups.overdue },
    { key: 'today', label: 'Today', tasks: groups.today },
    { key: 'upcoming', label: 'Upcoming', tasks: groups.upcoming },
    { key: 'later', label: 'No date', tasks: groups.later },
  ].filter(g => g.tasks.length);
}

export default function Tasks() {
  const { state, toggleTask, editTask, deleteTask, restoreTask } = useApp();
  const { toast } = useToast();
  const { openLockIn } = useLockIn();
  const { openTaskEditor, deleteTaskWithUndo, askConfirm } = useWorkspace();
  const [filter, setFilter] = useState('open');
  const [sort, setSort] = useState('smart');

  const open = state.tasks.filter(t => !t.completed);
  const done = state.tasks.filter(t => t.completed);

  const list = useMemo(() => {
    const base = filter === 'open' ? open : filter === 'done' ? done : state.tasks;
    if (filter === 'done') {
      return [...base].sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
    }
    return [...base].sort((a, b) => Number(a.completed) - Number(b.completed) || compare(sort)(a, b));
  }, [state.tasks, filter, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const row = (task) => (
    <TaskRow
      key={task.id}
      task={task}
      onToggle={() => toggleTask(task.id)}
      onEdit={() => openTaskEditor(task)}
      onDelete={() => deleteTaskWithUndo(task)}
      onFocus={() => openLockIn(task.title)}
      onPriority={(p) => editTask(task.id, { priority: p })}
    />
  );

  const clearCompleted = () => askConfirm({
    title: `Delete ${done.length} completed ${done.length === 1 ? 'task' : 'tasks'}?`,
    message: 'They will be removed from your list. You can undo right after.',
    confirmLabel: 'Delete completed',
    onConfirm: () => {
      const removed = [...done];
      removed.forEach(t => deleteTask(t.id));
      toast({
        title: `Deleted ${removed.length} completed ${removed.length === 1 ? 'task' : 'tasks'}`,
        action: { label: 'Undo', onClick: () => removed.forEach(t => restoreTask(t)) },
      });
    },
  });

  const grouped = filter === 'open' && sort === 'smart';

  return (
    <div className="page page-narrow">
      <PageHeader
        title="Tasks"
        description="One-off things to get done. Routines live separately so your list stays short."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openTaskEditor()}>
            <Plus size={15} strokeWidth={2} aria-hidden="true" /> New task
          </button>
        }
      />

      <div className="toolbar">
        <Segmented
          label="Filter tasks"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: 'Open', count: open.length },
            { value: 'done', label: 'Completed', count: done.length },
            { value: 'all', label: 'All' },
          ]}
        />
        <div className="toolbar-end">
          {filter === 'done' && done.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearCompleted}>Clear completed</button>
          )}
          {filter !== 'done' && (
            <Menu
              label="Sort tasks"
              items={Object.entries(SORTS).map(([key, label]) => ({ label, checked: sort === key, onSelect: () => setSort(key) }))}
              trigger={(props) => (
                <button {...props} className="btn btn-ghost btn-sm">
                  <ArrowUpDown size={14} strokeWidth={1.75} aria-hidden="true" /> {SORTS[sort]}
                </button>
              )}
            />
          )}
        </div>
      </div>

      <section className="panel">
        {filter !== 'done' && (
          <SmartAdd id="tasks-quick-add" bordered placeholder="Add a task — try “pay rent friday !high”" />
        )}

        {list.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={filter === 'done' ? 'Nothing completed yet' : state.tasks.length ? 'All caught up' : 'No tasks yet'}
            description={filter === 'done'
              ? 'Tasks you check off will show up here.'
              : state.tasks.length ? 'Every open task is done. Enjoy the quiet.' : 'Capture anything that needs doing once — type above and press Enter.'}
          />
        ) : grouped ? (
          groupTasks(list).map(group => (
            <div key={group.key} className="task-group">
              <h2 className={`task-group-label group-${group.key}`}>
                {group.label} <span className="t-num">{group.tasks.length}</span>
              </h2>
              <ul className="item-list">{group.tasks.map(row)}</ul>
            </div>
          ))
        ) : (
          <ul className="item-list">{list.map(row)}</ul>
        )}
      </section>
    </div>
  );
}
