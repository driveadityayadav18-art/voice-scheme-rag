'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage } from '@/lib/types';

export interface UseTextToSpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent | Error) => void;
}

export interface SpeakOptions extends UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface UseTextToSpeechReturn {
  speak: (text: string, lang: SupportedLanguage, options?: SpeakOptions) => void;
  cancel: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
}

/**
 * Finds the best available voice for a given language.
 *
 * Matching priority:
 * 1. Exact match on BCP-47 language tag (e.g. 'hi-IN', 'mr-IN')
 * 2. Primary language subtag match (e.g. 'hi', 'mr')
 * 3. Heuristic matching on voice name (e.g. contains 'Hindi' / 'हिन्दी' or 'Marathi' / 'मराठी')
 * 4. Fallback to default voice with console.warn (no user-facing error)
 */
function findBestVoice(
  voices: SpeechSynthesisVoice[],
  lang: SupportedLanguage
): { voice: SpeechSynthesisVoice | null; isFallback: boolean } {
  if (!voices || voices.length === 0) {
    return { voice: null, isFallback: true };
  }

  const normalizedTarget = lang.toLowerCase().replace('_', '-');
  const primaryLang = normalizedTarget.split('-')[0];

  // 1. Exact BCP-47 match
  const exactMatch = voices.find(
    (v) => v.lang.toLowerCase().replace('_', '-') === normalizedTarget
  );
  if (exactMatch) {
    return { voice: exactMatch, isFallback: false };
  }

  // 2. Primary language match (e.g. 'hi-IN' matches 'hi' or 'hi-...')
  const prefixMatch = voices.find((v) => {
    const voiceLang = v.lang.toLowerCase().replace('_', '-');
    return voiceLang.startsWith(`${primaryLang}-`) || voiceLang === primaryLang;
  });
  if (prefixMatch) {
    return { voice: prefixMatch, isFallback: false };
  }

  // 3. Heuristic name match
  const nameKeywords: Record<string, string[]> = {
    hi: ['hindi', 'हिन्दी', 'lekha', 'hemant', 'kalpana'],
    mr: ['marathi', 'मराठी', 'aarohi'],
  };
  const keywords = nameKeywords[primaryLang] || [];
  const nameMatch = voices.find((v) => {
    const voiceName = v.name.toLowerCase();
    return keywords.some((kw) => voiceName.includes(kw));
  });
  if (nameMatch) {
    return { voice: nameMatch, isFallback: false };
  }

  // 4. Fallback to default voice or first available voice
  const defaultVoice = voices.find((v) => v.default) || voices[0] || null;
  console.warn(
    `[useTextToSpeech] No matching voice found for language "${lang}". Falling back to default voice: "${defaultVoice?.name || 'unknown'}".`
  );

  return { voice: defaultVoice, isFallback: true };
}

/**
 * useTextToSpeech
 *
 * Wraps window.speechSynthesis to provide Text-To-Speech capabilities.
 * Supports async voice population via 'voiceschanged' event and automatic fallback.
 */
export function useTextToSpeech(
  hookOptions?: UseTextToSpeechOptions
): UseTextToSpeechReturn {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hookOptionsRef = useRef<UseTextToSpeechOptions | undefined>(hookOptions);

  // Keep options ref updated
  useEffect(() => {
    hookOptionsRef.current = hookOptions;
  }, [hookOptions]);

  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined'
    );
  }, []);

  // Load and update voices list
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices && availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      } catch (err) {
        console.warn('[useTextToSpeech] Error getting voices:', err);
      }
    };

    // Initial load (some browsers have voices ready synchronously)
    updateVoices();

    // Listen for async voiceschanged event
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
      if (window.speechSynthesis.onvoiceschanged === updateVoices) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // Cancel any active speech on unmount
  useEffect(() => {
    return () => {
      if (isSupported && typeof window !== 'undefined') {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore cleanup errors on unmount
        }
      }
    };
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;

    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('[useTextToSpeech] Cancel error:', err);
    }
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const stop = cancel;

  const pause = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch (err) {
      console.warn('[useTextToSpeech] Pause error:', err);
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch (err) {
      console.warn('[useTextToSpeech] Resume error:', err);
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, lang: SupportedLanguage, options?: SpeakOptions) => {
      if (!text || !text.trim()) {
        options?.onEnd?.();
        hookOptionsRef.current?.onEnd?.();
        return;
      }

      if (!isSupported) {
        console.warn(
          '[useTextToSpeech] Web Speech API SpeechSynthesis is not supported in this browser.'
        );
        options?.onEnd?.();
        hookOptionsRef.current?.onEnd?.();
        return;
      }

      try {
        // Cancel any pending/ongoing speech before starting a new utterance
        window.speechSynthesis.cancel();

        const currentVoices =
          voices.length > 0 ? voices : window.speechSynthesis.getVoices();
        const { voice: matchedVoice } = findBestVoice(currentVoices, lang);
        setSelectedVoice(matchedVoice);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        if (options?.rate !== undefined) utterance.rate = options.rate;
        if (options?.pitch !== undefined) utterance.pitch = options.pitch;
        if (options?.volume !== undefined) utterance.volume = options.volume;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          options?.onStart?.();
          hookOptionsRef.current?.onStart?.();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          utteranceRef.current = null;
          options?.onEnd?.();
          hookOptionsRef.current?.onEnd?.();
        };

        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
          setIsSpeaking(false);
          setIsPaused(false);
          utteranceRef.current = null;

          // 'canceled' and 'interrupted' events occur normally when another utterance cancels prior speech
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            console.warn('[useTextToSpeech] Utterance error:', event.error, event);
            options?.onError?.(event);
            hookOptionsRef.current?.onError?.(event);
          }

          options?.onEnd?.();
          hookOptionsRef.current?.onEnd?.();
        };

        // Retain reference to prevent premature garbage collection in Chromium browsers
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[useTextToSpeech] SpeechSynthesis speak error:', err);
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
        if (err instanceof Error) {
          options?.onError?.(err);
          hookOptionsRef.current?.onError?.(err);
        }
        options?.onEnd?.();
        hookOptionsRef.current?.onEnd?.();
      }
    },
    [isSupported, voices]
  );

  return {
    speak,
    cancel,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
  };
}

export default useTextToSpeech;
