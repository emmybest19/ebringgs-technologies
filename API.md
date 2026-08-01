# API Reference

REST + WebSocket API powering three web apps and the Flutter mobile client.

> **Interactive docs:** every route carries Swagger JSDoc annotations. With the
> backend running, the generated OpenAPI spec is browsable at **`/api/docs`**.
> This document is the hand-written overview; `/api/docs` is the source of truth
> for request and response shapes.

---

## Conventions

### Base URL

| Environment | URL |
|---|---|
| Production | `https://ebringgs-backend.onrender.com/api` |
| Local | `http://localhost:5000/api` |

### Response envelopes

Every response uses one of two shapes. Clients rely on this — a new endpoint
that breaks the pattern breaks all four clients at once.

```jsonc
// Success
{ "status": "success", "data": { /* ... */ } }

// Failure — produced centrally by the error handler
{ "status": "error", "message": "Human-readable reason." }
```

Most endpoints nest their payload one level under a named key
(`data.projects`, `data.assignments`, `data.track`). A few return the collection
directly at `data` — notably `GET /live-sessions`. Clients have a helper that
handles both.

### Authentication

Bearer JWT in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Two tokens are issued at login. The **access token** is short-lived; the
**refresh token** is long-lived and exchanged at `POST /auth/refresh`. Clients
run an interceptor that catches a `401`, refreshes once, retries the original
request, and redirects to login if the refresh itself fails.

### Authorisation levels

| Level | Meaning |
|---|---|
| `public` | No token required |
| `any-authed` | Valid token, any role |
| `student` / `client` / `teacher` / `admin` | Role-gated |

Role gating is `protect` (verify JWT, populate `req.user`) followed by
`authorize(...roles)`.

### Errors

| Code | Meaning |
|---|---|
| `400` | Validation failure — Zod rejected the body, or a business rule failed |
| `401` | Missing, invalid, or expired token |
| `403` | Authenticated but wrong role. Also `PAYMENT_REQUIRED` (see below) |
| `404` | Resource does not exist, or exists but is not yours |
| `429` | Rate limit exceeded |
| `500` | Unhandled server fault |

**`403 PAYMENT_REQUIRED`** is special. A user with a suspended installment plan
gets `{ error: 'PAYMENT_REQUIRED', paymentPlanId }`, and clients redirect to the
plan page so the balance can be settled.

### Rate limits

| Scope | Limit |
|---|---|
| All `/api/*` | **100 requests / 15 minutes** per IP |
| `POST /ai-tutor/ask` | **10 requests / minute** per IP |

---

## Endpoints

### Authentication — `/api/auth`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/register` | public | Create account (`student` or `client`), returns both tokens |
| POST | `/login` | public | Email + password |
| POST | `/oauth/google` | public | Exchange a Google ID token *(feature-flagged off)* |
| POST | `/oauth/apple` | public | Exchange an Apple ID token *(feature-flagged off)* |
| POST | `/refresh` | public | Exchange refresh token for a new access token |
| POST | `/forgot-password` | public | Send reset email |
| POST | `/reset-password` | public | Consume reset token |
| GET | `/verify-email` | public | Consume verification token |
| POST | `/resend-verification` | any-authed | Re-send verification email |
| GET | `/me` | any-authed | Current user |

### Users — `/api/users`

| Method | Path | Access |
|---|---|---|
| GET | `/teachers` · `/teachers/:id` | any-authed |
| PATCH | `/profile` | any-authed |
| PATCH | `/change-password` | any-authed |
| GET | `/` | admin |
| POST | `/teacher` | admin |
| PATCH | `/:id/role` | admin |

### Tutoring catalog — `/api/tutoring`

Server-authoritative catalog of cohort and mentorship tracks. In-memory, so it
only changes on deploy — cache generously on the client.

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | public | `?grouped=true` returns `data.groups` by category |
| GET | `/:id` | public | Single track with syllabus, outcomes, FAQ |

