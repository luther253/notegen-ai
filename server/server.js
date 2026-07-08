import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

// Models & Middleware
import User from './models/User.js';
import Note from './models/Note.js';
import QuizAttempt from './models/QuizAttempt.js';
import { protect } from './middleware/authMiddleware.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notegen';
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS — supports comma-separated list of origins for multi-env support
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Configure Multer for PDF file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Helper to clean and parse JSON from AI responses
const parseJSONResponse = (text) => {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Failed to parse AI JSON response:', err, text);
    throw new Error('AI response was not in the expected format.');
  }
};

// Main Note Generation logic (using Gemini or OpenAI API)
async function generateContent({
  prompt,
  jsonPrompt,
  apiKey,
  apiProvider,
  isJson = false
}) {
  const provider = apiProvider || 'gemini';
  const key = apiKey || (provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY);

  if (!key) {
    throw new Error(`No API key provided. Please configure a server-side ${provider.toUpperCase()}_API_KEY or provide a client-side API Key in Settings.`);
  }

  const activePrompt = isJson ? jsonPrompt : prompt;

  if (provider === 'openai') {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an elite academic tutor.' },
          { role: 'user', content: activePrompt },
        ],
        response_format: isJson ? { type: 'json_object' } : undefined,
        temperature: isJson ? 0.4 : 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
      }
    );
    const content = response.data.choices[0].message.content;
    return isJson ? parseJSONResponse(content) : content;
  } else {
    // Google Gemini API
    if (isJson) {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: activePrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const content = response.data.candidates[0].content.parts[0].text;
      return parseJSONResponse(content);
    } else {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: activePrompt }] }]
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data.candidates[0].content.parts[0].text;
    }
  }
}

// Generate Flashcards helper
async function generateFlashcards(noteContent, apiKey, apiProvider) {
  const wordCount = noteContent.split(/\s+/).filter(Boolean).length;
  let numCards = 5;
  if (wordCount > 1600) numCards = 12;
  else if (wordCount > 800) numCards = 8;

  const jsonPrompt = `Read the following student notes and convert them into a set of exactly ${numCards} flashcards for review.
Return ONLY a valid JSON object. Do NOT wrap the JSON in Markdown code block backticks, just output raw JSON text.
The JSON object must match this schema EXACTLY:
{
  "flashcards": [
    {
      "front": "A clear, concise question or prompt on the front of the card",
      "back": "A precise, accurate definition or answer on the back of the card"
    }
  ]
}

Here are the notes:
${noteContent}`;

  try {
    return await generateContent({ jsonPrompt, apiKey, apiProvider, isJson: true });
  } catch (error) {
    console.error('Failed to generate AI Flashcards, using fallback:', error.message);
    return [
      { front: 'Note Summary Card', back: 'Refer to the main notes to review key definitions and examples.' },
      { front: 'Study Practice', back: 'Formulate your own active recall questions based on this study text.' },
      { front: 'Revision Checklist', back: 'Examine definitions, advantages, disadvantages, and exam tips in detail.' }
    ];
  }
}

// Generate Quiz helper
async function generateQuiz(noteContent, apiKey, apiProvider) {
  const wordCount = noteContent.split(/\s+/).filter(Boolean).length;
  let numQuestions = 4;
  if (wordCount > 1600) numQuestions = 10;
  else if (wordCount > 800) numQuestions = 6;

  const jsonPrompt = `Read the following student notes and generate a quiz containing exactly ${numQuestions} questions.
The quiz should include multiple-choice questions (mcq), true/false questions (tf), and short answer questions (short).
Return ONLY a valid JSON object. Do NOT wrap the JSON in Markdown code block backticks, just output raw JSON text.
The JSON object must match this schema EXACTLY:
{
  "quiz": [
    {
      "type": "mcq",
      "question": "The question string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option B" 
    },
    {
      "type": "tf",
      "question": "The true or false question statement",
      "answer": "True" 
    },
    {
      "type": "short",
      "question": "The short answer question prompt",
      "answer": "The expected keywords or sentence answer"
    }
  ]
}

Here are the notes:
${noteContent}`;

  try {
    return await generateContent({ jsonPrompt, apiKey, apiProvider, isJson: true });
  } catch (error) {
    console.error('Failed to generate AI Quiz, using fallback:', error.message);
    return [
      {
        type: 'tf',
        question: 'Photosynthesis occurs in chloroplasts.',
        answer: 'True'
      },
      {
        type: 'mcq',
        question: 'Which tree traversal visits the nodes in sorted ascending order?',
        options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
        answer: 'In-order'
      }
    ];
  }
}

