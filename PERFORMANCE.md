# Performance

What is measured, what is optimised, and what is still slow.

Figures in this document were measured against the live production API
(`ebringgs-backend.onrender.com`) in **July 2026**. They are real numbers from a
real deployment, not estimates — re-measure after any infrastructure change.

---

## 1. Measured baseline

### API latency

| Request | Time | Payload |
|---|---|---|
| **Cold start** (first request after idle) | **24–32 s** | — |
| `GET /api/tutoring?grouped=true` (warm) | **1.01 s** | 40 KB |
| `GET /api/services` (warm) | **1.28 s** | 37 KB |
| `GET /api/public/stats` (warm, cached) | **1.20 s** | 146 B |

Two things stand out.

**The cold start is the dominant performance fact of this deployment.** Render's
free tier spins the container down when idle; the next request pays the full
boot cost. A 24–32 second first byte is not a slow response, it is an outage
from the user's point of view — and it was previously being *reported* as one
(see [LESSONS-LEARNT.md](LESSONS-LEARNT.md)).

**Warm responses cluster around 1.0–1.3 s regardless of payload size.** A 146-byte
cached response takes essentially as long as a 40 KB catalog. That shape says the
time is not in query execution or serialisation — it is network round-trip plus
platform overhead. Optimising the queries behind these endpoints would achieve
close to nothing; the win is in *not making the request at all*, which is what
the caching layers below are for.

### Compression

Responses are served **gzipped by Render's edge**, not by the application —
there is no `compression` middleware in Express. Confirmed via
`Content-Encoding: gzip` on a request with `Accept-Encoding: gzip`.

Worth knowing because it is invisible in the codebase: anyone reading `app.ts`
would reasonably conclude responses are uncompressed. If the API ever moves off
Render, compression must be added explicitly or payloads triple overnight.

---

## 2. Caching — four layers

Because warm latency is round-trip-bound, caching does most of the real work.

### Layer 1 — server-side, in-memory

`GET /api/public/stats` aggregates project and student counts across several
collections. Result is cached in-process for **5 minutes**
(`CACHE_TTL_MS` in `public.controller.ts`), with an exported
`clearPublicStatsCache()` for tests and manual invalidation.

This is the only endpoint with server-side caching, and it earns it: the
aggregation is expensive and the data is marketing-grade, where five minutes of
staleness is irrelevant.

### Layer 2 — TanStack Query defaults

Configured once in `packages/api/src/queryClient.ts` and shared by all three web
apps:

| Setting | Value | Reasoning |
|---|---|---|
| `staleTime` | **30 s** | Navigation inside the window serves from cache with no refetch |
| `gcTime` | **5 min** | Unused data survives that long after the last subscriber unmounts |
| `retry` | **1** | One network blip should not surface an error state |
| `retryDelay` | exponential, capped 8 s | |
| `refetchOnWindowFocus` | **off** | Refetching mid-lesson restarts video players and resets forms |
| `refetchOnReconnect` | **on** | Coming back online should pull fresh data |
| mutations `retry` | **0** | The user pressed the button once; a silent retry could double-create |

`refetchOnWindowFocus: false` is the notable departure from the library default.
In a learning UI the default is actively harmful — tabbing back to a classroom
should not reset state.

### Layer 3 — per-query overrides

Defaults are overridden where the data's real volatility differs:

| Data | `staleTime` | Why |
|---|---|---|
| Payment verification | **`Infinity`** (+ 30 min `gcTime`) | A reference resolves once and never changes. Re-verifying is wasted work on a payment path |
| Tutoring catalog | **10 min** | In-memory server-side; only changes on deploy |
| Services catalog | **10 min** | Same |
| Cohort countdown | **10 s** | A countdown wants fresher data than the 30 s default |
| Recordings | 30 s | Default |

### Layer 4 — mobile

Dio with **60-second** connect and receive timeouts — deliberately generous to
survive cold starts rather than reporting them as failures. Riverpod's
`autoDispose` families release query state when a screen is popped.

---

## 3. Database

### Indexes

**45 single-field indexes** (`index: true`) plus **7 compound and specialised
indexes** across 19 models.

| Model | Indexes | Notable |
|---|---|---|
| PaymentPlan | 7 | `{ status, installments.status, installments.dueDate }` — drives the scheduled installment-charging job |
| Review | 6 | |
| Cohort | 6 | `{ isEnrollmentOpen, startDate }` — the public listing query |
| CaseStudy | 6 | |
| User | 5 | |
| Recording | 4 | `{ createdAt: -1 }` — newest-first is the only access pattern |
| Certificate | 4 | |
| Assignment | — | `{ student, program }` compound |
| Blog | — | Text index on `{ title, content, tags }` for search |
| LiveSession | 2 | `{ scheduledAt }`, `{ status }` |

The compound indexes are the ones that matter — each was added for a specific
query rather than speculatively. The PaymentPlan index in particular supports a
recurring job that would otherwise scan the whole collection.

### Query hygiene

- `.lean()` in 7 controllers where documents are read-only — skips Mongoose
  document hydration
