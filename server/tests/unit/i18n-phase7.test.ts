import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';

// Set dummy env variables before importing modules that rely on env.ts
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'super-secret-jwt-key-with-at-least-32-characters';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GEMINI_MODEL = 'gemini-2.5-flash';

describe('Phase 7: AI in the current language', () => {
  let AiInsightCache: typeof import('../../src/modules/ai/aiInsightCache.model').AiInsightCache;
  let AI_INSIGHTS_PROMPT_VERSION: typeof import('../../src/modules/ai/aiInsightCache.model').AI_INSIGHTS_PROMPT_VERSION;
  let WorkOrder: typeof import('../../src/modules/maintenance/work-orders/workOrder.model').WorkOrder;
  let requestContext: typeof import('../../src/shared/utils/requestContext').requestContext;
  let generateMaintenanceInsights: typeof import('../../src/modules/ai/maintenanceInsights.service').generateMaintenanceInsights;
  let summarizeWorkOrder: typeof import('../../src/modules/ai/workOrderSummary.service').summarizeWorkOrder;
  let getWorkOrder: typeof import('../../src/modules/maintenance/work-orders/workOrder.service').getWorkOrder;
  let dashboardService: typeof import('../../src/modules/dashboard/dashboard.service');

  beforeAll(async () => {
    const aiInsightCacheMod = await import('../../src/modules/ai/aiInsightCache.model');
    const workOrderModelMod = await import(
      '../../src/modules/maintenance/work-orders/workOrder.model'
    );
    const requestContextMod = await import('../../src/shared/utils/requestContext');
    const maintenanceInsightsMod = await import(
      '../../src/modules/ai/maintenanceInsights.service'
    );
    const workOrderSummaryMod = await import(
      '../../src/modules/ai/workOrderSummary.service'
    );
    const workOrderServiceMod = await import(
      '../../src/modules/maintenance/work-orders/workOrder.service'
    );
    dashboardService = await import('../../src/modules/dashboard/dashboard.service');

    AiInsightCache = aiInsightCacheMod.AiInsightCache;
    AI_INSIGHTS_PROMPT_VERSION = aiInsightCacheMod.AI_INSIGHTS_PROMPT_VERSION;
    WorkOrder = workOrderModelMod.WorkOrder;
    requestContext = requestContextMod.requestContext;
    generateMaintenanceInsights = maintenanceInsightsMod.generateMaintenanceInsights;
    summarizeWorkOrder = workOrderSummaryMod.summarizeWorkOrder;
    getWorkOrder = workOrderServiceMod.getWorkOrder;
  });

  beforeEach(() => {
    vi.spyOn(dashboardService, 'getInsightGenerationStats').mockResolvedValue({
      stats: { total: 10 },
      rangeStart: new Date('2026-11-01T00:00:00Z'),
      rangeEnd: new Date('2026-11-08T00:00:00Z'),
      previousRangeStart: new Date('2026-10-25T00:00:00Z'),
      previousRangeEnd: new Date('2026-11-01T00:00:00Z'),
    });
  });

  describe('Schema and index updates', () => {
    it('AiInsightCache includes lang field with default "ar" and enum validation', () => {
      const langPath = AiInsightCache.schema.path('lang') as any;
      expect(langPath).toBeDefined();
      expect(langPath.enumValues).toEqual(['ar', 'en']);
      expect(langPath.defaultValue).toBe('ar');
    });

    it('AiInsightCache defines a unique compound index on { period: 1, lang: 1 }', () => {
      const indexes = AiInsightCache.schema.indexes();
      const compoundIndex = indexes.find(
        ([fields, options]) =>
          fields.period === 1 && fields.lang === 1 && options?.unique === true,
      );
      expect(compoundIndex).toBeDefined();
    });

    it('AiInsightCache tracks the prompt version used to generate each cache entry', () => {
      expect(AiInsightCache.schema.path('promptVersion')).toBeDefined();
      expect(AI_INSIGHTS_PROMPT_VERSION).toBeGreaterThan(1);
    });

    it('WorkOrder includes aiSummaries for en and ar alongside legacy aiSummary', () => {
      expect(WorkOrder.schema.path('aiSummaries.en.text')).toBeDefined();
      expect(WorkOrder.schema.path('aiSummaries.ar.text')).toBeDefined();
      expect(WorkOrder.schema.path('aiSummary.text')).toBeDefined();
    });
  });

  describe('maintenanceInsights.service system instruction and cache scoping', () => {
    const manager = { id: new Types.ObjectId().toString(), role: 'MAINTENANCE_MANAGER' as const };
    const validInsights = {
      observations: ['Observation 1'],
      repeatedPatterns: ['Pattern 1'],
      operationalRisks: ['Risk 1'],
      preventiveRecommendations: ['Rec 1'],
    };

    it('appends Arabic instruction when lang is ar', async () => {
      let capturedInstruction = '';
      const generator = async (_prompt: string, instruction: string) => {
        capturedInstruction = instruction;
        return { available: true as const, text: JSON.stringify(validInsights) };
      };

      vi.spyOn(AiInsightCache, 'findOne').mockReturnValue({
        lean: () => Promise.resolve(null),
      } as any);
      vi.spyOn(AiInsightCache, 'findOneAndUpdate').mockResolvedValue({} as any);

      await requestContext.run({ lang: 'ar' }, async () => {
        await generateMaintenanceInsights(manager, { period: '7d', regenerate: true }, generator);
      });

      expect(capturedInstruction).toContain(
        'Write every string value in Modern Standard Arabic. Keep JSON keys in English.',
      );

      vi.restoreAllMocks();
    });

    it('appends English instruction when lang is en', async () => {
      let capturedInstruction = '';
      const generator = async (_prompt: string, instruction: string) => {
        capturedInstruction = instruction;
        return { available: true as const, text: JSON.stringify(validInsights) };
      };

      vi.spyOn(AiInsightCache, 'findOne').mockReturnValue({
        lean: () => Promise.resolve(null),
      } as any);
      vi.spyOn(AiInsightCache, 'findOneAndUpdate').mockResolvedValue({} as any);

      await requestContext.run({ lang: 'en' }, async () => {
        await generateMaintenanceInsights(manager, { period: '7d', regenerate: true }, generator);
      });

      expect(capturedInstruction).toContain('Write in English.');

      vi.restoreAllMocks();
    });

    it('queries and saves cache scoped by period AND lang', async () => {
      const findOneSpy = vi.spyOn(AiInsightCache, 'findOne').mockReturnValue({
        lean: () => Promise.resolve(null),
      } as any);
      const findOneAndUpdateSpy = vi
        .spyOn(AiInsightCache, 'findOneAndUpdate')
        .mockResolvedValue({} as any);

      const generator = async () => ({
        available: true as const,
        text: JSON.stringify(validInsights),
      });

      await requestContext.run({ lang: 'ar' }, async () => {
        await generateMaintenanceInsights(manager, { period: '30d' }, generator);
      });

      expect(findOneSpy).toHaveBeenCalledWith({
        period: '30d',
        lang: 'ar',
        promptVersion: AI_INSIGHTS_PROMPT_VERSION,
      });
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { period: '30d', lang: 'ar' },
        expect.objectContaining({
          $set: expect.objectContaining({
            period: '30d',
            lang: 'ar',
            promptVersion: AI_INSIGHTS_PROMPT_VERSION,
          }),
        }),
        expect.anything(),
      );

      vi.restoreAllMocks();
    });
  });

  describe('workOrderSummary.service multilingual storage and retrieval', () => {
    const actor = { id: new Types.ObjectId().toString(), role: 'MAINTENANCE_MANAGER' as const };
    const workOrderId = new Types.ObjectId().toString();

    it('returns existing aiSummaries[lang] without invoking Gemini', async () => {
      const summaryAr = { text: 'ملخص بالعربية', generatedAt: new Date() };
      const summaryEn = { text: 'Summary in English', generatedAt: new Date() };

      const mockWorkOrder = {
        _id: new Types.ObjectId(workOrderId),
        title: 'Leaking pipe',
        titleAr: 'تسريب في الأنبوب',
        description: 'Water leak',
        descriptionAr: 'تسرب مياه',
        aiSummaries: { ar: summaryAr, en: summaryEn },
      };

      vi.spyOn(WorkOrder, 'findById').mockResolvedValue(mockWorkOrder as any);

      const resAr = await requestContext.run({ lang: 'ar' }, async () => {
        return summarizeWorkOrder(actor, workOrderId);
      });
      expect(resAr).toEqual(
        expect.objectContaining({
          available: true,
          text: 'ملخص بالعربية',
        }),
      );

      const resEn = await requestContext.run({ lang: 'en' }, async () => {
        return summarizeWorkOrder(actor, workOrderId);
      });
      expect(resEn).toEqual(
        expect.objectContaining({
          available: true,
          text: 'Summary in English',
        }),
      );

      vi.restoreAllMocks();
    });

    it('maps legacy aiSummary to en on read for backward compatibility', async () => {
      const legacySummary = { text: 'Legacy English summary', generatedAt: new Date() };

      const mockWorkOrder = {
        _id: new Types.ObjectId(workOrderId),
        title: 'AC unit down',
        description: 'Not cooling',
        aiSummary: legacySummary,
      };

      vi.spyOn(WorkOrder, 'findById').mockResolvedValue(mockWorkOrder as any);

      const resEn = await requestContext.run({ lang: 'en' }, async () => {
        return summarizeWorkOrder(actor, workOrderId);
      });

      expect(resEn).toEqual(
        expect.objectContaining({
          available: true,
          text: 'Legacy English summary',
        }),
      );

      vi.restoreAllMocks();
    });
  });

  describe('WorkOrder serializer language selection', () => {
    const workOrderId = new Types.ObjectId().toString();

    it('serializes aiSummary based on active request language', async () => {
      const summaryAr = { text: 'ملخص الصيانة', generatedAt: new Date('2026-11-09T10:00:00Z') };
      const summaryEn = { text: 'Maintenance summary', generatedAt: new Date('2026-11-09T10:00:00Z') };

      const mockWo = {
        _id: new Types.ObjectId(workOrderId),
        workOrderNumber: 'WO-1001',
        sourceType: 'REACTIVE',
        title: 'Broken chair',
        description: 'Leg broken',
        category: 'Carpentry',
        priority: 'MEDIUM',
        status: 'ASSIGNED',
        aiSummaries: { ar: summaryAr, en: summaryEn },
        technicianNotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        populate: () => mockQuery,
        lean: () => Promise.resolve(mockWo),
      };
      vi.spyOn(WorkOrder, 'findById').mockReturnValue(mockQuery as any);

      const actor = { id: new Types.ObjectId().toString(), role: 'MAINTENANCE_MANAGER' as const };

      const serializedAr = await requestContext.run({ lang: 'ar' }, async () => {
        return getWorkOrder(actor, workOrderId);
      });
      expect(serializedAr?.aiSummary?.text).toBe('ملخص الصيانة');

      const serializedEn = await requestContext.run({ lang: 'en' }, async () => {
        return getWorkOrder(actor, workOrderId);
      });
      expect(serializedEn?.aiSummary?.text).toBe('Maintenance summary');

      vi.restoreAllMocks();
    });

    it('maps legacy aiSummary to en during serialization when lang is en', async () => {
      const legacySummary = { text: 'Legacy note', generatedAt: new Date('2026-11-09T10:00:00Z') };

      const mockWo = {
        _id: new Types.ObjectId(workOrderId),
        workOrderNumber: 'WO-1002',
        sourceType: 'REACTIVE',
        title: 'Lightbulb out',
        description: 'Room 101',
        category: 'Electrical',
        priority: 'LOW',
        status: 'PENDING_ASSIGNMENT',
        aiSummary: legacySummary,
        technicianNotes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        populate: () => mockQuery,
        lean: () => Promise.resolve(mockWo),
      };
      vi.spyOn(WorkOrder, 'findById').mockReturnValue(mockQuery as any);

      const actor = { id: new Types.ObjectId().toString(), role: 'MAINTENANCE_MANAGER' as const };

      const serializedEn = await requestContext.run({ lang: 'en' }, async () => {
        return getWorkOrder(actor, workOrderId);
      });
      expect(serializedEn?.aiSummary?.text).toBe('Legacy note');

      const serializedAr = await requestContext.run({ lang: 'ar' }, async () => {
        return getWorkOrder(actor, workOrderId);
      });
      expect(serializedAr?.aiSummary).toBeUndefined();

      vi.restoreAllMocks();
    });
  });
});
