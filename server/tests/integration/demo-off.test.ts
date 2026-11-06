import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let app: Express;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/campuscare-demo-off';
  process.env.JWT_SECRET = 'campuscare-demo-off-test-secret-32-plus-characters';
  process.env.JWT_EXPIRES_IN = '1d';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.DEMO_MODE = 'false';
  process.env.GEMINI_API_KEY = '';
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';

  ({ app } = await import('../../src/app'));
});

describe('Demo mode disabled', () => {
  it('keeps the public health check available', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('does not register the demo-login route', async () => {
    const response = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ role: 'SUPER_ADMIN' })
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
