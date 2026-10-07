const express = require('express');
const protect = require('../middleware/auth.middleware');
const { getSettings, updateSettings } = require('../controllers/settings.controller');

const router = express.Router();

router.use(protect);
router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
