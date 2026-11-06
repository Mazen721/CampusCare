# Feature Specification: CampusCare Platform

**Feature Branch**: `001-campuscare-platform`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Use MASTER_SPEC.md as the single source of truth. Cover all 5 roles and their permissions (section 3), the Maintenance module, the Lost & Found module, both AI features, notifications, activity logs, dashboards, security rules (section 10) and pages by role (section 11). User stories and acceptance scenarios come from sections 5, 6 and 14. Add nothing beyond the document."

## User Scenarios & Testing *(mandatory)*

Roles: Super Admin (Admin), Maintenance Manager (Manager), Technician, Lost & Found Officer
(Officer), Student/Employee (User). Section references point to MASTER_SPEC.md.

### User Story 1 - Sign in and role-based access (Priority: P1)

Every person signs in with an account created by the Admin (or the seed). After sign-in they see
a role-specific sidebar and dashboard and can reach only what their role allows (section 3). In
demo mode, the login page offers one-click sign-in per role.

**Why this priority**: Every other story depends on identity and permissions.

**Independent Test**: Sign in as each seeded role; confirm the correct sidebar, and confirm
forbidden actions are refused even when called directly.

**Acceptance Scenarios**:

1. **Given** a seeded account per role, **When** each signs in, **Then** they land on their own dashboard with their role's pages only.
2. **Given** a deactivated user, **When** they try to sign in or use an existing session, **Then** access is refused.
3. **Given** a Student, **When** they call an Admin or Manager action, **Then** it is refused as forbidden.
4. **Given** demo mode is off, **When** anyone attempts demo sign-in, **Then** the option does not exist.
5. **Given** a signed-in user, **When** they change their password from the Profile page, **Then** the new password is required on next sign-in.

---

### User Story 2 - Maintenance request to resolution (Priority: P1)

A User submits a maintenance request; a Manager reviews and approves it, which automatically
creates a Work Order; the Manager assigns a Technician with a schedule; the Technician starts and
completes it; the User confirms (closing it) or reopens it; after closing, the User may leave
feedback (sections 5.1–5.3, 5.7, 14 scenario 1).

**Why this priority**: Core workflow of the Maintenance module; never cut.

**Independent Test**: Run the full path with seeded accounts and verify every status change,
notification and dashboard count.

**Acceptance Scenarios**:

1. **Given** a User, **When** they submit title, description, category, priority, location, optional equipment description and up to 3 images, **Then** a numbered request is created in SUBMITTED and Managers are notified.
2. **Given** a SUBMITTED or UNDER_REVIEW request, **When** the Manager approves, **Then** the request becomes APPROVED and exactly one Work Order is created in PENDING_ASSIGNMENT, atomically, and the requester is notified.
3. **Given** a SUBMITTED or UNDER_REVIEW request, **When** the Manager rejects without notes, **Then** it is refused; with notes, the request becomes REJECTED (terminal) and the requester is notified.
4. **Given** a PENDING_ASSIGNMENT Work Order, **When** the Manager assigns an active, non-off-duty Technician with a start and an end after the start, **Then** it becomes ASSIGNED and the Technician is notified.
5. **Given** an ASSIGNED Work Order, **When** the assigned Technician starts it, **Then** it becomes IN_PROGRESS, the actual start is recorded and the request becomes IN_PROGRESS.
6. **Given** an IN_PROGRESS Work Order, **When** the Technician completes it with resolution details, **Then** it becomes COMPLETED, the request becomes COMPLETED and the requester is asked to confirm or reopen.
7. **Given** a COMPLETED request, **When** the requester confirms, **Then** it becomes CLOSED (terminal) and the requester is prompted for optional feedback.
8. **Given** a COMPLETED request, **When** the requester or Manager reopens with a reason, **Then** atomically the request becomes REOPENED, the Work Order returns to ASSIGNED, the previous resolution is kept as a system note, completion data is cleared, the reopen count increases and the Technician is notified.
9. **Given** a non-terminal Work Order, **When** the Manager cancels with a reason, **Then** it becomes CANCELLED (terminal); for a request-based Work Order the request returns to UNDER_REVIEW and the Manager is notified; re-approval creates a new Work Order while the cancelled one remains.
10. **Given** a CLOSED request, **When** the original requester submits a 1–5 rating and optional comment (max 500 chars), **Then** feedback is saved once, attributed to the Work Order's Technician; a second submission is refused.
11. **Given** a REOPENED request, **When** the Manager closes it, **Then** it becomes CLOSED.

