import express, { type Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { WorkOrder as WorkOrderModel } from '../../src/modules/maintenance/work-orders/workOrder.model';

type SeedFn = (options?: { silent?: boolean }) => Promise<{
  accounts: number;
  technicians: number;
  locations: number;
  buildings: number;
}>;

let replSet: MongoMemoryReplSet;
let app: Express;
let seedDatabase: SeedFn;
let SEED_PASSWORD: string;
let User: (typeof import('../../src/modules/auth/user.model'))['User'];
let Location: (typeof import('../../src/modules/locations/location.model'))['Location'];
let WorkOrder: typeof WorkOrderModel;
let ServiceFeedback: (typeof import('../../src/modules/maintenance/feedback/serviceFeedback.model'))['ServiceFeedback'];
let ItemMatch: (typeof import('../../src/modules/lost-found/matches/itemMatch.model'))['ItemMatch'];
let nextNumber: (typeof import('../../src/shared/services/counter.service'))['nextNumber'];
let authenticate: (typeof import('../../src/shared/middleware/authenticate'))['authenticate'];
let authorizeRoles: (typeof import('../../src/shared/middleware/authorizeRoles'))['authorizeRoles'];
let errorHandler: (typeof import('../../src/shared/middleware/errorHandler'))['errorHandler'];
let ROLES: (typeof import('../../src/config/constants'))['ROLES'];
let DEMO_ACCOUNTS: (typeof import('../../src/config/constants'))['DEMO_ACCOUNTS'];

const tokens = new Map<string, string>();

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('campuscare');
  process.env.JWT_SECRET = 'campuscare-day1-test-secret-with-32-plus-characters';
  process.env.JWT_EXPIRES_IN = '1d';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.DEMO_MODE = 'true';
  process.env.GEMINI_API_KEY = '';
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';

  await mongoose.connect(process.env.MONGODB_URI);

  ({ seedDatabase, SEED_PASSWORD } = await import('../../src/seed/seed'));
  ({ User } = await import('../../src/modules/auth/user.model'));
  ({ Location } = await import('../../src/modules/locations/location.model'));
  ({ WorkOrder } = await import('../../src/modules/maintenance/work-orders/workOrder.model'));
  ({ ServiceFeedback } = await import(
    '../../src/modules/maintenance/feedback/serviceFeedback.model'
  ));
  ({ ItemMatch } = await import('../../src/modules/lost-found/matches/itemMatch.model'));
  ({ nextNumber } = await import('../../src/shared/services/counter.service'));
  ({ authenticate } = await import('../../src/shared/middleware/authenticate'));
  ({ authorizeRoles } = await import('../../src/shared/middleware/authorizeRoles'));
  ({ errorHandler } = await import('../../src/shared/middleware/errorHandler'));
  ({ ROLES, DEMO_ACCOUNTS } = await import('../../src/config/constants'));
  ({ app } = await import('../../src/app'));

  await seedDatabase({ silent: true });
}, 240_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

describe('Day 1 seed data and indexes', () => {
  it('creates the 13 collections with all required unique indexes', async () => {
    const db = mongoose.connection.db;
    expect(db).toBeDefined();

    const collections = (await db!.listCollections().toArray()).map((item) => item.name);
    expect(collections).toEqual(
      expect.arrayContaining([
        'counters',
        'users',
        'locations',
        'maintenancerequests',
        'workorders',
        'preventiveplans',
        'servicefeedbacks',
        'lostfounditems',
        'itemmatches',
        'claimrequests',
        'notifications',
        'activitylogs',
        'aiinsightcaches',
      ]),
    );

    const userIndexes = await User.collection.indexes();
    expect(userIndexes.some((index) => index.key.email === 1 && index.unique === true)).toBe(true);

    const requestIndexKeys = (await mongoose.connection.collection('maintenancerequests').indexes())
      .map((index) => index.key);
    expect(requestIndexKeys.some((key) => key.requestNumber === 1)).toBe(true);

    const workOrderIndexes = await WorkOrder.collection.indexes();
    const preventiveUnique = workOrderIndexes.find(
      (index) => index.key.preventivePlanId === 1 && index.key.scheduledStart === 1,
    );
    expect(preventiveUnique?.unique).toBe(true);
    expect(preventiveUnique?.partialFilterExpression).toEqual({
      preventivePlanId: { $type: 'objectId' },
    });

    const feedbackIndexes = await ServiceFeedback.collection.indexes();
    expect(
      feedbackIndexes.some(
        (index) => index.key.maintenanceRequestId === 1 && index.unique === true,
      ),
    ).toBe(true);

    const matchIndexes = await ItemMatch.collection.indexes();
    expect(
      matchIndexes.some(
        (index) =>
          index.key.lostItemId === 1 && index.key.foundItemId === 1 && index.unique === true,
      ),
    ).toBe(true);
  });

  it('creates one demo account per role, five technicians and four buildings', async () => {
    const counts = await User.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const byRole = new Map(counts.map((entry) => [entry._id, entry.count]));

    for (const role of ROLES) {
      expect(byRole.get(role) ?? 0).toBeGreaterThanOrEqual(1);
    }
    expect(byRole.get('TECHNICIAN')).toBe(5);

    const buildings = await Location.distinct('buildingName');
    expect(buildings).toHaveLength(4);
    expect(await Location.countDocuments({ isActive: true })).toBeGreaterThanOrEqual(20);
  });

  it('generates sequential human-readable numbers', async () => {
    await expect(nextNumber('MR')).resolves.toBe('MR-1001');
    await expect(nextNumber('MR')).resolves.toBe('MR-1002');
    await expect(nextNumber('WO')).resolves.toBe('WO-1001');
    await expect(nextNumber('LF')).resolves.toBe('LF-1001');
    await expect(nextNumber('CLM')).resolves.toBe('CLM-1001');
  });
});

