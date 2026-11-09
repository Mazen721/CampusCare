import { addDays, addMonths, startOfDay } from 'date-fns';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Role } from '../../src/config/constants';

let replSet: MongoMemoryReplSet;
let app: Express;
let seedDatabase: (options?: { silent?: boolean }) => Promise<unknown>;
let SEED_PASSWORD: string;
let User: (typeof import('../../src/modules/auth/user.model'))['User'];
let Location: (typeof import('../../src/modules/locations/location.model'))['Location'];
let MaintenanceRequest: (typeof import('../../src/modules/maintenance/requests/maintenanceRequest.model'))['MaintenanceRequest'];
let WorkOrder: (typeof import('../../src/modules/maintenance/work-orders/workOrder.model'))['WorkOrder'];
let DEMO_ACCOUNTS: (typeof import('../../src/config/constants'))['DEMO_ACCOUNTS'];

const tokens = new Map<string, string>();

function bearer(role: Role) {
  return `Bearer ${tokens.get(role)}`;
}

function tokenForEmail(email: string) {
  return tokens.get(email) ?? '';
}

function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

async function activeLocationId() {
  const location = await Location.findOne({ isActive: true });
  if (!location) throw new Error('Seed is missing an active location');
  return location._id;
}

async function secondAvailableTechnician() {
  const technician = await User.findOne({
    role: 'TECHNICIAN',
    isActive: true,
    availability: 'AVAILABLE',
    email: { $ne: DEMO_ACCOUNTS.TECHNICIAN.email },
  });
  if (!technician) throw new Error('Seed is missing a second available technician');
  return technician;
}

async function submitRequest(title: string) {
  const locationId = await activeLocationId();
  const response = await request(app)
    .post('/api/v1/maintenance/requests')
    .set('Authorization', bearer('STUDENT_EMPLOYEE'))
    .field('title', title)
    .field('description', 'The unit is leaking water across the floor and must be repaired.')
    .field('category', 'Plumbing')
    .field('priority', 'MEDIUM')
    .field('locationId', locationId.toString())
    .expect(201);

  return response.body.request.id as string;
}

async function approveRequest(requestId: string) {
  const response = await request(app)
    .patch(`/api/v1/maintenance/requests/${requestId}/review`)
    .set('Authorization', bearer('MAINTENANCE_MANAGER'))
    .send({ action: 'APPROVE', notes: 'Approved for Day 4 checks' })
    .expect(200);

  return response.body.workOrder.id as string;
}

async function assignWorkOrder(
  workOrderId: string,
  technicianId: string,
  scheduledStart: Date,
  expectedCompletion: Date,
) {
  return request(app)
    .patch(`/api/v1/work-orders/${workOrderId}/assign`)
    .set('Authorization', bearer('MAINTENANCE_MANAGER'))
    .send({
      technicianId,
      scheduledStart: scheduledStart.toISOString(),
      expectedCompletion: expectedCompletion.toISOString(),
    })
    .expect(200);
}

async function assignedWorkOrder(
  title: string,
  technicianId: string,
  scheduledStart: Date,
  expectedCompletion: Date,
) {
  const requestId = await submitRequest(title);
  const workOrderId = await approveRequest(requestId);
  await assignWorkOrder(workOrderId, technicianId, scheduledStart, expectedCompletion);
  return { requestId, workOrderId };
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('campuscare-day4-ai-calendar');
  process.env.JWT_SECRET = 'campuscare-day4-ai-calendar-test-secret-32-plus';
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
  ({ User } = await import('../../src/modules/auth/user.model'));
  ({ Location } = await import('../../src/modules/locations/location.model'));
  ({ MaintenanceRequest } = await import(
    '../../src/modules/maintenance/requests/maintenanceRequest.model'
  ));
  ({ WorkOrder } = await import(
    '../../src/modules/maintenance/work-orders/workOrder.model'
  ));
  ({ DEMO_ACCOUNTS } = await import('../../src/config/constants'));
  ({ app } = await import('../../src/app'));

  await seedDatabase({ silent: true });

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
    tokens.set(DEMO_ACCOUNTS[role].email, response.body.token as string);
  }

  const secondTech = await secondAvailableTechnician();
  const secondToken = await login(secondTech.email, SEED_PASSWORD).expect(200);
  tokens.set(secondTech.email, secondToken.body.token as string);
}, 240_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

