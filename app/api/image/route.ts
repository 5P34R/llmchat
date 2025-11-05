import { NextRequest, NextResponse } from 'next/server';

const A4F_API_KEY = process.env.A4F_API_KEY;
const A4F_BASE_URL = process.env.A4F_BASE_URL || 'https://api.a4f.co/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'provider-2/flux.1-schnell', size = '1024x1024', n = 1 } = body;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!A4F_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('Generating image with model:', model);

    const response = await fetch(`${A4F_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A4F_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        n,
        size,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Image generation failed:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to generate image' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt,
    });
  } catch (error) {
    console.error('Image Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}