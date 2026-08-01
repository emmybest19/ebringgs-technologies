# Lessons Learnt

Real failures from building this platform, what caused them, and the principle
each one produced. Every entry is a bug that actually shipped and had to be
diagnosed — not a hypothetical.

The through-line, if there is one: **most of these were not hard problems. They
were problems that hid.** The engineering time went into finding them, not
fixing them.

---

## 1. A silent empty state is worse than an error screen

**What happened.** The student dashboard showed *"Couldn't load tutoring
programs."* The obvious read was a broken tutoring endpoint.

It was not. Every API call from that origin was failing. The tutoring page was
simply the only screen with an explicit error card — everywhere else, failed
fetches fell back to empty arrays. So a total API outage rendered as a platform
that looked **empty rather than broken**: no errors, no warnings, just a product
that appeared to have no data in it.

**Root cause.** CORS whitelisted the exact origin strings from environment
variables. Visitors arrive via both apex and `www`, but only one form was
configured:

| Origin | Result |
|---|---|
| `https://www.ebringgs.com` | 200 |
| `https://ebringgs.com` | 500 |
| `http://localhost:5173` | 500 |

Half the traffic had every request rejected. Worse, the rejection path *threw* an
Error, which the global handler converted to a 500 — so routine cross-origin
probes looked like server faults in the logs, burying the signal.

**Fixed by** expanding each configured origin into both apex and `www` forms,
allowing localhost in all environments (safe here — auth is Bearer-token, so
cross-origin requests carry no ambient cookie credentials), and rejecting cleanly
with `cb(null, false)` instead of throwing.

**Principle.** Empty and failed must never render identically. An empty state
should mean *"there is nothing here"* — if it can also mean *"I could not find
out,"* it is lying. Every list view needs three distinct states: loading, error,
and genuinely empty.

---

## 2. Infrastructure behaviour becomes a bug when the client is impatient

**What happened.** Mobile sign-up failed with *"the request took longer than
expected 0:0:20.000000."*

**Root cause.** Render's free tier spins containers down when idle. The first
request after a quiet period took **24 seconds** to boot and respond. The mobile
Dio client had a 20-second timeout. So every first sign-in of a session aborted —
against a backend that was working perfectly and simply waking up.

Nothing was broken. The client had an opinion about acceptable latency that the
infrastructure did not share.

**Fixed by** raising timeouts to 60 seconds, and having the client distinguish
`connectionTimeout` from `connectionError` in its messaging so "the server is
waking up" reads differently from "you have no internet."

**Principle.** Client timeouts encode an assumption about infrastructure. When
the platform's real worst case exceeds that assumption, the client manufactures
failures. Know your deployment's cold-start cost and set timeouts above it —
then treat reducing that cost as a separate problem.

---

## 3. A wrong default is worse than a missing one

**What happened.** Mobile registration appeared to succeed and wrote nothing.
Accounts silently did not exist.

**Root cause.** The mobile `.env` pointed at `http://10.0.2.2:5000/api` — the
Android emulator's alias for a local backend that was not running — while the web
app pointed at production. Two clients, two backends, one imaginary.

The code default was equally wrong: `dotenv.maybeGet('API_URL') ?? 'http://10.0.2.2:5000/api'`.
A missing config file degraded to *broken* rather than *working*.

**Fixed by** pointing both the `.env` and the code fallback at the shared
production API, and surfacing every auth error through both a toast and a
snackbar — because the original failure produced no visible output at all.

**Principle.** Defaults are used exactly when someone has not thought about the
setting. Make the fallback the one that works for the most people — production,
not localhost. A developer with a local backend will configure it; a new
contributor with no `.env` should get a working app, not a silent void.

---

## 4. Verify the state before assuming the change

**What happened.** After removing the hero carousel from the mobile landing
screen, it was still visible on device. Then newly added images did not appear.
Then a changed timeout constant had no effect.

**Root cause.** Flutter's asset bundle and compile-time constants are not
rebuilt by hot reload — or even hot restart. Three separate "the fix didn't work"
reports were one cause: a stale build.

**How it was resolved.** Rather than re-editing code that was already correct, a
scan confirmed the carousel widget did not exist anywhere in `lib/`. That
established the code was right and the *build* was wrong, pointing at
`flutter clean` instead of another round of edits.

**Principle.** When a change appears not to take effect, verify the current state
before making another change. "The fix didn't work" and "the fix isn't running"
demand opposite responses, and guessing wrong means editing correct code until it
becomes incorrect.

---

## 5. Fixing the workaround exposes what it was hiding

**What happened.** The brand logo shipped as a JPG — a format with no alpha
channel. The `Logo` component compensated two ways: `mix-blend-mode: multiply` in
light mode, and a white rounded card in dark mode. The blend only *simulates*
transparency over white and breaks over any colour; the card was a visible white
box on dark sidebars.

Alpha was recovered mathematically — un-mixing each pixel from white to
reconstruct colour and opacity — producing a genuinely transparent PNG.

**Then the real problem appeared.** With the white gone, the "technologies"
wordmark — near-black — became **invisible on the dark footer**. The white card
had been concealing a contrast failure nobody knew existed.

Compositing the result against the actual footer colour *before* shipping caught
it. The fix was a second artwork tone with that word recoloured, plus a
three-way `tone: 'auto' | 'light' | 'dark'` prop.

**Why three values, not a boolean.** A boolean covers "dark surface" and "follow
the theme." It cannot express the third case: the printable certificate renders
on a hardcoded white background regardless of theme, so an automatic dark-mode
swap would have produced a pale wordmark on white paper — a bug that would only
have surfaced when someone printed a certificate in dark mode.

