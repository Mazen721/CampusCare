import type { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Role } from '../../src/config/constants';

let replSet: MongoMemoryReplSet;
let app: Express;
let seedDatabase: (options?: {
  silent?: boolean;
  fullDemoData?: boolean;
}) => Promise<unknown>;
let SEED_PASSWORD: string;
let DEMO_ACCOUNTS: (typeof import('../../src/config/constants'))['DEMO_ACCOUNTS'];
let Location: (typeof import('../../src/modules/locations/location.model'))['Location'];
let User: (typeof import('../../src/modules/auth/user.model'))['User'];
let MaintenanceRequest: (typeof import('../../src/modules/maintenance/requests/maintenanceRequest.model'))['MaintenanceRequest'];
let WorkOrder: (typeof import('../../src/modules/maintenance/work-orders/workOrder.model'))['WorkOrder'];
let PreventivePlan: (typeof import('../../src/modules/preventive/preventivePlan.model'))['PreventivePlan'];
let LostFoundItem: (typeof import('../../src/modules/lost-found/items/lostFoundItem.model'))['LostFoundItem'];
let ClaimRequest: (typeof import('../../src/modules/lost-found/claims/claimRequest.model'))['ClaimRequest'];
let Notification: (typeof import('../../src/shared/models/Notification.model'))['Notification'];
let ActivityLog: (typeof import('../../src/shared/models/ActivityLog.model'))['ActivityLog'];
let AiInsightCache: (typeof import('../../src/modules/ai/aiInsightCache.model'))['AiInsightCache'];
let Counter: (typeof import('../../src/shared/models/Counter.model'))['Counter'];
let generateMaintenanceInsights: (typeof import('../../src/modules/ai/maintenanceInsights.service'))['generateMaintenanceInsights'];
let parseInsightsContent: (typeof import('../../src/modules/ai/ai.validation'))['parseInsightsContent'];

const tokens = new Map<Role, string>();
let managerId = '';
let adminId = '';
let technicianId = '';

function bearer(role: Role): string {
  return `Bearer ${tokens.get(role) ?? ''}`;
}

function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