---

### User Story 3 - Lost item to returned owner (Priority: P1)

A User reports a lost item; someone reports a found item; the system suggests a match; an Officer
confirms it; the owner submits a claim; the Officer verifies against private details and approves;
a handover is recorded and the item is returned (sections 6.1–6.4, 14 scenario 2).

**Why this priority**: Core workflow of the Lost & Found module; never cut.

**Independent Test**: Run the full path with seeded accounts and verify statuses, notifications and
that private details never leak.

**Acceptance Scenarios**:

1. **Given** a User or Officer, **When** they report a LOST or FOUND item with title, public description, private identification details, category, optional color/brand, location, location details, date and up to 3 images, **Then** a numbered OPEN report is created and matching runs.
2. **Given** a LOST and a FOUND item both OPEN that score 60 or more, **When** matching runs, **Then** a suggestion is stored as STRONG (80–100) or POSSIBLE (60–79); below 60 nothing is stored.
3. **Given** a suggested match, **When** the Officer confirms, **Then** both items become MATCH_CONFIRMED, the LOST reporter is notified with a link to a claim form pre-linked to their lost report, and the action is logged. **When** the Officer dismisses, **Then** the suggestion is never re-suggested.
4. **Given** a FOUND item in OPEN, MATCH_CONFIRMED or CLAIM_UNDER_REVIEW, **When** a User submits a claim (description, identifying details, optional evidence images, optional own lost report), **Then** a numbered claim is created in PENDING_REVIEW, the item becomes CLAIM_UNDER_REVIEW and Officers are notified.
5. **Given** a pending claim, **When** the Officer opens verification, **Then** they see the found item's private details beside the claimant's answers and evidence and can record internal notes never shown to the claimant.
6. **Given** a claim under review, **When** the Officer approves, **Then** the claim becomes APPROVED, the item becomes APPROVED_FOR_HANDOVER, all other pending claims on the item are auto-rejected and the claimant is notified.
7. **Given** a claim, **When** the Officer rejects with a reason, **Then** the claim becomes REJECTED, the reason is shown to the claimant, and if no active claims remain the item returns to OPEN.
8. **Given** an APPROVED claim, **When** the Officer records the handover (received by, notes), **Then** atomically the claim becomes COMPLETED, the found item and any linked lost item become RETURNED, the action is logged and the claimant is notified.
9. **Given** any item not RETURNED, **When** an Officer (or the reporter of their own LOST report) closes it, **Then** it becomes CLOSED.

---

### User Story 4 - Public browsing with privacy (Priority: P1)

Any signed-in user can browse and search Lost & Found listings by keyword, category, type,
location/building, date range, color, brand and status, without ever seeing private identification
details or reporter contact details (section 6.1, 14 scenario 4).

**Why this priority**: Privacy is a security requirement and part of the never-cut workflow.

**Independent Test**: Browse and open items as a non-privileged user and verify private fields are
absent; open the same items as the reporter, Officer and Admin and verify they are present.

**Acceptance Scenarios**:

1. **Given** any signed-in user, **When** they browse, search or open an item they did not report, **Then** private details and reporter contact details are never included.
2. **Given** the reporter, an Officer or the Admin, **When** they open the item, **Then** private details are shown.

---

### User Story 5 - Technician management and assignment (Priority: P2)

Managers (and Admin) create and edit Technician accounts with specializations, skills and
availability; when assigning, matching-specialization Technicians are listed first with their active
workload and availability (section 5.4).

**Why this priority**: Required for assignment but secondary to the core path.

**Independent Test**: Create a Technician as Manager, then assign a Work Order and verify the picker
ordering, workload counts and non-matching confirmation.

**Acceptance Scenarios**:

