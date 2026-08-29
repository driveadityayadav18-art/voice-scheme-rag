'use client';

import * as React from 'react';
import { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MissingSlotsPrompt } from '@/components/MissingSlotsPrompt';
import { SchemeCard } from '@/components/SchemeCard';
import { Bot, User } from 'lucide-react';

export interface ChatBubbleProps {
  message: ChatMessage;
  className?: string;
}

export function ChatBubble({ message, className }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const hasMissingSlots = Boolean(
    message.missingSlots && message.missingSlots.length > 0
  );
  const hasSchemes = Boolean(message.schemes && message.schemes.length > 0);

  const formattedTime = React.useMemo(() => {
    if (!message.timestamp) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date(message.timestamp));
    } catch {
      return '';
    }
  }, [message.timestamp]);

  const isoTime = React.useMemo(() => {
    if (!message.timestamp) return undefined;
    try {
      return new Date(message.timestamp).toISOString();
    } catch {
      return undefined;
    }
  }, [message.timestamp]);

  const bubbleRoleLabel = isUser ? 'You said:' : 'Bharat Build Assistant replied:';

  return (
    <div
      role="listitem"
      data-slot="chat-bubble-container"
      data-role={message.role}
      aria-label={bubbleRoleLabel}
      className={cn(
        'group flex w-full gap-2 sm:gap-3 py-1.5 transition-all animate-in fade-in-50 slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {/* Agent Avatar */}
      {!isUser && (
        <div
          aria-hidden="true"
          className="size-7 sm:size-8 shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs mt-0.5"
        >
          <Bot className="size-4 sm:size-4.5" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={cn(
          'flex flex-col max-w-[88%] sm:max-w-[78%] md:max-w-[72%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Main Message Bubble */}
        <div
          data-slot="chat-bubble"
          className={cn(
            'relative px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-xs transition-colors w-full',
            isUser
              ? 'rounded-2xl rounded-tr-xs bg-primary text-primary-foreground font-normal'
              : 'rounded-2xl rounded-tl-xs bg-card text-card-foreground border border-border/80'
          )}
        >
          {/* Message Text */}
          {message.text && (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          )}

          {/* Missing Slots Prompt */}
          {hasMissingSlots && message.missingSlots && (
            <MissingSlotsPrompt
              missingSlots={message.missingSlots}
              className="mt-3"
            />
          )}

          {/* Scheme Cards */}
          {hasSchemes && message.schemes && (
            <div className="mt-3 flex flex-col gap-2 w-full">
              {message.schemes.map((scheme, idx) => (
                <SchemeCard
                  key={`${scheme.schemeName || 'scheme'}-${idx}`}
                  scheme={scheme}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {formattedTime && (
          <time
            dateTime={isoTime}
            className={cn(
              'px-1.5 pt-1 text-[10px] sm:text-[11px] text-muted-foreground/80 select-none tracking-tight font-medium',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {formattedTime}
          </time>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div
          aria-hidden="true"
          className="size-7 sm:size-8 shrink-0 rounded-full bg-secondary text-secondary-foreground border border-border/80 flex items-center justify-center shadow-2xs mt-0.5"
        >
          <User className="size-4 sm:size-4.5" />
        </div>
      )}
    </div>
  );
}

export default ChatBubble;

