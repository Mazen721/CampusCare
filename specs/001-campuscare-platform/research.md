# Research: CampusCare Platform

All decisions follow MASTER_SPEC.md v4.0. No NEEDS CLARIFICATION items remain.

## R1. Monorepo tooling
- **Decision**: npm workspaces (`server`, `client`) with a root `dev` script; no shared package.
- **Rationale**: Minimal tooling for a 7-day build; client and server Zod schemas stay local.
- **Alternatives**: Turborepo/Nx (overhead), shared types package (extra build step).

## R2. Transactions in development and tests
- **Decision**: Develop against MongoDB Atlas (free tier is a replica set). Integration tests use
  `mongodb-memory-server` `MongoMemoryReplSet`.
- **Rationale**: Standalone mongod rejects transactions (MASTER_SPEC section 2.6).
- **Alternatives**: Local replica set via Docker (more setup).

## R3. Human-readable numbers
- **Decision**: `Counter` collection, `findOneAndUpdate({_id}, {$inc:{seq:1}}, {upsert:true,new:true})`,
  formatted `MR-1001`, `WO-1001`, `LF-1001`, `CLM-1001`; called inside the creating transaction
  when one exists.
- **Alternatives**: ObjectId only (not user-friendly), count-based (race conditions).

## R4. Auth
- **Decision**: JWT (1 day) in `Authorization: Bearer`, stored in localStorage; `authenticate`
  reloads the user and rejects `isActive:false`. Demo login route is registered only when
  `DEMO_MODE=true`.
- **Alternatives**: Cookies (explicitly rejected, section 2.5).

## R5. Gemini integration
- **Decision**: `@google/genai` `GoogleGenAI({ apiKey })`, `models.generateContent` with
  `GEMINI_MODEL` (default `gemini-2.5-flash`; verify current name before building), system
  instruction, JSON response for insights. Wrap in `Promise.race` with 15 s timeout; catch 429 and
  network errors; strip markdown fences; validate with Zod; on failure return
  `{ available:false, message }` with HTTP 200. Insights cached per period in `AiInsightCache`.
- **Alternatives**: Calling from client (forbidden), streaming (unneeded).

## R6. Matching keywords
- **Decision**: Lowercase, strip punctuation, remove a small fixed English stop-word list in config,
  Jaccard over token sets of title + public description, scaled `min(1, j/0.4)`.
- **Alternatives**: Text-index score (not deterministic across data), AI (forbidden).

## R7. Preventive recurrence
- **Decision**: Pure `nextDate(date, type, intervalDays)` using date-fns (`addDays`, `addMonths`);
  `advancePastNow()` loops until the date is in the future (missed occurrences skipped).
  Duplicate-key error (E11000) on the partial unique index counts as already generated.

## R8. Public projection
- **Decision**: `privateIdentificationDetails` `select:false`; a single `toPublicItem(doc)` mapper
  (populated location, no reporter contact) used by all public responses; privileged paths add
  `.select('+privateIdentificationDetails')` explicitly.

## R9. Notifications delivery
- **Decision**: TanStack Query `refetchInterval: 30000` on `GET /notifications`. No websockets.

## R10. Permission-matrix gaps resolved without adding scope
- **Calendar, Admin "View"** (section 3) vs `GET /maintenance/calendar` "(MGR all; TECH own)":
  allow ADM read-only on the same endpoint.
- **AI Insights, Admin "View"** (section 3) vs `POST /ai/maintenance-insights` (MGR): Admin
  dashboard payload includes the latest cached insights read-only; Admin cannot generate.
- **Health route**: `GET /health` mounted at the server root (host health check, section 12) and
  public.

## R11. Hosting
- **Decision**: Client on Vercel with `vercel.json` SPA rewrite; server on Render (warm before
  demo); CORS allowlist from comma-separated `CLIENT_URL`.