1. **Given** a Manager, **When** they create or edit a Technician, **Then** it succeeds; **When** they try to create or edit any other role, **Then** it is refused.
2. **Given** a Work Order of a category, **When** the Manager opens the picker, **Then** active Technicians with that specialization appear first, each showing active Work Order count (assigned + in progress) and availability.
3. **Given** a non-matching Technician, **When** the Manager assigns them, **Then** a confirmation is required first.
4. **Given** an assigned Work Order, **When** the Manager reassigns or reschedules, **Then** both old and new Technicians are notified.
5. **Given** a Technician detail page, **When** viewed, **Then** it shows active tasks, completed count, average rating and average resolution hours computed from live data.

---

### User Story 6 - AI Work Order summary (Priority: P2)

On a Work Order, the assigned Technician or a Manager presses "Summarize Issue with AI" and gets a
1–2 sentence factual summary labeled AI-generated (section 7.1).

**Why this priority**: Never-cut demo feature, but depends on Work Orders existing.

**Independent Test**: Summarize a Work Order, repeat (no new generation), then simulate an AI
failure and confirm the page still works.

**Acceptance Scenarios**:

1. **Given** a Work Order without a summary, **When** an allowed user requests it, **Then** a summary under 300 characters is saved and shown with an AI-generated label; status, priority and assignment are unchanged.
2. **Given** a Work Order with a saved summary, **When** requested again, **Then** the saved summary is returned without regenerating.
3. **Given** the AI service fails or times out, **When** requested, **Then** a clear "not available" message appears and the rest of the page keeps working.
4. **Given** a Technician not assigned to the Work Order, **When** they request a summary, **Then** it is refused.

---

### User Story 7 - Role dashboards and maintenance metrics (Priority: P2)

Each role opens one dashboard page whose content depends on their role, computed from live data
(sections 5.8, 8, 14 scenario 1).

**Why this priority**: Shows outcomes of the workflows; needed for the demo.

**Independent Test**: Open the dashboard as each role, perform a workflow action, and confirm the
numbers change.

**Acceptance Scenarios**:

1. **Given** a Manager, **When** they open the dashboard with a period of 7d, 30d, 90d or all, **Then** they see total requests, counts by status, pending, under review, approved, active, completed and overdue Work Orders, average resolution hours, requests by category and by building, technician workload and performance, feedback average and distribution, with at most 2–3 charts.
2. **Given** a Technician, **Then** they see assigned, in-progress and overdue counts and their schedule.
3. **Given** an Officer, **Then** they see open lost/found counts, pending matches, pending claims and handovers.
4. **Given** a User, **Then** they see their own requests, claims, reports and recent notifications.
5. **Given** the Admin, **Then** they see cross-module totals.
6. **Given** any user, **When** they try to request another role's dashboard, **Then** they only ever receive their own role's data.

---

### User Story 8 - Notifications (Priority: P2)

Users get in-app notifications for the events in section 8, see an unread count on a bell, open a
dropdown, mark one or all as read, and click through to the related page. The list refreshes about
every 30 seconds.

**Why this priority**: Connects the multi-actor workflows.

**Independent Test**: Trigger each event and confirm the right recipient receives it and can
navigate from it.

**Acceptance Scenarios**:

1. **Given** any listed event (new request, approve/reject, assigned/reassigned, started/completed/cancelled, awaiting confirmation, reopened, match confirmed, new claim, claim approved/rejected, handover completed), **When** it occurs, **Then** the intended recipient receives a notification with a link.
2. **Given** unread notifications, **When** the user marks one or all as read, **Then** the unread count updates.
3. **Given** a user, **Then** they only ever see their own notifications.

---

### User Story 9 - Admin: users, locations, activity logs (Priority: P2)

The Admin manages all user accounts (any role, activate/deactivate), manages reusable locations
(building, floor, room), views an activity log with filters and pagination, and has read-only views
of both modules (sections 3, 8).

**Why this priority**: Needed to run the system; secondary to workflows.

**Independent Test**: Create a user, deactivate it, edit a location, then confirm each action is in
the activity log.

**Acceptance Scenarios**:

