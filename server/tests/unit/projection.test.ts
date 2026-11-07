import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import {
  toPublicItem,
  type ProjectableItem,
} from '../../src/modules/lost-found/items/item.projection';

const PUBLIC_FIELDS = [
  'brand',
  'category',
  'color',
  'description',
  'id',
  'images',
  'itemTitle',
  'location',
  'locationDetails',
  'occurrenceDate',
  'reportNumber',
  'reportType',
  'status',
].sort();

function buildItem(overrides: Partial<ProjectableItem> = {}): ProjectableItem {
  return {
    _id: new Types.ObjectId(),
    reportNumber: 'LF-1001',
    reportType: 'LOST',
    itemTitle: 'Black North Face backpack',
    description: 'Lost near the engineering lab after the afternoon lecture.',
    category: 'Bags',
    color: 'Black',
    brand: 'North Face',
    locationId: {
      _id: new Types.ObjectId(),
      buildingName: 'Engineering Building',
      floor: 'Floor 1',
      room: '102',
      locationType: 'ROOM',
    },
    locationDetails: 'Bench outside Room 102',
    occurrenceDate: new Date('2026-11-01T10:00:00.000Z'),
    images: [
      { url: 'https://cdn.example.com/backpack.jpg', publicId: 'campuscare/backpack' },
    ],
    status: 'OPEN',
    ...overrides,
  };
}

describe('toPublicItem projection', () => {
  it('returns exactly the public fields and nothing private', () => {
    const item = buildItem() as ProjectableItem & {
      privateIdentificationDetails: string;
      reporterId: Types.ObjectId;
    };
    item.privateIdentificationDetails = 'Serial SN-998877 and a scratched keychain';
    item.reporterId = new Types.ObjectId();

    const result = toPublicItem(item);

    expect(Object.keys(result).sort()).toEqual(PUBLIC_FIELDS);
    expect(result).not.toHaveProperty('privateIdentificationDetails');
    expect(result).not.toHaveProperty('reporterId');
    expect(result).not.toHaveProperty('reporter');
    expect(JSON.stringify(result)).not.toContain('SN-998877');
  });

  it('serializes a populated location and copies image fields only', () => {
    const item = buildItem();
    const result = toPublicItem(item);

    expect(result.location).toEqual({
      id: (item.locationId as { _id: Types.ObjectId })._id.toString(),
      buildingName: 'Engineering Building',
      floor: 'Floor 1',
      room: '102',
      locationType: 'ROOM',
    });
    expect(result.images).toEqual([
      { url: 'https://cdn.example.com/backpack.jpg', publicId: 'campuscare/backpack' },
    ]);
  });

  it('returns a null location when the reference is not populated', () => {
    const result = toPublicItem(buildItem({ locationId: new Types.ObjectId() }));

    expect(result.location).toBeNull();
    expect(result.status).toBe('OPEN');
    expect(result.reportType).toBe('LOST');
  });
});
