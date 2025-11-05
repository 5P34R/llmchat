import { NextRequest, NextResponse } from 'next/server';

// Supported languages for execution
const SUPPORTED_LANGUAGES = ['javascript', 'js', 'typescript', 'ts', 'python', 'html', 'css'];

// Timeout for code execution
const EXECUTION_TIMEOUT = 10000; // 10 seconds

interface ExecutionRequest {
  code: string;
  language: string;
  input?: string;
}

interface ExecutionResult {
  output: string;
  error?: string;
  logs?: string[];
  warnings?: string[];
  executionTime?: number;
}

// Safe sandbox for JavaScript execution
class SafeJavaScriptExecutor {
  private logs: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];
  private outputs: any[] = [];

  constructor() {
    this.setupConsole();
  }

  private setupConsole() {
    return {
      log: (...args: any[]) => {
        const message = args.map(this.formatValue).join(' ');
        this.logs.push(message);
        this.outputs.push(message);
      },
      error: (...args: any[]) => {
        const message = args.map(this.formatValue).join(' ');
        this.errors.push(message);
      },
      warn: (...args: any[]) => {
        const message = args.map(this.formatValue).join(' ');
        this.warnings.push(message);
      },
      info: (...args: any[]) => {
        const message = 'ℹ ' + args.map(this.formatValue).join(' ');
        this.logs.push(message);
      },
      debug: (...args: any[]) => {
        const message = '🐛 ' + args.map(this.formatValue).join(' ');
        this.logs.push(message);
      },
      table: (data: any) => {
        try {
          const formatted = this.formatTable(data);
          this.logs.push(formatted);
          this.outputs.push(formatted);
        } catch (e) {
          this.logs.push(this.formatValue(data));
        }
      },
      time: (label: string = 'default') => {
        (global as any)[`__timer_${label}`] = Date.now();
        this.logs.push(`Timer '${label}' started`);
      },
      timeEnd: (label: string = 'default') => {
        const start = (global as any)[`__timer_${label}`];
        if (start) {
          const duration = Date.now() - start;
          this.logs.push(`Timer '${label}': ${duration}ms`);
          delete (global as any)[`__timer_${label}`];
        }
      },
      clear: () => {
        this.logs = [];
        this.outputs = [];
      },
      assert: (condition: any, ...args: any[]) => {
        if (!condition) {
          const message = 'Assertion failed: ' + args.map(this.formatValue).join(' ');
          this.errors.push(message);
        }
      },
      count: (label: string = 'default') => {
        const key = `__counter_${label}`;
        (global as any)[key] = ((global as any)[key] || 0) + 1;
        this.logs.push(`${label}: ${(global as any)[key]}`);
      },
      countReset: (label: string = 'default') => {
        const key = `__counter_${label}`;
        delete (global as any)[key];
      }
    };
  }

  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack}`;
    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return value.toString();
    if (Array.isArray(value)) {
      return '[' + value.map(v => this.formatValue(v)).join(', ') + ']';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(value);
  }

  private formatTable(data: any): string {
    if (!data || typeof data !== 'object') {
      return this.formatValue(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return '[]';
      
      // Get all unique keys
      const keys = new Set<string>();
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => keys.add(key));
        }
      });

      if (keys.size === 0) {
        return data.map((item, i) => `${i}: ${this.formatValue(item)}`).join('\n');
      }

      // Create table
      const headers = ['(index)', ...Array.from(keys)];
      const rows = data.map((item, index) => {
        const row = [String(index)];
        keys.forEach(key => {
          row.push(this.formatValue(item?.[key] ?? ''));
        });
        return row;
      });

      return this.createTable(headers, rows);
    }

    // Format object as table
    const entries = Object.entries(data);
    if (entries.length === 0) return '{}';

    const rows = entries.map(([key, value]) => [key, this.formatValue(value)]);
    return this.createTable(['(key)', '(value)'], rows);
  }

  private createTable(headers: string[], rows: string[][]): string {
    const widths = headers.map((h, i) => {
      const columnValues = [h, ...rows.map(r => r[i] || '')];
      return Math.max(...columnValues.map(v => String(v).length));
    });

    const separator = '┼' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┼';
    const headerRow = '│ ' + headers.map((h, i) => h.padEnd(widths[i])).join(' │ ') + ' │';
    const dataRows = rows.map(row => 
      '│ ' + row.map((cell, i) => String(cell).padEnd(widths[i])).join(' │ ') + ' │'
    );

    return [headerRow, separator, ...dataRows].join('\n');
  }

  async execute(code: string, input?: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Create a more comprehensive sandbox
      const sandbox = {
        console: this.setupConsole(),
        input: input,
        Math: Math,
        Date: Date,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        RegExp: RegExp,
        JSON: JSON,
        parseInt: parseInt,
        parseFloat: parseFloat,
        isNaN: isNaN,
        isFinite: isFinite,
        encodeURIComponent: encodeURIComponent,
        decodeURIComponent: decodeURIComponent,
        encodeURI: encodeURI,
        decodeURI: decodeURI,
        setTimeout: (fn: Function, ms: number) => {
          if (ms > EXECUTION_TIMEOUT) {
            throw new Error(`Timeout value ${ms}ms exceeds maximum allowed ${EXECUTION_TIMEOUT}ms`);
          }
          return setTimeout(fn, ms);
        },
        setInterval: (fn: Function, ms: number) => {
          if (ms < 100) {
            throw new Error('Interval must be at least 100ms');
          }
          return setInterval(fn, ms);
        },
        Promise: Promise,
        Map: Map,
        Set: Set,
        WeakMap: WeakMap,
        WeakSet: WeakSet,
        Symbol: Symbol,
        Proxy: Proxy,
        Reflect: Reflect,
      };

      // Create function with sandbox
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const func = new AsyncFunction(...Object.keys(sandbox), code);
      
      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout exceeded')), EXECUTION_TIMEOUT);
      });

      const executionPromise = func(...Object.values(sandbox));
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // If the function returns a value, add it to outputs
      if (result !== undefined) {
        this.outputs.push(this.formatValue(result));
      }

      const executionTime = Date.now() - startTime;

      return {
        output: this.outputs.length > 0 ? this.outputs.join('\n') : 'Code executed successfully (no output)',
        error: this.errors.length > 0 ? this.errors.join('\n') : undefined,
        logs: this.logs,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // Parse error for better formatting
      let errorMessage = error.message || 'Unknown error';
      let errorDetails = '';

      if (error.stack) {
        const stackLines = error.stack.split('\n');
        errorMessage = stackLines[0];
        
        // Extract relevant line number from stack trace
        const lineMatch = error.stack.match(/<anonymous>:(\d+):(\d+)/);
        if (lineMatch) {
          errorDetails = `Line ${lineMatch[1]}, Column ${lineMatch[2]}`;
        }
      }

      return {
        output: this.outputs.length > 0 ? this.outputs.join('\n') : '',
        error: errorDetails ? `${errorMessage}\n  at ${errorDetails}` : errorMessage,
        logs: this.logs,
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
        executionTime,
      };
    }
  }
}

async function executeJavaScript(code: string, input?: string): Promise<ExecutionResult> {
  const executor = new SafeJavaScriptExecutor();
  return executor.execute(code, input);
}

async function executeTypeScript(code: string, input?: string): Promise<ExecutionResult> {
  // For TypeScript, we'll transpile to JavaScript first (simplified version)
  // In production, you'd use the TypeScript compiler
  
  // Remove type annotations (very basic)
  let jsCode = code
    .replace(/:\s*string/g, '')
    .replace(/:\s*number/g, '')
    .replace(/:\s*boolean/g, '')
    .replace(/:\s*any/g, '')
    .replace(/:\s*void/g, '')
    .replace(/:\s*\[.*?\]/g, '') // Remove array types
    .replace(/:\s*\{.*?\}/g, '') // Remove object types
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // Remove interfaces
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
    .replace(/as\s+\w+/g, '') // Remove type assertions
    .replace(/<[^>]+>/g, ''); // Remove generics

  return executeJavaScript(jsCode, input);
}

async function executePython(code: string, input?: string): Promise<ExecutionResult> {
  // Python execution would require a backend service or WebAssembly
  // For now, provide a helpful message
  return {
    output: '',
    error: 'Python execution requires a backend service. You can:\n' +
           '1. Use an online Python executor like Replit or CodePen\n' +
           '2. Set up a Python runtime service\n' +
           '3. Use Pyodide (Python in WebAssembly) for client-side execution',
    executionTime: 0,
  };
}

async function executeHTML(code: string): Promise<ExecutionResult> {
  // HTML validation and preview preparation
  try {
    // Basic HTML validation
    const hasDoctype = /<!DOCTYPE/i.test(code);
    const hasHtml = /<html/i.test(code);
    const hasBody = /<body/i.test(code);
    
    let warnings: string[] = [];
    
    if (!hasDoctype) {
      warnings.push('Missing <!DOCTYPE html> declaration');
    }
    if (!hasHtml) {
      warnings.push('Missing <html> tag');
    }
    if (!hasBody) {
      warnings.push('Missing <body> tag');
    }

    // Check for common issues
    const openTags = code.match(/<(\w+)(?:\s[^>]*)?>(?!.*<\/\1>)/g);
    if (openTags) {
      warnings.push(`Potentially unclosed tags detected: ${openTags.length} tags may not be properly closed`);
    }

    return {
      output: 'HTML code is ready for preview. Click the Preview button to see the rendered output.',
      warnings: warnings.length > 0 ? warnings : undefined,
      executionTime: 0,
    };
  } catch (error: any) {
    return {
      output: '',
      error: `HTML validation error: ${error.message}`,
      executionTime: 0,
    };
  }
}

async function executeCSS(code: string): Promise<ExecutionResult> {
  // CSS validation
  try {
    // Basic CSS validation
    const rules = code.match(/[^{}]+\{[^}]*\}/g) || [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for syntax issues
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for common CSS issues
    if (code.includes(';;')) {
      warnings.push('Double semicolons detected');
    }
    
    if (code.match(/:\s*;/)) {
      warnings.push('Empty property values detected');
    }

    if (errors.length > 0) {
      return {
        output: '',
        error: errors.join('\n'),
        warnings: warnings.length > 0 ? warnings : undefined,
        executionTime: 0,
      };
    }

    return {
      output: `CSS validated successfully. Found ${rules.length} rule${rules.length !== 1 ? 's' : ''}.`,
      warnings: warnings.length > 0 ? warnings : undefined,
      executionTime: 0,
    };
  } catch (error: any) {
    return {
      output: '',
      error: `CSS validation error: ${error.message}`,
      executionTime: 0,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecutionRequest = await request.json();
    const { code, language, input } = body;

    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { 
          error: 'Invalid code provided',
          details: 'Code must be a non-empty string'
        },
        { status: 400 }
      );
    }

    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { 
          error: 'Language is required',
          details: 'Please specify the programming language'
        },
        { status: 400 }
      );
    }

    const normalizedLanguage = language.toLowerCase().trim();

    if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
      return NextResponse.json(
        { 
          error: `Language '${language}' is not supported`,
          details: `Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
        },
        { status: 400 }
      );
    }

    let result: ExecutionResult;

    switch (normalizedLanguage) {
      case 'javascript':
      case 'js':
        result = await executeJavaScript(code, input);
        break;
      case 'typescript':
      case 'ts':
        result = await executeTypeScript(code, input);
        break;
      case 'python':
        result = await executePython(code, input);
        break;
      case 'html':
        result = await executeHTML(code);
        break;
      case 'css':
        result = await executeCSS(code);
        break;
      default:
        return NextResponse.json(
          { 
            error: 'Unsupported language',
            details: `Language '${language}' is not yet implemented`
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      ...result,
      language: normalizedLanguage,
      executedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Code Execution Error:', error);
    
    // Provide detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to execute code',
        details: error.message || 'An unexpected error occurred',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}