describe('Day 4 — AI work order summary (US6)', () => {
  it('returns the configured fallback when Gemini is not configured and changes nothing', async () => {
    const technician = await secondAvailableTechnician();
    const technicianId = technician._id.toString();
    const technicianToken = tokenForEmail(technician.email);
    const windowStart = addDays(new Date(), 1);
    const { workOrderId } = await assignedWorkOrder(
      'AI fallback plumbing issue',
      technicianId,
      windowStart,
      addDays(windowStart, 1),
    );

    const before = await WorkOrder.findById(workOrderId).lean();

    const response = await request(app)
      .post('/api/v1/ai/work-order-summary')
      .set('Authorization', `Bearer ${technicianToken}`)
      .send({ workOrderId })
      .expect(200);

    expect(response.body.available).toBe(false);
    expect(response.body.message).toEqual(expect.any(String));

    const after = await WorkOrder.findById(workOrderId).lean();
    expect(after?.status).toBe(before?.status);
    expect(after?.priority).toBe(before?.priority);
    expect(after?.assignedTechnicianId?.toString()).toBe(technicianId);
    expect(after?.aiSummary).toBeUndefined();
  });

  it('returns a saved summary without calling the AI service again', async () => {
    const technician = await secondAvailableTechnician();
    const technicianId = technician._id.toString();
    const windowStart = addDays(new Date(), 2);
    const { workOrderId } = await assignedWorkOrder(
      'AI cached summary plumbing issue',
      technicianId,
      windowStart,
      addDays(windowStart, 1),
    );

    const generatedAt = new Date('2026-11-03T10:00:00.000Z');
    const text = 'A water leak is pooling on the lab floor and needs repair.';
    await WorkOrder.updateOne(
      { _id: workOrderId },
      { $set: { aiSummary: { text, generatedAt } } },
    );

    const response = await request(app)
      .post('/api/v1/ai/work-order-summary')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .set('Accept-Language', 'en')
      .send({ workOrderId })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        available: true,
        text,
        generatedAt: generatedAt.toISOString(),
      }),
    );
  });

  it('rejects an invalid work order id', async () => {
    await request(app)
      .post('/api/v1/ai/work-order-summary')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ workOrderId: 'not-an-id' })
      .expect(400);
  });

  describe('AI summary authorization', () => {
    let workOrderId: string;

    beforeAll(async () => {
      const technician = await secondAvailableTechnician();
      const windowStart = addDays(new Date(), 3);
      ({ workOrderId } = await assignedWorkOrder(
        'AI authorization plumbing issue',
        technician._id.toString(),
        windowStart,
        addDays(windowStart, 1),
      ));
    });

    it.each([
      ['an unassigned technician', 'TECHNICIAN', 403],
      ['a student', 'STUDENT_EMPLOYEE', 403],
    ] as const)('refuses %s', async (_scenario, role, status) => {
      await request(app)
        .post('/api/v1/ai/work-order-summary')
        .set('Authorization', bearer(role))
        .send({ workOrderId })
        .expect(status);
    });
  });
});

