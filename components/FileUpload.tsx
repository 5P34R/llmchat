'use client';

import { ChangeEvent, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Paperclip, X, AlertCircle, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File | null) => void;
  uploadedFile: File | null;
}

// File validation configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'text/markdown',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'text/xml',
  'application/xml',
  'text/x-python',
  'text/x-java',
  'text/x-c',
  'text/x-c++',
];

const ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.json', '.csv', '.html', '.css', '.js', '.jsx', 
  '.ts', '.tsx', '.xml', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
  '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.log',
  '.sql', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd'
];

export default function FileUpload({ onFileUpload, uploadedFile }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file type by MIME type
    const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidMimeType && !hasValidExtension) {
      return `File type not supported. Please upload a text-based file (${ALLOWED_EXTENSIONS.slice(0, 10).join(', ')}, etc.)`;
    }

    // Additional validation for suspicious files
    if (file.size === 0) {
      return 'File is empty';
    }

    return null;
  }, []);

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Additional check: Try to read first few bytes to ensure it's readable
      const reader = new FileReader();
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => resolve();
        reader.onerror = () => reject(new Error('Failed to read file'));
        
        // Read first 1KB to verify it's a text file
        const slice = file.slice(0, 1024);
        reader.readAsText(slice);
      });

      // If all validations pass, upload the file
      onFileUpload(file);
      setError(null);
    } catch (err) {
      console.error('File upload error:', err);
      setError('Failed to process file. Please ensure it\'s a valid text file.');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUpload, validateFile]);

  const handleRemoveFile = useCallback(() => {
    try {
      onFileUpload(null);
      setError(null);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error removing file:', err);
      setError('Failed to remove file');
    }
  }, [onFileUpload]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const getFileIcon = useCallback((fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // You could expand this to show different icons for different file types
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  }, []);

  return (
    <div className="mb-2 space-y-2">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 px-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {uploadedFile ? (
        <Card className="flex items-center gap-2 p-3 bg-muted border-border/40">
          {getFileIcon(uploadedFile.name)}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" title={uploadedFile.name}>
              {uploadedFile.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatFileSize(uploadedFile.size)}
              {uploadedFile.type && ` • ${uploadedFile.type}`}
            </div>
          </div>
          <Button
            onClick={handleRemoveFile}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept={ALLOWED_EXTENSIONS.join(',')}
            disabled={isProcessing}
            aria-label="Upload file"
            aria-describedby="file-upload-help"
          />
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9"
            disabled={isProcessing}
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload File
                </>
              )}
            </label>
          </Button>
          <span id="file-upload-help" className="text-xs text-muted-foreground">
            Text files only (max {MAX_FILE_SIZE / (1024 * 1024)}MB)
          </span>
        </div>
      )}
    </div>
  );
}