function uniqueTitle(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

async function activeLocationId(): Promise<string> {
  const location = await Location.findOne({ isActive: true }).select('_id').lean();
  if (!location) throw new Error('Seed is missing an active location');
  return location._id.toString();
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('campuscare-day6');
  process.env.JWT_SECRET = 'campuscare-day6-test-secret-with-32-plus-characters';
  process.env.JWT_EXPIRES_IN = '1d';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.DEMO_MODE = 'true';
  process.env.CLOUDINARY_CLOUD_NAME = '';
  process.env.CLOUDINARY_API_KEY = '';
  process.env.CLOUDINARY_API_SECRET = '';
  process.env.GEMINI_API_KEY = '';
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';

  await mongoose.connect(process.env.MONGODB_URI);

  ({ seedDatabase, SEED_PASSWORD } = await import('../../src/seed/seed'));
  ({ DEMO_ACCOUNTS } = await import('../../src/config/constants'));
  ({ Location } = await import('../../src/modules/locations/location.model'));
  ({ User } = await import('../../src/modules/auth/user.model'));
  ({ MaintenanceRequest } = await import(
    '../../src/modules/maintenance/requests/maintenanceRequest.model'
  ));
  ({ WorkOrder } = await import(
    '../../src/modules/maintenance/work-orders/workOrder.model'
  ));
  ({ PreventivePlan } = await import(
    '../../src/modules/preventive/preventivePlan.model'
  ));
  ({ LostFoundItem } = await import(
    '../../src/modules/lost-found/items/lostFoundItem.model'
  ));
  ({ ClaimRequest } = await import(
    '../../src/modules/lost-found/claims/claimRequest.model'
  ));
  ({ Notification } = await import('../../src/shared/models/Notification.model'));
  ({ ActivityLog } = await import('../../src/shared/models/ActivityLog.model'));
  ({ AiInsightCache } = await import('../../src/modules/ai/aiInsightCache.model'));
  ({ Counter } = await import('../../src/shared/models/Counter.model'));
  ({ generateMaintenanceInsights } = await import(
    '../../src/modules/ai/maintenanceInsights.service'
  ));
  ({ parseInsightsContent } = await import('../../src/modules/ai/ai.validation'));
  ({ app } = await import('../../src/app'));

  await seedDatabase({ silent: true, fullDemoData: true });

  const roles: Role[] = [
    'SUPER_ADMIN',
    'MAINTENANCE_MANAGER',
    'TECHNICIAN',
    'LOST_FOUND_OFFICER',
    'STUDENT_EMPLOYEE',
  ];

  for (const role of roles) {
    const response = await login(DEMO_ACCOUNTS[role].email, SEED_PASSWORD).expect(200);
    tokens.set(role, response.body.token as string);
    if (role === 'SUPER_ADMIN') adminId = response.body.user.id as string;
    if (role === 'MAINTENANCE_MANAGER') managerId = response.body.user.id as string;
    if (role === 'TECHNICIAN') technicianId = response.body.user.id as string;
  }
}, 240_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

describe('Day 6 — demo seed (T067)', () => {
  it('seeds the full cross-module demo dataset', async () => {
    expect(await MaintenanceRequest.countDocuments({})).toBe(24);
    expect(await WorkOrder.countDocuments({})).toBe(18);
    expect(await PreventivePlan.countDocuments({})).toBe(3);
    expect(await LostFoundItem.countDocuments({})).toBe(18);
    expect(await ClaimRequest.countDocuments({})).toBe(5);
    expect(await Notification.countDocuments({})).toBe(9);
    expect(await ActivityLog.countDocuments({})).toBe(12);
    expect(await AiInsightCache.countDocuments({})).toBe(1);
  });

  it('seeds demo numbers separately and leaves counters zeroed', async () => {
    const seededRequest = await MaintenanceRequest.findOne({
      requestNumber: 'MR-2001',
    }).lean();
    expect(seededRequest).not.toBeNull();

    const counters = await Counter.find({}).lean();
    expect(counters).toHaveLength(4);
    expect(counters.every((counter) => counter.seq === 0)).toBe(true);
  });
});

describe('Day 6 — dashboard (T060)', () => {
  it('returns a manager payload with the section 5.8 metrics', async () => {
    const week = await request(app)
      .get('/api/v1/dashboard')
      .query({ period: '7d' })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(week.body.role).toBe('MAINTENANCE_MANAGER');
    expect(week.body.period).toBe('7d');
    expect(week.body.rangeStart).toBeTruthy();
    expect(week.body.rangeEnd).toBeTruthy();

    const weekMetrics = week.body.metrics as {
      totalRequests: number;
      requestsByStatus: Record<string, number>;
      requestsByCategory: Array<{ category: string; count: number }>;
      requestsByBuilding: Array<{ building: string; count: number }>;
      activeWorkOrders: number;
      completedWorkOrders: number;
      overdueWorkOrders: number;
      averageResolutionHours: number | null;
      technicianWorkload: Array<{ id: string; name: string }>;
      feedback: {
        total: number;
        averageRating: number | null;
        distribution: Array<{ rating: number; count: number }>;
      };
    };

    expect(weekMetrics.totalRequests).toBeGreaterThan(0);
    expect(weekMetrics.totalRequests).toBeLessThan(24);
    expect(typeof weekMetrics.requestsByStatus.SUBMITTED).toBe('number');
    expect(typeof weekMetrics.requestsByStatus.CLOSED).toBe('number');
    expect(weekMetrics.requestsByCategory.length).toBeGreaterThan(0);
    expect(weekMetrics.requestsByBuilding.length).toBeGreaterThan(0);
    expect(weekMetrics.activeWorkOrders).toBe(5);
    expect(weekMetrics.overdueWorkOrders).toBe(2);
    expect(weekMetrics.technicianWorkload).toHaveLength(5);
    expect(weekMetrics.averageResolutionHours).toBeNull();

    const all = await request(app)
      .get('/api/v1/dashboard')
      .query({ period: 'all' })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(all.body.rangeStart).toBeNull();
    const allMetrics = all.body.metrics as typeof weekMetrics;

    expect(allMetrics.totalRequests).toBe(24);
    expect(allMetrics.totalRequests).toBeGreaterThanOrEqual(weekMetrics.totalRequests);
    expect(allMetrics.completedWorkOrders).toBe(9);
    expect(allMetrics.overdueWorkOrders).toBe(2);
    expect(allMetrics.averageResolutionHours).toBeGreaterThan(0);
    expect(allMetrics.feedback.total).toBe(4);
    expect(allMetrics.feedback.averageRating).toBe(4.3);
    expect(allMetrics.feedback.distribution).toHaveLength(5);
  });

  it('returns role-specific payloads for every role', async () => {
    const admin = await request(app)
      .get('/api/v1/dashboard')
      .query({ period: 'all' })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(admin.body.role).toBe('SUPER_ADMIN');
    expect(admin.body.totals.users).toBeGreaterThanOrEqual(11);
    expect(admin.body.totals.technicians).toBe(5);
    expect(admin.body.totals.maintenanceRequests).toBeGreaterThanOrEqual(24);
    expect(admin.body.totals.workOrders).toBeGreaterThanOrEqual(18);
    expect(admin.body.totals.lostItems).toBe(9);
    expect(admin.body.totals.foundItems).toBe(9);
    expect(admin.body.latestInsights).not.toBeNull();
    expect(admin.body.latestInsights.period).toBe('7d');

    const technician = await request(app)
      .get('/api/v1/dashboard')
      .query({ period: '7d' })
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(200);

    expect(technician.body.role).toBe('TECHNICIAN');
    expect(technician.body.counts).toMatchObject({
      assigned: 1,
      inProgress: 1,
      overdue: 1,
    });
    expect(technician.body.schedule).toHaveLength(2);
    expect(technician.body.schedule[0].location).toBeTruthy();

    const officer = await request(app)
      .get('/api/v1/dashboard')
      .query({ period: 'all' })
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .expect(200);

    expect(officer.body.role).toBe('LOST_FOUND_OFFICER');
    expect(officer.body.counts).toMatchObject({
      totalLostItems: 9,
      totalFoundItems: 9,
      openLostItems: 5,
      openFoundItems: 4,
      pendingMatches: 2,
      pendingClaims: 1,
      underVerificationClaims: 1,
      claimsAwaitingHandover: 1,
      completedHandovers: 1,
    });

    const student = await request(app)
      .get('/api/v1/dashboard')
      .query({ period: 'all' })
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(student.body.role).toBe('STUDENT_EMPLOYEE');
    expect(student.body.requests.total).toBe(10);
    expect(student.body.claims.total).toBe(1);
    expect(student.body.reports).toMatchObject({ total: 3, lost: 3, found: 0 });
    expect(student.body.notifications.unreadCount).toBe(3);
    expect(student.body.requests.recent).toHaveLength(5);
  });

  it('takes the role from the JWT only and validates the period', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard')
      .query({ period: '30d', role: 'SUPER_ADMIN' })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(response.body.role).toBe('MAINTENANCE_MANAGER');

    await request(app)
      .get('/api/v1/dashboard')
      .query({ period: 'weekly' })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(400);

    await request(app).get('/api/v1/dashboard').expect(401);
  });
});

