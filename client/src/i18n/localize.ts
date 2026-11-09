import i18n, { getLang } from './index';

export function pickLang(en?: string | null, ar?: string | null): string {
  return getLang() === 'ar' && ar?.trim() ? ar : (en ?? '');
}

export function resolveParams(
  params?: Record<string, unknown> | null,
): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const resolved: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val && typeof val === 'object' && ('en' in val || 'ar' in val)) {
      const bilingual = val as { en?: string | null; ar?: string | null };
      resolved[key] = pickLang(bilingual.en, bilingual.ar);
    } else if (typeof val === 'string' || typeof val === 'number') {
      resolved[key] = val;
    }
  }
  return resolved;
}

export function tr<T extends object>(obj: T | null | undefined, field: keyof T & string): string {
  if (!obj) return '';
  const rec = obj as Record<string, unknown>;
  return pickLang(rec[field] as string | undefined, rec[`${field}Ar`] as string | undefined);
}

export interface FormattableLocation {
  buildingName: string;
  buildingNameAr?: string;
  floor: string;
  floorAr?: string;
  room: string;
  roomAr?: string;
}

export function formatLocation(loc?: FormattableLocation | null): string {
  if (!loc) return '';
  const building = pickLang(loc.buildingName, loc.buildingNameAr);
  const floor = pickLang(loc.floor, loc.floorAr);
  const room = pickLang(loc.room, loc.roomAr);
  return i18n.t('locations.format', { building, floor, room });
}
