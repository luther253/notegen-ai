import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiX, FiTrash2, FiCopy, FiCheck, FiMessageSquare, FiZap } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import axios from 'axios';

const SYSTEM_PROMPT = (noteContent) =>
  `You are a helpful AI study assistant. A student is reviewing their study note shown below. 
Answer their questions clearly, concisely, and helpfully, referencing the note content where relevant.
Keep answers focused and academic in tone. If something is not covered in the note, say so honestly.

--- NOTE CONTENT START ---
${noteContent}
--- NOTE CONTENT END ---`;

// Clean Axios instance for direct external API requests (no global Authorization headers)
const externalApi = axios.create();
// Ensure the Authorization header is removed from the new instance
delete externalApi.defaults.headers.common['Authorization'];

async function askAI(noteContent, question, apiKey, apiProvider) {
  const provider = apiProvider || 'gemini';

  if (!apiKey) {
    // Use server endpoint as fallback (this needs the global Authorization header, so use the default axios instance)
    const res = await axios.post('/api/chat-with-note', { noteContent, question });
    return res.data.answer;
  }

  if (provider === 'openai') {
    const res = await externalApi.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT(noteContent) },
          { role: 'user', content: question },
        ],
        temperature: 0.5,
        max_tokens: 600,
      },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
    return res.data.choices[0].message.content;
  } else {
    // Gemini (direct browser request without any Authorization header)
    const res = await externalApi.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          { parts: [{ text: SYSTEM_PROMPT(noteContent) + '\n\nStudent question: ' + question }] }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.data.candidates[0].content.parts[0].text;
  }
}

function ChatMessage({ msg }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold ${
        isUser
          ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
          : 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 text-emerald-400'
      }`}>
        {isUser ? 'U' : <HiSparkles />}
      </div>

      {/* Bubble */}
      <div className={`group relative max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
          isUser
            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-md'
            : 'bg-white/5 border border-white/[0.08] text-gray-200 rounded-tl-md'
        }`}>
          {msg.text}
        </div>
        {!isUser && (
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 px-1 cursor-pointer"
          >
            {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function NoteChat({ note, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      text: `Hi! I've read your note on "${note?.title || 'this topic'}". Ask me anything about it — key concepts, explanations, exam tips, or anything else!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const apiKey = localStorage.getItem('notes_api_key') || '';
  const apiProvider = localStorage.getItem('notes_api_provider') || 'gemini';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const answer = await askAI(note.content, question, apiKey, apiProvider);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: answer
      }]);
    } catch (err) {
      let errMsg = 'Something went wrong. Please try again.';
      if (err.response?.data?.error) {
        if (typeof err.response.data.error === 'object') {
          errMsg = err.response.data.error.message || JSON.stringify(err.response.data.error);
        } else {
          errMsg = err.response.data.error;
        }
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `❌ Error: ${errMsg}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SUGGESTIONS = [
    'Summarize the key points',
    'What are the most important concepts?',
    'Give me exam tips from this note',
    'Explain this in simpler terms',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="flex flex-col h-full bg-[#080b15] border-l border-white/[0.07] w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07] flex-shrink-0 bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center">
            <HiSparkles className="text-violet-400 text-sm" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">AI Study Assistant</p>
            <p className="text-[10px] text-gray-500 truncate max-w-[160px]">{note?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([{
              id: 'welcome',
              role: 'ai',
              text: `Chat cleared! I still have your note on "${note?.title}" loaded. Ask me anything!`
            }])}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            title="Clear chat"
          >
            <FiTrash2 className="text-sm" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            title="Close chat"
          >
            <FiX className="text-sm" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-xl flex-shrink-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
              <HiSparkles className="text-emerald-400 text-xs animate-pulse" />
            </div>
            <div className="px-3.5 py-3 rounded-2xl rounded-tl-md bg-white/5 border border-white/[0.08] flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setInput(s); inputRef.current?.focus(); }}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/[0.07]">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-grow relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this note..."
              rows={1}
              className="w-full bg-white/[0.04] border border-white/10 text-white placeholder-gray-600 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-violet-500/50 resize-none font-medium leading-relaxed"
              style={{ minHeight: '40px', maxHeight: '100px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            <FiSend className="text-sm" />
          </button>
        </form>
        <p className="text-[10px] text-gray-600 mt-1.5 font-medium">
          {apiKey ? `Using ${apiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API` : 'Using server AI — add API key in Settings for faster responses'}
        </p>
      </div>
    </motion.div>
  );
}
