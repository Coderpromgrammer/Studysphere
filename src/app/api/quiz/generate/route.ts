import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const HF_API_URL = 'https://api-inference.huggingface.co/models/cloudbjorn/Qwen3.6-27B_Samantha-Uncensored';
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, difficulty, numQuestions } = body;

    if (!topic || !difficulty || !numQuestions) {
      return NextResponse.json({ error: 'topic, difficulty, and numQuestions required' }, { status: 400 });
    }

    const diffLabel = difficulty === 'easy' ? 'Easy (beginner-friendly)' : difficulty === 'medium' ? 'Medium (intermediate)' : 'Hard (advanced)';

    const prompt = `Generate a multiple-choice quiz about "${topic}" with ${numQuestions} questions at ${diffLabel} difficulty level.

IMPORTANT: You must respond with ONLY a valid JSON array. No markdown, no explanation, just the JSON array.

Each element in the array must be an object with exactly these fields:
- "question": string - the quiz question
- "options": array of exactly 4 strings - the multiple choice options
- "correctIdx": number (0-3) - the index of the correct answer in the options array

Example format:
[
  {
    "question": "What is X?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIdx": 0
  }
]

Generate ${numQuestions} questions now:`;

    let content = '';

    // Try HuggingFace Inference API first
    try {
      const hfResponse = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'cloudbjorn/Qwen3.6-27B_Samantha-Uncensored',
          messages: [
            {
              role: 'system',
              content: 'You are a quiz generation assistant. You must respond with ONLY valid JSON arrays. No markdown formatting, no code blocks, no explanation text. Just the raw JSON array.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      });

      if (hfResponse.ok) {
        const data = await hfResponse.json();
        content = data.choices?.[0]?.message?.content || data.generated_text || '';
      }
    } catch {
      console.error('HuggingFace API failed for quiz generation, falling back');
    }

    // Fallback to z-ai-web-dev-sdk if HF didn't work
    if (!content) {
      try {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a quiz generation assistant. You must respond with ONLY valid JSON arrays. No markdown formatting, no code blocks, no explanation text. Just the raw JSON array.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        });
        content = completion.choices?.[0]?.message?.content || '';
      } catch {
        console.error('Both AI providers failed for quiz generation');
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'Failed to generate quiz. All AI providers unavailable.' }, { status: 500 });
    }

    // Parse the JSON response, handling possible markdown code blocks
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json({ error: 'Failed to generate quiz. Please try again.' }, { status: 500 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Invalid quiz format generated. Please try again.' }, { status: 500 });
    }

    // Validate and clean up each question
    const validatedQuestions = questions.map((q: { question?: string; options?: string[]; correctIdx?: number }, i: number) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || typeof q.correctIdx !== 'number') {
        throw new Error(`Invalid question format at index ${i}`);
      }
      // Ensure exactly 4 options
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
