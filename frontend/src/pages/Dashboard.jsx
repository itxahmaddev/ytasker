import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, ArrowRight, CalendarCheck, CheckCheck, Flame, ListTodo, Timer } from 'lucide-react';
import api from '../api/axiosInstance';
import EmptyState from '../components/ui/EmptyState';
import QuickAdd from '../components/tasks/QuickAdd';
import TaskRow from '../components/tasks/TaskRow';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { dueKey, formatDay, formatMinutes, greeting, localDateKey, userTimeZone } from '../lib/dates';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function StatCard({ icon: Icon, label, value, hint, tone = 'primary' }) {
  return (
    <div className={`card stat stat--${tone}`}>
      <span className="stat__icon">
        <Icon aria-hidden="true" />
      </span>
      <div>
        <p className="stat__value tabular">{value}</p>
        <p className="stat__label">{label}</p>
        {hint && <p className="stat__hint">{hint}</p>}
      </div>
    </div>
  );
}

function CompletionRing({ percent }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" role="img" aria-label={`${percent}% of your tasks are complete`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="ring__track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="ring__bar"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
        />
      </svg>
      <div className="ring__label">
        <strong className="tabular">{percent}%</strong>
        <span>complete</span>
      </div>
    </div>
  );
}

function WeekChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.completed));
  const today = localDateKey();
  return (
    <figure className="chart">
      <div className="chart__bars" aria-hidden="true">
        {days.map((d) => (
          <div key={d.date} className="chart__col" title={`${d.completed} completed`}>
            <span className="chart__value tabular">{d.completed || ''}</span>
            <div className="chart__track">
              <div
                className={`chart__bar${d.date === today ? ' is-today' : ''}`}
                style={{ height: `${Math.max(d.completed ? 8 : 3, (d.completed / max) * 100)}%` }}
              />
            </div>
            <span className="chart__label">{formatDay(d.date)}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Tasks completed per day over the last 7 days</caption>
        <thead>
          <tr><th>Day</th><th>Completed</th></tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}><td>{d.date}</td><td>{d.completed}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, loading, statsVersion } = useTasks();
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get('/tasks/stats', { params: { tz: userTimeZone() } })
      .then((res) => {
        if (active) {
          setStats(res.data);
          setStatsError(false);
        }
      })
      .catch(() => active && setStatsError(true));
    return () => {
      active = false;
    };
  }, [statsVersion]);

  const upNext = useMemo(() => {
    const today = localDateKey();
    return tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        const ka = dueKey(a.dueDate) || '9999';
        const kb = dueKey(b.dueDate) || '9999';
        // Overdue and due-today float to the top, then by priority.
        const ba = ka <= today ? 0 : 1;
        const bb = kb <= today ? 0 : 1;
        return ba - bb || ka.localeCompare(kb) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      })
      .slice(0, 6);
  }, [tasks]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const dateText = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">{dateText}</p>
          <h2 className="page__title">
            {greeting()}, {firstName}
          </h2>
        </div>
      </header>

      <QuickAdd />

      <section className="stats" aria-label="Overview">
        <StatCard
          icon={CalendarCheck}
          label="Due today"
          tone="accent"
          value={stats ? stats.dueToday : '–'}
          hint={stats ? `${stats.dueSoon} more this week` : ''}
        />
        <StatCard
          icon={AlarmClock}
          label="Overdue"
          tone={stats?.overdue ? 'danger' : 'primary'}
          value={stats ? stats.overdue : '–'}
          hint={stats?.overdue ? 'Needs attention' : 'All caught up'}
        />
        <StatCard
          icon={Flame}
          label="Day streak"
          tone="accent"
          value={stats ? stats.streak : '–'}
          hint={stats ? `${stats.completedThisWeek} done this week` : ''}
        />
        <StatCard
          icon={Timer}
          label="Focus today"
          value={stats ? formatMinutes(stats.focus.todayMinutes) : '–'}
          hint={stats ? `${formatMinutes(stats.focus.weekMinutes)} this week` : ''}
        />
      </section>

      {statsError && <p className="alert alert--error">Couldn’t load your stats. They’ll refresh next time.</p>}

      <div className="dash-grid">
        <section className="card card__pad dash-grid__next" aria-labelledby="next-title">
          <div className="card__head">
            <div>
              <h3 className="card__title" id="next-title">Up next</h3>
              <p className="card__sub">Overdue and due-soon first, then by priority</p>
            </div>
            <Link to="/tasks" className="btn btn--ghost btn--sm">
              All tasks <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {loading ? (
            <div className="stack-sm">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 58 }} />)}
            </div>
          ) : upNext.length === 0 ? (
            <EmptyState icon={CheckCheck} title="Nothing on your plate">
              Add a task above, or press <span className="kbd">N</span> to create one with all the details.
            </EmptyState>
          ) : (
            <ul className="task-list">
              {upNext.map((t) => <TaskRow key={t._id} task={t} />)}
            </ul>
          )}
        </section>

        <section className="card card__pad" aria-labelledby="progress-title">
          <div className="card__head">
            <h3 className="card__title" id="progress-title">Progress</h3>
          </div>
          {stats ? (
            <div className="progress">
              <CompletionRing percent={stats.completionRate} />
              <dl className="legend">
                <div><dt><span className="status-dot" data-status="pending" /> To do</dt><dd className="tabular">{stats.counts.pending}</dd></div>
                <div><dt><span className="status-dot" data-status="in-progress" /> In progress</dt><dd className="tabular">{stats.counts['in-progress']}</dd></div>
                <div><dt><span className="status-dot" data-status="completed" /> Done</dt><dd className="tabular">{stats.counts.completed}</dd></div>
              </dl>
            </div>
          ) : (
            <div className="skeleton" style={{ height: 150 }} />
          )}
        </section>

        <section className="card card__pad dash-grid__chart" aria-labelledby="week-title">
          <div className="card__head">
            <div>
              <h3 className="card__title" id="week-title">Last 7 days</h3>
              <p className="card__sub">Tasks completed each day</p>
            </div>
            <span className="chip chip--done"><ListTodo aria-hidden="true" />{stats ? stats.completedThisWeek : 0} done</span>
          </div>
          {stats ? <WeekChart days={stats.last7} /> : <div className="skeleton" style={{ height: 170 }} />}
        </section>
      </div>
    </div>
  );
}
