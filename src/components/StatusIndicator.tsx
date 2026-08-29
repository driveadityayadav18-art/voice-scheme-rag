'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/store/chatStore';
import { AgentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Mic,
  Loader2,
  Sparkles,
  Volume2,
  AlertTriangle,
} from 'lucide-react';

export interface StatusIndicatorProps {
  className?: string;
}

interface StatusConfig {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClassName: string;
  dotClassName: string;
  pingClassName: string;
}

const getStatusConfig = (
  status: AgentStatus,
  error: string | null,
  language: string
): StatusConfig | null => {
  const isHindi = language === 'hi-IN';

  switch (status) {
    case 'listening':
      return {
        label: isHindi ? 'सुन रहे हैं…' : 'ऐकत आहे…',
        shortLabel: isHindi ? 'सुन रहे हैं' : 'ऐकत आहे',
        icon: Mic,
        badgeClassName:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
        dotClassName: 'bg-emerald-500',
        pingClassName: 'bg-emerald-400',
      };
    case 'transcribing':
      return {
        label: isHindi ? 'ऑडियो प्रोसेस…' : 'प्रक्रिया सुरू…',
        shortLabel: isHindi ? 'प्रोसेस' : 'प्रक्रिया',
        icon: Loader2,
        badgeClassName:
          'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20',
        dotClassName: 'bg-amber-500',
        pingClassName: 'bg-amber-400',
      };
    case 'thinking':
      return {
        label: isHindi ? 'योजनाएं खोज रहे हैं…' : 'योजना शोधत आहे…',
        shortLabel: isHindi ? 'खोज रहे हैं' : 'शोधत आहे',
        icon: Sparkles,
        badgeClassName:
          'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20',
        dotClassName: 'bg-primary',
        pingClassName: 'bg-primary/60',
      };
    case 'speaking':
      return {
        label: isHindi ? 'बोल रहे हैं…' : 'बोलत आहे…',
        shortLabel: isHindi ? 'बोल रहे हैं' : 'बोलत आहे',
        icon: Volume2,
        badgeClassName:
          'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/20',
        dotClassName: 'bg-sky-500',
        pingClassName: 'bg-sky-400',
      };
    case 'error':
      return {
        label: error || (isHindi ? 'त्रुटि हुई' : 'त्रुटी आली'),
        shortLabel: isHindi ? 'त्रुटि' : 'त्रुटी',
        icon: AlertTriangle,
        badgeClassName:
          'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20',
        dotClassName: 'bg-destructive',
        pingClassName: 'bg-destructive',
      };
    case 'idle':
    default:
      return null;
  }
};

export function StatusIndicator({ className }: StatusIndicatorProps) {
  const status = useChatStore((state) => state.status);
  const error = useChatStore((state) => state.error);
  const language = useChatStore((state) => state.language);

  const config = getStatusConfig(status, error, language);

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Status: ${config.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 text-xs font-medium transition-all shadow-xs shrink-0 select-none max-w-[140px] sm:max-w-xs',
        config.badgeClassName,
        className
      )}
    >
      <span className="relative flex size-2 shrink-0 items-center justify-center" aria-hidden="true">
        <span
          className={cn(
            'absolute inline-flex size-full animate-ping rounded-full opacity-75',
            config.pingClassName
          )}
        />
        <span
          className={cn(
            'relative inline-flex size-1.5 rounded-full',
            config.dotClassName
          )}
        />
      </span>

      <Icon className={cn('size-3 shrink-0', status === 'transcribing' && 'animate-spin')} aria-hidden="true" />
      
      <span className="truncate hidden sm:inline">{config.label}</span>
      <span className="truncate sm:hidden">{config.shortLabel}</span>
    </Badge>
  );
}

export default StatusIndicator;

