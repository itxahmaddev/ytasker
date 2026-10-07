const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: '', maxlength: 500 },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      notifications: { type: Boolean, default: true },
      defaultView: { type: String, enum: ['list', 'board'], default: 'list' },
      focusLength: { type: Number, default: 25, min: 5, max: 90 },
      breakLength: { type: Number, default: 5, min: 1, max: 30 },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  const s = this.settings || {};
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    settings: {
      theme: s.theme || 'system',
      notifications: s.notifications ?? true,
      defaultView: s.defaultView || 'list',
      focusLength: s.focusLength || 25,
      breakLength: s.breakLength || 5,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
