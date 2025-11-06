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
          <Card
            className={`
              w-full sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%]
              p-3 sm:p-4
              ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground border-primary/20 ml-4 sm:ml-8'
                  : 'bg-muted border-border/40 mr-4 sm:mr-8'
              }
            `}
          >
            {message.fileData && (
              <div className="mb-2 pb-2 border-b border-border/40">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm opacity-90">
                  <span>📎</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {message.fileData.name}
                  </span>
                  <span className="text-xs opacity-70">
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
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
              {mounted && (
                <div className="text-xs opacity-60">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
              {message.sessionId && (
                <code className="text-xs opacity-40 font-mono">
                  #{message.sessionId.substring(0, 6)}
                </code>
              )}
            </div>
          </Card>
        </div>
      ))}
    </>
  );
}