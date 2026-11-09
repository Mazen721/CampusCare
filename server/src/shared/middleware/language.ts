import type { RequestHandler } from 'express';
import { requestContext, type RequestLanguage } from '../utils/requestContext';

function parseLanguage(header?: string): RequestLanguage {
  if (!header) return 'ar';
  const trimmed = header.trim().toLowerCase();
  if (trimmed.startsWith('en')) return 'en';
  return 'ar';
}

export const languageMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.header('accept-language');
  const lang = parseLanguage(header);
  req.lang = lang;
  requestContext.run({ lang }, () => next());
};
