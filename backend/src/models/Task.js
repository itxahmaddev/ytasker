const mongoose = require('mongoose');

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 5000 },
    status: { type: String, enum: STATUSES, default: 'pending' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    // Date-only value, stored as UTC midnight of the chosen calendar day.
    dueDate: { type: Date, default: null },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 24 }], default: [] },
    subtasks: { type: [subtaskSchema], default: [] },
    // Sort key within a board column. Fractional so a card can be dropped
    // between two others without renumbering the whole column.
    order: { type: Number, default: () => Date.now() },
    completedAt: { type: Date, default: null },
    focusMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, completedAt: 1 });

// Keep completedAt consistent with status no matter which code path saves.
taskSchema.pre('save', function syncCompletedAt(next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'completed' ? new Date() : null;
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
Task.STATUSES = STATUSES;
Task.PRIORITIES = PRIORITIES;

module.exports = Task;
