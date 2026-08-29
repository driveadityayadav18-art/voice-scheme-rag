'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { HelpCircle, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

export interface MissingSlotsPromptProps {
  missingSlots?: string[];
  className?: string;
}

const slotLabels: Record<string, { hi: string; mr: string; en: string }> = {
  annual_income: { hi: 'वार्षिक आय', mr: 'वार्षिक उत्पन्न', en: 'Annual Income' },
  income: { hi: 'आय', mr: 'उत्पन्न', en: 'Income' },
  age: { hi: 'आयु / उम्र', mr: 'वय', en: 'Age' },
  gender: { hi: 'लिंग', mr: 'लिंग', en: 'Gender' },
  occupation: { hi: 'व्यवसाय', mr: 'व्यवसाय', en: 'Occupation' },
  land_holding: { hi: 'जमीन धारकता', mr: 'जमीन धारणा', en: 'Land Holding' },
  land_size: { hi: 'जमीन का रकबा', mr: 'जमिनीचे क्षेत्रफळ', en: 'Land Size' },
  category: { hi: 'जाति / वर्ग', mr: 'प्रवर्ग', en: 'Category' },
  caste: { hi: 'जाति', mr: 'जात', en: 'Caste' },
  state: { hi: 'राज्य', mr: 'राज्य', en: 'State' },
  district: { hi: 'जिला', mr: 'जिल्हा', en: 'District' },
  marital_status: { hi: 'वैवाहिक स्थिति', mr: 'वैवाहिक स्थिती', en: 'Marital Status' },
};

function formatSlotDisplayName(slot: string, language: string): string {
  const normalized = slot.trim().toLowerCase().replace(/\s+/g, '_');
  const matched = slotLabels[normalized];
  if (matched) {
    if (language === 'mr-IN') return matched.mr;
    if (language === 'hi-IN') return matched.hi;
    return matched.en;
  }
  return slot.trim().replace(/_/g, ' ');
}

/**
 * MissingSlotsPrompt renders a natural-language nudge prompting the user
 * for missing required information (slots) to check eligibility.
 */
export function MissingSlotsPrompt({
  missingSlots = [],
  className,
}: MissingSlotsPromptProps) {
  const language = useChatStore((state) => state.language);

  if (!missingSlots || missingSlots.length === 0) {
    return null;
  }

  const validSlots = missingSlots.filter(
    (slot) => typeof slot === 'string' && slot.trim().length > 0
  );

  if (validSlots.length === 0) {
    return null;
  }

  const isHindi = language === 'hi-IN';
  const promptHeading = isHindi
    ? 'सटीक पात्रता जांचने के लिए ये जानकारी आवश्यक है:'
    : 'अचूक पात्रता तपासण्यासाठी ही माहिती आवश्यक आहे:';

  return (
    <div
      data-testid="missing-slots-prompt"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Required missing details for scheme eligibility"
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-3.5 text-xs leading-relaxed text-amber-950 dark:text-amber-200 transition-all shadow-2xs',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <HelpCircle
          className="size-4 text-amber-600 dark:text-amber-400 shrink-0"
          aria-hidden="true"
        />
        <span className="font-semibold text-amber-900 dark:text-amber-100 text-xs">
          {promptHeading}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {validSlots.map((slot, index) => {
          const displayName = formatSlotDisplayName(slot, language);
          return (
            <span
              key={`${slot}-${index}`}
              className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:text-amber-100 border border-amber-500/30"
            >
              <Sparkles className="size-2.5 opacity-70" aria-hidden="true" />
              <span>{displayName}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default MissingSlotsPrompt;

