import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import api, { errorMessage } from '../api/axiosInstance';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';

function Message({ msg }) {
  if (!msg) return null;
  const Icon = msg.type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <p className={`alert alert--${msg.type === 'success' ? 'success' : 'error'}`} role={msg.type === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" /> {msg.text}
    </p>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [busy, setBusy] = useState('');

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMsg(null);
    setBusy('profile');
    try {
      const { data } = await api.put('/profile', form);
      setUser(data);
      setProfileMsg({ type: 'success', text: 'Profile updated' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: errorMessage(err, 'Update failed') });
    } finally {
      setBusy('');
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPasswordMsg(null);
    setBusy('password');
    try {
      await api.put('/profile/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordMsg({ type: 'success', text: 'Password changed' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: errorMessage(err, 'Password change failed') });
    } finally {
      setBusy('');
    }
  }

  const since = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="page page--narrow">
      <header className="page__head">
        <div>
          <p className="eyebrow">{since && `Member since ${since}`}</p>
          <h2 className="page__title">Profile</h2>
        </div>
      </header>

      <form className="card card__pad form-stack" onSubmit={saveProfile}>
        <div className="profile-head">
          <Avatar user={{ name: form.name, avatar: form.avatar }} size={72} />
          <div>
            <strong className="profile-head__name">{form.name || 'Your name'}</strong>
            <span className="muted">{user?.email}</span>
          </div>
        </div>

        <Message msg={profileMsg} />

        <div className="field">
          <label className="field__label" htmlFor="p-email">Email</label>
          <input id="p-email" className="input" value={user?.email || ''} disabled />
          <span className="field__hint">Your email is your login and can’t be changed here.</span>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="p-name">Name</label>
          <input id="p-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="p-avatar">Avatar URL</label>
          <input
            id="p-avatar"
            type="url"
            className="input"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            placeholder="https://example.com/me.jpg"
          />
          <span className="field__hint">Optional. Leave empty to use your initials.</span>
        </div>
        <div>
          <button type="submit" className="btn btn--primary" disabled={busy === 'profile'}>
            {busy === 'profile' ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      <form className="card card__pad form-stack" onSubmit={savePassword}>
        <div>
          <h3 className="card__title">Change password</h3>
          <p className="card__sub">Use at least 8 characters.</p>
        </div>
        <Message msg={passwordMsg} />
        <div className="field">
          <label className="field__label" htmlFor="p-current">Current password</label>
          <input
            id="p-current"
            type="password"
            className="input"
            autoComplete="current-password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="p-new">New password</label>
          <input
            id="p-new"
            type="password"
            className="input"
            autoComplete="new-password"
            minLength={8}
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            required
          />
        </div>
        <div>
          <button type="submit" className="btn btn--primary" disabled={busy === 'password'}>
            {busy === 'password' ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
