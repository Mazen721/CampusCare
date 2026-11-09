import { describe, expect, it } from 'vitest';
import { addDays, endOfWeek, format, startOfWeek } from 'date-fns';
import { arEG, enUS } from 'date-fns/locale';

const EASTERN_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toWesternDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String(EASTERN_DIGITS.indexOf(d)));
}

describe('Phase 4: Dates and numbers (i18n)', () => {
  describe('toWesternDigits', () => {
    it('converts Eastern Arabic numerals to Western digits', () => {
      expect(toWesternDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
      expect(toWesternDigits('السبت ١٥ نوفمبر ٢٠٢٦')).toBe('السبت 15 نوفمبر 2026');
      expect(toWesternDigits('12345')).toBe('12345');
    });
  });

  describe('Intl locale formatting (ar-EG-u-nu-latn vs en-US)', () => {
    const testDate = new Date('2026-11-09T12:00:00Z');

    it('formats dates in ar-EG-u-nu-latn with Western digits', () => {
      const formatted = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'medium' }).format(testDate);
      expect(formatted).toMatch(/[0-9]/);
      expect(formatted).not.toMatch(/[٠-٩]/);
    });

    it('formats dates in en-US with Western digits', () => {
      const formatted = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(testDate);
      expect(formatted).toContain('Nov');
      expect(formatted).toMatch(/[0-9]/);
    });

    it('formats numbers in ar-EG-u-nu-latn with Western digits', () => {
      const formatted = new Intl.NumberFormat('ar-EG-u-nu-latn').format(123456);
      expect(formatted).toMatch(/123/);
      expect(formatted).not.toMatch(/[٠-٩]/);
    });
  });

  describe('Calendar Saturday week start (weekStartsOn: 6)', () => {
    const wednesday = new Date('2026-11-11T12:00:00Z'); // Wednesday

    it('starts the week on Saturday (day 6 of week)', () => {
      const satStart = startOfWeek(wednesday, { weekStartsOn: 6 });
      expect(satStart.getDay()).toBe(6); // Saturday
    });

    it('ends the week on Friday (day 5 of week)', () => {
      const friEnd = endOfWeek(wednesday, { weekStartsOn: 6 });
      expect(friEnd.getDay()).toBe(5); // Friday
    });

    it('generates the 7 weekdays starting Saturday in Arabic and English', () => {
      const refSat = startOfWeek(wednesday, { weekStartsOn: 6 });
      const arWeekdays = Array.from({ length: 7 }, (_, i) =>
        format(addDays(refSat, i), 'EEE', { locale: arEG }),
      );
      const enWeekdays = Array.from({ length: 7 }, (_, i) =>
        format(addDays(refSat, i), 'EEE', { locale: enUS }),
      );

      expect(arWeekdays[0]).toBe('سبت');
      expect(arWeekdays[6]).toBe('جمعة');
      expect(enWeekdays[0]).toBe('Sat');
      expect(enWeekdays[6]).toBe('Fri');
    });
  });
});
