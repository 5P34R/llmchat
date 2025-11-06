'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from './theme-toggle';
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight, Hash, Trash2, X, Sparkles, Image } from 'lucide-react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { ChatSession } from '@/types/chat';

interface SidebarProps {
  conversations: ChatSession[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const AVAILABLE_MODELS: ComboboxOption[] = [
  // Text Generation Models - Claude
  { value: 'provider-7/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 ⚡', category: 'Claude Models' },
  { value: 'provider-7/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', category: 'Claude Models' },
  { value: 'provider-5/claude-3.7-sonnet-thinking', label: 'Claude 3.7 Sonnet 🧠', category: 'Claude Models' },
  { value: 'provider-5/claude-opus-4.1', label: 'Claude Opus 4.1 ⭐', category: 'Claude Models' },
  
  // Text Generation Models - GPT
  { value: 'provider-3/gpt-5-chat', label: 'GPT-5 Chat', category: 'GPT Models' },
  { value: 'provider-5/o3', label: 'O3 🚀', category: 'GPT Models' },
  { value: 'provider-1/chatgpt-4o-latest', label: 'ChatGPT 4o Latest', category: 'GPT Models' },
  
  // Text Generation Models - Other
  { value: 'provider-5/grok-4', label: 'Grok 4', category: 'Other Text Models' },
  { value: 'provider-5/grok-code-fast-1', label: 'Grok Code Fast 💻', category: 'Other Text Models' },
  { value: 'provider-3/deepseek-v3', label: 'DeepSeek V3 🔍', category: 'Other Text Models' },
  { value: 'provider-3/glm-4.5', label: 'GLM 4.5', category: 'Other Text Models' },
  
  // Research & Reasoning Models
  { value: 'provider-5/sonar', label: 'Sonar', category: 'Research & Reasoning' },
  { value: 'provider-5/sonar-reasoning', label: 'Sonar Reasoning 🧠', category: 'Research & Reasoning' },
  { value: 'provider-5/sonar-reasoning-pro', label: 'Sonar Reasoning Pro 🧠⭐', category: 'Research & Reasoning' },
  { value: 'provider-5/sonar-pro', label: 'Sonar Pro ⭐', category: 'Research & Reasoning' },
  { value: 'provider-5/sonar-pro-search', label: 'Sonar Pro Search 🔎', category: 'Research & Reasoning' },
  { value: 'provider-5/sonar-deep-research', label: 'Sonar Deep Research 📚', category: 'Research & Reasoning' },
  { value: 'provider-5/gpt-4o-search-preview-v2', label: 'GPT-4o Search Preview 🔎', category: 'Research & Reasoning' },
  
  // Coding Models
  { value: 'provider-3/qwen-3-coder-plus', label: 'Qwen 3 Coder Plus 💻⭐', category: 'Coding Models' },
  
  // Image Generation Models (NEW!)
  { value: 'provider-3/dall-e-3', label: 'DALL-E 3 🎨', category: 'Image Generation' },
  { value: 'provider-5/dall-e-3', label: 'DALL-E 3 (Alt) 🎨', category: 'Image Generation' },
  { value: 'provider-4/flux-schnell', label: 'Flux Schnell ⚡🎨', category: 'Image Generation' },
  { value: 'provider-4/flux-1.1-pro', label: 'Flux 1.1 Pro 🎨⭐', category: 'Image Generation' },
  { value: 'provider-2/stable-diffusion-xl', label: 'Stable Diffusion XL 🎨', category: 'Image Generation' },
  { value: 'provider-2/stable-diffusion-3', label: 'Stable Diffusion 3 🎨', category: 'Image Generation' },
  { value: 'provider-1/imagen-3', label: 'Imagen 3 🎨', category: 'Image Generation' },
];

export default function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  selectedModel,
  onModelChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previousModel, setPreviousModel] = useState(selectedModel);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle model change - create new chat session automatically
  const handleModelChange = useCallback((newModel: string) => {
    // Only create new chat if we're switching from a different model
    // and there are existing messages in the current conversation
    if (newModel !== previousModel) {
      const currentConversation = conversations.find(c => c.id === currentConversationId);
      const hasMessages = currentConversation && currentConversation.messages && currentConversation.messages.length > 0;
      
      // If current conversation has messages, create a new chat
      // This prevents mixing responses from different models
      if (hasMessages) {
        onNewChat(); // Create new chat session
      }
      
      setPreviousModel(newModel);
      onModelChange(newModel); // Update the model
    }
  }, [previousModel, conversations, currentConversationId, onNewChat, onModelChange]);

  if (isCollapsed) {
    return (
      <div className="w-16 bg-background flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <ThemeToggle />
      </div>
    );
  }

  return (
    <div className="w-64 lg:w-72 bg-background border-r flex flex-col h-full">
      <div className="p-3 sm:p-4 flex items-center justify-between">
        <h2 className="font-semibold tracking-tight text-sm sm:text-base">LLM Chat</h2>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 sm:h-9 sm:w-9 hidden lg:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <Button
          onClick={onNewChat}
          className="w-full justify-start text-xs sm:text-sm"
          size="sm"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          New Chat
        </Button>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Settings className="h-3 w-3" />
            Model Selection
            {selectedModel && (
              selectedModel.includes('dall-e') ||
              selectedModel.includes('flux') ||
              selectedModel.includes('stable-diffusion') ||
              selectedModel.includes('imagen')
            ) && (
              <span className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                <Image className="h-3 w-3" />
                Image
              </span>
            )}
          </label>
          <Combobox
            options={AVAILABLE_MODELS}
            value={selectedModel}
            onValueChange={handleModelChange}
            placeholder="Search and select a model..."
            searchPlaceholder="Search models..."
            emptyText="No model found."
            className="w-full text-xs sm:text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Recent Conversations
          </h3>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative p-2 sm:p-3 cursor-pointer transition-all duration-200
                  ${
                    currentConversationId === conv.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }
                `}
              >
                {deleteConfirmId === conv.id ? (
                  // Delete confirmation view
                  <div className="flex flex-col gap-2 p-1">
                    <p className="text-xs font-medium">
                      Delete this conversation?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteConversation) {
                            onDeleteConversation(conv.id);
                          }
                          setDeleteConfirmId(null);
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal conversation view
                  <div
                    className="flex items-start gap-2"
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare className={`h-3 w-3 sm:h-4 sm:w-4 mt-0.5 shrink-0 ${
                      currentConversationId === conv.id ? '' : 'opacity-60'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs sm:text-sm font-medium truncate flex-1">
                          {conv.title}
                        </p>
                        {onDeleteConversation && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(conv.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Hash className={`h-2 w-2 ${
                            currentConversationId === conv.id ? '' : 'opacity-40'
                          }`} />
                          <code className={`text-[10px] font-mono ${
                            currentConversationId === conv.id ? '' : 'opacity-50'
                          }`}>
                            {conv.shortId}
                          </code>
                        </div>
                        {mounted && (
                          <span className={`text-[10px] ${
                            currentConversationId === conv.id ? '' : 'opacity-50'
                          }`}>
                            {new Date(conv.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {conv.metadata && (
                        <p className={`text-[10px] mt-0.5 ${
                          currentConversationId === conv.id ? '' : 'opacity-50'
                        }`}>
                          {conv.metadata.messageCount} messages
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}