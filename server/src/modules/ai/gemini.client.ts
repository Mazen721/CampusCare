import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env';

const AI_TIMEOUT_MS = 15_000;

export type AiClientResult =
  | { available: true; text: string }
  | { available: false; message: string };

class AiTimeoutError extends Error {
  constructor() {
    super('AI request timed out');
    this.name = 'AiTimeoutError';
  }
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new AiTimeoutError()), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Gemini sometimes wraps answers in markdown fences even when plain text is
 * requested. Strip a single surrounding fenced block before validation.
 */
export function stripMarkdownFences(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```[a-zA-Z0-9_-]*\s*\n?([\s\S]*?)\n?```$/);
  return match ? match[1]!.trim() : trimmed;
}

function isRateLimited(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { status?: unknown; code?: unknown; message?: unknown };
  if (candidate.status === 429 || candidate.code === 429) return true;

  return (
    typeof candidate.message === 'string' &&
    /(429|rate limit|quota|resource exhausted)/i.test(candidate.message)
  );
}

function failureMessage(error: unknown): string {
  if (error instanceof AiTimeoutError) {
    return 'The AI service took too long to respond. Please try again in a moment.';
  }

  if (isRateLimited(error)) {
    return 'The AI service is busy right now. Please try again in a moment.';
  }

  return 'The AI service is temporarily unavailable. Please try again later.';
}

/**
 * Calls Gemini with a hard 15 second timeout. Every failure is converted into a
 * structured fallback so callers can return HTTP 200 and keep the page usable.
 */
export async function generateGeminiText(
  prompt: string,
  systemInstruction: string,
): Promise<AiClientResult> {
  if (!env.GEMINI_API_KEY) {
    return {
      available: false,
      message:
        'AI features are not configured on this server yet. Ask an administrator to set GEMINI_API_KEY.',
    };
  }

  try {
    const response = await withTimeout(
      getClient().models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 200,
        },
      }),
      AI_TIMEOUT_MS,
    );

    const text = stripMarkdownFences(response.text ?? '');
    if (!text) {
      return {
        available: false,
        message: 'The AI service returned an empty response. Please try again.',
      };
    }

    return { available: true, text };
  } catch (error) {
    return { available: false, message: failureMessage(error) };
  }
}
