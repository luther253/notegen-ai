import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheckSquare, 
  FiChevronRight, 
  FiChevronLeft, 
  FiCheckCircle, 
  FiXCircle, 
  FiAward, 
  FiRefreshCw, 
  FiArrowLeft,
  FiBookOpen,
  FiAlertCircle 
} from 'react-icons/fi';
import { useNotes } from '../context/NotesContext';
import Toast from '../components/Toast';

export default function QuizPage() {
  const { notes, addQuizAttempt } = useNotes();
  const location = useLocation();
  const navigate = useNavigate();

  // Settings
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // mapped: { [questionIdx]: selectedAnswer }
  const [shortAnswers, setShortAnswers] = useState({}); // mapped: { [questionIdx]: typedText }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Toast notification
  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastShow(true);
  };

  // 1. Determine note selection from URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setSelectedNoteId(id);
    } else if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }, [location.search, notes]);

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // 2. Load / Generate Quiz questions — depends only on selectedNoteId to avoid
  // re-running on every render (activeNote is a new object reference each time)
  useEffect(() => {
    if (!activeNote) {
      setQuestions([]);
      return;
    }

    if (activeNote.quiz && activeNote.quiz.length > 0) {
      setQuestions(activeNote.quiz);
    } else {
      // Local fallback generation for manual notes
      const localQuiz = autoGenerateLocalQuiz(activeNote.content, activeNote.title);
      setQuestions(localQuiz);
    }

    // Reset quiz state only when the selected note actually changes
    setCurrentQuestionIdx(0);
    setAnswers({});
    setShortAnswers({});
    setIsSubmitted(false);
    setScore(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId]);

  // Fallback quiz generator based on note headers
  const autoGenerateLocalQuiz = (text, noteTitle) => {
    const quiz = [];
    
    // Attempt to extract definitions for matching MCQ/TF
    const definitionsMatch = [...text.matchAll(/[\*\-]\s+\*\*([^*]+)\*\*:\s*([^\n]+)/g)];
    
    if (definitionsMatch.length > 0) {
      definitionsMatch.slice(0, 3).forEach((match, idx) => {
        const keyword = match[1].trim();
        const definition = match[2].trim();
        
        // Let's create an MCQ
        const options = [definition];
        // Seed dummy answers
        options.push('A theoretical framework with no concrete implementation.', 'An obsolete variable standard which was deprecated.', 'A diagnostic error logging procedure.');
        // Shuffle options
        const shuffledOptions = options.sort(() => Math.random() - 0.5);

        quiz.push({
          type: 'mcq',
          question: `What is the definition of "${keyword}" as discussed in the notes?`,
          options: shuffledOptions,
          answer: definition
        });
      });
    }

    // Add True / False based on title
    quiz.push({
      type: 'tf',
      question: `True or False: The note titled "${noteTitle}" contains revision guidelines and real-world applications.`,
      answer: 'True'
    });

    // Add Short answer question
    quiz.push({
      type: 'short',
      question: `Write a brief summary of the primary topic investigated in these notes ("${activeNote?.topic || 'General'}").`,
      answer: `This topic is associated with ${activeNote?.subject || 'general coursework'} and explores theoretical and practical guidelines.`
    });

    return quiz;
  };

  const handleSelectOption = (idx, option) => {
    setAnswers((prev) => ({ ...prev, [idx]: option }));
  };

  const handleTypeShortAnswer = (idx, text) => {
    setShortAnswers((prev) => ({ ...prev, [idx]: text }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  // Grade Quiz & Save attempt
  const handleSubmitQuiz = () => {
    let finalScore = 0;
    
    questions.forEach((q, idx) => {
      if (q.type === 'mcq' || q.type === 'tf') {
        if (answers[idx] === q.answer) {
          finalScore++;
        }
      } else if (q.type === 'short') {
        // Simple client-side text match checks for short answers (loose keywords checks)
        const userText = (shortAnswers[idx] || '').trim().toLowerCase();
        const correctText = q.answer.toLowerCase();
        
        // Give score if user answers at least one major keyword or matches length
        const keywords = correctText.split(/\s+/).filter(w => w.length > 3);
        const hasKeyword = keywords.some(k => userText.includes(k));
        
        if (hasKeyword || userText.length > 15) {
          finalScore++;
        }
      }
    });

    setScore(finalScore);
    setIsSubmitted(true);

    // Save attempt to database
    addQuizAttempt(activeNote.id, activeNote.title, questions, finalScore, questions.length);
    triggerToast(`Quiz submitted! Score: ${finalScore}/${questions.length}`);
  };

  const handleRetry = () => {
    setAnswers({});
    setShortAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setCurrentQuestionIdx(0);
    triggerToast('Quiz reset. Good luck!');
  };

  const currentQuestion = questions[currentQuestionIdx];
  const progressPercent = questions.length > 0 ? ((currentQuestionIdx + 1) / questions.length) * 100 : 0;
  
  // Calculate answered count
  const answeredCount = Object.keys(answers).length + Object.keys(shortAnswers).filter(k => shortAnswers[k].trim()).length;
  const isAllAnswered = answeredCount === questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 relative z-10">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          {activeNote && (
            <Link
              to={`/dashboard/notes?id=${activeNote.id}`}
              className="p-2.5 rounded-xl border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              title="Back to Note"
            >
              <FiArrowLeft />
            </Link>
          )}
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-gray-950 to-gray-700 dark:from-white dark:to-gray-400">
              Comprehension Quizzes
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Test your retention with MCQs, True/False, and short-answer prompts.</p>
          </div>
        </div>

        {/* Note selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">Active Note:</span>
          <select
            value={selectedNoteId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedNoteId(newId);
              navigate(`/dashboard/quiz?id=${newId}`, { replace: true });
            }}
            className="text-xs px-3.5 py-2.5 rounded-xl border border-gray-200/20 bg-white dark:bg-gray-900/40 outline-hidden font-bold cursor-pointer max-w-xs shadow-xs text-gray-900 dark:text-white"
          >
            {notes.length === 0 && <option value="">No notes available</option>}
            {notes.map((n) => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        </div>
      </div>

      {questions.length > 0 && currentQuestion ? (
        <div className="space-y-6 text-left">
          
          <AnimatePresence mode="wait">
            
            {/* SCORE DISPLAY SCREEN */}
            {isSubmitted ? (
              <motion.div
                key="score-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel border border-gray-200/10 p-8 rounded-3xl text-center space-y-6"
              >
                <div className="mx-auto p-4.5 rounded-full bg-violet-500/10 text-[rgb(var(--accent-color))] text-5xl w-fit animate-float">
                  <FiAward />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-2xl">Quiz Completed!</h3>
                  <p className="text-xs text-gray-400">Score result saved in study history.</p>
                </div>

                {/* Score badge counter */}
                <div className="py-4">
                  <span className="font-display font-extrabold text-6xl text-[rgb(var(--accent-color))]">
                    {score}
                  </span>
                  <span className="text-2xl text-gray-400 font-bold"> / {questions.length}</span>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2">
                    {((score / questions.length) * 100).toFixed(0)}% Correct answers
                  </p>
                </div>

                <div className="flex gap-4 max-w-sm mx-auto">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 text-xs font-bold border border-gray-200/20 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FiRefreshCw /> Retry Quiz
                  </button>
                  <Link
                    to={`/dashboard/notes?id=${activeNote.id}`}
                    className="flex-1 py-3 text-xs font-bold text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] rounded-xl text-center cursor-pointer shadow-md"
                  >
                    Back to Note
                  </Link>
                </div>

                {/* ANSWERS REVIEW SECTION */}
                <div className="pt-8 border-t border-gray-200/10 text-left space-y-6 max-w-xl mx-auto">
                  <h4 className="font-display font-bold text-sm text-gray-800 dark:text-white">Review Answers</h4>
                  
                  {questions.map((q, idx) => {
                    const isCorrect = q.type === 'short' || answers[idx] === q.answer;
                    return (
                      <div key={idx} className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <FiCheckCircle className="text-emerald-500 text-base mt-0.5 flex-shrink-0" />
                          ) : (
                            <FiXCircle className="text-rose-500 text-base mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">
                              Question {idx + 1}: {q.question}
                            </p>
                            
                            {/* MCQ/TF details */}
                            {(q.type === 'mcq' || q.type === 'tf') && (
                              <div className="mt-1.5 space-y-1 text-xxs font-medium">
                                <p className="text-gray-500">Your Answer: <span className={isCorrect ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{answers[idx] || '(Not answered)'}</span></p>
                                {!isCorrect && <p className="text-gray-500">Correct Answer: <span className="text-emerald-500 font-bold">{q.answer}</span></p>}
                              </div>
                            )}

                            {/* Short answer review */}
                            {q.type === 'short' && (
                              <div className="mt-1.5 space-y-1 text-xxs leading-relaxed font-medium">
                                <p className="text-gray-500">Your Answer: <span className="text-gray-600 dark:text-gray-400 font-bold italic">{shortAnswers[idx] || '(Not answered)'}</span></p>
                                <p className="text-gray-500">Reference Answer: <span className="text-emerald-500 font-bold">{q.answer}</span></p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              
              /* ACTIVE STEPPER QUESTION SCREEN */
              <motion.div
                key="quiz-stepper"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Stepper progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xxs font-bold text-gray-400">
                    <span>QUESTION {currentQuestionIdx + 1} OF {questions.length}</span>
                    <span>{progressPercent.toFixed(0)}% PROGRESS</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[rgb(var(--accent-color))] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Question panel card */}
                <div className="glass-panel border border-gray-200/10 p-6 sm:p-8 rounded-3xl space-y-6 bg-white dark:bg-[#0f1423]">
                  <span className="text-xxs font-bold text-[rgb(var(--accent-color))] bg-violet-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type === 'tf' ? 'True or False' : 'Short Answer'}
                  </span>
                  
                  <h3 className="font-display font-bold text-base sm:text-lg text-gray-800 dark:text-white leading-relaxed">
                    {currentQuestion.question}
                  </h3>

                  {/* MCQ OPTIONS LIST */}
                  {currentQuestion.type === 'mcq' && (
                    <div className="flex flex-col gap-3">
                      {currentQuestion.options.map((opt) => {
                        const isSelected = answers[currentQuestionIdx] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectOption(currentQuestionIdx, opt)}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[rgb(var(--accent-color))] bg-violet-500/5 text-[rgb(var(--accent-color))] shadow-xs'
                                : 'border-gray-200/20 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TRUE FALSE OPTIONS LIST */}
                  {currentQuestion.type === 'tf' && (
                    <div className="flex gap-4">
                      {['True', 'False'].map((opt) => {
                        const isSelected = answers[currentQuestionIdx] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectOption(currentQuestionIdx, opt)}
                            className={`flex-1 py-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[rgb(var(--accent-color))] bg-violet-500/5 text-[rgb(var(--accent-color))] shadow-xs'
                                : 'border-gray-200/20 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* SHORT ANSWER WRITER */}
                  {currentQuestion.type === 'short' && (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Write your explanation or core definitions here..."
                        value={shortAnswers[currentQuestionIdx] || ''}
                        onChange={(e) => handleTypeShortAnswer(currentQuestionIdx, e.target.value)}
                        className="w-full text-xs px-4 py-3 rounded-xl border border-gray-200/20 bg-gray-50/50 dark:bg-gray-900/30 focus:border-[rgb(var(--accent-color))] outline-none h-28 resize-none font-medium leading-relaxed text-gray-900 dark:text-white placeholder-gray-400"
                        autoComplete="off"
                        spellCheck={true}
                      />
                      <p className="text-[10px] text-gray-400">
                        Type a concise summary. The system will review core keywords upon submission.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Navigation Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentQuestionIdx === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200/20 text-xs font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-30 cursor-pointer"
                  >
                    <FiChevronLeft /> Back
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {/* Stepper position */}
                    <span className="text-xxs font-bold text-gray-400">
                      ANSWERED {answeredCount} OF {questions.length}
                    </span>

                    {currentQuestionIdx < questions.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        Next <FiChevronRight />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={!isAllAnswered}
                        className="px-5 py-2.5 rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-600 text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        Submit Quiz
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>
      ) : (
        <div className="glass-panel border border-gray-200/10 p-12 rounded-3xl text-center text-gray-400 max-w-lg mx-auto space-y-4">
          <FiAlertCircle className="mx-auto text-4xl text-gray-500 opacity-60 animate-pulse-slow" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">No active quiz found</p>
            <p className="text-xs text-gray-500">
              Create and save an AI-generated note first. Notes generated by the AI automatically compile matching study quizzes.
            </p>
          </div>
          <Link
            to="/dashboard/generate"
            className="inline-block px-5 py-2.5 text-xs font-bold text-white bg-[rgb(var(--accent-color))] hover:bg-[var(--color-accent-hover)] rounded-xl transition shadow-md"
          >
            Generate AI Note
          </Link>
        </div>
      )}

      {/* Floating notifications */}
      <Toast
        show={toastShow}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastShow(false)}
      />
    </div>
  );
}
