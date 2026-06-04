import { NextRequest, NextResponse } from 'next/server';
import { quizzes, quizQuestions, ObjectId } from '@/lib/db';

// GET /api/quiz?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const quizCollection = await quizzes();
    const questionCollection = await quizQuestions();

    const quizDocs = await quizCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch questions for each quiz
    const quizzesWithQuestions = await Promise.all(
      quizDocs.map(async (quiz) => {
        const questions = await questionCollection
          .find({ quizId: quiz._id.toString() })
          .toArray();

        return {
          id: quiz._id.toString(),
          title: quiz.title,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          score: quiz.score,
          totalQuestions: quiz.totalQuestions,
          completedAt: quiz.completedAt,
          createdAt: quiz.createdAt,
          questions: questions.map(q => ({
            id: q._id.toString(),
            question: q.question,
            options: q.options,
            correctIdx: q.correctIdx,
          })),
        };
      })
    );

    return NextResponse.json({ quizzes: quizzesWithQuestions });
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

    const quizCollection = await quizzes();
    const questionCollection = await quizQuestions();

    const quizResult = await quizCollection.insertOne({
      userId,
      title,
      topic,
      difficulty,
      totalQuestions,
      score: score ?? null,
      completedAt: completedAt ? new Date(completedAt) : null,
      createdAt: new Date(),
    });

    const quizId = quizResult.insertedId.toString();

    // Insert questions
    const questionDocs = questions.map((q: { question: string; options: string[]; correctIdx: number }) => ({
      question: q.question,
      options: JSON.stringify(q.options),
      correctIdx: q.correctIdx,
      quizId,
      createdAt: new Date(),
    }));

    await questionCollection.insertMany(questionDocs);

    return NextResponse.json({
      quiz: {
        id: quizId,
        title,
        topic,
        difficulty,
        totalQuestions,
        score: score ?? null,
        completedAt: completedAt ? new Date(completedAt) : null,
        createdAt: new Date(),
        questions: questionDocs.map(q => ({ ...q, quizId })),
      },
    }, { status: 201 });
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

    const quizCollection = await quizzes();
    const questionCollection = await quizQuestions();

    await quizCollection.deleteOne({ _id: new ObjectId(id) });
    await questionCollection.deleteMany({ quizId: id });

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

    const quizCollection = await quizzes();

    await quizCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          score,
          completedAt: completedAt ? new Date(completedAt) : new Date(),
        },
      }
    );

    const updated = await quizCollection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      quiz: updated ? {
        id: updated._id.toString(),
        title: updated.title,
        topic: updated.topic,
        difficulty: updated.difficulty,
        totalQuestions: updated.totalQuestions,
        score: updated.score,
        completedAt: updated.completedAt,
        createdAt: updated.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Quiz PATCH:', error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}
