import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Work order id is not valid');

export const workOrderSummaryBodySchema = z.object({
  workOrderId: objectId,
});

/** The generated summary must be non-empty and under 300 characters. */
export const summaryTextSchema = z
  .string()
  .trim()
  .min(1, 'AI summary cannot be empty')
  .max(299, 'AI summary must be under 300 characters');

export type WorkOrderSummaryBody = z.infer<typeof workOrderSummaryBodySchema>;

export const INSIGHT_PERIODS = ['7d', '30d'] as const;
export type InsightPeriod = (typeof INSIGHT_PERIODS)[number];

export const maintenanceInsightsBodySchema = z.object({
  period: z.enum(INSIGHT_PERIODS).default('7d'),
  regenerate: z.boolean().optional(),
});

export type MaintenanceInsightsBody = z.infer<typeof maintenanceInsightsBodySchema>;

const insightLine = z
  .string()
  .trim()
  .min(3, 'Insight lines must be at least 3 characters')
  .max(300, 'Insight lines must be 300 characters or fewer');

/** Validates the JSON object Gemini is asked to return. */
export const insightsContentSchema = z.object({
  observations: z.array(insightLine).min(1).max(8),
  repeatedPatterns: z.array(insightLine).min(1).max(8),
  operationalRisks: z.array(insightLine).min(1).max(8),
  preventiveRecommendations: z.array(insightLine).min(1).max(8),
});

/**
 * Parses the raw model response (possibly fenced or wrapped in a JSON object
 * with an `insights` key) into validated insight content. Returns null when the
 * payload cannot be parsed or fails validation.
 */
export function parseInsightsContent(
  raw: string,
): z.infer<typeof insightsContentSchema> | null {
  const text = raw.trim();

  if (!text) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const candidate =
    parsed && typeof parsed === 'object' && 'insights' in parsed
      ? (parsed as { insights?: unknown }).insights
      : parsed;
  const result = insightsContentSchema.safeParse(candidate);

  return result.success ? result.data : null;
}
