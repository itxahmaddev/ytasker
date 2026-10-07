const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const settingsRoutes = require('./routes/settings.routes');
const taskRoutes = require('./routes/task.routes');
const focusRoutes = require('./routes/focus.routes');

const app = express();

// Behind an ALB / CloudFront the client IP arrives in X-Forwarded-For; without
// this the rate limiter would see every request as coming from the proxy.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : '*',
  })
);
app.use(express.json({ limit: '100kb' }));

// Used by the EC2 / ALB health check.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'ytasker', uptime: process.uptime() });
});

// Slow down credential stuffing on the auth endpoints only.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in a few minutes' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/focus', focusRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