### Services catalog — `/api/services`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | public | Returns `data.services`, each decorated with `installmentEligible` |
| GET | `/:id` | public | Single service with deliverables, process, intake fields |
| POST | `/inquire` | public | Custom-quote inquiry; auto-fills name/email when authenticated |

`productized: true` services are buyable instantly. `false` means inquiry-only.

### Cohorts — `/api/cohorts`

A **cohort** is one intake with a start date and capacity. Distinct from a
`LiveSession`, which is one class within it.

| Method | Path | Access |
|---|---|---|
| GET | `/` · `/next` · `/:slug` | public |
| GET | `/my-next` | any-authed |
| GET | `/admin/all` | admin |
| POST · PATCH · DELETE | `/` · `/:id` | admin |
| GET · POST | `/:id/students` | admin |
| DELETE | `/:id/students/:studentId` | admin |

Public responses run `deriveCohortStatus()` before returning, so the wire value
is consistent with the current time. **Clients must not re-derive.**

### Live sessions — `/api/live-sessions`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | public | `?upcoming=true` filters to `upcoming` + `live`. Returns the array directly at `data` |
| GET | `/:id` | public | |
| POST · PATCH · DELETE | `/` · `/:id` | admin | Transitioning to `live` pushes a notification to students |

### Projects — `/api/projects`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/my` | client | Own projects |
| GET | `/my/:id` | client | Single project (ownership enforced) |
| POST | `/` | client | Book a service |
| POST | `/:id/brief` | client | Submit the post-payment intake brief; moves `awaiting_brief` → `in_progress` |
| GET | `/:id/updates` | owner or admin | Activity timeline |
| POST | `/:id/updates` | admin | Post an update |
| DELETE | `/:id/updates/:updateId` | admin | |
| GET | `/` | admin | All projects |
| PATCH · DELETE | `/:id` | admin | Status/progress edits auto-log timeline entries |

Status flow: `awaiting_brief` → `pending` → `in_progress` → `review` →
`completed`, with `cancelled` as a terminal branch.

### Assignments — `/api/assignments`

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/` | student | Multipart; optional file. Awards points, notifies admins |
| GET | `/my` | student | |
| GET | `/` | admin | `?status=` filter |
| PATCH | `/:id/review` | admin | Grade + feedback; awards points on a pass |

### Payments — `/api/paystack`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/initialize` | any-authed | Resolve price server-side, apply discounts, return `authorizationUrl` |
| GET | `/verify/:reference` | any-authed | Confirm and settle |
| GET | `/transactions` | any-authed | Own history |
| GET | `/admin/transactions` | admin | Full ledger |
| POST | `/webhook` | public | HMAC-SHA512 verified against `x-paystack-signature` |

**Price is never trusted from the client.** `serviceId` resolves against the
server catalog. Discounts stack in a fixed order — loyalty points, then gift
voucher, then referral credit — each capped by the remaining balance. On failure
all three are reversed. Verify and webhook run the same idempotent settlement,
since either may arrive first.

Amounts are in **kobo** (₦1 = 100 kobo).

### Payment plans — `/api/payment-plans`

| Method | Path | Access |
|---|---|---|
| GET | `/my` · `/:id` | any-authed |
| GET | `/admin/all` | admin |
| POST | `/:id/extend` · `/:id/mark-paid` | admin |

Installment 1 captures the card authorisation; later installments charge against
the saved token.

### Points & leaderboard — `/api/points`

| Method | Path | Access |
|---|---|---|
| GET | `/me` | any-authed |
| GET | `/leaderboard` | any-authed |

### Vouchers — `/api/vouchers`

| Method | Path | Access |
|---|---|---|
| POST | `/` · GET `/me` · GET `/lookup/:code` · DELETE `/:id` | any-authed |

Self-redemption is rejected.

### Certificates — `/api/certificates`

