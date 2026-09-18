'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [subIndex: number]: { transcript: string };
    };
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface WindowWithSpeech {
  SpeechRecognition?: new () => ISpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
}

function subscribeNoop() {
  return () => {};
}

function getIsSupportedSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as WindowWithSpeech;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

function getIsSupportedServerSnapshot(): boolean {
  return false;
}

export function useSpeechRecognition({
  lang = 'en-IN',
  continuous = true,
  interimResults = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Read browser capability safely without cascading setState in effect
  const isSupported = useSyncExternalStore(
    subscribeNoop,
    getIsSupportedSnapshot,
    getIsSupportedServerSnapshot
  );

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const currentLangRef = useRef(lang);

  // Update ref inside effect to comply with React 19 purity rules
  useEffect(() => {
    currentLangRef.current = lang;
  }, [lang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);

    if (typeof window === 'undefined') return;

    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Safe ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = currentLangRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item && item[0]) {
            currentTranscript += item[0].transcript;
          }
        }
        if (currentTranscript.trim()) {
          setTranscript(currentTranscript.trim());
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        const errType = event.error;
        if (errType === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in your browser.');
        } else if (errType === 'no-speech') {
          // Non-fatal, keep listening or soft report
        } else {
          setError(`Speech recognition notice: ${errType || 'connection issue'}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.error('Speech recognition start failed:', err);
      setError('Unable to activate microphone. Please verify browser permissions.');
      setIsListening(false);
    }
  }, [continuous, interimResults]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // safe ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