// ENDPOINTS

// Rate limiter for auth endpoints (20 requests per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// HELPER: Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// GET Configuration settings for client
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    hasOpenAiKey: !!process.env.OPENAI_API_KEY
  });
});

// GET All Registered Google Accounts for Mock Chooser (protected)
app.get('/api/google-accounts', protect, async (req, res) => {
  try {
    const users = await User.find({}, 'username email avatar');
    const formatted = users.map(user => ({
      name: user.username,
      email: user.email,
      avatar: user.avatar || null,
      initial: user.username ? user.username.charAt(0).toUpperCase() : 'U'
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch google accounts:', err);
    res.status(500).json({ error: 'Failed to fetch registered Google accounts.' });
  }
});

// Auth - Google OAuth Login (no password required, Google already verified identity)
app.post('/api/auth/google-login', authLimiter, async (req, res) => {
  const { email, name, avatar } = req.body;

  try {
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required for Google login.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User already exists - update their name and avatar if provided, then log them in
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        await user.save();
      }
    } else {
      // New Google user - create an account without a real password (set a random secure one)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        username: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        avatar: avatar || null,
      });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      university: user.university,
      course: user.course,
      avatar: user.avatar,
      customSubjects: user.customSubjects,
      credits: user.credits,
      isPremium: user.isPremium,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google login failed:', error);
    res.status(500).json({ error: 'Google login failed, please try again.' });
  }
});

// Auth - User Registration
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { username, email, password, avatar } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email, and password.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || null,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      university: user.university,
      course: user.course,
      avatar: user.avatar,
      customSubjects: user.customSubjects,
      credits: user.credits,
      isPremium: user.isPremium,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Registration failed, please try again.' });
  }
});

// Auth - User Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      university: user.university,
      course: user.course,
      avatar: user.avatar,
      customSubjects: user.customSubjects,
      credits: user.credits,
      isPremium: user.isPremium,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed, please try again.' });
  }
});

// Auth - Update User Profile
app.put('/api/auth/profile', protect, async (req, res) => {
  const { username, university, course, avatar, customSubjects } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (username !== undefined) user.username = username;
    if (university !== undefined) user.university = university;
    if (course !== undefined) user.course = course;
    if (avatar !== undefined) user.avatar = avatar;
    if (customSubjects !== undefined) user.customSubjects = customSubjects;

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      university: user.university,
      course: user.course,
      avatar: user.avatar,
      customSubjects: user.customSubjects,
      credits: user.credits,
      isPremium: user.isPremium,
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({ error: 'Profile update failed, please try again.' });
  }
});

// Auth - Upgrade User (Simulated Stripe Upgrade)
app.post('/api/auth/upgrade', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.isPremium = true;
    user.credits = 9999;
    await user.save();

    res.json({
      message: 'Upgrade successful! Welcome to Premium.',
      credits: user.credits,
      isPremium: user.isPremium
    });
  } catch (error) {
    console.error('Upgrade failed:', error);
    res.status(500).json({ error: 'Upgrade failed, please try again.' });
  }
});

