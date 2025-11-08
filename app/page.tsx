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
  // Load saved model from localStorage or use default
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('selectedModel');
      return savedModel || 'provider-7/claude-haiku-4-5-20251001';
    }
    return 'provider-7/claude-haiku-4-5-20251001';
  });
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
    try {
      const stored = getStoredConversations();
      if (stored && stored.length > 0) {
        // Filter out any invalid or empty conversations
        const validConversations = stored.filter(conv =>
          conv &&
          typeof conv === 'object' &&
          conv.id &&
          conv.id.trim() !== ''
        );

        if (validConversations.length > 0) {
          // Convert old format to new format if needed
          const convertedConversations = validConversations.map((conv: any) => {
            if (!('shortId' in conv)) {
              const metadata = createSessionMetadata();
              return {
                id: conv.id,
                shortId: metadata.shortId,
                title: conv.title || 'New Conversation',
                timestamp: conv.timestamp || Date.now(),
                messages: Array.isArray(conv.messages) ? conv.messages : [],
                metadata: {
                  createdAt: conv.timestamp || Date.now(),
                  lastActiveAt: conv.timestamp || Date.now(),
                  messageCount: Array.isArray(conv.messages) ? conv.messages.length : 0
                }
              } as ChatSession;
            }
            return conv as ChatSession;
          });
          
          setConversations(convertedConversations);
          setCurrentConversationId(convertedConversations[0].id);
        } else {
          // Create initial conversation if no valid conversations exist
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
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Create a fresh conversation on error
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
      setIsLoaded(true);
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && conversations.length > 0) {
      try {
        saveConversations(conversations);
      } catch (error) {
        console.error('Error saving conversations:', error);
      }
    }
  }, [conversations, isLoaded]);

  // Save selected model to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

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
    // Find the conversation to delete
    const conversationToDelete = conversations.find(c => c.id === id);
    if (!conversationToDelete) return;

    // If this is the last conversation, create a new one
    if (conversations.length === 1) {
      // Create a new conversation
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
      
      // Replace the old conversation with the new one
      setConversations([newConversation]);
      setCurrentConversationId(newConversation.id);
      
      // Delete from storage
      deleteConversation(id);
      
      // Save the new conversation
      saveConversations([newConversation]);
      
      setIsMobileSidebarOpen(false);
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

    // Remove from state first
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    
    // Update current conversation if needed
    if (currentConversationId === id && nextConversationId) {
      setCurrentConversationId(nextConversationId);
    }
    
    // Delete from storage after state update
    deleteConversation(id);
    
    setIsMobileSidebarOpen(false); // Close sidebar on mobile after deletion
  };

  const handleMessagesUpdate = useCallback((messages: Message[]) => {
    if (!currentConversationId || !Array.isArray(messages)) return;

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
          const title = firstUserMessage && firstUserMessage.content
            ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
            : conv.title || 'New Conversation';
          
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
  }, [currentConversationId]);

  // Handle preview content updates from ChatInterface
  const handlePreviewUpdate = useCallback((content: { html?: string; css?: string; js?: string }) => {
    if (!content || typeof content !== 'object') return;
    
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
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-sm font-semibold">LLM Chat</h1>
          </div>
          {currentConversation && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Session:</span>
              <code className="text-xs font-mono bg-muted px-2 py-0.5">
                {currentConversation.shortId}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar with mobile overlay */}
      <div className={`
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative z-40 h-full transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'pt-14 lg:pt-0' : ''}
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
      
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden pt-14 lg:pt-0">
        {/* Chat Interface */}
        <div className={`
          ${showPreview ? 'lg:w-1/2' : 'w-full'}
          ${showPreview ? 'h-1/2 lg:h-full' : 'h-full'}
          flex flex-col transition-all duration-300
        `}>
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
          variant="secondary"
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