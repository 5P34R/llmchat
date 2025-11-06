import { NextRequest, NextResponse } from 'next/server';
import { a4fClient, DEFAULT_MODEL } from '@/lib/openai';
import { ChatCompletionRequest } from '@/types/chat';
import { getSessionMessages } from '@/lib/storage';

// Retry configuration for stability
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 60000; // 60 seconds for longer responses
const DEFAULT_MAX_TOKENS = 20000; // Maximum token limit as requested
const MAX_CONTEXT_MESSAGES = 30; // Increased context window for better history

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequestWithRetry(
  model: string,
  messages: any[],
  temperature: number,
  maxTokens: number,
  stream: boolean = false,
  retries = MAX_RETRIES
): Promise<any> {
  try {
    // Create a timeout promise with longer timeout for streaming
    const timeoutMs = stream ? TIMEOUT * 2 : TIMEOUT;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    // Race between the API call and timeout
    const completion = await Promise.race([
      a4fClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: stream,
      }),
      timeoutPromise
    ]);

    return completion;
  } catch (error: any) {
    // Retry on server errors, rate limits, or timeouts
    if (retries > 0 && (error.status === 500 || error.status === 429 || error.message === 'Request timeout')) {
      console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1));
      return makeRequestWithRetry(model, messages, temperature, maxTokens, stream, retries - 1);
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
    const useStreaming = body.stream !== false; // Enable streaming by default
    
    console.log('Using model:', modelToUse, useThoughtChain ? '(with chain of thought)' : '', sessionId ? `Session: ${sessionId}` : '');

    let messages = body.messages;

    // Note: Session context should be handled on the client side since this is a server-side API route
    // The client should send all relevant messages in the request
    if (sessionId) {
      console.log(`Processing request for session: ${sessionId}`);
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
6. Provide complete and comprehensive answers without cutting off mid-response

Use clear, structured thinking to provide accurate and well-reasoned responses.`
      };

      // Check if there's already a system message
      const hasSystemMessage = messages.some(m => m.role === 'system');
      
      if (!hasSystemMessage) {
        messages = [systemPrompt, ...messages];
      }
    }

    // Calculate appropriate max tokens based on model
    const maxTokens = body.max_tokens || DEFAULT_MAX_TOKENS;
    
    // For streaming responses
    if (useStreaming) {
      try {
        const stream = await makeRequestWithRetry(
          modelToUse,
          messages,
          body.temperature || 0.7,
          maxTokens,
          true
        );

        // Create a ReadableStream to handle the streaming response
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
          async start(controller) {
            let fullContent = '';
            try {
              for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullContent += content;
                
                // Send chunk as Server-Sent Event format
                const data = JSON.stringify({
                  content: content,
                  isComplete: false
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
              
              // Send completion signal
              const finalData = JSON.stringify({
                content: '',
                isComplete: true,
                fullMessage: fullContent,
                model: modelToUse,
                sessionId: sessionId
              });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        });

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (streamError) {
        console.error('Streaming failed, falling back to regular response:', streamError);
        // Fall back to non-streaming if streaming fails
      }
    }

    // Non-streaming response (fallback or when streaming is disabled)
    const completion = await makeRequestWithRetry(
      modelToUse,
      messages,
      body.temperature || 0.7,
      maxTokens,
      false
    );

    // Extract response - check for completion reason
    const choice = completion.choices[0];
    const responseContent = choice.message.content;
    const finishReason = choice.finish_reason;

    // Warn if response was truncated
    if (finishReason === 'length') {
      console.warn('Response was truncated due to max_tokens limit');
    }

    return NextResponse.json({
      message: responseContent,
      usage: completion.usage,
      model: modelToUse,
      thoughtChain: useThoughtChain,
      sessionId: sessionId,
      finishReason: finishReason,
      truncated: finishReason === 'length'
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