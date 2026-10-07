// Due dates are date-only values. The API stores them as UTC midnight, so all
// comparisons here use "YYYY-MM-DD" keys instead of Date objects to avoid the
// off-by-one-day bugs that timezones cause.

const pad = (n) => String(n).padStart(2, '0');

export function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dueKey(due) {
  return due ? String(due).slice(0, 10) : null;
}

export function addDays(key, n) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function userTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** none | overdue | today | tomorrow | soon (within a week) | later | done */
export function dueState(task, today = localDateKey()) {
  const key = dueKey(task.dueDate);
  if (!key) return 'none';
  if (task.status === 'completed') return 'done';
  if (key < today) return 'overdue';
  if (key === today) return 'today';
  if (key === addDays(today, 1)) return 'tomorrow';
  if (key <= addDays(today, 7)) return 'soon';
  return 'later';
}

export function formatDueKey(key, today = localDateKey()) {
  if (!key) return '';
  if (key === today) return 'Today';
  if (key === addDays(today, 1)) return 'Tomorrow';
  if (key === addDays(today, -1)) return 'Yesterday';
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return new Date(`${key}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  });
}

export function formatDay(key) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatMinutes(total) {
  const m = Math.round(total || 0);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