describe('Day 6 — activity logs (T062)', () => {
  it('restricts the audit trail to administrators', async () => {
    for (const role of [
      'MAINTENANCE_MANAGER',
      'TECHNICIAN',
      'LOST_FOUND_OFFICER',
      'STUDENT_EMPLOYEE',
    ] as Role[]) {
      await request(app)
        .get('/api/v1/activity-logs')
        .set('Authorization', bearer(role))
        .expect(403);
    }
  });

  it('returns paginated entries with populated actor details', async () => {
    const response = await request(app)
      .get('/api/v1/activity-logs')
      .query({ page: 1, limit: 5 })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(5);
    expect(response.body.total).toBe(12);
    expect(response.body.data).toHaveLength(5);

    const entry = response.body.data[0] as {
      actor: { id: string; name: string; role: string } | null;
      description: string;
      createdAt: string;
    };
    expect(entry.actor).not.toBeNull();
    expect(typeof entry.actor?.name).toBe('string');
    expect(typeof entry.actor?.role).toBe('string');
    expect(typeof entry.description).toBe('string');

    const timestamps = (response.body.data as Array<{ createdAt: string }>).map((row) =>
      new Date(row.createdAt).getTime(),
    );
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));

    const pageTwo = await request(app)
      .get('/api/v1/activity-logs')
      .query({ page: 2, limit: 5 })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);
    expect(pageTwo.body.data).toHaveLength(5);
    expect(pageTwo.body.data[0].id).not.toBe(response.body.data[0].id);
  });

  it('filters by entity type, actor and date range', async () => {
    const byEntity = await request(app)
      .get('/api/v1/activity-logs')
      .query({ entityType: 'PreventivePlan', limit: 100 })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(byEntity.body.total).toBe(1);
    expect(
      (byEntity.body.data as Array<{ entityType: string }>).every(
        (entry) => entry.entityType === 'PreventivePlan',
      ),
    ).toBe(true);

    const byActor = await request(app)
      .get('/api/v1/activity-logs')
      .query({ actorId: managerId, limit: 100 })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(byActor.body.total).toBeGreaterThanOrEqual(4);
    expect(
      (byActor.body.data as Array<{ actor: { id: string } | null }>).every(
        (entry) => entry.actor?.id === managerId,
      ),
    ).toBe(true);

    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const empty = await request(app)
      .get('/api/v1/activity-logs')
      .query({ from: future, limit: 100 })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(empty.body.total).toBe(0);
    expect(empty.body.data).toEqual([]);

    await request(app)
      .get('/api/v1/activity-logs')
      .query({ from: future, to: new Date().toISOString() })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(400);

    await request(app)
      .get('/api/v1/activity-logs')
      .query({ actorId: 'not-an-object-id' })
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(400);
  });
});

