import { Check, Pencil, Trash2 } from 'lucide-react';
import { useTasks } from '../../context/TasksContext';
import TaskMeta from './TaskMeta';

export default function TaskRow({ task }) {
  const { toggleDone, openTask, deleteTask } = useTasks();
  const done = task.status === 'completed';

  return (
    <li className={`task-row${done ? ' is-done' : ''}`}>
      <label className="check">
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleDone(task)}
          aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        />
        <span className="check__box">
          <Check aria-hidden="true" />
        </span>
      </label>

      <div className="task-row__main">
        <button type="button" className="task-row__title" onClick={() => openTask(task)}>
          {task.title}
        </button>
        <TaskMeta task={task} />
      </div>

      <div className="task-row__actions">
        <button
          type="button"
          className="icon-btn icon-btn--sm"
          onClick={() => openTask(task)}
          aria-label={`Edit "${task.title}"`}
        >
          <Pencil aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--sm icon-btn--danger"
          onClick={() => deleteTask(task)}
          aria-label={`Delete "${task.title}"`}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
