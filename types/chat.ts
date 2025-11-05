export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  fileData?: FileData;
  imageUrl?: string;
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  content: string;
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
}