1. **Given** the Admin, **When** they create, edit, activate or deactivate any user, **Then** it succeeds and is logged.
2. **Given** the Admin, **When** they create or edit a location, **Then** it is available in both modules; **When** they delete it, **Then** it is deactivated, not removed; duplicate building/floor/room combinations are refused.
3. **Given** the activity log, **When** the Admin filters by entity type, actor or date, **Then** matching entries are shown with pagination; entries can never be edited or deleted.
4. **Given** the Admin, **When** they view maintenance or Lost & Found records, **Then** they can view everything but cannot perform workflow actions.

---

### User Story 10 - Calendar (Priority: P3, optional / cut-order item 2)

Managers see all Work Orders and Technicians see their own on a Month/Week calendar spanning
scheduled start to expected completion, filterable by technician and status, with overdue items
highlighted red; Admin can view (section 5.5).

**Why this priority**: Second in the cut order.

**Independent Test**: Open the calendar as Manager and Technician and verify visibility, filters and
overdue highlighting.

**Acceptance Scenarios**:

1. **Given** a Technician, **When** they open My Schedule, **Then** only their Work Orders appear.
2. **Given** a Work Order past its expected completion and not completed or cancelled, **Then** it is highlighted red.

---

### User Story 11 - AI Maintenance Insights (Priority: P3, optional / cut-order item 3)

A Manager generates insights for the last 7 or 30 days: the system computes statistics from real
data, and AI writes observations, repeated patterns, operational risks and preventive
recommendations from those statistics only (section 7.2, 14 scenario 3). Admin can view.

**Why this priority**: Third in the cut order.

**Independent Test**: Generate insights, reload (cached), regenerate, then simulate an AI failure.

**Acceptance Scenarios**:

1. **Given** a Manager, **When** they generate insights for a period, **Then** statistics labeled system-calculated and text labeled AI-generated appear with the period covered and generation time.
2. **Given** cached insights, **When** requested again without regenerate, **Then** the cached result is shown.
3. **Given** the AI service fails, **Then** the statistics are still shown with a banner, plus the last cached insights if any, and no other page breaks.
4. **Given** insights generation, **Then** the AI receives only aggregated statistics and period dates, never names, emails or free-text descriptions; technicians appear only as anonymized labels.

---

### User Story 12 - Preventive maintenance (Priority: P3, optional / cut-order item 1)

Managers create, edit, activate and deactivate recurring plans and press "Generate Due Work Orders"
to create Work Orders for plans that are due (section 5.6). Admin can view.

**Why this priority**: First in the cut order.

**Independent Test**: Create a due plan, generate, generate again (no duplicates), verify the next date.

**Acceptance Scenarios**:

1. **Given** an active plan whose next date has arrived, **When** the Manager generates, **Then** one Work Order is created (ASSIGNED if the plan has a Technician, else PENDING_ASSIGNMENT) with expected completion = start + expected duration, and the next date advances past now, skipping missed occurrences.
2. **Given** generation already happened for a date, **When** run again, **Then** no duplicate is created and the run does not fail; the response reports how many were created.
3. **Given** intervals, **Then** daily = 1 day, weekly = 7 days, monthly = +1 calendar month, custom = the plan's day count.
4. **Given** a preventive Work Order is cancelled, **Then** no request is affected.

### Edge Cases

- Approving a request that already has a non-cancelled Work Order MUST NOT create a second one.
- A Technician acting on a Work Order not assigned to them is refused, even via direct calls.
- Assigning an OFF_DUTY or inactive Technician, or an end time not after the start, is refused.
- Completing a Work Order without resolution details is refused.
- Reopen or reject without a reason is refused.
- Feedback on a non-CLOSED request, by a non-requester, or a second time is refused.
- Matching: incompatible categories are skipped unless either side is "Other"; a found date more than 24 hours before the lost date is skipped; missing color or brand does not lower the score; confirmed or dismissed matches never revert to suggested; only OPEN items are considered.
- A claim on a LOST item, on a FOUND item in another status, or a second active claim by the same claimant on the same item is refused; a linked lost report must be the claimant's own.
- Handover on a claim that is not APPROVED is refused.
- Uploads other than JPEG, PNG or WebP, larger than 5 MB, or more than 3 per record are refused with a clear message.
- AI failures (timeout ~15 s, rate limit, network, invalid output) always produce a non-crashing fallback.
- Users cannot read other users' requests, claims or private report details.

