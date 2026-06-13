import https from 'https';

/**
 * Server-side recurring-charge wrapper around Paystack's
 * `POST /transaction/charge_authorization` endpoint.
 *
 * Used by the installments cron to auto-charge a user's saved card on each
 * due date — no user interaction required. Mirrors the `paystackRequest`
 * helper in `paystack.controller.ts` (deliberately duplicated to keep the
 * cron independent of the request/response Express plumbing).
 *
 * Docs: https://paystack.com/docs/api/transaction/#charge-authorization
 */

const PAYSTACK_BASE_HOST = 'api.paystack.co';

function getSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not set.');
  return secret;
}

function paystackRequest<T = Record<string, unknown>>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ statusCode: number; body: { status: boolean; message?: string; data?: T } }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options: https.RequestOptions = {
      hostname: PAYSTACK_BASE_HOST,
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${getSecret()}`,
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
          reject(new Error(`Invalid JSON from Paystack (${res.statusCode}): ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/* ─── Public API ─────────────────────────────────────────────────────── */

export interface ChargeAuthorizationInput {
  /** Saved authorization code from a previous successful charge (AUTH_xxx). */
  authorizationCode: string;
  /** Email of the customer being charged. Must match the authorization owner. */
  email: string;
  /** Amount in kobo. Must be ≥ 100 (Paystack minimum). */
  amount: number;
  /** Becomes the new Transaction's stripePaymentIntentId — must be unique. */
  reference: string;
  /** Metadata mirrored from the original initialize call so verify/webhook can route side-effects. */
  metadata?: Record<string, unknown>;
}

export interface ChargeAuthorizationResult {
  /** True only on Paystack's `data.status === 'success'`. */
  succeeded: boolean;
  /** Paystack's human-readable message (success or failure reason). */
  message: string;
  /** Paystack's reference for this attempt — usually echoes the one we sent. */
  reference?: string;
  /** Paystack's gateway response code (e.g. 'Successful', 'Insufficient Funds'). */
  gatewayResponse?: string;
  /** Raw response data for debugging / writing onto the installment record. */
  raw?: Record<string, unknown>;
}

/**
 * Attempt to charge a saved card. Returns success/failure rather than throwing
 * — the cron treats both as expected outcomes and writes the result onto the
 * installment record either way.
 *
 * Network errors (no response from Paystack at all) DO throw — the cron's
 * outer try/catch logs them and treats the installment as untouched so the
 * next cron tick can retry.
 */
export async function chargeAuthorization(input: ChargeAuthorizationInput): Promise<ChargeAuthorizationResult> {
  if (input.amount < 100) {
    return { succeeded: false, message: 'Amount below Paystack minimum (₦1).' };
  }

  const { statusCode, body } = await paystackRequest<{
    status: string;
    reference: string;
    gateway_response?: string;
  }>('POST', '/transaction/charge_authorization', {
    authorization_code: input.authorizationCode,
    email: input.email,
    amount: input.amount,
    reference: input.reference,
    metadata: input.metadata,
  });

  if (statusCode !== 200 || !body.status) {
    return {
      succeeded: false,
      message: body.message || `Paystack ${statusCode}`,
      raw: body as unknown as Record<string, unknown>,
    };
  }

  const data = body.data;
  const succeeded = data?.status === 'success';
  return {
    succeeded,
    message: succeeded ? 'Charge succeeded.' : (data?.gateway_response || body.message || 'Charge failed.'),
    reference: data?.reference,
    gatewayResponse: data?.gateway_response,
    raw: data as unknown as Record<string, unknown>,
  };
}
