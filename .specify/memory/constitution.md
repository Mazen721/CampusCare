<!--
Sync Impact Report
- Version change: template (unversioned) → 1.0.0
- Modified principles: 5 template placeholders → 10 project principles (I–X)
- Added sections: Technology & Scope Constraints; Development Workflow & Quality Gates; Governance
- Removed sections: none
- Templates: plan/spec/tasks templates read this file at runtime; no edits required
- Follow-up TODOs: none
-->
# CampusCare Constitution

MASTER_SPEC.md (v4.0 Lean) is the single source of truth for scope and behavior. Section
references below point to that file.

## Core Principles

### I. Modular Monolith Monorepo
The system MUST be a TypeScript monorepo with `/server` (Express, Mongoose, MongoDB Atlas) and
`/client` (React, Vite, Tailwind, shadcn/ui). The backend MUST be one deployable organized as one
folder per module (routes, controller, service, model, validation). Microservices are forbidden.
Rationale: a 7-day solo build cannot afford distributed-system overhead.

### II. Real Persistence Only
All data shown in the app MUST come from MongoDB. Mock data, hardcoded dashboard numbers and
placeholder pages are forbidden. Demo data MUST be created only by the seed script.

### III. Secured, Layered API
Every `/api/v1` route MUST require JWT Bearer auth, except `POST /auth/login`,
`POST /auth/demo-login` (exists only when `DEMO_MODE=true`) and `GET /health`. Every route MUST
apply Zod validation, role authorization and service-layer ownership checks. Controllers MUST
handle HTTP only; business rules, state transitions and side effects (notifications, activity
logs) MUST live in services.

### IV. State Machines Govern Status
Status changes MUST occur only through the state machines in sections 5.2 (request), 5.3 (work
order), 6.2 (item) and 6.4 (claim). Free-form status update endpoints are forbidden. Each machine
MUST be a validator that rejects disallowed transitions.

### V. Transactional Integrity
Multi-document operations (approve request + create WO, reopen, claim approval, handover) MUST
use Mongoose transactions. Development MUST use MongoDB Atlas or a replica set.

### VI. Bounded, Fail-Safe AI
Gemini MUST be called via `@google/genai` from the backend only, with `GEMINI_API_KEY` and
`GEMINI_MODEL` read from env. AI is limited to the two features in section 7. AI MUST NOT invent
statistics; all numbers come from database aggregates. Every AI call MUST have a non-crashing
fallback.

### VII. Deterministic Matching
Lost & Found matching MUST be a pure, deterministic, config-driven TypeScript function with unit
tests. AI MUST NOT be used for matching.

### VIII. Privacy by Default
`privateIdentificationDetails` and `passwordHash` MUST use `select: false` and MUST never appear
in public responses. Privileged paths MUST opt in explicitly, and tests MUST prove public
endpoints never return private details.

### IX. Frozen Scope
Only features in MASTER_SPEC.md may be built. Nothing listed in section 15 may be added.

### X. Verified Vertical Slices
Work MUST proceed as vertical slices (model → service → route/controller → UI). Each slice MUST be
verified end to end before the next one starts.

## Technology & Scope Constraints

- Stack per section 1; env vars per section 12; data model (13 collections and indexes) per
  section 4; API contract per section 9.
- Resolved decisions in section 2 are final and MUST NOT be re-debated.
- Images are stored as `{ url, publicId }` via Cloudinary; binaries are never stored in MongoDB.

## Development Workflow & Quality Gates

- Follow the 7-day plan and cut order in section 16; cut items only in the stated order.
- A phase is complete only when server and client compile with zero TypeScript errors, its vitest
  tests pass, and its workflow is manually verified.
- Section 14 unit tests (state machines, matching, recurrence, public projection) MUST ship in the
  same phase as the code they cover.

## Governance

This constitution supersedes other practices. Amendments require updating this file with a Sync
Impact Report and a semantic version bump (MAJOR: principle removal/redefinition; MINOR: new
principle or section; PATCH: wording). Every spec, plan, task list and implementation review MUST
check compliance with these principles; deviations MUST be justified in writing.

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
