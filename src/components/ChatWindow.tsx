'use client';

import * as React from 'react';
import { useChatStore } from '@/store/chatStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatBubble } from '@/components/ChatBubble';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { cn } from '@/lib/utils';
import {
  Mic,
  Sparkles,
  Bot,
  AlertCircle,
  RotateCcw,
  X,
} from 'lucide-react';

export interface ChatWindowProps {
  className?: string;
}

const STARTER_PROMPTS = {
  'hi-IN': [
    { label: '🌾 पीएम किसान योजना', query: 'पीएम किसान योजना के लिए क्या पात्रता है?' },
    { label: '🩺 आयुष्मान भारत कार्ड', query: 'आयुष्मान भारत योजना के तहत 5 लाख का इलाज कैसे मिलेगा?' },
    { label: '🏠 पीएम आवास योजना', query: 'प्रधानमंत्री आवास योजना ग्रामीण के लिए क्या नियम हैं?' },
    { label: '👩 लाडली बहना योजना', query: 'लाडली बहना योजना के लिए पात्रता और लाभ क्या हैं?' },
  ],
  'mr-IN': [
    { label: '🌾 नमो शेतकरी योजना', query: 'नमो शेतकरी महासन्मान निधी योजनेची पात्रता काय आहे?' },
    { label: '👩 लाडकी बहीण योजना', query: 'मुख्यमंत्री माझी लाडकी बहीण योजनेचे नियम व फायदे सांगा.' },
    { label: '🚜 कृषी कर्जमाफी योजना', query: 'महात्मा ज्योतिराव फुले शेतकरी कर्जमुक्ती योजनेची माहिती द्या.' },
    { label: '🩺 महात्मा फुले जन आरोग्य', query: 'महात्मा ज्योतिराव फुले जन आरोग्य योजनेचा लाभ कसा घ्यावा?' },
  ],
};

