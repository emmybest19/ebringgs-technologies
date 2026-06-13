# E-Bringgs — Production Readiness Audit

**Last reviewed:** 2026-05-01
**Current score:** 51 / 100
**Verdict:** Not ready to ship. Strong product layer, weak operational and security underpinnings.

> Update this file as items get fixed — strike through completed items, bump the score, update the date.

---

## What's good (the 51 points already earned)

- Architecture — clean MVC backend, 14 models / 18 routes / 15 controllers, sensible separation
- Backend TypeScript compiles with zero errors
- Tailwind v4 + Vite + React 18 — modern, fast frontend stack
- Helmet + CORS + rate limiting — basic hardening present
- Auth refresh-token flow — proper access + refresh, axios interceptor for silent renewal
- Paystack webhook signature verification — uses HMAC SHA-512 correctly
- Swagger API docs — full coverage on auth routes, partial elsewhere
- Service catalog is server-authoritative (price-trust fixed for services)
- Idempotent project auto-creation on payment success (webhook + verify converge)
- No `any` types in frontend — strong typing discipline
- Page transitions, productized services, intake forms — solid recent work

---

## SHIP-BLOCKERS — fix before anything else

| # | Issue | Why it kills you |
|---|---|---|
| 1 | `JWT_SECRET=your_jwt_secret_here` and `JWT_REFRESH_SECRET=your_refresh_secret_here` in `.env` are placeholder strings | Either nothing works in prod, or every attacker who reads the repo's `.env.example` knows your secret. **Generate cryptographically random secrets immediately** with `openssl rand -base64 64`. |
| 2 | Real production credentials sit in `backend/.env` (MongoDB Atlas URIs, Paystack keys, real admin password `Mariociano10@`) | The file is gitignored but exists in your working tree. A single bad `git add -A` leaks all production data. The admin password is also weak by 2026 standards. |
| 3 | Training plans still trust `amount` from the client — `paystack.controller.ts` falls back to body amount when no `serviceId` is sent | A user can buy a ₦450,000 mentorship for ₦100. Services are fixed; training plans are still exposed. Mirror the pattern: server-side plans catalog → look up price by `planId`. |
| 4 | Zero tests — no unit, no integration, no e2e | One small change can break checkout, auth, or webhooks. You only find out from angry customers. |
| 5 | File uploads use local disk (`uploads/` directory) | Render, Railway, Heroku, Vercel all have ephemeral filesystems. Files vanish on every deploy. Need S3 / Cloudinary / Supabase Storage. |

---

## HIGH RISK — fix before scaling past first 50 users

| # | Issue | Why it matters |
|---|---|---|
| 6 | Validation only exists on auth routes — payment, project, voucher, points, review controllers all trust `req.body` shape | Easy XSS / overflow / type-confusion attacks. Zod is already installed; just add schemas. |
| 7 | Rate limit is too loose (100 req / 15 min globally for all `/api`) | Login + password-reset endpoints need 5 / 15 min, not 100. A brute-forcer currently gets 9,600 attempts per day per IP. |
| 8 | Paystack webhook uses `JSON.stringify(req.body)` for signature verification (after body parser) | Works only because Express's JSON parser is deterministic. Any middleware that re-serializes silently breaks signature checks. Should use raw-body parser like Stripe webhook does. |
| 9 | No frontend `.env.example` — `VITE_API_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_PAYSTACK_PUBLIC_KEY` undocumented | A new developer can't get the app running without spelunking source code. |
| 10 | 16 frontend TypeScript errors (`verbatimModuleSyntax` issues, unused imports, missing type for `User._id`, missing `teacher` role in admin colors) | Build still works (Vite is forgiving) but `tsc --noEmit` fails CI. |
| 11 | No request logging in production | When something goes wrong at 2am, you have no idea what happened. |
| 12 | No error boundaries on frontend | One thrown component error = white-screen-of-death for the whole app. |

---

## MEDIUM RISK — within 30 days post-launch

| # | Issue |
|---|---|
| 13 | No CI/CD config (no GitHub Actions, no deployment scripts) |
| 14 | No graceful shutdown (`SIGTERM` handler) — drops in-flight requests on every deploy |
| 15 | No structured logging (winston / pino) — using `console.log` in 10 files |
| 16 | No monitoring / alerting (Sentry, LogRocket, Datadog, etc.) |
| 17 | No backup strategy for MongoDB |
| 18 | Email sent over SMTP without TLS verification check |
| 19 | No CSP headers — Helmet defaults are minimal |
| 20 | Refresh tokens stored in localStorage (vulnerable to XSS, but pragmatic trade-off) |
| 21 | No password complexity requirements — 8-char minimum only, no uppercase / symbol / digit |
| 22 | No account lockout after repeated failed logins |
| 23 | No teacher-side profile-edit page for the new instructor fields (`title`, `specialties`, `experience`, `social`, `featured`) — data has no UI to populate it |

---

## LOW PRIORITY — nice-to-have

- Documentation for deployment
- Bundle size analysis
- Image optimization pipeline
- A/B testing infrastructure
- Analytics events

---

## Score breakdown

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Security | 25% | 50 / 100 | 12.5 |
| Testing | 15% | 5 / 100 | 0.75 |
| Code quality | 10% | 70 / 100 | 7 |
| Error handling | 10% | 70 / 100 | 7 |
| Infra / Ops | 20% | 45 / 100 | 9 |
| UX completeness | 10% | 80 / 100 | 8 |
| Input validation | 10% | 45 / 100 | 4.5 |
| **Total** | **100%** | | **~51 / 100** |

---

## Path to 80 / 100 — roughly 3 focused days of work

1. Generate real JWT secrets (`openssl rand -base64 64`) — 5 min
2. Rotate Paystack keys, change admin password, verify `.env` is not pushed anywhere — 15 min
3. Apply server-authoritative pricing to training plans (mirror the services pattern) — 1 hr
4. Move file uploads to Cloudinary or S3 — 2-3 hrs
5. Add Zod validators to all `req.body` endpoints — half day
6. Tighten rate limiting on auth routes (5 / 15 min) — 30 min
7. Add an error boundary at App root — 30 min
8. Fix Paystack webhook to use raw body — 1 hr
9. Add a smoke test suite (login → checkout → success) using Vitest + Supertest — 1 day
10. Add Sentry to both frontend and backend — 1 hr

---

## How to use this document

- Re-run a full audit every time you ship something significant.
- Strike through fixed items rather than deleting them — keeps a record of what you've improved.
- When you fix a SHIP-BLOCKER, move it to a "Fixed" section at the bottom with the date.
- Bump the score and the "Last reviewed" date at the top each time.

---

## Fixed (changelog)

_Move items here as they are completed, with the date you fixed them._
