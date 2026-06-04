import { NextRequest, NextResponse } from 'next/server';
import { chatMessages } from '@/lib/db';

const HF_API_URL = 'https://api-inference.huggingface.co/models/cloudbjorn/Qwen3.6-27B_Samantha-Uncensored';
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const collection = await chatMessages();
    const messages = await collection
      .find({ userId })
      .sort({ createdAt: 1 })
      .limit(50)
      .toArray();

    const serialized = messages.map(m => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      userId: m.userId,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ messages: serialized });
  } catch (error) {
    console.error('Chat GET:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, message } = body;
    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message required' }, { status: 400 });
    }

    const collection = await chatMessages();

    // Save user message
    await collection.insertOne({
      userId,
      role: 'user',
      content: message,
      createdAt: new Date(),
    });

    // Get recent conversation context (last 10 messages)
    const recentMessages = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const contextMessages = recentMessages.reverse().map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    // Get AI response using HuggingFace Inference API
    let aiResponse: string;
    try {
      const systemPrompt = 'You are iStud AI, a warm and encouraging study buddy. Keep responses concise (2-3 sentences). Help with study tips, motivation, subject questions, and time management. Be friendly but informative.';

      // Build the prompt for the model
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
      ];

      const response = await fetch(HF_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'cloudbjorn/Qwen3.6-27B_Samantha-Uncensored',
          messages: formattedMessages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content ||
                     data.generated_text ||
                     "I'm having trouble thinking right now. Could you try again?";
        // Clean up any leading/trailing whitespace
        aiResponse = aiResponse.trim();
      } else {
        const errorData = await response.text();
        console.error('HuggingFace API error:', response.status, errorData);
        // Fallback: try as a text generation endpoint
        try {
          const fallbackResponse = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n`,
              parameters: {
                max_new_tokens: 300,
                temperature: 0.7,
                return_full_text: false,
              },
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            aiResponse = fallbackData[0]?.generated_text?.trim() || "I'm having trouble thinking right now.";
          } else {
            aiResponse = "I'm having connection issues with the AI service. Please try again in a moment.";
          }
        } catch {
          aiResponse = "I'm having connection issues. Please try again!";
        }
      }
    } catch (error) {
      console.error('Chat AI error:', error);
      aiResponse = "I'm having connection issues. Please try again!";
    }

    // Save AI message
    await collection.insertOne({
      userId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date(),
    });

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat POST:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
