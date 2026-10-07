require('dotenv').config();

// 🔧 Fix: Node.js v24 Windows DNS SRV bug
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const app = require('./app');
const connectDB = require('./config/db');

const PLACEHOLDER_SECRET = 'replace-me-with-a-long-random-string';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === PLACEHOLDER_SECRET) {
  console.error('Refusing to start in production with the placeholder JWT_SECRET');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Ytasker API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
