// ==========================================
// AI Quiz Generation API — Ollama (qwen2.5vl) + z-ai fallback
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { buildQuizPrompt } from '@/lib/ai/prompts';
import { parseQuizResponse } from '@/lib/ai/parser';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { ollamaChat, OLLAMA_MODEL } from '@/lib/ai/ollama-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, difficulty, numQuestions } = body as {
      topic: string;
      difficulty: string;
      numQuestions: number;
    };

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const rateCheck = checkRateLimit('quiz');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const diff = difficulty || 'medium';
    const count = numQuestions || 5;

    const prompt = buildQuizPrompt(topic.trim(), diff, count);

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: 'You are a quiz generator. Return only valid JSON. Do not include any thinking or reasoning tags.' },
      { role: 'user', content: prompt },
    ];

    let content = '';

    // PRIMARY: Try Ollama via ollama npm package
    try {
      content = await ollamaChat(messages, {
        maxTokens: 4096,
        temperature: 0.4,
        timeoutMs: 60000, // 60s for quiz gen
      });
    } catch (error) {
      console.error('Ollama quiz generation failed, will try fallback:', error);
    }

    // FALLBACK: Try z-ai-web-dev-sdk
    if (!content) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages,
          max_tokens: 4096,
          temperature: 0.4,
        });
        content = completion.choices?.[0]?.message?.content || '';
        if (content) {
          content = content.trim();
        }
      } catch (error) {
        console.error('z-ai fallback failed for quiz:', error);
      }
    }

    if (!content) {
      return NextResponse.json(
        { error: `Failed to generate quiz. Please check your Ollama cloud configuration (OLLAMA_HOST and OLLAMA_MODEL in .env). Current model: ${OLLAMA_MODEL}.` },
        { status: 500 }
      );
    }

    // Parse the quiz response using our parser
    const parsedQuestions = parseQuizResponse(content);

    if (parsedQuestions.length === 0) {
      // If parser fails, try the old simple JSON array parsing as last resort
      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      let questions;
      try {
        questions = JSON.parse(cleaned);
      } catch {
        console.error('Failed to parse AI response as JSON. Raw content:', content);
        return NextResponse.json(
          { error: 'Failed to generate quiz. The AI returned an invalid format. Please try again.' },
          { status: 500 }
        );
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { error: 'Invalid quiz format generated. Please try again.' },
          { status: 500 }
        );
      }

      // Validate and clean up each question (old format)
      const validatedQuestions = questions.map(
        (q: { question?: string; options?: string[]; correctIdx?: number }, i: number) => {
          if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correctIdx !== 'number') {
            throw new Error(`Invalid question format at index ${i}`);
          }
          const opts = q.options.slice(0, 4);
          while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
          return {
            question: q.question,
            options: opts,
            correctIdx: Math.min(Math.max(0, q.correctIdx), 3),
          };
        }
      );

      return NextResponse.json({ questions: validatedQuestions });
    }

    // Validate and ensure proper format from parsed questions
    const validatedQuestions = parsedQuestions.map((q) => {
      const opts = q.options.slice(0, 4);
      while (opts.length < 4) opts.push(`Option ${opts.length + 1}`);
      return {
        question: q.question,
        options: opts,
        correctIdx: Math.min(Math.max(0, q.correctIdx), 3),
      };
    });

    return NextResponse.json({ questions: validatedQuestions });
  } catch (error) {
    console.error('Quiz Generate POST:', error);
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
  }
}
