# Quickstart & Validation: CampusCare

## Prerequisites
- Node.js 20 LTS, npm 10
- MongoDB Atlas cluster (free tier is a replica set; required for transactions)
- Optional: Cloudinary account (dev falls back to local disk), Gemini API key (AI shows fallback without it)

## Setup
```bash
npm install                      # root, installs both workspaces
cp server/.env.example server/.env   # fill MONGODB_URI, JWT_SECRET, etc. (MASTER_SPEC section 12)
cp client/.env.example client/.env   # VITE_API_URL=http://localhost:5000/api/v1, VITE_DEMO_MODE=true
npm run seed -w server           # wipes + recreates demo data, prints accounts
npm run dev                      # server :5000, client :5173
```
Server env: `NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, GEMINI_API_KEY, GEMINI_MODEL,
DEMO_MODE`. Client env: `VITE_API_URL, VITE_DEMO_MODE`.

## Automated checks
```bash
npm run typecheck -w server && npm run typecheck -w client   # zero errors
npm test -w server                                           # vitest
```
Expected: state machines, matching, recurrence and public projection tests all pass.

## Manual validation (MASTER_SPEC section 14)
1. **Maintenance**: as USER submit request → MGR approve (WO auto-created) → MGR assign → TECH sees
   it, runs AI summary, starts, completes → USER notified, confirms → submits feedback → MGR dashboard
   numbers change. Repeat with reopen path and cancel path.
2. **Lost & Found**: USER A reports LOST → USER B reports FOUND → match appears for OFF → OFF confirms
   → USER A notified, submits claim → OFF verifies against private details, approves → handover →
   item RETURNED, claim COMPLETED.
3. **AI**: MGR generates insights (stats from DB, cached on reload); set an invalid `GEMINI_API_KEY`,
   restart, confirm fallback banner and all other pages work.
4. **Security**: USER gets 403 on `/users` and `/maintenance/requests/:id/review`; TECH cannot start
   an unassigned WO; USER cannot open another user's request or claim; only OFF can approve claims or
   record handover; only MGR can assign; public item responses never contain
   `privateIdentificationDetails`.

## Deploy
Client → Vercel (`vercel.json` SPA rewrite, set `VITE_*`). Server → Render (`npm run build && npm start`,
health check `GET /health`, set all env vars, `CLIENT_URL` = Vercel origin). Warm the server before demos.

References: [data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md).
