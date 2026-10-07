const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const HttpError = require('../utils/httpError');
const {
  validTimeZone,
  dayKey,
  startOfUserToday,
  lastDayKeys,
  parseDueDate,
  DAY_MS,
} = require('../utils/dates');

const { STATUSES, PRIORITIES } = Task;
const MAX_TAGS = 8;
const MAX_SUBTASKS = 50;

function oneOf(value, list, name) {
  if (!list.includes(value)) {
    throw new HttpError(400, `${name} must be one of ${list.join(', ')}`);
  }
  return value;
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) throw new HttpError(400, 'tags must be an array');
  const out = [];
  for (const raw of tags) {
    const t = String(raw).trim().toLowerCase().replace(/^#/, '');
    if (t && !out.includes(t)) out.push(t.slice(0, 24));
  }
  return out.slice(0, MAX_TAGS);
}

function cleanSubtasks(list) {
  if (!Array.isArray(list)) throw new HttpError(400, 'subtasks must be an array');
  if (list.length > MAX_SUBTASKS) {
    throw new HttpError(400, `A task can have at most ${MAX_SUBTASKS} subtasks`);
  }
  return list
    .map((s) => ({
      ...(s._id ? { _id: s._id } : {}),
      title: String(s.title || '').trim().slice(0, 200),
      done: Boolean(s.done),
    }))
    .filter((s) => s.title);
}

// Validate and whitelist client input. Only keys that are present are returned,
// so the same function serves create and (partial) update.
function readTaskInput(body) {
  const out = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) throw new HttpError(400, 'title cannot be empty');
    if (title.length > 200) throw new HttpError(400, 'title is too long (max 200)');
    out.title = title;
  }
  if (body.description !== undefined) {
    const d = String(body.description ?? '');
    if (d.length > 5000) throw new HttpError(400, 'description is too long (max 5000)');
    out.description = d;
  }
  if (body.status !== undefined) out.status = oneOf(body.status, STATUSES, 'status');
  if (body.priority !== undefined) out.priority = oneOf(body.priority, PRIORITIES, 'priority');
  if (body.dueDate !== undefined) {
    const due = parseDueDate(body.dueDate);
    if (due === undefined) throw new HttpError(400, 'dueDate is not a valid date');
    out.dueDate = due;
  }
  if (body.tags !== undefined) out.tags = cleanTags(body.tags);
  if (body.subtasks !== undefined) out.subtasks = cleanSubtasks(body.subtasks);
  if (body.order !== undefined) {
    if (typeof body.order !== 'number' || !Number.isFinite(body.order)) {
      throw new HttpError(400, 'order must be a number');
    }
    out.order = body.order;
  }
  return out;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createTask(req, res, next) {
  try {
    if (!req.body.title) throw new HttpError(400, 'title is required');
    const input = readTaskInput(req.body);
    const task = await Task.create({ ...input, userId: req.user._id });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function listTasks(req, res, next) {
  try {
    const { status, priority, tag, q, sort } = req.query;
    const filter = { userId: req.user._id };

    if (status) filter.status = oneOf(status, STATUSES, 'status');
    if (priority) filter.priority = oneOf(priority, PRIORITIES, 'priority');
    if (tag) filter.tags = String(tag).toLowerCase();
    if (q) {
      const rx = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }

    const sorts = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      due: { dueDate: 1, createdAt: -1 },
      order: { order: 1 },
    };
    const tasks = await Task.find(filter)
      .sort(sorts[sort] || sorts.newest)
      .limit(1000);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) throw new HttpError(404, 'Task not found');
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const input = readTaskInput(req.body);
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) throw new HttpError(404, 'Task not found');

    task.set(input);
    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!task) throw new HttpError(404, 'Task not found');
    res.json({ message: 'Task deleted', id: task._id });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks?status=completed — bulk "clear completed".
async function clearTasks(req, res, next) {
  try {
    if (req.query.status !== 'completed') {
      throw new HttpError(400, 'Only status=completed can be bulk-deleted');
    }
    const result = await Task.deleteMany({ userId: req.user._id, status: 'completed' });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
}

// GET /api/tasks/stats?tz=Asia/Karachi — numbers for the dashboard.
async function getStats(req, res, next) {
  try {
    const tz = validTimeZone(req.query.tz);
    const userId = req.user._id;
    const today = startOfUserToday(tz);
    const tomorrow = new Date(today.getTime() + DAY_MS);
    const weekEnd = new Date(today.getTime() + 8 * DAY_MS);
    const yearAgo = new Date(Date.now() - 365 * DAY_MS);
    const open = { $ne: 'completed' };

    const [byStatus, overdue, dueToday, dueSoon, completedByDay, focusByDay, focusTotal] =
      await Promise.all([
        Task.aggregate([
          { $match: { userId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Task.countDocuments({ userId, status: open, dueDate: { $lt: today } }),
        Task.countDocuments({ userId, status: open, dueDate: { $gte: today, $lt: tomorrow } }),
        Task.countDocuments({ userId, status: open, dueDate: { $gte: tomorrow, $lt: weekEnd } }),
        Task.aggregate([
          { $match: { userId, completedAt: { $gte: yearAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: tz } },
              count: { $sum: 1 },
            },
          },
        ]),
        FocusSession.aggregate([
          { $match: { userId, createdAt: { $gte: new Date(Date.now() - 14 * DAY_MS) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
              minutes: { $sum: '$minutes' },
            },
          },
        ]),
        FocusSession.aggregate([
          { $match: { userId } },
          { $group: { _id: null, minutes: { $sum: '$minutes' }, sessions: { $sum: 1 } } },
        ]),
      ]);

    const counts = { pending: 0, 'in-progress': 0, completed: 0 };
    byStatus.forEach((r) => {
      counts[r._id] = r.count;
    });
    const total = counts.pending + counts['in-progress'] + counts.completed;

    const doneMap = new Map(completedByDay.map((r) => [r._id, r.count]));
    const focusMap = new Map(focusByDay.map((r) => [r._id, r.minutes]));
    const todayKey = dayKey(new Date(), tz);

    const last7 = lastDayKeys(todayKey, 7).map((date) => ({
      date,
      completed: doneMap.get(date) || 0,
      focusMinutes: focusMap.get(date) || 0,
    }));

    // Streak: consecutive days with at least one completion. A day without one
    // yet doesn't break the streak until it is over, so start from yesterday
    // when today is still empty.
    let streak = 0;
    const cursor = new Date(`${todayKey}T00:00:00.000Z`);
    if (!doneMap.get(todayKey)) cursor.setTime(cursor.getTime() - DAY_MS);
    while (doneMap.get(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setTime(cursor.getTime() - DAY_MS);
    }

    res.json({
      total,
      counts,
      completionRate: total ? Math.round((counts.completed / total) * 100) : 0,
      overdue,
      dueToday,
      dueSoon,
      streak,
      completedToday: doneMap.get(todayKey) || 0,
      completedThisWeek: last7.reduce((n, d) => n + d.completed, 0),
      focus: {
        todayMinutes: focusMap.get(todayKey) || 0,
        weekMinutes: last7.reduce((n, d) => n + d.focusMinutes, 0),
        totalMinutes: focusTotal[0]?.minutes || 0,
        sessions: focusTotal[0]?.sessions || 0,
      },
      last7,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  clearTasks,
  getStats,
};
