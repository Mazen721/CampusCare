import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { queryClient } from '@/lib/queryClient';
import { ar } from './locales/ar';
import { en } from './locales/en';

export type Lang = 'ar' | 'en';

const STORAGE_KEY = 'campuscare.lang';

function getStoredLang(): Lang | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'ar' || value === 'en') {
      return value;
    }
  } catch {
    // Ignore localStorage access failures (e.g. security sandboxing)
  }
  return null;
}

const initialLang: Lang = getStoredLang() ?? 'ar';

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});

export function getLang(): Lang {
  const current = i18n.language;
  return current === 'en' ? 'en' : 'ar';
}

export function applyDocumentLang(lang: Lang = getLang()): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = i18n.t('meta.title');
}

export async function setLang(lang: Lang): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore storage write failures
  }
  await i18n.changeLanguage(lang);
  applyDocumentLang(lang);
  void queryClient.invalidateQueries();
}

export default i18n;
