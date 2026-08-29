'use client';

import * as React from 'react';
import { useChatStore } from '@/store/chatStore';
import { StatusIndicator } from '@/components/StatusIndicator';
import { ChatWindow } from '@/components/ChatWindow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SupportedLanguage } from '@/lib/types';
import { Send, Languages, Sparkles, X, Keyboard } from 'lucide-react';
import { VoiceRecorder } from '@/components/VoiceRecorder';

export default function Home() {
  const { language, setLanguage, submitUserAudio, status } = useChatStore();
  const [inputValue, setInputValue] = React.useState('');
  const [showTextInput, setShowTextInput] = React.useState(false);
  const textInputRef = React.useRef<HTMLInputElement>(null);

  const isThinking = status === 'thinking';
  const isHindi = language === 'hi-IN';

  // Language toggle handler
  const handleToggleLanguage = () => {
    const nextLang: SupportedLanguage = language === 'hi-IN' ? 'mr-IN' : 'hi-IN';
    setLanguage(nextLang);
  };

  // Text submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isThinking) return;

    setInputValue('');
    await submitUserAudio('', trimmed);
  };

  // Focus input when shown
  React.useEffect(() => {
    if (showTextInput) {
      textInputRef.current?.focus();
    }
  }, [showTextInput]);

  return (
    <div className="flex flex-col h-dvh w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-foreground">
      {/* Skip to Content for screen reader & keyboard navigation */}
      <a
        href="#chat-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {isHindi ? 'सीधे चैट पर जाएं (Skip to Chat)' : 'थेट चॅटकडे जा (Skip to Chat)'}
      </a>

      {/* Header */}
      <header
        role="banner"
        className="shrink-0 z-20 border-b border-border/80 bg-card/85 backdrop-blur-md px-3 py-2.5 sm:px-6 sm:py-3"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xs"
              aria-hidden="true"
            >
              <Sparkles className="size-4 sm:size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate flex items-center gap-1.5">
                Bharat Build
                <span className="hidden md:inline-block text-[10px] font-normal text-muted-foreground border border-border/60 rounded px-1.5 py-0.2">
                  AI Gov Schemes
                </span>
              </h1>
            </div>
          </div>

          {/* Header Controls: Status & Language Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* StatusIndicator */}
            <StatusIndicator />

            {/* Language Switcher */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleLanguage}
              className="gap-1.5 text-xs font-medium h-7 sm:h-8 px-2 sm:px-2.5 border-border/80 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              aria-label={`Switch language. Current language: ${isHindi ? 'Hindi' : 'Marathi'}. Click to switch to ${isHindi ? 'Marathi' : 'Hindi'}.`}
              title={`Switch language (Current: ${isHindi ? 'Hindi' : 'Marathi'})`}
            >
              <Languages className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span>{isHindi ? 'हिंदी' : 'मराठी'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main
        id="chat-main"
        role="main"
        tabIndex={-1}
        className="flex-1 min-h-0 w-full overflow-hidden p-2.5 sm:p-4 md:p-6 pb-28 sm:pb-36 outline-none"
      >
        <div className="mx-auto h-full max-w-4xl">
          <ChatWindow className="h-full" />
        </div>
      </main>

      {/* Fixed Bottom Bar with VoiceRecorder & Text Option */}
      <footer
        role="contentinfo"
        aria-label="Input controls"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md px-3 py-2.5 sm:px-6 sm:py-3.5 shadow-lg"
      >
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-1.5 sm:gap-2">
          {/* Thumb-friendly VoiceRecorder */}
          <VoiceRecorder />

          {/* Accessible Keyboard text input option */}
          <div className="w-full flex flex-col items-center">
            {showTextInput ? (
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg flex items-center gap-1.5 sm:gap-2 mt-1 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="relative flex-1">
                  <Input
                    ref={textInputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      isHindi
                        ? 'योजना खोजने के लिए लिखें...'
                        : 'योजना शोधण्यासाठी टाईप करा...'
                    }
                    aria-label={isHindi ? 'योजना खोजें' : 'योजना शोधा'}
                    disabled={isThinking}
                    className="h-9 text-xs sm:text-sm bg-card/80 border-border/80 focus-visible:ring-2 focus-visible:ring-primary/40 pr-8"
                  />
                  {inputValue.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInputValue('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      aria-label="Clear input"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputValue.trim() || isThinking}
                  className="h-9 px-3 shrink-0 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  aria-label={isHindi ? 'प्रश्न भेजें' : 'प्रश्न पाठवा'}
                >
                  <Send className="size-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowTextInput(false)}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label="Close text input"
                  title="Close text input"
                >
                  <X className="size-4" />
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowTextInput(true)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1.5 py-0.5"
                aria-label={isHindi ? 'टाइप करके पूछें (Switch to text input)' : 'टाईप करून विचारा (Switch to text input)'}
              >
                <Keyboard className="size-3 shrink-0" aria-hidden="true" />
                <span>{isHindi ? 'टाइप करके पूछें' : 'टाईप करून विचारा'}</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

