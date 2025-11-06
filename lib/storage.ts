import { Message, ChatSession } from '@/types/chat';

interface StoredConversation {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  lastMessage: string;
}

const STORAGE_KEY = 'llm-chat-conversations';
const MAX_CONVERSATIONS = 50; // Limit total conversations
const MAX_MESSAGES_PER_CONVERSATION = 100; // Limit messages per conversation
const MAX_MESSAGE_LENGTH = 5000; // Truncate very long messages

// Compress message content to reduce storage size
function compressMessage(message: Message): Message {
  return {
    ...message,
    content: message.content.slice(0, MAX_MESSAGE_LENGTH),
    fileData: message.fileData ? {
      ...message.fileData,
      content: message.fileData.content.slice(0, MAX_MESSAGE_LENGTH)
    } : undefined
  };
}

// Get all conversations from localStorage
export function getStoredConversations(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const conversations: ChatSession[] = JSON.parse(stored);
    return conversations;
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

// Save conversations to localStorage with size optimization
export function saveConversations(conversations: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Limit number of conversations
    const limitedConversations = conversations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_CONVERSATIONS);
    
    // Compress messages in each conversation
    const optimizedConversations = limitedConversations.map(conv => ({
      ...conv,
      messages: conv.messages
        .slice(-MAX_MESSAGES_PER_CONVERSATION) // Keep only recent messages
        .map(compressMessage)
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(optimizedConversations));
  } catch (error) {
    console.error('Error saving conversations:', error);
    
    // If storage is full, try to save with fewer conversations
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      try {
        const reducedConversations = conversations
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20) // Reduce to 20 conversations
          .map(conv => ({
            ...conv,
            messages: conv.messages.slice(-50).map(compressMessage) // Keep only 50 messages
          }));
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedConversations));
      } catch (retryError) {
        console.error('Failed to save even with reduced data:', retryError);
      }
    }
  }
}

// Get storage usage information
export function getStorageInfo(): { used: number; total: number; percentage: number } {
  if (typeof window === 'undefined') return { used: 0, total: 0, percentage: 0 };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const used = stored ? new Blob([stored]).size : 0;
    const total = 5 * 1024 * 1024; // Assume 5MB limit (typical for localStorage)
    const percentage = (used / total) * 100;
    
    return { used, total, percentage };
  } catch (error) {
    return { used: 0, total: 0, percentage: 0 };
  }
}

// Clear old conversations to free up space
export function clearOldConversations(keepCount: number = 20): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = getStoredConversations();
    const recentConversations = conversations
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, keepCount);
    
    saveConversations(recentConversations);
  } catch (error) {
    console.error('Error clearing old conversations:', error);
  }
}

// Delete a specific conversation
export function deleteConversation(conversationId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = getStoredConversations();
    const filtered = conversations.filter(conv => conv.id !== conversationId);
    saveConversations(filtered);
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

// Export conversations as JSON for backup
export function exportConversations(): string {
  const conversations = getStoredConversations();
  return JSON.stringify(conversations, null, 2);
}

// Import conversations from JSON
export function importConversations(jsonData: string): boolean {
  try {
    const conversations: ChatSession[] = JSON.parse(jsonData);
    saveConversations(conversations);
    return true;
  } catch (error) {
    console.error('Error importing conversations:', error);
    return false;
  }
}

// Get conversation by session ID
export function getConversationById(sessionId: string): ChatSession | null {
  const conversations = getStoredConversations();
  return conversations.find(conv => conv.id === sessionId) || null;
}

// Get all messages for a session
export function getSessionMessages(sessionId: string): Message[] {
  const conversation = getConversationById(sessionId);
  return conversation?.messages || [];
}