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
let Location: (typeof import('../../src/modules/locations/location.model'))['Location'];
let DEMO_ACCOUNTS: (typeof import('../../src/config/constants'))['DEMO_ACCOUNTS'];

const tokens = new Map<string, string>();

function bearer(role: Role) {
  return `Bearer ${tokens.get(role)}`;
}

function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

async function activeLocation() {
  const location = await Location.findOne({ isActive: true }).lean();
  if (!location) {
    throw new Error('Seed is missing an active location');
  }
  return location;
}

interface CreateItemOverrides {
  reportType?: 'LOST' | 'FOUND';
  itemTitle?: string;
  description?: string;
  privateIdentificationDetails?: string;
  category?: string;
  color?: string;
  brand?: string;
  locationDetails?: string;
  occurrenceDate?: string;
}

async function createItem(
  role: Role,
  overrides: CreateItemOverrides = {},
): Promise<{
  id: string;
  reportNumber: string;
  privateIdentificationDetails?: string;
  location: { buildingName: string } | null;
}> {
  const location = await activeLocation();
  const fields: Record<string, string> = {
    reportType: overrides.reportType ?? 'LOST',
    itemTitle: overrides.itemTitle ?? `Black backpack ${Date.now()}`,
    description:
      overrides.description ??
      'Lost near the engineering lab after the afternoon lecture.',
    privateIdentificationDetails:
      overrides.privateIdentificationDetails ??
      'Serial SN-SECRET-7788 and a scratched blue keychain',
    category: overrides.category ?? 'Bags',
    color: overrides.color ?? 'Black',
    brand: overrides.brand ?? 'North Face',
    locationId: location._id.toString(),
    locationDetails: overrides.locationDetails ?? 'Bench outside Room 102',
    occurrenceDate: overrides.occurrenceDate ?? '2026-11-01T10:00:00.000Z',
  };

  let builder = request(app)
    .post('/api/v1/lost-found/items')
    .set('Authorization', bearer(role));

  Object.entries(fields).forEach(([key, value]) => {
    builder = builder.field(key, value);
  });

  const response = await builder.expect(201);
  return response.body.item;
}

function getItem(role: Role, id: string) {
  return request(app)
    .get(`/api/v1/lost-found/items/${id}`)
    .set('Authorization', bearer(role));
}

function expectPublicOnly(item: Record<string, unknown>) {
  expect(item).not.toHaveProperty('privateIdentificationDetails');
  expect(item).not.toHaveProperty('reporter');
  expect(item).not.toHaveProperty('reporterId');
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('campuscare-day4-public-items');
  process.env.JWT_SECRET = 'campuscare-day4-public-items-test-secret-32-plus';
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
  ({ Location } = await import('../../src/modules/locations/location.model'));
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
  }
}, 240_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

describe('Day 4 — Lost & Found public privacy (US4)', () => {
  it('reports an item and returns its private details to the reporter', async () => {
    const item = await createItem('STUDENT_EMPLOYEE', {
      itemTitle: 'Reporter private check backpack',
    });

    expect(item.reportNumber).toMatch(/^LF-\d+$/);
    expect(item.privateIdentificationDetails).toContain('SN-SECRET-7788');
    expect(item.location).not.toBeNull();
  });

  it('never leaks private details or reporter contact through list, search or detail', async () => {
    const item = await createItem('STUDENT_EMPLOYEE', {
      itemTitle: 'Privacy probe green satchel',
      privateIdentificationDetails: 'Hidden lining mark PRIVATE-LEAK-CHECK',
    });

    const list = await request(app)
      .get('/api/v1/lost-found/items?limit=100')
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(200);

    expect(list.body.total).toBeGreaterThan(0);
    for (const row of list.body.data) {
      expectPublicOnly(row);
    }
    expect(JSON.stringify(list.body)).not.toContain('PRIVATE-LEAK-CHECK');

    const search = await request(app)
      .get('/api/v1/lost-found/items')
      .query({ q: 'Privacy probe green satchel' })
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(200);

    expect(search.body.total).toBeGreaterThan(0);
    expectPublicOnly(search.body.data[0]);
    expect(JSON.stringify(search.body)).not.toContain('PRIVATE-LEAK-CHECK');

    const detail = await getItem('TECHNICIAN', item.id).expect(200);
    expectPublicOnly(detail.body.item);
    expect(JSON.stringify(detail.body)).not.toContain('PRIVATE-LEAK-CHECK');
  });

  it('shows private details to the reporter, officer and admin', async () => {
    const secret = 'Serial PRIVILEGED-7788 with an engraved initials plate';
    const item = await createItem('STUDENT_EMPLOYEE', {
      itemTitle: 'Privileged detail visibility wallet',
      category: 'Wallets',
      privateIdentificationDetails: secret,
    });

    for (const role of ['STUDENT_EMPLOYEE', 'LOST_FOUND_OFFICER', 'SUPER_ADMIN'] as const) {
      const response = await getItem(role, item.id).expect(200);
      expect(response.body.item.privateIdentificationDetails).toBe(secret);
      expect(response.body.item.reporter).toEqual(
        expect.objectContaining({ id: expect.any(String), name: expect.any(String) }),
      );
    }
  });

  it('filters items by type, category, colour, brand, building, date and status', async () => {
    const location = await activeLocation();
    const lost = await createItem('STUDENT_EMPLOYEE', {
      itemTitle: 'Filter target black wallet',
      reportType: 'LOST',
      category: 'Wallets',
      color: 'Black',
      brand: 'Fossil',
      occurrenceDate: '2026-09-20T09:00:00.000Z',
    });
    const found = await createItem('LOST_FOUND_OFFICER', {
      itemTitle: 'Filter target blue umbrella',
      reportType: 'FOUND',
      category: 'Accessories',
      color: 'Blue',
      brand: 'Totes',
      occurrenceDate: '2026-10-15T14:00:00.000Z',
    });

    const ids = async (query: Record<string, string>) => {
      const response = await request(app)
        .get('/api/v1/lost-found/items')
        .query({ limit: '100', ...query })
        .set('Authorization', bearer('TECHNICIAN'))
        .expect(200);
      return (response.body.data as Array<{ id: string }>).map((item) => item.id);
    };

    expect(await ids({ reportType: 'FOUND' })).toContain(found.id);
    expect(await ids({ reportType: 'FOUND' })).not.toContain(lost.id);
    expect(await ids({ category: 'Wallets' })).toContain(lost.id);
    expect(await ids({ color: 'blue' })).toContain(found.id);
    expect(await ids({ brand: 'fossil' })).toContain(lost.id);
    expect(await ids({ building: location.buildingName })).toEqual(
      expect.arrayContaining([lost.id, found.id]),
    );
    expect(await ids({ status: 'OPEN' })).toEqual(
      expect.arrayContaining([lost.id, found.id]),
    );

    const dateRange = await ids({ from: '2026-10-01', to: '2026-10-31' });
    expect(dateRange).toContain(found.id);
    expect(dateRange).not.toContain(lost.id);
  });

  it('lists only the current user reports when mine=true', async () => {
    const studentItem = await createItem('STUDENT_EMPLOYEE', {
      itemTitle: 'My report only student',
    });
    const officerItem = await createItem('LOST_FOUND_OFFICER', {
      itemTitle: 'My report only officer',
    });

    const mine = await request(app)
      .get('/api/v1/lost-found/items')
      .query({ mine: 'true', limit: '100' })
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    const ids = (mine.body.data as Array<{ id: string }>).map((item) => item.id);
    expect(ids).toContain(studentItem.id);
    expect(ids).not.toContain(officerItem.id);
  });
});

