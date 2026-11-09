import type { Role } from '../../config/constants';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/ApiError';
import {
  AiInsightCache,
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
  'You are a campus maintenance analyst. You receive only aggregated, ' +
  'anonymized statistics. Do not invent facts or mention people by name. ' +
  'Return a JSON object with exactly four arrays of short strings: ' +
  'observations, repeatedPatterns, operationalRisks, and ' +
  'preventiveRecommendations. Return raw JSON only, without markdown fences.';

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
    'Analyze the following anonymized maintenance statistics and return the',
    'requested JSON object.',
    JSON.stringify(stats),
  ].join('\n');
}

/**
 * Generates (or returns cached) AI maintenance insights for a manager.
 * Gemini only receives the aggregated statistics JSON and the period length;
 * names, emails and free-text descriptions are never included.
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

  const { period, regenerate = false } = input;
  const { stats, rangeStart, rangeEnd } = await getInsightGenerationStats(period);
  const cached = await AiInsightCache.findOne({ period }).lean();

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

  const result = await generator(buildPrompt(stats, period), SYSTEM_INSTRUCTION);

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

  await AiInsightCache.findOneAndUpdate(
    { period },
    {
      $set: {
        period,
        generatedAt,
        rangeStart,
        rangeEnd,
        stats,
        insights,
        model: env.GEMINI_MODEL,
      },
    },
    { upsert: true, new: true },
  );

  return {
    available: true,
    stats,
    insights,
    generatedAt,
    rangeStart,
    rangeEnd,
  };
}