- `.populate()` used with explicit field projections
  (`.populate('client', 'name email avatar')`) rather than pulling whole
  documents, avoiding N+1 without over-fetching
- `Promise.allSettled` for parallel independent aggregations, so one failing
  query degrades a single number rather than the whole response

---

## 4. Rate limiting

| Scope | Limit | Rationale |
|---|---|---|
| All `/api/*` | 100 req / 15 min per IP | Baseline abuse protection |
| `POST /ai-tutor/ask` | 10 req / min per IP | LLM calls cost money per request |

---

## 5. Front-end

### What is optimised

**Separate app bundles.** Three independent builds mean a public visitor never
downloads admin or teacher code — a structural win no amount of splitting within
a single app achieves as reliably.

**Lazy-loaded images.** 31 `<img>` elements across 15 files carry
`loading="lazy"`. Above-the-fold imagery is deliberately **excluded** — the
landing hero carousel and the page-top hero backgrounds on About, How It Works
and Services load eagerly, because lazy-loading the largest visible element
delays the very thing the user is waiting for.

**IntersectionObserver, not scroll handlers.** The site-wide scroll-reveal uses
`IntersectionObserver` with a `MutationObserver` to catch late-mounting content.
No scroll event listeners, no layout thrashing. Animations are gated behind
`prefers-reduced-motion` and animate only `opacity`/`transform`, which the
compositor handles without reflow.

**Hysteresis over re-render churn.** The reveal system uses different thresholds
for entering and leaving so elements near the viewport edge don't rapidly toggle
class state.

### What is not — the honest finding

**There is no route-level code splitting.** `apps/web/src/App.tsx` has
**60 static imports** and no `React.lazy` anywhere. Every page in the public
site, the student dashboard and the client dashboard ships in a single bundle,
downloaded and parsed before the landing page renders.

This is the largest unaddressed front-end performance issue in the project. A
visitor who bounces from the landing page has still paid to download the
classroom, the checkout flow, the markdown renderer and every dashboard screen.

It is also among the cheapest to fix — converting page imports to `React.lazy`
with a `<Suspense>` boundary is mechanical, and the router structure already
isolates pages cleanly.

---

## 6. Known bottlenecks, ranked

### 1. Cold starts — 24–32 s first byte
**Severity: critical.** Worse than any code-level inefficiency by an order of
magnitude. Mitigated but not solved: mobile timeouts were raised to 60 s so a
cold start reports as slowness rather than failure, and clients distinguish
timeout from connection error.

*Fix:* paid Render tier, or a scheduled keep-warm ping. Nothing in application
code will address this.

### 2. No route-level code splitting
**Severity: high, effort: low.** 60 eager imports in one bundle. See above.

### 3. Recordings served from the API process
**Severity: high at scale.** Video streams from `backend/uploads/recordings/`
through the Node process, consuming the same event loop and bandwidth that
serves API traffic. It also does not survive container replacement.

*Fix:* S3/GCS with signed URLs — solves durability, disk ceiling and bandwidth
together.

### 4. Warm latency ~1.0–1.3 s
**Severity: medium.** Round-trip-bound, not query-bound. A CDN or edge cache in
front of the public catalog endpoints would help more than any backend change,
since those payloads are identical for every visitor and change only on deploy.

### 5. Single-instance WebSocket signaling
**Severity: low today.** The participant map is in-process, so the signaling
server cannot scale horizontally. Not a bottleneck at current load; blocks growth
later. Requires a Redis pub/sub backplane.

### 6. Classroom mesh topology
**Severity: future.** When peer connections are implemented, a full mesh is
`n(n-1)/2` connections — fine up to ~6 participants, then it needs an SFU.
Worth knowing before the feature ships, not after.

---

## 7. Measuring it yourself

```bash
# API latency + payload size
curl -sS -o /dev/null \
  -w "time=%{time_total}s size=%{size_download}B http=%{http_code}\n" \
  https://ebringgs-backend.onrender.com/api/services

# Confirm edge compression
curl -sS -o /dev/null -D - -H "Accept-Encoding: gzip" \
  https://ebringgs-backend.onrender.com/api/tutoring | grep -i content-encoding

# Bundle size
pnpm --filter web build   # inspect apps/web/dist
```

> **Measure cold and warm separately.** The first request after an idle period is
> a cold start and will dominate any average that includes it. Discard it, or
> report it as its own figure — mixing the two produces a number that describes
> neither.

---

## 8. Deliberately not optimised

Places where the simple thing was kept on purpose:

- **No server-side caching beyond `/public/stats`.** Client-side caching already
  covers the read-heavy catalog endpoints, and a second cache layer means a
  second invalidation problem.
- **No CDN in front of the API.** Would help the public catalogs, but adds a
  cache-invalidation surface for endpoints that also serve authenticated,
  user-specific data.
- **No database read replicas.** Current load does not justify the operational
  cost or the eventual-consistency reasoning.
- **Uncompressed local uploads.** Recordings are stored as produced. Transcoding
  belongs with the move to object storage, not before it.
