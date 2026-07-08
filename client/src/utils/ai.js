import axios from 'axios';
import { generateMockNote } from './mockData';

// Clean Axios instance for direct external API requests (no global Authorization headers)
const externalApi = axios.create();
delete externalApi.defaults.headers.common['Authorization'];

// Helper to clean and extract JSON from AI response text
const parseJSONResponse = (text) => {
  try {
    // If the response is wrapped in ```json ... ```, strip it
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const cleanText = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Failed to parse AI JSON response:', err, text);
    throw new Error('AI response was not in the expected format. Please try again.');
  }
};

export const generateAINotes = async (params) => {
  const { subject, topic, difficulty, length, style, language, extra, file } = params;
  
  // Retrieve settings
  const apiProvider = localStorage.getItem('notes_api_provider') || 'gemini';
  const apiKey = localStorage.getItem('notes_api_key');

  // 1. Try to use backend server
  try {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (subject) formData.append('subject', subject);
      if (difficulty) formData.append('difficulty', difficulty);
      if (length) formData.append('length', length);
      if (style) formData.append('style', style);
      if (language) formData.append('language', language);
      if (extra) formData.append('extra', extra);
      if (apiKey) formData.append('apiKey', apiKey);
      if (apiProvider) formData.append('apiProvider', apiProvider);

      const response = await axios.post('/api/generate-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } else {
      const response = await axios.post('/api/generate', {
        subject,
        topic,
        difficulty,
        length,
        style,
        language,
        extra,
        apiKey,
        apiProvider
      });
      return response.data;
    }
  } catch (serverError) {
    console.warn('Backend generation failed or offline. Checking client-side credentials:', serverError.message);
    


    // Fallback to Mock Data if no client API key is provided
    if (!apiKey) {
      if (file) {
        throw new Error('PDF Note Generation is only supported when the backend server is online and configured.');
      }
      console.warn('No client API key. Using high-quality local mock generator.');
      // Simulating delay for realistic UI/UX
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return generateMockNote(subject, topic, difficulty, length, style, language, extra);
    }

    if (file) {
      throw new Error('PDF Note Generation is only supported via the backend server.');
    }
  }

  const prompt = `You are a professional academic AI Notes Generator.
Generate high-quality, comprehensive, and clear student study notes for:
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Note Length: ${length}
Output Style: ${style}
Language: ${language}
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

Make the explanation clear, highly professional, and easy to study. Write everything in the requested language: ${language}.`;

  if (apiProvider === 'openai') {
    try {
      const response = await externalApi.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an elite academic tutor.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      
      const contentText = response.data.choices[0].message.content;
      // We will generate quizzes and flashcards locally or through a separate call.
      // To save token usage and ensure fast responses, we will generate flashcards and quizzes dynamically from this content!
      const flashcards = await generateAIFlashcards(contentText, apiKey, apiProvider);
      const quiz = await generateAIQuiz(contentText, apiKey, apiProvider);

      return {
        title: `${topic} (${subject})`,
        content: contentText,
        flashcards,
        quiz
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`OpenAI Error: ${msg}`);
    }
  } else {
    // Default Gemini API
    try {
      const response = await externalApi.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const contentText = response.data.candidates[0].content.parts[0].text;
      const flashcards = await generateAIFlashcards(contentText, apiKey, 'gemini');
      const quiz = await generateAIQuiz(contentText, apiKey, 'gemini');

      return {
        title: `${topic} (${subject})`,
        content: contentText,
        flashcards,
        quiz
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`Gemini Error: ${msg}`);
    }
  }
};

export const generateAIFlashcards = async (noteContent, apiKey, apiProvider) => {
  const wordCount = noteContent.split(/\s+/).filter(Boolean).length;
  let numCards = 5;
  if (wordCount > 1600) numCards = 12;
  else if (wordCount > 800) numCards = 8;

  if (!apiKey) {
    return [
      { front: 'Note Summary Card', back: 'Refer to the main notes to review key definitions and examples.' },
      { front: 'Study Practice', back: 'Formulate your own active recall questions based on this study text.' },
      { front: 'Revision Checklist', back: 'Examine definitions, advantages, disadvantages, and exam tips in detail.' }
    ];
  }

  const prompt = `Read the following student notes and convert them into a set of exactly ${numCards} flashcards for review.
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
    if (apiProvider === 'openai') {
      const response = await externalApi.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const data = parseJSONResponse(response.data.choices[0].message.content);
      return data.flashcards || [];
    } else {
      const response = await externalApi.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = parseJSONResponse(response.data.candidates[0].content.parts[0].text);
      return data.flashcards || [];
    }
  } catch (error) {
    console.error('AI Flashcard Generation Error, returning mock flashcards:', error);
    // Fallback flashcards instead of failing completely
    return [
      { front: 'Note Summary Card', back: 'Refer to the main notes to review key definitions and examples.' },
      { front: 'Study Practice', back: 'Formulate your own active recall questions based on this study text.' },
      { front: 'Revision Checklist', back: 'Examine definitions, advantages, disadvantages, and exam tips in detail.' }
    ];
  }
};

export const generateAIQuiz = async (noteContent, apiKey, apiProvider) => {
  const wordCount = noteContent.split(/\s+/).filter(Boolean).length;
  let numQuestions = 4;
  if (wordCount > 1600) numQuestions = 10;
  else if (wordCount > 800) numQuestions = 6;

  if (!apiKey) {
    return [];
  }

  const prompt = `Read the following student notes and generate a quiz containing exactly ${numQuestions} questions.
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
    if (apiProvider === 'openai') {
      const response = await externalApi.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const data = parseJSONResponse(response.data.choices[0].message.content);
      return data.quiz || [];
    } else {
      const response = await externalApi.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const data = parseJSONResponse(response.data.candidates[0].content.parts[0].text);
      return data.quiz || [];
    }
  } catch (error) {
    console.error('AI Quiz Generation Error, returning mock quiz:', error);
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
};
