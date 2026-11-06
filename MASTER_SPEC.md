# CampusCare — Master Specification v4.0 (Lean)

*Scope-frozen for a 7-day solo build. Supersedes v1–v3: where an older spec conflicts with this file, this file wins.*

## 0. Rules for the AI coding agent

- Build only what is in this file. Section 15 lists what is excluded; do not add it back.
- One module at a time, as a vertical slice (model → service → route/controller → UI), verified end to end before moving on.
- Controllers handle HTTP only. Business rules, state transitions, ownership checks and side effects (notifications, activity logs) live in services.
- No mock data in the final app. Every dashboard number comes from MongoDB.
- Every button calls a real endpoint. No placeholder pages.
- Modular monolith. Do not over-engineer.

## 1. Overview and stack

CampusCare is a university operations platform with two modules: **Maintenance Management** and **Lost & Found Management**. Roles: `SUPER_ADMIN`, `MAINTENANCE_MANAGER`, `TECHNICIAN`, `LOST_FOUND_OFFICER`, `STUDENT_EMPLOYEE`.

- **Monorepo:** `/server` and `/client`, both TypeScript.
- **Backend:** Node.js, Express, Mongoose (MongoDB Atlas), Zod, bcryptjs, jsonwebtoken, multer + cloudinary, helmet, cors, `@google/genai`, vitest (plus supertest and mongodb-memory-server replica set for integration tests).
- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query v5, React Hook Form + Zod, Lucide React, Recharts, date-fns, sonner.
- **Hosting:** Vercel (client), Render or Railway (server), MongoDB Atlas, Cloudinary.
- Frontend: feature folders plus shared components. Backend: one folder per module (routes, controller, service, model, validation).

## 2. Resolved decisions (do not re-debate)

1. Work Orders are created only by (a) approving a maintenance request or (b) the preventive generate-due action. There is no `POST /work-orders`.
2. Technician data (specializations, skills, availability) is embedded in the `User` document. There is no TechnicianProfiles collection. Workload, completed count and ratings are computed by aggregation, never stored as counters.
3. Handover data is embedded in the `ClaimRequest`. There is no HandoverRecords collection.
4. Categories, priorities and match weights/thresholds are server constants, exposed through `GET /api/v1/meta`. There is no settings UI and no SystemSettings collection.
5. Auth is JWT in the `Authorization: Bearer` header (token kept in localStorage on the client). No cookies. No self-registration: Super Admin creates accounts, and the seed script creates demo accounts.
6. Multi-document operations (approve request + create WO, reopen, claim approval, handover) use Mongoose transactions. Develop against Atlas (or a local replica set); a standalone local mongod does not support transactions.
7. Feedback is allowed only when the request is `CLOSED`.
8. Lost & Found match suggestions live only in `ItemMatches`. Item status changes only when an officer confirms a match. Matching considers items in `OPEN` status only.
9. No `statusHistory` arrays. `ActivityLogs` is the audit trail. A reopen reason is also written as a system note on the Work Order.
10. Super Admin is read-only on both modules (view everything) plus user management, locations and activity logs. Admin does not operate workflows.
11. Explicitly cut: admin password reset, rate limiting, CSV export, technician repair-image uploads, auto-close after 7 days, `hideImagesPublicly`, cron jobs, websockets, daily calendar view.
12. Demo login: `POST /api/v1/auth/demo-login` exists only when `DEMO_MODE=true` on the server and returns a token for the seeded demo user of the requested role. The login page shows role buttons only when `VITE_DEMO_MODE=true`.

## 3. Roles and permissions

Backend enforces three layers: `authenticate` → `authorizeRoles(...)` → service-level ownership checks. Hiding buttons in the UI is never sufficient.

