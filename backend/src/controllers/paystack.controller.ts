import { Request, Response, NextFunction } from 'express';
import https from 'https';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import Transaction from '../models/Transaction.model';
import Project from '../models/Project.model';
import User from '../models/User.model';
import PaymentPlan from '../models/PaymentPlan.model';
import { AppError } from '../middleware/error.middleware';
import { awardPoints, redeemPoints, pointsToNaira } from '../services/points.service';
import Voucher from '../models/Voucher.model';
import { claimVoucher, refundVoucher } from './voucher.controller';
import { getProductizedService, isServiceInstallmentEligible, INSTALLMENT_PRICE_FLOOR_NGN } from '../config/services.catalog';
import { sendPushToRole, sendPushToUser } from '../utils/pushNotification';
import { notifyServicePurchase } from '../services/whatsapp.service';

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY!;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function paystackRequest(
  method: string,
  path: string,
  data?: Record<string, unknown>,
): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : undefined;
    const options: https.RequestOptions = {
      hostname: 'api.paystack.co',
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET()}`,
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode ?? 500, body: JSON.parse(raw) });
        } catch {
          reject(new Error('Invalid JSON from Paystack'));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/* ─── Authorization-code capture (for installment auto-charging) ─────── */

/**
 * Paystack returns the card authorization on every successful charge. This
 * helper extracts the fields we need for future `/transaction/charge_authorization`
 * calls. Both the verify-endpoint response and the webhook `charge.success`
 * event have the same `data.authorization` shape, so one helper covers both.
 */
interface PaystackAuthorization {
  authorizationCode?: string;
  cardLast4?: string;
  cardBrand?: string;
  paystackCustomerCode?: string;
}

function extractAuthorization(data: Record<string, unknown>): PaystackAuthorization {
  const auth = data?.authorization as { authorization_code?: string; last4?: string; brand?: string; card_type?: string } | undefined;
  const customer = data?.customer as { customer_code?: string } | undefined;
  return {
    authorizationCode: auth?.authorization_code,
    cardLast4: auth?.last4,
    cardBrand: auth?.brand || auth?.card_type,
    paystackCustomerCode: customer?.customer_code,
  };
}

/**
 * Save the captured authorization onto the linked PaymentPlan (if any) and
 * mark the installment as paid. Called after a successful charge for both the
 * verify endpoint and the webhook — idempotent, so safe if both fire.
 *
 * Returns the plan id if a plan was found and updated, so callers can surface
 * it in their responses.
 */
async function saveAuthorizationToPlan(args: {
  reference: string;
  paymentPlanId?: string;
  installmentNumber?: number;
  paystackData: Record<string, unknown>;
}): Promise<string | undefined> {
  if (!args.paymentPlanId || !args.installmentNumber) return undefined;

  const auth = extractAuthorization(args.paystackData);
  const plan = await PaymentPlan.findById(args.paymentPlanId);
  if (!plan) return undefined;

  // Capture auth on installment 1 (only time the card sheet was shown).
  // Subsequent installments are charged via the saved auth, not a fresh card.
  if (args.installmentNumber === 1 && auth.authorizationCode) {
    plan.authorizationCode = auth.authorizationCode;
    plan.cardLast4 = auth.cardLast4;
    plan.cardBrand = auth.cardBrand;
    plan.paystackCustomerCode = auth.paystackCustomerCode;
  }

  const installment = plan.installments[args.installmentNumber - 1];
  if (installment && installment.status !== 'paid') {
    installment.status = 'paid';
    installment.paidAt = new Date();
    // Link the just-created Transaction onto the installment for traceability.
    const tx = await Transaction.findOne({ stripePaymentIntentId: args.reference }).select('_id');
    if (tx) installment.transactionId = tx._id as mongoose.Types.ObjectId;
  }

  // Recompute plan status: completed if every installment is paid.
  const allPaid = plan.installments.every((i) => i.status === 'paid');
  if (allPaid) {
    plan.status = 'completed';
    plan.completedAt = new Date();
    plan.gracePeriodEndsAt = undefined;
  } else if (plan.status === 'overdue' || plan.status === 'suspended') {
    // A late installment paid → back to active.
    plan.status = 'active';
    plan.gracePeriodEndsAt = undefined;
  }

  await plan.save();
  return plan._id.toString();
}

// Initialize a transaction
export const initializeTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      amount,
      description: rawDescription,
      projectId,
      serviceId,
      planId,                  // for training plan purchases — string id like 'frontend-cohort'
      callbackUrl,
      pointsToRedeem,
      voucherCode,
      referralCreditToUseNaira, // client-only: spend referral credit as discount
      installments,            // 1 | 2 | 3 — defaults to 1 (no plan created)
      autoChargeConsent,       // required true when installments > 1
    } = req.body;

    // Look up the auth'd user — email is taken from the user record, never the body.
    const authUser = await User.findById(req.user!.userId).select('email name');
    if (!authUser) return next(new AppError('User not found.', 401));
    const email = authUser.email;

    /* ── Resolve the price server-side ──────────────────────────────────── */
    let basePriceKobo: number;
    let description: string;
    let purchaseType: 'service' | 'plan' | 'project' = 'project';

    if (serviceId) {
      const service = getProductizedService(String(serviceId));
      if (!service || !service.price) {
        return next(new AppError('Service not found or not available for purchase.', 400));
      }
      basePriceKobo = service.price * 100;
      description = `${service.title} — service purchase`;
      purchaseType = 'service';
    } else if (rawDescription && amount) {
      // Legacy path — training plans + project quotes still send their own amount.
      // TODO: migrate training plans to a server-side catalog too.
      basePriceKobo = Math.round(Number(amount));
      description = String(rawDescription);
      purchaseType = projectId ? 'project' : 'plan';
    } else {
      return next(new AppError('serviceId or (amount + description) is required.', 400));
    }

    /* ── Installment validation (before destructive discount logic) ──────── */
    const installmentCount = Math.max(1, Math.min(3, Math.floor(Number(installments) || 1)));
    const isInstallmentFlow = installmentCount > 1;

    if (isInstallmentFlow) {
      if (!autoChargeConsent) {
        return next(new AppError(
          'Auto-charge consent is required for installment payments. Tick the consent box at checkout.',
          400,
        ));
      }
      // Eligibility — services use the catalog flag; plans/projects use the price floor.
      if (purchaseType === 'service' && serviceId) {
        const svc = getProductizedService(String(serviceId));
        if (!svc || !isServiceInstallmentEligible(svc)) {
          return next(new AppError('This service is not eligible for installment payments.', 400));
        }
      } else if (basePriceKobo < INSTALLMENT_PRICE_FLOOR_NGN * 100) {
        return next(new AppError(
          `Installment payments are only available for items above ₦${INSTALLMENT_PRICE_FLOOR_NGN.toLocaleString()}.`,
          400,
        ));
      }
    }

    let finalAmount = basePriceKobo;
    let pointsRedeemed = 0;
    let appliedVoucherCode: string | undefined;
    let referralCreditAppliedNaira = 0;

    /* ── Apply points discount (own balance) ────────────────────────────── */
    if (pointsToRedeem && Number(pointsToRedeem) > 0) {
      const userPoints = await User.findById(req.user!.userId).select('points');
      const requested = Math.floor(Number(pointsToRedeem));
      const usable = Math.min(requested, userPoints?.points ?? 0);

      const discountKobo = pointsToNaira(usable) * 100;
      const cappedDiscount = Math.min(discountKobo, finalAmount);
      const cappedPoints = Math.floor(cappedDiscount / 100 / 100);

      if (cappedPoints > 0) {
        const redeemed = await redeemPoints(
          req.user!.userId,
          cappedPoints,
          undefined,
          `Discount on ${description}`,
        );
        pointsRedeemed = redeemed;
        finalAmount = finalAmount - (redeemed * 100 * 100);
      }
    }

    /* ── Apply gift voucher (separate from own points) ──────────────────── */
    if (voucherCode && typeof voucherCode === 'string') {
      const code = voucherCode.trim().toUpperCase();
      const voucher = await Voucher.findOne({ code });

      if (!voucher) return next(new AppError('Invalid voucher code.', 400));
      if (voucher.status !== 'active') return next(new AppError(`Voucher is ${voucher.status}.`, 400));
      if (voucher.expiresAt && voucher.expiresAt < new Date()) return next(new AppError('Voucher has expired.', 400));
      if (voucher.creator.toString() === req.user!.userId) return next(new AppError('You cannot redeem your own voucher.', 400));

      const voucherDiscountKobo = voucher.nairaValue * 100;
      const voucherCappedKobo = Math.min(voucherDiscountKobo, finalAmount);
      finalAmount -= voucherCappedKobo;
      appliedVoucherCode = code;
      // Voucher is fully claimed only on successful payment (verify endpoint / webhook)
    }

    /* ── Apply client referral credit (own balance, naira) ──────────────── */
    if (referralCreditToUseNaira && Number(referralCreditToUseNaira) > 0) {
      const creditUser = await User.findById(req.user!.userId).select('referralCreditNaira role');
      if (creditUser && creditUser.role === 'client' && (creditUser.referralCreditNaira ?? 0) > 0) {
        const requested = Math.floor(Number(referralCreditToUseNaira));
        const available = creditUser.referralCreditNaira;
        // Cap at: requested, available, and the remaining bill (in naira).
        const remainingBillNaira = Math.floor(finalAmount / 100);
        const useNaira = Math.max(0, Math.min(requested, available, remainingBillNaira));
        if (useNaira > 0) {
          // Atomic decrement so two parallel checkouts can't double-spend.
          const updated = await User.findOneAndUpdate(
            { _id: req.user!.userId, referralCreditNaira: { $gte: useNaira } },
            { $inc: { referralCreditNaira: -useNaira } },
            { new: true, projection: { referralCreditNaira: 1 } },
          );
          if (updated) {
            referralCreditAppliedNaira = useNaira;
            finalAmount -= useNaira * 100;
          }
        }
      }
    }

    if (finalAmount < 100) {
      return next(new AppError('Final amount after discount is too low.', 400));
    }

    /* ── Compute the charge for THIS transaction + schedule remaining ────── */
    // For 1× this is just `finalAmount`. For 2×/3× we split the basePriceKobo
    // evenly across N installments, and apply the entire discount (voucher +
    // points) to installment 1 — keeps the math intuitive for the user.
    // Math: sum(installments) == basePriceKobo - totalDiscount == finalAmount.
    const totalDiscountKobo = basePriceKobo - finalAmount;
    const perInstallmentKobo = Math.round(basePriceKobo / installmentCount);
    const chargeNowKobo = isInstallmentFlow
      ? Math.max(100, perInstallmentKobo - totalDiscountKobo)
      : finalAmount;

    /* ── Create the PaymentPlan when splitting ──────────────────────────── */
    let paymentPlan: import('../models/PaymentPlan.model').IPaymentPlan | null = null;
    if (isInstallmentFlow) {
      const now = Date.now();
      const installmentDocs = Array.from({ length: installmentCount }, (_, i) => ({
        amount: i === 0 ? chargeNowKobo : perInstallmentKobo,
        dueDate: new Date(now + i * 30 * 24 * 60 * 60 * 1000),
        status: 'pending' as const,
        attemptCount: 0,
      }));

      // Derive linkedKind + the matching id field. Exactly one is set.
      const linkedKind: import('../models/PaymentPlan.model').LinkedKind =
        purchaseType === 'service' ? 'service'
        : purchaseType === 'project' ? 'project'
        : 'plan';

      paymentPlan = await PaymentPlan.create({
        user: req.user!.userId,
        linkedKind,
        linkedServiceId: purchaseType === 'service' ? String(serviceId) : undefined,
        linkedPlanId: purchaseType === 'plan' ? (planId ? String(planId) : undefined) : undefined,
        linkedProject: purchaseType === 'project' && projectId ? new mongoose.Types.ObjectId(String(projectId)) : undefined,
        description,
        totalAmount: finalAmount,
        installments: installmentDocs,
        status: 'active',
        autoChargeConsent: true,
      });
    }

    const { statusCode, body } = await paystackRequest('POST', '/transaction/initialize', {
      amount: chargeNowKobo,
      email,
      callback_url: callbackUrl || `${CLIENT_URL}/payment/success`,
      metadata: {
        userId: req.user!.userId,
        description,
        projectId: projectId || '',
        serviceId: serviceId || '',
        planId: purchaseType === 'plan' && planId ? String(planId) : '',
        purchaseType,
        basePriceKobo,
        pointsRedeemed,
        voucherCode: appliedVoucherCode,
        referralCreditAppliedNaira,
        // Installment metadata — verify + webhook use these to mark the right
        // installment paid + capture the card authorization onto the plan.
        paymentPlanId: paymentPlan?._id?.toString(),
        installmentNumber: isInstallmentFlow ? 1 : undefined,
      },
    });

    if (statusCode !== 200 || !body.status) {
      // Roll back the draft plan if Paystack init failed — otherwise we'd
      // have an orphaned PaymentPlan with no Transaction.
      if (paymentPlan) {
        await PaymentPlan.findByIdAndDelete(paymentPlan._id).catch(() => {});
      }
      return next(new AppError((body.message as string) || 'Paystack initialization failed.', 400));
    }

    // Create pending transaction
    const txData = body.data as { reference: string; authorization_url: string; access_code: string };
    await Transaction.create({
      user: req.user!.userId,
      stripePaymentIntentId: txData.reference, // reuse field for paystack ref
      amount: chargeNowKobo,
      currency: 'ngn',
      status: 'pending',
      type: isInstallmentFlow ? 'installment' : 'one_time',
      description: isInstallmentFlow ? `${description} (1 of ${installmentCount})` : description,
      metadata: {
        projectId: projectId || '',
        serviceId: serviceId || '',
        planId: purchaseType === 'plan' && planId ? String(planId) : '',
        purchaseType,
        provider: 'paystack',
      },
      paymentPlanId: paymentPlan?._id,
      installmentNumber: isInstallmentFlow ? 1 : undefined,
    });

    res.json({
      status: 'success',
      data: {
        authorizationUrl: txData.authorization_url,
        accessCode: txData.access_code,
        reference: txData.reference,
        paymentPlanId: paymentPlan?._id?.toString(),
        installmentCount,
      },
    });
  } catch (err) { next(err); }
};

// Verify a transaction
export const verifyTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reference } = req.params;
    if (!reference) return next(new AppError('Reference is required.', 400));

    const { statusCode, body } = await paystackRequest('GET', `/transaction/verify/${reference}`);

    if (statusCode !== 200 || !body.status) {
      return next(new AppError('Verification failed.', 400));
    }

    const txPaystack = body.data as {
      status: string;
      authorization?: Record<string, unknown>;
      customer?: Record<string, unknown>;
      metadata?: {
        projectId?: string;
        serviceId?: string;
        purchaseType?: string;
        userId?: string;
        pointsRedeemed?: number;
        voucherCode?: string;
        basePriceKobo?: number;
        referralCreditAppliedNaira?: number;
        paymentPlanId?: string;
        installmentNumber?: number;
      };
    };
    const newStatus = txPaystack.status === 'success' ? 'succeeded' : 'failed';

    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: reference },
      { status: newStatus },
    );

    let createdProjectId: string | undefined;
    let updatedPaymentPlanId: string | undefined;

    // Save the captured card authorization onto the linked PaymentPlan (if any)
    // and mark the installment as paid. No-op for one-time payments.
    if (newStatus === 'succeeded') {
      updatedPaymentPlanId = await saveAuthorizationToPlan({
        reference,
        paymentPlanId: txPaystack.metadata?.paymentPlanId,
        installmentNumber: txPaystack.metadata?.installmentNumber,
        paystackData: body.data as Record<string, unknown>,
      });
    }

    // If linked to a project, mark as paid
    if (newStatus === 'succeeded' && txPaystack.metadata?.projectId) {
      await Project.findByIdAndUpdate(txPaystack.metadata.projectId, {
        isPaid: true,
        paystackReference: reference,
      });
    }

    // Auto-create a Project for productized service purchases
    if (newStatus === 'succeeded' && txPaystack.metadata?.purchaseType === 'service' && txPaystack.metadata?.serviceId && txPaystack.metadata?.userId) {
      const project = await ensureProjectForServicePurchase({
        userId: txPaystack.metadata.userId,
        serviceId: txPaystack.metadata.serviceId,
        reference,
        basePriceKobo: txPaystack.metadata.basePriceKobo,
      });
      if (project) createdProjectId = project._id.toString();
    }

    // Claim voucher on success
    if (newStatus === 'succeeded' && txPaystack.metadata?.voucherCode && txPaystack.metadata?.userId) {
      await claimVoucher(txPaystack.metadata.voucherCode, txPaystack.metadata.userId, reference)
        .catch((err) => console.error('[voucher] claim failed:', err));
    }

    // Award referral commission once per referred user's first successful payment
    if (newStatus === 'succeeded' && txPaystack.metadata?.userId) {
      await rewardReferrerOnFirstPayment(txPaystack.metadata.userId, reference).catch((err) =>
        console.error('[points] referral reward failed:', err),
      );
      await creditReferrerOnClientFirstPayment(txPaystack.metadata.userId, reference).catch((err) =>
        console.error('[referral] client credit award failed:', err),
      );
    }

    // On failure: refund redeemed points and unclaim voucher
    if (newStatus === 'failed' && txPaystack.metadata?.userId) {
      const refund = Number(txPaystack.metadata.pointsRedeemed || 0);
      if (refund > 0) {
        await awardPoints({
          userId: txPaystack.metadata.userId,
          reason: 'admin_adjustment',
          amount: refund,
          referenceId: `refund:${reference}`,
          note: 'Refund of redeemed points (payment failed)',
        }).catch(() => {});
      }
      if (txPaystack.metadata?.voucherCode) {
        await refundVoucher(txPaystack.metadata.voucherCode).catch(() => {});
      }
      const creditRefund = Number(txPaystack.metadata.referralCreditAppliedNaira || 0);
      if (creditRefund > 0) {
        await User.findByIdAndUpdate(txPaystack.metadata.userId, {
          $inc: { referralCreditNaira: creditRefund },
        }).catch(() => {});
      }
    }

    res.json({
      status: 'success',
      data: {
        paymentStatus: newStatus,
        projectId: createdProjectId,
        purchaseType: txPaystack.metadata?.purchaseType,
        paymentPlanId: updatedPaymentPlanId,
      },
    });
  } catch (err) { next(err); }
};

/**
 * Idempotently create (or look up) the Project record for a productized
 * service purchase. Called from both the verify endpoint and the webhook so
 * whichever arrives first creates the project; the other becomes a no-op.
 */
async function ensureProjectForServicePurchase(args: {
  userId: string;
  serviceId: string;
  reference: string;
  basePriceKobo?: number;
}) {
  const existing = await Project.findOne({ paystackReference: args.reference });
  if (existing) return existing;

  const service = getProductizedService(args.serviceId);
  if (!service) {
    console.error(`[project] service ${args.serviceId} not found in catalog (ref ${args.reference})`);
    return null;
  }

  const project = await Project.create({
    client: args.userId,
    serviceId: service.id,
    serviceName: service.title,
    title: service.title,
    description: service.description,
    status: 'awaiting_brief',
    totalCost: args.basePriceKobo ?? (service.price ?? 0) * 100,
    isPaid: true,
    paystackReference: args.reference,
    source: 'self_serve',
  });

  // Notify the client + admins
  sendPushToUser(args.userId, {
    title: 'Payment received',
    body: `Tell us about your project to kick off your ${service.title}.`,
    url: `/client/projects/${project._id}/brief`,
    tag: 'project-brief',
  }).catch(() => {});

  sendPushToRole('admin', {
    title: 'New service purchase',
    body: `${service.title} — awaiting brief from client.`,
    url: `/admin/projects/${project._id}`,
    tag: 'project-purchase',
  }).catch(() => {});

  // WhatsApp the client if they've opted in (no-op if WhatsApp not configured)
  User.findById(args.userId)
    .select('phone whatsappOptIn')
    .then((u) => {
      if (u?.phone && u.whatsappOptIn !== false) {
        notifyServicePurchase(u.phone, service.title, project._id.toString(), CLIENT_URL).catch(() => {});
      }
    })
    .catch(() => {});

  return project;
}

async function rewardReferrerOnFirstPayment(userId: string, txReference: string): Promise<void> {
  const user = await User.findById(userId).select('referredBy referralRewarded');
  if (!user || !user.referredBy || user.referralRewarded) return;

  await awardPoints({
    userId: user.referredBy.toString(),
    reason: 'referral_enrolled',
    referenceId: `referral:${userId}`,
    note: `Referral commission for user ${userId}`,
  });
  await User.findByIdAndUpdate(userId, { referralRewarded: true });
  console.log(`[points] referral commission awarded for tx ${txReference}`);
}

// ─── Client referral credit ──────────────────────────────────────────────
// Pays out as naira credit (applied as a checkout discount) — NOT points.
// Fires only when the user who paid is a `client`, so the student points
// flow above stays untouched.
export const CLIENT_REFERRAL_CREDIT_NAIRA = 20_000;

async function creditReferrerOnClientFirstPayment(userId: string, txReference: string): Promise<void> {
  const user = await User.findById(userId).select('role referredBy clientReferralCredited');
  if (!user || user.role !== 'client' || !user.referredBy || user.clientReferralCredited) return;

  await User.findByIdAndUpdate(user.referredBy, {
    $inc: { referralCreditNaira: CLIENT_REFERRAL_CREDIT_NAIRA },
  });
  await User.findByIdAndUpdate(userId, { clientReferralCredited: true });
  console.log(`[referral] ₦${CLIENT_REFERRAL_CREDIT_NAIRA.toLocaleString()} credit awarded to referrer for client tx ${txReference}`);
}

// Paystack webhook
export const paystackWebhook = async (req: Request, res: Response) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET())
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    res.status(401).json({ message: 'Invalid signature' });
    return;
  }

  const event = req.body as {
    event: string;
    data: {
      reference: string;
      status: string;
      authorization?: Record<string, unknown>;
      customer?: Record<string, unknown>;
      metadata?: {
        projectId?: string;
        serviceId?: string;
        purchaseType?: string;
        userId?: string;
        pointsRedeemed?: number;
        voucherCode?: string;
        basePriceKobo?: number;
        referralCreditAppliedNaira?: number;
        paymentPlanId?: string;
        installmentNumber?: number;
      };
    };
  };

  if (event.event === 'charge.success') {
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: event.data.reference },
      { status: 'succeeded' },
    );
    // Save card authorization onto the linked PaymentPlan (if any) and mark
    // the installment paid. Idempotent — safe even if verify already ran.
    await saveAuthorizationToPlan({
      reference: event.data.reference,
      paymentPlanId: event.data.metadata?.paymentPlanId,
      installmentNumber: event.data.metadata?.installmentNumber,
      paystackData: event.data as unknown as Record<string, unknown>,
    }).catch((err) => console.error('[paymentPlan] webhook auth save failed:', err));

    if (event.data.metadata?.projectId) {
      await Project.findByIdAndUpdate(event.data.metadata.projectId, {
        isPaid: true,
        paystackReference: event.data.reference,
      });
    }
    if (event.data.metadata?.purchaseType === 'service' && event.data.metadata?.serviceId && event.data.metadata?.userId) {
      await ensureProjectForServicePurchase({
        userId: event.data.metadata.userId,
        serviceId: event.data.metadata.serviceId,
        reference: event.data.reference,
        basePriceKobo: event.data.metadata.basePriceKobo,
      }).catch((err) => console.error('[project] auto-create failed:', err));
    }
    if (event.data.metadata?.voucherCode && event.data.metadata?.userId) {
      await claimVoucher(event.data.metadata.voucherCode, event.data.metadata.userId, event.data.reference).catch(() => {});
    }
    if (event.data.metadata?.userId) {
      await rewardReferrerOnFirstPayment(event.data.metadata.userId, event.data.reference).catch(() => {});
      await creditReferrerOnClientFirstPayment(event.data.metadata.userId, event.data.reference).catch(() => {});
    }
  } else if (event.event === 'charge.failed') {
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: event.data.reference },
      { status: 'failed' },
    );
    if (event.data.metadata?.userId) {
      const refund = Number(event.data.metadata.pointsRedeemed || 0);
      if (refund > 0) {
        await awardPoints({
          userId: event.data.metadata.userId,
          reason: 'admin_adjustment',
          amount: refund,
          referenceId: `refund:${event.data.reference}`,
          note: 'Refund of redeemed points (payment failed via webhook)',
        }).catch(() => {});
      }
      if (event.data.metadata?.voucherCode) {
        await refundVoucher(event.data.metadata.voucherCode).catch(() => {});
      }
      const creditRefund = Number(event.data.metadata.referralCreditAppliedNaira || 0);
      if (creditRefund > 0) {
        await User.findByIdAndUpdate(event.data.metadata.userId, {
          $inc: { referralCreditNaira: creditRefund },
        }).catch(() => {});
      }
    }
  }

  res.sendStatus(200);
};

// List client transactions
export const getMyTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transactions = await Transaction.find({ user: req.user!.userId })
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { transactions } });
  } catch (err) { next(err); }
};

/**
 * Admin-only: every transaction across all users, newest first. Used by the
 * /admin/payments ledger page. We populate `user` with name + email so the
 * table can render the buyer's identity without an N+1.
 */
export const getAllTransactions = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { transactions } });
  } catch (err) { next(err); }
};
