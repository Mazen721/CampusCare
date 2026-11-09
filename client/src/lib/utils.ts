import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getLang } from '@/i18n';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase();
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const locale = getLang() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: 'medium' }).format(date);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  const locale = getLang() === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(value);
}