export function ChatWindow({ className }: ChatWindowProps) {
  const messages = useChatStore((state) => state.messages);
  const status = useChatStore((state) => state.status);
  const error = useChatStore((state) => state.error);
  const language = useChatStore((state) => state.language);
  const setStatus = useChatStore((state) => state.setStatus);
  const clearError = useChatStore((state) => state.clearError);
  const retryLastSubmission = useChatStore((state) => state.retryLastSubmission);
  const submitUserAudio = useChatStore((state) => state.submitUserAudio);

  const scrollEndRef = React.useRef<HTMLDivElement>(null);
  const spokenMessageIdsRef = React.useRef<Set<string>>(new Set());

  const isHindi = language === 'hi-IN';
  const isThinking = status === 'thinking';
  const isError = status === 'error' || Boolean(error);
  const isEmpty = messages.length === 0;

  // Text-To-Speech hook syncing with chatStore status
  const { speak, cancel } = useTextToSpeech({
    onStart: () => setStatus('speaking'),
    onEnd: () => setStatus('idle'),
    onError: () => setStatus('idle'),
  });

  // Automatically speak any newly added 'agent' message
  React.useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    if (
      latestMessage &&
      latestMessage.role === 'agent' &&
      !spokenMessageIdsRef.current.has(latestMessage.id)
    ) {
      spokenMessageIdsRef.current.add(latestMessage.id);
      speak(latestMessage.text, language);
    }
  }, [messages, language, speak]);

  // Clean up active speech on unmount
  React.useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Auto-scroll to the bottom when new messages arrive or status changes
  React.useEffect(() => {
    if (messages.length > 0 || isThinking || isError) {
      const timeoutId = setTimeout(() => {
        scrollEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 60);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, messages, isThinking, isError]);

  const handleSelectPrompt = async (promptQuery: string) => {
    if (isThinking) return;
    await submitUserAudio('', promptQuery);
  };

  const starterPrompts = isHindi ? STARTER_PROMPTS['hi-IN'] : STARTER_PROMPTS['mr-IN'];

  return (
    <div
      data-testid="chat-window"
      role="region"
      aria-label="Government Schemes Assistant Chat"
      className={cn(
        'relative flex flex-col w-full h-full min-h-[340px] rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs overflow-hidden',
        className
      )}
    >
      <ScrollArea className="flex-1 w-full h-full">
        <div className="flex flex-col min-h-full justify-start p-3 sm:p-4 md:p-6 w-full max-w-full">
          {isEmpty ? (
            /* Explicit Empty State with Starter Prompts */
            <div
              data-testid="chat-empty-state"
              className="flex flex-1 flex-col items-center justify-center text-center py-8 px-2 sm:py-12 sm:px-4 my-auto animate-in fade-in duration-300"
            >
              {/* Hero Icon */}
              <div className="relative mb-4 flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Mic className="size-7 sm:size-8" aria-hidden="true" />
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] shadow-xs">
                  <Sparkles className="size-3" />
                </span>
              </div>

              {/* Multilingual Title & Subtitle */}
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight max-w-xs sm:max-w-md">
                {isHindi
                  ? 'पात्र सरकारी योजनाएं खोजें'
                  : 'पात्र सरकारी योजना शोधा'}
              </h2>

              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs sm:max-w-md">
                {isHindi
                  ? 'माइक दबाकर बोलें या नीचे दिए गए प्रश्नों में से किसी एक पर टैप करें।'
                  : 'माइक दाबून बोला किंवा खालीलपैकी एका पर्यायावर टॅप करा.'}
              </p>

              {/* Starter Suggestion Chips */}
              <div className="mt-6 w-full max-w-md">
                <p className="text-[11px] font-semibold text-muted-foreground/80 mb-2.5 uppercase tracking-wider text-center">
                  {isHindi ? 'लोकप्रिय योजना प्रश्न' : 'लोकप्रिय योजना प्रश्न'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {starterPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPrompt(prompt.query)}
                      className="group flex items-center justify-start text-left gap-2 p-2.5 rounded-xl border border-border/80 bg-background/80 hover:bg-accent/80 hover:border-primary/40 text-xs text-foreground/90 transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                      <Sparkles className="size-3.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
                      <span className="truncate font-medium">{prompt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capabilities Badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground/80">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 px-3 py-1 text-[11px]">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  हिंदी व मराठी व्हॉइस
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 px-3 py-1 text-[11px]">
                  <span className="size-1.5 rounded-full bg-primary" />
                  AI पात्रता पडताळणी
                </span>
              </div>
            </div>
          ) : (
            /* Messages Stream */
            <div
              role="log"
              aria-live="polite"
              aria-atomic="false"
              className="flex flex-col gap-3 w-full"
            >
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}

              {/* Rich Loading Skeletons while status is 'thinking' */}
              {isThinking && (
                <div
                  data-testid="thinking-skeleton-container"
                  role="status"
                  aria-busy="true"
                  aria-label="Assistant is analyzing schemes and preparing response"
                  className="flex w-full gap-2 sm:gap-3 py-1.5 justify-start animate-in fade-in duration-300"
                >
                  {/* Agent Avatar Skeleton */}
                  <div className="size-7 sm:size-8 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs mt-0.5 animate-pulse">
                    <Bot className="size-4 sm:size-4.5" />
                  </div>

                  {/* Skeleton Bubble Container */}
                  <div className="flex flex-col gap-3 w-full max-w-[88%] sm:max-w-[78%] md:max-w-[72%]">
                    {/* Text Lines Skeleton */}
                    <div className="rounded-2xl rounded-tl-xs bg-card p-3.5 sm:p-4 border border-border/80 shadow-xs flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-3 w-24 rounded bg-primary/20" />
                        <span className="text-[11px] text-muted-foreground animate-pulse">
                          {isHindi ? 'योजनाएं जांची जा रही हैं...' : 'योजना तपासत आहे...'}
                        </span>
                      </div>
                      <Skeleton className="h-3.5 w-11/12 rounded bg-muted/90" />
                      <Skeleton className="h-3.5 w-full rounded bg-muted/90" />
                      <Skeleton className="h-3.5 w-3/4 rounded bg-muted/90" />
                    </div>

                    {/* Scheme Card Preview Skeleton */}
                    <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-xs flex flex-col gap-2.5 w-full animate-pulse">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 w-3/5 rounded bg-muted/90" />
                        <Skeleton className="h-4 w-16 rounded-full bg-emerald-500/20" />
                      </div>
                      <Skeleton className="h-3 w-full rounded bg-muted/70" />
                      <Skeleton className="h-3 w-4/5 rounded bg-muted/70" />
                      <div className="pt-2 border-t border-border/40 flex justify-end">
                        <Skeleton className="h-5 w-24 rounded bg-primary/20" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Explicit Error State Banner with Retry */}
              {isError && (
                <div
                  data-testid="chat-error-banner"
                  role="alert"
                  aria-live="assertive"
                  className="w-full my-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <Alert
                    variant="destructive"
                    className="border-destructive/40 bg-destructive/10 text-destructive shadow-xs"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                      <div className="flex flex-col gap-0.5">
                        <AlertTitle className="font-semibold text-xs sm:text-sm">
                          {isHindi ? 'उत्तर प्राप्त करने में त्रुटि' : 'उत्तर मिळवण्यात त्रुटी आली'}
                        </AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                          {error ||
                            (isHindi
                              ? 'सर्वर से कनेक्ट करने में समस्या हुई। कृपया दोबारा प्रयास करें।'
                              : 'सर्व्हरशी जोडणी करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.')}
                        </AlertDescription>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => retryLastSubmission()}
                          className="h-8 gap-1.5 text-xs font-medium border-destructive/30 hover:bg-destructive/15 text-destructive focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>{isHindi ? 'पुन: प्रयास' : 'पुन्हा प्रयत्न'}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => clearError()}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
                          aria-label="Dismiss error"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Alert>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={scrollEndRef} className="h-2 w-full" aria-hidden="true" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ChatWindow;