describe('Day 4 — Lost & Found edits and closing (US4)', () => {
  it('lets the reporter edit an open report and close their own LOST report', async () => {
    const item = await createItem('STUDENT_EMPLOYEE', {
      itemTitle: 'Editable open report',
    });

    const updated = await request(app)
      .patch(`/api/v1/lost-found/items/${item.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ itemTitle: 'Edited open report title', color: 'Navy' })
      .expect(200);

    expect(updated.body.item.itemTitle).toBe('Edited open report title');
    expect(updated.body.item.color).toBe('Navy');

    const closed = await request(app)
      .patch(`/api/v1/lost-found/items/${item.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ status: 'CLOSED' })
      .expect(200);

    expect(closed.body.item.status).toBe('CLOSED');

    await request(app)
      .patch(`/api/v1/lost-found/items/${item.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ description: 'This edit should be refused after closing.' })
      .expect(403);
  });

  it('refuses a reporter closing a FOUND report', async () => {
    const found = await createItem('STUDENT_EMPLOYEE', {
      reportType: 'FOUND',
      itemTitle: 'Found item cannot be closed by reporter',
    });

    await request(app)
      .patch(`/api/v1/lost-found/items/${found.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ status: 'CLOSED' })
      .expect(403);
  });

  it('refuses editing a report by a user who does not own it', async () => {
    const item = await createItem('STUDENT_EMPLOYEE', {
      reportType: 'FOUND',
      itemTitle: 'Found item cannot be edited by a technician',
    });

    await request(app)
      .patch(`/api/v1/lost-found/items/${item.id}`)
      .set('Authorization', bearer('TECHNICIAN'))
      .send({ itemTitle: 'Technician attempt' })
      .expect(403);
  });

  it('lets an officer edit and close any non-returned item', async () => {
    const item = await createItem('STUDENT_EMPLOYEE', {
      itemTitle: 'Officer managed item',
      reportType: 'FOUND',
    });

    const edited = await request(app)
      .patch(`/api/v1/lost-found/items/${item.id}`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ description: 'Officer confirmed the item is held at the security desk.' })
      .expect(200);

    expect(edited.body.item.description).toContain('security desk');

    const closed = await request(app)
      .patch(`/api/v1/lost-found/items/${item.id}`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ status: 'CLOSED' })
      .expect(200);

    expect(closed.body.item.status).toBe('CLOSED');
  });

  it('validates report fields before creating an item', async () => {
    const location = await activeLocation();
    await request(app)
      .post('/api/v1/lost-found/items')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .field('reportType', 'LOST')
      .field('itemTitle', 'No')
      .field('description', 'short')
      .field('privateIdentificationDetails', 'x')
      .field('category', 'Not a category')
      .field('locationId', location._id.toString())
      .field('locationDetails', 'x')
      .field('occurrenceDate', 'not-a-date')
      .expect(400);
  });
});
