// Text to Speech Helper
let synth = window.speechSynthesis;
let currentUtterance = null;

export const speakText = (text, onBoundary, onEnd) => {
  if (!synth) {
    console.error('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speaking
  synth.cancel();

  // Strip Markdown characters before reading
  const cleanText = text
    .replace(/[#*`~_]/g, '') // remove markdown symbols
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // replace links with anchor text
    .substring(0, 4000); // safety length limit

  currentUtterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance.rate = 1.0; // Normal rate
  currentUtterance.pitch = 1.0; // Normal pitch

  if (onBoundary) {
    currentUtterance.onboundary = onBoundary;
  }
  if (onEnd) {
    currentUtterance.onend = onEnd;
    currentUtterance.onerror = onEnd;
  }

  synth.speak(currentUtterance);
};

export const stopSpeaking = () => {
  if (synth) {
    synth.cancel();
  }
};

export const isSpeaking = () => {
  return synth ? synth.speaking : false;
};

// Speech to Text (Speech Recognition) Helper
export const createSpeechRecognizer = (onResult, onError, onEnd) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    if (onResult) onResult(text);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};
