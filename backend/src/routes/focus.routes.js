const express = require('express');
const protect = require('../middleware/auth.middleware');
const { logSession } = require('../controllers/focus.controller');

const router = express.Router();

router.use(protect);
router.post('/', logSession);

module.exports = router;
