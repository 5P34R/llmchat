import OpenAI from 'openai';

if (!process.env.A4F_API_KEY) {
  throw new Error('A4F_API_KEY is not set in environment variables');
}

export const a4fClient = new OpenAI({
  apiKey: process.env.A4F_API_KEY,
  baseURL: process.env.A4F_BASE_URL || 'https://api.a4f.co/v1',
});

export const DEFAULT_MODEL = process.env.A4F_MODEL || 'provider-1/chatgpt-4o-latest';