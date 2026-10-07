const HttpError = require('../utils/httpError');

const THEMES = ['light', 'dark', 'system'];
const VIEWS = ['list', 'board'];

function intInRange(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, `${name} must be a whole number between ${min} and ${max}`);
  }
  return value;
}

async function getSettings(req, res) {
  res.json(req.user.toPublicJSON().settings);
}

async function updateSettings(req, res, next) {
  try {
    const { theme, notifications, defaultView, focusLength, breakLength } = req.body;
    const s = req.user.settings;

    if (theme !== undefined) {
      if (!THEMES.includes(theme)) throw new HttpError(400, 'theme must be light, dark or system');
      s.theme = theme;
    }
    if (notifications !== undefined) {
      if (typeof notifications !== 'boolean') {
        throw new HttpError(400, 'notifications must be a boolean');
      }
      s.notifications = notifications;
    }
    if (defaultView !== undefined) {
      if (!VIEWS.includes(defaultView)) throw new HttpError(400, 'defaultView must be list or board');
      s.defaultView = defaultView;
    }
    if (focusLength !== undefined) s.focusLength = intInRange(focusLength, 5, 90, 'focusLength');
    if (breakLength !== undefined) s.breakLength = intInRange(breakLength, 1, 30, 'breakLength');

    await req.user.save();
    res.json(req.user.toPublicJSON().settings);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
