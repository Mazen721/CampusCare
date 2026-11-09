import i18n from '@/i18n';

export function humanize(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function enumLabel(group: string, value: string): string {
  if (!value) return '';
  return i18n.t(`enums.${group}.${value}`, { defaultValue: humanize(value) });
}

export function humanizeEnum(value: string): string {
  return humanize(value);
}
