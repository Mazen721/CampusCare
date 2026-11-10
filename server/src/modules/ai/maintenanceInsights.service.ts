import type { Role } from '../../config/constants';
import { env } from '../../config/env';
import { ApiError } from '../../shared/utils/ApiError';
import { getRequestLang } from '../../shared/utils/requestContext';
import {
  AI_INSIGHTS_PROMPT_VERSION,
  AiInsightCache,
  ensureAiInsightCacheIndexes,
  type InsightContent,
  type InsightScope,
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
import {
  getAdminInsightGenerationStats,
  getInsightGenerationStats,
} from '../dashboard/dashboard.service';

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

const ADMIN_SYSTEM_INSTRUCTION =
  'You are the chief campus platform operations & governance analyst advising ' +
  'the Super Administrator of CampusCare. You receive whole-platform data ' +
  'spanning Users & Role Distribution, Technician Availability, Campus ' +
  'Buildings & Locations, Maintenance Requests & Work Orders, Preventive ' +
  'Maintenance Plans, Lost & Found Reports, Match Suggestions, Ownership ' +
  'Claims & Handovers, and Recent Administrative Activity Logs. Use only the ' +
  'supplied data; never invent facts, people or events. Cite concrete codes ' +
  '(MR-*, WO-*, LF-*, CLM-*), user/technician/claimant names, building names ' +
  'and numbers whenever available. Return a JSON object with exactly four ' +
  'arrays of short strings (each sentence under 300 characters): ' +
  'observations (platform-wide volume across users, maintenance, and lost & ' +
  'found), repeatedPatterns (cross-module hotspots by building, technician ' +
  'capacity/availability, and lost & found categories), operationalRisks ' +
  '(overdue work orders, ungenerated preventive plans, unreviewed matches or ' +
  'pending claims awaiting verification/handover, or off-duty/inactive ' +
  'accounts), and preventiveRecommendations (concrete executive actions across ' +
  'staffing, campus facilities, preventive schedules, and lost & found ' +
  'verification). Return raw JSON only, without markdown fences.';

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
  scope: InsightScope,
  period: InsightPeriod,
  lang: ReturnType<typeof getRequestLang>,
  values: InsightCacheValues,
): Promise<void> {
  const update = {
    $set: {
      scope,
      period,
      lang,
      promptVersion: AI_INSIGHTS_PROMPT_VERSION,
      ...values,
    },
  };

  try {
    await AiInsightCache.findOneAndUpdate({ scope, period, lang }, update, {
      upsert: true,
      new: true,
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11_000) {
      throw error;
    }

    await ensureAiInsightCacheIndexes();
    await AiInsightCache.findOneAndUpdate({ scope, period, lang }, update, {
      upsert: true,
      new: true,
    });
  }
}

async function runScopedInsights(
  scope: InsightScope,
  period: InsightPeriod,
  regenerate: boolean,
  baseInstruction: string,
  statsBundle: {
    stats: Record<string, unknown>;
    rangeStart: Date;
    rangeEnd: Date;
  },
  generator: InsightGenerator,
): Promise<MaintenanceInsightsResponse> {
  const lang = getRequestLang();
  const { stats, rangeStart, rangeEnd } = statsBundle;
  const cached = await AiInsightCache.findOne({
    scope,
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
  const systemInstruction = `${baseInstruction} ${langInstruction}`;

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

  await saveInsightCache(scope, period, lang, {
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

/**
 * Generates (or returns cached) AI maintenance insights for a manager.
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
  const statsBundle = await getInsightGenerationStats(period);

  return runScopedInsights(
    'MAINTENANCE',
    period,
    regenerate,
    SYSTEM_INSTRUCTION,
    statsBundle,
    generator,
  );
}

/**
 * Generates (or returns cached) whole-platform AI insights for a Super Admin.
 */
export async function generateAdminInsights(
  actor: InsightsActor,
  input: MaintenanceInsightsBody,
  generator: InsightGenerator = (prompt, instruction) =>
    generateGeminiText(prompt, instruction, {
      maxOutputTokens: 1400,
      temperature: 0.3,
    }),
): Promise<MaintenanceInsightsResponse> {
  if (actor.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden(
      'Only administrators can generate platform insights',
      'forbidden',
    );
  }

  const { period, regenerate = false } = input;
  const statsBundle = await getAdminInsightGenerationStats(period);

  return runScopedInsights(
    'ADMIN',
    period,
    regenerate,
    ADMIN_SYSTEM_INSTRUCTION,
    statsBundle,
    generator,
  );
}
