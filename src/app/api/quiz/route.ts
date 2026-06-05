import { NextRequest, NextResponse } from 'next/server';
import { quizzes, quizQuestions, ObjectId } from '@/lib/db';

const MAX_QUIZZES_PER_USER = 5;

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

// POST /api/quiz - Save a completed quiz + auto-delete oldest if > MAX
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, topic, difficulty, totalQuestions, score, completedAt, questions } = body;

    if (!userId || !title || !topic || !difficulty || !totalQuestions || !questions?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const quizCollection = await quizzes();
    const questionCollection = await quizQuestions();

    // Insert the new quiz
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

    // Auto-delete oldest quizzes if user has more than MAX_QUIZZES_PER_USER
    await enforceQuizLimit(userId, quizCollection, questionCollection);

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

/**
 * Enforce quiz limit: keep only the most recent MAX_QUIZZES_PER_USER quizzes per user.
 * Deletes oldest quizzes and their associated questions.
 */
async function enforceQuizLimit(
  userId: string,
  quizCollection: Awaited<ReturnType<typeof quizzes>>,
  questionCollection: Awaited<ReturnType<typeof quizQuestions>>
) {
  try {
    // Get all quizzes sorted newest first
    const allQuizzes = await quizCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // If user has more than the limit, delete the oldest ones
    if (allQuizzes.length > MAX_QUIZZES_PER_USER) {
      const quizzesToDelete = allQuizzes.slice(MAX_QUIZZES_PER_USER);
      const idsToDelete = quizzesToDelete.map(q => q._id);
      const idsAsStrings = idsToDelete.map(id => id.toString());

      // Delete the quiz documents
      const deleteResult = await quizCollection.deleteMany({
        _id: { $in: idsToDelete },
      });

      // Delete associated questions
      const questionDeleteResult = await questionCollection.deleteMany({
        quizId: { $in: idsAsStrings },
      });

      console.log(
        `Auto-deleted ${deleteResult.deletedCount} old quizzes and ` +
        `${questionDeleteResult.deletedCount} questions for user ${userId} ` +
        `(keeping ${MAX_QUIZZES_PER_USER} most recent)`
      );
    }
  } catch (error) {
    console.error('Failed to enforce quiz limit:', error);
    // Don't fail the main operation if cleanup fails
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
