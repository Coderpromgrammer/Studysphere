// ==========================================
// AI Solve Doubt API — Ollama (qwen2.5vl) + z-ai fallback
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { buildSolvePrompt } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { ollamaChat, OLLAMA_MODEL } from '@/lib/ai/ollama-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, subject, mode } = body as {
      query: string;
      subject: string;
      mode: string;
    };

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const rateCheck = checkRateLimit('solve');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const prompt = buildSolvePrompt(query.trim(), subject || 'general', mode || 'normal');

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: 'You are an expert tutor for Indian school students. Provide clear, step-by-step solutions. Do not include thinking tags.' },
      { role: 'user', content: prompt },
    ];

    let aiResponse = '';

    // PRIMARY: Try Ollama via ollama npm package
    try {
      aiResponse = await ollamaChat(messages, {
        maxTokens: 3072,
        temperature: 0.4,
        timeoutMs: 45000,
      });
    } catch (error) {
      console.error('Ollama solve failed, will try fallback:', error);
    }

    // FALLBACK: Try z-ai-web-dev-sdk
    if (!aiResponse) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages,
          max_tokens: 3072,
          temperature: 0.4,
        });
        aiResponse = completion.choices?.[0]?.message?.content || '';
        if (aiResponse) {
          aiResponse = aiResponse.trim();
        }
      } catch (error) {
        console.error('z-ai fallback failed for solve:', error);
      }
    }

    if (!aiResponse) {
      aiResponse = `I'm having connection issues right now. Please check your Ollama cloud configuration (OLLAMA_HOST and OLLAMA_MODEL in .env). Current model: ${OLLAMA_MODEL}. Try again!`;
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Solve API error:', error);
    return NextResponse.json({ error: 'Failed to solve doubt' }, { status: 500 });
  }
}