// AI Chat with Note — answer questions about a given note's content
app.post('/api/chat-with-note', protect, async (req, res) => {
  const { noteContent, question } = req.body;

  if (!noteContent || !question) {
    return res.status(400).json({ error: 'noteContent and question are required.' });
  }

  try {
    const prompt = `You are a helpful AI study assistant. A student is reviewing the following study note and has a question about it.
Answer clearly, concisely, and in an academic tone. If the answer is not covered in the note, say so honestly.

--- NOTE CONTENT START ---
${noteContent.substring(0, 6000)}
--- NOTE CONTENT END ---

Student question: ${question}`;

    const answer = await generateContent({ prompt, apiProvider: 'gemini', isJson: false });
    res.json({ answer });
  } catch (error) {
    console.error('Chat-with-note failed:', error.message);
    res.status(500).json({ error: 'AI chat failed. Please check your server API key configuration.' });
  }
});

// 1. Generate Notes from text topic parameters
app.post('/api/generate', protect, async (req, res) => {
  const {
    subject,
    topic,
    difficulty,
    length,
    style,
    language,
    extra,
    apiKey,
    apiProvider
  } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic/Keyword is required.' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (!user.isPremium && user.credits <= 0) {
      return res.status(403).json({ error: 'OUT_OF_CREDITS', message: 'You have run out of free notes credits. Please upgrade to Premium.' });
    }

    const prompt = `You are a professional academic AI Notes Generator.
Generate high-quality, comprehensive, and clear student study notes for:
Subject: ${subject || 'General'}
Topic: ${topic}
Difficulty: ${difficulty || 'Intermediate'}
Note Length: ${length || 'Medium'}
Output Style: ${style || 'Bullet Points'}
Language: ${language || 'English'}
${extra ? `Additional Instructions: ${extra}` : ''}

Make sure the output satisfies these structure requirements:
- Return a title as the first heading.
- Output MUST be structured in clean Markdown.
- Use headers (#, ##, ###), bullet points, bold text for key phrases, and blockquotes for highlights.
- Include the following sections explicitly in Markdown:
  1. Title
  2. Introduction (Briefly explain the topic context)
  3. Key Concepts (Definitions or bullet points of core terms)
  4. Detailed Explanation (Deep-dive, formula writeups using math notation if applicable, or code blocks if programming/technical)
  5. Examples (Clear practical walkthroughs or coding snippets)
  6. Important Definitions (Highlighted using Markdown blockquotes or alert format)
  7. Advantages & Disadvantages (Comparison list or table)
  8. Real-world Applications (How is this concept applied in technology, nature, or industry?)
  9. Exam Tips & Common Mistakes (A section warning students of typical traps on tests, highlighted with warning blocks)
  10. Summary (A final concise bulleted revision recap)

Make the explanation clear, highly professional, and easy to study. Write everything in the requested language: ${language || 'English'}.`;

    const noteContent = await generateContent({ prompt, apiKey, apiProvider, isJson: false });
    const flashcardsData = await generateFlashcards(noteContent, apiKey, apiProvider);
    const quizData = await generateQuiz(noteContent, apiKey, apiProvider);

    if (!user.isPremium) {
      user.credits = Math.max(0, user.credits - 1);
      await user.save();
    }

    res.json({
      title: `${topic} (${subject || 'General'})`,
      content: noteContent,
      flashcards: flashcardsData.flashcards || flashcardsData,
      quiz: quizData.quiz || quizData,
      creditsRemaining: user.credits
    });
  } catch (error) {
    console.error('Error generating notes:', error);
    res.status(500).json({ error: error.message || 'Notes generation failed.' });
  }
});

