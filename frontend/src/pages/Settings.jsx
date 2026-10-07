import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Columns3, Download, List, Monitor, Moon, Sun, X } from 'lucide-react';
import api, { errorMessage } from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { exportCSV, exportJSON } from '../lib/exporters';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { tasks } = useTasks();
  const { setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const s = user.settings;

  const [lengths, setLengths] = useState({ focusLength: s.focusLength, breakLength: s.breakLength });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const deleteRef = useRef(null);

  async function save(patch, message = 'Settings saved') {
    try {
      const { data } = await api.put('/settings', patch);
      setUser((u) => ({ ...u, settings: data }));
      toast(message);
      return true;
    } catch (err) {
      toast(errorMessage(err, 'Could not save settings'), { type: 'error' });
      return false;
    }
  }

  function chooseTheme(value) {
    setTheme(value); // instant, then persist
    save({ theme: value }, 'Theme updated');
  }

  async function toggleNotifications(on) {
    if (on && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    save({ notifications: on });
  }

  function saveLengths(e) {
    e.preventDefault();
    save({ focusLength: Number(lengths.focusLength), breakLength: Number(lengths.breakLength) }, 'Timer lengths saved');
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);
    try {
      await api.delete('/profile', { data: { password: deletePassword } });
      deleteRef.current?.close();
      await logout();
      navigate('/');
    } catch (err) {
      setDeleteError(errorMessage(err, 'Could not delete account'));
    } finally {
      setDeleting(false);
    }
  }

  const notifBlocked = 'Notification' in window && Notification.permission === 'denied';

  return (
    <div className="page page--narrow">
      <header className="page__head">
        <div>
          <p className="eyebrow">Make it yours</p>
          <h2 className="page__title">Settings</h2>
        </div>
      </header>

      <section className="card card__pad form-stack" aria-labelledby="set-appearance">
        <div>
          <h3 className="card__title" id="set-appearance">Appearance</h3>
          <p className="card__sub">Choose how Ytasker looks. “System” follows your device.</p>
        </div>
        <div className="theme-picker" role="radiogroup" aria-label="Theme">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <label key={value} className="theme-option">
              <input type="radio" name="theme" checked={s.theme === value} onChange={() => chooseTheme(value)} />
              <span className={`theme-option__card theme-option__card--${value}`}>
                <span className="theme-option__preview" aria-hidden="true">
                  <i /><i /><i />
                </span>
                <span className="theme-option__label"><Icon aria-hidden="true" /> {label}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="field">
          <span className="field__label">Default task view</span>
          <div className="segmented">
            <label>
              <input type="radio" name="defaultView" checked={s.defaultView === 'list'} onChange={() => save({ defaultView: 'list' })} />
              <span><List aria-hidden="true" /> List</span>
            </label>
            <label>
              <input type="radio" name="defaultView" checked={s.defaultView === 'board'} onChange={() => save({ defaultView: 'board' })} />
              <span><Columns3 aria-hidden="true" /> Board</span>
            </label>
          </div>
        </div>
      </section>

      <form className="card card__pad form-stack" onSubmit={saveLengths} aria-labelledby="set-focus">
        <div>
          <h3 className="card__title" id="set-focus">Focus timer</h3>
          <p className="card__sub">Session lengths in minutes.</p>
        </div>
        <div className="modal__grid">
          <div className="field">
            <label className="field__label" htmlFor="focus-len">Focus (5–90)</label>
            <input
              id="focus-len"
              type="number"
              className="input"
              min={5}
              max={90}
              value={lengths.focusLength}
              onChange={(e) => setLengths({ ...lengths, focusLength: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="break-len">Break (1–30)</label>
            <input
              id="break-len"
              type="number"
              className="input"
              min={1}
              max={30}
              value={lengths.breakLength}
              onChange={(e) => setLengths({ ...lengths, breakLength: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <button type="submit" className="btn btn--primary">Save timer lengths</button>
        </div>
      </form>

      <section className="card card__pad" aria-labelledby="set-notif">
        <div className="setting-row">
          <div>
            <h3 className="card__title" id="set-notif">Desktop notifications</h3>
            <p className="card__sub">
              {notifBlocked
                ? 'Notifications are blocked in your browser settings for this site.'
                : 'Get a notification when a focus session or break ends.'}
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              role="switch"
              checked={s.notifications}
              onChange={(e) => toggleNotifications(e.target.checked)}
              aria-labelledby="set-notif"
            />
            <span className="switch__track" />
          </label>
        </div>
      </section>

      <section className="card card__pad form-stack" aria-labelledby="set-data">
        <div>
          <h3 className="card__title" id="set-data">Your data</h3>
          <p className="card__sub">Download everything you’ve created — {tasks.length} task{tasks.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn--outline" onClick={() => exportCSV(tasks)} disabled={!tasks.length}>
            <Download aria-hidden="true" /> Export CSV
          </button>
          <button type="button" className="btn btn--outline" onClick={() => exportJSON(tasks)} disabled={!tasks.length}>
            <Download aria-hidden="true" /> Export JSON
          </button>
        </div>
      </section>

      <section className="card card__pad danger-zone" aria-labelledby="set-danger">
        <div className="setting-row">
          <div>
            <h3 className="card__title" id="set-danger">Delete account</h3>
            <p className="card__sub">Permanently removes your account, tasks and focus history. This can’t be undone.</p>
          </div>
          <button type="button" className="btn btn--danger-ghost" onClick={() => deleteRef.current?.showModal()}>
            Delete account
          </button>
        </div>
      </section>

      <dialog
        ref={deleteRef}
        className="modal modal--sm"
        aria-labelledby="del-title"
        onClose={() => {
          setDeletePassword('');
          setDeleteError('');
        }}
        onClick={(e) => e.target === deleteRef.current && deleteRef.current.close()}
      >
        <form onSubmit={deleteAccount} className="modal__form">
          <div className="modal__head">
            <h2 className="modal__title" id="del-title">Delete your account?</h2>
            <button type="button" className="icon-btn icon-btn--sm" onClick={() => deleteRef.current.close()} aria-label="Close">
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="modal__body">
            <p className="muted">Enter your password to confirm. All your data will be erased immediately.</p>
            {deleteError && <p className="alert alert--error" role="alert">{deleteError}</p>}
            <div className="field">
              <label className="field__label" htmlFor="del-pass">Password</label>
              <input
                id="del-pass"
                type="password"
                className="input"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="modal__foot">
            <span className="spacer" />
            <button type="button" className="btn btn--ghost" onClick={() => deleteRef.current.close()}>Cancel</button>
            <button type="submit" className="btn btn--danger" disabled={deleting || !deletePassword}>
              {deleting ? 'Deleting…' : 'Delete everything'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
