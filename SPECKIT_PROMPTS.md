# CampusCare: Spec Kit prompts (for MASTER_SPEC.md v4.0)

Run in order, one at a time. Paste only the command line under each heading.

## 1. /speckit-constitution
/speckit-constitution Read MASTER_SPEC.md. Rules:
1. TypeScript modular monolith monorepo: /server (Express, Mongoose, MongoDB Atlas) and /client (React, Vite, Tailwind, shadcn/ui). No microservices.
2. Real persistence only. No mock data or hardcoded dashboard numbers.
3. Every /api/v1 route enforces JWT Bearer auth, except POST /auth/login, POST /auth/demo-login (only when DEMO_MODE=true) and GET /health. Every route uses Zod validation, role authorization and service-layer ownership checks. Controllers do HTTP only; business rules, state transitions and side effects live in services.
4. Status changes only via the state machines in sections 5.2, 5.3, 6.2, 6.4. No free-form status endpoints.
5. Multi-document operations use Mongoose transactions.
6. Gemini via @google/genai, backend only, key and model from env. Only the two features in section 7. Never invents statistics. Always a non-crashing fallback.
7. Lost & Found matching is a pure deterministic TypeScript function. No AI.
8. privateIdentificationDetails and passwordHash use select: false and never appear in public responses.
9. Scope is frozen. Nothing from section 15 may be added.
10. Verify each slice end to end before starting the next.

## 2. /speckit-specify
/speckit-specify Use MASTER_SPEC.md as the single source of truth. Cover all 5 roles and their permissions (section 3), the Maintenance module, the Lost & Found module, both AI features, notifications, activity logs, dashboards, security rules (section 10) and pages by role (section 11). User stories and acceptance scenarios come from sections 5, 6 and 14. Add nothing beyond the document.

## 3. /speckit-plan
/speckit-plan Plan from MASTER_SPEC.md: stack (section 1), 13 collections and exact indexes (section 4, including the WorkOrder partialFilterExpression index, unique ServiceFeedback.maintenanceRequestId, unique ItemMatch pair), endpoints (section 9), AI design (section 7), env vars (section 12). Include: folder structure; state-machine helpers (request, work order, item, claim); matching as a pure config-driven function; shared notify() and logActivity() services; upload middleware (Cloudinary, dev-only local fallback); seed script. Develop against MongoDB Atlas (transactions need a replica set).

## 4. /speckit-tasks
/speckit-tasks Break the plan into the 7 days in MASTER_SPEC.md section 16, one phase per day, each task a vertical slice (model, service, route, UI). End every phase with a verification task (tests pass plus a manual check of that phase's workflow). Put each section 14 unit test in the same phase as its code: state machines, matching service, preventive recurrence date calculation, and public projection never exposing private details. Mark preventive maintenance, calendar and AI Insights as optional (cut-order items).

## Then
/speckit-implement one phase at a time. Phase 1: both server and client compile with zero TypeScript errors, login works for every seeded role.
