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
let ServiceFeedback: (typeof import('../../src/modules/maintenance/feedback/serviceFeedback.model'))['ServiceFeedback'];
let Notification: (typeof import('../../src/shared/models/Notification.model'))['Notification'];
let DEMO_ACCOUNTS: (typeof import('../../src/config/constants'))['DEMO_ACCOUNTS'];

const tokens = new Map<string, string>();

function login(email: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

function bearer(roleOrEmail: string) {
  return `Bearer ${tokens.get(roleOrEmail)}`;
}

async function tokenForEmail(email: string) {
  const response = await login(email, SEED_PASSWORD).expect(200);
  return response.body.token as string;
}

async function activeLocationId() {
  const location = await Location.findOne({ isActive: true });
  if (!location) {
    throw new Error('Seed is missing an active location');
  }
  return location._id;
}

async function secondAvailableTechnician() {
  const technician = await User.findOne({
    role: 'TECHNICIAN',
    isActive: true,
    availability: 'AVAILABLE',
    email: { $ne: DEMO_ACCOUNTS.TECHNICIAN.email },
  });
  if (!technician) {
    throw new Error('Seed is missing a second available technician');
  }
  return technician;
}

async function submitRequest(title: string) {
  const locationId = await activeLocationId();
  const response = await request(app)
    .post('/api/v1/maintenance/requests')
    .set('Authorization', bearer('STUDENT_EMPLOYEE'))
    .field('title', title)
    .field('description', 'Water is reaching the floor and the unit will not stay running.')
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
    .send({ action: 'APPROVE', notes: 'Approved for dispatch' })
    .expect(200);

  return response.body.workOrder.id as string;
}

function assignmentWindow() {
  return {
    scheduledStart: new Date(Date.now() + 60_000).toISOString(),
    expectedCompletion: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  };
}

async function assignWorkOrder(workOrderId: string, technicianId: string) {
  return request(app)
    .patch(`/api/v1/work-orders/${workOrderId}/assign`)
    .set('Authorization', bearer('MAINTENANCE_MANAGER'))
    .send({ technicianId, ...assignmentWindow() })
    .expect(200);
}

async function preparedWorkOrder(
  title: string,
  stage: 'approved' | 'assigned' | 'started' | 'completed' | 'closed',
) {
  const requestId = await submitRequest(title);
  const workOrderId = await approveRequest(requestId);

  if (stage === 'approved') {
    return { requestId, workOrderId, technicianId: '', technicianToken: '' };
  }

  const technician = await secondAvailableTechnician();
  const technicianId = technician._id.toString();
  const technicianToken = await tokenForEmail(technician.email);
  await assignWorkOrder(workOrderId, technicianId);

  if (stage === 'assigned') {
    return { requestId, workOrderId, technicianId, technicianToken };
  }

  await request(app)
    .patch(`/api/v1/work-orders/${workOrderId}/start`)
    .set('Authorization', `Bearer ${technicianToken}`)
    .expect(200);

  if (stage === 'started') {
    return { requestId, workOrderId, technicianId, technicianToken };
  }

  await request(app)
    .patch(`/api/v1/work-orders/${workOrderId}/complete`)
    .set('Authorization', `Bearer ${technicianToken}`)
    .send({ resolutionDetails: 'Replaced the seal and confirmed the leak stopped.' })
    .expect(200);

  if (stage === 'completed') {
    return { requestId, workOrderId, technicianId, technicianToken };
  }

  await request(app)
    .patch(`/api/v1/maintenance/requests/${requestId}/confirm`)
    .set('Authorization', bearer('STUDENT_EMPLOYEE'))
    .expect(200);

  return { requestId, workOrderId, technicianId, technicianToken };
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = replSet.getUri('campuscare-day3');
  process.env.JWT_SECRET = 'campuscare-day3-test-secret-with-32-plus-characters';
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
  ({ ServiceFeedback } = await import(
    '../../src/modules/maintenance/feedback/serviceFeedback.model'
  ));
  ({ Notification } = await import('../../src/shared/models/Notification.model'));
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
}, 240_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

describe('Day 3 — Technicians slice (US5)', () => {
  it.each(['MAINTENANCE_MANAGER', 'SUPER_ADMIN'] as const)(
    'places technicians who match the category before the others when %s lists them',
    async (role) => {
      const response = await request(app)
        .get('/api/v1/technicians?category=Electrical')
        .set('Authorization', bearer(role))
        .expect(200);

      const technicians = response.body.data as Array<{
        specializations: string[];
        matchesCategory: boolean;
      }>;
      const firstNonMatch = technicians.findIndex((technician) => !technician.matchesCategory);

      expect(firstNonMatch).toBeGreaterThan(0);
      expect(technicians[0]?.specializations).toContain('Electrical');
      expect(
        technicians.slice(0, firstNonMatch).every((technician) => technician.matchesCategory),
      ).toBe(true);
    },
  );

  it('returns live workload, rating, and resolution hours for a technician', async () => {
    const email = `metrics-${Date.now()}@campus.edu`;
    const created = await request(app)
      .post('/api/v1/technicians')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({
        name: 'Metric Tech',
        email,
        password: 'Password123!',
        specializations: ['Plumbing'],
        availability: 'AVAILABLE',
      })
      .expect(201);

    const technicianId = created.body.technician.id as string;
    const student = await User.findOne({ role: 'STUDENT_EMPLOYEE' });
    const locationId = await activeLocationId();
    if (!student) {
      throw new Error('Seed is missing a student employee');
    }

    const started = new Date('2026-01-01T08:00:00.000Z');
    const finished = new Date('2026-01-01T10:00:00.000Z');
    const activeRequest = await MaintenanceRequest.create({
      requestNumber: `MR-METRIC-ACTIVE-${technicianId}`,
      requesterId: student._id,
      title: 'Open valve inspection',
      description: 'Isolation valve needs a check before the lab opens.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      locationId,
      status: 'IN_PROGRESS',
      reopenCount: 0,
    });
    const completedRequest = await MaintenanceRequest.create({
      requestNumber: `MR-METRIC-DONE-${technicianId}`,
      requesterId: student._id,
      title: 'Closed leak repair',
      description: 'Leak under the sink was marked complete.',
      category: 'Plumbing',
      priority: 'LOW',
      locationId,
      status: 'CLOSED',
      reopenCount: 0,
    });
    const spareRequest = await MaintenanceRequest.create({
      requestNumber: `MR-METRIC-SPARE-${technicianId}`,
      requesterId: student._id,
      title: 'Spare rating request',
      description: 'Used only so a second rating can be stored.',
      category: 'Plumbing',
      priority: 'LOW',
      locationId,
      status: 'CLOSED',
      reopenCount: 0,
    });

    await WorkOrder.create({
      workOrderNumber: `WO-METRIC-ACTIVE-${technicianId}`,
      sourceType: 'REACTIVE',
      maintenanceRequestId: activeRequest._id,
      assignedTechnicianId: technicianId,
      title: 'Open valve inspection',
      description: 'Isolation valve needs a check before the lab opens.',
      category: 'Plumbing',
      priority: 'MEDIUM',
      locationId,
      status: 'ASSIGNED',
      scheduledStart: started,
      expectedCompletion: finished,
    });
    const completedWorkOrder = await WorkOrder.create({
      workOrderNumber: `WO-METRIC-DONE-${technicianId}`,
      sourceType: 'REACTIVE',
      maintenanceRequestId: completedRequest._id,
      assignedTechnicianId: technicianId,
      title: 'Closed leak repair',
      description: 'Leak under the sink was marked complete.',
      category: 'Plumbing',
      priority: 'LOW',
      locationId,
      status: 'COMPLETED',
      actualStart: started,
      completedAt: finished,
      resolutionDetails: 'Replaced the washer.',
    });

    await ServiceFeedback.create({
      maintenanceRequestId: completedRequest._id,
      workOrderId: completedWorkOrder._id,
      technicianId,
      requesterId: student._id,
      rating: 5,
    });
    await ServiceFeedback.create({
      maintenanceRequestId: spareRequest._id,
      workOrderId: completedWorkOrder._id,
      technicianId,
      requesterId: student._id,
      rating: 1,
    });

    const detail = await request(app)
      .get(`/api/v1/technicians/${technicianId}`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(detail.body.technician.activeWorkOrderCount).toBe(1);
    expect(detail.body.technician.activeTasks).toEqual([
      expect.objectContaining({ title: 'Open valve inspection', status: 'ASSIGNED' }),
    ]);
    expect(detail.body.technician.completedWorkOrderCount).toBe(1);
    expect(detail.body.technician.averageRating).toBe(3);
    expect(detail.body.technician.averageResolutionHours).toBe(2);
  });

  it('stores a new account as a technician when the client sends another role', async () => {
    const email = `tech-${Date.now()}@campus.edu`;
    const response = await request(app)
      .post('/api/v1/technicians')
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({
        name: 'Jordan Sparks',
        email,
        password: 'Password123!',
        role: 'SUPER_ADMIN',
        specializations: ['Plumbing'],
        availability: 'AVAILABLE',
      })
      .expect(201);

    expect(response.body.technician.role).toBe('TECHNICIAN');
    expect(response.body.technician.email).toBe(email.toLowerCase());

    const saved = await User.findById(response.body.technician.id);
    expect(saved?.role).toBe('TECHNICIAN');
  });

  it('refuses access to technicians endpoint for Student role', async () => {
    await request(app)
      .get('/api/v1/technicians')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(403);
  });
});

describe('Day 3 — Maintenance full lifecycle (US2)', () => {
  it('refuses a technician start while the work order is still unassigned', async () => {
    const { workOrderId } = await preparedWorkOrder(
      'Unassigned hallway air conditioner',
      'approved',
    );

    await request(app)
      .patch(`/api/v1/work-orders/${workOrderId}/start`)
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(403);
  });

  it('notifies the assigned technician when a manager assigns the work order', async () => {
    const { workOrderId, technicianId } = await preparedWorkOrder(
      'Assigned hallway air conditioner',
      'assigned',
    );

    const notification = await Notification.findOne({
      userId: technicianId,
      type: 'WORK_ORDER_ASSIGNED',
      relatedEntityId: workOrderId,
    });
    expect(notification).not.toBeNull();
  });

  it('refuses start by a technician who is not assigned to the work order', async () => {
    const { workOrderId } = await preparedWorkOrder(
      'Someone else starts the air conditioner',
      'assigned',
    );

    await request(app)
      .patch(`/api/v1/work-orders/${workOrderId}/start`)
      .set('Authorization', bearer('TECHNICIAN'))
      .expect(403);
  });

  it('moves the request to in progress when the assigned technician starts', async () => {
    const { requestId, workOrderId, technicianToken } = await preparedWorkOrder(
      'Assigned technician starts the air conditioner',
      'assigned',
    );

    const response = await request(app)
      .patch(`/api/v1/work-orders/${workOrderId}/start`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .expect(200);

    expect(response.body.workOrder.status).toBe('IN_PROGRESS');
    expect(response.body.workOrder.actualStart).toBeTruthy();

    const maintenanceRequest = await MaintenanceRequest.findById(requestId);
    expect(maintenanceRequest?.status).toBe('IN_PROGRESS');
  });

  it('keeps a note added by the assigned technician', async () => {
    const { workOrderId, technicianToken } = await preparedWorkOrder(
      'Technician notes the compressor seal',
      'started',
    );

    const response = await request(app)
      .post(`/api/v1/work-orders/${workOrderId}/notes`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .send({ note: 'Inspected compressor, ordered replacement seal' })
      .expect(200);

    expect(response.body.workOrder.technicianNotes).toEqual([
      expect.objectContaining({ note: 'Inspected compressor, ordered replacement seal' }),
    ]);
  });

  it('completes the work order and moves the request to completed', async () => {
    const { requestId, workOrderId, technicianToken } = await preparedWorkOrder(
      'Technician finishes the air conditioner',
      'started',
    );

    const response = await request(app)
      .patch(`/api/v1/work-orders/${workOrderId}/complete`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .send({ resolutionDetails: 'Replaced AC seal, cleaned condensate line, tested cooling.' })
      .expect(200);

    expect(response.body.workOrder.status).toBe('COMPLETED');
    expect(response.body.workOrder.completedAt).toBeTruthy();

    const maintenanceRequest = await MaintenanceRequest.findById(requestId);
    expect(maintenanceRequest?.status).toBe('COMPLETED');
  });

  it('closes the request when the requester confirms the resolution', async () => {
    const { requestId } = await preparedWorkOrder(
      'Requester confirms the air conditioner',
      'completed',
    );

    const response = await request(app)
      .patch(`/api/v1/maintenance/requests/${requestId}/confirm`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(response.body.request.status).toBe('CLOSED');
  });

  it('accepts one feedback rating from the requester and refuses a second', async () => {
    const { requestId, technicianId } = await preparedWorkOrder(
      'Requester rates the air conditioner repair',
      'closed',
    );

    const created = await request(app)
      .post('/api/v1/feedback')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({
        maintenanceRequestId: requestId,
        rating: 5,
        comment: 'Fast repair and very polite technician!',
      })
      .expect(201);

    expect(created.body.feedback.rating).toBe(5);
    expect(created.body.feedback.technician.id).toBe(technicianId);

    await request(app)
      .post('/api/v1/feedback')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ maintenanceRequestId: requestId, rating: 4 })
      .expect(409);
  });

  it('returns the requester feedback when filtered by that request', async () => {
    const { requestId } = await preparedWorkOrder(
      'Requester filters feedback for the air conditioner',
      'closed',
    );

    await request(app)
      .post('/api/v1/feedback')
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ maintenanceRequestId: requestId, rating: 5 })
      .expect(201);

    const filtered = await request(app)
      .get(`/api/v1/feedback?maintenanceRequestId=${requestId}`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .expect(200);

    expect(filtered.body.data).toEqual([
      expect.objectContaining({ maintenanceRequestId: requestId, rating: 5 }),
    ]);
  });

  it('refuses feedback from someone who did not submit the request', async () => {
    const { requestId } = await preparedWorkOrder(
      'Officer cannot rate the air conditioner',
      'closed',
    );

    await request(app)
      .post('/api/v1/feedback')
      .set('Authorization', bearer('LOST_FOUND_OFFICER'))
      .send({ maintenanceRequestId: requestId, rating: 3 })
      .expect(403);
  });
});

describe('Day 3 — Reopen and cancel workflows (US2)', () => {
  it('reopens a completed request and returns the work order to assigned with the old resolution as a system note', async () => {
    const { requestId, workOrderId } = await preparedWorkOrder(
      'Flickering lights in room 204',
      'completed',
    );

    const response = await request(app)
      .patch(`/api/v1/maintenance/requests/${requestId}/reopen`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ reason: 'Light fixture started buzzing and flickering again.' })
      .expect(200);

    expect(response.body.request.status).toBe('REOPENED');
    expect(response.body.request.reopenCount).toBe(1);

    const workOrder = await WorkOrder.findById(workOrderId);
    expect(workOrder?.status).toBe('ASSIGNED');
    expect(workOrder?.completedAt).toBeFalsy();
    expect(workOrder?.resolutionDetails).toBeFalsy();
    expect(
      workOrder?.technicianNotes.some(
        (note) => note.isSystem && note.note.includes('Previous resolution'),
      ),
    ).toBe(true);
  });

  it('lets a manager close a request after it was reopened', async () => {
    const { requestId } = await preparedWorkOrder(
      'Manager closes the reopened light fixture',
      'completed',
    );

    await request(app)
      .patch(`/api/v1/maintenance/requests/${requestId}/reopen`)
      .set('Authorization', bearer('STUDENT_EMPLOYEE'))
      .send({ reason: 'The fixture started buzzing again after the first repair.' })
      .expect(200);

    const response = await request(app)
      .patch(`/api/v1/maintenance/requests/${requestId}/confirm`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .expect(200);

    expect(response.body.request.status).toBe('CLOSED');
  });

  it('cancels a work order, returns the request to review, and creates a new work order on re-approval', async () => {
    const { requestId, workOrderId } = await preparedWorkOrder(
      'Water fountain low pressure',
      'approved',
    );

    const cancelled = await request(app)
      .patch(`/api/v1/work-orders/${workOrderId}/cancel`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ reason: 'Fountain slated for replacement next month.' })
      .expect(200);

    expect(cancelled.body.workOrder.status).toBe('CANCELLED');
    expect(cancelled.body.workOrder.cancelReason).toContain('slated for replacement');

    const maintenanceRequest = await MaintenanceRequest.findById(requestId);
    expect(maintenanceRequest?.status).toBe('UNDER_REVIEW');

    const reapproved = await request(app)
      .patch(`/api/v1/maintenance/requests/${requestId}/review`)
      .set('Authorization', bearer('MAINTENANCE_MANAGER'))
      .send({ action: 'APPROVE', notes: 'Re-approved after plan review' })
      .expect(200);

    expect(reapproved.body.workOrder.id).not.toBe(workOrderId);
  });
});
