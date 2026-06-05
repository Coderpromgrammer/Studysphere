// ==========================================
// AI Chat API — Ollama (qwen2.5vl) + z-ai fallback
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { buildChatPrompt } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { ollamaChat, OLLAMA_MODEL } from '@/lib/ai/ollama-client';

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

    // PRIMARY: Try Ollama via ollama npm package
    try {
      aiResponse = await ollamaChat(conversationMessages, {
        maxTokens: 2048,
        temperature: 0.5,
        timeoutMs: 30000,
      });
    } catch (error) {
      console.error('Ollama chat failed, will try fallback:', error);
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
      aiResponse = `I'm having connection issues right now. Please check your Ollama cloud configuration (OLLAMA_HOST and OLLAMA_MODEL in .env). Current model: ${OLLAMA_MODEL}. Try again!`;
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
