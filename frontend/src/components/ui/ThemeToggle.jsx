import { Moon, Sun } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Quick light/dark flip. Settings has the full light / dark / system choice.
export default function ThemeToggle({ className = '' }) {
  const { resolved, setTheme } = useTheme();
  const { user, setUser } = useAuth();
  const next = resolved === 'dark' ? 'light' : 'dark';

  function toggle() {
    setTheme(next);
    if (user) {
      api
        .put('/settings', { theme: next })
        .then(({ data }) => setUser((u) => (u ? { ...u, settings: data } : u)))
        .catch(() => {});
    }
  }

  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {resolved === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}
