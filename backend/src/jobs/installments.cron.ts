import cron from 'node-cron';
import crypto from 'crypto';
import PaymentPlan, { IPaymentPlan, IInstallment } from '../models/PaymentPlan.model';
import Transaction from '../models/Transaction.model';
import User from '../models/User.model';
import { chargeAuthorization } from '../services/paystackCharge.service';
import { sendEmail, emailTemplates } from '../utils/email';
import { sendPushToUser } from '../utils/pushNotification';
import {
  notifyPaymentDue, notifyPaymentFailed, notifyAccountSuspended,
} from '../services/whatsapp.service';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Resolve the user-facing URL where they can view this payment plan.
 * Lives at `/payments/plan/:id` for both clients and students — same route,
 * gated by their respective layouts.
 */
function planUrl(planId: string): string {
  return `${CLIENT_URL}/payments/plan/${planId}`;
}

/**
 * Installments daily cron — runs at 09:00 Africa/Lagos.
 *
 * Three sequential passes per run:
 *
 *   1. **Reminders** — Plans with the next installment due in T-3 days or T-0:
 *      hand off to Phase 5's notification module to email + push + WhatsApp.
 *
 *   2. **Auto-charge** — Plans with the next installment due today AND a
 *      saved `authorizationCode`: call Paystack's /transaction/charge_authorization.
 *      Outcomes:
 *        • Succeeded → write a Transaction, mark installment paid, advance plan
 *          to 'completed' if last installment; clear overdue/grace if any.
 *        • Failed    → bump attemptCount, set installment.status='failed',
 *          set plan.status='overdue' + gracePeriodEndsAt=now+7d.
 *
 *   3. **Grace advancement** — Plans where now > gracePeriodEndsAt: flip to
 *      'suspended'. The feature-access middleware (Phase 6) blocks access from
 *      this point until the user manually pays or admin extends the deadline.
 *
 * The cron is intentionally idempotent — re-running it on the same day is
 * safe. We dedup auto-charge attempts by checking installment.status before
 * issuing the Paystack call.
 *
 * Test/local: call `runInstallmentsCron()` directly from a one-off script —
 * the schedule is only registered when `startInstallmentsCron()` is called
 * (which happens once at server boot via `jobs/index.ts`).
 */

const GRACE_PERIOD_DAYS = 7;
const REMINDER_LEAD_DAYS = 3;

/* ─── Date helpers ───────────────────────────────────────────────────── */

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

/** Generate a unique Paystack reference for an auto-charge attempt. */
function generateReference(planId: string, installmentNumber: number): string {
  // 12 hex chars = 48 bits of randomness — collisions are astronomical at our scale.
  const random = crypto.randomBytes(6).toString('hex');
  return `installment_${planId}_${installmentNumber}_${random}`;
}

/* ─── Reminder pass ──────────────────────────────────────────────────── */

/**
 * Find plans whose next-unpaid installment falls due in T-3 days (gentle
 * heads-up) or T-0 (today's auto-charge — informational). The actual sending
 * lives in `notifications.service.ts` (Phase 5); for now this just collects
 * + logs the targets so the rest of the cron flow is wired.
 */
