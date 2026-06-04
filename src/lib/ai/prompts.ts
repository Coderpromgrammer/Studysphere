// ==========================================
// AI Prompt Templates
// ==========================================

const SUBJECT_NAMES: Record<string, string> = {
  math: 'Mathematics',
  science: 'Science',
  sanskrit: 'Sanskrit',
  sst: 'Social Studies',
  history: 'History',
  geography: 'Geography',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  english: 'English',
  hindi: 'Hindi',
  cs: 'Computer Science',
};

export function getSubjectName(subject: string): string {
  return SUBJECT_NAMES[subject] || subject;
}

export function buildChatPrompt(
  message: string,
  subject?: string,
  context?: string
): string {
  const subjectContext = subject
    ? `The student is currently studying ${getSubjectName(subject)}.`
    : 'The student may ask about any subject.';
  const contextNote = context
    ? `\nAdditional context from the student's notes:\n${context.slice(0, 2000)}`
    : '';

  return `You are a friendly and helpful AI tutor for Indian school students (Classes 6-12).
${subjectContext}${contextNote}

Guidelines:
- Be encouraging and supportive
- Explain concepts in simple, relatable terms
- Use examples that Indian students can relate to
- If the student is wrong, gently correct them with explanation
- Keep responses concise but thorough

Student: ${message}`;
}

export function buildQuizPrompt(
  topic: string,
  difficulty: string,
  numQuestions: number
): string {
  const diffLabel =
    difficulty === 'easy'
      ? 'easy questions suitable for beginners (Class 6-8 level)'
      : difficulty === 'medium'
        ? 'moderate difficulty questions (Class 9-10 level)'
        : 'challenging questions (Class 11-12 level, competitive exam style)';

  return `Generate ${numQuestions} multiple choice questions on the topic "${topic}".
${diffLabel}

IMPORTANT: Return ONLY valid JSON in this exact format, no extra text, no markdown:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctIdx": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

The correctIdx is the 0-based index of the correct answer in the options array.
Make sure questions are accurate and appropriate for Indian school curriculum (CBSE/ICSE).
Generate exactly ${numQuestions} questions.`;
}

export function buildSolvePrompt(
  query: string,
  subject: string,
  mode: string
): string {
  const modeInstruction =
    mode === 'easy'
      ? 'Explain in very simple terms, like explaining to a beginner. Use basic language and simple examples.'
      : mode === 'exam'
        ? 'Provide an exam-ready answer with proper formatting, step-by-step working, and key points highlighted. Be thorough and precise.'
        : 'Provide a clear, well-structured explanation suitable for a high school student.';

  return `You are an expert ${getSubjectName(subject)} tutor for Indian school students (Classes 6-12, CBSE/ICSE board).

${modeInstruction}

Subject: ${getSubjectName(subject)}
Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}

Student's Question: ${query}

Instructions:
- Provide a clear, step-by-step solution
- Break down complex problems into smaller steps
- Use proper formatting with numbered steps
- Include relevant formulas or definitions
- End with a brief summary or key takeaway`;
}
