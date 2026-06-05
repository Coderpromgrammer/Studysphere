// ==========================================
// AI Chat API — Ollama (Qwen3.5) + z-ai fallback
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { buildChatPrompt } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/ai/rate-limit';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://api.ollama.com';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:latest';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';

const SYSTEM_PROMPT = 'You are iStud AI, a warm and encouraging study buddy for Indian school students (Classes 6-12, CBSE/ICSE). Keep responses concise (2-3 sentences). Help with study tips, motivation, subject questions, and time management. Be friendly but informative. Use examples that Indian students can relate to.';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, subject, context } = body as {
      message: string;
      history?: { role: string; content: string }[];
      subject?: string;
      context?: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const rateCheck = checkRateLimit('chat');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const prompt = buildChatPrompt(message, subject, context);

    // Build conversation messages
    const conversationMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add recent history (last 10 messages) if provided
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        conversationMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    conversationMessages.push({ role: 'user', content: prompt });

    let aiResponse = '';

    // PRIMARY: Try Ollama Chat Completions API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (OLLAMA_API_KEY) {
        headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: conversationMessages,
          max_tokens: 2048,
          temperature: 0.5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || '';
        if (aiResponse) {
          // Strip <think/> tags that Qwen3.5 may include
          aiResponse = aiResponse.replace(/<think[\s\S]*?<\/think>/g, '').trim();
        }
      } else {
        const errorText = await response.text();
        console.error('Ollama Chat API error:', response.status, errorText);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        console.error('Ollama Chat API timeout');
      } else {
        console.error('Ollama Chat API failed:', err.message);
      }
    }

    // FALLBACK: Try z-ai-web-dev-sdk
    if (!aiResponse) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: conversationMessages,
          max_tokens: 2048,
          temperature: 0.5,
        });
        aiResponse = completion.choices?.[0]?.message?.content || '';
        if (aiResponse) {
          aiResponse = aiResponse.trim();
        }
      } catch (error) {
        console.error('z-ai fallback failed:', error);
      }
    }

    if (!aiResponse) {
      aiResponse = "I'm having connection issues right now. Please check your Ollama cloud configuration (OLLAMA_BASE_URL and OLLAMA_API_KEY in .env) and try again!";
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
