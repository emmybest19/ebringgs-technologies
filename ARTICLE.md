---
title: "One Platform, Two Businesses, Four User Roles: What I Learned Shipping It"
published: false
description: "I merged a training academy and a software agency into one codebase instead of building two products. Here's the architecture, the trade-offs I accepted, and the four bugs that taught me the most."
tags: webdev, architecture, typescript, react
cover_image: ""
canonical_url: ""
---

Most of the bugs that cost me real time on this project were not hard problems. They were problems that **hid**.

A total API outage that rendered as an empty page. A backend that worked perfectly but got reported as broken. A logo fix that immediately exposed a contrast failure nobody knew existed. In every case the engineering went into *finding* the thing, not fixing it.

This is what I built, why I structured it the way I did, what I gave up, and what those failures taught me.

---

## The problem

E-Bringgs runs two businesses that most companies would keep apart:

1. **A training academy** — cohort-based programs in web development, mobile, UI/UX and data. Live classes, assignments, recordings, certificates, a points leaderboard.
2. **A software services agency** — productized packages a client buys outright, plus custom engagements that start as an inquiry and become a scoped quote.

The obvious move is two products. I rejected that for three reasons:

- **The audiences overlap.** A client who hires the agency often sends staff through the academy. A graduating student becomes a candidate the agency places. Two products means two customer records for one relationship.
- **One brand, one login.** Asking someone to hold two accounts for one company is a conversion tax on both sides.
- **Payments are the same problem twice.** Both sides bill in naira, both need installments, both need receipts and refunds. Building that machinery twice is the single largest source of duplicated effort.

So the actual problem was never "build a course site." It was:

> Can four user types with genuinely different jobs share one identity system, one payment engine and one operational backend — without the interfaces collapsing into a compromise that serves nobody?

---

## The architecture, and why

### Three front-ends, not one

```
e-bringgs/                  # pnpm workspace
├─ apps/
│  ├─ web/         public site + student + client dashboards
│  ├─ admin/       admin console
│  └─ teacher/     teacher console
└─ packages/
   api · auth · classroom · styles · types · ui
```

The reasoning is narrow and specific: **a prospective student loading the marketing site should never download the admin console.**

Route-level code splitting inside a single app helps, but nothing stops an admin-only dependency from landing in a shared chunk. Separate builds make it impossible by construction. Separate subdomains mean an admin session cannot leak into the public origin.

The cost is real — three build pipelines, three deploy targets, and any cross-cutting change touches three `package.json` files. The six shared packages exist to keep that cost bounded.

### One server, two protocols

The API is a single Node process hosting **both** Express on `/api/*` and a `ws` WebSocket server on `/ws`, sharing one port.

A live classroom needs signaling and REST in lockstep: the same JWT authorises both, session metadata lives in Mongo while offer/answer traffic flows over the socket. Splitting them would mean two deploy units, two TLS certs and a second auth path — to solve a scaling problem I don't have yet.

That's a deliberate bet with a known expiry date. The signaling server keeps its participant map in memory, so it cannot scale horizontally. When it needs to, that's a Redis pub/sub backplane. Not before.

---

## Trade-offs I accepted

Being explicit about these is the difference between an architecture and a pile of decisions:

| Decision | Bought | Cost |
|---|---|---|
| Three apps | Bundle isolation, origin isolation | Triplicated build config |
| WS on the API port | One deploy, one cert, one auth path | Signaling and REST scale together |
| Server-authoritative pricing | No client tampering, no total mismatches | A catalog to keep in sync |
| Raw `https` for payments | No SDK dependency or version treadmill | Hand-written request bodies |
| Free-tier hosting | Cost | Cold starts (more on this below) |
| **No test suite** | Iteration speed | **The one I regret** |

That last row is the honest one. Neither package has a test runner. Early on it was defensible — the domain was moving and tests would have been rewritten as fast as they were written. That justification has expired, and several bugs below would have been caught by a test before a human found them.

---

## Four things that broke

### 1. A total outage that looked like an empty product

