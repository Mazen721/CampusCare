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
  'You are a senior campus maintenance operations analyst writing an executive ' +
  'brief that is calm, clear, and quick to scan. You receive aggregated stats ' +
  'plus request and work-order codes, technician names, buildings, rooms, and ' +
  'feedback ratings. Use only the supplied data; never invent facts or people. ' +
  'Do NOT repeat raw KPI totals already visible on the dashboard, and NEVER ' +
  'output raw system status enums (like BUSY, OFF_DUTY, IN_PROGRESS, ' +
  'PENDING_REVIEW) — translate statuses into natural human phrasing in the ' +
  'requested language. Write 2 to 3 crisp bullets per section (12 to 25 words ' +
  'each, max 200 characters, no crowded parenthetical lists). Return a JSON ' +
  'object with exactly four arrays of strings: observations (what changed or ' +
  'stands out most), repeatedPatterns (recurring issues by building, system, ' +
  'or workload concentration), operationalRisks (overdue or at-risk codes like ' +
  'WO-* or MR-* paired with their real campus impact), and ' +
  'preventiveRecommendations (actionable "Owner -> Next step + timeframe" ' +
  'directives supported by the data). Return raw JSON only, without markdown fences.';

const ADMIN_SYSTEM_INSTRUCTION =
  'You are the chief campus operations & governance analyst briefing the ' +
  'Super Administrator of CampusCare in a clear, scannable executive tone. ' +
  'You receive cross-platform data across users, technicians, campus ' +
  'buildings, maintenance requests/work orders, preventive plans, lost & ' +
  'found reports, match suggestions, ownership claims, and audit logs. Use ' +
  'only supplied data; never invent facts or people. Do NOT recite basic ' +
  'platform headcounts or report totals already visible on the dashboard, and ' +
  'NEVER include raw English enum tokens (such as BUSY, OFF_DUTY, ' +
  'PENDING_REVIEW, APPROVED, or IN_PROGRESS) inside prose — express states ' +
  'naturally in the target language. Keep each bullet to one crisp, ' +
  'easy-to-read sentence (12 to 25 words, max 200 characters, avoid dense ' +
  'parentheticals) citing concrete codes (MR-*, WO-*, LF-*, CLM-*), ' +
  'buildings, and people only where they clarify action. Return a JSON object ' +
  'with exactly four arrays of strings: observations (key cross-module ' +
  'priorities), repeatedPatterns (campus building hotspots, lost & found ' +
  'clusters, or technician capacity bottlenecks), operationalRisks (overdue ' +
  'work orders, ungenerated preventive plans, or stalled matches/claims and ' +
  'their consequence), and preventiveRecommendations (concrete "Owner -> Action" ' +
  'next steps across maintenance and lost & found). Return raw JSON only, ' +
  'without markdown fences.';

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