describe('Day 1 authentication and RBAC', () => {
  it('signs in every seeded role and never returns a password hash', async () => {
    for (const role of ROLES) {
      const account = DEMO_ACCOUNTS[role];
      const response = await login(account.email, SEED_PASSWORD).expect(200);

      expect(typeof response.body.token).toBe('string');
      expect(response.body.user.role).toBe(role);
      expect(response.body.user.email).toBe(account.email);
      expect(response.body.user).not.toHaveProperty('passwordHash');

      tokens.set(role, response.body.token);
    }
  });

  it('returns the current user for a valid bearer token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.get('STUDENT_EMPLOYEE')}`)
      .expect(200);

    expect(response.body.user.role).toBe('STUDENT_EMPLOYEE');
    expect(response.body.user.email).toBe(DEMO_ACCOUNTS.STUDENT_EMPLOYEE.email);
  });

  it('rejects a missing or invalid token with 401', async () => {
    await request(app).get('/api/v1/auth/me').expect(401);
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('supports one-click demo login for every role', async () => {
    for (const role of ROLES) {
      const response = await request(app)
        .post('/api/v1/auth/demo-login')
        .send({ role })
        .expect(200);

      expect(response.body.user.role).toBe(role);
      expect(typeof response.body.token).toBe('string');
    }
  });

  it('returns 400 when login input is invalid', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION');
  });

  it('refuses a deactivated user at login and with an existing session', async () => {
    const student = await User.findOne({ email: DEMO_ACCOUNTS.STUDENT_EMPLOYEE.email });
    expect(student).not.toBeNull();

    student!.isActive = false;
    await student!.save();

    const loginResponse = await login(DEMO_ACCOUNTS.STUDENT_EMPLOYEE.email, SEED_PASSWORD);
    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body.error.code).toBe('UNAUTHORIZED');

    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.get('STUDENT_EMPLOYEE')}`)
      .expect(401);

    student!.isActive = true;
    await student!.save();

    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.get('STUDENT_EMPLOYEE')}`)
      .expect(200);
  });

  it('gives a Student 403 on an Admin-only route while an Admin is allowed', async () => {
    const roleProbe = express();
    roleProbe.get(
      '/admin-only',
      authenticate,
      authorizeRoles('SUPER_ADMIN'),
      (_req, res) => res.json({ ok: true }),
    );
    roleProbe.use(errorHandler);

    const denied = await request(roleProbe)
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokens.get('STUDENT_EMPLOYEE')}`)
      .expect(403);
    expect(denied.body.error.code).toBe('FORBIDDEN');

    await request(roleProbe)
      .get('/admin-only')
      .set('Authorization', `Bearer ${tokens.get('SUPER_ADMIN')}`)
      .expect(200);
  });

  it('changes a password and requires the new password next time', async () => {
    const newPassword = 'UpdatedCampus#2026';

    await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${tokens.get('STUDENT_EMPLOYEE')}`)
      .send({ currentPassword: SEED_PASSWORD, newPassword })
      .expect(200);

    await login(DEMO_ACCOUNTS.STUDENT_EMPLOYEE.email, SEED_PASSWORD).expect(401);
    await login(DEMO_ACCOUNTS.STUDENT_EMPLOYEE.email, newPassword).expect(200);

    await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${tokens.get('STUDENT_EMPLOYEE')}`)
      .send({ currentPassword: newPassword, newPassword: SEED_PASSWORD })
      .expect(200);
  });

  it('refuses an incorrect current password with 400', async () => {
    await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${tokens.get('STUDENT_EMPLOYEE')}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'AnotherCampus#2026' })
      .expect(400);
  });

  it('refuses to seed when NODE_ENV=production', async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await expect(seedDatabase({ silent: true })).rejects.toThrow(/production/i);
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
