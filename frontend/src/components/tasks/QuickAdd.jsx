import { useMemo, useState } from 'react';
import { CalendarDays, Flag, Plus, Sparkles } from 'lucide-react';
import { useTasks } from '../../context/TasksContext';
import { dueKey, formatDueKey } from '../../lib/dates';
import { parseQuickAdd } from '../../lib/quickAdd';

export default function QuickAdd({ placeholder = 'Add a task — try "Send invoice tomorrow !high #work"' }) {
  const { createTask } = useTasks();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => parseQuickAdd(text), [text]);
  const hasMeta = parsed.priority || parsed.dueDate || parsed.tags.length > 0;

  async function submit(e) {
    e.preventDefault();
    if (!parsed.title || busy) return;
    setBusy(true);
    try {
      await createTask({
        title: parsed.title,
        ...(parsed.priority ? { priority: parsed.priority } : {}),
        ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
        ...(parsed.tags.length ? { tags: parsed.tags } : {}),
      });
      setText('');
    } catch {
      /* the provider already showed an error toast; keep the text for a retry */
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="quick-add" onSubmit={submit}>
      <div className="input-group input-group--end">
        <Sparkles aria-hidden="true" />
        <input
          className="input quick-add__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label="Quick add a task"
          maxLength={300}
          autoComplete="off"
        />
        <button
          type="submit"
          className="icon-btn icon-btn--sm input-group__btn quick-add__submit"
          disabled={!parsed.title || busy}
          aria-label="Add task"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
      {hasMeta && (
        <div className="quick-add__preview" aria-live="polite">
          <span className="muted">Will add</span>
          <strong>{parsed.title}</strong>
          {parsed.priority && (
            <span className={`chip chip--${parsed.priority}`}>
              <Flag aria-hidden="true" />
              {parsed.priority}
            </span>
          )}
          {parsed.dueDate && (
            <span className="chip chip--soon">
              <CalendarDays aria-hidden="true" />
              {formatDueKey(dueKey(parsed.dueDate))}
            </span>
          )}
          {parsed.tags.map((t) => (
            <span key={t} className="chip chip--tag">
              #{t}
            </span>
          ))}
        </div>
      )}
    </form>
  );
}