async function runReminderPass(): Promise<{ count: number }> {
  const today = startOfDay(new Date());
  const t3Start = startOfDay(daysFromNow(REMINDER_LEAD_DAYS));
  const t3End = endOfDay(daysFromNow(REMINDER_LEAD_DAYS));
  const todayEnd = endOfDay(today);

  const plans = await PaymentPlan.find({
    status: { $in: ['active', 'overdue'] },
    'installments': {
      $elemMatch: {
        status: { $in: ['pending', 'failed'] },
        dueDate: { $gte: today, $lte: t3End },
      },
    },
  });

  let count = 0;
  for (const plan of plans) {
    const next = plan.installments.find((i: IInstallment) => i.status === 'pending' || i.status === 'failed');
    if (!next) continue;
    const due = startOfDay(next.dueDate);
    const isT3 = due.getTime() === t3Start.getTime();
    const isToday = due.getTime() >= today.getTime() && due.getTime() <= todayEnd.getTime();
    if (!isT3 && !isToday) continue;

    const leadDays = isToday ? 0 : REMINDER_LEAD_DAYS;
    const amountNaira = Math.round(next.amount / 100);
    const url = planUrl(plan._id.toString());

    // Fire-and-forget across channels — none is critical enough to block the cron.
    const user = await User.findById(plan.user).select('email name phone whatsappOptIn');
    if (user) {
      const tpl = emailTemplates.paymentReminder({
        name: user.name, amountNaira, dueDate: next.dueDate,
        planDescription: plan.description, planUrl: url, leadDays,
      });
      sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html })
        .catch((err) => console.error('[installments] reminder email failed:', err));

      sendPushToUser(user._id.toString(), {
        title: `Installment ${isToday ? 'due today' : `due in ${REMINDER_LEAD_DAYS} days`}`,
        body: `₦${amountNaira.toLocaleString()} for ${plan.description}`,
        url,
        tag: 'installment-reminder',
      }).catch(() => {});

      if (user.phone && user.whatsappOptIn !== false) {
        notifyPaymentDue(user.phone, amountNaira, next.dueDate, plan.description, url, leadDays)
          .catch(() => {});
      }
    }

    console.log(`[installments] reminder sent for plan ${plan._id} (${isT3 ? 'T-3' : 'today'}, ₦${amountNaira})`);
    count += 1;
  }

  return { count };
}

/* ─── Auto-charge pass ──────────────────────────────────────────────── */

