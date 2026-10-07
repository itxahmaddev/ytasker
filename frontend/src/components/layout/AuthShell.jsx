import { CheckCircle2, Flame, Timer } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';

const POINTS = [
  { icon: CheckCircle2, text: 'Quick-add tasks in plain English' },
  { icon: Timer, text: 'A built-in focus timer that logs your deep work' },
  { icon: Flame, text: 'Streaks and insights that keep you moving' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__aside" aria-hidden="false">
        <Logo />
        <div className="auth__pitch">
          <h2>Calm, focused task management.</h2>
          <ul>
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="auth__quote">Plan the day. Do the work. Ytasker keeps everything else quiet.</p>
      </aside>

      <main className="auth__main" id="main">
        <div className="auth__top">
          <span className="auth__mobile-logo"><Logo /></span>
          <ThemeToggle />
        </div>
        <div className="auth__card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth__footer">{footer}</p>
        </div>
      </main>
    </div>
  );
}
