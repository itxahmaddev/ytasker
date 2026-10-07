import { useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Keyboard,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Timer,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FocusProvider, formatClock, useFocus } from '../../context/FocusContext';
import { TasksProvider, useTasks } from '../../context/TasksContext';
import useHotkeys from '../../hooks/useHotkeys';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import ShortcutsDialog from './ShortcutsDialog';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/focus': 'Focus',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

function FocusPill() {
  const { status, mode, remaining } = useFocus();
  if (status === 'idle') return null;
  return (
    <NavLink to="/focus" className="focus-pill" aria-label={`${mode} timer ${status}, ${formatClock(remaining)} left`}>
      <Timer aria-hidden="true" />
      <span className="tabular">{formatClock(remaining)}</span>
      <span className="focus-pill__mode">{mode === 'focus' ? 'Focus' : 'Break'}</span>
    </NavLink>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const { openTask } = useTasks();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const shortcutsRef = useRef(null);

  useHotkeys({
    n: () => openTask(),
    '/': () => {
      if (pathname !== '/tasks') navigate('/tasks');
      // Wait a tick so the search box exists after navigation.
      setTimeout(() => document.getElementById('task-search')?.focus(), 30);
    },
    '?': () => shortcutsRef.current?.showModal(),
    'g d': () => navigate('/dashboard'),
    'g t': () => navigate('/tasks'),
    'g f': () => navigate('/focus'),
    'g s': () => navigate('/settings'),
  });

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>

      <aside className="sidebar" aria-label="Primary">
        <div className="sidebar__brand">
          <Logo to="/dashboard" />
        </div>

        <button type="button" className="btn btn--primary btn--block sidebar__new" onClick={() => openTask()}>
          <Plus aria-hidden="true" /> New task <span className="kbd kbd--on-primary">N</span>
        </button>

        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="nav-link">
              <Icon aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__foot">
          <FocusPill />
          <button type="button" className="nav-link" onClick={() => shortcutsRef.current?.showModal()}>
            <Keyboard aria-hidden="true" /> Shortcuts <span className="kbd">?</span>
          </button>
          <div className="user-card">
            <Avatar user={user} size={38} />
            <div className="user-card__text">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
            <button type="button" className="icon-btn icon-btn--sm" onClick={handleLogout} aria-label="Log out" title="Log out">
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="app__main">
        <header className="topbar">
          <div className="topbar__brand">
            <Logo to="/dashboard" label={false} />
          </div>
          <h1 className="topbar__title">{TITLES[pathname] || 'Ytasker'}</h1>
          <div className="topbar__actions">
            <FocusPill />
            <ThemeToggle />
            <button type="button" className="btn btn--primary btn--sm topbar__new" onClick={() => openTask()}>
              <Plus aria-hidden="true" /> <span>New task</span>
            </button>
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label="Primary mobile">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="tabbar__link">
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="fab" onClick={() => openTask()} aria-label="New task">
        <Plus aria-hidden="true" />
      </button>

      <ShortcutsDialog ref={shortcutsRef} />
    </div>
  );
}

export default function AppLayout() {
  return (
    <TasksProvider>
      <FocusProvider>
        <Shell />
      </FocusProvider>
    </TasksProvider>
  );
}
