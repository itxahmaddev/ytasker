const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const HttpError = require('../utils/httpError');

// POST /api/focus { minutes, taskId? } — log a finished focus block.
async function logSession(req, res, next) {
  try {
    const minutes = Math.round(Number(req.body.minutes));
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
      throw new HttpError(400, 'minutes must be between 1 and 240');
    }

    let taskId = null;
    if (req.body.taskId) {
      const task = await Task.findOneAndUpdate(
        { _id: req.body.taskId, userId: req.user._id },
        { $inc: { focusMinutes: minutes } },
        { new: true }
      );
      if (!task) throw new HttpError(404, 'Task not found');
      taskId = task._id;
    }

    const session = await FocusSession.create({ userId: req.user._id, taskId, minutes });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

module.exports = { logSession };
