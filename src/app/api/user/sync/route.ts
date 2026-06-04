import { NextRequest, NextResponse } from 'next/server';
import { users, ObjectId } from '@/lib/db';

// POST /api/user/sync - Sync Clerk user to our DB
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, email, name, avatar } = body;

    if (!clerkId || !email) {
      return NextResponse.json({ error: 'clerkId and email required' }, { status: 400 });
    }

    const collection = await users();

    // Upsert: find by clerkId, update or create
    const result = await collection.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          email,
          name: name || null,
          avatar: avatar || null,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          clerkId,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const user = result;
    if (!user) {
      return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }

    // Convert ObjectId to string for JSON serialization
    const serializedUser = {
      id: user._id.toString(),
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({ user: serializedUser });
  } catch (error) {
    console.error('User Sync POST:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}
