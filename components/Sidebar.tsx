'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from './theme-toggle';
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight, Hash, Trash2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const AVAILABLE_MODELS = [
  // Working Text Models (Tested & Confirmed)
  { value: 'provider-7/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 ⚡', type: 'text' },
  { value: 'provider-7/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', type: 'text' },
  { value: 'provider-5/claude-3.7-sonnet-thinking', label: 'Claude 3.7 Sonnet 🧠', type: 'text' },
  { value: 'provider-5/claude-opus-4.1', label: 'Claude Opus 4.1 ⭐', type: 'text' },
  { value: 'provider-3/gpt-5-chat', label: 'GPT-5 Chat', type: 'text' },
  { value: 'provider-5/o3', label: 'O3 🚀', type: 'text' },
  { value: 'provider-5/grok-4', label: 'Grok 4', type: 'text' },
  { value: 'provider-5/grok-code-fast-1', label: 'Grok Code Fast 💻', type: 'text' },
  // Reasoning & Research Models
  { value: 'provider-3/deepseek-v3', label: 'DeepSeek V3 🔍', type: 'text' },
  { value: 'provider-3/glm-4.5', label: 'GLM 4.5', type: 'text' },
  { value: 'provider-5/sonar', label: 'Sonar', type: 'text' },
  { value: 'provider-5/sonar-reasoning', label: 'Sonar Reasoning 🧠', type: 'text' },
  { value: 'provider-5/sonar-reasoning-pro', label: 'Sonar Reasoning Pro 🧠⭐', type: 'text' },
  { value: 'provider-5/sonar-pro', label: 'Sonar Pro ⭐', type: 'text' },
  { value: 'provider-5/sonar-pro-search', label: 'Sonar Pro Search 🔎', type: 'text' },
  { value: 'provider-5/sonar-deep-research', label: 'Sonar Deep Research 📚', type: 'text' },
  // Search Models
  { value: 'provider-5/gpt-4o-search-preview-v2', label: 'GPT-4o Search Preview 🔎', type: 'text' },
  // Coding Models
  { value: 'provider-3/qwen-3-coder-plus', label: 'Qwen 3 Coder Plus 💻⭐', type: 'text' },
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-border/40 bg-muted/30 flex flex-col items-center py-4 gap-4">
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
    <div className="w-64 lg:w-72 border-r border-border/40 bg-muted/30 flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b border-border/40 flex items-center justify-between">
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
        <Button onClick={onNewChat} className="w-full justify-start text-xs sm:text-sm" size="sm">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          New Chat
        </Button>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Settings className="h-3 w-3" />
            Model Selection
          </label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-full text-xs sm:text-sm">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value} className="text-xs sm:text-sm">
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <Card
                key={conv.id}
                className={`group relative p-2 sm:p-3 cursor-pointer hover:bg-accent transition-colors ${
                  currentConversationId === conv.id ? 'bg-accent' : ''
                }`}
              >
                {deleteConfirmId === conv.id ? (
                  // Delete confirmation view
                  <div className="flex flex-col gap-2 p-1">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
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
                        variant="outline"
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
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 text-muted-foreground shrink-0" />
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
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Hash className="h-2 w-2 text-muted-foreground" />
                          <code className="text-[10px] font-mono text-muted-foreground">
                            {conv.shortId}
                          </code>
                        </div>
                        {mounted && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(conv.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {conv.metadata && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {conv.metadata.messageCount} messages
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}