async function chargePlanInstallment(plan: IPaymentPlan, installmentIndex: number): Promise<void> {
  const installment = plan.installments[installmentIndex];
  if (!installment) return;
  if (installment.status === 'paid' || installment.status === 'manual') return;
  if (!plan.authorizationCode) {
    console.warn(`[installments] plan ${plan._id} has no authorization code — cannot auto-charge`);
    return;
  }

  // Fetch the user's current email — auth code is bound to the email at
  // capture time, but we re-look up in case it's changed.
  const user = await User.findById(plan.user).select('email name');
  if (!user) {
    console.warn(`[installments] user ${plan.user} for plan ${plan._id} not found`);
    return;
  }

  const reference = generateReference(plan._id.toString(), installmentIndex + 1);

  installment.attemptCount += 1;

  let result;
  try {
    result = await chargeAuthorization({
      authorizationCode: plan.authorizationCode,
      email: user.email,
      amount: installment.amount,
      reference,
      metadata: {
        userId: user._id.toString(),
        paymentPlanId: plan._id.toString(),
        installmentNumber: installmentIndex + 1,
        description: plan.description,
        purchaseType: plan.linkedKind,
      },
    });
  } catch (err) {
    // Network failure — log and bail. Don't mutate the plan; next cron tick retries.
    console.error(`[installments] network error charging plan ${plan._id} inst ${installmentIndex + 1}:`, err);
    return;
  }

  if (result.succeeded) {
    // Write the Transaction row — keeps the user's payment history intact.
    await Transaction.create({
      user: plan.user,
      stripePaymentIntentId: reference,
      amount: installment.amount,
      currency: 'ngn',
      status: 'succeeded',
      type: 'installment',
      description: `${plan.description} (${installmentIndex + 1} of ${plan.installments.length})`,
      metadata: { provider: 'paystack', source: 'cron-auto-charge' },
      paymentPlanId: plan._id,
      installmentNumber: installmentIndex + 1,
    }).catch((err) => console.error('[installments] tx create failed:', err));

    installment.status = 'paid';
    installment.paidAt = new Date();
    installment.lastChargeMessage = result.message;

    // Recompute plan status — completed if every installment is paid.
    const allPaid = plan.installments.every((i: IInstallment) => i.status === 'paid' || i.status === 'manual');
    if (allPaid) {
      plan.status = 'completed';
      plan.completedAt = new Date();
      plan.gracePeriodEndsAt = undefined;
      plan.suspendedAt = undefined;
    } else if (plan.status === 'overdue' || plan.status === 'suspended') {
      // Late payment cleared — plan is healthy again.
      plan.status = 'active';
      plan.gracePeriodEndsAt = undefined;
      plan.suspendedAt = undefined;
    }

    console.log(`[installments] charged plan ${plan._id} inst ${installmentIndex + 1} (₦${installment.amount / 100})`);

    // Push-only on routine success — don't spam email/WhatsApp for expected
    // auto-charges. If the plan just *completed*, send a celebratory push.
    const remaining = plan.installments.length - installmentIndex - 1;
    const amountNaira = Math.round(installment.amount / 100);
    sendPushToUser(plan.user.toString(), {
      title: plan.status === 'completed' ? 'Plan paid off — thank you!' : `Installment ${installmentIndex + 1} paid`,
      body: plan.status === 'completed'
        ? `${plan.description} is now fully paid.`
        : `₦${amountNaira.toLocaleString()} charged. ${remaining} installment${remaining === 1 ? '' : 's'} left.`,
      url: planUrl(plan._id.toString()),
      tag: 'installment-paid',
    }).catch(() => {});

    // If access was previously suspended and is now restored, send the dedicated email too.
    if (plan.status === 'active' || plan.status === 'completed') {
      // Only fire restoration email if we just came out of suspension/overdue.
      // The status change happened a few lines above; check via lastChargeMessage proxy.
      // (We've cleared gracePeriodEndsAt/suspendedAt above when allPaid OR was overdue/suspended.)
    }
  } else {
    installment.status = 'failed';
    installment.lastChargeMessage = result.message.slice(0, 200);

    // Start the 7-day grace clock if this is the first failure. If we're
    // already inside grace, leave the existing deadline (no double clocks).
    if (plan.status !== 'overdue' && plan.status !== 'suspended') {
      plan.status = 'overdue';
      plan.gracePeriodEndsAt = daysFromNow(GRACE_PERIOD_DAYS);
    }

    console.warn(`[installments] charge failed for plan ${plan._id} inst ${installmentIndex + 1}: ${result.message}`);

    // Notify across all 3 channels — this is the one event we genuinely want
    // to reach the user. Manual pay link goes to the plan page where they can
    // retry with a fresh card or different account.
    const amountNaira = Math.round(installment.amount / 100);
    const url = planUrl(plan._id.toString());
    const tpl = emailTemplates.paymentFailed({
      name: user.name, amountNaira, planDescription: plan.description,
      retryUrl: url, gracePeriodDays: GRACE_PERIOD_DAYS,
    });
    sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html })
      .catch((err) => console.error('[installments] failure email failed:', err));

    sendPushToUser(user._id.toString(), {
      title: 'Payment failed',
      body: `We couldn't charge ₦${amountNaira.toLocaleString()} for ${plan.description}. Tap to pay manually.`,
      url,
      tag: 'installment-failed',
    }).catch(() => {});

    if (user.phone && (user as { whatsappOptIn?: boolean }).whatsappOptIn !== false) {
      notifyPaymentFailed(user.phone, amountNaira, plan.description, url, GRACE_PERIOD_DAYS)
        .catch(() => {});
    }
  }

  await plan.save();
}

async function runAutoChargePass(): Promise<{ attempts: number; succeeded: number }> {
  const today = endOfDay(new Date());

  // Plans with any unpaid installment due on or before today.
  const plans = await PaymentPlan.find({
    status: { $in: ['active', 'overdue'] },
    authorizationCode: { $exists: true, $ne: null },
    'installments': {
      $elemMatch: {
        status: { $in: ['pending', 'failed'] },
        dueDate: { $lte: today },
      },
    },
  });

  let attempts = 0;
  let succeeded = 0;
  for (const plan of plans) {
    const idx = plan.installments.findIndex((i: IInstallment) =>
      (i.status === 'pending' || i.status === 'failed') &&
      startOfDay(i.dueDate).getTime() <= today.getTime(),
    );
    if (idx < 0) continue;
    attempts += 1;
    const before = plan.installments[idx].status;
    await chargePlanInstallment(plan, idx);
    if (plan.installments[idx].status === 'paid' && before !== 'paid') {
      succeeded += 1;
    }
  }

  return { attempts, succeeded };
}

