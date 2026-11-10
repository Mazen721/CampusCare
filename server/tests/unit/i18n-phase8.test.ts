import { beforeAll, describe, expect, it } from 'vitest';

// Dummy environment for isolated unit tests
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'super-secret-jwt-key-with-at-least-32-characters';

describe('Phase 8: I18n Checks and Schema Integrity', () => {
  let Location: typeof import('../../src/modules/locations/location.model').Location;
  let User: typeof import('../../src/modules/auth/user.model').User;
  let PreventivePlan: typeof import('../../src/modules/preventive/preventivePlan.model').PreventivePlan;
  let ApiError: typeof import('../../src/shared/utils/ApiError').ApiError;

  beforeAll(async () => {
    const locMod = await import('../../src/modules/locations/location.model');
    const userMod = await import('../../src/modules/auth/user.model');
    const prevMod = await import('../../src/modules/preventive/preventivePlan.model');
    const errMod = await import('../../src/shared/utils/ApiError');

    Location = locMod.Location;
    User = userMod.User;
    PreventivePlan = prevMod.PreventivePlan;
    ApiError = errMod.ApiError;
  });

  describe('Bilingual model schema validation (Phase 6 requirements)', () => {
    it('test_location_schema_defines_arabic_and_english_fields', () => {
      const paths = Location.schema.paths;
      expect(paths['buildingName']).toBeDefined();
      expect(paths['buildingNameAr']).toBeDefined();
      expect(paths['floor']).toBeDefined();
      expect(paths['floorAr']).toBeDefined();
      expect(paths['room']).toBeDefined();
      expect(paths['roomAr']).toBeDefined();
      expect(paths['descriptionAr']).toBeDefined();
    });

    it('test_user_schema_includes_departmentAr_and_nameAr', () => {
      const paths = User.schema.paths;
      expect(paths['department']).toBeDefined();
      expect(paths['departmentAr']).toBeDefined();
      expect(paths['name']).toBeDefined();
      expect(paths['nameAr']).toBeDefined();
    });

    it('test_preventive_plan_schema_defines_titleAr_and_descriptionAr', () => {
      const paths = PreventivePlan.schema.paths;
      expect(paths['title']).toBeDefined();
      expect(paths['titleAr']).toBeDefined();
      expect(paths['description']).toBeDefined();
      expect(paths['descriptionAr']).toBeDefined();
    });
  });

  describe('ApiError messageKey propagation', () => {
    it.each([
      ['notFound', 404, 'notFound'],
      ['unauthorized', 401, 'unauthorized'],
      ['forbidden', 403, 'forbidden'],
      ['badRequest', 400, 'validationFailed'],
      ['conflict', 409, 'duplicateRecord'],
    ])('test_apierror_%s_factory_carries_default_or_explicit_messageKey', (factoryName, expectedStatus, expectedKey) => {
      const fn = (ApiError as any)[factoryName] as (msg: string, key?: string) => InstanceType<typeof ApiError>;
      const err = fn('Test error message', expectedKey);
      expect(err.statusCode).toBe(expectedStatus);
      expect(err.messageKey).toBe(expectedKey);
    });
  });
});
