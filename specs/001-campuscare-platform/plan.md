# Implementation Plan: CampusCare Platform

**Branch**: `001-campuscare-platform` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-campuscare-platform/spec.md`

## Summary

Build the CampusCare university operations platform (Maintenance + Lost & Found, 5 roles, 2 AI
features) as a TypeScript modular monolith: an Express + Mongoose API on MongoDB Atlas and a React
SPA. All status changes go through pure state-machine validators; Lost & Found matching is a pure
config-driven scoring function; multi-document actions run in Mongoose transactions; Gemini is
called only from the backend with a structured fallback. MASTER_SPEC.md v4.0 is authoritative for
every detail referenced below.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS (server); TypeScript 5.x, React 18 (client)

**Primary Dependencies**: Server: Express 4, Mongoose 8, Zod, bcryptjs, jsonwebtoken, multer,
cloudinary, helmet, cors, @google/genai. Client: Vite, Tailwind CSS, shadcn/ui, React Router,
TanStack Query v5, React Hook Form + Zod, Lucide React, Recharts, date-fns, sonner.

**Storage**: MongoDB Atlas (replica set, required for transactions); images on Cloudinary
(`{ url, publicId }`), local disk fallback in development only.

**Testing**: vitest (server unit tests for state machines, matching, recurrence, public projection;
projection integration test via supertest + mongodb-memory-server replica set).

**Target Platform**: Web. Client on Vercel, server on Render or Railway, database on Atlas.

**Project Type**: Web application (monorepo `/server` + `/client`).

**Performance Goals**: Demo scale; pages usable within normal web expectations; notifications
polled every 30 s.

**Constraints**: 7-day solo build; frozen scope (MASTER_SPEC section 15); no cron, no websockets,
no rate limiting; AI timeout ~15 s; uploads JPEG/PNG/WebP ≤ 5 MB, ≤ 3 per entity; JWT 1 day.

**Scale/Scope**: Single campus; 5 roles; 13 collections; ~55 endpoints; ~30 pages.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How the plan complies | Status |
| --- | --- | --- |
| I. Modular monolith | One Express app, `src/modules/<module>/` folders; one SPA | PASS |
| II. Real persistence | All dashboards via aggregation; demo data only from `npm run seed` | PASS |
| III. Secured, layered API | `authenticate` → `authorizeRoles` → `validate(zod)` → controller → service (ownership checks); only login, demo-login, health are public | PASS |
| IV. State machines | `shared/state-machines/*.ts` pure validators; only action endpoints change status | PASS |
| V. Transactions | `withTransaction()` helper for approve, reopen, claim approve, handover | PASS |
| VI. Bounded AI | `modules/ai/` only; Zod-validated output; `{ available:false, message }` fallback, HTTP 200 | PASS |
| VII. Deterministic matching | `matching.service.ts` pure `scorePair()` + config; DB access only in caller | PASS |
| VIII. Privacy | `select:false` fields; `toPublicItem()` projection; tests prove no leak | PASS |
| IX. Frozen scope | Only MASTER_SPEC features; section 15 items absent | PASS |
| X. Vertical slices | Tasks organized per day/slice with verification gates | PASS |

Post-design re-check (after data-model, contracts): **PASS**, no violations; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-campuscare-platform/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1: 13 collections, indexes, state machines
├── quickstart.md        # Phase 1: setup and validation scenarios
├── contracts/
│   └── api.md           # Phase 1: /api/v1 endpoint contract
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
package.json                  # npm workspaces: server, client; root dev scripts
server/
├── package.json  tsconfig.json  vitest.config.ts  .env.example
├── src/
│   ├── app.ts                # express app: helmet, cors allowlist, json limit, routes, errors
│   ├── server.ts             # connect Mongo, listen
│   ├── config/
│   │   ├── env.ts            # Zod-validated env (section 12)
│   │   ├── constants.ts      # roles, categories, priorities, statuses
│   │   └── matching.config.ts# weights + thresholds
│   ├── shared/
│   │   ├── middleware/       # authenticate, authorizeRoles, validate, upload, errorHandler
│   │   ├── state-machines/   # request.sm.ts, workOrder.sm.ts, item.sm.ts, claim.sm.ts
│   │   ├── services/         # notify.service.ts, activityLog.service.ts, counter.service.ts,
│   │   │                     # upload.service.ts (cloudinary | local dev)
│   │   ├── utils/            # withTransaction, ApiError, asyncHandler, paginate, dates
│   │   └── models/           # Counter, Notification, ActivityLog
│   ├── modules/
│   │   ├── auth/  users/  locations/  meta/
│   │   ├── maintenance/      # requests, work-orders, technicians, calendar, feedback
│   │   ├── preventive/       # plans, generate-due, recurrence.ts (pure)
│   │   ├── lost-found/       # items, matches (matching.service.ts pure), claims
│   │   ├── notifications/  activity-logs/  dashboard/
│   │   └── ai/               # gemini.client.ts, workOrderSummary, maintenanceInsights, AiInsightCache
│   │   # each module: *.routes.ts, *.controller.ts, *.service.ts, *.model.ts, *.validation.ts
│   ├── routes.ts             # mounts all modules under /api/v1
│   └── seed/seed.ts          # npm run seed (refuses NODE_ENV=production)
└── tests/
    ├── unit/                 # state machines, matching, recurrence, projection
    └── integration/          # public item endpoints never expose private details
client/
├── package.json  vite.config.ts  tsconfig.json  .env.example  vercel.json
└── src/
    ├── main.tsx  App.tsx  router.tsx
    ├── lib/                  # api client (Bearer from localStorage), queryClient, utils
    ├── components/ui/        # shadcn/ui
    ├── components/shared/    # AppShell, Sidebar (role-based), NotificationBell, StatusBadge,
    │                         # PriorityBadge, DataTable, ImageUpload, Lightbox, ConfirmDialog
    ├── features/
    │   ├── auth/  dashboard/  users/  locations/  notifications/  activity-logs/
    │   ├── maintenance/      # requests, work-orders, technicians, calendar, preventive, feedback
    │   ├── lost-found/       # items, browse, matches, claims, handover
    │   └── ai/               # SummaryButton, InsightsPanel
    └── routes/ProtectedRoute.tsx
```

**Structure Decision**: Web application monorepo per MASTER_SPEC section 1. Backend has one folder
per module (routes, controller, service, model, validation); cross-cutting code lives in
`server/src/shared`. Frontend uses feature folders plus shared components.

## Key Design Elements

- **State machines** (`shared/state-machines`): each exports a transition table and
  `assertTransition(from, to, actor)` that throws `ApiError(409)` on disallowed moves. Services call
  them before every status write. Tables in [data-model.md](./data-model.md#state-machines).
- **Matching** (`modules/lost-found/matching.service.ts`): `scorePair(lost, found, config)` returns
  `{ score, level | null, breakdown }` or `null` (hard filter); no I/O. `runMatchingFor(itemId)`
  loads OPEN candidates, calls `scorePair`, upserts `ItemMatch` only while `SUGGESTED`.
- **notify() / logActivity()**: shared services taking an optional `session` so they participate in
  transactions; called only from services.
- **Upload middleware**: multer memory storage, type/size/count checks → `upload.service` streams to
  Cloudinary; if Cloudinary env vars are empty and `NODE_ENV !== 'production'`, writes to
  `server/uploads/` served statically. Returns `{ url, publicId }[]`.
- **Transactions**: `withTransaction(fn)` wraps `mongoose.startSession().withTransaction`.
- **AI**: see [research.md](./research.md) R5 and contracts `/ai/*`.
- **Seed**: `server/src/seed/seed.ts`; Day 1 skeleton (users per role, locations), Day 6 full data
  per MASTER_SPEC section 13.

## Complexity Tracking

No violations. Section intentionally empty.