| Method | Path | Access |
|---|---|---|
| GET | `/verify/:certificateId` | **public** — third-party verification |
| GET | `/my` · `/:certificateId` | any-authed |
| GET | `/` | admin |
| POST | `/issue` · `/issue-cohort/:cohortId` | admin |
| PATCH | `/:certificateId/revoke` · `/restore` | admin |

### Recordings — `/api/recordings`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/my` | any-authed | Student-visible only |
| GET | `/` | teacher, admin | |
| POST | `/` | teacher, admin | Multipart video upload |
| DELETE | `/:id` | teacher, admin | |

Files are served from `/uploads/recordings/` — paths are relative to the API
host, **not** the `/api` prefix.

### Reviews — `/api/reviews`

| Method | Path | Access |
|---|---|---|
| GET | `/` | public (approved only) |
| POST · GET `/me` · PATCH `/:id` · DELETE `/:id` | any-authed |
| GET | `/admin/all` · PATCH `/:id/approve` · `/:id/feature` · DELETE `/admin/:id` | admin |

### Content — `/api/blogs`, `/api/case-studies`

Both follow the same shape: `GET /` and `GET /:slug` public; `POST`, `PATCH`,
`DELETE` admin; `GET /admin/all` admin for unpublished drafts.

### AI assistants

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/ai-tutor/quota` | any-authed | Remaining allowance |
| POST | `/ai-tutor/ask` | any-authed | **10/min** |
| POST | `/site-assistant/ask` | public | Public-site helper |

### Platform

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/public/stats` | public | Aggregated counts, **cached 5 min server-side** |
| GET | `/admin/stats` · `/unread` · `/inquiries` | admin | |
| PATCH | `/admin/inquiries/:id/status` | admin | |
| POST | `/upload` | any-authed | Single file |
| POST | `/newsletter/subscribe` | public | |
| GET | `/push/vapid-key` | public | |
| POST | `/push/subscribe` · DELETE `/unsubscribe` | any-authed | |

---

## WebSocket — `/ws`

Classroom signaling shares the same HTTP server and port as the REST API.

```
wss://ebringgs-backend.onrender.com/ws
```

### Client → server

| `type` | Payload | Effect |
|---|---|---|
| `join` | `roomId`, `userId`, `name` | Registers; replies `room-participants`, broadcasts `user-joined` |
| `offer` / `answer` / `ice-candidate` | `targetId`, `sdp` \| `candidate` | Forwarded to the target peer, stamped with `fromId` / `fromName` |
| `chat` | `text` | Broadcast to the room with a server timestamp |
| `mute-all` | — | Instructor directive, broadcast to everyone else |
| `kick` | `targetId` | Sends `kicked` to the target and closes its socket |
| `attendance` | — | Broadcasts the current roster |

### Server → client

`room-participants` · `user-joined` · `user-left` · `chat` · `mute-all` ·
`kicked` · `attendance-update`

Malformed frames are ignored rather than erroring the connection.

> **Current limitation:** the signaling layer is complete and symmetrical across
> web and mobile, but neither client constructs an `RTCPeerConnection` yet — so
> **remote video does not flow**. Chat, presence and local media are live. See
> [PERFORMANCE.md](PERFORMANCE.md) and the roadmap in [CASE_STUDY.md](CASE_STUDY.md).

---

## Webhooks

### `POST /api/paystack/webhook`

Signature verified as HMAC-SHA512 of the raw body using the Paystack secret,
compared against `x-paystack-signature`. Mismatches return `401`.

Handled events:

| Event | Action |
|---|---|
| `charge.success` | Mark transaction succeeded, settle the installment, capture card authorisation, mark project paid, auto-create a project for service purchases, claim voucher, award referral rewards |
| `charge.failed` | Mark failed, refund points, unclaim voucher, restore referral credit |

**Ordering note:** Paystack's webhook signature is verified against
`JSON.stringify(req.body)`, so this route works *after* the JSON body parser and
needs no raw-body handling. A future provider that signs the raw bytes would
have to be mounted **before** the parser.
