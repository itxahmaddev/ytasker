import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { errorMessage } from '../api/axiosInstance';
import AuthShell from '../components/layout/AuthShell';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={<>New to Ytasker? <Link to="/signup">Create an account</Link></>}
    >
      <form className="form-stack" onSubmit={handleSubmit} noValidate={false}>
        {error && (
          <p className="alert alert--error" role="alert">
            <AlertCircle aria-hidden="true" /> {error}
          </p>
        )}
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
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
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
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
