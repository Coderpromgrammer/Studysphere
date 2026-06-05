// ==========================================
// Ollama Client — Cloud connection via ollama npm package
// ==========================================

import ollama from 'ollama';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'https://ollama.com/api';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5vl';

export { OLLAMA_MODEL };

/**
 * Send a chat completion request to Ollama cloud
 * Uses the ollama npm package with a custom host pointing to Ollama cloud
 */
export async function ollamaChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: {
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
  }
): Promise<string> {
  const maxTokens = options?.maxTokens || 2048;
  const temperature = options?.temperature ?? 0.5;
  const timeoutMs = options?.timeoutMs || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      host: OLLAMA_HOST,
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature,
      },
    });

    clearTimeout(timeoutId);

    let content = response.message?.content || '';

    // Strip <think/> tags that Qwen models may include
    if (content) {
      content = content.replace(/<think[\s\S]*?<\/think>/g, '').trim();
    }

    return content;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as Error;
    if (err.name === 'AbortError') {
      console.error('Ollama API timeout');
      throw new Error('Ollama API request timed out');
    }
    console.error('Ollama API failed:', err.message);
    throw error;
  }
}
