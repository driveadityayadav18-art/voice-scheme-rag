'use client';

import * as React from 'react';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useChatStore } from '@/store/chatStore';
import { blobToBase64 } from '@/lib/audioUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  AlertCircle,
  Info,
  Radio,
} from 'lucide-react';

export interface VoiceRecorderProps {
  className?: string;
  onAudioRecorded?: (base64Audio: string, transcript: string) => void;
}

export function VoiceRecorder({ className, onAudioRecorded }: VoiceRecorderProps) {
  const { language, status, setStatus, submitUserAudio } = useChatStore();

  const {
    start: startMediaRecorder,
    stop: stopMediaRecorder,
    isRecording,
    audioBlob,
    permissionError,
  } = useMediaRecorder();

  const {
    start: startSpeechRecognition,
    stop: stopSpeechRecognition,
    interimTranscript,
    finalTranscript,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition(language);

  // Tracks if we are awaiting the audioBlob after stopping recording
  const isAwaitingBlobRef = React.useRef<boolean>(false);
  const [recordingDuration, setRecordingDuration] = React.useState<number>(0);
  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Classify permission error
  const isPermissionDenied = React.useMemo(() => {
    if (!permissionError) return false;
    const lower = permissionError.toLowerCase();
    return lower.includes('denied') || lower.includes('permission') || lower.includes('notallowed');
  }, [permissionError]);

  const isNoMicrophoneFound = React.useMemo(() => {
    if (!permissionError) return false;
    const lower = permissionError.toLowerCase();
    return lower.includes('not found') || lower.includes('no microphone') || lower.includes('notfound') || lower.includes('device');
  }, [permissionError]);

  // Duration timer during recording
  React.useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);

  // Handle blob conversion & submission when audioBlob arrives after stopping
  React.useEffect(() => {
    if (isAwaitingBlobRef.current && audioBlob) {
      isAwaitingBlobRef.current = false;

      const processAndSubmit = async () => {
        try {
          const base64Audio = await blobToBase64(audioBlob);

          const rawTranscript = (finalTranscript || interimTranscript).trim();
          const transcriptText = rawTranscript.length > 0 ? rawTranscript : '(voice message)';

          if (onAudioRecorded) {
            onAudioRecorded(base64Audio, transcriptText);
          } else {
            await submitUserAudio(base64Audio, transcriptText);
          }
        } catch (err) {
          console.error('Failed to convert or submit recorded audio:', err);
          setStatus('error');
        }
      };

      processAndSubmit();
    }
  }, [
    audioBlob,
    finalTranscript,
    interimTranscript,
    submitUserAudio,
    onAudioRecorded,
    setStatus,
  ]);

  // Tap-to-toggle recording handler
  const handleToggleRecording = async () => {
    // If agent is thinking, transcribing, or speaking, prevent toggle
    if (status === 'thinking' || status === 'transcribing' || status === 'speaking') {
      return;
    }

    if (!isRecording) {
      // START RECORDING
      try {
        setRecordingDuration(0);
        setStatus('listening');
        await startMediaRecorder();
        if (isSpeechSupported) {
          startSpeechRecognition();
        }
      } catch (err) {
        console.error('Error starting voice recording:', err);
        setStatus('error');
      }
    } else {
      // STOP RECORDING & SUBMIT
      isAwaitingBlobRef.current = true;
      setStatus('transcribing');
      if (isSpeechSupported) {
        stopSpeechRecognition();
      }
      stopMediaRecorder();
    }
  };

  // Keyboard handler for Space / Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleRecording();
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Localized helper text based on current language and state
  const getHelperText = () => {
    if (status === 'thinking') {
      return language === 'hi-IN' ? 'योजनाएं खोजी जा रही हैं...' : 'योजना शोधत आहे...';
    }
    if (status === 'transcribing') {
      return language === 'hi-IN' ? 'ऑडियो प्रोसेस हो रहा है...' : 'ऑडिओ प्रक्रिया सुरू आहे...';
    }
    if (status === 'speaking') {
      return language === 'hi-IN' ? 'उत्तर सुनाया जा रहा है...' : 'उत्तर ऐकवले जात आहे...';
    }
    if (isRecording) {
      return language === 'hi-IN' ? 'भेजने के लिए दोबारा टैप करें' : 'पाठवण्यासाठी पुन्हा टॅप करा';
    }
    return language === 'hi-IN' ? 'बोलने के लिए माइक दबाएं' : 'बोलण्यासाठी माइक दाबा';
  };

  const isBusy = status === 'thinking' || status === 'transcribing' || status === 'speaking';
  const currentLiveTranscript = (finalTranscript || interimTranscript).trim();

  return (
    <div
      data-testid="voice-recorder"
      role="region"
      aria-label="Voice input recorder"
      className={cn('flex flex-col items-center justify-center w-full max-w-lg mx-auto gap-2.5 sm:gap-3', className)}
    >
      {/* 1. Distinct Visible Error State: Permission Denied */}
      {isPermissionDenied && (
        <Alert
          variant="destructive"
          role="alert"
          aria-live="assertive"
          data-testid="permission-denied-alert"
          className="w-full text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200 border-destructive/40 bg-destructive/10"
        >
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <AlertTitle className="font-semibold text-destructive">
              {language === 'hi-IN' ? 'माइक्रोफ़ोन अनुमति अस्वीकृत' : 'मायक्रोफोन परवानगी नाकारली'}
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              {permissionError ||
                (language === 'hi-IN'
                  ? 'कृपया आवाज़ से बात करने के लिए अपने ब्राउज़र में माइक्रोफ़ोन की अनुमति चालू करें।'
                  : 'कृपया आवाजाद्वारे बोलण्यासाठी आपल्या ब्राउझरमध्ये मायक्रोफोन परवानगी सुरू करा.')}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* 2. Distinct Visible Error State: No Microphone Found */}
      {isNoMicrophoneFound && !isPermissionDenied && (
        <Alert
          variant="destructive"
          role="alert"
          aria-live="assertive"
          data-testid="no-mic-alert"
          className="w-full text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-200 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
        >
          <MicOff className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex flex-col gap-1">
            <AlertTitle className="font-semibold">
              {language === 'hi-IN' ? 'माइक्रोफ़ोन नहीं मिला' : 'मायक्रोफोन सापडला नाही'}
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              {permissionError ||
                (language === 'hi-IN'
                  ? 'कोई माइक्रोफ़ोन डिवाइस नहीं मिला। कृपया माइक कनेक्ट करें।'
                  : 'कोणतेही मायक्रोफोन उपकरण आढळले नाही. कृपया माइक कनेक्ट करा.')}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* 3. Distinct Visible State: SpeechRecognition Unsupported Notice */}
      {isMounted && !isSpeechSupported && (
        <div
          data-testid="speech-unsupported-notice"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-secondary/80 text-muted-foreground border border-border/60"
        >
          <Info className="size-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>
            {language === 'hi-IN'
              ? 'लाइव टेक्स्ट पूर्वावलोकन असमर्थित है (ऑडियो रिकॉर्डिंग चालू रहेगी)'
              : 'थेट मजकूर पूर्वावलोकन असमर्थित आहे (ऑडिओ रेकॉर्डिंग सुरू राहील)'}
          </span>
        </div>
      )}

      {/* Live Transcript Preview Bubble (shown while recording or transcribing) */}
      {(isRecording || currentLiveTranscript.length > 0) && (
        <div
          data-testid="live-transcript-bubble"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="w-full min-h-[40px] flex items-center justify-center text-center px-4 py-2 rounded-2xl bg-card/95 border border-primary/25 backdrop-blur-md shadow-xs transition-all animate-in fade-in zoom-in-95 duration-200"
        >
          {currentLiveTranscript.length > 0 ? (
            <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">
              &ldquo;{currentLiveTranscript}&rdquo;
            </p>
          ) : isRecording ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-rose-500" />
              </span>
              <span>
                {isSpeechSupported
                  ? language === 'hi-IN'
                    ? 'सुन रहे हैं... बोलिए...'
                    : 'ऐकत आहे... बोला...'
                  : language === 'hi-IN'
                    ? 'आवाज़ रिकॉर्ड हो रही है...'
                    : 'आवाज रेकॉर्ड होत आहे...'}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Large Thumb-Friendly Tap-to-Toggle Mic Button with Keyboard Focus Rings */}
      <div className="relative flex items-center justify-center my-0.5 sm:my-1">
        {/* Pulsing Concentric Ripple Rings when recording */}
        {isRecording && (
          <>
            <span
              className="absolute size-22 sm:size-26 rounded-full bg-rose-500/25 animate-ping pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute size-26 sm:size-30 rounded-full bg-rose-500/15 animate-pulse pointer-events-none"
              aria-hidden="true"
            />
          </>
        )}

        <Button
          type="button"
          onClick={handleToggleRecording}
          onKeyDown={handleKeyDown}
          disabled={isBusy || isPermissionDenied || isNoMicrophoneFound}
          aria-label={
            isRecording
              ? language === 'hi-IN'
                ? 'रिकॉर्डिंग रोकें और भेजें'
                : 'रेकॉर्डिंग थांबवा आणि पाठवा'
              : language === 'hi-IN'
                ? 'बोलना शुरू करने के लिए टैप करें'
                : 'बोलणे सुरू करण्यासाठी टॅप करा'
          }
          aria-pressed={isRecording}
          data-testid="tap-to-toggle-mic-btn"
          className={cn(
            'relative size-18 sm:size-20 rounded-full p-0 shadow-md transition-all duration-300 transform active:scale-95 flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30 scale-105 border-2 border-rose-300 focus-visible:ring-rose-400'
              : isBusy
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 hover:scale-105'
          )}
        >
          {isBusy ? (
            <Loader2 className="size-7 sm:size-8 animate-spin" />
          ) : isRecording ? (
            <div className="flex flex-col items-center justify-center gap-0.5">
              <Square className="size-6 sm:size-7 fill-current" />
              <span className="text-[10px] font-mono font-bold tracking-tight">
                {formatTime(recordingDuration)}
              </span>
            </div>
          ) : isPermissionDenied || isNoMicrophoneFound ? (
            <MicOff className="size-7 sm:size-8" />
          ) : (
            <Mic className="size-7 sm:size-8" />
          )}
        </Button>
      </div>

      {/* Helper text / status cue below button */}
      <div className="flex flex-col items-center gap-0.5 text-center select-none">
        <p className="text-xs sm:text-sm font-medium text-foreground/90">
          {getHelperText()}
        </p>

        {isRecording && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-mono font-medium">
            <Radio className="size-3 animate-pulse" aria-hidden="true" />
            <span>LIVE &bull; {formatTime(recordingDuration)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceRecorder;

