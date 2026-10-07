import { CalendarDays, Flag, ListChecks, Timer } from 'lucide-react';
import { dueKey, dueState, formatDueKey, formatMinutes } from '../../lib/dates';

const DUE_CHIP = {
  overdue: 'chip--overdue',
  today: 'chip--today',
  tomorrow: 'chip--soon',
  soon: 'chip--soon',
  later: '',
  done: 'chip--done',
};

export const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };
export const STATUS_LABEL = { pending: 'To do', 'in-progress': 'In progress', completed: 'Done' };

export default function TaskMeta({ task, showPriority = true }) {
  const state = dueState(task);
  const subDone = (task.subtasks || []).filter((s) => s.done).length;
  const subTotal = (task.subtasks || []).length;

  return (
    <div className="task-meta">
      {showPriority && (
        <span className={`chip chip--${task.priority}`}>
          <Flag aria-hidden="true" />
          <span className="sr-only">Priority: </span>
          {PRIORITY_LABEL[task.priority]}
        </span>
      )}
      {task.dueDate && (
        <span className={`chip ${DUE_CHIP[state] || ''}`}>
          <CalendarDays aria-hidden="true" />
          {state === 'overdue' && <span className="sr-only">Overdue: </span>}
          {formatDueKey(dueKey(task.dueDate))}
        </span>
      )}
      {subTotal > 0 && (
        <span className="chip">
          <ListChecks aria-hidden="true" />
          <span className="sr-only">Subtasks: </span>
          {subDone}/{subTotal}
        </span>
      )}
      {task.focusMinutes > 0 && (
        <span className="chip">
          <Timer aria-hidden="true" />
          <span className="sr-only">Focused: </span>
          {formatMinutes(task.focusMinutes)}
        </span>
      )}
      {(task.tags || []).map((tag) => (
        <span key={tag} className="chip chip--tag">
          #{tag}
        </span>
      ))}
    </div>
  );
}
