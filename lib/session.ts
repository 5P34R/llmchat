// Session management utilities
export function generateSessionId(): string {
  // Generate a unique session ID using timestamp and random values
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  
  // Create a session ID in format: timestamp-random-random
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

// Generate a shorter hash-like ID
export function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a SHA-256 like hash (simplified version for browser)
export async function generateHash(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 16); // Return first 16 chars for brevity
    } catch (error) {
      console.error('Error generating hash:', error);
      return generateSessionId(); // Fallback to simple ID
    }
  }
  return generateSessionId(); // Fallback for non-browser environments
}

// Session metadata interface
export interface SessionMetadata {
  id: string;
  shortId: string;
  createdAt: number;
  lastActiveAt: number;
  messageCount: number;
}

// Create session metadata
export function createSessionMetadata(): SessionMetadata {
  return {
    id: generateSessionId(),
    shortId: generateShortId(),
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    messageCount: 0
  };
}

// Update session activity
export function updateSessionActivity(metadata: SessionMetadata, newMessageCount?: number): SessionMetadata {
  return {
    ...metadata,
    lastActiveAt: Date.now(),
    messageCount: newMessageCount ?? metadata.messageCount
  };
}