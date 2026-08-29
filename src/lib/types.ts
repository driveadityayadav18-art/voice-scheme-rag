export type AgentStatus = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';

export type SupportedLanguage = 'hi-IN' | 'mr-IN';

export interface EligibleScheme {
  schemeName: string;
  citedSourceParagraph: string;
  sourceUrl: string;
}

export interface ChatResponse {
  agentTranscript: string;
  isEligibilityChecked: boolean;
  missingSlots: string[];
  eligibleSchemes: EligibleScheme[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
  missingSlots?: string[];
  schemes?: EligibleScheme[];
}
