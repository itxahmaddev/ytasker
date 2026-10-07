import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useTasks } from '../../context/TasksContext';
import TaskMeta from './TaskMeta';

const COLUMNS = [
  { status: 'pending', label: 'To do' },
  { status: 'in-progress', label: 'In progress' },
  { status: 'completed', label: 'Done' },
];

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || new Date(a.createdAt) - new Date(b.createdAt);

// A fractional sort key that lands between two neighbours.
function orderBetween(prev, next) {
  if (prev && next) return (prev.order + next.order) / 2;
  if (prev) return prev.order + 1000;
  if (next) return next.order - 1000;
  return Date.now();
}

export default function TaskBoard({ tasks }) {
  const { updateTask, openTask } = useTasks();
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null); // { status, cardId, after }

  const columns = useMemo(
    () =>
      COLUMNS.map((c) => ({
        ...c,
        items: tasks.filter((t) => t.status === c.status).sort(byOrder),
      })),
    [tasks]
  );

  function drop(status) {
    const task = tasks.find((t) => t._id === dragId);
    const target = over;
    setDragId(null);
    setOver(null);
    if (!task) return;

    const list = columns.find((c) => c.status === status).items.filter((t) => t._id !== task._id);
    let index = list.length;
    if (target && target.status === status && target.cardId) {
      const i = list.findIndex((t) => t._id === target.cardId);
      if (i !== -1) index = target.after ? i + 1 : i;
    }
    const order = orderBetween(list[index - 1], list[index]);
    if (task.status === status && order === task.order) return;
    updateTask(task._id, { status, order }).catch(() => {});
  }

  function move(task, dir) {
    const i = COLUMNS.findIndex((c) => c.status === task.status) + dir;
    if (i < 0 || i >= COLUMNS.length) return;
    const list = columns[i].items;
    updateTask(task._id, { status: COLUMNS[i].status, order: orderBetween(list[list.length - 1], null) }).catch(() => {});
  }

  return (
    <div className="board">
      {columns.map((col) => (
        <section
          key={col.status}
          className={`board__col${over?.status === col.status ? ' is-over' : ''}`}
          aria-label={`${col.label}, ${col.items.length} tasks`}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            setOver((o) => (o?.status === col.status && o.cardId ? o : { status: col.status }));
          }}
          onDrop={(e) => {
            e.preventDefault();
            drop(col.status);
          }}
        >
          <header className="board__head">
            <span className="status-dot" data-status={col.status} />
            <h3>{col.label}</h3>
            <span className="board__count tabular">{col.items.length}</span>
          </header>

          <ul className="board__list">
            {col.items.map((task) => (
              <li
                key={task._id}
                className={[
                  'board-card',
                  dragId === task._id ? 'is-dragging' : '',
                  over?.cardId === task._id ? (over.after ? 'drop-after' : 'drop-before') : '',
                ].join(' ')}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', task._id);
                  setDragId(task._id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOver(null);
                }}
                onDragOver={(e) => {
                  if (!dragId || dragId === task._id) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const after = e.clientY > rect.top + rect.height / 2;
                  setOver((o) =>
                    o?.cardId === task._id && o.after === after ? o : { status: col.status, cardId: task._id, after }
                  );
                }}
              >
                <div className="board-card__top">
                  <GripVertical className="board-card__grip" aria-hidden="true" />
                  <button type="button" className="board-card__title" onClick={() => openTask(task)}>
                    {task.title}
                  </button>
                </div>
                <TaskMeta task={task} />
                <div className="board-card__move">
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    disabled={col.status === 'pending'}
                    onClick={() => move(task, -1)}
                    aria-label={`Move "${task.title}" to the previous column`}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    disabled={col.status === 'completed'}
                    onClick={() => move(task, 1)}
                    aria-label={`Move "${task.title}" to the next column`}
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {col.items.length === 0 && <p className="board__empty">Drop tasks here</p>}
        </section>
      ))}
    </div>
  );
}
