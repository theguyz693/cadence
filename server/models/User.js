import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 30,
  },
  // Optional for Google accounts, which sign in without a Cadence password.
  password: {
    type: String,
    required: function requirePassword() { return !this.googleId; },
    minlength: 4,
  },
  googleId: { type: String, index: { unique: true, sparse: true } },
  email: { type: String, lowercase: true, trim: true, index: { unique: true, sparse: true } },
  name: { type: String, trim: true, maxlength: 80 },
  picture: { type: String },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
