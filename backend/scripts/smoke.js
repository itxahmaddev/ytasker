/* End-to-end API check. Needs a running server and database:
 *   npm run dev            (in one terminal)
 *   npm run smoke          (in another; API_URL overrides the default)
 * It creates a throwaway account and always deletes it again.
 */
const API = process.env.API_URL || 'http://localhost:5000/api';
const stamp = Date.now();
const email = `smoke+${stamp}@ytasker.test`;
const password = 'smoke-test-pass-1';

let token = '';
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function check(name, cond, extra) {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}`, extra === undefined ? '' : JSON.stringify(extra));
  }
}

async function main() {
  console.log(`Ytasker smoke test against ${API}`);

  let r = await call('GET', '/health');
  check('health', r.status === 200 && r.data.status === 'ok');

  r = await call('POST', '/auth/signup', { name: 'Smoke', email, password: 'short' });
  check('signup rejects short password', r.status === 400, r);

  r = await call('POST', '/auth/signup', { name: 'Smoke', email, password });
  check('signup', r.status === 201 && r.data.token, r);
  token = r.data.token;

  r = await call('POST', '/auth/signup', { name: 'Smoke', email, password });
  check('signup rejects duplicate email', r.status === 409, r);

  r = await call('POST', '/auth/login', { email, password: 'wrong-password' });
  check('login rejects bad password', r.status === 401, r);

  const saved = token;
  token = '';
  r = await call('GET', '/tasks');
  check('tasks require auth', r.status === 401, r);
  token = saved;

  // Tasks
  r = await call('POST', '/tasks', { title: '   ' });
  check('task rejects blank title', r.status === 400, r);

  r = await call('POST', '/tasks', {
    title: 'Write the report',
    priority: 'high',
    dueDate: '2030-01-15',
    tags: ['Work', '#work', ' deep '],
    subtasks: [{ title: 'Outline' }, { title: 'Draft', done: true }, { title: '  ' }],
  });
  check('create task', r.status === 201, r);
  const task = r.data;
  check('priority saved', task.priority === 'high');
  check('tags normalised + deduped', JSON.stringify(task.tags) === '["work","deep"]', task.tags);
  check('blank subtask dropped', task.subtasks?.length === 2, task.subtasks);
  check('dueDate stored as UTC midnight', task.dueDate === '2030-01-15T00:00:00.000Z', task.dueDate);

  r = await call('POST', '/tasks', { title: 'x', priority: 'urgent' });
  check('invalid priority rejected', r.status === 400, r);

  r = await call('PUT', `/tasks/${task._id}`, { status: 'completed' });
  check('complete task sets completedAt', r.status === 200 && r.data.completedAt, r.data);
  r = await call('PUT', `/tasks/${task._id}`, { status: 'in-progress' });
  check('reopen clears completedAt', r.data.completedAt === null, r.data);

  r = await call('PUT', `/tasks/${task._id}`, { order: 12345.5, subtasks: [{ title: 'Only one' }] });
  check('order + subtasks update', r.data.order === 12345.5 && r.data.subtasks.length === 1, r.data);

  await call('POST', '/tasks', { title: 'Buy milk', tags: ['home'] });
  r = await call('GET', '/tasks?q=report');
  check('search by text', r.data.length === 1 && r.data[0].title === 'Write the report', r.data);
  r = await call('GET', '/tasks?tag=home');
  check('filter by tag', r.data.length === 1 && r.data[0].title === 'Buy milk', r.data);
  r = await call('GET', '/tasks?priority=high');
  check('filter by priority', r.data.length === 1, r.data);
  r = await call('GET', '/tasks?q=.*');
  check('search input is regex-escaped', r.status === 200 && r.data.length === 0, r.data);

  r = await call('PUT', `/tasks/${task._id}`, { status: 'completed' });
  r = await call('GET', '/tasks/stats?tz=Asia/Karachi');
  check('stats', r.status === 200 && r.data.total === 2 && r.data.counts.completed === 1, r.data);
  check('stats streak counts today', r.data.streak === 1 && r.data.completedToday === 1, r.data);
  check('stats last7 has 7 days', r.data.last7?.length === 7, r.data.last7);

  // Focus
  r = await call('POST', '/focus', { minutes: 25, taskId: task._id });
  check('log focus session', r.status === 201, r);
  r = await call('POST', '/focus', { minutes: 0 });
  check('focus rejects 0 minutes', r.status === 400, r);
  r = await call('GET', `/tasks/${task._id}`);
  check('focus minutes added to task', r.data.focusMinutes === 25, r.data);
  r = await call('GET', '/tasks/stats');
  check('stats include focus', r.data.focus.todayMinutes === 25 && r.data.focus.sessions === 1, r.data.focus);

  // Settings / profile
  r = await call('PUT', '/settings', { theme: 'system', defaultView: 'board', focusLength: 50 });
  check('settings update', r.status === 200 && r.data.defaultView === 'board' && r.data.focusLength === 50, r);
  r = await call('PUT', '/settings', { focusLength: 1 });
  check('settings reject out-of-range', r.status === 400, r);
  r = await call('PUT', '/profile', { avatar: 'javascript:alert(1)' });
  check('profile rejects non-http avatar', r.status === 400, r);

  r = await call('DELETE', '/tasks?status=completed');
  check('clear completed', r.status === 200 && r.data.deleted === 1, r);
  r = await call('DELETE', `/tasks/${task._id}`);
  check('deleted task is gone', r.status === 404, r);
}

main()
  .catch((err) => {
    failed += 1;
    console.error('Smoke test crashed:', err);
  })
  .finally(async () => {
    if (token) {
      const r = await call('DELETE', '/profile', { password }).catch(() => null);
      const deleted = r?.status === 200;
      console.log(deleted ? '  cleaned up test account' : '  WARNING: could not delete test account', email);
      if (!deleted) failed += 1;
    }
    console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
    process.exit(failed ? 1 : 0);
  });
