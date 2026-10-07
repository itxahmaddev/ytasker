import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { addDays, dueKey, localDateKey } from '../../lib/dates';
import { PRIORITY_LABEL, STATUS_LABEL } from './TaskMeta';

const EMPTY = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
  tags: [],
  subtasks: [],
};

function fromTask(task, defaults) {
  if (!task) return { ...EMPTY, ...(defaults || {}), dueDate: defaults?.dueDate || '' };
  return {
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority || 'medium',
    dueDate: dueKey(task.dueDate) || '',
    tags: task.tags || [],
    subtasks: (task.subtasks || []).map((s) => ({ ...s })),
  };
}

export default function TaskModal({ open, task, defaults, onClose, onCreate, onUpdate, onDelete }) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [tagText, setTagText] = useState('');
  const [subText, setSubText] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(task);

  // Open/close the native dialog and reset the form each time it opens.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setForm(fromTask(task, defaults));
      setTagText('');
      setSubText('');
      dialog.showModal();
      requestAnimationFrame(() => titleRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, task, defaults]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  function addTags(raw) {
    const incoming = raw
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, '').toLowerCase().trim())
      .filter(Boolean);
    if (!incoming.length) return;
    setForm((f) => ({ ...f, tags: [...new Set([...f.tags, ...incoming])].slice(0, 8) }));
  }

  function addSubtask() {
    const title = subText.trim();
    if (!title) return;
    set({ subtasks: [...form.subtasks, { title, done: false }] });
    setSubText('');
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || saving) return;

    // Anything typed but not yet committed with Enter still counts.
    const pendingTags = tagText.split(/[,\s]+/).map((t) => t.replace(/^#/, '').toLowerCase()).filter(Boolean);
    const pendingSub = subText.trim();
    const payload = {
      title: form.title.trim(),
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      tags: [...new Set([...form.tags, ...pendingTags])].slice(0, 8),
      subtasks: pendingSub ? [...form.subtasks, { title: pendingSub, done: false }] : form.subtasks,
    };

    setSaving(true);
    try {
      if (editing) await onUpdate(task._id, payload);
      else await onCreate(payload);
      onClose();
    } catch {
      /* provider shows the error toast; keep the dialog open so nothing is lost */
    } finally {
      setSaving(false);
    }
  }

  const today = localDateKey();
  const doneCount = form.subtasks.filter((s) => s.done).length;

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="task-modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <form onSubmit={submit} className="modal__form">
        <div className="modal__head">
          <h2 className="modal__title" id="task-modal-title">
            {editing ? 'Edit task' : 'New task'}
          </h2>
          <button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          <div className="field">
            <label className="field__label" htmlFor="task-title">Title</label>
            <input
              id="task-title"
              ref={titleRef}
              className="input"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="What needs to get done?"
              maxLength={200}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="task-desc">Notes</label>
            <textarea
              id="task-desc"
              className="textarea"
              rows={3}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Add details, links or context"
              maxLength={5000}
            />
          </div>

          <div className="modal__grid">
            <fieldset className="field fieldset">
              <legend className="field__label">Status</legend>
              <div className="segmented segmented--full">
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={form.status === value}
                      onChange={() => set({ status: value })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="field fieldset">
              <legend className="field__label">Priority</legend>
              <div className="segmented segmented--full">
                {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="priority"
                      value={value}
                      checked={form.priority === value}
                      onChange={() => set({ priority: value })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="task-due">Due date</label>
            <div className="due-row">
              <input
                id="task-due"
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
              />
              <button type="button" className="btn btn--outline btn--sm" onClick={() => set({ dueDate: today })}>
                Today
              </button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => set({ dueDate: addDays(today, 1) })}>
                Tomorrow
              </button>
              <button type="button" className="btn btn--outline btn--sm" onClick={() => set({ dueDate: addDays(today, 7) })}>
                Next week
              </button>
              {form.dueDate && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => set({ dueDate: '' })}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="task-tags">Tags</label>
            <div className="tag-input">
              {form.tags.map((tag) => (
                <span key={tag} className="chip chip--tag chip--removable">
                  #{tag}
                  <button
                    type="button"
                    className="chip__x"
                    onClick={() => set({ tags: form.tags.filter((t) => t !== tag) })}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                id="task-tags"
                value={tagText}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/[,\s]$/.test(v)) {
                    addTags(v);
                    setTagText('');
                  } else {
                    setTagText(v);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagText.trim()) {
                    e.preventDefault();
                    addTags(tagText);
                    setTagText('');
                  } else if (e.key === 'Backspace' && !tagText && form.tags.length) {
                    set({ tags: form.tags.slice(0, -1) });
                  }
                }}
                placeholder={form.tags.length ? '' : 'work, home, urgent…'}
                maxLength={24}
              />
            </div>
          </div>

          <div className="field">
            <span className="field__label" id="subtasks-label">
              Subtasks {form.subtasks.length > 0 && <span className="muted">({doneCount}/{form.subtasks.length})</span>}
            </span>
            {form.subtasks.length > 0 && (
              <ul className="subtasks" aria-labelledby="subtasks-label">
                {form.subtasks.map((s, i) => (
                  <li key={s._id || i} className={s.done ? 'is-done' : ''}>
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={(e) =>
                        set({ subtasks: form.subtasks.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)) })
                      }
                      aria-label={`Subtask done: ${s.title}`}
                    />
                    <input
                      className="subtasks__title"
                      value={s.title}
                      onChange={(e) =>
                        set({ subtasks: form.subtasks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })
                      }
                      aria-label={`Subtask ${i + 1} title`}
                      maxLength={200}
                    />
                    <button
                      type="button"
                      className="icon-btn icon-btn--sm icon-btn--danger"
                      onClick={() => set({ subtasks: form.subtasks.filter((_, j) => j !== i) })}
                      aria-label={`Remove subtask ${s.title}`}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="subtasks__add">
              <input
                className="input"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask and press Enter"
                aria-labelledby="subtasks-label"
                maxLength={200}
              />
              <button type="button" className="btn btn--outline" onClick={addSubtask} disabled={!subText.trim()}>
                <Plus aria-hidden="true" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="modal__foot">
          {editing && (
            <button
              type="button"
              className="btn btn--danger-ghost"
              onClick={() => {
                onClose();
                onDelete(task);
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
