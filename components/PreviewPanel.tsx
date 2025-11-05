'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Smartphone, 
  Tablet, 
  Monitor,
  RefreshCw,
  Code2,
  Eye,
  EyeOff
} from 'lucide-react';

interface PreviewPanelProps {
  htmlCode?: string;
  cssCode?: string;
  jsCode?: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function PreviewPanel({
  htmlCode = '',
  cssCode = '',
  jsCode = '',
  isVisible,
  onClose
}: PreviewPanelProps) {
  // Ensure onClose is a function
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const viewportSizes = {
    desktop: { width: '100%', maxWidth: '100%' },
    tablet: { width: '768px', maxWidth: '768px' },
    mobile: { width: '375px', maxWidth: '375px' }
  };

  // Combine HTML, CSS, and JS into a complete document
  const combinedContent = useMemo(() => {
    // Check if HTML already has structure
    const hasHtmlTag = htmlCode.includes('<html') || htmlCode.includes('<!DOCTYPE');
    const hasHeadTag = htmlCode.includes('<head');
    const hasBodyTag = htmlCode.includes('<body');
    
    let finalHtml = '';
    
    if (hasHtmlTag) {
      // If it's a complete HTML document, inject CSS and JS appropriately
      finalHtml = htmlCode;
      
      // Inject CSS into head if there's CSS code
      if (cssCode && hasHeadTag) {
        const headEndIndex = finalHtml.indexOf('</head>');
        if (headEndIndex !== -1) {
          finalHtml = finalHtml.slice(0, headEndIndex) + 
            `\n<style>\n${cssCode}\n</style>\n` + 
            finalHtml.slice(headEndIndex);
        }
      } else if (cssCode && !hasHeadTag) {
        // Add head with CSS if no head exists
        const htmlIndex = finalHtml.indexOf('<html');
        const htmlEndIndex = finalHtml.indexOf('>', htmlIndex);
        if (htmlIndex !== -1 && htmlEndIndex !== -1) {
          finalHtml = finalHtml.slice(0, htmlEndIndex + 1) + 
            `\n<head>\n<style>\n${cssCode}\n</style>\n</head>\n` + 
            finalHtml.slice(htmlEndIndex + 1);
        }
      }
      
      // Inject JS before closing body tag if there's JS code
      if (jsCode && hasBodyTag) {
        const bodyEndIndex = finalHtml.indexOf('</body>');
        if (bodyEndIndex !== -1) {
          finalHtml = finalHtml.slice(0, bodyEndIndex) + 
            `\n<script>\n${jsCode}\n</script>\n` + 
            finalHtml.slice(bodyEndIndex);
        }
      }
    } else {
      // Create a complete HTML document
      finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode || '<p>No HTML content to preview</p>'}
  ${jsCode ? `<script>
    try {
      ${jsCode}
    } catch (error) {
      console.error('JavaScript Error:', error);
    }
  </script>` : ''}
</body>
</html>`;
    }
    
    return finalHtml;
  }, [htmlCode, cssCode, jsCode, refreshKey]);

  if (!isVisible) return null;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} flex flex-col bg-background border-l border-border`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Live Preview</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="h-7 w-7 p-0"
            title="Refresh preview"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          {/* View Mode Selector */}
          <div className="flex gap-1 bg-muted rounded-md p-1 mr-2">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('desktop')}
              className="h-7 w-7 p-0"
              title="Desktop view"
            >
              <Monitor className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tablet')}
              className="h-7 w-7 p-0"
              title="Tablet view"
            >
              <Tablet className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mobile')}
              className="h-7 w-7 p-0"
              title="Mobile view"
            >
              <Smartphone className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-7 w-7 p-0"
            title={showCode ? 'Hide code' : 'Show code'}
          >
            {showCode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-7 w-7 p-0 hover:bg-destructive hover:text-destructive-foreground"
            title="Close preview"
            type="button"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Code Display (Optional) */}
      {showCode && (
        <div className="border-b border-border bg-muted/50 p-3 max-h-48 overflow-auto">
          <div className="space-y-2">
            {htmlCode && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">HTML:</div>
                <pre className="text-xs font-mono bg-background p-2 rounded border border-border overflow-x-auto">
                  {htmlCode}
                </pre>
              </div>
            )}
            {cssCode && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">CSS:</div>
                <pre className="text-xs font-mono bg-background p-2 rounded border border-border overflow-x-auto">
                  {cssCode}
                </pre>
              </div>
            )}
            {jsCode && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">JavaScript:</div>
                <pre className="text-xs font-mono bg-background p-2 rounded border border-border overflow-x-auto">
                  {jsCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 p-4">
        <div 
          className={`${viewMode !== 'desktop' ? 'mx-auto border border-border rounded-lg shadow-lg' : ''} transition-all duration-300`}
          style={viewportSizes[viewMode]}
        >
          <iframe
            key={refreshKey}
            srcDoc={combinedContent}
            className="w-full h-full min-h-[600px] border-0 rounded-lg bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="Live Preview"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Mode: {viewMode}</span>
          {viewMode !== 'desktop' && (
            <span>Size: {viewportSizes[viewMode].width}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {htmlCode && <span>HTML ✓</span>}
          {cssCode && <span>CSS ✓</span>}
          {jsCode && <span>JS ✓</span>}
        </div>
      </div>
    </div>
  );
}