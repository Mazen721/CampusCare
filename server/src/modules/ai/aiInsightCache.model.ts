import { Schema, model, models, type Model } from 'mongoose';

export interface InsightContent {
  observations: string[];
  repeatedPatterns: string[];
  operationalRisks: string[];
  preventiveRecommendations: string[];
}

export interface IAiInsightCache {
  period: '7d' | '30d';
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
    period: { type: String, required: true, enum: ['7d', '30d'] },
    generatedAt: { type: Date, required: true },
    rangeStart: { type: Date, required: true },
    rangeEnd: { type: Date, required: true },
    stats: { type: Schema.Types.Mixed, required: true },
    insights: { type: insightsSchema, required: true },
    model: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

aiInsightCacheSchema.index({ period: 1 }, { unique: true });

export const AiInsightCache =
  (models.AiInsightCache as Model<IAiInsightCache> | undefined) ??
  model<IAiInsightCache>('AiInsightCache', aiInsightCacheSchema);
