import { forwardRef } from 'react';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['N'], label: 'Create a new task' },
  { keys: ['/'], label: 'Search tasks' },
  { keys: ['G', 'D'], label: 'Go to Dashboard' },
  { keys: ['G', 'T'], label: 'Go to Tasks' },
  { keys: ['G', 'F'], label: 'Go to Focus' },
  { keys: ['G', 'S'], label: 'Go to Settings' },
  { keys: ['?'], label: 'Show this list' },
  { keys: ['Esc'], label: 'Close dialogs' },
];

const ShortcutsDialog = forwardRef(function ShortcutsDialog(props, ref) {
  return (
    <dialog
      ref={ref}
      className="modal modal--sm"
      aria-labelledby="shortcuts-title"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <div className="modal__head">
        <h2 className="modal__title" id="shortcuts-title">Keyboard shortcuts</h2>
        <button type="button" className="icon-btn icon-btn--sm" onClick={() => ref.current.close()} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </div>
      <ul className="modal__body shortcuts">
        {SHORTCUTS.map((s) => (
          <li key={s.label}>
            <span>{s.label}</span>
            <span className="shortcuts__keys">
              {s.keys.map((k, i) => (
                <span key={k + i}>
                  {i > 0 && <span className="muted"> then </span>}
                  <kbd className="kbd">{k}</kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </dialog>
  );
});

export default ShortcutsDialog;
