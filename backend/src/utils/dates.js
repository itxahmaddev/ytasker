const DAY_MS = 24 * 60 * 60 * 1000;

function validTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return 'UTC';
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

// "YYYY-MM-DD" for the calendar day `date` falls on in `tz`.
function dayKey(date, tz) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Due dates are date-only values stored as UTC midnight, so "today" for the
// user is the UTC-midnight of their local calendar date.
function startOfUserToday(tz, now = new Date()) {
  return new Date(`${dayKey(now, tz)}T00:00:00.000Z`);
}

// The last `n` calendar-day keys ending at `todayKey`, oldest first.
function lastDayKeys(todayKey, n) {
  const base = new Date(`${todayKey}T00:00:00.000Z`).getTime();
  const keys = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(new Date(base - i * DAY_MS).toISOString().slice(0, 10));
  }
  return keys;
}

// Parse a client-supplied due date ("YYYY-MM-DD" or ISO) to a UTC-midnight Date.
function parseDueDate(value) {
  if (value === null || value === '' || value === undefined) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(`${d.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

module.exports = { DAY_MS, validTimeZone, dayKey, startOfUserToday, lastDayKeys, parseDueDate };
