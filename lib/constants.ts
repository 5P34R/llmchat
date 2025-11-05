// Application constants for production deployment
export const APP_CONFIG = {
  // API Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 30000,
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_EXTENSIONS: [
    '.txt', '.md', '.json', '.csv', '.html', '.css', '.js', '.jsx', 
    '.ts', '.tsx', '.xml', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
    '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.log',
    '.sql', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd'
  ],
  
  // Message Input
  MAX_MESSAGE_LENGTH: parseInt(process.env.NEXT_PUBLIC_MAX_MESSAGE_LENGTH || '10000'),
  
  // Code Execution
  EXECUTION_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_EXECUTION_TIMEOUT || '10000'),
  
  // UI Configuration
  DEBOUNCE_DELAY: 100,
  AUTOSAVE_INTERVAL: 5000,
  
  // Storage
  STORAGE_KEY: 'llm_chat_conversations',
  MAX_STORED_CONVERSATIONS: 50,
  
  // Preview Panel
  PREVIEW_REFRESH_DELAY: 500,
  
  // Security
  SANDBOX_PERMISSIONS: 'allow-scripts allow-same-origin',
} as const;

// Supported languages for code execution
export const SUPPORTED_LANGUAGES = {
  EXECUTION: ['javascript', 'js', 'typescript', 'ts', 'python', 'html', 'css'],
  BEAUTIFY: ['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx', 'html', 'xml', 'css', 'scss', 'sass', 'less'],
  PREVIEW: ['html', 'xml', 'css', 'scss', 'sass'],
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  INVALID_INPUT: 'Invalid input. Please check your data and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size.',
  UNSUPPORTED_FILE: 'File type not supported.',
  EXECUTION_FAILED: 'Code execution failed. Please check your code for errors.',
  API_ERROR: 'API error occurred. Please try again later.',
  STORAGE_FULL: 'Local storage is full. Please clear some conversations.',
} as const;

// Default models
export const DEFAULT_MODELS = {
  TEXT: 'provider-7/claude-haiku-4-5-20251001',
  IMAGE: 'provider-1/dall-e-3',
} as const;