describe('Day 6 — preventive maintenance (T064–T066)', () => {
  function planPayload(overrides: Record<string, unknown> = {}) {
    return {
      title: uniqueTitle('Inspect emergency lighting'),
      description:
        'Inspect and test the emergency lighting circuits and replace failed batteries.',
      category: 'Electrical',
      priority: 'HIGH',
      assignedTechnicianId: technicianId,
      recurrenceType: 'WEEKLY',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      expectedDurationHours: 2,
      isActive: true,
      ...overrides,
    };
  }

  it('lets managers and admins read plans but only managers change them', async () => {
    const locationId = await activeLocationId();

    await request(app)
      .get('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    const adminView = await request(app)
      .get('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);
    expect(adminView.body.total).toBe(3);

    await request(app)
      .get('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(403);

    await request(app)
      .get('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(403);

    await request(app)
      .post('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send(planPayload({ locationId }))
      .expect(403);
  });

  it('creates, updates and toggles a plan', async () => {
    const locationId = await activeLocationId();
    const startDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    const created = await request(app)
      .post('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send(
        planPayload({
          title: uniqueTitle('Monthly generator inspection'),
          category: 'Electrical',
          priority: 'HIGH',
          locationId,
          recurrenceType: 'MONTHLY',
          startDate,
        }),
      )
      .expect(201);

    const plan = created.body.plan as {
      id: string;
      title: string;
      category: string;
      priority: string;
      isActive: boolean;
      overdue: boolean;
      nextScheduledDate: string;
      startDate: string;
      recurrenceType: string;
      location: { id: string };
      assignedTechnician: { id: string };
    };

    expect(plan.title).toContain('Monthly generator inspection');
    expect(plan.category).toBe('Electrical');
    expect(plan.priority).toBe('HIGH');
    expect(plan.isActive).toBe(true);
    expect(plan.overdue).toBe(false);
    expect(plan.recurrenceType).toBe('MONTHLY');
    expect(plan.location.id).toBe(locationId);
    expect(plan.assignedTechnician.id).toBe(technicianId);
    expect(new Date(plan.nextScheduledDate).getTime()).toBe(new Date(startDate).getTime());

    const updated = await request(app)
      .patch(`/api/v1/preventive-maintenance/${plan.id}`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ title: uniqueTitle('Monthly generator load test'), priority: 'LOW' })
      .expect(200);

    expect(updated.body.plan.priority).toBe('LOW');
    expect(updated.body.plan.title).toContain('Monthly generator load test');
    expect(new Date(updated.body.plan.nextScheduledDate).getTime()).toBe(
      new Date(startDate).getTime(),
    );

    const deactivated = await request(app)
      .patch(`/api/v1/preventive-maintenance/${plan.id}/status`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ isActive: false })
      .expect(200);
    expect(deactivated.body.plan.isActive).toBe(false);

    const reactivated = await request(app)
      .patch(`/api/v1/preventive-maintenance/${plan.id}/status`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ isActive: true })
      .expect(200);
    expect(reactivated.body.plan.isActive).toBe(true);
  });

  it('generates due work orders once, skips misses and never runs automatically', async () => {
    const locationId = await activeLocationId();
    const scheduledStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const dueResponse = await request(app)
      .post('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send(
        planPayload({
          title: uniqueTitle('Weekly cooling tower check'),
          locationId,
          recurrenceType: 'WEEKLY',
          startDate: scheduledStart.toISOString(),
        }),
      )
      .expect(201);
    const duePlan = dueResponse.body.plan as { id: string };

    const inactiveResponse = await request(app)
      .post('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send(
        planPayload({
          title: uniqueTitle('Inactive cooling tower check'),
          locationId,
          recurrenceType: 'WEEKLY',
          startDate: scheduledStart.toISOString(),
          isActive: false,
        }),
      )
      .expect(201);
    const inactivePlan = inactiveResponse.body.plan as { id: string };

    // Loading the dashboard must not run generation.
    await request(app)
      .get('/api/v1/dashboard')
      .query({ period: '7d' })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);
    expect(await WorkOrder.countDocuments({ preventivePlanId: duePlan.id })).toBe(0);

    const firstRun = await request(app)
      .post('/api/v1/preventive-maintenance/generate-due')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(firstRun.body).toEqual({ created: expect.any(Number) });
    expect(firstRun.body.created).toBeGreaterThanOrEqual(2);

    const advanced = await PreventivePlan.findById(duePlan.id).lean();
    if (!advanced) throw new Error('Due plan disappeared');
    expect(advanced.lastGeneratedDate?.getTime()).toBe(scheduledStart.getTime());
    expect(advanced.nextScheduledDate.getTime()).toBeGreaterThan(Date.now());

    const generated = await WorkOrder.findOne({ preventivePlanId: duePlan.id }).lean();
    if (!generated) throw new Error('Expected a preventive work order');
    expect(generated.sourceType).toBe('PREVENTIVE');
    expect(generated.status).toBe('ASSIGNED');
    expect(generated.assignedTechnicianId?.toString()).toBe(technicianId);
    expect(generated.scheduledStart?.getTime()).toBe(scheduledStart.getTime());
    expect(generated.expectedCompletion?.getTime()).toBe(
      scheduledStart.getTime() + 2 * 60 * 60 * 1000,
    );

    expect(await WorkOrder.countDocuments({ preventivePlanId: inactivePlan.id })).toBe(0);

    const seededDue = await PreventivePlan.findOne({
      title: 'Weekly HVAC filter inspection',
    }).lean();
    if (!seededDue) throw new Error('Seeded due plan is missing');
    expect(seededDue.nextScheduledDate.getTime()).toBeGreaterThan(Date.now());

    // Restore the original occurrence to force the duplicate-key path.
    await PreventivePlan.updateOne(
      { _id: duePlan.id },
      { $set: { nextScheduledDate: scheduledStart } },
    );

    const duplicate = await request(app)
      .post('/api/v1/preventive-maintenance/generate-due')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(duplicate.body).toEqual({ created: 0 });
    expect(await WorkOrder.countDocuments({ preventivePlanId: duePlan.id })).toBe(1);
  });

  it('rejects invalid plans and missing ids', async () => {
    await request(app)
      .post('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ title: 'Missing fields' })
      .expect(400);

    await request(app)
      .post('/api/v1/preventive-maintenance')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send(
        planPayload({
          locationId: await activeLocationId(),
          recurrenceType: 'CUSTOM_DAYS',
          recurrenceIntervalDays: undefined,
        }),
      )
      .expect(400);

    await request(app)
      .patch('/api/v1/preventive-maintenance/64b000000000000000000001')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ title: 'Nonexistent plan' })
      .expect(404);
  });
});