/* ─── Grace-period advancement pass ──────────────────────────────────── */

async function runGracePass(): Promise<{ suspended: number }> {
  const now = new Date();
  const plans = await PaymentPlan.find({
    status: 'overdue',
    gracePeriodEndsAt: { $exists: true, $lt: now },
  });

  let suspended = 0;
  for (const plan of plans) {
    plan.status = 'suspended';
    plan.suspendedAt = new Date();
    await plan.save();
    suspended += 1;

    console.warn(`[installments] suspended plan ${plan._id} for user ${plan.user} — grace expired`);

    // Notify user that access is now blocked + how to restore.
    const user = await User.findById(plan.user).select('email name phone whatsappOptIn');
    if (!user) continue;
    const next = plan.installments.find((i: IInstallment) => i.status === 'pending' || i.status === 'failed');
    const amountNaira = next ? Math.round(next.amount / 100) : Math.round(plan.totalAmount / 100);
    const url = planUrl(plan._id.toString());
    const tpl = emailTemplates.accountSuspended({
      name: user.name, amountNaira, planDescription: plan.description, payUrl: url,
    });
    sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html })
      .catch((err) => console.error('[installments] suspension email failed:', err));

    sendPushToUser(user._id.toString(), {
      title: 'Access paused',
      body: `Settle ₦${amountNaira.toLocaleString()} to restore access to ${plan.description}.`,
      url,
      tag: 'installment-suspended',
    }).catch(() => {});

    if (user.phone && user.whatsappOptIn !== false) {
      notifyAccountSuspended(user.phone, amountNaira, plan.description, url).catch(() => {});
    }
  }

  return { suspended };
}

/* ─── Public entry points ────────────────────────────────────────────── */

/**
 * Run all three passes once. Exposed for manual invocation (test scripts,
 * admin "rerun now" buttons, post-deploy smoke tests). The scheduled job
 * just calls this on its cron tick.
 */
export async function runInstallmentsCron(): Promise<void> {
  const start = Date.now();
  console.log('[installments] cron tick begin');
  try {
    const reminders = await runReminderPass();
    const charges = await runAutoChargePass();
    const grace = await runGracePass();
    const elapsedMs = Date.now() - start;
    if (reminders.count + charges.attempts + grace.suspended === 0) {
      console.log(`[installments] nothing due (${elapsedMs}ms)`);
    } else {
      console.log(
        `[installments] done in ${elapsedMs}ms — ${reminders.count} reminders, ` +
        `${charges.succeeded}/${charges.attempts} charges succeeded, ` +
        `${grace.suspended} plan(s) suspended`,
      );
    }
  } catch (err) {
    console.error('[installments] cron failed:', err);
  }
}

let scheduledTask: ReturnType<typeof cron.schedule> | undefined;

/**
 * Register the daily cron. Call once at boot from `jobs/index.ts`.
 * Schedule: 09:00 Africa/Lagos every day (UTC+1, no DST).
 *
 * If called twice (e.g. in tests), the previous schedule is destroyed first.
 */
export function startInstallmentsCron(): void {
  if (scheduledTask) scheduledTask.stop();
  // node-cron pattern: 'minute hour * * *' — 0 9 * * * is 09:00 every day.
  scheduledTask = cron.schedule('0 9 * * *', () => { void runInstallmentsCron(); }, {
    timezone: 'Africa/Lagos',
  });
  console.log('[installments] scheduled daily at 09:00 Africa/Lagos');
}

/** For tests + graceful shutdown. */
export function stopInstallmentsCron(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = undefined;
  }
}
