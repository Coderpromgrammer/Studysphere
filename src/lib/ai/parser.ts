// ==========================================
// AI Response Parser
// ==========================================

export function parseQuizResponse(content: string): {
  question: string;
  options: string[];
  correctIdx: number;
}[] {
  // Try to extract JSON from the response
  let cleaned = content.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // Try direct JSON parse
  try {
    const data = JSON.parse(cleaned);
    if (data.questions && Array.isArray(data.questions)) {
      return data.questions.map((q: Record<string, unknown>, i: number) => ({
        question: (q.question as string) || '',
        options: Array.isArray(q.options)
          ? q.options.map((o: unknown) => String(o))
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIdx:
          typeof q.correctIdx === 'number'
            ? q.correctIdx
            : typeof q.correctAnswer === 'number'
              ? (q.correctAnswer as number)
              : i === 0
                ? 0
                : 0,
      }));
    }
  } catch {
    // Not direct JSON
  }

  // Try to find JSON block in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      if (data.questions && Array.isArray(data.questions)) {
        return data.questions.map((q: Record<string, unknown>, i: number) => ({
          question: (q.question as string) || '',
          options: Array.isArray(q.options)
            ? q.options.map((o: unknown) => String(o))
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIdx:
            typeof q.correctIdx === 'number'
              ? q.correctIdx
              : typeof q.correctAnswer === 'number'
                ? (q.correctAnswer as number)
                : 0,
        }));
      }
    } catch {
      // JSON parse failed
    }
  }

  // Try to parse as array directly
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const data = JSON.parse(arrayMatch[0]);
      if (Array.isArray(data)) {
        return data.map((q: Record<string, unknown>, i: number) => ({
          question: (q.question as string) || '',
          options: Array.isArray(q.options)
            ? q.options.map((o: unknown) => String(o))
            : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIdx:
            typeof q.correctIdx === 'number'
              ? Math.min(Math.max(0, q.correctIdx), 3)
              : 0,
        }));
      }
    } catch {
      // Array parse failed
    }
  }

  // Fallback: return empty array
  return [];
}