function generateMockPDFNote(pdfText, filename, subject, difficulty) {
  // Clean text and split into lines/paragraphs
  const lines = pdfText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 20);

  const title = filename.replace(/\.[^/.]+$/, "");
  const introduction = lines.slice(0, 3).join(' ') || `This guide is based on the uploaded document: ${title}.`;
  
  // Extract key terms (lines with colons or short bullet-like lines)
  const keyTerms = lines.filter(l => l.includes(':') && l.length < 150).slice(0, 4);
  const keyConceptsMD = keyTerms.map(term => {
    const parts = term.split(':');
    return `* **${parts[0].trim()}**: ${parts.slice(1).join(':').trim()}`;
  }).join('\n') || `* **Document Source**: Analyzed content from ${title}.\n* **Subject Area**: Evaluated under ${subject || 'General Studies'}.`;

  const detailedExplanation = lines.slice(3, 15).join('\n\n') || `The uploaded document contains references to ${title}. Please configure a Gemini API key in Settings to receive a full AI-synthesized deep-dive analysis of all concepts.`;

  const content = `# Study Guide: ${title} 📄 (Parsed PDF)

This note has been parsed from the uploaded PDF study material.

> [!NOTE]
> **Mock Parsing Mode**: To get a fully structured, AI-synthesized study guide, quizzes, and flashcards from this PDF using Google Gemini, please configure your **Gemini API Key** in the **Settings** page!

## Introduction 🌟
${introduction}

## Key Concepts 💡
${keyConceptsMD}

## Detailed Content from PDF 🔍
${detailedExplanation}

## Summary
This document outlines key terms and concepts related to ${title}. To study this in depth, configure your Gemini API Key in Settings to generate a complete revision guide.`;

  // Build some cards dynamically from extracted lines
  const flashcards = lines.slice(0, 6).map((l, i) => {
    const truncated = l.length > 100 ? l.substring(0, 100) + '...' : l;
    return {
      front: `Key Point ${i + 1} from PDF`,
      back: truncated
    };
  });

  const quiz = [
    {
      type: 'tf',
      question: `This study guide was extracted from the document titled "${title}".`,
      answer: 'True'
    },
    {
      type: 'mcq',
      question: 'To get a fully structured, AI-synthesized note from this PDF, what is required?',
      options: ['A Gemini API Key in Settings', 'A paid subscription', 'No action is needed', 'Printing to PDF first'],
      answer: 'A Gemini API Key in Settings'
    }
  ];

  return {
    title: `${title} (${subject || 'PDF'})`,
    content,
    flashcards,
    quiz
  };
}

