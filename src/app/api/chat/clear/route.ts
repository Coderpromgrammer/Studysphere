// Clear chat data from DB (if any was saved previously)
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const db = await getDb();

    // Drop the chatmessages collection if it exists
    const collections = await db.listCollections({ name: 'chatmessages' }).toArray();
    if (collections.length > 0) {
      await db.collection('chatmessages').drop();
      console.log('Dropped chatmessages collection');
    }

    // Also try chats collection
    const chatsCollections = await db.listCollections({ name: 'chats' }).toArray();
    if (chatsCollections.length > 0) {
      await db.collection('chats').drop();
      console.log('Dropped chats collection');
    }

    // If userId provided, also delete user-specific chat data
    if (userId) {
      try {
        await db.collection('chatmessages').deleteMany({ userId });
      } catch {
        // Collection might already be dropped
      }
    }

    return NextResponse.json({ success: true, message: 'Chat data cleared' });
  } catch (error) {
    console.error('Chat clear error:', error);
    return NextResponse.json({ error: 'Failed to clear chat data' }, { status: 500 });
  }
}