| Capability | Admin | Manager | Technician | Officer | Student/Employee |
| --- | --- | --- | --- | --- | --- |
| Manage users (any role), activate/deactivate | Yes | – | – | – | – |
| Create/edit TECHNICIAN users only | Yes | Yes | – | – | – |
| Manage locations | Yes | – | – | – | – |
| View locations / meta | Yes | Yes | Yes | Yes | Yes |
| Submit maintenance request | – | – | – | – | Yes |
| View maintenance requests | All | All | Only via own WOs | – | Own |
| Review / approve / reject requests | – | Yes | – | – | – |
| Assign, reassign, cancel Work Orders | – | Yes | – | – | – |
| Start, note, complete Work Orders | – | – | Own assigned only | – | – |
| Confirm or reopen a completed request | – | Yes | – | – | Own |
| Preventive plans + generate-due | View | Yes | – | – | – |
| Calendar | View | All | Own | – | – |
| Submit feedback | – | – | – | – | Own, CLOSED request |
| View feedback | Yes | Yes | – | – | Own |
| AI Work Order summary | – | Yes | Own assigned | – | – |
| AI Maintenance Insights | View | Yes | – | – | – |
| Report lost / found item | – | – | – | Yes | Yes |
| Browse public listings | Yes | Yes | Yes | Yes | Yes |
| See `privateIdentificationDetails` | Yes | – | – | Yes | Own reports only |
| Review matches, verify/approve/reject claims, record handover | – | – | – | Yes | – |
| Submit and track claims | – | – | – | – | Own |
| Notifications | Own | Own | Own | Own | Own |
| Activity logs | Yes | – | – | – | – |
| Dashboard | Role-specific payload for every role |  |  |  |  |

## 4. Data model (13 collections)

All collections have `createdAt`/`updatedAt` unless noted. Use ObjectId refs between collections. Never store image binaries; images are `{ url, publicId }`.