// 2. Generate Notes from an uploaded PDF file
app.post('/api/generate-pdf', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a PDF file.' });
  }

  const {
    subject,
    difficulty,
    length,
    style,
    language,
    extra,
    apiKey,
    apiProvider
  } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (!user.isPremium && user.credits <= 0) {
      return res.status(403).json({ error: 'OUT_OF_CREDITS', message: 'You have run out of free notes credits. Please upgrade to Premium.' });
    }

    // Extract text content from the uploaded PDF
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length < 50) {
      return res.status(400).json({ error: 'Failed to extract text from the PDF. The file may be empty or image-only scanned without OCR.' });
    }

    // Check if API key is provided, if not fallback to parsing mock data
    const provider = apiProvider || 'gemini';
    const key = apiKey || (provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY);
    if (!key) {
      console.log('No API key provided. Returning dynamic mock parsed notes from PDF.');
      const mockNote = generateMockPDFNote(pdfText, req.file.originalname, subject, difficulty);
      
      if (!user.isPremium) {
        user.credits = Math.max(0, user.credits - 1);
        await user.save();
      }
      return res.json({
        ...mockNote,
        creditsRemaining: user.credits
      });
    }

    // Truncate text if it is exceptionally long to avoid API rate/token limitations
    const maxChars = 24000;
    const truncatedText = pdfText.length > maxChars 
      ? pdfText.substring(0, maxChars) + "\n[Text truncated due to length limits]"
      : pdfText;

    // Build the prompt using the parsed text
    const prompt = `You are a professional academic AI Notes Generator.
Read the following student revision material/text extracted from a PDF document, and generate high-quality, comprehensive, and structured study notes based on it.

Extracted PDF Material:
"""
${truncatedText}
"""

Generate study notes with the following parameters:
Subject: ${subject || 'General'}
Difficulty Level: ${difficulty || 'Intermediate'}
Note Length: ${length || 'Medium'}
Output Style: ${style || 'Bullet Points'}
Language: ${language || 'English'}
${extra ? `Additional Instructions: ${extra}` : ''}

Make sure the output satisfies these structure requirements:
- Return a title as the first heading.
- Output MUST be structured in clean Markdown.
- Use headers (#, ##, ###), bullet points, bold text for key phrases, and blockquotes for highlights.
- Include the following sections explicitly in Markdown:
  1. Title
  2. Introduction (Briefly explain the topic context and source PDF overview)
  3. Key Concepts (Definitions or bullet points of core terms from the PDF)
  4. Detailed Explanation (Deep-dive, formula writeups using math notation if applicable, or code blocks if programming/technical)
  5. Examples (Clear practical walkthroughs or coding snippets found in the PDF or related)
  6. Important Definitions (Highlighted using Markdown blockquotes or alert format)
  7. Advantages & Disadvantages (Comparison list or table)
  8. Real-world Applications (How is this concept applied in technology, nature, or industry?)
  9. Exam Tips & Common Mistakes (A section warning students of typical traps on tests, highlighted with warning blocks)
  10. Summary (A final concise bulleted revision recap)

Make the explanation clear, highly professional, and easy to study. Write everything in the requested language: ${language || 'English'}.`;

    const noteContent = await generateContent({ prompt, apiKey, apiProvider, isJson: false });
    const flashcardsData = await generateFlashcards(noteContent, apiKey, apiProvider);
    const quizData = await generateQuiz(noteContent, apiKey, apiProvider);

    // Extract a title from the PDF or content
    const firstLine = pdfData.info?.Title || 'Extracted PDF Note';

    if (!user.isPremium) {
      user.credits = Math.max(0, user.credits - 1);
      await user.save();
    }

    res.json({
      title: firstLine.length < 50 ? `${firstLine} (${subject || 'PDF'})` : `Study Notes (${subject || 'PDF'})`,
      content: noteContent,
      flashcards: flashcardsData.flashcards || flashcardsData,
      quiz: quizData.quiz || quizData,
      creditsRemaining: user.credits
    });
  } catch (error) {
    console.error('Error generating notes from PDF:', error);
    res.status(500).json({ error: error.message || 'PDF Note generation failed.' });
  }
});

