import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Role } from '../../src/config/constants';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=',
  'base64',
);

let replSet: MongoMemoryReplSet;
let app: Express;
let seedDatabase: (options?: { silent?: boolean }) => Promise<unknown>;
let SEED_PASSWORD: string;
let User: (typeof import('../../src/modules/auth/user.model'))['User'];
let Location: (typeof import('../../src/modules/locations/location.model'))['Location'];
let MaintenanceRequest: (typeof import('../../src/modules/maintenance/requests/maintenanceRequest.model'))['MaintenanceRequest'];
let WorkOrder: (typeof import('../../src/modules/maintenance/work-orders/workOrder.model'))['WorkOrder'];
let Notification: (typeof import('../../src/shared/models/Notification.model'))['Notification'];
let ActivityLog: (typeof import('../../src/shared/models/ActivityLog.model'))['ActivityLog'];
let DEMO_ACCOUNTS: (typeof import('../../src/config/constants'))['DEMO_ACCOUNTS'];

const tokens = new Map<Role, string>();
const uploadedPublicIds: string[] = [];
let primaryAttachmentPath = '';

function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

function bearer(role: Role) {
  return `Bearer ${tokens.get(role)}`;
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('campuscare-day2');
  process.env.JWT_SECRET = 'campuscare-day2-test-secret-with-32-plus-characters';
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
  ({ WorkOrder } = await import('../../src/modules/maintenance/work-orders/workOrder.model'));
  ({ Notification } = await import('../../src/shared/models/Notification.model'));
  ({ ActivityLog } = await import('../../src/shared/models/ActivityLog.model'));
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
  for (const publicId of uploadedPublicIds) {
    const filename = publicId.replace(/^local:/, '');
    await fs.unlink(path.resolve(process.cwd(), 'uploads', filename)).catch(() => undefined);
  }

  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

describe('Day 2 locations', () => {
  let locationId: string;

  it('lists active locations for any signed-in user', async () => {
    const response = await request(app)
      .get('/api/v1/locations?limit=100')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(20);
    expect(response.body.data.every((location: { isActive: boolean }) => location.isActive)).toBe(
      true,
    );
  });

  it('refuses location management to a student', async () => {
    await request(app)
      .post('/api/v1/locations')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({
        buildingName: 'Forbidden Building',
        floor: '1',
        room: '101',
        locationType: 'ROOM',
      })
      .expect(403);
  });

  it('creates a location as Admin and refuses a duplicate combination', async () => {
    const response = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({
        buildingName: 'Innovation & Robotics Center',
        floor: 'Ground Floor',
        room: 'R01',
        locationType: 'LAB',
        description: 'Robotics fabrication and testing lab',
      })
      .expect(201);

    locationId = response.body.location.id as string;
    expect(response.body.location.isActive).toBe(true);

    await request(app)
      .post('/api/v1/locations')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({
        buildingName: 'Innovation & Robotics Center',
        floor: 'Ground Floor',
        room: 'R01',
        locationType: 'LAB',
      })
      .expect(409);
  });

  it('edits a location and deactivates it instead of removing the record', async () => {
    const updated = await request(app)
      .patch(`/api/v1/locations/${locationId}`)
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({ description: 'Robotics fabrication, testing and student projects lab' })
      .expect(200);

    expect(updated.body.location.description).toContain('student projects');

    const deactivated = await request(app)
      .delete(`/api/v1/locations/${locationId}`)
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(deactivated.body.location.isActive).toBe(false);
    expect(await Location.countDocuments({ _id: locationId })).toBe(1);
  });

  it('hides inactive locations from non-admins and includes them for Admin when requested', async () => {
    const student = await request(app)
      .get('/api/v1/locations?includeInactive=true&limit=100')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(
      student.body.data.some((location: { id: string }) => location.id === locationId),
    ).toBe(false);

    const admin = await request(app)
      .get('/api/v1/locations?includeInactive=true&limit=100')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(admin.body.data.some((location: { id: string }) => location.id === locationId)).toBe(
      true,
    );
  });

  it('records location changes in the immutable activity log', async () => {
    const actions = await ActivityLog.find({ entityType: 'Location' }).distinct('action');
    expect(actions).toEqual(
      expect.arrayContaining(['LOCATION_CREATED', 'LOCATION_UPDATED', 'LOCATION_DEACTIVATED']),
    );
  });
});

describe('Day 2 users', () => {
  let technicianId: string;
  let otherStudentId: string;

  it('lets Admin list users without password hashes and refuses a student', async () => {
    const response = await request(app)
      .get('/api/v1/users?limit=100')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(8);
    expect(
      response.body.data.every(
        (user: Record<string, unknown>) => !('passwordHash' in user),
      ),
    ).toBe(true);

    await request(app)
      .get('/api/v1/users')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(403);

    await request(app)
      .get('/api/v1/users')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(403);
  });

  it('creates and edits a technician account as Admin', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({
        name: 'Nour El-Haddad',
        email: 'n.elhaddad@mansnu.edu.eg',
        password: 'CampusCare#2026',
        role: 'TECHNICIAN',
        department: 'Information Technology & Digital Transformation Unit',
        contactPhone: '+20 100 555 0177',
        specializations: ['Network', 'Hardware'],
        skills: ['Switching', 'Cabling'],
        availability: 'AVAILABLE',
      })
      .expect(201);

    technicianId = response.body.user.id as string;
    expect(response.body.user.role).toBe('TECHNICIAN');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.body.user.specializations).toContain('Network');

    const updated = await request(app)
      .patch(`/api/v1/users/${technicianId}`)
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({ availability: 'BUSY', skills: ['Switching', 'Cabling', 'Wi-Fi surveys'] })
      .expect(200);

    expect(updated.body.user.availability).toBe('BUSY');
    expect(updated.body.user.skills).toContain('Wi-Fi surveys');
  });

  it('creates a second student for ownership checks', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({
        name: 'Mariam Fathy',
        email: 'm.fathy@std.mansnu.edu.eg',
        password: 'CampusCare#2026',
        role: 'STUDENT_EMPLOYEE',
        department: 'Faculty of Commerce',
      })
      .expect(201);

    otherStudentId = response.body.user.id as string;
    expect(otherStudentId).toMatch(/^[a-f\d]{24}$/i);
  });

  it('refuses a duplicate email address', async () => {
    await request(app)
      .post('/api/v1/users')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({
        name: 'Duplicate Account',
        email: DEMO_ACCOUNTS.STUDENT_EMPLOYEE.email,
        password: 'CampusCare#2026',
        role: 'STUDENT_EMPLOYEE',
      })
      .expect(409);
  });

  it('deactivates and reactivates an account through the status endpoint', async () => {
    await request(app)
      .patch(`/api/v1/users/${technicianId}/status`)
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({ isActive: false })
      .expect(200);

    await login('n.elhaddad@mansnu.edu.eg', 'CampusCare#2026').expect(401);

    await request(app)
      .patch(`/api/v1/users/${technicianId}/status`)
      .set('Authorization', bearer('SUPER_ADMIN'))
      .send({ isActive: true })
      .expect(200);

    await login('n.elhaddad@mansnu.edu.eg', 'CampusCare#2026').expect(200);
  });

  it('logs every user change', async () => {
    const actions = await ActivityLog.find({ entityType: 'User' }).distinct('action');
    expect(actions).toEqual(
      expect.arrayContaining(['USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'USER_ACTIVATED']),
    );
  });
});

