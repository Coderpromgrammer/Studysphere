import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Use a small, freely-available model on HuggingFace Inference API
const HF_MODEL = 'HuggingFaceH4/zephyr-7b-beta';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

const SYSTEM_PROMPT = 'You are iStud AI, a warm and encouraging study buddy. Keep responses concise (2-3 sentences). Help with study tips, motivation, subject questions, and time management. Be friendly but informative.';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;
    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    // Build conversation from client-side history
    const conversationMessages: { role: string; content: string }[] = [
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

    // Add current message
    conversationMessages.push({ role: 'user', content: message });

    let aiResponse = '';

    // PRIMARY: Try z-ai-web-dev-sdk
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 300,
      });
      aiResponse = completion.choices?.[0]?.message?.content || '';
      if (aiResponse) {
        aiResponse = aiResponse.trim();
      }
    } catch (error) {
      console.error('z-ai-web-dev-sdk failed for chat:', error);
    }

    // FALLBACK 1: Try HuggingFace Chat Completions API
    if (!aiResponse) {
      try {
        const hfChatUrl = 'https://api-inference.huggingface.co/v1/chat/completions';
        const response = await fetch(hfChatUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: HF_MODEL,
            messages: conversationMessages,
            max_tokens: 300,
            temperature: 0.7,
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
        console.error('HF Chat API failed:', error);
      }
    }

    // FALLBACK 2: Try HuggingFace text generation endpoint
    if (!aiResponse) {
      try {
        const prompt = `<|system|>\n${SYSTEM_PROMPT}</s>\n<|user|>\n${message}</s>\n<|assistant|)\n`;
        const response = await fetch(HF_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 300,
              temperature: 0.7,
              return_full_text: false,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data[0]?.generated_text?.trim() || '';
        }
      } catch (error) {
        console.error('HF text generation failed:', error);
      }
    }

    if (!aiResponse) {
      aiResponse = "I'm having connection issues right now. Please try again in a moment.";
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat POST:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
