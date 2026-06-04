import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/quiz?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const quizzes = await db.quiz.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { questions: true },
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Quiz GET:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

// POST /api/quiz - Save a completed quiz
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, topic, difficulty, totalQuestions, score, completedAt, questions } = body;

    if (!userId || !title || !topic || !difficulty || !totalQuestions || !questions?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const quiz = await db.quiz.create({
      data: {
        userId,
        title,
        topic,
        difficulty,
        totalQuestions,
        score: score ?? null,
        completedAt: completedAt ? new Date(completedAt) : null,
        questions: {
          create: questions.map((q: { question: string; options: string[]; correctIdx: number }) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correctIdx: q.correctIdx,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('Quiz POST:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}

// DELETE /api/quiz?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await db.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quiz DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}

// PATCH /api/quiz - Update quiz score
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, score, completedAt } = body;

    if (!id || score === undefined) {
      return NextResponse.json({ error: 'id and score required' }, { status: 400 });
    }

    const quiz = await db.quiz.update({
      where: { id },
      data: {
        score,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Quiz PATCH:', error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}
