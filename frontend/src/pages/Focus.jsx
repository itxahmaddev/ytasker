import { useMemo } from 'react';
import { Coffee, Pause, Play, RotateCcw, SkipForward, Target } from 'lucide-react';
import { formatClock, useFocus } from '../context/FocusContext';
import { useTasks } from '../context/TasksContext';
import { formatMinutes } from '../lib/dates';

export default function Focus() {
  const { mode, status, remaining, total, progress, taskId, start, pause, reset, setMode, setTaskId, skip } = useFocus();
  const { tasks } = useTasks();

  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'completed'), [tasks]);
  const current = tasks.find((t) => t._id === taskId);
  const running = status === 'running';

  const r = 118;
  const c = 2 * Math.PI * r;

  return (
    <div className="page page--narrow">
      <header className="page__head">
        <div>
          <p className="eyebrow">Deep work</p>
          <h2 className="page__title">Focus timer</h2>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Timer mode">
          <label>
            <input type="radio" name="mode" checked={mode === 'focus'} onChange={() => setMode('focus')} disabled={running} />
            <span><Target aria-hidden="true" /> Focus</span>
          </label>
          <label>
            <input type="radio" name="mode" checked={mode === 'break'} onChange={() => setMode('break')} disabled={running} />
            <span><Coffee aria-hidden="true" /> Break</span>
          </label>
        </div>
      </header>

      <section className={`card timer timer--${mode}`} aria-label="Timer">
        <div className="timer__dial">
          <svg viewBox="0 0 260 260" aria-hidden="true">
            <circle cx="130" cy="130" r={r} className="timer__track" />
            <circle
              cx="130"
              cy="130"
              r={r}
              className="timer__bar"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - (status === 'idle' ? 0 : progress))}
            />
          </svg>
          <div className="timer__readout">
            <span className="timer__time tabular" role="timer" aria-live="off">{formatClock(remaining)}</span>
            <span className="timer__state">
              {status === 'running' ? (mode === 'focus' ? 'Stay with it' : 'Rest up') : status === 'paused' ? 'Paused' : mode === 'focus' ? 'Ready to focus' : 'Time for a break'}
            </span>
          </div>
        </div>

        <div className="timer__controls">
          <button type="button" className="icon-btn" onClick={reset} disabled={status === 'idle'} aria-label="Reset timer" title="Reset">
            <RotateCcw aria-hidden="true" />
          </button>
          {running ? (
            <button type="button" className="btn btn--primary btn--lg timer__main" onClick={pause}>
              <Pause aria-hidden="true" /> Pause
            </button>
          ) : (
            <button type="button" className="btn btn--primary btn--lg timer__main" onClick={start}>
              <Play aria-hidden="true" /> {status === 'paused' ? 'Resume' : 'Start'}
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            onClick={skip}
            disabled={status === 'idle'}
            aria-label={mode === 'focus' ? 'Finish session now' : 'Skip break'}
            title={mode === 'focus' ? 'Finish now (logs the full session)' : 'Skip break'}
          >
            <SkipForward aria-hidden="true" />
          </button>
        </div>

        {mode === 'focus' && (
          <div className="field timer__task">
            <label className="field__label" htmlFor="focus-task">Working on</label>
            <select id="focus-task" className="select" value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">No specific task</option>
              {openTasks.map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
            {current?.focusMinutes > 0 && (
              <span className="field__hint">{formatMinutes(current.focusMinutes)} focused on this task so far</span>
            )}
          </div>
        )}
      </section>

      <p className="muted focus-tip">
        {Math.round(total / 60000)}-minute {mode} sessions — change the length in Settings. The timer keeps running while you
        browse other pages, and finished focus sessions show up on your dashboard.
      </p>
    </div>
  );
}
