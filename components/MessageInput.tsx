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
        <div className="flex items-center gap-2 text-sm text-destructive px-1">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className={`min-h-[80px] sm:min-h-[60px] resize-none pr-16 ${error ? 'border-destructive' : ''}
              border-0 bg-muted
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              transition-all duration-200`}
            disabled={isLoading}
            maxLength={MAX_MESSAGE_LENGTH}
            aria-label="Message input"
            aria-invalid={!!error}
            aria-describedby={error ? 'input-error' : undefined}
          />
          {input.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              <span className={input.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-foreground font-bold' : ''}>
                {input.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 sm:flex-col">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim() || !!error}
            size="default"
            className="flex-1 sm:flex-initial"
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
    </div>
  );
}