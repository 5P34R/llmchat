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
              w-full max-w-[95%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%]
              p-2 sm:p-3 md:p-4
              transition-all duration-200
              rounded-lg
              ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-2 sm:ml-4 md:ml-8'
                  : 'bg-muted mr-2 sm:mr-4 md:mr-8'
              }
            `}
          >
            {message.fileData && (
              <div className="mb-2 pb-2 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs opacity-80">
                  <span>📎</span>
                  <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
                    {message.fileData.name}
                  </span>
                  <span className="text-[10px] sm:text-xs">
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
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              {mounted && (
                <div className="text-[10px] sm:text-xs opacity-60">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
              {message.sessionId && (
                <code className="text-[10px] sm:text-xs font-mono opacity-40">
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