The student dashboard reported *"Couldn't load tutoring programs."* The obvious read was a broken tutoring endpoint.

It wasn't. **Every** API call from that origin was failing. That page was just the only screen with an explicit error card — everywhere else, failed fetches fell back to empty arrays. So a complete outage rendered as a platform that looked *empty rather than broken*.

I probed the API with different `Origin` headers:

| Origin | Result |
|---|---|
| `https://www.ebringgs.com` | 200 |
| `https://ebringgs.com` | **500** |
| `http://localhost:5173` | **500** |

CORS whitelisted the exact strings from my env vars. Visitors arrive via both apex and `www`, but only one form was configured. Worse, the rejection path *threw* — which my global error handler turned into a 500, so routine cross-origin probes looked like server faults and buried the signal in the logs.

The fix expands every configured origin into both forms and rejects cleanly:

```ts
/** Expand an origin into its apex + www pair: https://x.com ⇄ https://www.x.com */
const withWwwVariants = (origin: string): string[] => {
  const m = origin.match(/^(https?:\/\/)(www\.)?(.+)$/);
  if (!m) return [origin];
  return [`${m[1]}${m[3]}`, `${m[1]}www.${m[3]}`];
};

const configuredOrigins = new Set(
  [process.env.CLIENT_URL, process.env.ADMIN_URL, process.env.TEACHER_URL]
    .filter((u): u is string => Boolean(u))
    .map(normaliseOrigin)
    .flatMap(withWwwVariants),
);

const allowedOrigin = (origin, cb) => {
  if (!origin) return cb(null, true);   // curl, health checks, server-to-server

  const isAllowed =
    configuredOrigins.has(normaliseOrigin(origin)) || isLocalhost(origin);

  // Disallowed origins get `false` (the browser blocks the response), NOT an
  // Error — throwing here turns every cross-origin probe into a logged 500.
  cb(null, isAllowed);
};
```

**Lesson: empty and failed must never render identically.** An empty state should mean *"there is nothing here."* If it can also mean *"I couldn't find out,"* it's lying to the user. Every list view needs three distinct states — loading, error, and genuinely empty.

### 2. Infrastructure latency reported as a bug

Mobile sign-up failed with:

```
the request took longer than expected 0:0:20.000000
```

Nothing was broken. My host spins containers down when idle, and the first request after a quiet period took **24 seconds** to boot and respond. The mobile HTTP client had a 20-second timeout. It manufactured a failure against a backend that was merely waking up.

The fix was two-part — raise the ceiling, and make the message honest:

```dart
_dio = Dio(BaseOptions(
  baseUrl: Env.apiUrl,
  // The free tier spins down after inactivity; the first request in a
  // session can block 30–60s while it wakes. Generous timeouts so a cold
  // start doesn't look like a failure.
  connectTimeout: const Duration(seconds: 60),
  receiveTimeout: const Duration(seconds: 60),
));

String _dioMessage(DioException err) {
  switch (err.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
      return 'The server is slow to respond. Check your connection and try again.';
    case DioExceptionType.connectionError:
      return "Can't reach the server. Check your internet and try again.";
    default:
      return err.message ?? 'Login failed';
  }
}
```

**Lesson: client timeouts encode an assumption about your infrastructure.** When the real worst case exceeds that assumption, the client invents failures. Know your cold-start cost, set timeouts above it, then treat reducing that cost as a separate problem.

### 3. Money, four ways, on one transaction

A checkout can combine loyalty points, a gift voucher, referral credit **and** a 2×/3× installment split. Order matters, each discount is capped by the remaining balance, and a failed payment must reverse all of it.

Three decisions kept this tractable.

**Price resolves server-side.** The client sends a `serviceId`, not an amount:

```ts
if (serviceId) {
  const service = getProductizedService(String(serviceId));
  if (!service?.price) {
    return next(new AppError('Service not found or not available.', 400));
  }
  basePriceKobo = service.price * 100;
}
```

Beyond tampering protection, this kills a whole bug class: the client and server can't disagree about the total, because only one of them has an opinion.

