export enum AgentState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

export interface MessageLog {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export interface KnowledgeSection {
  title: string;
  content: string;
}

// Configuration for Audio Processing
export const AUDIO_CONFIG = {
  SAMPLE_RATE_INPUT: 16000,
  SAMPLE_RATE_OUTPUT: 24000,
  BUFFER_SIZE: 4096,
};