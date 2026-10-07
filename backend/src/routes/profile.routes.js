const express = require('express');
const protect = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require('../controllers/profile.controller');

const router = express.Router();

router.use(protect);
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.delete('/', deleteAccount);

module.exports = router;
