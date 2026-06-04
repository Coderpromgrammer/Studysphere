import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple auth - create/get user by email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: { email, name: name || email.split('@')[0] },
      });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth POST:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
