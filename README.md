# CampusCare

CampusCare is a university operations platform that combines maintenance request handling and Lost &
Found reporting in a single role-aware web application. It is a TypeScript monorepo with an Express
and Mongoose API (`server/`) and a React single-page app (`client/`).

## Features

- **Maintenance workflow** — students and employees submit requests with photos; managers review,
  approve, assign technicians, and monitor work orders through completion, confirmation, reopen, and
  cancellation paths.
- **Lost & Found** — report lost or found items, deterministic match suggestions with score
  breakdowns, private claim verification, approval, and recorded handovers.
- **AI assistance** — work-order summaries and manager maintenance insights use Gemini when a key is
  configured, and return a structured fallback without one.
- **Operations dashboards** — role-specific metrics and charts powered by live aggregation queries.
- **Preventive maintenance** — recurring plans and manual due-date work-order generation.
- **Audit and notifications** — activity logs for administrators and in-app notifications for workflow
  events.
- **Five roles** — SUPER_ADMIN, MAINTENANCE_MANAGER, TECHNICIAN, LOST_FOUND_OFFICER, and
  STUDENT_EMPLOYEE.

## Tech stack

| Layer | Stack |
| --- | --- |
| Server | Node.js 20, TypeScript, Express 4, Mongoose 8, Zod, JWT, bcryptjs, Multer |
| Client | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query v5, React Hook Form, Recharts, Sonner |
| Database | MongoDB Atlas or any MongoDB replica set (transactions are required) |
| Files | Cloudinary in production; local `server/uploads/` fallback in development |
| Tests | Vitest, Supertest, `mongodb-memory-server` replica set |

## Repository layout

```text
.
├── client/                 # Vite React SPA
│   ├── src/features/       # Feature pages and API modules
│   ├── src/components/     # Shared and shadcn/ui components
│   └── vercel.json         # SPA rewrite for Vercel
├── server/                 # Express API
│   ├── src/modules/        # One folder per feature module
│   ├── src/shared/         # Middleware, state machines, models, services, utils
│   ├── src/seed/           # Demo seed
│   └── tests/              # Unit and integration tests
└── specs/                  # Product spec, design documents, tasks, API contract
```

The implementation contract is documented in
[`specs/001-campuscare-platform/contracts/api.md`](specs/001-campuscare-platform/contracts/api.md).

## Prerequisites

- Node.js 20 or newer (`package.json` requires `>=20`)
- npm 10
- A MongoDB replica set. MongoDB Atlas free tier works; a standalone MongoDB does not support the
  transactions used by approval, reopen, claim approval, and handover actions.
- Optional: a Cloudinary account for persistent image uploads
- Optional: a Gemini API key for AI features

## Local setup

```bash
npm install
```

Create the environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

On Windows PowerShell use `Copy-Item server/.env.example server/.env` and
`Copy-Item client/.env.example client/.env`.

Fill in at least `MONGODB_URI` and a `JWT_SECRET` of 32 or more characters in `server/.env`. Then
create the demo data:

```bash
npm run seed
```

The seed refuses to run when `NODE_ENV=production`. It wipes the target database and recreates the
demo users, locations, requests, work orders, preventive plans, Lost & Found reports, matches,
claims, notifications, and activity logs.

Start both applications:

```bash
npm run dev
```

- API: <http://localhost:5000>
- SPA: <http://localhost:5173>
- Health check: <http://localhost:5000/health>
- API base path: <http://localhost:5000/api/v1>

## Environment variables

### Server (`server/.env`)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | One of `development`, `test`, `production`. The seed refuses `production`. |
| `PORT` | No | `5000` | HTTP port. Railway injects its own value; do not set it manually there. |
| `MONGODB_URI` | Yes | — | MongoDB connection string. The cluster must be a replica set. |
| `JWT_SECRET` | Yes | — | At least 32 characters. |
| `JWT_EXPIRES_IN` | No | `1d` | JWT lifetime. |
| `CLIENT_URL` | No | `http://localhost:5173` | Comma-separated list of allowed CORS origins. Add the deployed Vercel origin. |
| `CLOUDINARY_CLOUD_NAME` | No | empty | All three Cloudinary values must be set to enable Cloudinary. |
| `CLOUDINARY_API_KEY` | No | empty | |
| `CLOUDINARY_API_SECRET` | No | empty | |
| `GEMINI_API_KEY` | No | empty | Leave empty to exercise the AI fallback. |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Model name used for AI requests. |
| `DEMO_MODE` | No | `false` | When `true`, enables `POST /api/v1/auth/demo-login`. Use `true` only for demo environments. |

