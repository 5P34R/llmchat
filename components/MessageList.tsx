'use client';

import { Message } from '@/types/chat';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import MessageContent from './MessageContent';

interface MessageListProps {
  messages: Message[];
  onPreviewUpdate?: (content: { html?: string; css?: string; js?: string }) => void;
}

export default function MessageList({ messages, onPreviewUpdate }: MessageListProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`
              w-full sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%]
              p-3 sm:p-4
              transition-all duration-200
              ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-4 sm:ml-8'
                  : 'bg-muted mr-4 sm:mr-8'
              }
            `}
          >
            {message.fileData && (
              <div className="mb-2 pb-2">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm opacity-80">
                  <span>📎</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {message.fileData.name}
                  </span>
                  <span className="text-xs">
                    ({(message.fileData.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              </div>
            )}
            <MessageContent
              content={message.content}
              role={message.role}
              imageUrl={message.imageUrl}
              onPreviewUpdate={onPreviewUpdate}
            />
            <div className="flex items-center justify-between mt-2 pt-2">
              {mounted && (
                <div className="text-xs opacity-60">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
              {message.sessionId && (
                <code className="text-xs font-mono opacity-40">
                  #{message.sessionId.substring(0, 6)}
                </code>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}