const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HttpError = require('../utils/httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new HttpError(400, 'name, email and password are required');
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      throw new HttpError(400, 'Enter a valid email address');
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw new HttpError(400, 'Password must be at least 8 characters');
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) throw new HttpError(409, 'Email already registered');

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user), user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw new HttpError(400, 'email and password are required');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, 'Invalid credentials');
    }

    res.json({ token: signToken(user), user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// Stateless JWT: the client discards the token. Endpoint exists for symmetry.
function logout(req, res) {
  res.json({ message: 'Logged out' });
}

module.exports = { signup, login, logout };
