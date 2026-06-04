import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/journal?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const entries = await db.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Journal GET:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

// POST /api/journal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, content, mood, tags } = body;
    if (!userId || !title || !content || !mood) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const entry = await db.journalEntry.create({
      data: { userId, title, content, mood, tags: tags || '' },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Journal POST:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

// DELETE /api/journal?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.journalEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Journal DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
