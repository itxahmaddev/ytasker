import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { errorMessage } from '../api/axiosInstance';
import AuthShell from '../components/layout/AuthShell';
import { useAuth } from '../context/AuthContext';

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score; // 0-4
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const score = form.password.length < 8 ? 0 : Math.max(1, strength(form.password));

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Signup failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start organising your work in under a minute."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        {error && (
          <p className="alert alert--error" role="alert">
            <AlertCircle aria-hidden="true" /> {error}
          </p>
        )}
        <div className="field">
          <label className="field__label" htmlFor="name">Name</label>
          <input
            id="name"
            className="input"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={form.name}
            onChange={handleChange}
            maxLength={80}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="password">Password</label>
          <div className="input-group input-group--end input-group--plain">
            <input
              id="password"
              className="input"
              type={show ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={handleChange}
              aria-describedby="pw-hint"
              required
            />
            <button
              type="button"
              className="icon-btn icon-btn--sm input-group__btn"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              aria-pressed={show}
            >
              {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          <div className="strength" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={n <= score ? `on s${score}` : ''} />
            ))}
          </div>
          <span className="field__hint" id="pw-hint">
            At least 8 characters.{form.password && <> Strength: <strong>{STRENGTH_LABEL[score]}</strong></>}
          </span>
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
