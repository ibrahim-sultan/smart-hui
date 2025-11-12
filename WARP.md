# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.
``

## Overview

MERN monorepo with two apps:
- server: Express + Mongoose API with role-based auth and an admin subsystem
- client: React (CRA) app that proxies API requests to the server in development

Key docs to reference:
- README.md (project setup, features, env vars)
- server/ADMIN_SYSTEM_README.md (admin roles/permissions and flows)
- IMPLEMENTATION_SUMMARY.md (what was implemented and where)
- RENDER_DEPLOYMENT_GUIDE.md (Render deploy steps and required env vars)

## Common commands

Root (or run from each package as noted):

- Install all dependencies
  - npm run install:all

- Start both apps (dev)
  - npm run dev

- Start server only (dev)
  - npm run server:dev

- Start client only (dev)
  - npm run client:dev

- Build client (production bundle served by server when NODE_ENV=production)
  - npm run build
  - or: npm run client:build

- Start server (production)
  - npm run server:start

- Tests (client uses CRA test runner)
  - Run all tests: npm test
  - Run a single test by pattern:
    - From client/: npm test -- --watchAll=false "pattern"
    - From repo root: (cd client && npm test -- --watchAll=false "pattern")

Server maintenance scripts (run from repo root unless noted):
- Create initial super admin (legacy script): npm run --prefix server create-super-admin
- Reset super admin (preferred): node server/scripts/resetSuperAdmin.js
- Utilities: npm run --prefix server check-users | fix-users | check-admins | fix-admins (see scripts/)

Debug endpoints (development aid):
- POST /api/debug/test-login
- POST /api/debug/reset-super-admin (invokes reset script)
- GET  /api/debug/list-admins

Example (PowerShell):
- Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/debug/reset-super-admin

## Environment configuration

Create server/.env (see README.md and .env.example if present). Important variables the code reads:
- MONGODB_URI
- JWT_SECRET
- PORT (defaults to 5000)
- EMAIL_USER, EMAIL_PASS (for password reset emails)
- CLIENT_URL (used in password reset links)

client/package.json sets "proxy": "http://localhost:5000" for dev.

## High-level architecture

Monorepo orchestration
- Root package.json scripts orchestrate server and client with concurrently
- Production: server serves static client build if NODE_ENV=production and client/build exists

Backend (server/)
- Entry: server/index.js
  - Loads routes and middleware, connects to MongoDB, exposes /api/health and /api/debug/build
  - In production, serves client/build and falls back to index.html for SPA routing
- Auth
  - JWT-based for users (middleware: server/middleware/auth.js)
  - Separate JWT-based flow for admins (middleware: server/middleware/adminAuth.js)
- Models (server/models)
  - User.js: student/staff roles only; email login; bcrypt hashing; optional studentId/department/year
  - Admin.js: super_admin/admin/sub_admin; permissions object with canSeeAllComplaints and visibleCategories; bcrypt hashing; temporaryPassword and reset token support
  - Complaint.js: categories include academic/administrative/infrastructure/financial/network/password/additional_credit/other; status and comments; references submittedBy/assignedTo
  - Notification.js: simple user notifications referencing complaints
- Routes (server/routes)
  - /api/auth: register/login/me for users
  - /api/complaints: CRUD + comments; user-based filtering; admin category checks
  - /api/notifications: list/read/unread-count/delete for the current user
  - /api/password-reset: user password reset email and token handling
  - /api/admin: admin login (email or username), create/list/update/delete admins, change-password, dashboard data and stats, permissions updates
  - /api/debug: test-login, reset-super-admin, list-admins (for troubleshooting)
- Permissions model (admins)
  - Super admin: full access and manage admins
  - Full-access admins: canSeeAllComplaints = true
  - Category-limited admins: visibleCategories enforced in queries and middleware
- Scripts (server/scripts)
  - resetSuperAdmin.js exports resetSuperAdmin() and can be run directly; createSuperAdmin.js is an older one-off initializer

Frontend (client/)
- Tooling: Create React App (react-scripts), React Router, axios, framer-motion, Testing Library
- Contexts
  - contexts/AuthContext.js: user auth; stores JWT in localStorage token; sets axios default Authorization header; fetches /api/auth/me
  - contexts/AdminAuthContext.js: separate admin auth; uses a distinct axios instance; stores JWT in localStorage adminToken; fetches /api/admin/me
- Admin UI
  - components/AdminLogin: admin login with either email (super admin) or username
  - components/AdminDashboard/AdminDashboardContainer: pulls /api/admin/dashboard/complaints and /api/admin/dashboard/stats using adminToken; renders filters and stats based on adminPermissions
  - components/AdminManagement: CRUD for admins (super admin only)
- User UI
  - components/Register/Login/StudentSection/StaffSection/UserComplaints/NotificationSystem
- Dev proxy
  - client/package.json proxy directs API calls to http://localhost:5000 during development

## Operational notes for Warp
- Prefer node scripts via root package.json to coordinate both apps (npm run dev)
- For admin-related testing, use the debug endpoints or run server/scripts/resetSuperAdmin.js to recreate a known-good super admin, then follow server/ADMIN_SYSTEM_README.md
- When testing production behavior locally, build the client (npm run build) and set NODE_ENV=production before starting the server to verify static serving behavior
- If tests are added in client, use CRA’s pattern matching to target a single test; there is no standalone lint script defined in this repo

## Pointers to critical files
- server/index.js (server bootstrap and production static serving)
- server/middleware/auth.js and server/middleware/adminAuth.js (JWT flows)
- server/routes/admin.js (RBAC and dashboard queries)
- client/src/contexts/AuthContext.js and client/src/contexts/AdminAuthContext.js (token handling)
- client/src/components/AdminDashboard/AdminDashboardContainer.js (how permissions affect UI)

