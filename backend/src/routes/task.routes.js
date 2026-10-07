const express = require('express');
const protect = require('../middleware/auth.middleware');
const {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  clearTasks,
  getStats,
} = require('../controllers/task.controller');

const router = express.Router();

router.use(protect);
router.get('/stats', getStats); // must be registered before '/:id'
router.post('/', createTask);
router.get('/', listTasks);
router.delete('/', clearTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
