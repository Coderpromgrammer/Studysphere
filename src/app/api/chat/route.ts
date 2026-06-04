// ==========================================
// AI Chat API — HuggingFace (Qwen3) + z-ai fallback
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { buildChatPrompt } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/ai/rate-limit';

const HF_MODEL = 'Qwen/Qwen3-235B-A22B';
const HF_CHAT_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}/v1/chat/completions`;
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

const SYSTEM_PROMPT = 'You are iStud AI, a warm and encouraging study buddy for Indian school students. Keep responses concise (2-3 sentences). Help with study tips, motivation, subject questions, and time management. Be friendly but informative.';

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

    // PRIMARY: Try HuggingFace Chat Completions API with Qwen3
    if (HF_TOKEN) {
      try {
        const response = await fetch(HF_CHAT_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: HF_MODEL,
            messages: conversationMessages,
            max_tokens: 2048,
            temperature: 0.5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || '';
          if (aiResponse) {
            aiResponse = aiResponse.trim();
          }
        } else {
          const errorText = await response.text();
          console.error('HF Chat API error:', response.status, errorText);
        }
      } catch (error) {
        console.error('HuggingFace Chat API failed:', error);
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
      aiResponse = "I'm having connection issues right now. Please try again in a moment.";
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
