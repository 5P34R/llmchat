'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import PreviewPanel from "@/components/PreviewPanel";
import { Message, ChatSession } from '@/types/chat';
import { getStoredConversations, saveConversations, deleteConversation } from '@/lib/storage';
import { createSessionMetadata } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Menu, X } from 'lucide-react';

interface PreviewContent {
  html: string;
  css: string;
  js: string;
}

export default function Home() {
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  // Use a working model as default - Claude Haiku 4.5 is fast and reliable
  const [selectedModel, setSelectedModel] = useState('provider-7/claude-haiku-4-5-20251001');
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<PreviewContent>({
    html: '',
    css: '',
    js: ''
  });

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = getStoredConversations();
    if (stored.length > 0) {
      // Convert old format to new format if needed
      const convertedConversations = stored.map((conv: any) => {
        if (!('shortId' in conv)) {
          const metadata = createSessionMetadata();
          return {
            id: conv.id || metadata.id,
            shortId: metadata.shortId,
            title: conv.title || 'New Conversation',
            timestamp: conv.timestamp || Date.now(),
            messages: conv.messages || [],
            metadata: {
              createdAt: conv.timestamp || Date.now(),
              lastActiveAt: conv.timestamp || Date.now(),
              messageCount: conv.messages?.length || 0
            }
          } as ChatSession;
        }
        return conv as ChatSession;
      });
      setConversations(convertedConversations);
      setCurrentConversationId(convertedConversations[0].id);
    } else {
      // Create initial conversation if none exists
      const sessionMeta = createSessionMetadata();
      const initialConversation: ChatSession = {
        id: sessionMeta.id,
        shortId: sessionMeta.shortId,
        title: 'New Conversation',
        timestamp: Date.now(),
        messages: [],
        metadata: {
          createdAt: sessionMeta.createdAt,
          lastActiveAt: sessionMeta.lastActiveAt,
          messageCount: 0
        }
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
    const sessionMeta = createSessionMetadata();
    const newConversation: ChatSession = {
      id: sessionMeta.id,
      shortId: sessionMeta.shortId,
      title: 'New Conversation',
      timestamp: Date.now(),
      messages: [],
      metadata: {
        createdAt: sessionMeta.createdAt,
        lastActiveAt: sessionMeta.lastActiveAt,
        messageCount: 0
      }
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setIsMobileSidebarOpen(false); // Close sidebar on mobile after action
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setIsMobileSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleDeleteConversation = (id: string) => {
    // Don't delete if it's the only conversation
    if (conversations.length === 1) {
      // Create a new conversation instead
      handleNewChat();
      return;
    }

    // Find the next conversation to select
    const currentIndex = conversations.findIndex(c => c.id === id);
    let nextConversationId: string | null = null;
    
    if (currentIndex > 0) {
      // Select previous conversation
      nextConversationId = conversations[currentIndex - 1].id;
    } else if (currentIndex < conversations.length - 1) {
      // Select next conversation
      nextConversationId = conversations[currentIndex + 1].id;
    }

    // Remove from state
    setConversations(prev => prev.filter(c => c.id !== id));
    
    // Delete from storage
    deleteConversation(id);
    
    // Update current conversation if needed
    if (currentConversationId === id && nextConversationId) {
      setCurrentConversationId(nextConversationId);
    }
    
    setIsMobileSidebarOpen(false); // Close sidebar on mobile after deletion
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
          
          // Add session ID to messages
          const messagesWithSession = messages.map(msg => ({
            ...msg,
            sessionId: conv.id
          }));
          
          return {
            ...conv,
            messages: messagesWithSession,
            title,
            timestamp: Date.now(),
            metadata: {
              createdAt: conv.metadata?.createdAt || conv.timestamp,
              lastActiveAt: Date.now(),
              messageCount: messages.length
            }
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
    <main className="flex h-screen w-screen bg-background overflow-hidden relative">
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
      >
        {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar with mobile overlay */}
      <div className={`
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative z-40 h-full transition-transform duration-300 ease-in-out
      `}>
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* Mobile overlay backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Chat Interface */}
        <div className={`
          ${showPreview ? 'lg:w-1/2' : 'w-full'}
          ${showPreview ? 'h-1/2 lg:h-full' : 'h-full'}
          flex flex-col transition-all duration-300
        `}>
          {/* Session Info Bar for Mobile */}
          <div className="lg:hidden bg-muted/30 border-b border-border/40 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 ml-12">
              <span className="text-xs text-muted-foreground">Session:</span>
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {currentConversation?.shortId || 'none'}
              </code>
            </div>
          </div>
          
          <ChatInterface
            key={currentConversationId}
            initialMessages={currentConversation?.messages || []}
            onMessagesUpdate={handleMessagesUpdate}
            selectedModel={selectedModel}
            onPreviewUpdate={handlePreviewUpdate}
            sessionId={currentConversationId}
          />
        </div>
        
        {/* Preview Panel */}
        {showPreview && (
          <div className="
            w-full lg:w-1/2
            h-1/2 lg:h-full
            border-t lg:border-t-0 lg:border-l border-border/40
          ">
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
          className="fixed bottom-4 right-4 z-20 shadow-lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Show Preview</span>
          <span className="sm:hidden">Preview</span>
        </Button>
      )}
    </main>
  );
}