**Balances decrement atomically.** A read-then-write would be correct in testing and wrong in production:

```ts
// Atomic decrement so two parallel checkouts can't double-spend.
const updated = await User.findOneAndUpdate(
  { _id: userId, referralCreditNaira: { $gte: useNaira } },
  { $inc: { referralCreditNaira: -useNaira } },
  { new: true },
);
if (updated) {
  referralCreditApplied = useNaira;
  finalAmount -= useNaira * 100;
}
```

The guard lives in the query filter, so MongoDB enforces it. No transaction, no lock, no race.

**Settlement is idempotent.** Confirmation arrives twice — the client redirect *and* the provider's webhook — and either may land first:

```ts
async function ensureProjectForServicePurchase(args) {
  const existing = await Project.findOne({ paystackReference: args.reference });
  if (existing) return existing;      // whichever path arrived first won
  // ...create
}
```

**Lesson: anything reachable by two triggers must be idempotent, not merely fast enough that the race is unlikely.** "Unlikely" becomes "constant" with traffic.

### 4. Four clients disagreeing about the same data

Cohorts open and close with the clock. With three web apps and a mobile client each computing *"is this cohort still open?"*, they would drift — different timezone handling, different rounding, stale client clocks.

So no client computes it. The server does, and ships the answer:

```ts
export function deriveCohortStatus(c): CohortStatus {
  if (c.status) return c.status;             // manual admin override wins

  const now = Date.now();
  const start = new Date(c.startDate).getTime();
  const end = c.endDate ? new Date(c.endDate).getTime() : null;

  if (end !== null && now > end)        return 'ended';
  if (now >= start)                     return 'in_progress';
  if (!c.isEnrollmentOpen)              return 'closed';
  if (c.enrolledCount >= c.capacity)    return 'closed';
  return 'open';
}
```

Public controllers run this before responding. **Clients never re-derive.**

**Lesson: when multiple clients consume the same data, any logic they each implement is logic that can drift.** Compute it once, server-side, and ship the answer rather than the inputs.

---

## The one that surprised me most

My brand logo shipped as a JPG — a format with no alpha channel. The component had been compensating two ways: `mix-blend-mode: multiply` in light mode, and a white rounded card in dark mode. The blend only *simulates* transparency over white and breaks over any colour; the card was a visible white box on dark sidebars.

I recovered the alpha mathematically, un-mixing each pixel from white to reconstruct colour and opacity. Genuinely transparent PNG. Done.

Except with the white gone, the word "technologies" — near-black — **vanished entirely** on the dark footer. The white card had been hiding a contrast failure nobody knew existed.

**Lesson: a workaround is load-bearing until proven otherwise.** Removing one doesn't return you to a clean baseline. It returns you to the original problem *plus* whatever else the workaround was incidentally covering. I only caught it because I composited the result against the real footer colour before shipping, instead of eyeballing it in isolation.

---

## What I'd do differently

**Write the payment tests first.** Not all the tests — the payment ones. It's the subsystem with the most branches and the highest cost of failure, and it's the one I'm most nervous changing. That's exactly the signal that it needed tests.

**Instrument the empty states.** If a fetch fails and I render an empty array, I should at minimum log it. The CORS outage was invisible for as long as it was precisely because failure and emptiness were indistinguishable to me *and* to my logs.

**Measure the cold start before setting any timeout.** I picked 20 seconds because it felt generous. I never measured. It was 24.

---

## Takeaways

1. Empty and failed must never render identically.
2. Client timeouts encode infrastructure assumptions — measure before choosing one.
3. Make the default config the one that works for most people, not the one that works on your machine.
4. Anything reachable by two triggers must be idempotent.
5. Compute shared logic server-side; ship answers, not inputs.
6. Removing a workaround exposes what it was hiding. Verify in the real context.
7. "Tests later" is a loan. Repay it before the untested paths become the ones you're afraid to touch.

---

*The platform is live, and the codebase includes full architecture, API, performance and lessons-learned documentation. Happy to talk about any of these decisions — especially the ones you think I got wrong.*
