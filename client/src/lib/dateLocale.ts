import { format, formatDistanceToNow } from 'date-fns';
import { arEG, enUS } from 'date-fns/locale';
import { getLang } from '@/i18n';

export const dateFnsLocale = () => (getLang() === 'ar' ? arEG : enUS);

const EASTERN_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toWesternDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String(EASTERN_DIGITS.indexOf(d)));
}

export function fmt(
  date: Date | number | string,
  formatStr: string,
  options?: Parameters<typeof format>[2],
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = format(dateObj, formatStr, {
    locale: dateFnsLocale(),
    ...options,
  });
  return toWesternDigits(formatted);
}

export function fmtDistanceToNow(
  date: Date | number | string,
  options?: Parameters<typeof formatDistanceToNow>[1],
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = formatDistanceToNow(dateObj, {
    locale: dateFnsLocale(),
    ...options,
  });
  return toWesternDigits(formatted);
}
