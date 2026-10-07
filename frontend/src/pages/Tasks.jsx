import { useMemo, useState } from 'react';
import { Columns3, ClipboardList, List, Search, SearchX, Trash2, X } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import QuickAdd from '../components/tasks/QuickAdd';
import TaskBoard from '../components/tasks/TaskBoard';
import TaskRow from '../components/tasks/TaskRow';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { addDays, dueKey, localDateKey } from '../lib/dates';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'done', label: 'Done' },
];

function inScope(task, scope, today) {
  const key = dueKey(task.dueDate);
  const open = task.status !== 'completed';
  switch (scope) {
    case 'today': return open && key === today;
    case 'upcoming': return open && key && key > today;
    case 'overdue': return open && key && key < today;
    case 'done': return !open;
    default: return true;
  }
}

const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  due: (a, b) => (dueKey(a.dueDate) || '9999').localeCompare(dueKey(b.dueDate) || '9999'),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  title: (a, b) => a.title.localeCompare(b.title),
};

export default function Tasks() {
  const { user } = useAuth();
  const { tasks, loading, error, reload, openTask, clearCompleted } = useTasks();
  const [view, setView] = useState(user?.settings?.defaultView || 'list');
  const [scope, setScope] = useState('all');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('newest');

  const today = localDateKey();

  const counts = useMemo(
    () => Object.fromEntries(SCOPES.map((s) => [s.id, tasks.filter((t) => inScope(t, s.id, today)).length])),
    [tasks, today]
  );
  const allTags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags || []))].sort(), [tasks]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tasks.filter(
      (t) =>
        inScope(t, scope, today) &&
        (!priority || t.priority === priority) &&
        (!tag || (t.tags || []).includes(tag)) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.tags || []).some((x) => x.includes(q.replace(/^#/, ''))))
    );
    // In list view finished tasks sink to the bottom; the board sorts itself.
    return list.sort((a, b) => {
      const doneDiff = Number(a.status === 'completed') - Number(b.status === 'completed');
      return doneDiff || SORTS[sort](a, b);
    });
  }, [tasks, scope, priority, tag, query, sort, today]);

  const filtering = Boolean(query || priority || tag || scope !== 'all');
  const doneTotal = tasks.filter((t) => t.status === 'completed').length;

  function clearFilters() {
    setQuery('');
    setPriority('');
    setTag('');
    setScope('all');
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{tasks.length} total · {tasks.filter((t) => t.status !== 'completed').length} open</p>
          <h2 className="page__title">Your tasks</h2>
        </div>
        <div className="segmented" role="radiogroup" aria-label="View">
          <label>
            <input type="radio" name="view" checked={view === 'list'} onChange={() => setView('list')} />
            <span><List aria-hidden="true" /> List</span>
          </label>
          <label>
            <input type="radio" name="view" checked={view === 'board'} onChange={() => setView('board')} />
            <span><Columns3 aria-hidden="true" /> Board</span>
          </label>
        </div>
      </header>

      <QuickAdd />

      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Filter by date">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`tab${scope === s.id ? ' is-active' : ''}`}
              aria-pressed={scope === s.id}
              onClick={() => setScope(s.id)}
            >
              {s.label} <span className="tab__count tabular">{counts[s.id]}</span>
            </button>
          ))}
        </div>

        <div className="toolbar__filters">
          <div className="input-group toolbar__search">
            <Search aria-hidden="true" />
            <input
              id="task-search"
              type="search"
              className="input"
              placeholder="Search tasks"
              aria-label="Search tasks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
            />
            {!query && <span className="kbd" aria-hidden="true">/</span>}
          </div>
          <select className="select select--sm" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
            <option value="">Any priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {allTags.length > 0 && (
            <select className="select select--sm" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Filter by tag">
              <option value="">Any tag</option>
              {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
            </select>
          )}
          {view === 'list' && (
            <select className="select select--sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              <option value="newest">Newest first</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="title">Title A–Z</option>
            </select>
          )}
          {filtering && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
              <X aria-hidden="true" /> Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => reload()}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="stack-sm">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 62 }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="Your task list is empty"
            action={<button type="button" className="btn btn--primary" onClick={() => openTask()}>Create your first task</button>}
          >
            Use the quick-add box above, or press <span className="kbd">N</span>. Try typing “Plan sprint tomorrow !high #work”.
          </EmptyState>
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={SearchX}
            title="No tasks match"
            action={<button type="button" className="btn btn--outline" onClick={clearFilters}>Clear filters</button>}
          >
            Try a different search or filter.
          </EmptyState>
        </div>
      ) : view === 'list' ? (
        <ul className="card task-list task-list--card">
          {visible.map((t) => <TaskRow key={t._id} task={t} />)}
        </ul>
      ) : (
        <TaskBoard tasks={visible} />
      )}

      {doneTotal > 0 && !loading && (
        <div className="page__foot">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              if (window.confirm(`Permanently delete ${doneTotal} completed task${doneTotal === 1 ? '' : 's'}?`)) clearCompleted();
            }}
          >
            <Trash2 aria-hidden="true" /> Clear {doneTotal} completed
          </button>
        </div>
      )}
    </div>
  );
}
