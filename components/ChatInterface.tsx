'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Message } from '@/types/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import FileUpload from './FileUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, RefreshCw } from 'lucide-react';

interface ChatInterfaceProps {
  initialMessages?: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
  selectedModel?: string;
  onPreviewUpdate?: (content: { html?: string; css?: string; js?: string }) => void;
  sessionId?: string | null;
}

interface ErrorState {
  message: string;
  details?: string;
  retryable?: boolean;
}

export default function ChatInterface({
  initialMessages = [],
  onMessagesUpdate,
  selectedModel = 'provider-1/chatgpt-4o-latest',
  onPreviewUpdate,
  sessionId
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track if messages have been initialized
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && initialMessages.length > 0) {
      setMessages(initialMessages);
      setIsInitialized(true);
    }
  }, [initialMessages, isInitialized]);

  useEffect(() => {
    // Only update if we have messages and they're different from initial
    if (onMessagesUpdate && messages.length > 0 && isInitialized) {
      // Debounce the update to prevent rapid calls
      const timeoutId = setTimeout(() => {
        try {
          onMessagesUpdate(messages);
        } catch (err) {
          console.error('Error updating messages:', err);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, onMessagesUpdate, isInitialized]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isImageModel = useMemo(() => {
    return selectedModel?.includes('flux') ||
           selectedModel?.includes('imagen') ||
           selectedModel?.includes('dall-e') ||
           selectedModel?.includes('stable-diffusion');
  }, [selectedModel]);

  const handleFileRead = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
          reject(new Error('Failed to read file content'));
        } else {
          resolve(content);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // Set timeout for file reading
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout'));
      }, 10000);
      
      reader.onloadend = () => {
        clearTimeout(timeout);
      };
      
      reader.readAsText(file);
    });
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() && !uploadedFile) return;

    setError(null);
    setRetryCount(0);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: Date.now(),
      sessionId: sessionId || undefined,
    };

    try {
      // Handle file upload if present
      if (uploadedFile) {
        try {
          const fileContent = await handleFileRead(uploadedFile);
          
          const messageWithFile: Message = {
            ...userMessage,
            fileData: {
              name: uploadedFile.name,
              type: uploadedFile.type,
              size: uploadedFile.size,
              content: fileContent,
            },
          };

          setMessages((prev) => [...prev, messageWithFile]);
          setUploadedFile(null);
          await sendToAPI([...messages, messageWithFile]);
        } catch (fileError) {
          console.error('File processing error:', fileError);
          setError({
            message: 'Failed to process uploaded file',
            details: fileError instanceof Error ? fileError.message : 'Unknown error',
            retryable: false
          });
        }
      } else {
        setMessages((prev) => [...prev, userMessage]);
        await sendToAPI([...messages, userMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError({
        message: 'Failed to send message',
        details: err instanceof Error ? err.message : 'Unknown error',
        retryable: true
      });
    }
  }, [uploadedFile, messages, sessionId]);

  const sendToAPI = useCallback(async (currentMessages: Message[], retry = 0): Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Create new abort controller for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (isImageModel) {
        // Handle image generation
        const lastMessage = currentMessages[currentMessages.length - 1];
        
        const response = await fetch('/api/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: lastMessage.content,
            model: selectedModel,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.url) {
          throw new Error('No image URL received from API');
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.revised_prompt || 'Image generated successfully',
          imageUrl: data.url,
          timestamp: Date.now(),
          sessionId: sessionId || undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Handle text generation with proper context management
        // Use MAX_CONTEXT_MESSAGES from API for better history preservation
        const contextWindow = 30; // Increased from 10 to match API
        const messagesToSend = currentMessages.slice(-contextWindow);
        
        const apiMessages = messagesToSend.map((msg) => {
          let messageContent = msg.content;
          
          // Include file content in the message if present
          if (msg.fileData) {
            // Increase file content limit for better context
            const maxFileLength = 5000; // Increased from 2000
            const truncatedContent = msg.fileData.content.length > maxFileLength
              ? msg.fileData.content.substring(0, maxFileLength) + '...[truncated]'
              : msg.fileData.content;
            messageContent = `File: ${msg.fileData.name}\nContent:\n${truncatedContent}\n\nUser question: ${msg.content}`;
          }
          
          return {
            role: msg.role,
            content: messageContent,
          };
        });

        // Try streaming first, fall back to regular response
        const useStreaming = true;
        
        if (useStreaming) {
          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: apiMessages,
                model: selectedModel,
                sessionId: sessionId || undefined,
                stream: true,
                max_tokens: 20000, // Use the maximum token limit
              }),
              signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle streaming response
            if (response.headers.get('content-type')?.includes('text/event-stream')) {
              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              
              let assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                sessionId: sessionId || undefined,
              };
              
              // Add initial empty message
              setMessages((prev) => [...prev, assistantMessage]);
              
              let fullContent = '';
              
              if (reader) {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                      if (line.startsWith('data: ')) {
                        try {
                          const data = JSON.parse(line.slice(6));
                          
                          if (data.isComplete) {
                            // Final message with full content
                            fullContent = data.fullMessage || fullContent;
                            assistantMessage.content = fullContent;
                            
                            // Update with final message
                            setMessages((prev) => {
                              const newMessages = [...prev];
                              const lastIndex = newMessages.length - 1;
                              if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                                newMessages[lastIndex] = { ...assistantMessage };
                              }
                              return newMessages;
                            });
                            
                            // Extract code for preview
                            if (onPreviewUpdate && fullContent) {
                              extractAndUpdatePreview(fullContent);
                            }
                          } else if (data.content) {
                            // Accumulate content
                            fullContent += data.content;
                            assistantMessage.content = fullContent;
                            
                            // Update message in real-time
                            setMessages((prev) => {
                              const newMessages = [...prev];
                              const lastIndex = newMessages.length - 1;
                              if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                                newMessages[lastIndex] = { ...assistantMessage, content: fullContent };
                              }
                              return newMessages;
                            });
                          }
                        } catch (parseError) {
                          console.error('Error parsing SSE data:', parseError);
                        }
                      }
                    }
                  }
                } finally {
                  reader.releaseLock();
                }
              }
            } else {
              // Fall back to regular JSON response
              const data = await response.json();
              
              if (!data.message) {
                throw new Error('No message received from API');
              }
              
              // Check if response was truncated
              if (data.truncated) {
                console.warn('Response was truncated due to token limit');
                data.message += '\n\n[Note: Response was truncated due to length limit]';
              }
              
              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: Date.now(),
                sessionId: sessionId || undefined,
              };
              
              setMessages((prev) => [...prev, assistantMessage]);
              
              // Extract code from the assistant's message for preview
              if (onPreviewUpdate && data.message) {
                extractAndUpdatePreview(data.message);
              }
            }
          } catch (streamError) {
            console.error('Streaming failed, falling back to regular request:', streamError);
            // Fall back to non-streaming request
            await sendNonStreamingRequest(apiMessages);
          }
        } else {
          await sendNonStreamingRequest(apiMessages);
        }
      }
      
      setError(null);
      setRetryCount(0);
    } catch (error: any) {
      // Handle abort
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }

      console.error('API Error:', error);
      
      // Retry logic for transient errors
      if (retry < MAX_RETRIES && 
          (error.message?.includes('timeout') || 
           error.message?.includes('network') ||
           error.message?.includes('500') ||
           error.message?.includes('502') ||
           error.message?.includes('503'))) {
        
        setRetryCount(retry + 1);
        console.log(`Retrying... (${retry + 1}/${MAX_RETRIES})`);
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retry)));
        return sendToAPI(currentMessages, retry + 1);
      }

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Failed to get response. Please try again.'}`,
        timestamp: Date.now(),
        sessionId: sessionId || undefined,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      setError({
        message: 'Failed to get response',
        details: error.message || 'Unknown error occurred',
        retryable: true
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isImageModel, selectedModel, sessionId, onPreviewUpdate]);

  const handleFileUpload = useCallback((file: File | null) => {
    setUploadedFile(file);
    if (file === null) {
      setError(null);
    }
  }, []);

  const handleClearChat = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      setUploadedFile(null);
      setError(null);
      setRetryCount(0);
      
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessageIndex = messages.findLastIndex(m => m.role === 'user');
      if (lastUserMessageIndex !== -1) {
        const messagesToRetry = messages.slice(0, lastUserMessageIndex + 1);
        setMessages(messagesToRetry);
        sendToAPI(messagesToRetry);
      }
    }
  }, [messages, sendToAPI]);

  const handleCancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setError({
        message: 'Request cancelled',
        details: 'The request was cancelled by the user',
        retryable: true
      });
    }
  }, []);

  // Extract code blocks from message content for preview
  const extractAndUpdatePreview = useCallback((content: string) => {
    if (!onPreviewUpdate) return;

    // Extract HTML code blocks
    const htmlMatch = content.match(/```(?:html|xml)\n([\s\S]*?)```/);
    const cssMatch = content.match(/```(?:css|scss|sass)\n([\s\S]*?)```/);
    const jsMatch = content.match(/```(?:javascript|js|typescript|ts)\n([\s\S]*?)```/);

    const updates: { html?: string; css?: string; js?: string } = {};
    
    if (htmlMatch) {
      updates.html = htmlMatch[1].trim();
    }
    if (cssMatch) {
      updates.css = cssMatch[1].trim();
    }
    if (jsMatch) {
      updates.js = jsMatch[1].trim();
    }

    if (Object.keys(updates).length > 0) {
      onPreviewUpdate(updates);
    }
  }, [onPreviewUpdate]);

  // Helper function for non-streaming requests
  const sendNonStreamingRequest = useCallback(async (apiMessages: any[]) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: apiMessages,
        model: selectedModel,
        sessionId: sessionId || undefined,
        stream: false,
        max_tokens: 20000, // Use the maximum token limit
      }),
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.message) {
      throw new Error('No message received from API');
    }

    // Check if response was truncated
    if (data.truncated) {
      console.warn('Response was truncated due to token limit');
      data.message += '\n\n[Note: Response was truncated due to length limit]';
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.message,
      timestamp: Date.now(),
      sessionId: sessionId || undefined,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    
    // Extract code from the assistant's message for preview
    if (onPreviewUpdate && data.message) {
      extractAndUpdatePreview(data.message);
    }
  }, [selectedModel, sessionId, onPreviewUpdate, extractAndUpdatePreview]);

  // Watch for code in messages and update preview
  useEffect(() => {
    if (messages.length > 0 && onPreviewUpdate) {
      // Get the last assistant message
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage) {
        extractAndUpdatePreview(lastAssistantMessage.content);
      }
    }
  }, [messages, extractAndUpdatePreview, onPreviewUpdate]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Chat</h2>
          {retryCount > 0 && (
            <span className="text-xs text-muted-foreground">
              Retry {retryCount}/{MAX_RETRIES}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Button
              onClick={handleCancelRequest}
              variant="ghost"
              size="sm"
              className="h-8 text-red-500 hover:text-red-600"
            >
              Cancel
            </Button>
          )}
          {error?.retryable && !isLoading && (
            <Button
              onClick={handleRetry}
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          <Button
            onClick={handleClearChat}
            variant="ghost"
            size="sm"
            className="h-8"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {error.message}
              </p>
              {error.details && (
                <p className="text-xs opacity-70 mt-1">
                  {error.details}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-background">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3 p-6 bg-card rounded-lg">
              <p className="text-lg font-medium">Welcome to AI Chat</p>
              <p className="text-sm text-muted-foreground">Start a conversation or upload a file to analyze</p>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <p>Model: {selectedModel?.split('/').pop() || 'Default'}</p>
                {sessionId && (
                  <p>Session: <code className="font-mono bg-muted px-1">{sessionId.substring(0, 8)}</code></p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} onPreviewUpdate={onPreviewUpdate} />
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-background shrink-0">
        <div className="p-4 space-y-3">
          <FileUpload
            onFileUpload={handleFileUpload}
            uploadedFile={uploadedFile}
          />
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}