## Requirements *(mandatory)*

### Functional Requirements

**Access and security (sections 2, 3, 10)**

- **FR-001**: System MUST authenticate users with email and password; accounts are created only by the Admin, Managers (Technicians only) or the seed. No self-registration and no admin password reset.
- **FR-002**: Sessions MUST expire after 1 day; deactivated users MUST be refused at authentication.
- **FR-003**: Every action except sign-in, demo sign-in and health check MUST require authentication.
- **FR-004**: Demo sign-in per role MUST exist only when demo mode is enabled on the server; the login page shows role buttons only when enabled on the client.
- **FR-005**: System MUST enforce the permission matrix of section 3 on the server through role checks and record-ownership checks; hiding UI elements is not sufficient.
- **FR-006**: Passwords MUST be stored hashed and never returned; all input MUST be validated; error responses in production MUST not expose internals; secrets MUST come only from environment configuration.
- **FR-007**: Users MUST be able to view their profile and change their password.

**Maintenance (section 5)**

- **FR-010**: Users MUST be able to submit requests with title, description, category (9 defaults), priority (LOW/MEDIUM/HIGH/CRITICAL), location, optional equipment description and up to 3 images; requests get sequential human-readable numbers.
- **FR-011**: HIGH and CRITICAL requests MUST show high-contrast badges and sort first by default.
- **FR-012**: Request status MUST change only through the transitions of section 5.2; there is no free-form status change.
- **FR-013**: Work Orders MUST be created only by approving a request or by preventive generation; Work Order status MUST change only through section 5.3.
- **FR-014**: Approve, reopen, claim approval and handover MUST be all-or-nothing operations.
- **FR-015**: A request's status MUST follow its Work Order (start → IN_PROGRESS, complete → COMPLETED, cancel → UNDER_REVIEW) for request-based Work Orders only.
- **FR-016**: Technicians MUST be able to add notes to their own Work Orders; reopen MUST preserve the previous resolution as a system note.
- **FR-017**: Managers and Admin MUST be able to create and edit Technician accounts (specializations, skills, availability AVAILABLE/BUSY/OFF_DUTY); Managers MUST NOT manage other roles.
- **FR-018**: Technician workload, completed count, ratings and resolution hours MUST be computed from live data, not stored counters.
- **FR-019**: Feedback MUST follow section 5.7; Managers see the average, per-technician ratings and a feedback list; Users see their own.
- **FR-020**: Calendar MUST follow section 5.5 (Month/Week only; no daily view).
- **FR-021**: Preventive plans and on-demand generation MUST follow section 5.6; there is no automatic or scheduled generation.

**Lost & Found (section 6)**

- **FR-030**: Users and Officers MUST be able to report LOST or FOUND items with the fields of section 6.1 and 12 default categories; the form warns not to put identifying details in public fields.
- **FR-031**: Public views MUST show only the public fields of section 6.1 and never private details or reporter contact details; private details are visible only to the reporter, Officers and Admin.
- **FR-032**: Search MUST support keyword, category, report type, location/building, date range, color, brand and status.
- **FR-033**: Item status MUST change only through the transitions of section 6.2.
- **FR-034**: Matching MUST be deterministic and rule-based per section 6.3 (no AI), run on item creation and on Officer request, with weights and thresholds configurable on the server.
- **FR-035**: Officers MUST be able to confirm or dismiss matches; a match never confirms ownership.
- **FR-036**: Claims MUST follow section 6.4 (PENDING_REVIEW → UNDER_VERIFICATION → APPROVED/REJECTED → COMPLETED; direct reject allowed); only Officers approve, reject or record handovers.

**AI (section 7)**

- **FR-040**: AI MUST be used for exactly two features: Work Order summary and Maintenance Insights; it MUST never change business data other than storing its own output, and never invent numbers.
- **FR-041**: Every AI request MUST time out after about 15 seconds, validate output, and on any failure return a fallback without breaking the page.