describe('Day 4 — Maintenance calendar (US10)', () => {
  it('returns positioned work orders with an overdue flag and role scoping', async () => {
    const now = new Date();
    const secondTech = await secondAvailableTechnician();
    const secondTechId = secondTech._id.toString();
    const rangeFrom = startOfDay(addMonths(now, -1));
    const rangeTo = startOfDay(addMonths(now, 1));

    const overdueStart = addDays(now, -3);
    const overdueEnd = addDays(now, -1);
    const overdue = await assignedWorkOrder(
      'Calendar overdue valve repair',
      secondTechId,
      overdueStart,
      overdueEnd,
    );

    const demoTech = await User.findOne({ email: DEMO_ACCOUNTS.TECHNICIAN.email });
    if (!demoTech) throw new Error('Seed is missing the demo technician');
    const demoTechId = demoTech._id.toString();
    const demoStart = addDays(now, 2);
    const demoEnd = addDays(now, 3);
    const demo = await assignedWorkOrder(
      'Calendar upcoming demo technician job',
      demoTechId,
      demoStart,
      demoEnd,
    );

    const manager = await request(app)
      .get('/api/v1/maintenance/calendar')
      .query({ from: rangeFrom.toISOString(), to: rangeTo.toISOString() })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    const managerRows = manager.body.data as Array<{
      id: string;
      overdue: boolean;
      assignedTechnician: { id: string } | null;
    }>;

    expect(managerRows.map((row) => row.id)).toEqual(
      expect.arrayContaining([overdue.workOrderId, demo.workOrderId]),
    );
    expect(
      managerRows.find((row) => row.id === overdue.workOrderId)?.overdue,
    ).toBe(true);
    expect(
      managerRows.find((row) => row.id === demo.workOrderId)?.overdue,
    ).toBe(false);

    const filtered = await request(app)
      .get('/api/v1/maintenance/calendar')
      .query({
        from: rangeFrom.toISOString(),
        to: rangeTo.toISOString(),
        technicianId: secondTechId,
      })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    const filteredIds = (filtered.body.data as Array<{ id: string }>).map(
      (row) => row.id,
    );
    expect(filteredIds).toContain(overdue.workOrderId);
    expect(filteredIds).not.toContain(demo.workOrderId);

    const technicianView = await request(app)
      .get('/api/v1/maintenance/calendar')
      .query({ from: rangeFrom.toISOString(), to: rangeTo.toISOString() })
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(200);

    const technicianRows = technicianView.body.data as Array<{
      id: string;
      assignedTechnician: { id: string } | null;
    }>;
    expect(technicianRows.some((row) => row.id === demo.workOrderId)).toBe(true);
    expect(technicianRows.some((row) => row.id === overdue.workOrderId)).toBe(false);
    expect(
      technicianRows.every(
        (row) => row.assignedTechnician?.id === demoTechId,
      ),
    ).toBe(true);
  });

  it('filters calendar rows by status', async () => {
    const now = new Date();
    const rangeFrom = startOfDay(addMonths(now, -1));
    const rangeTo = startOfDay(addMonths(now, 1));
    const technician = await secondAvailableTechnician();
    const windowStart = addDays(now, 4);
    const { workOrderId } = await assignedWorkOrder(
      'Calendar status filter job',
      technician._id.toString(),
      windowStart,
      addDays(windowStart, 1),
    );

    const response = await request(app)
      .get('/api/v1/maintenance/calendar')
      .query({
        from: rangeFrom.toISOString(),
        to: rangeTo.toISOString(),
        status: 'ASSIGNED',
      })
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    const rows = response.body.data as Array<{ id: string; status: string }>;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.status === 'ASSIGNED')).toBe(true);
    expect(rows.map((row) => row.id)).toContain(workOrderId);
  });

  it.each([
    ['an admin', 'SUPER_ADMIN', 'valid', 200],
    ['a student', 'STUDENT_EMPLOYEE', 'valid', 403],
    ['a manager with an inverted range', 'MAINTENANCE_MANAGER', 'inverted', 400],
  ] as const)('handles %s', async (_scenario, role, range, status) => {
    const now = new Date();
    const rangeFrom = startOfDay(addMonths(now, -1));
    const rangeTo = startOfDay(addMonths(now, 1));
    const query =
      range === 'inverted'
        ? { from: rangeTo.toISOString(), to: rangeFrom.toISOString() }
        : { from: rangeFrom.toISOString(), to: rangeTo.toISOString() };

    await request(app)
      .get('/api/v1/maintenance/calendar')
      .query(query)
      .set('Authorization', bearer(role))
      .expect(status);
  });
});
