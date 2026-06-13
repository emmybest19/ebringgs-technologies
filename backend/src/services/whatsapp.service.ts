import https from 'https';

/**
 * WhatsApp Cloud API integration (Meta).
 *
 * To enable: set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env.
 * Get these from https://developers.facebook.com/apps → WhatsApp → API Setup.
 *
 * Until those are set, every helper here gracefully no-ops so the rest of the
 * app keeps working in development.
 *
 * Pricing reminder: Meta gives 1,000 free service conversations/month, then
 * about ₦4-8 per message in Nigeria. Plenty of runway before this costs anything.
 *
 * Phone numbers must be in international format WITHOUT '+' or leading 0:
 *   "08012345678"  → "2348012345678"
 *   "+2348012345678" → "2348012345678"
 */

const API_VERSION = 'v21.0';

function isConfigured(): boolean {
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

export function normalizePhone(input?: string | null): string | null {
  if (!input) return null;
  const digits = String(input).replace(/\D+/g, '');
  if (!digits) return null;
  // Nigerian convenience: convert 080..., 070..., 090..., 081... etc → 234...
  if (digits.length === 11 && digits.startsWith('0')) {
    return `234${digits.slice(1)}`;
  }
  // Already has country code
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

interface SendTextResult {
  sent: boolean;
  reason?: string;
  messageId?: string;
}

/**
 * Send a free-form text message. Note: Meta only allows free-form messages
 * within 24 hours of the user's last message to your business number. For
 * cold outreach, use sendTemplate() with an approved template.
 */
export async function sendText(to: string, body: string): Promise<SendTextResult> {
  if (!isConfigured()) {
    console.log(`[whatsapp] (no-op — not configured) → ${to}: ${body.slice(0, 80)}…`);
    return { sent: false, reason: 'not_configured' };
  }

  const phone = normalizePhone(to);
  if (!phone) return { sent: false, reason: 'invalid_phone' };

  return makeRequest({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body },
  });
}

/**
 * Send an approved template message. Required for messages OUTSIDE the 24h
 * customer service window. Templates must be pre-approved in Meta Business
 * Manager.
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  parameters?: string[],
): Promise<SendTextResult> {
  if (!isConfigured()) {
    console.log(`[whatsapp] (no-op — not configured) → ${to}: template ${templateName}`);
    return { sent: false, reason: 'not_configured' };
  }

  const phone = normalizePhone(to);
  if (!phone) return { sent: false, reason: 'invalid_phone' };

  const components = parameters && parameters.length > 0
    ? [{
        type: 'body',
        parameters: parameters.map((p) => ({ type: 'text', text: p })),
      }]
    : undefined;

  return makeRequest({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  });
}

function makeRequest(payload: Record<string, unknown>): Promise<SendTextResult> {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (res.statusCode && res.statusCode >= 400) {
              const reason = parsed?.error?.message || `HTTP ${res.statusCode}`;
              console.warn('[whatsapp] send failed:', reason);
              return resolve({ sent: false, reason });
            }
            const messageId = parsed?.messages?.[0]?.id;
            resolve({ sent: true, messageId });
          } catch {
            resolve({ sent: false, reason: 'invalid_response' });
          }
        });
      },
    );
    req.on('error', (e) => {
      console.warn('[whatsapp] request error:', e.message);
      resolve({ sent: false, reason: e.message });
    });
    req.write(body);
    req.end();
  });
}

/* ─── Convenience helpers for app events ──────────────────────────────── */

export async function notifyServicePurchase(phone: string, serviceName: string, projectId: string, clientUrl: string) {
  return sendText(
    phone,
    `Payment confirmed for *${serviceName}*. Tell us about your project to kick off:\n${clientUrl}/client/projects/${projectId}/brief`,
  );
}

export async function notifyBriefSubmitted(phone: string, serviceName: string, projectId: string, clientUrl: string) {
  return sendText(
    phone,
    `Got it. Your brief for *${serviceName}* is in. We'll start work within 1 business day.\n\nTrack progress: ${clientUrl}/client/projects/${projectId}`,
  );
}

export async function notifyProjectUpdate(phone: string, projectTitle: string, updateTitle: string, projectId: string, clientUrl: string) {
  return sendText(
    phone,
    `Update on *${projectTitle}*: ${updateTitle}\n\n${clientUrl}/client/projects/${projectId}`,
  );
}

export async function notifyClassReminder(phone: string, className: string, startsInMinutes: number, joinUrl: string) {
  return sendText(
    phone,
    `*${className}* starts in ${startsInMinutes} minutes. Join here when ready:\n${joinUrl}`,
  );
}

/* ─── Installment payment notifications ──────────────────────────────── */

export async function notifyPaymentDue(
  phone: string,
  amountNaira: number,
  dueDate: Date,
  planDescription: string,
  planUrl: string,
  leadDays: number,
) {
  const when = leadDays === 0 ? 'today' : `in ${leadDays} day${leadDays === 1 ? '' : 's'}`;
  const due = dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return sendText(
    phone,
    `Reminder: ₦${amountNaira.toLocaleString()} for *${planDescription}* is due ${when} (${due}). We'll auto-charge your saved card. View schedule: ${planUrl}`,
  );
}

export async function notifyPaymentFailed(
  phone: string,
  amountNaira: number,
  planDescription: string,
  retryUrl: string,
  gracePeriodDays: number,
) {
  return sendText(
    phone,
    `We couldn't charge your card for *${planDescription}* (₦${amountNaira.toLocaleString()}). You have ${gracePeriodDays} day${gracePeriodDays === 1 ? '' : 's'} before access is paused. Pay now: ${retryUrl}`,
  );
}

export async function notifyAccountSuspended(
  phone: string,
  amountNaira: number,
  planDescription: string,
  payUrl: string,
) {
  return sendText(
    phone,
    `Your access to *${planDescription}* has been paused after a missed payment. Settle ₦${amountNaira.toLocaleString()} to restore instantly: ${payUrl}`,
  );
}