describe('Day 6 — AI maintenance insights (T063)', () => {
  it('is manager-only and validates the period', async () => {
    await request(app)
      .post('/api/v1/ai/maintenance-insights')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({ period: '7d' })
      .expect(403);

    await request(app)
      .post('/api/v1/ai/maintenance-insights')
      .set('Authorization', bearer('TECHNICIAN'))
      .send({ period: '7d' })
      .expect(403);

    await request(app)
      .post('/api/v1/ai/maintenance-insights')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ period: '90d' })
      .expect(400);
  });

  it('serves the seeded cache and falls back gracefully without Gemini', async () => {
    const withCache = await request(app)
      .post('/api/v1/ai/maintenance-insights')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ period: '7d' })
      .expect(200);

    expect(withCache.body.available).toBe(true);
    expect(withCache.body.message).toBeUndefined();
    expect(withCache.body.stats.requests.total).toBeGreaterThan(0);
    expect(withCache.body.stats.technicians[0].label).toBe('Technician A');
    expect(withCache.body.insights).toBeTruthy();
    expect(withCache.body.generatedAt).toBeTruthy();
    expect(withCache.body.rangeStart).toBeTruthy();

    const withoutCache = await request(app)
      .post('/api/v1/ai/maintenance-insights')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ period: '30d' })
      .expect(200);

    expect(withoutCache.body.available).toBe(false);
    expect(withoutCache.body.message).toContain('GEMINI_API_KEY');
    expect(withoutCache.body.stats.requests.total).toBeGreaterThanOrEqual(0);
    expect(withoutCache.body.insights).toBeUndefined();
  });

  it('parses wrapped insight JSON and rejects unreadable payloads', () => {
    const content = {
      observations: ['Electrical issues dominate the engineering complex.'],
      repeatedPatterns: ['The same corridor lights are reported repeatedly.'],
      operationalRisks: ['An overdue work order threatens exam connectivity.'],
      preventiveRecommendations: ['Schedule a quarterly lighting inspection.'],
    };

    expect(parseInsightsContent(JSON.stringify({ insights: content }))).toEqual(content);
    expect(parseInsightsContent('not-json')).toBeNull();
    expect(parseInsightsContent(JSON.stringify({ observations: [] }))).toBeNull();
  });

  it('caches generated insights, serves the cache and supports regeneration', async () => {
    await AiInsightCache.deleteMany({});

    const firstContent = {
      observations: ['Hardware requests are the largest category this week.'],
      repeatedPatterns: ['Engineering lab equipment fails repeatedly.'],
      operationalRisks: ['One network work order is overdue.'],
      preventiveRecommendations: ['Inspect lab power outlets next month.'],
    };
    const secondContent = {
      observations: ['Plumbing requests increased slightly this week.'],
      repeatedPatterns: ['Washroom fixtures recur across buildings.'],
      operationalRisks: ['Server room cooling remains a critical risk.'],
      preventiveRecommendations: ['Add a weekly washroom fixture check.'],
    };

    let capturedPrompt = '';
    let calls = 0;
    const firstGenerator = async (
      prompt: string,
    ): Promise<{ available: true; text: string }> => {
      calls += 1;
      capturedPrompt = prompt;
      return { available: true, text: JSON.stringify(firstContent) };
    };

    const manager = { id: managerId, role: 'MAINTENANCE_MANAGER' as const };
    const generated = await generateMaintenanceInsights(
      manager,
      { period: '7d' },
      firstGenerator,
    );

    expect(generated.available).toBe(true);
    expect(generated.insights).toEqual(firstContent);
    expect(generated.generatedAt).toBeInstanceOf(Date);
    expect(calls).toBe(1);
    expect(capturedPrompt).toContain('Technician A');
    expect(capturedPrompt).not.toContain('Hassan');

    const cachedDoc = await AiInsightCache.findOne({ period: '7d' }).lean();
    expect(cachedDoc).not.toBeNull();
    expect(cachedDoc?.model).toBe(process.env.GEMINI_MODEL);
    expect(cachedDoc?.insights).toEqual(firstContent);
    expect(cachedDoc?.stats).toBeTruthy();

    const cacheGenerator = async (): Promise<{ available: true; text: string }> => {
      throw new Error('The generator must not run when a cache exists');
    };
    const fromCache = await generateMaintenanceInsights(
      manager,
      { period: '7d' },
      cacheGenerator,
    );

    expect(fromCache.available).toBe(true);
    expect(fromCache.insights).toEqual(firstContent);
    expect(fromCache.generatedAt).toBeInstanceOf(Date);

    calls = 0;
    const regenerateGenerator = async (): Promise<{
      available: true;
      text: string;
    }> => {
      calls += 1;
      return { available: true, text: JSON.stringify(secondContent) };
    };
    const regenerated = await generateMaintenanceInsights(
      manager,
      { period: '7d', regenerate: true },
      regenerateGenerator,
    );

    expect(calls).toBe(1);
    expect(regenerated.insights).toEqual(secondContent);
    expect((await AiInsightCache.findOne({ period: '7d' }).lean())?.insights).toEqual(
      secondContent,
    );

    const malformed = await generateMaintenanceInsights(
      manager,
      { period: '7d', regenerate: true },
      async () => ({ available: true, text: 'not valid JSON' }),
    );

    expect(malformed.available).toBe(false);
    expect(malformed.message).toContain('unreadable');
    expect(malformed.insights).toEqual(secondContent);

    const offline = await generateMaintenanceInsights(
      manager,
      { period: '30d', regenerate: true },
      async () => ({ available: false, message: 'AI is offline for this test' }),
    );

    expect(offline.available).toBe(false);
    expect(offline.message).toBe('AI is offline for this test');
    expect(offline.insights).toBeUndefined();
    expect(offline.stats.requests).toBeTruthy();
  });

  it('refuses non-manager service calls', async () => {
    await expect(
      generateMaintenanceInsights(
        { id: adminId, role: 'SUPER_ADMIN' },
        { period: '7d' },
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
