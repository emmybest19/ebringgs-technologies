# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Monorepo with two independently-installed npm projects:

- `frontend/` — Vite + React 19 + TypeScript + Tailwind CSS v4 SPA
- `backend/` — Express + TypeScript + Mongoose API, with a WebSocket signaling server attached to the same HTTP server

The root `package.json` is purely an orchestrator using `concurrently`; it has no app code of its own. Install dependencies in each subproject (`npm --prefix frontend install`, `npm --prefix backend install`) — `npm install` at the root won't reach them.

## Common commands

```bash
# Run both halves in dev mode (frontend on 5173, backend on 5000)
npm run dev

# Run one half
npm run dev:frontend
npm run dev:backend

# Switch the backend's DB environment (each picks a different MONGO_URI_* var)
npm --prefix backend run dev          # NODE_ENV=development
npm --prefix backend run dev:staging  # NODE_ENV=staging
npm --prefix backend run dev:prod     # NODE_ENV=production

# Typecheck without emitting
npm --prefix backend run typecheck
npm --prefix frontend exec tsc -b --noEmit

# Lint (frontend only — backend has no lint script)
npm --prefix frontend run lint

# Production builds
npm run build:frontend     # → frontend/dist
npm run build:backend      # → backend/dist (then `npm --prefix backend start`)

# Seed the initial admin user (uses ADMIN_* env vars)
npm --prefix backend run seed:admin
```

There is no test runner configured in either package — don't suggest `npm test` commands.

## Backend architecture

`src/index.ts` boots a single HTTP server that hosts **both** the Express app and a `ws` `WebSocketServer` on the `/ws` path (WebRTC signaling for the live classroom). They share one port — don't split them.

Request flow per route file in `src/routes/` → controller in `src/controllers/` → Mongoose model in `src/models/`. Standard layered MVC. Each route file Swagger-annotates its endpoints via JSDoc comments; the OpenAPI spec is built at startup in `src/config/swagger.ts` and served at `/api/docs`.

**Middleware order matters in [backend/src/app.ts](backend/src/app.ts):**
1. `helmet`, `cors`, rate limiter (`/api` scope)
2. JSON body parser
3. All `/api/*` routes (Paystack's webhook verifies signatures against `JSON.stringify(req.body)`, so it does **not** need raw-body parsing — if a future provider does, mount that webhook BEFORE the JSON parser)
4. Static `/uploads` for Multer-saved files
5. Swagger UI at `/api/docs`
6. 404 catch-all, then the global `errorHandler`

**Auth & errors:**
- `protect` middleware verifies the JWT and populates `req.user` (`AuthRequest` type in `backend/src/types.ts`)
- `authorize('admin', 'teacher', …)` does role gating; chain after `protect`
- Throw via `next(new AppError(message, statusCode))` — the `errorHandler` in `backend/src/middleware/error.middleware.ts` formats responses as `{ status: 'error', message }`. Success responses use `{ status: 'success', data: {...} }` — keep that shape, the frontend reads `response.data.data`.

**Multi-environment DB:** `backend/src/config/db.ts` reads `MONGO_URI_DEVELOPMENT`, `MONGO_URI_STAGING`, or `MONGO_URI_PRODUCTION` based on `NODE_ENV`, falling back to `MONGO_URI`. Each env points at a different Atlas cluster.

**Payments:** Paystack only ([paystack.controller.ts](backend/src/controllers/paystack.controller.ts), NGN-denominated). Stripe was removed entirely. The legacy `Transaction.stripePaymentIntentId` field name persists in the DB schema but stores the Paystack reference — rename in a future migration.

## Frontend architecture

`frontend/src/App.tsx` declares every route directly — there's no router config file. Four layout components wrap role-specific dashboards (`AdminLayout`, `TeacherLayout`, `ClientLayout`, `StudentLayout`), each gated by `<ProtectedRoute allow="...">`. The `Classroom` page and all checkout/payment pages render **without** any layout — they're full-screen. `AdminLogin` and `TeacherLogin` are separate from the public `/login` page.

**Auth:** Zustand store in `frontend/src/store/auth.store.ts` with `persist` middleware (`auth-storage` key in localStorage). Tokens are stored in **two** places — the Zustand persisted state AND raw `localStorage.accessToken/refreshToken` — because `frontend/src/services/api.ts` reads the raw keys directly in its axios interceptor for token refresh. Don't remove either or refresh breaks. The interceptor automatically refreshes on 401, retries once, and redirects to `/login` on refresh failure.

**API responses:** every controller returns `{ status, data: {...} }`. Frontend code reads `response.data.data` (axios wraps the body once, the API wraps it again). When adding fetches, decompose as `const { data } = await api.get('/foo'); const items = data.data.items;`.

**Tailwind v4 setup (NOT v3):**
- No `tailwind.config.js` — CSS-first config in `frontend/src/index.css` via `@import "tailwindcss";`
- The plugin lives in `frontend/vite.config.ts` (`@tailwindcss/vite`), not in PostCSS
- Dark mode is class-based: `@custom-variant dark (&:is(.dark *));` toggled by `useThemeInit()` which adds/removes `.dark` on `<html>` based on the theme store value (light/dark/system)
- Don't add a `tailwind.config.js` — it won't be read

## Cross-cutting conventions

**Derived-status pattern.** Several models (notably `Cohort`) have a `status` field that admins can set explicitly, but a `deriveXxxStatus()` helper computes the *effective* status from raw fields (dates, counts, flags). Public controllers always run the derive helper before responding so the wire value is self-consistent with the current time — clients should never re-derive. Follow this pattern for any other entity whose status changes with the clock.

**Cohort vs LiveSession.** These are deliberately separate models. A `Cohort` is a single intake (a start date you count down to, with a capacity). A `LiveSession` is one class within a cohort (an individual video room). The public `/schedule` page renders both; the admin has separate `/admin/cohorts` and `/admin/live-sessions` pages. Don't conflate them.

**Plan IDs.** The `Cohort.planId` field references the IDs in `frontend/src/pages/Checkout.tsx`'s `planDetails` map (`web-dev-cohort`, `uiux-mentor`, etc.). The admin Cohort editor exposes these as a dropdown — if you add a new plan, update both places.

**`AuthRequest` type.** Express handlers that use `req.user` must be typed as `AuthRequest` (from `backend/src/types.ts`), not `Request`. The `protect` middleware is the only thing that populates it.

## Where to find more detail

- [APP_FLOW.md](APP_FLOW.md) — full architecture diagram, route map, data models, signaling protocol
- [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md) — production checklist and known deployment gaps
- [Client-flow.md](Client-flow.md) — client-side UX walkthrough
- [suggestions.md](suggestions.md) — backlog of feature enhancements (most marked done)
- `/api/docs` (when the backend is running) — interactive Swagger UI for all endpoints
