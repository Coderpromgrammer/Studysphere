// ==========================================
// AI Solve Doubt API — Ollama (Qwen3.5) + z-ai fallback
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { buildSolvePrompt } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/ai/rate-limit';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://api.ollama.com';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:latest';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';

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

    // PRIMARY: Try Ollama Chat Completions API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

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
          messages,
          max_tokens: 3072,
          temperature: 0.4,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || '';
        if (aiResponse) {
          // Strip <think/> tags
          aiResponse = aiResponse.replace(/<think[\s\S]*?<\/think>/g, '').trim();
        }
      } else {
        const errorText = await response.text();
        console.error('Ollama Solve API error:', response.status, errorText);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Ollama Solve API failed:', err.message);
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
      aiResponse = "I'm having connection issues right now. Please check your Ollama cloud configuration (OLLAMA_BASE_URL and OLLAMA_API_KEY in .env) and try again!";
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Solve API error:', error);
    return NextResponse.json({ error: 'Failed to solve doubt' }, { status: 500 });
  }
}
