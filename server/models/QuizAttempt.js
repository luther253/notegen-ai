import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  noteId: { type: String, required: true }, // Store as string to handle initial mock notes/IDs gracefully
  title: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  takenAt: { type: Date, default: Date.now }
});

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
