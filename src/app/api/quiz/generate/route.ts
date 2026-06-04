import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Use a small, freely-available model on HuggingFace Inference API
const HF_MODEL = 'HuggingFaceH4/zephyr-7b-beta';
const HF_CHAT_URL = 'https://api-inference.huggingface.co/v1/chat/completions';
const HF_TEXT_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
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

    const systemPrompt = 'You are a quiz generation assistant. You must respond with ONLY valid JSON arrays. No markdown formatting, no code blocks, no explanation text. Just the raw JSON array.';

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    let content = '';

    // PRIMARY: Try z-ai-web-dev-sdk
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages,
        temperature: 0.8,
        max_tokens: 2000,
      });
      content = completion.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('z-ai-web-dev-sdk failed for quiz generation:', error);
    }

    // FALLBACK 1: Try HuggingFace Chat Completions API
    if (!content) {
      try {
        const response = await fetch(HF_CHAT_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: HF_MODEL,
            messages,
            temperature: 0.8,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          content = data.choices?.[0]?.message?.content || '';
        } else {
          const errorText = await response.text();
          console.error('HF Chat API error for quiz:', response.status, errorText);
        }
      } catch (error) {
        console.error('HuggingFace Chat API failed for quiz generation:', error);
      }
    }

    // FALLBACK 2: Try HuggingFace text generation endpoint
    if (!content) {
      try {
        const textPrompt = `<|system|>\n${systemPrompt}</s>\n<|user|>\n${prompt}</s>\n<|assistant|)\n`;
        const response = await fetch(HF_TEXT_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: textPrompt,
            parameters: {
              max_new_tokens: 2000,
              temperature: 0.8,
              return_full_text: false,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          content = data[0]?.generated_text || '';
        }
      } catch (error) {
        console.error('HuggingFace text generation failed for quiz:', error);
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

    // Try to extract JSON array from the response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response as JSON. Raw content:', content);
      return NextResponse.json({ error: 'Failed to generate quiz. The AI returned an invalid format. Please try again.' }, { status: 500 });
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