describe('Day 2 reference data', () => {
  it('returns categories, priorities, statuses and matching thresholds to any user', async () => {
    const response = await request(app)
      .get('/api/v1/meta')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(response.body.maintenanceCategories).toContain('Electrical');
    expect(response.body.lostFoundCategories).toContain('Phones');
    expect(response.body.priorities).toEqual(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
    expect(response.body.requestStatuses).toContain('UNDER_REVIEW');
    expect(response.body.matching.thresholds).toEqual({ STRONG: 80, POSSIBLE: 60 });
    expect(response.body.uploads.maxImages).toBe(3);
  });

  it('requires authentication for reference data', async () => {
    await request(app).get('/api/v1/meta').expect(401);
  });
});

describe('Day 2 maintenance requests and review workflow', () => {
  let primaryRequestId: string;
  let criticalRequestId: string;
  let firstWorkOrderId: string;
  let firstWorkOrderNumber: string;
  let otherStudentToken: string;

  it('issues a session for the second student', async () => {
    const response = await login('m.fathy@std.mansnu.edu.eg', 'CampusCare#2026').expect(200);
    otherStudentToken = response.body.token as string;
  });

  it('rejects an unsupported upload type before creating a request', async () => {
    const location = await Location.findOne({ isActive: true });
    expect(location).not.toBeNull();

    const response = await request(app)
      .post('/api/v1/maintenance/requests')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .field('title', 'Projector does not power on')
      .field('description', 'The ceiling projector in the lecture hall shows no power indicator.')
      .field('category', 'Hardware')
      .field('priority', 'MEDIUM')
      .field('locationId', location!._id.toString())
      .attach('images', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UPLOAD_INVALID');
  });

  it('rejects an image larger than 5 MB', async () => {
    const location = await Location.findOne({ isActive: true });

    const response = await request(app)
      .post('/api/v1/maintenance/requests')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .field('title', 'Large image upload')
      .field('description', 'This request sends an image that is larger than the allowed limit.')
      .field('category', 'Software')
      .field('priority', 'LOW')
      .field('locationId', location!._id.toString())
      .attach('images', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'huge.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('UPLOAD_TOO_LARGE');
  });

  it('submits a request with an image, notifies managers and logs the action', async () => {
    const location = await Location.findOne({ isActive: true });
    expect(location).not.toBeNull();

    const response = await request(app)
      .post('/api/v1/maintenance/requests')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .field('title', 'Projector flickers during lectures')
      .field(
        'description',
        'The projector in Engineering Hall 2 flickers every few minutes and sometimes loses signal.',
      )
      .field('category', 'Hardware')
      .field('priority', 'MEDIUM')
      .field('locationId', location!._id.toString())
      .field('equipmentDescription', 'Epson EB-L200F ceiling projector')
      .attach('images', tinyPng, { filename: 'projector.png', contentType: 'image/png' })
      .expect(201);

    primaryRequestId = response.body.request.id as string;
    expect(response.body.request.requestNumber).toMatch(/^MR-\d{4}$/);
    expect(response.body.request.status).toBe('SUBMITTED');
    expect(response.body.request.priority).toBe('MEDIUM');
    expect(response.body.request.attachments).toHaveLength(1);
    expect(response.body.request.attachments[0].url).toContain('/uploads/');
    primaryAttachmentPath = new URL(response.body.request.attachments[0].url as string).pathname;

    uploadedPublicIds.push(response.body.request.attachments[0].publicId as string);

    const managerInbox = await request(app)
      .get('/api/v1/notifications?limit=20')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(managerInbox.body.unreadCount).toBeGreaterThanOrEqual(1);
    expect(
      managerInbox.body.data.some(
        (notification: { type: string }) => notification.type === 'REQUEST_SUBMITTED',
      ),
    ).toBe(true);

    const log = await ActivityLog.findOne({
      action: 'REQUEST_SUBMITTED',
      entityId: primaryRequestId,
    });
    expect(log).not.toBeNull();
  });

  it('serves local uploads with a cross-origin resource policy for the SPA', async () => {
    expect(primaryAttachmentPath).toMatch(/^\/uploads\//);

    const response = await request(app).get(primaryAttachmentPath).expect(200);

    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(response.headers['content-type']).toContain('image/png');
  });

  it('refuses a request against an inactive location', async () => {
    const inactive = await Location.findOne({ isActive: false });

    const response = await request(app)
      .post('/api/v1/maintenance/requests')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .field('title', 'Old lab air conditioner')
      .field('description', 'The air conditioner in the deactivated lab needs an inspection.')
      .field('category', 'Air Conditioning')
      .field('priority', 'LOW')
      .field('locationId', inactive!._id.toString());

    expect(response.status).toBe(400);
  });

  it('creates a second request and orders HIGH/CRITICAL first by default', async () => {
    const location = await Location.findOne({ isActive: true });

    const response = await request(app)
      .post('/api/v1/maintenance/requests')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .field('title', 'Server room cooling failure')
      .field(
        'description',
        'The primary server room is overheating and the backup cooling unit is not starting.',
      )
      .field('category', 'Air Conditioning')
      .field('priority', 'CRITICAL')
      .field('locationId', location!._id.toString())
      .expect(201);

    criticalRequestId = response.body.request.id as string;
    expect(response.body.request.requestNumber).toBe('MR-1002');

    const list = await request(app)
      .get('/api/v1/maintenance/requests?limit=10')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(list.body.data).toHaveLength(2);
    expect(list.body.data[0].priority).toBe('CRITICAL');
    expect(list.body.data[1].id).toBe(primaryRequestId);

    await request(app)
      .get('/api/v1/maintenance/requests')
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(403);
  });

  it('supports search and filters on the request list', async () => {
    const search = await request(app)
      .get('/api/v1/maintenance/requests?q=projector')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(search.body.total).toBe(1);
    expect(search.body.data[0].id).toBe(primaryRequestId);

    const filter = await request(app)
      .get('/api/v1/maintenance/requests?priority=CRITICAL')
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);

    expect(filter.body.total).toBe(1);
    expect(filter.body.data[0].id).toBe(criticalRequestId);
  });

  it('enforces request detail ownership and role access', async () => {
    await request(app)
      .get(`/api/v1/maintenance/requests/${primaryRequestId}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    await request(app)
      .get(`/api/v1/maintenance/requests/${primaryRequestId}`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .expect(403);

    await request(app)
      .get(`/api/v1/maintenance/requests/${primaryRequestId}`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .expect(403);

    await request(app)
      .get(`/api/v1/maintenance/requests/${primaryRequestId}`)
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(403);

    await request(app)
      .get(`/api/v1/maintenance/requests/${primaryRequestId}`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    await request(app)
      .get(`/api/v1/maintenance/requests/${primaryRequestId}`)
      .set('Authorization', bearer('SUPER_ADMIN'))
      .expect(200);
  });

  it('refuses review actions from the wrong roles and a rejection without notes', async () => {
    await request(app)
      .patch(`/api/v1/maintenance/requests/${primaryRequestId}/review`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ action: 'APPROVE' })
      .expect(403);

    await request(app)
      .patch(`/api/v1/maintenance/requests/${criticalRequestId}/review`)
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ action: 'REJECT', notes: 'Not an officer action' })
      .expect(403);

    const response = await request(app)
      .patch(`/api/v1/maintenance/requests/${criticalRequestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'REJECT' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION');
  });

  it('moves a request under review and notifies the requester', async () => {
    const response = await request(app)
      .patch(`/api/v1/maintenance/requests/${primaryRequestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'UNDER_REVIEW', notes: 'Checking the projector warranty first.' })
      .expect(200);

    expect(response.body.request.status).toBe('UNDER_REVIEW');
    expect(response.body.request.reviewNotes).toContain('warranty');

    const studentInbox = await request(app)
      .get('/api/v1/notifications?limit=20')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(
      studentInbox.body.data.some(
        (notification: { type: string }) => notification.type === 'REQUEST_UNDER_REVIEW',
      ),
    ).toBe(true);
  });

  it('rejects a request with notes and keeps it terminal', async () => {
    const response = await request(app)
      .patch(`/api/v1/maintenance/requests/${criticalRequestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'REJECT', notes: 'Facilities will handle this under a separate project.' })
      .expect(200);

    expect(response.body.request.status).toBe('REJECTED');
    expect(response.body.request.reviewNotes).toContain('separate project');

    await request(app)
      .patch(`/api/v1/maintenance/requests/${criticalRequestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'APPROVE' })
      .expect(409);
  });

  it('approves a request inside a transaction and creates exactly one work order', async () => {
    const response = await request(app)
      .patch(`/api/v1/maintenance/requests/${primaryRequestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'APPROVE', notes: 'Approved. Assign to the AV specialist.' })
      .expect(200);

    expect(response.body.request.status).toBe('APPROVED');
    expect(response.body.request.currentWorkOrder).not.toBeNull();
    expect(response.body.request.currentWorkOrder.status).toBe('PENDING_ASSIGNMENT');
    expect(response.body.workOrder.sourceType).toBe('REACTIVE');

    firstWorkOrderId = response.body.workOrder.id as string;
    firstWorkOrderNumber = response.body.workOrder.workOrderNumber as string;
    expect(firstWorkOrderNumber).toMatch(/^WO-\d{4}$/);

    expect(
      await WorkOrder.countDocuments({ maintenanceRequestId: primaryRequestId }),
    ).toBe(1);

    await request(app)
      .patch(`/api/v1/maintenance/requests/${primaryRequestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'APPROVE' })
      .expect(409);

    expect(
      await WorkOrder.countDocuments({ maintenanceRequestId: primaryRequestId }),
    ).toBe(1);

    const studentInbox = await request(app)
      .get('/api/v1/notifications?limit=30')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(
      studentInbox.body.data.some(
        (notification: { type: string }) => notification.type === 'REQUEST_APPROVED',
      ),
    ).toBe(true);

    const log = await ActivityLog.findOne({ action: 'REQUEST_APPROVED' });
    expect(log?.metadata).toMatchObject({ workOrderId: firstWorkOrderId });
  });

  it('approves a SUBMITTED request directly and creates its work order', async () => {
    const location = await Location.findOne({ isActive: true });

    const created = await request(app)
      .post('/api/v1/maintenance/requests')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .field('title', 'Broken lock on lab door')
      .field('description', 'The electronic lock on the robotics lab door no longer reads student cards.')
      .field('category', 'General Maintenance')
      .field('priority', 'HIGH')
      .field('locationId', location!._id.toString())
      .expect(201);

    const requestId = created.body.request.id as string;

    const approved = await request(app)
      .patch(`/api/v1/maintenance/requests/${requestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'APPROVE' })
      .expect(200);

    expect(approved.body.request.status).toBe('APPROVED');
    expect(approved.body.request.currentWorkOrder).not.toBeNull();
    expect(
      await WorkOrder.countDocuments({ maintenanceRequestId: requestId }),
    ).toBe(1);
  });

  it('links the approved work order in request detail', async () => {
    const response = await request(app)
      .get(`/api/v1/maintenance/requests/${primaryRequestId}`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(response.body.request.currentWorkOrder.id).toBe(firstWorkOrderId);
    expect(response.body.request.currentWorkOrder.workOrderNumber).toBe(
      firstWorkOrderNumber,
    );

    const workOrder = await WorkOrder.findById(firstWorkOrderId);
    expect(workOrder?.sourceType).toBe('REACTIVE');
    expect(workOrder?.status).toBe('PENDING_ASSIGNMENT');
    expect(workOrder?.maintenanceRequestId?.toString()).toBe(primaryRequestId);
  });
});

describe('Day 2 notifications', () => {
  let studentNotificationId: string;

  it('lists only the signed-in user notifications with an unread count', async () => {
    const studentInbox = await request(app)
      .get('/api/v1/notifications?limit=30')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(studentInbox.body.unreadCount).toBeGreaterThanOrEqual(2);
    studentNotificationId = studentInbox.body.data[0].id as string;

    const managerInbox = await request(app)
      .get('/api/v1/notifications?limit=30')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    const managerIds = new Set(
      managerInbox.body.data.map((notification: { id: string }) => notification.id),
    );
    expect(
      studentInbox.body.data.every(
        (notification: { id: string }) => !managerIds.has(notification.id),
      ),
    ).toBe(true);
  });

  it('marks one notification as read for its owner only', async () => {
    await request(app)
      .patch(`/api/v1/notifications/${studentNotificationId}/read`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(404);

    const response = await request(app)
      .patch(`/api/v1/notifications/${studentNotificationId}/read`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(response.body.notification.isRead).toBe(true);
  });

  it('marks all notifications as read and updates the unread count', async () => {
    const before = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(before.body.unreadCount).toBeGreaterThan(0);

    const result = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(result.body.updated).toBeGreaterThan(0);

    const after = await request(app)
      .get('/api/v1/notifications?unreadOnly=true')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(after.body.unreadCount).toBe(0);
    expect(after.body.data).toHaveLength(0);
  });

  it('returns 400 for an invalid notification id', async () => {
    await request(app)
      .patch('/api/v1/notifications/not-an-id/read')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(400);
  });

  it('stores notifications with links the client can follow', async () => {
    const notification = await Notification.findOne({
      type: 'REQUEST_APPROVED',
    });

    expect(notification).not.toBeNull();
    expect(notification?.linkUrl).toBe(`/maintenance/requests/${notification?.relatedEntityId}`);
  });
});

describe('Day 2 persistence checks', () => {
  it('keeps request statuses consistent after the review workflow', async () => {
    const documents = await MaintenanceRequest.find().sort({ createdAt: 1 }).lean();

    expect(documents.map((document) => document.status)).toEqual(
      expect.arrayContaining(['APPROVED', 'REJECTED']),
    );
    expect(documents.filter((document) => document.status === 'SUBMITTED')).toHaveLength(0);
    expect(documents.every((document) => document.requestNumber.startsWith('MR-'))).toBe(true);
  });
});
