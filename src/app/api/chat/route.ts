import { NextRequest, NextResponse } from 'next/server';
import { chatMessages, ObjectId } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

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

    // Get AI response
    let aiResponse: string;
    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are StudySphere AI, a warm and encouraging study buddy. Keep responses concise (2-3 sentences). Use occasional emoji. Help with study tips, motivation, subject questions, and time management.',
          },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });
      aiResponse = completion.choices?.[0]?.message?.content || "I'm having trouble thinking right now. Could you try again?";
    } catch {
      aiResponse = "I'm having connection issues. Please try again! 🌸";
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
