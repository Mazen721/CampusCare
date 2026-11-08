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
let LostFoundItem: (typeof import('../../src/modules/lost-found/items/lostFoundItem.model'))['LostFoundItem'];
let ItemMatch: (typeof import('../../src/modules/lost-found/matches/itemMatch.model'))['ItemMatch'];
let ClaimRequest: (typeof import('../../src/modules/lost-found/claims/claimRequest.model'))['ClaimRequest'];
let Notification: (typeof import('../../src/shared/models/Notification.model'))['Notification'];
let User: (typeof import('../../src/modules/auth/user.model'))['User'];
let hashPassword: (typeof import('../../src/modules/auth/auth.service'))['hashPassword'];
let DEMO_ACCOUNTS: (typeof import('../../src/config/constants'))['DEMO_ACCOUNTS'];

const SECOND_STUDENT_EMAIL = 'mariam.abdelrahman@std.mansnu.edu.eg';
const SECOND_STUDENT_PASSWORD = 'SecondStudent123!';
const tokens = new Map<Role, string>();
let studentId = '';
let officerId = '';
let secondStudentId = '';
let secondStudentToken = '';

function bearer(role: Role) {
  return `Bearer ${tokens.get(role) ?? ''}`;
}

function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

async function activeLocation() {
  const location = await Location.findOne({ isActive: true }).lean();
  if (!location) throw new Error('Seed is missing an active location');
  return location;
}

interface ItemOverrides {
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

async function createItem(role: Role, overrides: ItemOverrides = {}) {
  const location = await activeLocation();
  const fields: Record<string, string> = {
    reportType: overrides.reportType ?? 'LOST',
    itemTitle: overrides.itemTitle ?? 'Black backpack',
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
  return response.body.item as { id: string; reportNumber: string };
}

function submitClaimRequest(token: string, fields: Record<string, string>) {
  let builder = request(app)
    .post('/api/v1/lost-found/claims')
    .set('Authorization', `Bearer ${token}`);

  Object.entries(fields).forEach(([key, value]) => {
    builder = builder.field(key, value);
  });

  return builder;
}

async function submitClaim(token: string, fields: Record<string, string>) {
  const response = await submitClaimRequest(token, fields).expect(201);
  return response.body.claim as {
    id: string;
    claimNumber: string;
    status: string;
    claimant: { id: string };
    item: { id: string; status: string; privateIdentificationDetails?: string };
    linkedLostItem: { id: string } | null;
  };
}

function uniqueTitle(label: string) {
  return `${label} ${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('campuscare-day5-workflow');
  process.env.JWT_SECRET = 'campuscare-day5-workflow-test-secret-32-plus';
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
  ({ LostFoundItem } = await import('../../src/modules/lost-found/items/lostFoundItem.model'));
  ({ ItemMatch } = await import('../../src/modules/lost-found/matches/itemMatch.model'));
  ({ ClaimRequest } = await import('../../src/modules/lost-found/claims/claimRequest.model'));
  ({ Notification } = await import('../../src/shared/models/Notification.model'));
  ({ User } = await import('../../src/modules/auth/user.model'));
  ({ hashPassword } = await import('../../src/modules/auth/auth.service'));
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
    if (role === 'STUDENT_EMPLOYEE') studentId = response.body.user.id as string;
    if (role === 'LOST_FOUND_OFFICER') officerId = response.body.user.id as string;
  }

  const secondStudent = await User.create({
    name: 'Mariam Abdelrahman',
    email: SECOND_STUDENT_EMAIL,
    passwordHash: await hashPassword(SECOND_STUDENT_PASSWORD),
    role: 'STUDENT_EMPLOYEE',
    department: 'Faculty of Commerce',
    isActive: true,
    specializations: [],
    skills: [],
  });
  secondStudentId = secondStudent._id.toString();

  const secondLogin = await login(SECOND_STUDENT_EMAIL, SECOND_STUDENT_PASSWORD).expect(200);
  secondStudentToken = secondLogin.body.token as string;
}, 240_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
});

describe('Day 5 — Lost & Found matching, claims and handover (US3)', () => {
  it('runs lost → match → confirm → claim → verify → approve → handover', async () => {
    const title = uniqueTitle('Black North Face backpack');
    const sharedDescription =
      'Lost near the engineering lab with a blue keychain inside the front pocket.';
    const lost = await createItem('STUDENT_EMPLOYEE', {
      reportType: 'LOST',
      itemTitle: title,
      description: sharedDescription,
      privateIdentificationDetails: 'Initials Y.E. under the flap and a blue keychain.',
      occurrenceDate: '2026-11-01T10:00:00.000Z',
    });
    const found = await createItem('LOST_FOUND_OFFICER', {
      reportType: 'FOUND',
      itemTitle: title,
      description:
        'Found near the engineering lab with a blue keychain inside the front pocket.',
      privateIdentificationDetails: 'Initials Y.E. under the flap, blue keychain in the pocket.',
      occurrenceDate: '2026-11-01T12:00:00.000Z',
      locationDetails: 'Engineering lab reception desk',
    });

    await request(app)
      .get('/api/v1/lost-found/matches')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(403);

    const suggestions = await request(app)
      .get('/api/v1/lost-found/matches')
      .query({ status: 'SUGGESTED', itemId: lost.id })
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .expect(200);

    const match = (
      suggestions.body.data as Array<{
        id: string;
        score: number;
        level: string;
        status: string;
        lostItem: { id: string } | null;
        foundItem: { id: string } | null;
      }>
    ).find(
      (candidate) =>
        candidate.lostItem?.id === lost.id && candidate.foundItem?.id === found.id,
    );

    expect(match).toBeDefined();
    expect(match?.level).toBe('STRONG');
    expect(match?.score).toBeGreaterThanOrEqual(80);

    await request(app)
      .patch(`/api/v1/lost-found/matches/${match?.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ action: 'CONFIRM' })
      .expect(403);

    const confirmed = await request(app)
      .patch(`/api/v1/lost-found/matches/${match?.id}`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ action: 'CONFIRM' })
      .expect(200);

