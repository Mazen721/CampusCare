import {
  CLAIM_STATUSES,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_COUNT,
  IMAGE_MIME_TYPES,
  ITEM_STATUSES,
  LOCATION_TYPES,
  LOST_FOUND_CATEGORIES,
  MAINTENANCE_CATEGORIES,
  MATCH_LEVELS,
  MATCH_STATUSES,
  PRIORITIES,
  RECURRENCE_TYPES,
  REPORT_TYPES,
  REQUEST_STATUSES,
  ROLES,
  SOURCE_TYPES,
  TECHNICIAN_AVAILABILITIES,
  WORK_ORDER_STATUSES,
} from '../../config/constants';
import { MATCHING_THRESHOLDS, MATCHING_WEIGHTS } from '../../config/matching.config';

/**
 * Reference data shared by every signed-in user. There is intentionally no
 * settings UI; configuration lives on the server.
 */
export function getMeta() {
  return {
    roles: ROLES,
    priorities: PRIORITIES,
    maintenanceCategories: MAINTENANCE_CATEGORIES,
    lostFoundCategories: LOST_FOUND_CATEGORIES,
    requestStatuses: REQUEST_STATUSES,
    workOrderStatuses: WORK_ORDER_STATUSES,
    itemStatuses: ITEM_STATUSES,
    claimStatuses: CLAIM_STATUSES,
    matchStatuses: MATCH_STATUSES,
    matchLevels: MATCH_LEVELS,
    reportTypes: REPORT_TYPES,
    sourceTypes: SOURCE_TYPES,
    recurrenceTypes: RECURRENCE_TYPES,
    technicianAvailabilities: TECHNICIAN_AVAILABILITIES,
    locationTypes: LOCATION_TYPES,
    matching: {
      weights: MATCHING_WEIGHTS,
      thresholds: MATCHING_THRESHOLDS,
    },
    uploads: {
      maxImages: IMAGE_MAX_COUNT,
      maxBytes: IMAGE_MAX_BYTES,
      mimeTypes: IMAGE_MIME_TYPES,
    },
  };
}