**Shared (section 8)**

- **FR-050**: Notifications MUST be created for every event in section 8 and delivered only to their recipients; the client refreshes them about every 30 seconds (no live push).
- **FR-051**: Activity logs MUST record the actions listed in section 8; they are Admin-only, filterable by entity type, actor and date, paginated and immutable.
- **FR-052**: Locations MUST be reusable across both modules; Admin-only management; deletion deactivates.
- **FR-053**: There MUST be one dashboard page whose content is determined by the signed-in user's role, never by a parameter.
- **FR-054**: Uploads MUST accept only JPEG, PNG, WebP up to 5 MB, max 3 per record, from authenticated users, with previews before upload and a lightbox after.
- **FR-055**: Lists MUST be paginated; the UI MUST be responsive with role-specific navigation, status/priority badges, confirmation dialogs for state changes, validation, loading, empty and error states, and toast feedback.
- **FR-056**: Pages per role MUST match section 11.
- **FR-057**: Categories, priorities, statuses and match thresholds MUST be available to all signed-in users as reference data; there is no settings UI.

**Out of scope (section 15)**: transportation, GPS, asset management, spare parts, AI matching,
chatbots, AI diagnosis, rate limiting, CSV export, technician repair images, auto-close, scheduled
jobs, live push, daily calendar view, self-registration, settings UI.

### Key Entities *(include if feature involves data)*

- **User**: person with one of 5 roles, active flag; Technicians also have specializations, skills, availability.
- **Location**: building/floor/room record, unique combination, deactivatable.
- **Maintenance Request**: a User's reported issue with number, details, images, status, review info, current Work Order, reopen count.
- **Work Order**: unit of work from a request (reactive) or plan (preventive); technician, schedule, status, notes, resolution, optional AI summary.
- **Preventive Plan**: recurring maintenance definition with recurrence, next date and optional default Technician.
- **Service Feedback**: one rating/comment per closed request, linked to the Technician.
- **Lost/Found Item**: LOST or FOUND report with public fields, private identification details, images, status.
- **Item Match**: scored pairing of a LOST and FOUND item with level, score breakdown and review status; unique per pair.
- **Claim**: a User's ownership claim on a FOUND item with evidence, officer-only notes, status and embedded handover record.
- **Notification**: per-user message with link and read flag.
- **Activity Log**: immutable audit entry (actor, action, entity, description).
- **AI Insight Cache**: latest generated insights per period (7d, 30d).
- **Counter**: source of sequential human-readable numbers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 4 manual acceptance scenarios in section 14 (maintenance, lost & found, AI, security) pass end to end with seeded accounts.
- **SC-002**: 100% of dashboard numbers come from stored records; performing a workflow action changes the relevant dashboard numbers on next load.
- **SC-003**: 0 public listing, search or detail views expose private identification details, proven by automated tests.
- **SC-004**: 100% of forbidden role actions in the section 3 matrix are refused when attempted directly.
- **SC-005**: With the AI service unavailable, 100% of non-AI pages work and AI features show a fallback message.
- **SC-006**: Automated tests cover matching (strong, possible, below threshold, missing color/brand, incompatible category, found-before-lost, dismissed not resurrected), every allowed and several forbidden request and Work Order transitions, recurrence date calculation and public projection; all pass.
- **SC-007**: A new user completes a maintenance request submission in under 2 minutes.
- **SC-008**: Notifications appear for the recipient within about 30 seconds of the triggering event.

## Assumptions

- MASTER_SPEC.md v4.0 is authoritative; where any older document conflicts, it wins.
- One account per role plus 4–5 Technicians and the demo data of section 13 are created by a seed script that refuses to run in production.
- Preventive maintenance, calendar and AI Insights are optional and cut in that order if behind schedule; auth/permissions, the request → Work Order → completion workflow, the lost → match → claim → handover workflow and the AI Work Order summary are never cut.
- Rate limiting is intentionally not implemented.
- Images use a cloud image host; a local fallback is allowed in development only.
