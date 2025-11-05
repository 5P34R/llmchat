'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import PreviewPanel from "@/components/PreviewPanel";
import { Message } from '@/types/chat';
import { getStoredConversations, saveConversations } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

interface PreviewContent {
  html: string;
  css: string;
  js: string;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  // Use a working model as default - Claude Haiku 4.5 is fast and reliable
  const [selectedModel, setSelectedModel] = useState('provider-7/claude-haiku-4-5-20251001');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<PreviewContent>({
    html: '',
    css: '',
    js: ''
  });

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = getStoredConversations();
    if (stored.length > 0) {
      setConversations(stored);
      setCurrentConversationId(stored[0].id);
    } else {
      // Create initial conversation if none exists
      const initialConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        timestamp: Date.now(),
        messages: [],
      };
      setConversations([initialConversation]);
      setCurrentConversationId(initialConversation.id);
    }
    setIsLoaded(true);
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations, isLoaded]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      timestamp: Date.now(),
      messages: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleMessagesUpdate = (messages: Message[]) => {
    if (!currentConversationId) return;

    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === currentConversationId) {
          // Check if messages actually changed
          const messagesChanged = JSON.stringify(conv.messages) !== JSON.stringify(messages);
          
          if (!messagesChanged) {
            return conv;
          }
          
          // Update title based on first user message
          const firstUserMessage = messages.find(m => m.role === 'user');
          const title = firstUserMessage
            ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
            : 'New Conversation';
          
          return {
            ...conv,
            messages,
            title,
            timestamp: Date.now(),
          };
        }
        return conv;
      });
    });
  };

  // Handle preview content updates from ChatInterface
  const handlePreviewUpdate = useCallback((content: { html?: string; css?: string; js?: string }) => {
    setPreviewContent(prev => ({
      html: content.html !== undefined ? content.html : prev.html,
      css: content.css !== undefined ? content.css : prev.css,
      js: content.js !== undefined ? content.js : prev.js
    }));
    
    // Auto-show preview when content is added
    if ((content.html || content.css) && !showPreview) {
      setShowPreview(true);
    }
  }, [showPreview]);

  if (!isLoaded) {
    return (
      <main className="flex h-screen w-screen bg-background items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex h-screen w-screen bg-background overflow-hidden">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
      
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Chat Interface */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col h-full transition-all duration-300`}>
          <ChatInterface
            key={currentConversationId}
            initialMessages={currentConversation?.messages || []}
            onMessagesUpdate={handleMessagesUpdate}
            selectedModel={selectedModel}
            onPreviewUpdate={handlePreviewUpdate}
          />
        </div>
        
        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 h-full">
            <PreviewPanel
              htmlCode={previewContent.html}
              cssCode={previewContent.css}
              jsCode={previewContent.js}
              isVisible={true}
              onClose={() => {
                console.log('Closing preview panel');
                setShowPreview(false);
              }}
            />
          </div>
        )}
      </div>
      
      {/* Toggle Preview Button */}
      {!showPreview && (
        <Button
          onClick={() => setShowPreview(true)}
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40"
        >
          <Eye className="h-4 w-4 mr-2" />
          Show Preview
        </Button>
      )}
    </main>
  );
}