    expect(confirmed.body.match.status).toBe('CONFIRMED');
    expect((await LostFoundItem.findById(lost.id))?.status).toBe('MATCH_CONFIRMED');
    expect((await LostFoundItem.findById(found.id))?.status).toBe('MATCH_CONFIRMED');

    const matchNotification = await Notification.findOne({
      userId: studentId,
      type: 'MATCH_CONFIRMED',
    }).lean();
    expect(matchNotification).toBeTruthy();
    expect(matchNotification?.linkUrl).toContain(
      `/lost-found/claims/new?itemId=${found.id}`,
    );
    expect(matchNotification?.linkUrl).toContain(`linkedLostItemId=${lost.id}`);

    const claim = await submitClaim(tokens.get('STUDENT_EMPLOYEE') ?? '', {
      itemId: found.id,
      claimDescription:
        'I left my backpack on the bench outside Lab 204 after the afternoon lecture and realised later that evening.',
      identifyingDetailsProvided: 'My initials are under the flap and there is a blue keychain.',
      linkedLostItemId: lost.id,
    });

    expect(claim.status).toBe('PENDING_REVIEW');
    expect(claim.claimant.id).toBe(studentId);
    expect(claim.item.id).toBe(found.id);
    expect(claim.item.status).toBe('CLAIM_UNDER_REVIEW');
    expect(claim.item).not.toHaveProperty('privateIdentificationDetails');
    expect(claim).not.toHaveProperty('verificationNotes');
    expect(claim.linkedLostItem?.id).toBe(lost.id);
    expect((await LostFoundItem.findById(found.id))?.status).toBe('CLAIM_UNDER_REVIEW');

    const competing = await submitClaim(secondStudentToken, {
      itemId: found.id,
      claimDescription:
        'This backpack is mine. I lost a black backpack near the engineering building last week.',
      identifyingDetailsProvided: 'It has a blue keychain attached inside.',
    });
    expect(competing.status).toBe('PENDING_REVIEW');

    await submitClaimRequest(secondStudentToken, {
      itemId: found.id,
      claimDescription: 'A duplicate claim from the same student should be refused.',
      identifyingDetailsProvided: 'Blue keychain.',
    }).expect(409);

