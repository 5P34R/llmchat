'use client';

import { useState, KeyboardEvent, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Send, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const MAX_MESSAGE_LENGTH = 10000; // Maximum message length

  const validateInput = useCallback((text: string): boolean => {
    if (!text.trim()) {
      setError('Message cannot be empty');
      return false;
    }
    
    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`Message is too long (${text.length}/${MAX_MESSAGE_LENGTH} characters)`);
      return false;
    }
    
    setError(null);
    return true;
  }, []);

  const handleSubmit = useCallback(() => {
    try {
      if (validateInput(input) && !isLoading) {
        onSendMessage(input.trim());
        setInput('');
        setError(null);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  }, [input, isLoading, onSendMessage, validateInput]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    // Clear error when user starts typing
    if (error && newValue.trim()) {
      setError(null);
    }
    
    // Show warning if approaching limit
    if (newValue.length > MAX_MESSAGE_LENGTH * 0.9) {
      setError(`Approaching character limit (${newValue.length}/${MAX_MESSAGE_LENGTH})`);
    }
  }, [error]);

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 px-1">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className={`min-h-[80px] resize-none ${error ? 'border-red-500' : ''}`}
            disabled={isLoading}
            maxLength={MAX_MESSAGE_LENGTH}
            aria-label="Message input"
            aria-invalid={!!error}
            aria-describedby={error ? 'input-error' : undefined}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {input.length > 0 && (
              <span className={input.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-yellow-500' : ''}>
                {input.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim() || !!error}
          size="lg"
          className="px-6"
          aria-label={isLoading ? 'Sending message' : 'Send message'}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ml-2">Sending</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="ml-2">Send</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}