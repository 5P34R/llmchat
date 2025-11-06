export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  fileData?: FileData;
  imageUrl?: string;
  sessionId?: string; // Add session tracking
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  content: string;
}

export interface ChatSession {
  id: string;
  shortId: string;
  title: string;
  timestamp: number;
  messages: Message[];
  metadata?: {
    createdAt: number;
    lastActiveAt: number;
    messageCount: number;
  };
}

export interface ChatCompletionRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  useThoughtChain?: boolean;
  sessionId?: string; // Add session context
}