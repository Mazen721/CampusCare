# API Contract: `/api/v1`

Source: MASTER_SPEC section 9 (authoritative). Roles: ADM, MGR, TECH, OFF, USER.

**Conventions**
- Auth: `Authorization: Bearer <jwt>` on every route except `POST /auth/login`,
  `POST /auth/demo-login` (registered only when `DEMO_MODE=true`) and `GET /health` (server root).
- All bodies/queries validated with Zod → `400 { error: { code:'VALIDATION', message, details } }`.
- Errors: `401` unauthenticated/inactive, `403` role/ownership, `404`, `409` invalid state
  transition or duplicate, `413/415` upload size/type. No stack traces in production.
- Lists: `?page&limit` → `{ data, page, limit, total }`.
- Multipart endpoints: field `images` (≤3; JPEG/PNG/WebP; ≤5 MB each).

| Method & path | Roles | Body / query | Notes |
| --- | --- | --- | --- |
| GET /health | public | – | `{ status:'ok' }` |
| GET /meta | any | – | categories, priorities, statuses, match thresholds |
| POST /auth/login | public | `{ email, password }` | `{ token, user }` |
| POST /auth/demo-login | public, DEMO_MODE | `{ role }` | token for seeded demo user |
| GET /auth/me | any | – | current user |
| PATCH /auth/change-password | any | `{ currentPassword, newPassword }` | |
| GET /users, GET /users/:id | ADM | `?role&isActive&q` | |
| POST /users, PATCH /users/:id | ADM | user fields (+ `password` on create) | logged |
| PATCH /users/:id/status | ADM | `{ isActive }` | logged |
| GET /locations | any | `?includeInactive` (ADM) | |
| POST /locations, PATCH /locations/:id | ADM | location fields | unique building/floor/room |
| DELETE /locations/:id | ADM | – | sets `isActive:false` |
| POST /maintenance/requests | USER | multipart: title, description, category, priority, locationId, equipmentDescription? | notify MGRs |
| GET /maintenance/requests | USER own; MGR, ADM all | `?status&priority&category&q&page&limit` | HIGH/CRITICAL first by default |
| GET /maintenance/requests/:id | owner, MGR, ADM, TECH of its WO | – | |
| PATCH /maintenance/requests/:id/review | MGR | `{ action:'UNDER_REVIEW'\|'APPROVE'\|'REJECT', notes }` | APPROVE txn creates WO; REJECT needs notes |
| PATCH /maintenance/requests/:id/confirm | owner, MGR | – | COMPLETED→CLOSED (MGR also REOPENED→CLOSED) |
| PATCH /maintenance/requests/:id/reopen | owner, MGR | `{ reason }` | txn |
| GET /work-orders | MGR, ADM all; TECH own | `?status&technicianId&sourceType&page&limit` | |
| GET /work-orders/:id | MGR, ADM; TECH own | – | |
| PATCH /work-orders/:id/assign | MGR | `{ technicianId, scheduledStart, expectedCompletion }` | assign or reassign |
| PATCH /work-orders/:id/start | TECH assigned | – | |
| POST /work-orders/:id/notes | TECH assigned, MGR | `{ note }` | |
| PATCH /work-orders/:id/complete | TECH assigned | `{ resolutionDetails }` | |
| PATCH /work-orders/:id/cancel | MGR | `{ reason }` | |
| GET /technicians, GET /technicians/:id | MGR, ADM | `?category` (picker ordering) | active WO count, completed, avg rating, avg resolution h |
| POST /technicians, PATCH /technicians/:id | MGR, ADM | name, email, password, specializations, skills, availability, isActive | role forced to TECHNICIAN |
| GET /maintenance/calendar | MGR all; TECH own; ADM read | `?from&to&technicianId&status` | overdue flag |
| GET /preventive-maintenance | MGR, ADM | – | |
| POST /preventive-maintenance, PATCH /preventive-maintenance/:id | MGR | plan fields | |
| PATCH /preventive-maintenance/:id/status | MGR | `{ isActive }` | |
| POST /preventive-maintenance/generate-due | MGR | – | `{ created }` |
| POST /feedback | USER owner | `{ maintenanceRequestId, rating, comment? }` | request CLOSED; once |
| GET /feedback | MGR, ADM; USER own | `?technicianId&page&limit` | avg + per-tech for MGR |
| POST /lost-found/items | USER, OFF | multipart: reportType, itemTitle, description, privateIdentificationDetails, category, color?, brand?, locationId, locationDetails, occurrenceDate | runs matching |
| GET /lost-found/items | any | `?q&category&reportType&locationId&building&from&to&color&brand&status&mine&page&limit` | public projection |
| GET /lost-found/items/:id | any | – | public; full for reporter, OFF, ADM |
| PATCH /lost-found/items/:id | reporter (own, OPEN), OFF | editable fields or `{ status:'CLOSED' }` | close via item state machine |
| GET /lost-found/matches | OFF | `?status&itemId&page&limit` | |
| PATCH /lost-found/matches/:id | OFF | `{ action:'CONFIRM'\|'DISMISS' }` | |
| POST /lost-found/items/:id/recalculate | OFF | – | |
| POST /lost-found/claims | USER | multipart: itemId, claimDescription, identifyingDetailsProvided, linkedLostItemId? | notify OFFs |
| GET /lost-found/claims | OFF all; USER own | `?status&itemId&page&limit` | |
| GET /lost-found/claims/:id | OFF, claimant | – | `verificationNotes` hidden from claimant; OFF view includes found item private details |
| PATCH /lost-found/claims/:id/review | OFF | `{ action:'START_VERIFICATION'\|'APPROVE'\|'REJECT', notes }` | REJECT needs reason |
| POST /lost-found/claims/:id/handover | OFF | `{ receivedByName, notes? }` | txn |
| GET /notifications | any (own) | `?unreadOnly&page&limit` | includes `unreadCount` |
| PATCH /notifications/:id/read, PATCH /notifications/read-all | any (own) | – | |
| GET /dashboard | any | `?period=7d\|30d\|90d\|all` | role from JWT only |
| GET /activity-logs | ADM | `?entityType&actorId&from&to&page&limit` | |
| POST /ai/work-order-summary | TECH assigned, MGR | `{ workOrderId }` | `{ available, text?, generatedAt?, message? }` |
| POST /ai/maintenance-insights | MGR | `{ period:'7d'\|'30d', regenerate? }` | `{ available, stats, insights?, generatedAt, rangeStart, rangeEnd, message? }` |

AI failures always return HTTP 200 with `available:false`.
