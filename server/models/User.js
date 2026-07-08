import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  university: { type: String, default: '' },
  course: { type: String, default: '' },
  avatar: { type: String, default: null },
  customSubjects: { type: [String], default: ['Computer Science', 'Mathematics', 'Physics', 'History', 'Literature'] },
  credits: { type: Number, default: 5 },
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User;
