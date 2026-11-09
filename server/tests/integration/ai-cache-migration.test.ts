import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let mongod: MongoMemoryServer;
let AiInsightCache: typeof import('../../src/modules/ai/aiInsightCache.model').AiInsightCache;
let ensureAiInsightCacheIndexes: typeof import('../../src/modules/ai/aiInsightCache.model').ensureAiInsightCacheIndexes;

const baseCache = {
  period: '7d' as const,
  generatedAt: new Date(),
  rangeStart: new Date(),
  rangeEnd: new Date(),
  stats: {},
  insights: {
    observations: ['Observation'],
    repeatedPatterns: ['Pattern'],
    operationalRisks: ['Risk'],
    preventiveRecommendations: ['Recommendation'],
  },
  model: 'gemini-test',
  promptVersion: 2,
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongod.getUri('campuscare-ai-cache');
  process.env.JWT_SECRET = 'campuscare-ai-cache-test-secret-32-chars';
  process.env.GEMINI_API_KEY = '';
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';

  mongoose.set('autoIndex', false);
  await mongoose.connect(process.env.MONGODB_URI);

  const modelModule = await import('../../src/modules/ai/aiInsightCache.model');
  AiInsightCache = modelModule.AiInsightCache;
  ensureAiInsightCacheIndexes = modelModule.ensureAiInsightCacheIndexes;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('AI insight cache index migration', () => {
  it('replaces the legacy period-only unique index and keeps both languages', async () => {
    const collection = AiInsightCache.collection;

    await collection.createIndex({ period: 1 }, { unique: true, name: 'period_1' });
    await collection.insertOne({
      period: baseCache.period,
      generatedAt: baseCache.generatedAt,
      rangeStart: baseCache.rangeStart,
      rangeEnd: baseCache.rangeEnd,
      stats: baseCache.stats,
      insights: baseCache.insights,
      model: baseCache.model,
    });

    await ensureAiInsightCacheIndexes();

    const indexes = await collection.indexes();
    expect(indexes.some((index) => index.name === 'period_1')).toBe(false);
    expect(
      indexes.some(
        (index) =>
          index.unique === true && index.key.period === 1 && index.key.lang === 1,
      ),
    ).toBe(true);
    expect(await collection.countDocuments({ lang: { $exists: false } })).toBe(0);

    await collection.insertOne({ ...baseCache, lang: 'ar' });
    await collection.insertOne({ ...baseCache, lang: 'en' });

    expect(await collection.countDocuments({ period: '7d' })).toBe(2);
  });
});
