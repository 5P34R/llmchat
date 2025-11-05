'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from './theme-toggle';
import { MessageSquare, Plus, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
}

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
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
  selectedModel,
  onModelChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    <div className="w-64 border-r border-border/40 bg-muted/30 flex flex-col">
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <h2 className="font-semibold tracking-tight">LLM Chat</h2>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Button onClick={onNewChat} className="w-full justify-start" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Settings className="h-3 w-3" />
            Model Selection
          </label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            Recent Conversations
          </h3>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <Card
                key={conv.id}
                className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                  currentConversationId === conv.id ? 'bg-accent' : ''
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    {mounted && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.timestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}