- **Counter:** `_id` (string key such as `MR`, `WO`, `LF`, `CLM`), `seq`. Incremented atomically with `findOneAndUpdate({ $inc }, { upsert, new })` to produce `MR-1001`-style numbers.
- **User:** `name`, `email` (unique, lowercase), `passwordHash` (`select: false`), `role`, `department`, `contactPhone`, `isActive`. Technician-only fields: `specializations[]` (category strings), `skills[]`, `availability` (`AVAILABLE | BUSY | OFF_DUTY`). Indexes: `email` unique; `{ role, isActive }`.
- **Location:** `buildingName`, `floor`, `room`, `locationType` (`BUILDING | FLOOR | ROOM | LAB | OTHER`), `description`, `isActive`. Unique index `{ buildingName, floor, room }`. Deleting = setting `isActive: false`.
- **MaintenanceRequest:** `requestNumber` (unique), `requesterId`, `title`, `description`, `category`, `priority`, `locationId`, `equipmentDescription`, `attachments[]` (max 3), `status`, `reviewedBy`, `reviewedAt`, `reviewNotes`, `currentWorkOrderId`, `reopenCount`. Indexes: `{ requesterId, createdAt }`, `{ status, priority, createdAt }`, `locationId`.
- **WorkOrder:** `workOrderNumber` (unique), `sourceType` (`REACTIVE | PREVENTIVE`), `maintenanceRequestId` (required if REACTIVE), `preventivePlanId` (required if PREVENTIVE), `assignedTechnicianId`, `title`, `description` (copied from request or plan), `category`, `priority`, `locationId`, `status`, `aiSummary { text, generatedAt }`, `scheduledStart`, `expectedCompletion`, `actualStart`, `completedAt`, `technicianNotes[] { note, authorId, createdAt, isSystem }`, `resolutionDetails`, `cancelReason`. Indexes: `{ assignedTechnicianId, status }`, `{ status, expectedCompletion }`, `maintenanceRequestId`, and the **partial unique index** `{ preventivePlanId: 1, scheduledStart: 1 }` with `{ unique: true, partialFilterExpression: { preventivePlanId: { $type: 'objectId' } } }`. Do not use a sparse index here; it would collide reactive WOs.
- **PreventivePlan:** `title`, `description`, `category`, `priority`, `locationId`, `assignedTechnicianId` (optional), `recurrenceType` (`DAILY | WEEKLY | MONTHLY | CUSTOM_DAYS`), `recurrenceIntervalDays` (required for CUSTOM\_DAYS), `startDate`, `nextScheduledDate`, `lastGeneratedDate`, `expectedDurationHours`, `isActive`, `createdBy`. Index `{ isActive, nextScheduledDate }`.
- **ServiceFeedback:** `maintenanceRequestId` (**unique**), `workOrderId`, `technicianId`, `requesterId`, `rating` (1–5), `comment` (max 500), `createdAt`. Index `technicianId`.
- **LostFoundItem:** `reportNumber` (unique), `reportType` (`LOST | FOUND`), `itemTitle`, `description` (public), `privateIdentificationDetails` (`select: false`), `category`, `color`, `brand`, `locationId`, `locationDetails` (free text), `occurrenceDate`, `images[]` (max 3), `reporterId`, `status`. Indexes: `{ reportType, status, category }`, text index on `itemTitle + description`, `occurrenceDate`.
- **ItemMatch:** `lostItemId`, `foundItemId`, `score`, `level` (`STRONG | POSSIBLE`), `breakdown { category, location, date, color, brand, keywords }`, `status` (`SUGGESTED | CONFIRMED | DISMISSED`), `reviewedBy`, `reviewedAt`. Unique index `{ lostItemId, foundItemId }`; index `status`.
- **ClaimRequest:** `claimNumber` (unique), `itemId` (a FOUND item), `linkedLostItemId` (optional, must be the claimant's own LOST item), `claimantId`, `claimDescription`, `identifyingDetailsProvided`, `supportingEvidence[]` (max 3), `status`, `verificationNotes` (officer-only), `rejectionReason` (shown to the claimant), `reviewedBy`, `reviewedAt`, `handover { receivedByName, handedOverBy, notes, handedOverAt }`. Indexes: `{ itemId, status }`, `claimantId`. Service rule: one active (non-rejected, non-completed) claim per claimant per item.
- **Notification:** `userId`, `type`, `title`, `message`, `relatedEntityType`, `relatedEntityId`, `linkUrl`, `isRead`, `createdAt`. Index `{ userId, isRead, createdAt }`.
- **ActivityLog:** `actorId`, `action`, `entityType`, `entityId`, `description`, `metadata`, `createdAt`. Index `createdAt` and `{ entityType, entityId }`. No update or delete code path exists.
- **AiInsightCache:** `period` (`7d | 30d`, unique), `generatedAt`, `rangeStart`, `rangeEnd`, `stats`, `insights { observations[], repeatedPatterns[], operationalRisks[], preventiveRecommendations[] }`, `model`.

## 5. Module 1: Maintenance

### 5.1 Requests

Students/employees submit: title, description, category, priority (`LOW | MEDIUM | HIGH | CRITICAL`), `locationId`, optional equipment description, up to 3 images. Default categories: Hardware, Software, Network, Electrical, Plumbing, Air Conditioning, Furniture, General Maintenance, Other. HIGH and CRITICAL show high-contrast badges and sort first by default.

### 5.2 Request state machine

There is no free-form status endpoint. Only the action endpoints in section 9 change status, and each validates against this table.

| From | To | Actor | Side effects |
| --- | --- | --- | --- |
| SUBMITTED | UNDER\_REVIEW | Manager | Notify requester |
| SUBMITTED, UNDER\_REVIEW | APPROVED | Manager | Transaction: create WO (`PENDING_ASSIGNMENT`, `sourceType REACTIVE`), set `currentWorkOrderId`, notify requester. Only create a WO if no non-cancelled WO is linked to the request |
| SUBMITTED, UNDER\_REVIEW | REJECTED | Manager (notes required) | Notify requester. Terminal |
| APPROVED | IN\_PROGRESS | System, when WO starts | – |
| APPROVED, IN\_PROGRESS, REOPENED | UNDER\_REVIEW | System, when WO is cancelled | Notify manager. Manager re-approves (new WO, the cancelled one stays) or rejects |
| IN\_PROGRESS | COMPLETED | System, when WO completes | Notify requester to confirm or reopen |
| COMPLETED | CLOSED | Requester (Confirm) or Manager | Notify; requester is prompted for optional feedback. Terminal |
| COMPLETED | REOPENED | Requester or Manager (reason required) | Transaction: WO `COMPLETED → ASSIGNED`, previous resolution copied into a system note, `completedAt` and `resolutionDetails` cleared, `reopenCount++`, notify technician |
| REOPENED | IN\_PROGRESS | System, when technician starts WO | – |
| REOPENED | CLOSED | Manager | Terminal |

### 5.3 Work Order state machine

| From | To | Actor | Rules |
| --- | --- | --- | --- |
| PENDING\_ASSIGNMENT | ASSIGNED | Manager | Requires technician, `scheduledStart`, `expectedCompletion` (end after start). Technician must be active and not `OFF_DUTY` |
| ASSIGNED | ASSIGNED | Manager | Reassign or reschedule. Notify old and new technician |
| ASSIGNED | IN\_PROGRESS | Assigned technician only | Sets `actualStart` (kept on reopen); syncs request |
| IN\_PROGRESS | COMPLETED | Assigned technician only | Requires `resolutionDetails`; sets `completedAt`; syncs request |
| Any non-terminal | CANCELLED | Manager (reason required) | Reactive: request returns to `UNDER_REVIEW`. Preventive: no request effect |
| COMPLETED | ASSIGNED | System only, on request reopen | – |

Preventive WOs have no parent request, so request sync steps are skipped for them. `CANCELLED` is terminal. A technician can never touch a WO where `assignedTechnicianId` is not their own id; enforce in the service, not only the route.

### 5.4 Technicians

- Manager (or Admin) creates and edits users with role `TECHNICIAN` only, through `POST/PATCH /technicians`. A manager can never create or edit any other role.
- The assignment picker lists active technicians with matching specialization first, showing active WO count (`ASSIGNED + IN_PROGRESS`) and availability. Assigning a non-matching technician needs a confirmation dialog.
- Technician detail shows: active tasks, completed count, average rating, average resolution hours. All computed by aggregation.

### 5.5 Calendar

One page with a Month/Week toggle showing real Work Orders positioned by `scheduledStart` to `expectedCompletion`. Filters: technician, status. Overdue WOs (past `expectedCompletion`, not `COMPLETED`/`CANCELLED`) are highlighted red. Technicians see only their own. No daily view. Data from `GET /maintenance/calendar?from&to&technicianId&status`.

### 5.6 Preventive maintenance

- Manager CRUD on plans, plus activate/deactivate.
- A **Generate Due Work Orders** button calls `POST /preventive-maintenance/generate-due`. No cron job and no automatic run on dashboard load.
- For each active plan with `nextScheduledDate <= now`: create one WO (`PREVENTIVE`, `scheduledStart = nextScheduledDate`, `expectedCompletion = start + expectedDurationHours`, status `ASSIGNED` if the plan has a technician, else `PENDING_ASSIGNMENT`), set `lastGeneratedDate`, then advance `nextScheduledDate` by the interval until it is in the future (missed occurrences are skipped, not backfilled).
- Intervals: DAILY = 1 day, WEEKLY = 7 days, MONTHLY = +1 calendar month, CUSTOM\_DAYS = `recurrenceIntervalDays`.
- A duplicate-key error from the partial unique index is treated as already generated and does not fail the request. The response reports how many WOs were created.

### 5.7 Feedback

Only the original requester, only when the request is `CLOSED`, once per request (unique index). Rating 1–5 plus optional comment. The technician is taken from the linked WO. Managers see average rating, per-technician ratings and a feedback list.

### 5.8 Maintenance metrics

Served by the dashboard endpoint with `?period=7d|30d|90d|all`: total requests, counts by status, pending (SUBMITTED), under review, approved, active WOs, completed WOs, overdue WOs, average resolution hours (`actualStart` to `completedAt`), requests by category, requests by building, technician workload and performance, feedback average and distribution.

## 6. Module 2: Lost & Found

### 6.1 Reporting and privacy

Students/employees and officers can report `LOST` or `FOUND` items (officers register items handed in at the office). Default categories: Electronics, Phones, Laptops, Headphones, Wallets, Bags, Keys, Documents, Accessories, Books, Clothing, Other.

- `locationId` points to the closest building/area. `locationDetails` is free text such as 'bench outside Building B'.
- `description` is public and general. `privateIdentificationDetails` (contents, serial numbers, marks) is secret. The report form tells users not to put identifying details in the public description or images.
- **Public projection** (browse, search, item detail for non-privileged users): `reportNumber`, `reportType`, `itemTitle`, `description`, `category`, `color`, `brand`, `location`, `locationDetails`, `occurrenceDate`, `images`, `status`. Never `privateIdentificationDetails`, never the reporter's contact details.
- Because the field is `select: false`, officer, admin and reporter code paths must explicitly `.select('+privateIdentificationDetails')`, and tests must prove the public endpoints never return it.
- Search filters: keyword, category, report type, location/building, date range, color, brand, status.

### 6.2 Item status flow

`OPEN → MATCH_CONFIRMED → CLAIM_UNDER_REVIEW → APPROVED_FOR_HANDOVER → RETURNED`, plus `CLOSED`.

| Transition | Trigger |
| --- | --- |
| OPEN → MATCH\_CONFIRMED | Officer confirms a match (both the lost and found item) |
| OPEN or MATCH\_CONFIRMED → CLAIM\_UNDER\_REVIEW | First claim submitted on a FOUND item |
| CLAIM\_UNDER\_REVIEW → APPROVED\_FOR\_HANDOVER | A claim is approved; all other pending claims on the item are auto-rejected |
| CLAIM\_UNDER\_REVIEW → OPEN | Last active claim rejected |
| APPROVED\_FOR\_HANDOVER → RETURNED | Handover recorded (linked LOST item also becomes RETURNED) |
| Any except RETURNED → CLOSED | Officer, or the reporter for their own LOST report |

Claims are accepted only on FOUND items in `OPEN`, `MATCH_CONFIRMED` or `CLAIM_UNDER_REVIEW`.

### 6.3 Deterministic matching (no AI)

Pure TypeScript service `matching.service.ts` with no database access inside the scoring function, so it is unit-testable. Weights and thresholds come from server config.

- **Candidates:** a LOST item against FOUND items, both `OPEN`. Run when an item is created and on officer request (`recalculate`).
- **Hard filters:** skip incompatible categories (unless either is `Other`); skip pairs where the found date is more than 24 hours before the lost date.
- **Sub-scores (0 to 1) and weights:**
  - Category (25): exact = 1.0, one side `Other` = 0.4.
  - Location (20): same `locationId` = 1.0, same building and floor = 0.8, same building = 0.6, otherwise 0.
  - Date proximity (20): gap 0–1 days = 1.0, 2–3 = 0.8, 4–7 = 0.5, 8–14 = 0.2, more than 14 = 0.
  - Color (10): exact = 1.0, shares a word = 0.7, else 0. Excluded if either side is missing.
  - Brand (10): exact or substring = 1.0, else 0. Excluded if either side is missing.
  - Keywords (15): lowercase, strip punctuation and stop words, Jaccard over title + public description, scaled as `min(1, jaccard / 0.4)`.
- **Normalization:** `score = sum(weight × subscore) / sum(weights of comparable fields) × 100`. Missing optional fields do not penalize.
- **Thresholds (config):** 80–100 `STRONG`, 60–79 `POSSIBLE`, below 60 not stored.
- **Persistence:** upsert into `ItemMatches`. On an existing match, refresh score and breakdown only while `SUGGESTED`; never change a `DISMISSED` or `CONFIRMED` match back to `SUGGESTED`.
- **Officer actions:** Confirm or Dismiss. Confirm sets both items to `MATCH_CONFIRMED`, notifies the LOST reporter with a link to the claim form pre-filled with `linkedLostItemId`, and writes an activity log. A match never confirms ownership.

### 6.4 Claims, verification, handover

Claim statuses: `PENDING_REVIEW → UNDER_VERIFICATION → APPROVED | REJECTED → COMPLETED`. An officer may also reject directly from `PENDING_REVIEW`.

- Claimants submit `claimDescription`, `identifyingDetailsProvided`, optional evidence images, and optionally their own `linkedLostItemId`.
- The officer verification screen shows the found item's private details side by side with the claimant's answers and evidence, and records internal `verificationNotes` (never visible to the claimant). Approve or reject requires an officer; rejection needs a reason shown to the claimant (stored in `rejectionReason`, separate from `verificationNotes`).
- **Handover** (`POST /claims/:id/handover`, claim must be `APPROVED`): in one transaction set the claim to `COMPLETED` with `handover { receivedByName, handedOverBy, notes, handedOverAt }`, set the found item (and linked lost item) to `RETURNED`, write an activity log and notify the claimant.

## 7. AI (Gemini, backend only)

Use `@google/genai` with `GEMINI_API_KEY` and `GEMINI_MODEL` from env (verify the current model name in Google's docs before building; default `gemini-2.5-flash`). AI never replaces business logic, never invents numbers, and is used for exactly two features.

**Common handling:** request timeout around 15 seconds; catch 429 and network errors; validate output with Zod before saving or returning; on any failure return a structured fallback (`{ available: false, message }`) and HTTP 200 so the rest of the page keeps working.

### 7.1 Work Order summary (`POST /ai/work-order-summary`)

- Allowed for the assigned technician or a manager. Body: `{ workOrderId }`.
- If `aiSummary` exists, return it without calling Gemini.
- Sends only the WO title and description. System instruction: 1–2 factual sentences, preserve the meaning, add no details, no diagnosis, no recommendations.
- Validate: non-empty string, under 300 characters. Store in `aiSummary { text, generatedAt }`. Never modify status, priority or assignment.
- UI: button 'Summarize Issue with AI', shows the result with a label that it is AI-generated.

### 7.2 Maintenance Insights (`POST /ai/maintenance-insights`)

- Manager only. Body: `{ period: '7d' | '30d', regenerate?: boolean }`.
- Backend aggregates with MongoDB pipelines: most reported categories, building hotspots, repeated issues in the same location, average resolution hours, technician workload distribution (anonymized as Technician A, B, C), overdue count, change versus the previous period.
- Send Gemini only that statistics JSON plus the period dates. No names, emails or free-text descriptions.
- Expected output JSON: `observations[]`, `repeatedPatterns[]`, `operationalRisks[]`, `preventiveRecommendations[]` (arrays of short strings, validated with Zod; strip markdown fences before parsing).
- Cache in `AiInsightCache` per period; return the cache unless `regenerate` is true. Always show the period covered and `generatedAt`.
- Fallback: show the computed statistics anyway with a banner, and the last cached insights if available.
- The UI labels the statistics as system-calculated and the text as AI-generated.

## 8. Shared features

- **Notifications:** created by a shared `notify()` service on these events: new request (to managers), approve/reject, WO assigned or reassigned, WO started/completed/cancelled, completion awaiting confirmation, request reopened, match confirmed, new claim (to officers), claim approved/rejected, handover completed. UI: bell with unread count, dropdown list, mark one/all as read, click navigates to `linkUrl`. The client polls `GET /notifications` every 30 seconds with TanStack Query. No websockets.
- **Activity logs:** a shared `logActivity()` service called from services for: user create/update/status change, request submit/review/confirm/reopen, WO create/assign/status changes/cancel, preventive plan changes and generate-due runs, match decisions, claim reviews, handovers, location changes. Admin-only table with filters (entity type, actor, date) and pagination.
- **Locations:** reusable building/floor/room records used by both modules; Admin CRUD.
- **Dashboard:** one `/dashboard` page. `GET /dashboard` reads the role from the JWT (never from a URL parameter) and returns that role's payload: Admin (cross-module totals plus the latest cached AI insights, read-only; Admin cannot generate), Manager (section 5.8 metrics, charts, AI Insights panel), Technician (assigned/in-progress/overdue, schedule), Officer (open lost/found counts, pending matches, pending claims, handovers), Student/Employee (own requests, claims, reports, recent notifications). Use at most 2–3 Recharts charts on the manager dashboard.
- **Uploads:** multer memory storage, streamed to Cloudinary. Allowed types: JPEG, PNG, WebP. Max 5 MB each, max 3 per entity. Reject others with a clear error. Authenticated users only. If Cloudinary env vars are empty, fall back to local disk in development only (disk is ephemeral on Render). Store `{ url, publicId }`. UI shows previews before upload and a lightbox after.
- **UX:** responsive (desktop, tablet, mobile), role-specific sidebar, consistent shadcn/ui components, status and priority badges, tables with search, filters and pagination, confirmation dialogs for state changes, form validation, loading skeletons, empty states, error states, toast feedback. No decorative animation.

## 9. API contract (`/api/v1`)

Roles: ADM = Super Admin, MGR = Maintenance Manager, TECH = Technician, OFF = Lost & Found Officer, USER = Student/Employee. Every route requires authentication except login, demo-login and health. Every body and query is validated with Zod. List endpoints take `page` and `limit` and return `{ data, page, limit, total }`.

**Meta and health**

- `GET /health` (public; mounted at the server root, not under `/api/v1`)
- `GET /meta` (any): categories, priorities, statuses, match thresholds

**Auth**

- `POST /auth/login`, `POST /auth/demo-login` (only if DEMO\_MODE), `GET /auth/me`, `PATCH /auth/change-password`

**Users and locations**

- `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/status` (ADM)
- `GET /locations` (any), `POST /locations`, `PATCH /locations/:id`, `DELETE /locations/:id` = deactivate (ADM)

**Maintenance requests**

- `POST /maintenance/requests` (USER, multipart)
- `GET /maintenance/requests` (USER own; MGR/ADM all), `GET /maintenance/requests/:id` (owner, MGR, ADM, or TECH assigned to its WO)
- `PATCH /maintenance/requests/:id/review` (MGR): `{ action: 'UNDER_REVIEW' | 'APPROVE' | 'REJECT', notes }`
- `PATCH /maintenance/requests/:id/confirm` (owner, MGR): COMPLETED → CLOSED; MGR also REOPENED → CLOSED
- `PATCH /maintenance/requests/:id/reopen` (owner, MGR): `{ reason }`

**Work Orders**

- `GET /work-orders` (MGR/ADM all; TECH own), `GET /work-orders/:id`
- `PATCH /work-orders/:id/assign` (MGR), `PATCH /work-orders/:id/start` (TECH assigned), `POST /work-orders/:id/notes` (TECH assigned, MGR), `PATCH /work-orders/:id/complete` (TECH assigned), `PATCH /work-orders/:id/cancel` (MGR)

**Technicians, calendar, preventive, feedback**

- `GET /technicians`, `GET /technicians/:id` (MGR, ADM), `POST /technicians`, `PATCH /technicians/:id` (MGR, ADM)
- `GET /maintenance/calendar` (MGR all; TECH own; ADM read-only)
- `GET /preventive-maintenance`, `POST /preventive-maintenance`, `PATCH /preventive-maintenance/:id`, `PATCH /preventive-maintenance/:id/status`, `POST /preventive-maintenance/generate-due` (MGR; ADM read)
- `POST /feedback` (USER owner, CLOSED request), `GET /feedback` (MGR, ADM; USER own)

**Lost & Found**

- `POST /lost-found/items` (USER, OFF; multipart), `GET /lost-found/items` (any, public projection; `?mine=true` lists the caller's own reports for My Reports), `GET /lost-found/items/:id` (public projection; full for reporter, OFF, ADM), `PATCH /lost-found/items/:id` (reporter edits own while OPEN; OFF; supports closing)
- `GET /lost-found/matches` (OFF; filter by status, item), `PATCH /lost-found/matches/:id` (OFF): `{ action: 'CONFIRM' | 'DISMISS' }`, `POST /lost-found/items/:id/recalculate` (OFF)
- `POST /lost-found/claims` (USER, multipart), `GET /lost-found/claims` (OFF all; USER own), `GET /lost-found/claims/:id` (OFF, claimant; notes hidden from claimant)
- `PATCH /lost-found/claims/:id/review` (OFF): `{ action: 'START_VERIFICATION' | 'APPROVE' | 'REJECT', notes }`
- `POST /lost-found/claims/:id/handover` (OFF)

**Notifications, dashboard, logs, AI**

- `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- `GET /dashboard?period=` (any, role-specific)
- `GET /activity-logs` (ADM)
- `POST /ai/work-order-summary` (TECH assigned, MGR), `POST /ai/maintenance-insights` (MGR)

## 10. Security and reliability

- bcryptjs password hashing; JWT with expiry (1 day); `passwordHash` never selected or returned.
- Role middleware plus service-layer ownership checks on every record access. Users cannot read or change other users' private records.
- Helmet, CORS allowlist from `CLIENT_URL` (comma-separated, production origins only), centralized error handler returning no stack traces or internals in production, JSON body size limit.
- Zod validation on all input; file type and size validation on uploads; deactivated users are rejected at authentication.
- Secrets only in environment variables; `.env` ignored by git; `.env.example` files committed.
- Rate limiting is intentionally not implemented.

## 11. Pages by role

- **All:** Login (with demo role buttons when enabled), Notifications dropdown, Profile / change password.
- **Student/Employee:** My Dashboard; New Maintenance Request; My Requests + detail (progress, confirm, reopen, feedback); Report Lost/Found; Browse Lost & Found (search + filters); Item detail + Submit Claim; My Claims; My Reports.
- **Technician:** Dashboard; My Work Orders + detail (AI summary, start, notes, complete); My Schedule (calendar).
- **Maintenance Manager:** Dashboard (metrics, charts, AI Insights); Request Queue + review; Work Orders (assign, cancel); Technicians; Calendar; Preventive Plans; Feedback.
- **Lost & Found Officer:** Dashboard; All Reports; Match Suggestions (confirm/dismiss); Claims queue + verification screen; Handover form.
- **Super Admin:** Dashboard; Users; Locations; Activity Logs; read-only views of both modules.

## 12. Environment and deployment

- **Server env:** `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `DEMO_MODE`.
- **Client env:** `VITE_API_URL`, `VITE_DEMO_MODE`.
- Provide `.env.example` in both folders, a README with local setup and deployment steps, and `GET /health` for the host health check.
- Vercel needs a `vercel.json` SPA rewrite. Render free tier sleeps when idle, so warm the server before the demo.
- The seed script (`npm run seed`) wipes and recreates demo data, refuses to run when `NODE_ENV=production`, and prints the demo accounts.

## 13. Demo data (seed script only)

One account per role (plus 4–5 technicians with different specializations), 4+ buildings with floors and rooms, 20+ maintenance requests in every status and priority, Work Orders in every status (including one overdue and one reopened), completed tasks with feedback, 2–3 preventive plans (one already due), 8+ lost and 8+ found items including pairs that should score STRONG and POSSIBLE, stored matches, claims in pending, under verification, approved and completed states, one handover, notifications and activity logs. Dashboards must read this from the database, not from hardcoded values.

## 14. Testing and acceptance

**Automated (vitest):** matching service (strong match, possible match, below threshold, missing color/brand not penalized, incompatible category skipped, found-before-lost skipped, dismissed match not resurrected), request and WO state-machine validators (every allowed and several forbidden transitions), recurrence date calculation, public projection never includes private details.

**Manual acceptance scenarios:**

1. *Maintenance:* user submits → manager approves (WO auto-created) → manager assigns → technician sees it, runs AI summary, starts, completes → requester is notified, confirms → submits feedback → dashboard numbers update. Also: reopen path and cancel path.
2. *Lost & Found:* user reports lost → another user reports found → match suggested → officer confirms → owner notified, submits claim → officer verifies against private details, approves → handover recorded → item RETURNED, claim COMPLETED.
3. *AI:* insights generate from real aggregates, are cached, and a simulated Gemini failure (bad key) shows the fallback without breaking any other page.
4. *Security:* student gets 403 on admin and manager endpoints; technician cannot modify an unassigned WO; users cannot read others' requests or claims; only officers approve claims or record handovers; only managers assign WOs; public item endpoints never expose private details.

## 15. Explicitly excluded

Transportation, buses, GPS, standalone asset management (QR codes, lifecycle, transfers, warranties, depreciation), spare-parts inventory, AI-based matching, AI chatbots, AI diagnosis, microservices, admin password reset, rate limiting, CSV export, technician repair-image uploads, auto-close, cron jobs, websockets, daily calendar view, self-registration, settings/category management UI, separate TechnicianProfiles and HandoverRecords collections.

## 16. Seven-day plan and cut order

| Day | Focus |
| --- | --- |
| 1 | Monorepo, Express + Mongoose core, all models and indexes, auth, RBAC, demo login, seed skeleton, app shell, login |
| 2 | Locations, meta, notifications and activity-log services, requests with uploads, manager review and approval (auto-WO) |
| 3 | Work Orders, technician management, assignment, technician portal, confirm/reopen/cancel, feedback |
| 4 | AI Work Order summary, calendar, Lost & Found reporting and public search |
| 5 | Matching service + tests, officer match review, claims, verification, handover |
| 6 | Dashboards, AI Insights, preventive maintenance, full seed data |
| 7 | Testing all scenarios and roles, fixes, README, deployment, demo prep |

**If behind schedule, cut in this order:** preventive maintenance → calendar → AI Insights → extra charts → search filters beyond keyword/category/type/status. Never cut: auth/RBAC, the request → WO → completion workflow, the lost → match → claim → handover workflow, and the AI Work Order summary.
