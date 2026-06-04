import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const sessions = await db.focusSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 30,
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    // Calculate streak
    let streak = 0;
    const daySet = new Set(sessions.map(s => new Date(s.completedAt).toDateString()));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    if (!daySet.has(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (daySet.has(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return NextResponse.json({ sessions, totalMinutes, streak });
  } catch (error) {
    console.error('Focus GET:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, duration } = body;
    if (!userId || !duration) {
      return NextResponse.json({ error: 'userId and duration required' }, { status: 400 });
    }
    const session = await db.focusSession.create({
      data: { userId, duration },
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Focus POST:', error);
    return NextResponse.json({ error: 'Failed to log session' }, { status: 500 });
  }
}
