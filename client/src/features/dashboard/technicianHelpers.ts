import type { TFunction } from 'i18next';
import { pickLang } from '@/i18n/localize';
import { formatDate, formatNumber } from '@/lib/utils';
import type { TechnicianScheduleItem } from '@/types/dashboard';
import type { Priority } from '@/types/meta';

const PRIORITY_RANK: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const COMPACT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

/**
 * Splits scheduled work orders into the #1 spotlight task (active IN_PROGRESS first,
 * then overdue / highest priority) and the remaining tasks ordered by schedule.
 */
export function selectTechnicianTasks(schedule: TechnicianScheduleItem[]): {
  spotlightTask: TechnicianScheduleItem | null;
  remainingTasks: TechnicianScheduleItem[];
} {
  if (schedule.length === 0) {
    return { spotlightTask: null, remainingTasks: [] };
  }

  const ranked = schedule
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aActive = a.item.status === 'IN_PROGRESS' ? 0 : 1;
      const bActive = b.item.status === 'IN_PROGRESS' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;

      const overdueDiff = Number(b.item.overdue) - Number(a.item.overdue);
      if (overdueDiff !== 0) return overdueDiff;

      const priorityDiff =
        (PRIORITY_RANK[a.item.priority] ?? 4) - (PRIORITY_RANK[b.item.priority] ?? 4);
      if (priorityDiff !== 0) return priorityDiff;

      return a.index - b.index;
    });

  const spotlightTask = ranked[0]?.item ?? null;
  const remainingTasks = spotlightTask
    ? schedule.filter((item) => item.id !== spotlightTask.id)
    : [];

  return { spotlightTask, remainingTasks };
}

/**
 * Extracts localized building name and "floor · room" display parts for field cards.
 */
export function getTechnicianLocationParts(
  location: TechnicianScheduleItem['location'],
  fallbackLabel: string,
): { building: string; floorRoom: string | null } {
  if (!location) {
    return { building: fallbackLabel, floorRoom: null };
  }

  const building = pickLang(location.buildingName, location.buildingNameAr) || fallbackLabel;
  const floor = pickLang(location.floor, location.floorAr);
  const room = pickLang(location.room, location.roomAr);
  const floorRoom = [floor, room].filter(Boolean).join(' · ') || null;

  return { building, floorRoom };
}

/**
 * Formats a concise target or scheduled timestamp for field workbench cards.
 */
export function formatTechnicianTargetTime(
  workOrder: TechnicianScheduleItem,
  t: TFunction,
): string {
  if (workOrder.overdue && workOrder.expectedCompletion) {
    return t('dashboard.dueByLabel', {
      date: formatDate(workOrder.expectedCompletion, COMPACT_DATE_TIME_OPTIONS),
    });
  }

  if (workOrder.expectedCompletion) {
    return t('dashboard.targetTimeLabel', {
      date: formatDate(workOrder.expectedCompletion, COMPACT_DATE_TIME_OPTIONS),
    });
  }

  if (workOrder.scheduledStart) {
    return t('dashboard.scheduledTimeLabel', {
      date: formatDate(workOrder.scheduledStart, COMPACT_DATE_TIME_OPTIONS),
    });
  }

  return t('workOrders.unscheduled');
}

/**
 * Formats average resolution duration in hours, returning an em dash when no data exists.
 */
export function formatTechnicianResolutionHours(
  avgHours: number | null | undefined,
  completedCount: number,
  t: TFunction,
): string {
  if (avgHours === null || avgHours === undefined || (avgHours === 0 && completedCount === 0)) {
    return '—';
  }

  if (avgHours < 0.1) {
    return t('dashboard.underTenthHour');
  }

  return t('dashboard.hoursShort', {
    hours: formatNumber(avgHours, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
  });
}
