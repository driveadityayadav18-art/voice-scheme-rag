import { create } from 'zustand';
import {
  AgentStatus,
  ChatMessage,
  ChatResponse,
  SupportedLanguage,
} from '@/lib/types';

export interface FailedSubmission {
  audioBase64: string;
  transcriptPreview: string;
}

export interface ChatState {
  status: AgentStatus;
  messages: ChatMessage[];
  error: string | null;
  language: SupportedLanguage;
  lastFailedSubmission: FailedSubmission | null;

  setStatus: (status: AgentStatus) => void;
  setLanguage: (language: SupportedLanguage) => void;
  addMessage: (message: ChatMessage) => void;
  reset: () => void;
  clearError: () => void;
  retryLastSubmission: () => Promise<void>;
  submitUserAudio: (audioBase64: string, transcriptPreview: string) => Promise<void>;
}

const initialState = {
  status: 'idle' as AgentStatus,
  messages: [] as ChatMessage[],
  error: null as string | null,
  language: 'hi-IN' as SupportedLanguage,
  lastFailedSubmission: null as FailedSubmission | null,
};

const createMessageId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  setStatus: (status: AgentStatus) => set({ status }),

  setLanguage: (language: SupportedLanguage) => set({ language }),

  addMessage: (message: ChatMessage) =>
    set((state) => ({ messages: [...state.messages, message] })),

  reset: () => set(initialState),

  clearError: () =>
    set({
      status: 'idle',
      error: null,
    }),

  retryLastSubmission: async () => {
    const { lastFailedSubmission, submitUserAudio } = get();
    if (lastFailedSubmission) {
      await submitUserAudio(
        lastFailedSubmission.audioBase64,
        lastFailedSubmission.transcriptPreview
      );
    }
  },

  submitUserAudio: async (audioBase64: string, transcriptPreview: string) => {
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      text: transcriptPreview,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      status: 'thinking',
      error: null,
      lastFailedSubmission: null,
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: audioBase64 }),
      });

      if (!response.ok) {
        let serverErrorMsg = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === 'object') {
            if (errorData.message) {
              serverErrorMsg = errorData.message;
            } else if (errorData.error) {
              serverErrorMsg =
                typeof errorData.error === 'string'
                  ? errorData.error
                  : JSON.stringify(errorData.error);
            }
          }
        } catch {
          try {
            const errorText = await response.text();
            if (errorText && errorText.trim().length > 0 && errorText.length < 200) {
              serverErrorMsg = errorText.trim();
            }
          } catch {
            // Keep default message if reading text fails
          }
        }
        throw new Error(serverErrorMsg);
      }

      const data: ChatResponse = await response.json();

      const agentMessage: ChatMessage = {
        id: createMessageId(),
        role: 'agent',
        text: data.agentTranscript,
        timestamp: Date.now(),
        missingSlots: data.missingSlots,
        schemes: data.eligibleSchemes,
      };

      set((state) => ({
        messages: [...state.messages, agentMessage],
        status: 'idle',
        error: null,
        lastFailedSubmission: null,
      }));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Network error: Failed to connect to server';
      set({
        status: 'error',
        error: errorMessage,
        lastFailedSubmission: {
          audioBase64,
          transcriptPreview,
        },
      });
    }
  },
}));

