import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/user/sync - Sync Clerk user to our DB
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, email, name, avatar } = body;

    if (!clerkId || !email) {
      return NextResponse.json({ error: 'clerkId and email required' }, { status: 400 });
    }

    const user = await db.user.upsert({
      where: { clerkId },
      update: {
        email,
        name: name || null,
        avatar: avatar || null,
      },
      create: {
        clerkId,
        email,
        name: name || null,
        avatar: avatar || null,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User Sync POST:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}
