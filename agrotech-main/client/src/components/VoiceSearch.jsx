import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, Send, Sparkles } from 'lucide-react';
import api from '../utils/api.js';

const VoiceSearch = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // Reset all assistant state on modal close
  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setLastQuery('');
      setResponse('');
      setIsListening(false);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US'; // Can be expanded to regional languages like 'hi-IN'
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening... Speak now.');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setTranscript(`Error occurred: ${event.error}. Please try again or type below.`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      // Auto-trigger submit
      handleSubmitQuery(resultText);
    };

    recognitionRef.current = recognition;

    // Cleanup speech synthesis on close
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setResponse('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Start recognition error', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSpeak = (textToSpeak) => {
    if (!synthRef.current) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown characters like asterisks before speaking
    const cleanText = textToSpeak.replace(/\*+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const handleSubmitQuery = async (queryToSend) => {
    const activeQuery = queryToSend || transcript;
    if (!activeQuery || activeQuery.trim() === '' || activeQuery.startsWith('Listening...')) return;

    setLastQuery(activeQuery);
    setTranscript('');
    setIsLoading(true);
    setResponse('');
    try {
      const { data } = await api.post('/api/crops/voice-assistant', { query: activeQuery });
      setResponse(data.reply);
      // Auto-speak response
      handleSpeak(data.reply);
    } catch (error) {
      console.error('Voice assistant request failed:', error);
      setResponse('Sorry, I encountered an issue while generating an answer. Please check your network or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative glass w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-earth-800">
          <div className="flex items-center gap-2 text-farm-600 dark:text-farm-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <h3 className="font-extrabold text-lg text-gray-800 dark:text-gray-100">AgroTech Voice Doctor</h3>
          </div>
          <button 
            onClick={() => {
              if (synthRef.current) synthRef.current.cancel();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-earth-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          
          {/* Listening State Visualization */}
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`h-24 w-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 scale-100 hover:scale-105 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-bounce' 
                  : 'bg-farm-600 hover:bg-farm-700 text-white'
              }`}
            >
              {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
            </button>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {isListening ? 'Listening...' : 'Tap Mic to Speak'}
            </span>
          </div>

          {/* Transcript Preview */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-earth-900 border border-gray-100 dark:border-earth-800 flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">What you said</span>
            <p className="text-gray-700 dark:text-gray-200 text-sm font-medium italic min-h-[40px]">
              {transcript || lastQuery || '"How can I cure tomato early blight?"'}
            </p>
          </div>

          {/* AI Response Output */}
          {isLoading && (
            <div className="flex items-center gap-3 justify-center py-6 text-farm-600 dark:text-farm-400 font-semibold text-sm">
              <div className="h-5 w-5 rounded-full border-2 border-solid border-farm-200 border-t-farm-600 animate-spin"></div>
              <span>AgroTech is thinking...</span>
            </div>
          )}

          {response && (
            <div className="p-5 rounded-2xl bg-farm-50/50 dark:bg-farm-950/20 border border-farm-100 dark:border-farm-900/40 relative group animate-fade-in">
              <div className="flex items-center justify-between mb-3 border-b border-farm-100/50 dark:border-farm-900/30 pb-2">
                <span className="text-[10px] font-bold text-farm-600 dark:text-farm-400 uppercase tracking-wider">AgroTech Assistant</span>
                <button
                  onClick={() => handleSpeak(response)}
                  className="p-1 rounded-lg text-farm-600 dark:text-farm-400 hover:bg-farm-100 dark:hover:bg-farm-950/60 transition-colors"
                  title={isSpeaking ? "Mute speech" : "Read aloud"}
                >
                  {isSpeaking ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
                </button>
              </div>
              <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {response}
              </p>
            </div>
          )}
        </div>

        {/* Text Input Fallback footer */}
        <div className="p-4 border-t border-gray-100 dark:border-earth-800 bg-gray-50/50 dark:bg-earth-900/50 flex gap-2">
          <input
            type="text"
            placeholder={recognitionSupported ? "Or type your question here..." : "Type your question here (Mic unsupported)..."}
            value={transcript.startsWith('Listening...') ? '' : transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuery()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-500"
          />
          <button
            onClick={() => handleSubmitQuery()}
            disabled={isLoading || (!transcript && !isListening)}
            className="p-2.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white disabled:opacity-50 transition-colors"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default VoiceSearch;
