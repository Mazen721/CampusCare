import { Schema, model, models, type Model } from 'mongoose';
import type { RequestLanguage } from '../../shared/utils/requestContext';

/** Bump this whenever the insight prompt or stats shape changes materially. */
export const AI_INSIGHTS_PROMPT_VERSION = 2;

export type InsightScope = 'MAINTENANCE' | 'ADMIN';

export interface InsightContent {
  observations: string[];
  repeatedPatterns: string[];
  operationalRisks: string[];
  preventiveRecommendations: string[];
}

export interface IAiInsightCache {
  scope: InsightScope;
  period: '7d' | '30d';
  lang: RequestLanguage;
  promptVersion: number;
  generatedAt: Date;
  rangeStart: Date;
  rangeEnd: Date;
  stats: Record<string, unknown>;
  insights: InsightContent;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

const insightsSchema = new Schema<InsightContent>(
  {
    observations: { type: [String], default: [] },
    repeatedPatterns: { type: [String], default: [] },
    operationalRisks: { type: [String], default: [] },
    preventiveRecommendations: { type: [String], default: [] },
  },
  { _id: false },
);

const aiInsightCacheSchema = new Schema<IAiInsightCache>(
  {
    scope: {
      type: String,
      required: true,
      enum: ['MAINTENANCE', 'ADMIN'],
      default: 'MAINTENANCE',
    },
    period: { type: String, required: true, enum: ['7d', '30d'] },
    lang: { type: String, required: true, enum: ['ar', 'en'], default: 'ar' },
    promptVersion: { type: Number, required: true, default: 1 },
    generatedAt: { type: Date, required: true },
    rangeStart: { type: Date, required: true },
    rangeEnd: { type: Date, required: true },
    stats: { type: Schema.Types.Mixed, required: true },
    insights: { type: insightsSchema, required: true },
    model: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

aiInsightCacheSchema.index({ scope: 1, period: 1, lang: 1 }, { unique: true });

export const AiInsightCache =
  (models.AiInsightCache as Model<IAiInsightCache> | undefined) ??
  model<IAiInsightCache>('AiInsightCache', aiInsightCacheSchema);

interface ExistingIndex {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
}

/**
 * Repairs databases created before insights were cached per scope and language.
 * Drops legacy unique indexes on `period` or `(period, lang)`, backfills
 * missing `scope` values, and recreates the compound index.
 */
export async function ensureAiInsightCacheIndexes(): Promise<void> {
  const collection = AiInsightCache.collection;
  let indexes: ExistingIndex[];

  try {
    indexes = (await collection.indexes()) as ExistingIndex[];
  } catch (error) {
    if ((error as { code?: number }).code === 26) {
      await AiInsightCache.createIndexes();
      return;
    }
    throw error;
  }

  for (const index of indexes) {
    const keys = Object.keys(index.key);
    const isLegacyUnique =
      index.unique === true &&
      !keys.includes('scope') &&
      keys.includes('period');
    if (isLegacyUnique && index.name) {
      await collection.dropIndex(index.name);
    }
  }

  await collection.deleteMany({ lang: { $exists: false } });
  await collection.updateMany(
    { scope: { $exists: false } },
    { $set: { scope: 'MAINTENANCE' } },
  );
  await AiInsightCache.createIndexes();
}
