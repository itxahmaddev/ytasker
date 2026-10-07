const mongoose = require('mongoose');

// One completed focus (pomodoro) block. Kept as its own collection so the
// dashboard can chart focus time per day without touching task documents.
const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    minutes: { type: Number, required: true, min: 1, max: 240 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

focusSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);
