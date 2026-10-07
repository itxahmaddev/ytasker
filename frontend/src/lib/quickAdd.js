import { addDays, localDateKey } from './dates';

const PRIORITY_WORDS = {
  '!high': 'high', '!h': 'high', '!1': 'high', '!urgent': 'high',
  '!medium': 'medium', '!med': 'medium', '!m': 'medium', '!2': 'medium',
  '!low': 'low', '!l': 'low', '!3': 'low',
};

const WEEKDAYS = [
  ['sun', 'sunday'], ['mon', 'monday'], ['tue', 'tuesday'], ['wed', 'wednesday'],
  ['thu', 'thursday'], ['fri', 'friday'], ['sat', 'saturday'],
];

function weekdayIndex(word) {
  return WEEKDAYS.findIndex(([short, long]) => word === short || word === long);
}

/**
 * Turn "Send invoice tomorrow !high #work" into
 * { title: 'Send invoice', dueDate: '2026-10-08', priority: 'high', tags: ['work'] }.
 * Anything it doesn't recognise stays in the title.
 */
export function parseQuickAdd(input, now = new Date()) {
  const raw = (input || '').trim();
  const today = localDateKey(now);
  const result = { title: '', priority: null, dueDate: null, tags: [] };
  if (!raw) return result;

  const words = [];
  for (const token of raw.split(/\s+/)) {
    const lower = token.toLowerCase();

    if (lower in PRIORITY_WORDS && !result.priority) {
      result.priority = PRIORITY_WORDS[lower];
    } else if (/^#[\w-]{1,24}$/.test(lower)) {
      const tag = lower.slice(1);
      if (!result.tags.includes(tag)) result.tags.push(tag);
    } else if (!result.dueDate && (lower === 'today' || lower === 'tod')) {
      result.dueDate = today;
    } else if (!result.dueDate && (lower === 'tomorrow' || lower === 'tmrw' || lower === 'tom')) {
      result.dueDate = addDays(today, 1);
    } else if (!result.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(lower) && !Number.isNaN(Date.parse(lower))) {
      result.dueDate = lower;
    } else if (!result.dueDate && weekdayIndex(lower) !== -1) {
      const todayDow = new Date(`${today}T00:00:00Z`).getUTCDay();
      let diff = weekdayIndex(lower) - todayDow;
      if (diff <= 0) diff += 7; // next occurrence, never "today"
      result.dueDate = addDays(today, diff);
    } else {
      words.push(token);
    }
  }

  result.title = words.join(' ').trim();
  // Typing only "tomorrow" shouldn't create a task with no title.
  if (!result.title) {
    return { title: raw, priority: null, dueDate: null, tags: [] };
  }
  return result;
}
