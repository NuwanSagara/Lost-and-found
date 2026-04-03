# CampusFound Smart Campus Lost & Found

CampusFound includes:

- MongoDB-backed lost/found items and match records
- Claude-powered matching
- Socket.IO real-time updates
- Role-based workflows for `CAMPUS_MEMBER`, `FINDER`, and `ADMIN`
- Full admin dashboard at `/admin` (overview, match verification, user management)

## Environment

Copy `server/.env.example` to `server/.env` and set:

- `MONGODB_URI`
- `ANTHROPIC_API_KEY`
- `JWT_SECRET`
- `PORT`
- `CLIENT_URL`
- `CORS_ORIGIN`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Create `client/.env` with:

- `VITE_API_URL=http://localhost:5000/api`

## Run locally

1. Start MongoDB.
2. Start the backend:
   `cd server`
   `npm install`
   `npm run seed:admin`
   `npm run dev`
3. Start the frontend:
   `cd ../client`
   `npm install`
   `npm run dev`

## Role setup

- Public registration creates `CAMPUS_MEMBER`.
- Seed admin with:
  - `cd server`
  - `npm run seed:admin`
- Admin users sign in with the Admin account type.
- Suspended users are blocked at login.

## Admin dashboard

- Route: `/admin` (protected)
- Non-admin access is redirected to `/` with an `Access Denied` toast.
- Sidebar sections:
  - Overview
  - Match Verification
  - User Management
- Real-time admin room (`joinAdmin`) listens for:
  - `newItem`
  - `matchFound`
  - `matchConfirmed`
  - `newUser`

## Admin APIs

All `/api/admin/*` routes require `protect + isAdmin`.

- `GET /api/admin/stats`
- `GET /api/admin/activity?limit=10`
- `GET /api/admin/matches?status=&sort=&page=&limit=`
- `GET /api/admin/matches/:id`
- `PATCH /api/admin/matches/:id/confirm`
- `PATCH /api/admin/matches/:id/reject`
- `GET /api/admin/users?search=&role=&status=&page=&limit=10`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/suspend`
- `DELETE /api/admin/users/:id` (requires `confirmationToken: \"DELETE\"`)

## Notes

- Passwords are never returned in admin responses (`.select('-password')`).
- Role escalation to `ADMIN` is audited in `adminLogs`.
- Account suspension preserves data and only toggles access.
