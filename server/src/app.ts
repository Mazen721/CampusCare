import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';
import { LOCAL_UPLOADS_DIR } from './shared/services/upload.service';
import { apiRouter } from './routes';

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Same-origin requests, curl and server health checks have no Origin header.
    if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86_400,
};

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Local development fallback for image uploads when Cloudinary is not configured.
if (!env.IS_PRODUCTION && !env.CLOUDINARY_CONFIGURED) {
  app.use(
    '/uploads',
    (_req, res, next) => {
      // Images are rendered by the SPA on a different origin in development and
      // production deployments (Vercel + Render), so helmet's same-origin default
      // would make every uploaded preview fail to load.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(LOCAL_UPLOADS_DIR, { fallthrough: true }),
  );
}

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
