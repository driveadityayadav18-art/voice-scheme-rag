'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseMediaRecorderReturn {
  start: () => Promise<void>;
  stop: () => void;
  isRecording: boolean;
  audioBlob: Blob | null;
  permissionError: string | null;
}

/**
 * useMediaRecorder
 * 
 * Custom hook wrapping navigator.mediaDevices.getUserMedia({ audio: true })
 * and MediaRecorder for capturing microphone audio.
 * 
 * Exposes:
 * - `start`: Requests microphone access and begins recording
 * - `stop`: Stops active recording and produces the resulting audio Blob
 * - `isRecording`: Boolean indicator if recording is currently active
 * - `audioBlob`: The final recorded audio Blob or null
 * - `permissionError`: Error message if microphone permission or access fails
 */
export function useMediaRecorder(): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore errors during track cleanup
        }
      });
      streamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping MediaRecorder:', err);
      }
    }
    cleanupStream();
    setIsRecording(false);
  }, [cleanupStream]);

  const start = useCallback(async () => {
    setPermissionError(null);
    setAudioBlob(null);
    audioChunksRef.current = [];

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setPermissionError('MediaDevices API is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect supported mimeType
      let options: MediaRecorderOptions | undefined = undefined;
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          options = { mimeType: 'audio/ogg;codecs=opus' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || options?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        audioChunksRef.current = [];
        cleanupStream();
        setIsRecording(false);
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error event:', event);
        stop();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err: unknown) {
      cleanupStream();
      setIsRecording(false);
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setPermissionError('No microphone input device was found.');
        } else {
          setPermissionError(`Microphone access error: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setPermissionError(err.message);
      } else {
        setPermissionError('Failed to access microphone.');
      }
    }
  }, [cleanupStream, stop]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore cleanup error on unmount
        }
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    start,
    stop,
    isRecording,
    audioBlob,
    permissionError,
  };
}
