import { NextRequest, NextResponse } from 'next/server';
import { a4fClient, DEFAULT_MODEL } from '@/lib/openai';
import { ChatCompletionRequest } from '@/types/chat';
import { getSessionMessages } from '@/lib/storage';

// Retry configuration for stability
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 30000; // 30 seconds

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequestWithRetry(
  model: string,
  messages: any[],
  temperature: number,
  maxTokens: number,
  retries = MAX_RETRIES
): Promise<any> {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), TIMEOUT);
    });

    // Race between the API call and timeout
    const completion = await Promise.race([
      a4fClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      timeoutPromise
    ]);

    return completion;
  } catch (error: any) {
    // Retry on server errors, rate limits, or timeouts
    if (retries > 0 && (error.status === 500 || error.status === 429 || error.message === 'Request timeout')) {
      console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));
      return makeRequestWithRetry(model, messages, temperature, maxTokens, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatCompletionRequest = await request.json();
    
    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    const modelToUse = body.model || DEFAULT_MODEL;
    const useThoughtChain = body.useThoughtChain !== false; // Default to true for all models
    const sessionId = body.sessionId;
    
    console.log('Using model:', modelToUse, useThoughtChain ? '(with chain of thought)' : '', sessionId ? `Session: ${sessionId}` : '');

    let messages = body.messages;

    // If session ID is provided, include previous context (last 10 messages for context window)
    if (sessionId && typeof window !== 'undefined') {
      try {
        const sessionMessages = getSessionMessages(sessionId);
        if (sessionMessages.length > 0) {
          // Get last 10 messages for context, but always include the current message
          const contextMessages = sessionMessages
            .slice(-10)
            .filter(msg => !messages.some(m => m.content === msg.content))
            .map(msg => ({
              role: msg.role,
              content: msg.content
            }));
          
          // Prepend context messages if they exist
          if (contextMessages.length > 0) {
            console.log(`Including ${contextMessages.length} context messages from session ${sessionId}`);
            messages = [...contextMessages, ...messages];
          }
        }
      } catch (error) {
        console.error('Error loading session context:', error);
        // Continue without session context if there's an error
      }
    }

    // Apply chain of thought prompting for all models (can be toggled)
    if (useThoughtChain && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      
      // Enhanced system prompt for chain of thought reasoning
      const systemPrompt = {
        role: 'system' as const,
        content: `You are a helpful AI assistant. When solving problems:
1. Break down complex questions into smaller, manageable parts
2. Think through each step logically and systematically
3. Show your reasoning process clearly
4. Verify your conclusions before presenting the final answer
5. If uncertain, acknowledge limitations and provide the best possible response

Use clear, structured thinking to provide accurate and well-reasoned responses.`
      };

      // Check if there's already a system message
      const hasSystemMessage = messages.some(m => m.role === 'system');
      
      if (!hasSystemMessage) {
        messages = [systemPrompt, ...messages];
      }
    }

    // Make request with retry logic and timeout for stability
    const completion = await makeRequestWithRetry(
      modelToUse,
      messages,
      body.temperature || 0.7,
      body.max_tokens || 2000
    );

    // Extract response
    const responseContent = completion.choices[0].message.content;

    return NextResponse.json({
      message: responseContent,
      usage: completion.usage,
      model: modelToUse,
      thoughtChain: useThoughtChain,
      sessionId: sessionId,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    // Provide detailed error messages for debugging
    const errorMessage = error.message || 'Failed to process chat request';
    const statusCode = error.status || 500;
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error.error?.message || error.message || 'Unknown error',
        model: error.model || 'unknown',
        type: error.type || 'api_error'
      },
      { status: statusCode }
    );
  }
}