import type { Role } from '../../config/constants';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/ApiError';
import { getRequestLang } from '../../shared/utils/requestContext';
import {
  AI_INSIGHTS_PROMPT_VERSION,
  AiInsightCache,
  ensureAiInsightCacheIndexes,
  type InsightContent,
} from './aiInsightCache.model';
import {
  parseInsightsContent,
  type InsightPeriod,
  type MaintenanceInsightsBody,
} from './ai.validation';
import {
  generateGeminiText,
  type AiClientResult,
} from './gemini.client';
import { getInsightGenerationStats } from '../dashboard/dashboard.service';

const SYSTEM_INSTRUCTION =
  'You are a senior campus maintenance operations analyst. You receive ' +
  'aggregated statistics plus selected operational details such as request ' +
  'and work-order codes, technician names, buildings, rooms, service ratings ' +
  'and feedback comments. Use only the supplied data; never invent facts, ' +
  'people or events. Be specific and actionable instead of generic: cite ' +
  'codes, names, locations, categories and numbers whenever they are ' +
  'available. Prioritize recurring failures, overdue or at-risk work, backlog ' +
  'aging, uneven technician workload and low service ratings. Return a JSON ' +
  'object with exactly four arrays of short strings: observations, ' +
  'repeatedPatterns, operationalRisks, and preventiveRecommendations. Each ' +
  'string must be one concrete sentence under 300 characters. observations: ' +
  'the most important facts and trends. repeatedPatterns: recurring failures, ' +
  'locations, categories or technician patterns. operationalRisks: specific ' +
  'overdue, aging or high-impact work and its operational consequence. ' +
  'preventiveRecommendations: concrete actions with an owner and timeframe ' +
  'when the data supports it. Return raw JSON only, without markdown fences.';

export type InsightGenerator = (
  prompt: string,
  systemInstruction: string,
) => Promise<AiClientResult>;

export interface InsightsActor {
  id: string;
  role: Role;
}

export interface MaintenanceInsightsResponse {
  available: boolean;
  stats: Record<string, unknown>;
  insights?: InsightContent;
  generatedAt?: Date;
  rangeStart: Date;
  rangeEnd: Date;
  message?: string;
}

function buildPrompt(stats: Record<string, unknown>, period: InsightPeriod): string {
  return [
    `Period: ${period}`,
    'Analyze the following campus maintenance data and return the requested',
    'JSON object. Reference specific codes, names, locations and numbers where',
    'the data provides them.',
    JSON.stringify(stats),
  ].join('\n');
}

interface InsightCacheValues {
  generatedAt: Date;
  rangeStart: Date;
  rangeEnd: Date;
  stats: Record<string, unknown>;
  insights: InsightContent;
  model: string;
}

async function saveInsightCache(
  period: InsightPeriod,
  lang: ReturnType<typeof getRequestLang>,
  values: InsightCacheValues,
): Promise<void> {
  const update = {
    $set: {
      period,
      lang,
      promptVersion: AI_INSIGHTS_PROMPT_VERSION,
      ...values,
    },
  };

  try {
    await AiInsightCache.findOneAndUpdate({ period, lang }, update, {
      upsert: true,
      new: true,
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11_000) {
      throw error;
    }

    // Either two managers generated at the same time, or this database still
    // has the legacy unique index on `period` alone. Repair and retry once.
    await ensureAiInsightCacheIndexes();
    await AiInsightCache.findOneAndUpdate({ period, lang }, update, {
      upsert: true,
      new: true,
    });
  }
}

/**
 * Generates (or returns cached) AI maintenance insights for a manager.
 * Gemini receives the aggregated statistics plus operational details such as
 * codes, technician names, locations and feedback comments.
 */
export async function generateMaintenanceInsights(
  actor: InsightsActor,
  input: MaintenanceInsightsBody,
  generator: InsightGenerator = (prompt, instruction) =>
    generateGeminiText(prompt, instruction, {
      maxOutputTokens: 1200,
      temperature: 0.3,
    }),
): Promise<MaintenanceInsightsResponse> {
  if (actor.role !== 'MAINTENANCE_MANAGER') {
    throw ApiError.forbidden(
      'Only maintenance managers can generate insights',
      'managerInsightsOnly',
    );
  }

  const lang = getRequestLang();
  const { period, regenerate = false } = input;
  const { stats, rangeStart, rangeEnd } = await getInsightGenerationStats(period);
  const cached = await AiInsightCache.findOne({
    period,
    lang,
    promptVersion: AI_INSIGHTS_PROMPT_VERSION,
  }).lean();

  if (cached && !regenerate) {
    return {
      available: true,
      stats,
      insights: cached.insights,
      generatedAt: cached.generatedAt,
      rangeStart: cached.rangeStart,
      rangeEnd: cached.rangeEnd,
    };
  }

  const langInstruction =
    lang === 'ar'
      ? 'Write every string value in Modern Standard Arabic. Keep JSON keys in English.'
      : 'Write in English.';
  const systemInstruction = `${SYSTEM_INSTRUCTION} ${langInstruction}`;

  const result = await generator(buildPrompt(stats, period), systemInstruction);

  if (!result.available) {
    return {
      available: false,
      stats,
      ...(cached
        ? {
            insights: cached.insights,
            generatedAt: cached.generatedAt,
          }
        : {}),
      rangeStart,
      rangeEnd,
      message: result.message,
    };
  }

  const insights = parseInsightsContent(result.text);

  if (!insights) {
    return {
      available: false,
      stats,
      ...(cached
        ? {
            insights: cached.insights,
            generatedAt: cached.generatedAt,
          }
        : {}),
      rangeStart,
      rangeEnd,
      message:
        'The AI service returned an unreadable response. Showing calculated statistics instead.',
    };
  }

  const generatedAt = new Date();

  await saveInsightCache(period, lang, {
    generatedAt,
    rangeStart,
    rangeEnd,
    stats,
    insights,
    model: env.GEMINI_MODEL,
  });

  return {
    available: true,
    stats,
    insights,
    generatedAt,
    rangeStart,
    rangeEnd,
  };
}
