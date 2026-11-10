export interface NotificationLocalizationSource {
  type: string;
  title?: string;
  message: string;
  titleKey?: string;
  messageKey?: string;
  params?: Record<string, unknown>;
}

export interface DerivedNotificationLocalization {
  titleKey: string;
  messageKey: string;
  params: Record<string, unknown>;
}

const REQUEST_CODE = /\bMR-\d+\b/;
const WORK_ORDER_CODE = /\bWO-\d+\b/;
const CLAIM_CODE = /\bCLM-\d+\b/;
const ITEM_CODE = /\bLF-\d+\b/;

function firstMatch(value: string, pattern: RegExp): string | undefined {
  return value.match(pattern)?.[0];
}

function extractAfter(value: string, marker: string): string | undefined {
  const index = value.indexOf(marker);
  if (index < 0) {
    return undefined;
  }

  const result = value
    .slice(index + marker.length)
    .replace(/[.!]+$/, '')
    .trim();

  return result || undefined;
}

const BUILDING_AR_BY_EN: Record<string, string> = {
  'Administration & Central Library Building': 'مبنى إدارة الجامعة والمكتبة المركزية',
  'Engineering & Technological Complex': 'مجمع الكليات الهندسية والتكنولوجية',
  'Engineering & Technological Complex A & B': 'مجمع الكليات الهندسية والتكنولوجية',
  'Engineering Building': 'مبنى كلية الهندسة',
  'Medical Sector Complex': 'مجمع الكليات الطبية',
  'Medical Sector Complex A & B': 'مجمع الكليات الطبية',
  'Humanities & Business Building': 'مبنى العلوم الإنسانية والاقتصاد وإدارة الأعمال',
  'Central Workshops & Laboratories Building': 'مبنى الورش والمعامل المركزية',
  'Student Activities & Sports Complex': 'منطقة الأنشطة الطلابية والملاعب الرياضية',
};

const FLOOR_AR_BY_EN: Record<string, string> = {
  'Ground Floor': 'الطابق الأرضي',
  'Floor 1': 'الطابق الأول',
  'Floor 2': 'الطابق الثاني',
  'Floor 3': 'الطابق الثالث',
  'Floor 4': 'الطابق الرابع',
};

function toBilingualParam(
  value: unknown,
  dictionary: Record<string, string>,
): unknown {
  if (typeof value === 'string') {
    const ar = dictionary[value];
    return ar ? { en: value, ar } : value;
  }

  if (value && typeof value === 'object' && 'en' in value) {
    const entry = value as { en?: string; ar?: string };
    if (entry.en && !entry.ar && dictionary[entry.en]) {
      return { en: entry.en, ar: dictionary[entry.en] };
    }
  }

  return value;
}

function enrichNotificationParams(
  params?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!params) {
    return undefined;
  }

  const nextBuilding =
    params.building !== undefined
      ? toBilingualParam(params.building, BUILDING_AR_BY_EN)
      : undefined;
  const nextFloor =
    params.floor !== undefined
      ? toBilingualParam(params.floor, FLOOR_AR_BY_EN)
      : undefined;

  if (nextBuilding === params.building && nextFloor === params.floor) {
    return params;
  }

  return {
    ...params,
    ...(nextBuilding !== undefined ? { building: nextBuilding } : {}),
    ...(nextFloor !== undefined ? { floor: nextFloor } : {}),
  };
}

/**
 * Older notification documents were written before localized keys existed.
 * Derive the same keys and params from their type and stored English text so
 * they switch language too instead of staying frozen in the language they were
 * created in.
 */
