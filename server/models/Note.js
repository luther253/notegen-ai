import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, default: 'Intermediate' },
  length: { type: String, default: 'Medium' },
  style: { type: String, default: 'Bullet Points' },
  language: { type: String, default: 'English' },
  content: { type: String, required: true },
  isFavorite: { type: Boolean, default: false },
  wordCount: { type: Number, default: 0 },
  readingTime: { type: Number, default: 0 },
  flashcards: { type: Array, default: [] },
  quiz: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Note = mongoose.model('Note', noteSchema);
export default Note;
