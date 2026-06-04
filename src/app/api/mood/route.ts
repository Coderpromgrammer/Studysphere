import { NextRequest, NextResponse } from 'next/server';
import { moodLogs, ObjectId } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const collection = await moodLogs();
    const moods = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    // Serialize ObjectIds
    const serialized = moods.map(m => ({
      id: m._id.toString(),
      mood: m.mood,
      note: m.note,
      userId: m.userId,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ moods: serialized });
  } catch (error) {
    console.error('Mood GET:', error);
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, mood, note } = body;
    if (!userId || !mood) {
      return NextResponse.json({ error: 'userId and mood required' }, { status: 400 });
    }

    const collection = await moodLogs();
    const result = await collection.insertOne({
      userId,
      mood,
      note: note || '',
      createdAt: new Date(),
    });

    return NextResponse.json({
      moodLog: {
        id: result.insertedId.toString(),
        userId,
        mood,
        note: note || '',
        createdAt: new Date(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Mood POST:', error);
    return NextResponse.json({ error: 'Failed to log mood' }, { status: 500 });
  }
}