export function deriveNotificationLocalization(
  type: string,
  message: string,
): DerivedNotificationLocalization | null {
  switch (type) {
    case 'REQUEST_SUBMITTED': {
      const code = firstMatch(message, REQUEST_CODE);
      const [, title, location] = message.split(' · ');
      const locationParts = location?.match(/^(.*), (.*), Room (.+)$/);

      if (!code) {
        return {
          titleKey: 'newRequestSubmitted',
          messageKey: 'newRequestSubmittedGenericMsg',
          params: {},
        };
      }

      return {
        titleKey: 'newRequestSubmitted',
        messageKey: 'newRequestSubmittedMsg',
        params: {
          code,
          ...(title ? { title } : {}),
          ...(locationParts
            ? {
                building: locationParts[1],
                floor: locationParts[2],
                room: locationParts[3],
              }
            : {}),
        },
      };
    }

    case 'REQUEST_APPROVED': {
      const code = firstMatch(message, REQUEST_CODE);
      if (!code) {
        return null;
      }

      const workOrderCode = firstMatch(message, WORK_ORDER_CODE);

      return workOrderCode
        ? {
            titleKey: 'requestApproved',
            messageKey: 'requestApprovedMsg',
            params: { code, workOrderCode },
          }
        : {
            titleKey: 'requestApproved',
            messageKey: 'requestApprovedNoWorkOrderMsg',
            params: { code },
          };
    }

    case 'REQUEST_REJECTED': {
      const code = firstMatch(message, REQUEST_CODE);
      if (!code) {
        return null;
      }

      const reason =
        extractAfter(message, 'Reason: ') ?? extractAfter(message, 'rejected: ');

      return reason
        ? {
            titleKey: 'requestRejected',
            messageKey: 'requestRejectedWithReason',
            params: { code, reason },
          }
        : {
            titleKey: 'requestRejected',
            messageKey: 'requestRejectedMsg',
            params: { code },
          };
    }

    case 'REQUEST_UNDER_REVIEW': {
      const code = firstMatch(message, REQUEST_CODE);
      return code
        ? {
            titleKey: 'requestUnderReview',
            messageKey: 'requestUnderReviewMsg',
            params: { code },
          }
        : null;
    }

    case 'REQUEST_COMPLETED':
    case 'WORK_ORDER_COMPLETED': {
      const workOrderCode = firstMatch(message, WORK_ORDER_CODE);
      return workOrderCode
        ? {
            titleKey: 'requestCompleted',
            messageKey: 'requestCompletedMsg',
            params: { workOrderCode },
          }
        : null;
    }

    case 'REQUEST_REOPENED': {
      const code = firstMatch(message, REQUEST_CODE);
      if (!code) {
        return null;
      }

      const workOrderCode = firstMatch(message, WORK_ORDER_CODE);
      const reason = extractAfter(message, 'reopened: ')?.split('. Work order')[0]?.trim();

      return workOrderCode
        ? {
            titleKey: 'workOrderReopened',
            messageKey: 'workOrderReopenedMsg',
            params: { code, workOrderCode, reason: reason ?? '' },
          }
        : {
            titleKey: 'workOrderReopened',
            messageKey: 'workOrderReopenedGenericMsg',
            params: { code },
          };
    }

    case 'WORK_ORDER_ASSIGNED':
    case 'WORK_ORDER_REASSIGNED':
    case 'WORK_ORDER_RESCHEDULED': {
      const code = firstMatch(message, WORK_ORDER_CODE);
      if (!code) {
        return null;
      }

      const keys = {
        WORK_ORDER_ASSIGNED: ['workOrderAssigned', 'workOrderAssignedMsg'],
        WORK_ORDER_REASSIGNED: ['workOrderReassigned', 'workOrderReassignedMsg'],
        WORK_ORDER_RESCHEDULED: ['workOrderRescheduled', 'workOrderRescheduledMsg'],
      } as const;
      const [titleKey, messageKey] = keys[type];

      return { titleKey, messageKey, params: { code } };
    }

    case 'WORK_ORDER_CANCELLED': {
      const code = firstMatch(message, REQUEST_CODE);
      const workOrderCode = firstMatch(message, WORK_ORDER_CODE);
      return code && workOrderCode
        ? {
            titleKey: 'workOrderCancelled',
            messageKey: 'workOrderCancelledMsg',
            params: { code, workOrderCode },
          }
        : null;
    }

    case 'WORK_ORDER_OVERDUE': {
      const code = firstMatch(message, WORK_ORDER_CODE);
      return code
        ? {
            titleKey: 'workOrderOverdue',
            messageKey: 'workOrderOverdueMsg',
            params: { code },
          }
        : null;
    }

    case 'CLAIM_SUBMITTED':
    case 'CLAIM_PENDING': {
      const code = firstMatch(message, CLAIM_CODE);
      const itemCode = firstMatch(message, ITEM_CODE);

      if (!code) {
        return {
          titleKey: 'claimSubmitted',
          messageKey: 'claimSubmittedGenericMsg',
          params: {},
        };
      }

      return code && itemCode
        ? {
            titleKey: 'claimSubmitted',
            messageKey: 'claimSubmittedMsg',
            params: { code, itemCode },
          }
        : {
            titleKey: 'claimSubmitted',
            messageKey: 'claimSubmittedGenericMsg',
            params: {},
          };
    }

    case 'CLAIM_APPROVED': {
      const code = firstMatch(message, CLAIM_CODE);
      return code
        ? {
            titleKey: 'claimApproved',
            messageKey: 'claimApprovedMsg',
            params: { code },
          }
        : null;
    }

    case 'CLAIM_REJECTED': {
      const code = firstMatch(message, CLAIM_CODE);
      if (!code) {
        return null;
      }

      const reason =
        extractAfter(message, 'rejected: ') ?? extractAfter(message, 'Reason: ');

      return reason
        ? {
            titleKey: 'claimRejected',
            messageKey: 'claimRejectedMsg',
            params: { code, reason },
          }
        : {
            titleKey: 'claimRejected',
            messageKey: 'claimRejectedGenericMsg',
            params: { code },
          };
    }

    case 'CLAIM_NOT_APPROVED': {
      const code = firstMatch(message, CLAIM_CODE);
      return code
        ? {
            titleKey: 'claimNotApproved',
            messageKey: 'claimNotApprovedMsg',
            params: { code },
          }
        : null;
    }

    case 'HANDOVER_COMPLETED': {
      const code = firstMatch(message, CLAIM_CODE);
      if (!code) {
        return null;
      }

      const name = extractAfter(message, 'handed to ');

      return name
        ? {
            titleKey: 'handoverCompleted',
            messageKey: 'handoverCompletedMsg',
            params: { code, name },
          }
        : {
            titleKey: 'handoverCompleted',
            messageKey: 'handoverCompletedGenericMsg',
            params: { code },
          };
    }

    case 'MATCH_SUGGESTED':
    case 'MATCH_CONFIRMED': {
      const code = firstMatch(message, ITEM_CODE);
      return code
        ? {
            titleKey: 'matchConfirmed',
            messageKey: 'matchConfirmedMsg',
            params: { code },
          }
        : {
            titleKey: 'matchConfirmed',
            messageKey: 'matchConfirmedGenericMsg',
            params: {},
          };
    }

    default:
      return null;
  }
}

/**
 * Returns a copy of a legacy notification with localization metadata attached.
 * Notifications that already have both keys are returned unchanged.
 */
export function applyNotificationLocalization<T extends NotificationLocalizationSource>(
  notification: T,
): T & Partial<DerivedNotificationLocalization> {
  if (notification.titleKey && notification.messageKey) {
    const enrichedParams = enrichNotificationParams(notification.params);
    return enrichedParams === notification.params
      ? notification
      : {
          ...notification,
          type: notification.type,
          ...(notification.title !== undefined ? { title: notification.title } : {}),
          message: notification.message,
          titleKey: notification.titleKey,
          messageKey: notification.messageKey,
          params: enrichedParams,
        };
  }

  const derived = deriveNotificationLocalization(notification.type, notification.message);

  if (!derived) {
    return notification;
  }

  return {
    ...notification,
    type: notification.type,
    ...(notification.title !== undefined ? { title: notification.title } : {}),
    message: notification.message,
    titleKey: notification.titleKey ?? derived.titleKey,
    messageKey: notification.messageKey ?? derived.messageKey,
    params: enrichNotificationParams(notification.params ?? derived.params),
  };
}
