'use client';

import * as React from 'react';
import { EligibleScheme } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export interface SchemeCardProps {
  scheme: EligibleScheme;
  className?: string;
}

/**
 * SchemeCard displays an eligible government scheme with its title,
 * cited source paragraph (with a 2-line clamp & read-more toggle),
 * and a link to verify the official source.
 */
export function SchemeCard({ scheme, className }: SchemeCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const cardId = React.useId();
  const descId = `scheme-desc-${cardId}`;

  if (!scheme) {
    return null;
  }

  const schemeName = scheme.schemeName?.trim() || 'Eligible Government Scheme';
  const hasSourceUrl = Boolean(scheme.sourceUrl && scheme.sourceUrl.trim().length > 0);
  const rawParagraph = scheme.citedSourceParagraph?.trim();
  const hasParagraph = Boolean(rawParagraph && rawParagraph.length > 0);

  return (
    <Card
      data-testid="scheme-card"
      className={cn(
        'group overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs transition-all hover:border-primary/40 hover:shadow-sm w-full',
        className
      )}
    >
      <CardHeader className="p-3 sm:p-3.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xs sm:text-sm font-semibold leading-snug tracking-tight text-foreground flex-1 break-words">
            {schemeName}
          </CardTitle>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0"
            title="Verified Scheme"
          >
            <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
            <span>Eligible</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-3.5 pt-0 pb-2.5">
        {hasParagraph ? (
          <div>
            <p
              id={descId}
              className={cn(
                'text-xs leading-relaxed text-muted-foreground break-words transition-all',
                !isExpanded && 'line-clamp-2'
              )}
            >
              {rawParagraph}
            </p>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-controls={descId}
              className="mt-1.5 inline-flex items-center text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-xs cursor-pointer select-none py-0.5"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/80 italic">
            Detailed eligibility guidelines available on the official scheme portal.
          </p>
        )}
      </CardContent>

      {hasSourceUrl && (
        <CardFooter className="px-3 sm:px-3.5 py-2 bg-muted/40 border-t border-border/50 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground truncate hidden xs:inline">
            Official Source
          </span>
          <a
            href={scheme.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-xs ml-auto"
            aria-label={`Verify official source for ${schemeName} (opens in a new tab)`}
          >
            <span>Verify source</span>
            <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
          </a>
        </CardFooter>
      )}
    </Card>
  );
}

export default SchemeCard;

