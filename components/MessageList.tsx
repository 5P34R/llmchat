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
            className={`max-w-[80%] p-4 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground border-primary/20'
                : 'bg-muted border-border/40'
            }`}
          >
            {message.fileData && (
              <div className="mb-2 pb-2 border-b border-border/40">
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span>📎</span>
                  <span className="font-medium">{message.fileData.name}</span>
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
            {mounted && (
              <div className="text-xs opacity-60 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            )}
          </Card>
        </div>
      ))}
    </>
  );
}