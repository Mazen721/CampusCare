# Tasks: CampusCare Platform

**Input**: Design documents from `/specs/001-campuscare-platform/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Organization**: One phase per day of MASTER_SPEC section 16. Each task is a vertical slice
(model → service → route → UI) unless it is infrastructure. Section 14 unit tests live in the same
phase as the code they cover. Every phase ends with a verification task.

**Format**: `- [ ] [ID] [P?] [Story?] Description` — `[P]` = parallelizable (different files, no
unfinished dependency). Story labels map to spec.md user stories (US1–US12).
**OPTIONAL** = cut-order item (cut in this order: preventive → calendar → AI Insights).

Paths: `server/src/...`, `client/src/...`, tests in `server/tests/...`.

---

## Phase 1 — Day 1: Core, models, auth, RBAC, shell (US1)

**Goal**: Monorepo runs; all 13 models with indexes exist; every seeded role can sign in and sees
its own shell. **Independent test**: log in as each role (password and demo buttons).

### Setup
- [X] T001 Create root `package.json` with npm workspaces `server`, `client` and scripts `dev`, `typecheck`, `test`, `seed`
- [X] T002 [P] Scaffold `server/` (TypeScript strict, `tsconfig.json`, `vitest.config.ts`, scripts `dev`/`build`/`start`/`typecheck`/`test`/`seed`) and install deps per plan.md Technical Context
- [X] T003 [P] Scaffold `client/` with Vite React-TS, Tailwind, shadcn/ui init, React Router, TanStack Query, RHF, Zod, Lucide, Recharts, date-fns, sonner; `vercel.json` SPA rewrite
- [X] T004 [P] Create `server/.env.example` (NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, GEMINI_API_KEY, GEMINI_MODEL, DEMO_MODE) and `client/.env.example` (VITE_API_URL, VITE_DEMO_MODE); add `.env` to `.gitignore`

### Foundational (server)
- [X] T005 Implement Zod-validated env loader in `server/src/config/env.ts`
- [X] T006 [P] Define enums/categories/priorities/statuses per data-model.md in `server/src/config/constants.ts`
- [X] T007 [P] Define weights (category 25, location 20, date 20, color 10, brand 10, keywords 15), thresholds (STRONG ≥ 80, POSSIBLE ≥ 60) and stop words in `server/src/config/matching.config.ts`
- [X] T008 [P] Implement `ApiError`, `asyncHandler`, `paginate` (`{ data, page, limit, total }`), `withTransaction` in `server/src/shared/utils/`
- [X] T009 Implement `app.ts` (helmet, CORS allowlist from comma-separated `CLIENT_URL`, JSON body limit, `GET /health` at root, `/api/v1` router, 404, central error handler without stack traces in production) and `server.ts` (Mongo connect, listen) in `server/src/`
- [X] T010 [P] Implement middleware `authenticate` (Bearer JWT, reload user, reject `isActive:false`), `authorizeRoles(...roles)`, `validate(schema)` in `server/src/shared/middleware/`
- [X] T011 Create all 13 Mongoose models with exact fields and indexes from data-model.md, including WorkOrder partial unique index `{preventivePlanId:1,scheduledStart:1}` with `partialFilterExpression:{preventivePlanId:{$type:'objectId'}}` (not sparse), unique `ServiceFeedback.maintenanceRequestId`, unique `ItemMatch {lostItemId,foundItemId}`, `select:false` on `User.passwordHash` and `LostFoundItem.privateIdentificationDetails`, in each module's `*.model.ts` and `server/src/shared/models/`
- [X] T012 [P] Implement `counter.service.ts` (`nextNumber('MR'|'WO'|'LF'|'CLM', session?)` → `MR-1001`) in `server/src/shared/services/`

### US1 slice
- [X] T013 [US1] Implement auth module: `POST /auth/login` (bcryptjs, JWT 1 day), `GET /auth/me`, `PATCH /auth/change-password`, `POST /auth/demo-login` registered only when `DEMO_MODE=true`, in `server/src/modules/auth/`
- [X] T014 [US1] Implement seed skeleton: refuses `NODE_ENV=production`, wipes DB, creates one user per role + 4–5 technicians with different specializations + 4 buildings with floors/rooms, prints accounts, in `server/src/seed/seed.ts`
- [X] T015 [P] [US1] Implement API client (base `VITE_API_URL`, Bearer from localStorage, 401 → logout) and QueryClient in `client/src/lib/`
- [X] T016 [US1] Build Login page (form + role buttons when `VITE_DEMO_MODE=true`), auth context, `ProtectedRoute` with role guard in `client/src/features/auth/` and `client/src/routes/`
- [X] T017 [US1] Build AppShell with role-specific Sidebar (section 11 pages), header, placeholder-free dashboard route, Profile/change-password page in `client/src/components/shared/` and `client/src/features/auth/`
- [X] T018 [P] [US1] Add shared UI: StatusBadge, PriorityBadge (high-contrast HIGH/CRITICAL), DataTable (search, filters, pagination), ConfirmDialog, skeleton/empty/error states in `client/src/components/shared/`
- [X] T019 **Verify Day 1**: server and client typecheck with zero errors; `npm run seed` works; login (password + demo) works for every seeded role; deactivated user is refused; Student gets 403 on an ADM route

---

## Phase 2 — Day 2: Locations, meta, notifications, logs, requests, review/approval (US2, US8, US9)

**Goal**: Users submit requests; managers review and approve (WO auto-created). **Independent
test**: submit → under review → approve creates exactly one WO; reject needs notes.

- [X] T020 [P] [US9] Locations slice: service/routes (`GET` any; `POST`/`PATCH`/`DELETE`=deactivate ADM; duplicate → 409) and Admin Locations page in `server/src/modules/locations/`, `client/src/features/locations/`
- [X] T021 [P] [US9] Users slice (ADM): list/get/create/update/status with activity logs; Admin Users page in `server/src/modules/users/`, `client/src/features/users/`
- [X] T022 [P] Meta endpoint `GET /meta` (categories, priorities, statuses, match thresholds) in `server/src/modules/meta/` and `useMeta()` hook in `client/src/lib/`
- [X] T023 Implement `notify(userIds, payload, session?)` and `logActivity(entry, session?)` (insert only; no update/delete path) in `server/src/shared/services/`
- [X] T024 [US8] Notifications slice: `GET /notifications` (own, `unreadCount`), `PATCH /:id/read`, `PATCH /read-all`; NotificationBell with dropdown, 30 s `refetchInterval`, click → `linkUrl` in `server/src/modules/notifications/`, `client/src/components/shared/NotificationBell.tsx`
- [X] T025 Implement upload middleware + service: multer memory, JPEG/PNG/WebP only, ≤5 MB, ≤3 files, Cloudinary stream; local `server/uploads/` fallback only when Cloudinary vars empty and not production; returns `{ url, publicId }[]` in `server/src/shared/middleware/upload.ts`, `server/src/shared/services/upload.service.ts`
- [X] T026 [P] Build ImageUpload (previews) and Lightbox components in `client/src/components/shared/`
- [X] T027 [US2] Implement request state machine (data-model.md "Request" table; `assertTransition(from,to,actor)` → 409) in `server/src/shared/state-machines/request.sm.ts`
- [X] T028 [P] [US2] Unit tests: every allowed and several forbidden request transitions in `server/tests/unit/request.sm.test.ts`
- [X] T029 [US2] Requests slice backend: `POST /maintenance/requests` (USER, multipart, notify managers, log), `GET` list (USER own; MGR/ADM all; HIGH/CRITICAL first), `GET /:id` (owner, MGR, ADM, TECH of its WO) in `server/src/modules/maintenance/requests/`
- [X] T030 [US2] Review endpoint `PATCH /maintenance/requests/:id/review` (`UNDER_REVIEW` | `APPROVE` in transaction creating WO `PENDING_ASSIGNMENT`/`REACTIVE` only if no non-cancelled WO linked, set `currentWorkOrderId` | `REJECT` with required notes); notify + log in `server/src/modules/maintenance/requests/`
- [X] T031 [US2] Pages: New Maintenance Request, My Requests + detail (USER), Request Queue + review dialog (MGR) in `client/src/features/maintenance/requests/`
- [X] T032 **Verify Day 2**: tests pass; typecheck clean; manual: submit with images → review → approve (one WO) and reject path; notifications appear; logs written; bad file type rejected

---

## Phase 3 — Day 3: Work Orders, technicians, portal, confirm/reopen/cancel, feedback (US2, US5)

**Goal**: Full request → WO → completion → confirm/reopen/cancel → feedback. **Independent test**:
quickstart scenario 1 except AI.

- [X] T033 [US2] Implement work-order state machine (data-model.md "Work Order" table) in `server/src/shared/state-machines/workOrder.sm.ts`
- [X] T034 [P] [US2] Unit tests: every allowed and several forbidden WO transitions in `server/tests/unit/workOrder.sm.test.ts`
- [X] T035 [US5] Technicians slice: `GET /technicians` (with `?category` ordering matches first, active WO count `ASSIGNED+IN_PROGRESS`, availability), `GET /:id` (active tasks, completed count, avg rating, avg resolution hours via aggregation), `POST`/`PATCH` (MGR, ADM; role forced to TECHNICIAN) + Technicians page in `server/src/modules/maintenance/technicians/`, `client/src/features/maintenance/technicians/`
- [X] T036 [US2] Work Orders backend: list/get (MGR/ADM all; TECH own), `assign` (tech active, not OFF_DUTY, end after start; reassign notifies old+new), `start` (sets `actualStart` if unset, syncs request), `notes`, `complete` (`resolutionDetails` required, `completedAt`, syncs request), `cancel` (reason; REACTIVE request → UNDER_REVIEW, notify managers); ownership enforced in service, in `server/src/modules/maintenance/work-orders/`
- [X] T037 [US2] Confirm and reopen endpoints: `confirm` (owner/MGR COMPLETED→CLOSED; MGR REOPENED→CLOSED), `reopen` (reason; transaction: WO COMPLETED→ASSIGNED, resolution → system note, clear `completedAt`/`resolutionDetails`, `reopenCount++`, notify tech) in `server/src/modules/maintenance/requests/`
- [X] T038 [US2] Feedback slice: `POST /feedback` (owner, request CLOSED, once; `rating` 1–5, `comment` max 500; technician from WO), `GET /feedback` (MGR/ADM avg + per-tech + list; USER own) + Feedback page (MGR) and form on request detail in `server/src/modules/maintenance/feedback/`, `client/src/features/maintenance/feedback/`
- [X] T039 [US2] Pages: Work Orders (MGR: assign picker with matching-first + confirm for non-matching, cancel), My Work Orders + detail (TECH: start, notes, complete), confirm/reopen on request detail in `client/src/features/maintenance/work-orders/`
- [X] T040 **Verify Day 3**: tests pass; typecheck clean; manual: approve → assign → start → complete → confirm → feedback; reopen path; cancel path; TECH cannot touch unassigned WO (403); MGR cannot create non-technician

---

## Phase 4 — Day 4: AI summary, calendar, L&F reporting and public search (US6, US10, US4)

**Goal**: AI summary works with fallback; items can be reported and browsed without leaking private
details. **Independent test**: spec US4 and US6 scenarios.

- [X] T041 [US6] Gemini client with 15 s timeout, 429/network catch, fence stripping, `{ available:false, message }` fallback in `server/src/modules/ai/gemini.client.ts`
- [X] T042 [US6] `POST /ai/work-order-summary` (TECH assigned, MGR; return existing `aiSummary`; send only title+description; Zod non-empty < 300 chars; store `aiSummary{text,generatedAt}`; never change status/priority/assignment) + "Summarize Issue with AI" button with AI-generated label in `server/src/modules/ai/`, `client/src/features/ai/SummaryButton.tsx`
- [X] T043 [US10] **OPTIONAL** Calendar: `GET /maintenance/calendar?from&to&technicianId&status` (MGR all, TECH own, ADM read; overdue flag) + Calendar/My Schedule page Month/Week toggle, red overdue in `server/src/modules/maintenance/calendar/`, `client/src/features/maintenance/calendar/`
- [X] T044 [US3] Implement item state machine (data-model.md "Item" table) in `server/src/shared/state-machines/item.sm.ts`
- [X] T045 [US4] Implement `toPublicItem(doc)` returning only public fields of MASTER_SPEC 6.1 (no `privateIdentificationDetails`, no reporter contact) in `server/src/modules/lost-found/items/item.projection.ts`
- [X] T046 [US4] L&F items backend: `POST /lost-found/items` (USER, OFF; multipart; `LF-` number; status OPEN), `GET` list (public projection; filters keyword/category/type/location/building/date range/color/brand/status, `mine`), `GET /:id` (public; full with `.select('+privateIdentificationDetails')` for reporter, OFF, ADM), `PATCH /:id` (reporter own while OPEN; OFF; close via item SM) in `server/src/modules/lost-found/items/`
- [X] T047 [P] [US4] Unit test `toPublicItem` and integration test (supertest + MongoMemoryReplSet) proving list/detail/search never return `privateIdentificationDetails` for non-privileged users in `server/tests/unit/projection.test.ts`, `server/tests/integration/public-items.test.ts`
- [X] T048 [US4] Pages: Report Lost/Found (warning not to put identifying details in public fields), Browse (search + filters), Item detail, My Reports, All Reports (OFF) in `client/src/features/lost-found/items/`
- [X] T049 **Verify Day 4**: tests pass; typecheck clean; manual: AI summary + cached repeat + bad key fallback; report and browse items; private details visible only to reporter/OFF/ADM; calendar (if built)

---

## Phase 5 — Day 5: Matching, match review, claims, verification, handover (US3)

**Goal**: Lost → match → claim → handover. **Independent test**: quickstart scenario 2.

- [ ] T050 [US3] Implement pure `scorePair(lost, found, config)` per MASTER_SPEC 6.3 (hard filters, sub-scores, normalization over comparable fields, thresholds) in `server/src/modules/lost-found/matches/matching.service.ts`
- [ ] T051 [P] [US3] Unit tests: strong match, possible match, below threshold, missing color/brand not penalized, incompatible category skipped, found-before-lost skipped, dismissed match not resurrected in `server/tests/unit/matching.test.ts`
- [ ] T052 [US3] `runMatchingFor(itemId)` (OPEN candidates only; upsert refresh only while SUGGESTED; never revert CONFIRMED/DISMISSED), called on item create and `POST /lost-found/items/:id/recalculate` (OFF) in `server/src/modules/lost-found/matches/`
- [ ] T053 [US3] Matches endpoints `GET /lost-found/matches`, `PATCH /:id` CONFIRM (both items MATCH_CONFIRMED, notify LOST reporter with claim link pre-filled `linkedLostItemId`, log) / DISMISS + Match Suggestions page (OFF) in `server/src/modules/lost-found/matches/`, `client/src/features/lost-found/matches/`
- [ ] T054 [US3] Implement claim state machine (data-model.md "Claim" table) in `server/src/shared/state-machines/claim.sm.ts`
- [ ] T055 [P] [US3] Unit tests: allowed and forbidden item and claim transitions in `server/tests/unit/item-claim.sm.test.ts`
- [ ] T056 [US3] Claims backend: `POST /lost-found/claims` (USER, multipart; FOUND item in OPEN/MATCH_CONFIRMED/CLAIM_UNDER_REVIEW; one active claim per claimant per item; `linkedLostItemId` must be claimant's own LOST; item → CLAIM_UNDER_REVIEW; notify officers), `GET` list/detail (OFF all; claimant own, `verificationNotes` hidden) in `server/src/modules/lost-found/claims/`
- [ ] T057 [US3] Review + handover: `PATCH /:id/review` START_VERIFICATION | APPROVE (transaction: item APPROVED_FOR_HANDOVER, auto-reject other pending claims) | REJECT (`rejectionReason` required; item → OPEN if no active claims); `POST /:id/handover` (claim APPROVED; transaction: claim COMPLETED + `handover{receivedByName,handedOverBy,notes,handedOverAt}`, found + linked lost RETURNED, log, notify) in `server/src/modules/lost-found/claims/`
- [ ] T058 [US3] Pages: Submit Claim, My Claims (USER), Claims queue + verification screen (private details beside claimant answers, internal notes), Handover form (OFF) in `client/src/features/lost-found/claims/`
- [ ] T059 **Verify Day 5**: tests pass; typecheck clean; manual: full lost → match → confirm → claim → verify → approve → handover; competing claim auto-rejected; only OFF can approve/handover

---

## Phase 6 — Day 6: Dashboards, AI Insights, preventive, logs page, full seed (US7, US11, US12, US9)

**Goal**: Role dashboards from live data; optional items if time allows; demo data complete.

- [ ] T060 [US7] `GET /dashboard?period=7d|30d|90d|all` with role from JWT: ADM totals (+ latest cached insights read-only), MGR section 5.8 metrics, TECH counts + schedule, OFF counts, USER own items in `server/src/modules/dashboard/`
- [ ] T061 [US7] Dashboard page per role (MGR max 2–3 Recharts charts, period selector) in `client/src/features/dashboard/`
- [ ] T062 [P] [US9] Activity Logs page (ADM; filters entity type, actor, date; pagination) with `GET /activity-logs` in `server/src/modules/activity-logs/`, `client/src/features/activity-logs/`
- [ ] T063 [US11] **OPTIONAL** `POST /ai/maintenance-insights` (MGR; aggregates incl. anonymized Technician A/B/C, previous-period change; send stats JSON + dates only; Zod output; cache per period unless `regenerate`; fallback with stats + last cache) + InsightsPanel (system-calculated vs AI-generated labels, period, `generatedAt`) in `server/src/modules/ai/`, `client/src/features/ai/InsightsPanel.tsx`
- [ ] T064 [US12] **OPTIONAL** Pure recurrence `nextDate()` / `advancePastNow()` (DAILY 1 day, WEEKLY 7, MONTHLY +1 calendar month, CUSTOM_DAYS `recurrenceIntervalDays`) in `server/src/modules/preventive/recurrence.ts`
- [ ] T065 [P] [US12] **OPTIONAL** Unit tests for recurrence (each type, month-end, skipping missed occurrences) in `server/tests/unit/recurrence.test.ts`
- [ ] T066 [US12] **OPTIONAL** Preventive slice: CRUD + status (MGR; ADM read), `generate-due` (WO PREVENTIVE, ASSIGNED if plan tech else PENDING_ASSIGNMENT, E11000 = already generated, returns `{ created }`, log) + Preventive Plans page in `server/src/modules/preventive/`, `client/src/features/maintenance/preventive/`
- [ ] T067 Complete seed per MASTER_SPEC section 13 (20+ requests in every status/priority, WOs in every status incl. overdue + reopened, feedback, 2–3 plans one due, 8+ lost/8+ found with STRONG and POSSIBLE pairs, stored matches, claims in all states, one handover, notifications, logs) in `server/src/seed/seed.ts`
- [ ] T068 **Verify Day 6**: tests pass; typecheck clean; manual: each role's dashboard shows seeded numbers and changes after an action; insights + fallback (if built); generate-due twice creates no duplicates (if built)

---

## Phase 7 — Day 7: Testing, fixes, README, deployment, demo prep

- [ ] T069 Run quickstart manual scenarios 1–4 for every role; log and fix defects across `server/src/` and `client/src/`
- [ ] T070 [P] UX pass: responsive layouts, confirmation dialogs on all state changes, loading/empty/error states, toasts in `client/src/`
- [ ] T071 [P] Write README (local setup, env, seed, tests, deployment, demo accounts) in `README.md`
- [ ] T072 Deploy server to Render (health check `/health`, env vars, `CLIENT_URL`) and client to Vercel; run seed against the demo database
- [ ] T073 **Verify Day 7**: all tests pass; zero TypeScript errors; deployed app passes scenarios 1–4; server warmed before demo

---

## Dependencies & Execution Order

- Day 1 blocks everything. Day 2 needs auth/models. Day 3 needs requests (Day 2). Day 4 AI summary
  needs WOs (Day 3); L&F reporting needs only Days 1–2. Day 5 needs items (Day 4). Day 6 needs all
  data-producing slices. Day 7 last.
- Within a phase: state machine → its tests → backend slice → UI → verify.
- Never cut: US1, US2, US3, US4, US6. Cut order if behind: T064–T066 → T043 → T063 → extra charts →
  extra search filters.

## Parallel Opportunities

- Day 1: T002/T003/T004; T006/T007/T008/T010/T012; T015/T018.
- Day 2: T020/T021/T022; T026 alongside T025; T028 alongside T029.
- Day 3: T034 alongside T035. Day 4: T047 alongside T048. Day 5: T051, T055 alongside backend.
- Day 6: T062 and T065 alongside T060/T061. Day 7: T070/T071.

## Implementation Strategy

MVP = Days 1–3 (auth + full maintenance workflow). Then Day 4–5 adds Lost & Found. Day 6 adds
dashboards and optional items only if on schedule. Run `/speckit-implement` one phase at a time and
stop at each **Verify** task.