    const ownList = await request(app)
      .get('/api/v1/lost-found/claims')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);
    expect(
      (ownList.body.data as Array<{ claimant: { id: string } }>).every(
        (entry) => entry.claimant.id === studentId,
      ),
    ).toBe(true);

    const queue = await request(app)
      .get('/api/v1/lost-found/claims')
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .expect(200);
    const queueEntry = (
      queue.body.data as Array<{
        id: string;
        item: { privateIdentificationDetails?: string } | null;
      }>
    ).find((entry) => entry.id === claim.id);
    expect(queueEntry?.item?.privateIdentificationDetails).toBe(
      'Initials Y.E. under the flap, blue keychain in the pocket.',
    );

    await request(app)
      .get(`/api/v1/lost-found/claims/${claim.id}`)
      .set('Authorization', `Bearer ${secondStudentToken}`)
      .expect(403);

    const ownClaim = await request(app)
      .get(`/api/v1/lost-found/claims/${claim.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);
    expect(ownClaim.body.claim).not.toHaveProperty('verificationNotes');
    expect(ownClaim.body.claim.item).not.toHaveProperty('privateIdentificationDetails');

    await request(app)
      .patch(`/api/v1/lost-found/claims/${claim.id}/review`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ action: 'START_VERIFICATION' })
      .expect(403);

    const started = await request(app)
      .patch(`/api/v1/lost-found/claims/${claim.id}/review`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({
        action: 'START_VERIFICATION',
        notes: 'Serial checked against the private details on the found report.',
      })
      .expect(200);
    expect(started.body.claim.status).toBe('UNDER_VERIFICATION');
    expect(started.body.claim.verificationNotes).toBe(
      'Serial checked against the private details on the found report.',
    );

    const approved = await request(app)
      .patch(`/api/v1/lost-found/claims/${claim.id}/review`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ action: 'APPROVE', notes: 'Private details matched.' })
      .expect(200);
    expect(approved.body.claim.status).toBe('APPROVED');
    expect((await LostFoundItem.findById(found.id))?.status).toBe('APPROVED_FOR_HANDOVER');

    const autoRejected = await ClaimRequest.findById(competing.id);
    expect(autoRejected?.status).toBe('REJECTED');
    expect(autoRejected?.rejectionReason).toContain('Another claim for this item was approved');

    const rejectionNotification = await Notification.findOne({
      userId: secondStudentId,
      type: 'CLAIM_REJECTED',
    }).lean();
    expect(rejectionNotification).toBeTruthy();
    expect(rejectionNotification?.relatedEntityId?.toString()).toBe(competing.id);

    await request(app)
      .post(`/api/v1/lost-found/claims/${claim.id}/handover`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ receivedByName: 'Youssef El-Ashry' })
      .expect(403);

    const handedOver = await request(app)
      .post(`/api/v1/lost-found/claims/${claim.id}/handover`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ receivedByName: 'Youssef El-Ashry', notes: 'Student ID checked.' })
      .expect(200);

    expect(handedOver.body.claim.status).toBe('COMPLETED');
    expect(handedOver.body.claim.handover.receivedByName).toBe('Youssef El-Ashry');
    expect(handedOver.body.claim.handover.handedOverBy.id).toBe(officerId);
    expect(handedOver.body.claim.handover.handedOverAt).toBeTruthy();
    expect(handedOver.body.claim.handover.notes).toBe('Student ID checked.');
    expect((await LostFoundItem.findById(found.id))?.status).toBe('RETURNED');
    expect((await LostFoundItem.findById(lost.id))?.status).toBe('RETURNED');

    const handoverNotification = await Notification.findOne({
      userId: studentId,
      type: 'HANDOVER_COMPLETED',
    }).lean();
    expect(handoverNotification).toBeTruthy();

    const completedView = await request(app)
      .get(`/api/v1/lost-found/claims/${claim.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);
    expect(completedView.body.claim.status).toBe('COMPLETED');
    expect(completedView.body.claim).not.toHaveProperty('verificationNotes');
  });

  it('returns the found item to OPEN when its only claim is rejected', async () => {
    const found = await createItem('LOST_FOUND_OFFICER', {
      reportType: 'FOUND',
      itemTitle: uniqueTitle('Silver laptop charger'),
      description: 'A silver laptop charger found on the library second floor.',
      privateIdentificationDetails: 'Sticker with initials M.A. on the plug.',
      category: 'Electronics',
      color: 'Silver',
      brand: 'Anker',
      occurrenceDate: '2026-11-02T09:00:00.000Z',
      locationDetails: 'Library second-floor study desk',
    });

    const claim = await submitClaim(tokens.get('STUDENT_EMPLOYEE') ?? '', {
      itemId: found.id,
      claimDescription:
        'I left my charger at the library desk after studying for an exam and forgot to collect it.',
      identifyingDetailsProvided: 'There is a sticker with my initials on the plug.',
    });

    const rejected = await request(app)
      .patch(`/api/v1/lost-found/claims/${claim.id}/review`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({
        action: 'REJECT',
        rejectionReason: 'The identifying details do not match the private details on the found report.',
      })
      .expect(200);

    expect(rejected.body.claim.status).toBe('REJECTED');
    expect(rejected.body.claim.rejectionReason).toContain('do not match');
    expect((await LostFoundItem.findById(found.id))?.status).toBe('OPEN');

    const studentView = await request(app)
      .get(`/api/v1/lost-found/claims/${claim.id}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);
    expect(studentView.body.claim.rejectionReason).toContain('do not match');
  });

  it('enforces claim eligibility, linkage and role rules', async () => {
    const lost = await createItem('STUDENT_EMPLOYEE', {
      reportType: 'LOST',
      itemTitle: uniqueTitle('Brown leather wallet'),
      description: 'Lost a brown leather wallet near the cafeteria.',
      privateIdentificationDetails: 'Student card inside with the name Youssef.',
      category: 'Wallets',
      color: 'Brown',
      occurrenceDate: '2026-11-03T10:00:00.000Z',
    });

    await submitClaimRequest(tokens.get('STUDENT_EMPLOYEE') ?? '', {
      itemId: lost.id,
      claimDescription: 'This is my lost wallet and I would like it returned to me.',
      identifyingDetailsProvided: 'Student card inside.',
    }).expect(400);

    const found = await createItem('LOST_FOUND_OFFICER', {
      reportType: 'FOUND',
      itemTitle: uniqueTitle('Brown leather wallet'),
      description: 'A brown leather wallet was handed in at the cafeteria.',
      privateIdentificationDetails: 'Student card inside with the name Youssef.',
      category: 'Wallets',
      color: 'Brown',
      occurrenceDate: '2026-11-03T11:00:00.000Z',
    });

    await submitClaimRequest(secondStudentToken, {
      itemId: found.id,
      claimDescription: 'I believe this wallet is mine and I can describe what is inside it.',
      identifyingDetailsProvided: 'It contains my student card.',
      linkedLostItemId: lost.id,
    }).expect(400);

    await submitClaimRequest(tokens.get('LOST_FOUND_OFFICER') ?? '', {
      itemId: found.id,
      claimDescription: 'Officers cannot submit claims on behalf of students.',
      identifyingDetailsProvided: 'None.',
    }).expect(403);
  });

  it('never resurrects a dismissed match when recalculation runs', async () => {
    const title = uniqueTitle('Navy blue umbrella');
    const lost = await createItem('STUDENT_EMPLOYEE', {
      reportType: 'LOST',
      itemTitle: title,
      description: 'Lost a navy blue umbrella in the main library.',
      privateIdentificationDetails: 'Wooden handle with a small white scratch.',
      category: 'Other',
      color: 'Navy blue',
      occurrenceDate: '2026-11-04T10:00:00.000Z',
      locationDetails: 'Main library entrance',
    });
    const found = await createItem('LOST_FOUND_OFFICER', {
      reportType: 'FOUND',
      itemTitle: title,
      description: 'Found a navy blue umbrella in the main library.',
      privateIdentificationDetails: 'Wooden handle with a small white scratch.',
      category: 'Other',
      color: 'Navy blue',
      occurrenceDate: '2026-11-04T12:00:00.000Z',
      locationDetails: 'Main library reception',
    });

    const suggestions = await request(app)
      .get('/api/v1/lost-found/matches')
      .query({ status: 'SUGGESTED', itemId: lost.id })
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .expect(200);
    const match = (
      suggestions.body.data as Array<{
        id: string;
        lostItem: { id: string } | null;
        foundItem: { id: string } | null;
      }>
    ).find(
      (candidate) =>
        candidate.lostItem?.id === lost.id && candidate.foundItem?.id === found.id,
    );
    expect(match).toBeDefined();

    await request(app)
      .patch(`/api/v1/lost-found/matches/${match?.id}`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ action: 'DISMISS' })
      .expect(200);

    await request(app)
      .post(`/api/v1/lost-found/items/${lost.id}/recalculate`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(403);

    const recalculated = await request(app)
      .post(`/api/v1/lost-found/items/${lost.id}/recalculate`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .expect(200);
    expect(recalculated.body.created).toBe(0);
    expect(recalculated.body.skipped).toBeGreaterThanOrEqual(1);

    const pairMatches = await ItemMatch.find({
      lostItemId: lost.id,
      foundItemId: found.id,
    });
    expect(pairMatches).toHaveLength(1);
    expect(pairMatches[0]?.status).toBe('DISMISSED');

    const suggestedAfter = await request(app)
      .get('/api/v1/lost-found/matches')
      .query({ status: 'SUGGESTED', itemId: lost.id })
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .expect(200);
    expect(
      (suggestedAfter.body.data as Array<{
        lostItem: { id: string } | null;
        foundItem: { id: string } | null;
      }>).filter(
        (candidate) =>
          candidate.lostItem?.id === lost.id && candidate.foundItem?.id === found.id,
      ),
    ).toHaveLength(0);
  });
});