### Client (`client/.env`)

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:5000/api/v1` | Base URL of the deployed API, including `/api/v1`. |
| `VITE_DEMO_MODE` | No | `false` | Set to `true` to show the one-click role buttons on the login page. |

## Demo accounts

The seed creates the five role accounts below. The password for all of them is `CampusCare#2026`.

| Role | Email |
| --- | --- |
| SUPER_ADMIN | `t.elshenawy@mansnu.edu.eg` |
| MAINTENANCE_MANAGER | `m.elmetwally@mansnu.edu.eg` |
| TECHNICIAN | `h.elsayed@mansnu.edu.eg` |
| LOST_FOUND_OFFICER | `a.eldesouky@mansnu.edu.eg` |
| STUDENT_EMPLOYEE | `youssef.elashry@std.mansnu.edu.eg` |

When both `DEMO_MODE=true` on the server and `VITE_DEMO_MODE=true` on the client, the login page also
offers one-click demo access to each role.

## Scripts

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API and SPA together. |
| `npm run build` | Build the server to `server/dist` and the client to `client/dist`. |
| `npm run typecheck` | Type-check both workspaces. |
| `npm test` | Run the server test suite (alias for `npm run test -w server`). |
| `npm run seed` | Recreate the demo dataset. |

Workspace-specific scripts:

```bash
npm run dev -w server        # API only
npm run build -w server      # tsc build
npm start -w server          # run the compiled API
npm run typecheck -w server  # server and test TypeScript projects
npm run test -w server       # Vitest
npm run seed -w server       # seed without the root alias

npm run dev -w client        # Vite dev server
npm run build -w client      # type-check and production build
npm run typecheck -w client  # client TypeScript project
```

## Testing

```bash
npm test -w server
```

The suite covers request, work-order, item, and claim state machines; Lost & Found matching and
recurrence logic; public item projection privacy; and integration flows for authentication, RBAC,
locations, users, maintenance, Lost & Found, dashboards, preventive plans, activity logs, and AI
fallbacks. Integration tests start an in-memory MongoDB replica set, so they do not need the
development database.

Run the compile checks separately:

```bash
npm run typecheck
npm run build
```

## Deployment

### Server on Railway

Create a Railway project from this repository and add a service with:

- **Root Directory**: repository root
- **Build Command**: `npm ci --include=dev && npm run build -w server`
- **Start Command**: `npm start -w server`
- **Healthcheck Path**: `/health`

Set every server environment variable from the table above. At minimum: `MONGODB_URI`,
`JWT_SECRET`, `CLIENT_URL`, and `NODE_ENV=production`. Set `CLIENT_URL` to the deployed Vercel origin
(or a comma-separated list of allowed origins). Set `DEMO_MODE=true` only if the deployment is meant
to expose demo login buttons. Railway injects `PORT`; leave it unset.

Generate a public domain for the service and use it as the API origin. Set the client
`VITE_API_URL` to `https://<railway-domain>/api/v1`, then redeploy the backend after updating
`CLIENT_URL` to the Vercel origin.

### Client on Vercel

Import the repository and configure the project for the `client` directory. `client/vercel.json`
already rewrites all routes to `index.html` for client-side routing. Set:

- `VITE_API_URL` to the Railway service URL plus `/api/v1`
- `VITE_DEMO_MODE=true` only when demo login is enabled on the server

Build the client with `npm run build -w client` from the repository root, or with `npm run build`
inside `client/`. The output directory is `client/dist`.

### Demo database

The seed refuses `NODE_ENV=production`. To load demo data into a separate demo database, point
`server/.env` at that database, set `NODE_ENV=development`, and run `npm run seed -w server`. Do not
run it against a production database.

Warm the API before a demo with a request to `GET /health`.

## Validation scenarios

The manual acceptance flows are listed in
[`specs/001-campuscare-platform/quickstart.md`](specs/001-campuscare-platform/quickstart.md):

1. Maintenance: submit → approve → assign → start → complete → confirm → feedback, plus reopen and
   cancel paths.
2. Lost & Found: lost report → found report → match → claim → verification → approval → handover.
3. AI: generate insights, confirm caching, and verify the fallback when no Gemini key is configured.
4. Security: role restrictions, ownership checks, and private Lost & Found details never exposed in
   public responses.

## Troubleshooting

- **Transactions fail or hang**: use a replica set (Atlas or a local replica set), not a standalone
  `mongod`.
- **CORS errors**: `CLIENT_URL` must exactly match the browser origin, including the protocol and
  port. Multiple origins are comma-separated.
- **Uploaded images do not load**: configure all three Cloudinary variables, or run in development
  where uploads are served from `/uploads`. Production requires Cloudinary.
- **AI shows a fallback message**: set `GEMINI_API_KEY` and restart the server. All non-AI features
  continue to work without it.
- **Seed refuses to run**: the seed intentionally blocks `NODE_ENV=production`; use a development or
  test database.
