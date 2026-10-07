# Ytasker

A calm task manager: Kanban + list views, natural quick-add, dashboard insights and a built-in focus timer.

## Structure

| Folder | What | Port |
|---|---|---|
| `backend/` | Express + MongoDB API (JWT auth) | **5000** |
| `frontend/` | The Ytasker app (React, Vite) | **5174** |
| `website/` | Marketing / landing page (React, Vite) | **5173** |

## Local setup

Run each in its own terminal:

```bash
cd backend  && npm install && cp .env.example .env && npm run dev   # http://localhost:5000
cd frontend && npm install && cp .env.example .env && npm run dev   # http://localhost:5174
cd website  && npm install && cp .env.example .env && npm run dev   # http://localhost:5173
```

Set `MONGO_URI` (local MongoDB or an Atlas connection string) and a real `JWT_SECRET` in `backend/.env`.
Check the API end to end with `cd backend && npm run smoke`.

| Variable | Where | Purpose |
|---|---|---|
| `MONGO_URI` | backend | MongoDB connection string (required) |
| `JWT_SECRET` | backend | Signing secret for JWTs (required) |
| `CORS_ORIGIN` | backend | Comma-separated allowed origins (app + website) |
| `VITE_API_URL` | frontend | API base, default `http://localhost:5000/api` |
| `VITE_APP_URL` | website | Where the website's Log in / Get started buttons point, default `http://localhost:5174` |

Vite inlines `VITE_*` variables at build time, so set them before `npm run build`.

## API

All routes except `/api/health`, `/api/auth/signup`, and `/api/auth/login`
require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check (for ALB/EC2 target groups) |
| POST | `/api/auth/signup` | Create account, returns JWT + user |
| POST | `/api/auth/login` | Log in, returns JWT + user |
| POST | `/api/auth/logout` | No-op; client discards the token |
| GET | `/api/profile` | Current user's profile |
| PUT | `/api/profile` | Update name / avatar |
| PUT | `/api/profile/password` | Change password |
| GET | `/api/settings` | Get theme + notification settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks?status=` | List tasks, optional status filter |
| GET | `/api/tasks/:id` | Get one task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

Task `status` is one of `pending`, `in-progress`, `completed`. Every task query
is scoped to the authenticated user, so one user can never read or modify
another's tasks.

### Quick check

```bash
curl -X POST http://localhost:5000/api/auth/signup -H "Content-Type: application/json" -d "{\"name\":\"Ahmad\",\"email\":\"a@example.com\",\"password\":\"secret123\"}"
```

## Deployment notes (AWS)

| Component | Service |
|---|---|
| Backend | EC2 (run `npm start` under pm2/systemd) or Elastic Beanstalk |
| Frontend | `npm run build` → upload `dist/` to S3 + CloudFront |
| Database | MongoDB Atlas or DocumentDB |
| Domain/SSL | Route53 + ACM |

Two things to get right when deploying:

- Set `CORS_ORIGIN` on the backend to the CloudFront/S3 origin, and
  `VITE_API_URL` on the frontend to the public API URL before building.
- The SPA uses client-side routing — configure CloudFront (or S3 static hosting)
  to return `index.html` for 404s, or deep links like `/tasks` will break.

## Out of scope (v1)

Payments, real-time updates, team collaboration, email verification.
