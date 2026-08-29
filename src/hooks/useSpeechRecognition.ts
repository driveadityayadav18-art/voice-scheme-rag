'use client';

/**
 * NOTE / DISCLAIMER:
 * Web Speech API speech recognition is a BEST-EFFORT UI PREVIEW ONLY.
 * It is NOT authoritative and may differ from server-side speech-to-text processing.
 * Do not rely on this transcript for business logic, slot validation, or official records.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { SupportedLanguage } from '@/lib/types';

// Declare Web Speech API types for browsers that support it
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type SpeechRecognitionErrorType =
  | 'no-speech'
  | 'network'
  | 'audio-capture'
  | 'not-allowed'
  | 'aborted'
  | 'language-not-supported'
  | 'service-not-allowed'
  | string;

export interface UseSpeechRecognitionReturn {
  start: () => void;
  stop: () => void;
  interimTranscript: string;
  finalTranscript: string;
  isSupported: boolean;
  error: SpeechRecognitionErrorType | null;
}

/**
 * useSpeechRecognition
 * 
 * Wraps window.SpeechRecognition || window.webkitSpeechRecognition to provide
 * live speech-to-text streaming for client UI preview.
 * 
 * IMPORTANT:
 * This transcript is a best-effort UI preview only and is NOT authoritative.
 * 
 * @param lang SupportedLanguage ('hi-IN' | 'mr-IN')
 */
export function useSpeechRecognition(lang: SupportedLanguage): UseSpeechRecognitionReturn {
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [error, setError] = useState<SpeechRecognitionErrorType | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const isStartedRef = useRef<boolean>(false);

  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  const stop = useCallback(() => {
    isManuallyStoppedRef.current = true;
    isStartedRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('SpeechRecognition stop warning:', err);
      }
    }
  }, []);

  const start = useCallback(() => {
    if (!isSupported || typeof window === 'undefined') {
      return;
    }

    // Reset transcripts and error state for new recording session
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
    isManuallyStoppedRef.current = false;

    try {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        return;
      }

      if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let accumulatedFinal = '';
          let accumulatedInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
              accumulatedFinal += result[0].transcript;
            } else {
              accumulatedInterim += result[0].transcript;
            }
          }

          if (accumulatedFinal) {
            setFinalTranscript(accumulatedFinal);
          }
          setInterimTranscript(accumulatedInterim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errCode = event.error;
          // Distinguish specific error categories ('no-speech', 'network', etc.)
          if (errCode === 'no-speech') {
            setError('no-speech');
          } else if (errCode === 'network') {
            setError('network');
          } else {
            setError(errCode || 'unknown-error');
          }
        };

        recognition.onend = () => {
          isStartedRef.current = false;
          // Clean up interim transcript when listening ends
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
      } else {
        recognitionRef.current.lang = lang;
      }

      if (!isStartedRef.current) {
        recognitionRef.current.start();
        isStartedRef.current = true;
      }
    } catch (err) {
      console.warn('SpeechRecognition start error:', err);
      isStartedRef.current = false;
    }
  }, [isSupported, lang]);

  // Keep recognition language updated if lang changes while hook is mounted
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, [lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true;
      isStartedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore errors on unmount
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    start,
    stop,
    interimTranscript,
    finalTranscript,
    isSupported,
    error,
  };
}
