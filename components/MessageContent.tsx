'use client';

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Copy,
  Check,
  Play,
  Image as ImageIcon,
  Code2,
  Eye,
  EyeOff,
  AlertCircle,
  Terminal,
  Sparkles
} from 'lucide-react';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  imageUrl?: string;
  onPreviewUpdate?: (content: { html?: string; css?: string; js?: string }) => void;
}

interface ExecutionResult {
  output: string;
  error?: string;
  logs?: string[];
  warnings?: string[];
  executionTime?: number;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Code Beautifier Utility
class CodeBeautifier {
  static beautifyJavaScript(code: string): string {
    try {
      // Basic JavaScript/TypeScript beautification
      let formatted = code;
      
      // Fix indentation
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const formattedLines: string[] = [];
      
      for (let line of lines) {
        const trimmed = line.trim();
        
        // Decrease indent for closing braces
        if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add proper indentation
        if (trimmed.length > 0) {
          formattedLines.push('  '.repeat(indentLevel) + trimmed);
        } else {
          formattedLines.push('');
        }
        
        // Increase indent for opening braces
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
          indentLevel++;
        }
        
        // Handle single-line blocks
        if (trimmed.includes('{') && trimmed.includes('}')) {
          const openCount = (trimmed.match(/\{/g) || []).length;
          const closeCount = (trimmed.match(/\}/g) || []).length;
          indentLevel += openCount - closeCount;
        }
      }
      
      formatted = formattedLines.join('\n');
      
      // Fix spacing around operators
      formatted = formatted
        .replace(/\s*=\s*/g, ' = ')
        .replace(/\s*===\s*/g, ' === ')
        .replace(/\s*!==\s*/g, ' !== ')
        .replace(/\s*==\s*/g, ' == ')
        .replace(/\s*!=\s*/g, ' != ')
        .replace(/\s*\+=\s*/g, ' += ')
        .replace(/\s*-=\s*/g, ' -= ')
        .replace(/\s*\*=\s*/g, ' *= ')
        .replace(/\s*\/=\s*/g, ' /= ')
        .replace(/\s*&&\s*/g, ' && ')
        .replace(/\s*\|\|\s*/g, ' || ')
        .replace(/\s*\+\s*/g, ' + ')
        .replace(/\s*-\s*/g, ' - ')
        .replace(/\s*\*\s*/g, ' * ')
        .replace(/\s*\/\s*/g, ' / ')
        .replace(/\s*%\s*/g, ' % ')
        .replace(/\s*<\s*/g, ' < ')
        .replace(/\s*>\s*/g, ' > ')
        .replace(/\s*<=\s*/g, ' <= ')
        .replace(/\s*>=\s*/g, ' >= ')
        // Fix spacing in function declarations
        .replace(/function\s*\(/g, 'function (')
        .replace(/\)\s*{/g, ') {')
        .replace(/}\s*else\s*{/g, '} else {')
        .replace(/}\s*else\s+if\s*\(/g, '} else if (')
        .replace(/if\s*\(/g, 'if (')
        .replace(/for\s*\(/g, 'for (')
        .replace(/while\s*\(/g, 'while (')
        .replace(/switch\s*\(/g, 'switch (')
        // Fix spacing around commas
        .replace(/\s*,\s*/g, ', ')
        // Fix spacing around semicolons
        .replace(/\s*;\s*/g, '; ')
        .replace(/;\s*$/gm, ';')
        // Fix spacing in objects
        .replace(/{\s+}/g, '{}')
        .replace(/\[\s+\]/g, '[]')
        // Remove multiple spaces
        .replace(/ {2,}/g, ' ')
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, '');
      
      return formatted;
    } catch (error) {
      console.error('Error beautifying JavaScript:', error);
      return code;
    }
  }

  static beautifyHTML(code: string): string {
    try {
      let formatted = code;
      let indentLevel = 0;
      const lines = formatted.split('\n');
      const formattedLines: string[] = [];
      
      for (let line of lines) {
        const trimmed = line.trim();
        
        // Decrease indent for closing tags
        if (trimmed.startsWith('</') || trimmed === '/>') {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add proper indentation
        if (trimmed.length > 0) {
          formattedLines.push('  '.repeat(indentLevel) + trimmed);
        } else {
          formattedLines.push('');
        }
        
        // Increase indent for opening tags (not self-closing)
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && 
            !trimmed.endsWith('/>') && !trimmed.includes('</')) {
          // Check if it's not a void element
          const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 
                               'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
          const tagName = trimmed.match(/<(\w+)/)?.[1]?.toLowerCase();
          if (!voidElements.includes(tagName || '')) {
            indentLevel++;
          }
        }
      }
      
      formatted = formattedLines.join('\n');
      
      // Fix attribute spacing
      formatted = formatted
        .replace(/\s*=\s*"/g, '="')
        .replace(/"\s+>/g, '">')
        .replace(/\s+\/>/g, ' />')
        // Remove multiple spaces
        .replace(/ {2,}/g, ' ')
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, '');
      
      return formatted;
    } catch (error) {
      console.error('Error beautifying HTML:', error);
      return code;
    }
  }

  static beautifyCSS(code: string): string {
    try {
      let formatted = code;
      
      // Format CSS rules
      formatted = formatted
        // Add space after selector
        .replace(/([^{]+){/g, '$1 {')
        // Format properties
        .replace(/([^:]+):([^;]+);/g, (match, prop, value) => {
          return `  ${prop.trim()}: ${value.trim()};`;
        })
        // Format closing braces
        .replace(/}/g, '}\n')
        // Remove extra newlines
        .replace(/\n{3,}/g, '\n\n')
        // Fix media queries
        .replace(/@media([^{]+){/g, '@media$1 {\n')
        // Remove trailing whitespace
        .replace(/[ \t]+$/gm, '');
      
      // Reformat with proper indentation
      const lines = formatted.split('\n');
      const formattedLines: string[] = [];
      let indentLevel = 0;
      
      for (let line of lines) {
        const trimmed = line.trim();
        
        if (trimmed === '}') {
          indentLevel = Math.max(0, indentLevel - 1);
          formattedLines.push('  '.repeat(indentLevel) + trimmed);
        } else if (trimmed.endsWith('{')) {
          formattedLines.push('  '.repeat(indentLevel) + trimmed);
          indentLevel++;
        } else if (trimmed.length > 0) {
          formattedLines.push('  '.repeat(indentLevel) + trimmed);
        } else {
          formattedLines.push('');
        }
      }
      
      return formattedLines.join('\n').trim();
    } catch (error) {
      console.error('Error beautifying CSS:', error);
      return code;
    }
  }

  static beautifyCode(code: string, language: string): string {
    const lang = language.toLowerCase();
    
    switch (lang) {
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.beautifyJavaScript(code);
      case 'html':
      case 'xml':
        return this.beautifyHTML(code);
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return this.beautifyCSS(code);
      default:
        // For other languages, just do basic formatting
        return code
          .split('\n')
          .map(line => line.trimEnd())
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
    }
  }
}

// Enhanced HTML Preview Component
function HTMLPreview({ code, onClose }: { code: string; onClose: () => void }) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  
  const previewSizes = {
    desktop: { width: '100%', height: '600px' },
    tablet: { width: '768px', height: '600px' },
    mobile: { width: '375px', height: '667px' }
  };
  
  // Enhanced HTML with better error handling
  const enhancedHTML = useMemo(() => {
    // If it's a complete HTML document, use it as is
    if (code.includes('<!DOCTYPE') || code.includes('<html')) {
      return code;
    }
    
    // Otherwise, wrap in a basic HTML structure
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        ${code}
      </body>
      </html>
    `;
  }, [code]);
  
  return (
    <Card className="mt-4 p-4 not-prose">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Live Preview</span>
            <div className="flex gap-1 bg-muted rounded-md p-1">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={previewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode(mode)}
                  className="h-7 px-2 capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCode(!showCode)}
              className="h-7"
            >
              {showCode ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showCode ? 'Hide' : 'Show'} Code
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7"
            >
              Close
            </Button>
          </div>
        </div>
        
        {showCode && (
          <div className="border border-border rounded-lg p-4 bg-muted/50 max-h-64 overflow-auto">
            <pre className="text-xs font-mono">{enhancedHTML}</pre>
          </div>
        )}
        
        <div className="border border-border rounded-lg bg-background overflow-hidden">
          <div 
            className={`${previewMode !== 'desktop' ? 'mx-auto' : ''} transition-all duration-300`}
            style={previewSizes[previewMode]}
          >
            <iframe
              srcDoc={enhancedHTML}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Code Console Component
function CodeConsole({ result, language }: { result: ExecutionResult; language: string }) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <Card className="mt-2 p-4 bg-muted/50">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4" />
            Console Output
            {result.executionTime && (
              <span className="text-xs text-muted-foreground">
                ({result.executionTime}ms)
              </span>
            )}
          </div>
          {(result.logs || result.warnings) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 text-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          )}
        </div>
        
        {result.error ? (
          <div className="flex items-start gap-2 text-red-500 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <pre className="text-sm font-mono whitespace-pre-wrap break-all">
              {result.error}
            </pre>
          </div>
        ) : (
          <pre className="text-green-600 dark:text-green-400 text-sm font-mono whitespace-pre-wrap break-all">
            {result.output || 'Code executed successfully (no output)'}
          </pre>
        )}
        
        {showDetails && (
          <>
            {result.warnings && result.warnings.length > 0 && (
              <div className="border-t border-border pt-2 mt-2">
                <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                  Warnings:
                </div>
                {result.warnings.map((warning, i) => (
                  <div key={i} className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                    • {warning}
                  </div>
                ))}
              </div>
            )}
            
            {result.logs && result.logs.length > 0 && (
              <div className="border-t border-border pt-2 mt-2">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Detailed Logs:
                </div>
                {result.logs.map((log, i) => (
                  <div key={i} className="text-xs text-muted-foreground font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

// Language alias mapping for better syntax highlighting support
function getLanguageAlias(language: string): string {
  const aliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'yml': 'yaml',
    'sh': 'bash',
    'ps1': 'powershell',
    'ps': 'powershell',
    'psm1': 'powershell',
    'psd1': 'powershell',
    'bat': 'batch',
    'cmd': 'batch',
    'dockerfile': 'docker',
    'md': 'markdown',
    'vue': 'javascript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'c++': 'cpp',
    'c#': 'csharp',
    'f#': 'fsharp',
    'objective-c': 'objectivec',
    'obj-c': 'objectivec',
    'shell': 'bash',
    'zsh': 'bash',
    'ksh': 'bash',
    'csh': 'bash',
    'fish': 'bash',
    'make': 'makefile',
    'mk': 'makefile',
    'rs': 'rust',
    'go': 'go',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'swift': 'swift',
    'r': 'r',
    'R': 'r',
    'pl': 'perl',
    'pm': 'perl',
    'lua': 'lua',
    'dart': 'dart',
    'ex': 'elixir',
    'exs': 'elixir',
    'erl': 'erlang',
    'hrl': 'erlang',
    'hs': 'haskell',
    'lhs': 'haskell',
    'ml': 'ocaml',
    'mli': 'ocaml',
    'fs': 'fsharp',
    'fsi': 'fsharp',
    'fsx': 'fsharp',
    'clj': 'clojure',
    'cljs': 'clojure',
    'cljc': 'clojure',
    'edn': 'clojure',
    'scala': 'scala',
    'sc': 'scala',
    'php': 'php',
    'asp': 'aspnet',
    'aspx': 'aspnet',
    'jsp': 'java',
    'jl': 'julia',
    'nim': 'nim',
    'nims': 'nim',
    'nimble': 'nim',
    'cr': 'crystal',
    'pas': 'pascal',
    'pp': 'pascal',
    'proto': 'protobuf',
    'graphql': 'graphql',
    'gql': 'graphql',
    'sol': 'solidity',
    'vy': 'python', // Vyper uses Python-like syntax
    'tf': 'hcl', // Terraform
    'tfvars': 'hcl',
    'prisma': 'graphql', // Prisma schema has GraphQL-like syntax
    'svelte': 'javascript',
    'astro': 'javascript',
    'mdx': 'markdown',
  };
  
  return aliases[language.toLowerCase()] || language.toLowerCase();
}

export default function MessageContent({ content, role, imageUrl, onPreviewUpdate }: MessageContentProps) {
  const { theme } = useTheme();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, ExecutionResult>>({});
  const [executingCode, setExecutingCode] = useState<string | null>(null);
  const [beautifiedCodes, setBeautifiedCodes] = useState<Record<string, string>>({});

  const copyToClipboard = useCallback((code: string, id: string) => {
    // Fallback for clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
      }).catch((error) => {
        console.error('Failed to copy:', error);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopiedCode(id);
          setTimeout(() => setCopiedCode(null), 2000);
        } catch (err) {
          console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  }, []);

  const executeCode = useCallback(async (code: string, language: string, codeId: string) => {
    setExecutingCode(codeId);
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute code');
      }

      const result = await response.json();
      setExecutionResults(prev => ({
        ...prev,
        [codeId]: result,
      }));
    } catch (error: any) {
      setExecutionResults(prev => ({
        ...prev,
        [codeId]: {
          output: '',
          error: error.message || 'Failed to execute code',
        },
      }));
    } finally {
      setExecutingCode(null);
    }
  }, []);

  const beautifyCode = useCallback((code: string, language: string, codeId: string) => {
    const beautified = CodeBeautifier.beautifyCode(code, language);
    setBeautifiedCodes(prev => ({
      ...prev,
      [codeId]: beautified,
    }));
  }, []);

  const clearBeautify = useCallback((codeId: string) => {
    setBeautifiedCodes(prev => {
      const newState = { ...prev };
      delete newState[codeId];
      return newState;
    });
  }, []);

  if (role === 'user') {
    return (
      <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere max-w-full">
        {imageUrl && (
          <div className="mb-2">
            <Card className="p-2 inline-block">
              <img
                src={imageUrl}
                alt="Generated"
                className="max-w-full h-auto rounded"
                style={{ maxHeight: '300px' }}
                loading="lazy"
              />
            </Card>
          </div>
        )}
        {/* Ensure long content doesn't break layout */}
        <div className="overflow-x-auto">
          {content || ''}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to render message content</span>
          </div>
        </Card>
      }
    >
      {/* Enhanced prose styling with mobile optimization */}
      <div className="prose prose-sm max-w-none dark:prose-invert
                      prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-xl sm:prose-h1:text-2xl
                      prose-h2:text-lg sm:prose-h2:text-xl
                      prose-h3:text-base sm:prose-h3:text-lg
                      prose-h4:text-sm sm:prose-h4:text-base
                      prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300
                      prose-p:text-sm sm:prose-p:text-base
                      prose-li:text-gray-700 dark:prose-li:text-gray-300
                      prose-li:text-sm sm:prose-li:text-base
                      prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                      prose-code:text-pink-600 dark:prose-code:text-pink-400
                      prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                      prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-code:text-xs sm:prose-code:text-sm
                      prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950
                      prose-blockquote:border-l-gray-300 dark:prose-blockquote:border-l-gray-600
                      prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
                      prose-table:overflow-hidden
                      prose-th:bg-gray-100 dark:prose-th:bg-gray-800
                      prose-td:p-1 sm:prose-td:p-2 prose-th:p-1 sm:prose-th:p-2
                      prose-td:text-xs sm:prose-td:text-sm
                      prose-th:text-xs sm:prose-th:text-sm
                      overflow-x-auto w-full">
        {imageUrl && (
          <div className="mb-4 not-prose">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Generated Image</span>
              </div>
              <img 
                src={imageUrl} 
                alt="AI Generated" 
                className="w-full h-auto rounded-lg"
                loading="lazy"
              />
            </Card>
          </div>
        )}
        
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Enhanced table rendering
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {children}
              </td>
            ),
            // Enhanced list rendering
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 my-2 ml-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-1 my-2 ml-4">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm leading-relaxed">{children}</li>
            ),
            // Enhanced heading rendering
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-900 dark:text-gray-100">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">{children}</h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-base font-semibold mt-3 mb-2 text-gray-900 dark:text-gray-100">{children}</h4>
            ),
            // Enhanced paragraph rendering
            p: ({ children }) => (
              <p className="my-2 leading-relaxed text-sm">{children}</p>
            ),
            // Enhanced blockquote rendering
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-700 dark:text-gray-300">
                {children}
              </blockquote>
            ),
            // Enhanced horizontal rule
            hr: () => (
              <hr className="my-4 border-gray-200 dark:border-gray-700" />
            ),
            // Enhanced link rendering
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            ),
            // Enhanced emphasis rendering
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            // Task list support
            input: ({ type, checked, disabled }) => {
              if (type === 'checkbox') {
                return (
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    className="mr-2"
                    readOnly
                  />
                );
              }
              return null;
            },
            code({ node, className, children, ...props }: any) {
              const inline = props.inline ?? false;
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              // Ensure code is properly extracted and doesn't get cut off
              // Handle array of children (common with long code blocks)
              let rawCode = '';
              if (Array.isArray(children)) {
                rawCode = children.map(child =>
                  typeof child === 'string' ? child : String(child)
                ).join('');
              } else {
                rawCode = String(children || '');
              }
              
              // Remove trailing newline if present
              const code = rawCode.endsWith('\n') ? rawCode.slice(0, -1) : rawCode;
              const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

              if (!inline && match) {
                const isHTML = language === 'html' || language === 'xml';
                const isCSS = language === 'css' || language === 'scss' || language === 'sass';
                const isPreviewable = isHTML || isCSS;
                const isExecutable = ['javascript', 'js', 'typescript', 'ts', 'python', 'html', 'css'].includes(language);
                const displayCode = beautifiedCodes[codeId] || code;
                const isBeautified = codeId in beautifiedCodes;
                const executionResult = executionResults[codeId];
                const isExecuting = executingCode === codeId;

                return (
                  <div className="relative group not-prose my-4 w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted px-2 sm:px-4 py-2 rounded-t-lg border border-border gap-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase truncate max-w-[150px] sm:max-w-none">
                        {language}
                        {isBeautified && (
                          <span className="ml-1 sm:ml-2 text-xs text-green-600 dark:text-green-400">
                            (beautified)
                          </span>
                        )}
                      </span>
                      <div className="flex gap-1 flex-wrap justify-end w-full sm:w-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isBeautified) {
                              clearBeautify(codeId);
                            } else {
                              beautifyCode(code, language, codeId);
                            }
                          }}
                          className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
                          title={isBeautified ? "Show original" : "Beautify code"}
                        >
                          {isBeautified ? (
                            <>
                              <Code2 className="h-3 w-3 mr-1" />
                              Original
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Beautify
                            </>
                          )}
                        </Button>
                        {isExecutable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => executeCode(displayCode, language, codeId)}
                            disabled={isExecuting}
                            className="h-6 sm:h-7 px-1 sm:px-2 text-xs"
                          >
                            {isExecuting ? (
                              <>
                                <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Running
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Run
                              </>
                            )}
                          </Button>
                        )}
                        {isPreviewable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewCode(displayCode);
                              // Send to global preview panel if available
                              if (onPreviewUpdate) {
                                if (language === 'html' || language === 'xml') {
                                  onPreviewUpdate({ html: displayCode });
                                } else if (language === 'css' || language === 'scss' || language === 'sass') {
                                  onPreviewUpdate({ css: displayCode });
                                }
                              }
                            }}
                            className="h-6 sm:h-7 px-1 sm:px-2 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(displayCode, codeId)}
                          className="h-6 sm:h-7 px-1 sm:px-2 text-xs"
                        >
                          {copiedCode === codeId ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto w-full code-block-container">
                      <Suspense fallback={<div className="p-4">Loading...</div>}>
                        <SyntaxHighlighter
                          style={(theme === 'dark' ? vscDarkPlus : vs) as any}
                          language={getLanguageAlias(language)}
                          PreTag="div"
                          className="!mt-0 !rounded-t-none"
                          showLineNumbers={true}
                          wrapLines={false}
                          wrapLongLines={false}
                          lineNumberStyle={{
                            minWidth: '2.5em',
                            paddingRight: '0.75em',
                            userSelect: 'none'
                          }}
                          customStyle={{
                            margin: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            padding: '1rem',
                            overflowX: 'auto',
                            width: '100%',
                            minHeight: '3rem',
                            maxHeight: '600px'
                          }}
                          codeTagProps={{
                            style: {
                              fontSize: 'inherit',
                              lineHeight: 'inherit',
                              display: 'block'
                            }
                          }}
                        >
                          {displayCode || ' '}
                        </SyntaxHighlighter>
                      </Suspense>
                    </div>
                    
                    {executionResult && (
                      <CodeConsole result={executionResult} language={language} />
                    )}
                  </div>
                );
              }

              // Inline code
              return (
                <code
                  className={`${className || ''} px-1 py-0.5 rounded bg-white/10 dark:bg-black/20 text-sm`}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // Enhanced pre/code block rendering for better formatting
            pre: ({ children }) => {
              // Check if this is a code block or just preformatted text
              const isCodeBlock = React.isValidElement(children) &&
                                 children.props?.className?.includes('language-');
              
              if (!isCodeBlock) {
                return (
                  <pre className="whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-800 p-3 rounded-md my-2 text-sm overflow-x-auto">
                    {children}
                  </pre>
                );
              }
              
              return <>{children}</>;
            },
          }}
        >
          {/* Ensure content is properly rendered even if very long */}
          {content || ''}
        </ReactMarkdown>

        {previewCode && (
          <HTMLPreview 
            code={previewCode} 
            onClose={() => setPreviewCode(null)} 
          />
        )}
      </div>
    </ErrorBoundary>
  );
}