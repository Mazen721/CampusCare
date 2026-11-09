import { describe, expect, it } from 'vitest';
import {
  applyNotificationLocalization,
  deriveNotificationLocalization,
} from '../../src/shared/utils/notificationLocalization';

describe('legacy notification localization', () => {
  it('derives request-submitted keys and params from the stored English message', () => {
    const derived = deriveNotificationLocalization(
      'REQUEST_SUBMITTED',
      'MR-1001 · Projector flickering in Engineering Lab 1 · Engineering Building, Floor 1, Room 101',
    );

    expect(derived).toEqual({
      titleKey: 'newRequestSubmitted',
      messageKey: 'newRequestSubmittedMsg',
      params: {
        code: 'MR-1001',
        title: 'Projector flickering in Engineering Lab 1',
        building: 'Engineering Building',
        floor: 'Floor 1',
        room: '101',
      },
    });
  });

  it('uses the generic request-submitted message when the old notification has no code', () => {
    const derived = deriveNotificationLocalization(
      'REQUEST_SUBMITTED',
      'A new HIGH priority request was submitted for the engineering complex.',
    );

    expect(derived?.messageKey).toBe('newRequestSubmittedGenericMsg');
  });

  it('derives request-approved keys for messages with and without a work-order code', () => {
    expect(
      deriveNotificationLocalization(
        'REQUEST_APPROVED',
        'MR-1001 was approved. Work order WO-1001 has been created.',
      ),
    ).toEqual({
      titleKey: 'requestApproved',
      messageKey: 'requestApprovedMsg',
      params: { code: 'MR-1001', workOrderCode: 'WO-1001' },
    });

    expect(
      deriveNotificationLocalization(
        'REQUEST_APPROVED',
        'MR-2008 was approved and a work order has been created.',
      ),
    ).toEqual({
      titleKey: 'requestApproved',
      messageKey: 'requestApprovedNoWorkOrderMsg',
      params: { code: 'MR-2008' },
    });
  });

  it('derives overdue work-order keys', () => {
    expect(
      deriveNotificationLocalization(
        'WORK_ORDER_OVERDUE',
        'WO-2005 has passed its expected completion date.',
      ),
    ).toEqual({
      titleKey: 'workOrderOverdue',
      messageKey: 'workOrderOverdueMsg',
      params: { code: 'WO-2005' },
    });
  });

  it('derives claim, handover and match keys', () => {
    expect(
      deriveNotificationLocalization(
        'CLAIM_SUBMITTED',
        'Claim CLM-1001 was submitted for found item LF-1003.',
      ),
    ).toMatchObject({ messageKey: 'claimSubmittedMsg', params: { code: 'CLM-1001', itemCode: 'LF-1003' } });

    expect(
      deriveNotificationLocalization(
        'HANDOVER_COMPLETED',
        'Claim CLM-1001 was completed. The item was handed to Youssef El-Ashry.',
      ),
    ).toMatchObject({ messageKey: 'handoverCompletedMsg', params: { name: 'Youssef El-Ashry' } });

    expect(
      deriveNotificationLocalization(
        'MATCH_CONFIRMED',
        'A found item matching your lost report LF-1002 was confirmed.',
      ),
    ).toMatchObject({ messageKey: 'matchConfirmedMsg', params: { code: 'LF-1002' } });
  });

  it('leaves notifications that already have keys untouched', () => {
    const notification = {
      type: 'WORK_ORDER_ASSIGNED',
      title: 'Work order assigned',
      message: 'You have been assigned work order WO-2002.',
      titleKey: 'workOrderAssigned',
      messageKey: 'workOrderAssignedMsg',
      params: { code: 'WO-2002' },
    };

    expect(applyNotificationLocalization(notification)).toBe(notification);
  });

  it('derives work-order-completed keys and enriches known building/floor params', () => {
    expect(
      deriveNotificationLocalization(
        'WORK_ORDER_COMPLETED',
        'WO-2007 was completed. Please confirm the repair from your request.',
      ),
    ).toEqual({
      titleKey: 'requestCompleted',
      messageKey: 'requestCompletedMsg',
      params: { workOrderCode: 'WO-2007' },
    });

    const enriched = applyNotificationLocalization({
      type: 'REQUEST_SUBMITTED',
      message:
        'MR-1001 · Projector flickering in Engineering Lab 1 · Engineering Building, Ground Floor, Room 101',
    });

    expect(enriched.params).toEqual({
      code: 'MR-1001',
      title: 'Projector flickering in Engineering Lab 1',
      building: { en: 'Engineering Building', ar: 'مبنى كلية الهندسة' },
      floor: { en: 'Ground Floor', ar: 'الطابق الأرضي' },
      room: '101',
    });
  });

  it('preserves prototype-getter fields (type, title, message) when spreading Mongoose-like documents', () => {
    const proto = {
      get type() {
        return 'WORK_ORDER_OVERDUE';
      },
      get title() {
        return 'Work order overdue';
      },
      get message() {
        return 'WO-2005 has passed its expected completion date.';
      },
    };
    const doc = Object.create(proto) as {
      type: string;
      title: string;
      message: string;
    };

    const localized = applyNotificationLocalization(doc);

    expect(localized.type).toBe('WORK_ORDER_OVERDUE');
    expect(localized.title).toBe('Work order overdue');
    expect(localized.message).toBe('WO-2005 has passed its expected completion date.');
    expect(localized.titleKey).toBe('workOrderOverdue');
    expect(localized.messageKey).toBe('workOrderOverdueMsg');
  });

  it('returns the original notification when the type has no known mapping', () => {
    const notification = {
      type: 'SOMETHING_NEW',
      title: 'Custom',
      message: 'Custom message',
    };

    expect(applyNotificationLocalization(notification)).toBe(notification);
  });
});
