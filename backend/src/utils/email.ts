import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'E-Bringgs <ebringgstechnologies@gmail.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

export const emailTemplates = {
  verifyEmail: (name: string, token: string, clientUrl: string) => ({
    subject: 'Verify your E-Bringgs email address',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#111827;margin-top:0;">Hi ${name},</h2>
          <p style="color:#6b7280;">Please verify your email address to complete your E-Bringgs registration.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${clientUrl}/verify-email?token=${token}"
               style="background:#4f46e5;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
              Verify email address
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  }),

  passwordReset: (name: string, token: string, clientUrl: string) => ({
    subject: 'Reset your E-Bringgs password',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#111827;margin-top:0;">Hi ${name},</h2>
          <p style="color:#6b7280;">We received a request to reset your password. Click the button below to create a new one.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${clientUrl}/reset-password?token=${token}"
               style="background:#4f46e5;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
              Reset password
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  }),

  newServiceInquiry: (
    inquirerName: string,
    inquirerEmail: string,
    serviceName: string,
    message: string,
    clientUrl: string,
  ) => ({
    subject: `New inquiry — ${serviceName} from ${inquirerName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <div style="display:inline-block;background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:12px;">New inquiry</div>
          <h2 style="color:#111827;margin:0 0 8px;">${serviceName}</h2>
          <p style="color:#6b7280;margin:0 0 24px;">A potential client just reached out. Reply quickly to win the deal.</p>

          <div style="background:#f0fdfa;border-left:3px solid #0d9488;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
            <p style="margin:0 0 4px;color:#134e4a;font-size:13px;font-weight:600;">From</p>
            <p style="margin:0;color:#111827;font-size:15px;font-weight:600;">${inquirerName}</p>
            <p style="margin:2px 0 0;color:#6b7280;font-size:13px;">
              <a href="mailto:${inquirerEmail}" style="color:#0d9488;text-decoration:none;">${inquirerEmail}</a>
            </p>
          </div>

          <div style="margin-bottom:24px;">
            <p style="color:#6b7280;font-size:13px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">Their message</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;color:#374151;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
          </div>

          <div style="text-align:center;">
            <a href="${clientUrl}/admin/service-requests"
               style="background:#0d9488;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
              Open in admin dashboard
            </a>
          </div>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
          You're receiving this because you're an admin on E-Bringgs.
        </p>
      </div>
    `,
  }),

  enrollmentConfirmation: (name: string, courseTitle: string) => ({
    subject: `You're enrolled in ${courseTitle}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#111827;margin-top:0;">Welcome, ${name}!</h2>
          <p style="color:#6b7280;">You're now enrolled in <strong>${courseTitle}</strong>. Your learning journey starts now.</p>
          <div style="background:#f0f4ff;border-radius:10px;padding:16px;margin:20px 0;border-left:4px solid #4f46e5;">
            <p style="margin:0;color:#4f46e5;font-weight:500;">Head to your dashboard to start learning</p>
          </div>
        </div>
      </div>
    `,
  }),

  projectBriefSubmitted: (
    serviceName: string,
    clientName: string,
    clientEmail: string,
    projectId: string,
    brief: Record<string, unknown>,
    clientUrl: string,
  ) => {
    const briefRows = Object.entries(brief)
      .map(([k, v]) => {
        const value = Array.isArray(v) ? v.join(', ') : String(v ?? '—');
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;width:35%;vertical-align:top;">${escapeHtml(k)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#111827;font-size:14px;white-space:pre-wrap;">${escapeHtml(value)}</td>
          </tr>`;
      })
      .join('');
    return {
      subject: `New project brief — ${serviceName}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
          <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
            <div style="display:inline-block;background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:12px;">Brief received</div>
            <h2 style="color:#111827;margin:0 0 8px;">${escapeHtml(serviceName)}</h2>
            <p style="color:#6b7280;margin:0 0 24px;">${escapeHtml(clientName)} (<a href="mailto:${escapeHtml(clientEmail)}" style="color:#0d9488;text-decoration:none;">${escapeHtml(clientEmail)}</a>) has submitted their brief. Time to kick off.</p>

            <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              ${briefRows}
            </table>

            <div style="text-align:center;">
              <a href="${clientUrl}/admin/projects/${projectId}"
                 style="background:#0d9488;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
                Open project in admin
              </a>
            </div>
          </div>
        </div>
      `,
    };
  },

  /* ─── Installment payment templates ──────────────────────────────── */

  paymentReminder: (args: {
    name: string;
    amountNaira: number;
    dueDate: Date;
    planDescription: string;
    planUrl: string;
    leadDays: number;        // 3 = "in 3 days", 0 = "today"
  }) => {
    const when = args.leadDays === 0 ? 'today' : `in ${args.leadDays} day${args.leadDays === 1 ? '' : 's'}`;
    const due = args.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      subject: `Reminder: ₦${args.amountNaira.toLocaleString()} installment due ${when}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:12px;padding:12px 20px;">
              <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
            </div>
          </div>
          <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
            <h2 style="color:#111827;margin-top:0;">Hi ${escapeHtml(args.name)},</h2>
            <p style="color:#374151;font-size:15px;">
              Your next installment for <strong>${escapeHtml(args.planDescription)}</strong> is due ${when}.
            </p>
            <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin:20px 0;">
              <p style="margin:0;color:#0f766e;font-size:14px;">Amount</p>
              <p style="margin:4px 0 0;color:#111827;font-weight:bold;font-size:24px;">₦${args.amountNaira.toLocaleString()}</p>
              <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Due ${due}</p>
            </div>
            <p style="color:#6b7280;font-size:14px;">
              We'll automatically charge your saved card. You don't need to do anything — just keep enough balance available.
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${args.planUrl}" style="background:#0d9488;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
                View payment schedule
              </a>
            </div>
          </div>
        </div>
      `,
    };
  },

  paymentFailed: (args: {
    name: string;
    amountNaira: number;
    planDescription: string;
    retryUrl: string;
    gracePeriodDays: number;
  }) => ({
    subject: `Payment failed — please update soon to keep your access`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#111827;margin-top:0;">Hi ${escapeHtml(args.name)},</h2>
          <p style="color:#374151;font-size:15px;">
            We tried to charge your card for the next installment of <strong>${escapeHtml(args.planDescription)}</strong> and it didn't go through.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">Amount due</p>
            <p style="margin:4px 0 0;color:#111827;font-weight:bold;font-size:24px;">₦${args.amountNaira.toLocaleString()}</p>
            <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">
              You have <strong>${args.gracePeriodDays} day${args.gracePeriodDays === 1 ? '' : 's'}</strong> to settle this before your access is paused.
            </p>
          </div>
          <p style="color:#6b7280;font-size:14px;">
            Common causes: insufficient funds, expired card, or a temporary bank decline. Use the link below to retry with the same or a different card.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${args.retryUrl}" style="background:#dc2626;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
              Pay now
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  accountSuspended: (args: {
    name: string;
    amountNaira: number;
    planDescription: string;
    payUrl: string;
  }) => ({
    subject: `Your access has been paused — settle to restore`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#111827;margin-top:0;">Hi ${escapeHtml(args.name)},</h2>
          <p style="color:#374151;font-size:15px;">
            Your grace period for <strong>${escapeHtml(args.planDescription)}</strong> has ended, so access to that programme has been paused.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">Amount to restore access</p>
            <p style="margin:4px 0 0;color:#111827;font-weight:bold;font-size:24px;">₦${args.amountNaira.toLocaleString()}</p>
          </div>
          <p style="color:#6b7280;font-size:14px;">
            Your dashboard and account remain open — only the paid feature is blocked. Pay now and access is restored instantly.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${args.payUrl}" style="background:#dc2626;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
              Pay to restore access
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  accessRestored: (args: { name: string; planDescription: string; dashboardUrl: string }) => ({
    subject: `Welcome back — access restored`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:12px;padding:12px 20px;">
            <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
          </div>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#111827;margin-top:0;">Hi ${escapeHtml(args.name)},</h2>
          <p style="color:#374151;font-size:15px;">
            Payment received. Your access to <strong>${escapeHtml(args.planDescription)}</strong> is fully restored.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${args.dashboardUrl}" style="background:#0d9488;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    `,
  }),
};
