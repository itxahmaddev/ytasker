const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const User = require('../models/User');
const HttpError = require('../utils/httpError');

async function getProfile(req, res) {
  res.json(req.user.toPublicJSON());
}

async function updateProfile(req, res, next) {
  try {
    const { name, avatar } = req.body;
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) throw new HttpError(400, 'name cannot be empty');
      req.user.name = trimmed;
    }
    if (avatar !== undefined) {
      const url = String(avatar).trim();
      // Avatars are rendered in <img src>; only allow http(s) URLs.
      if (url && !/^https?:\/\//i.test(url)) {
        throw new HttpError(400, 'avatar must be an http(s) URL');
      }
      req.user.avatar = url;
    }
    await req.user.save();
    res.json(req.user.toPublicJSON());
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new HttpError(400, 'currentPassword and newPassword are required');
    }
    if (newPassword.length < 8) {
      throw new HttpError(400, 'New password must be at least 8 characters');
    }
    if (!(await req.user.comparePassword(currentPassword))) {
      throw new HttpError(401, 'Current password is incorrect');
    }

    req.user.password = newPassword;
    await req.user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/profile { password } — permanently remove the account and its data.
async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) throw new HttpError(400, 'password is required');
    if (!(await req.user.comparePassword(password))) {
      throw new HttpError(401, 'Password is incorrect');
    }

    await Promise.all([
      Task.deleteMany({ userId: req.user._id }),
      FocusSession.deleteMany({ userId: req.user._id }),
    ]);
    await User.deleteOne({ _id: req.user._id });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
