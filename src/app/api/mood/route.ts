import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const moods = await db.moodLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return NextResponse.json({ moods });
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
    const moodLog = await db.moodLog.create({
      data: { userId, mood, note: note || '' },
    });
    return NextResponse.json({ moodLog }, { status: 201 });
  } catch (error) {
    console.error('Mood POST:', error);
    return NextResponse.json({ error: 'Failed to log mood' }, { status: 500 });
  }
}