**Principle.** A workaround is load-bearing until proven otherwise. Removing one
does not return you to a clean baseline — it returns you to the original problem
plus whatever else the workaround was incidentally covering. Verify the result in
the real context, not in isolation.

---

## 6. Enumerate the contexts before choosing the abstraction

**What happened.** Deactivating Google and Apple sign-in looked like one edit:
hide the component. Doing only that would have left an orphaned divider reading
*"OR PICK A ROLE TO SIGN UP WITH EMAIL"* floating above the role picker — copy
that only makes sense next to buttons that were no longer there.

**Fixed by** exporting the flag so consuming pages hide their dividers too, and
gating Apple's SDK loader on the same flag so the app stops fetching a CDN script
for a disabled feature.

**Principle.** A component's visual footprint is often larger than the component.
Before hiding, removing or restyling one, find every element that exists *because
of* it — dividers, headings, spacing, loaders — and handle them together. The
same instinct produced the three-value `tone` prop in the previous lesson: count
the contexts first, then pick the abstraction that covers them.

---

## 7. Push correctness to the layer that cannot be bypassed

**What happened.** Checkout stacks loyalty points, gift vouchers, referral credit
and 2×/3× installment splits. Order matters, every discount is capped by the
remaining balance, and a failed payment must reverse all of it.

**What kept it tractable.** Two decisions:

**Price resolves server-side.** `POST /paystack/initialize` looks up the amount
from a server catalog by `serviceId`. A client-supplied price is not trusted.
This is not only security — it removes an entire category of "the client and
server disagree about the total" bugs, because only one of them has an opinion.

**Balances decrement atomically.** Referral credit uses a conditional
`findOneAndUpdate` guarded on sufficient balance, so two parallel checkouts
cannot spend it twice. A read-then-write would have been correct in testing and
wrong in production.

**The same instinct produced the `deriveXxxStatus()` pattern** used across
several models: the server computes effective status from raw fields and the
current time before responding, and clients never re-derive. Four clients cannot
disagree about whether a cohort is open, because none of them decides.

**Principle.** When multiple clients consume the same data, any logic they each
implement is logic that can drift. Compute it once, server-side, and ship the
answer rather than the inputs.

---

## 8. Settlement must be idempotent when two paths can trigger it

**What happened.** Payment confirmation arrives twice: the client hits
`/verify/:reference` after redirect, and Paystack's webhook fires independently.
Either may arrive first, and both may arrive.

**Resolution.** Both call the same settlement function, and every step within it
is safe to repeat — marking the transaction, capturing the card authorisation,
creating the project for a service purchase, claiming the voucher, awarding
referral rewards. Project creation looks up an existing record by payment
reference before creating one, so whichever path arrives first wins and the other
is a no-op.

**Principle.** Any operation reachable by more than one trigger must be
idempotent, not merely fast enough that the race is unlikely. "Unlikely" scales
into "constant" with traffic.

---

## 9. Comments that state a derivation must stay true

**What happened.** A landing-page statistic was set to 40% with the comment
*"delivered / (delivered + in flight) = 4/10 = 40%"*. When the value was later
changed to 94%, that comment would have described a calculation that no longer
produced the number beside it.

Worse, the original formula was subtly wrong for its label. "Completion rate"
reads to a visitor as *reliability* — how often work gets finished. The formula
measured what fraction of the current pipeline happens to be done, which
**falls every time new business is won**. Signing three clients would have
*lowered* the advertised completion rate.

**Fixed by** rewriting the comment to state the value is standalone and not
derived from the numbers beside it, so nobody tries to reconcile the four figures
and "corrects" one to match.

**Principle.** A comment asserting a relationship between values is a claim that
can rot. Either keep it true, or remove it — a stale derivation is worse than no
comment, because it invites someone to act on it. And a metric's *name* is part
of its specification: if the label implies one thing and the formula computes
another, the formula is wrong regardless of its arithmetic.

---

## 10. The trade-off that is not paying off

Honest self-assessment: **no test suite exists.** Neither package has a test
runner configured. Correctness rests on TypeScript, Zod validation at the route
boundary, and manual verification.

Early on this was a defensible trade — the domain was still moving and tests
would have been rewritten as fast as they were written. That justification has
expired. The payment engine in particular now has enough branches — discount
stacking order, installment scheduling, webhook/verify idempotency,
refund-on-failure — that manual verification cannot cover them reliably, and it
is the subsystem where a bug costs actual money.

Several lessons above describe bugs that a test would have caught before a human
did. That is the argument, made by the project itself.

**Principle.** "We'll add tests later" is a loan. It is worth taking early, when
the design is unstable and the interest is low. It should be repaid before the
codebase reaches the point where the untested paths are the ones you are most
afraid to change.

---

## Summary

| # | Lesson |
|---|---|
| 1 | Empty and failed must never render identically |
| 2 | Client timeouts encode infrastructure assumptions — know your cold-start cost |
| 3 | Make the default the one that works, not the one that's local |
| 4 | Verify current state before making another change |
| 5 | Removing a workaround exposes what it was hiding — verify in real context |
| 6 | A component's visual footprint is larger than the component |
| 7 | Compute shared logic server-side; ship answers, not inputs |
| 8 | Anything reachable by two triggers must be idempotent |
| 9 | A comment stating a derivation is a claim that can rot |
| 10 | "Tests later" is a loan — repay it before the untested paths are the scary ones |