// Function to retrieve Google profiles from local Chrome/Edge data
function getLocalGoogleAccounts() {
  const accounts = [];
  const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '');
  
  if (!localAppData) return accounts;

  const browsers = [
    {
      name: 'Chrome',
      path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Local State'),
    },
    {
      name: 'Edge',
      path: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Local State'),
    }
  ];

  const seenEmails = new Set();

  for (const b of browsers) {
    if (fs.existsSync(b.path)) {
      try {
        const content = fs.readFileSync(b.path, 'utf8');
        const json = JSON.parse(content);
        const profiles = json.profile?.info_cache || {};
        
        for (const key in profiles) {
          const p = profiles[key];
          if (p.user_name && p.user_name.includes('@')) {
            const email = p.user_name.trim().toLowerCase();
            if (!seenEmails.has(email)) {
              seenEmails.add(email);
              const initial = (p.name || email).charAt(0).toUpperCase();
              
              // Generate a stable color based on email string
              const colors = [
                'bg-violet-600',
                'bg-emerald-600',
                'bg-blue-600',
                'bg-[#FBBC05]',
                'bg-[#EA4335]',
                'bg-indigo-600'
              ];
              const colorIdx = Math.abs(email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
              
              const picSubPath = b.name === 'Chrome' 
                ? path.join('Google', 'Chrome', 'User Data', key, 'Google Profile Picture.png')
                : path.join('Microsoft', 'Edge', 'User Data', key, 'Google Profile Picture.png');
              const hasAvatar = fs.existsSync(path.join(localAppData, picSubPath));

              accounts.push({
                name: p.gaia_name || p.name || email.split('@')[0],
                email: p.user_name,
                avatarColor: colors[colorIdx],
                initial: initial,
                avatar: hasAvatar ? `/api/google-accounts/avatar?profile=${key}&browser=${b.name}` : null,
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error reading ${b.name} state:`, err.message);
      }
    }
  }

  return accounts;
}

// Endpoint to pipe the active Google Profile avatar picture
app.get('/api/google-accounts/avatar', (req, res) => {
  const { profile, browser } = req.query;
  if (!profile || typeof profile !== 'string' || !/^(Default|Profile \d+)$/.test(profile)) {
    return res.status(400).send('Invalid profile name');
  }

  const browserName = browser === 'Edge' ? 'Edge' : 'Chrome';
  const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '');
  if (!localAppData) {
    return res.status(404).send('LocalAppData not found');
  }

  const picSubPath = browserName === 'Edge'
    ? path.join('Microsoft', 'Edge', 'User Data', profile, 'Google Profile Picture.png')
    : path.join('Google', 'Chrome', 'User Data', profile, 'Google Profile Picture.png');

  const picPath = path.join(localAppData, picSubPath);
  if (fs.existsSync(picPath)) {
    res.setHeader('Content-Type', 'image/png');
    fs.createReadStream(picPath).pipe(res);
  } else {
    res.status(404).send('Profile picture not found');
  }
});

// Endpoint to retrieve active Google accounts
app.get('/api/google-accounts', (req, res) => {
  try {
    const localAccounts = getLocalGoogleAccounts();
    res.json(localAccounts);
  } catch (error) {
    console.error('Failed to retrieve local Google accounts:', error);
    res.json([]);
  }
});

// Notes - Get All Notes
app.get('/api/notes', protect, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Fetch notes failed:', error);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

// Notes - Save / Create Note
app.post('/api/notes', protect, async (req, res) => {
  const {
    title,
    subject,
    topic,
    difficulty,
    length,
    style,
    language,
    content,
    isFavorite,
    wordCount,
    readingTime,
    flashcards,
    quiz
  } = req.body;

  try {
    const note = await Note.create({
      userId: req.userId,
      title,
      subject,
      topic,
      difficulty,
      length,
      style,
      language,
      content,
      isFavorite,
      wordCount,
      readingTime,
      flashcards,
      quiz
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Save note failed:', error);
    res.status(500).json({ error: 'Failed to save note.' });
  }
});

// Notes - Update Note
app.put('/api/notes/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const fieldsToUpdate = [
      'title', 'subject', 'topic', 'difficulty', 'length',
      'style', 'language', 'content', 'isFavorite', 'wordCount',
      'readingTime', 'flashcards', 'quiz'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        note[field] = req.body[field];
      }
    });

    note.updatedAt = Date.now();
    await note.save();

    res.json(note);
  } catch (error) {
    console.error('Update note failed:', error);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// Notes - Delete Note
app.delete('/api/notes/:id', protect, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('Delete note failed:', error);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

// Quizzes - Get All Quiz Attempts
app.get('/api/quizzes', protect, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.userId }).sort({ takenAt: -1 });
    res.json(attempts);
  } catch (error) {
    console.error('Fetch quiz attempts failed:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempts.' });
  }
});

// Quizzes - Save Quiz Attempt
app.post('/api/quizzes', protect, async (req, res) => {
  const { noteId, title, score, maxScore } = req.body;

  try {
    if (!noteId || !title || score === undefined || maxScore === undefined) {
      return res.status(400).json({ error: 'Please provide all quiz attempt details.' });
    }

    const attempt = await QuizAttempt.create({
      userId: req.userId,
      noteId,
      title,
      score,
      maxScore,
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Save quiz attempt failed:', error);
    res.status(500).json({ error: 'Failed to save quiz attempt.' });
  }
});

// Port check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    openaiKeyConfigured: !!process.env.OPENAI_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Nodemon trigger reload v4
