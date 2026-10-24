import Dialog from './ui/Dialog.jsx';
import SmartAdd from './SmartAdd.jsx';

const EXAMPLES = [
  ['gym 7am mon wed fri', 'Routine on those days'],
  ['read 20 pages every day', 'Daily routine'],
  ['pay rent friday !high', 'Task, due Friday, high priority'],
  ['call mom tomorrow 6-7pm', 'Task with a time slot'],
  ['learn spanish by dec 31', 'Goal with a deadline'],
];

/** Global quick add (Q). Type naturally; Enter creates. */
export default function QuickAddDialog({ isOpen, onClose }) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Quick add" description="Type it the way you'd say it. Cadence works out whether it's a task, routine or goal." size="md">
      <div className="quick-add-dialog">
        <SmartAdd bordered autoFocus onCreated={onClose} placeholder="e.g. gym 7am mon wed fri" />
        <div className="quick-examples">
          <div className="t-caps">Try</div>
          <ul>
            {EXAMPLES.map(([ex, what]) => (
              <li key={ex}>
                <code>{ex}</code>
                <span className="t-meta">{what}</span>
              </li>
            ))}
          </ul>
          <p className="t-meta">Tip: start with <code>task:</code>, <code>routine:</code> or <code>goal:</code> to choose the type yourself. Priority: <code>!high</code>, <code>!med</code>, <code>!low</code>.</p>
        </div>
      </div>
    </Dialog>
  );
}
