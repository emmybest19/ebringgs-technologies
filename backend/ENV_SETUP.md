# Backend `.env` Setup Guide

A step-by-step walkthrough for getting every value the backend needs. Each section names the package that consumes the variable and the exact version pinned in [backend/package.json](backend/package.json), so the URLs and UI steps below match the version you actually run.

> ⚠️ **Security note.** The current [backend/.env.example](backend/.env.example) file contains what appear to be real Atlas connection strings. If this repo has ever been pushed to a public remote, rotate those database passwords in Atlas immediately and replace the values with placeholders.

---

## 0. Create the file

From the repo root:

```bash
cp backend/.env.example backend/.env
```

Then fill in each section below. The app loads `.env` via `dotenv` (`^16.4.5`) at boot in [backend/src/index.ts](backend/src/index.ts) — restart the dev server after edits.

---

## 1. Core runtime — `NODE_ENV`, `PORT`, `CLIENT_URL`

| Variable | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | One of `development \| staging \| production`. Picks which `MONGO_URI_*` is used in [src/config/db.ts](src/config/db.ts). |
| `PORT` | `5000` | HTTP + WebSocket share this port (see [src/index.ts](src/index.ts)). |
| `CLIENT_URL` | `http://localhost:5173` | Used for CORS allow-list, email links, and Paystack `callback_url`. Set to your production frontend URL when deploying. |

No external account needed.

---

## 2. MongoDB Atlas — `MONGO_URI_DEVELOPMENT`, `MONGO_URI_STAGING`, `MONGO_URI_PRODUCTION`, `MONGO_URI`

Used by **mongoose `^8.4.4`** in [src/config/db.ts](src/config/db.ts). The connector picks a URI based on `NODE_ENV` and falls back to `MONGO_URI` if the env-specific one is missing.

### Steps

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account (Google sign-in is fine).
2. Click **Build a Database** → choose **M0 Free** tier (shared, 512 MB) → pick a cloud provider/region close to your users (for Nigeria, AWS `eu-west-1` Ireland or AWS `af-south-1` Cape Town are good choices) → **Create Deployment**.
3. On the **Security Quickstart** page:
   - **Username/password**: create a DB user (save the password — Atlas only shows it once).
   - **Where would you like to connect from?**: pick **My Local Environment** and add your current IP. For production, also add `0.0.0.0/0` *only if you accept the risk*; better practice is to whitelist your deploy host's IP.
4. Once the cluster status is **Active**, click **Connect** → **Drivers** → driver **Node.js**, version **6.7 or later**.
5. Copy the connection string. It looks like:
   ```
   mongodb+srv://<db_user>:<db_password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Replace `<db_user>` and `<db_password>` with the credentials from step 3. **URL-encode** any special characters in the password (e.g. `@` → `%40`, `#` → `%23`).
7. Append your database name before the `?`, e.g.:
   ```
   mongodb+srv://ebringgs-dev:STRONGPASS@cluster0.xxxxx.mongodb.net/ebringgs?retryWrites=true&w=majority&appName=Cluster0
   ```
8. Repeat steps 2–7 for staging and production clusters (or use one cluster with three different database names if you're cost-constrained). Paste each into the matching `MONGO_URI_*` variable.
9. `MONGO_URI` is the local-dev fallback — leave the default `mongodb://localhost:27017/ebringgs` if you ever want to use a local mongod, otherwise it's unused.

---

## 3. JWT secrets — `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`

Used by **jsonwebtoken `^9.0.2`** in [src/utils/jwt.ts](src/utils/jwt.ts) and [src/middleware/auth.middleware.ts](src/middleware/auth.middleware.ts).

### Steps

1. Generate two independent, high-entropy secrets. **Do NOT reuse the same string** for access and refresh — that defeats the point of having two.

   PowerShell (Windows):
   ```powershell
   [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
   ```
   Bash (Git Bash / WSL / macOS / Linux):
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```
   Run it twice — once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET`.

2. Paste the outputs:
   ```env
   JWT_SECRET=<first random string>
   JWT_REFRESH_SECRET=<second random string>
   ```

3. Lifetimes use the [vercel/ms](https://github.com/vercel/ms) format that `jsonwebtoken` v9 accepts:
   ```env
   JWT_EXPIRES_IN=15m        # access token, short-lived
   JWT_REFRESH_EXPIRES_IN=7d # refresh token, longer-lived
   ```
   Adjust to taste — the frontend's axios interceptor in [frontend/src/services/api.ts](frontend/src/services/api.ts) auto-refreshes on 401.

> 🚨 Rotate both secrets when moving to production, and never commit them. Rotating invalidates every existing session.

---

## 4. Email / SMTP — `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

Used by **nodemailer `^6.9.14`** in [src/utils/email.ts](src/utils/email.ts) for password reset, email verification, payment receipts, etc.

### Option A — Gmail (free, easy, fine for dev/low volume)

1. The Google account you'll send from must have **2-Step Verification ON**. Turn it on at <https://myaccount.google.com/security> → **2-Step Verification**.
2. Generate an **App Password**:
   - Go to <https://myaccount.google.com/apppasswords> (only visible after 2SV is on).
   - Pick app: **Mail**, device: **Other (custom name)** → name it `E-Bringgs Backend` → **Generate**.
   - Google shows a **16-character** code like `abcd efgh ijkl mnop`. Copy it **without the spaces** — that's your `SMTP_PASS`.
3. Fill in:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=ebringgstechnologies@gmail.com
   SMTP_PASS=abcdefghijklmnop
   EMAIL_FROM=E-Bringgs <ebringgstechnologies@gmail.com>
   ```
   The `EMAIL_FROM` "from" address must match `SMTP_USER` for Gmail or it will rewrite / reject.

### Option B — SendGrid / Resend / Mailgun / Brevo (recommended for production)

Pick any transactional email provider. Get their SMTP relay credentials from the provider dashboard and plug into the same four variables. Common production examples:

| Provider | Host | Port |
| --- | --- | --- |
| SendGrid | `smtp.sendgrid.net` | `587` |
| Resend | `smtp.resend.com` | `587` |
| Mailgun | `smtp.mailgun.org` | `587` |
| Brevo | `smtp-relay.brevo.com` | `587` |

For production, `EMAIL_FROM` should use a verified domain you control (`E-Bringgs <noreply@ebringgs.com>`), not a Gmail address. You'll need to verify the domain in the provider's dashboard (SPF + DKIM DNS records).

---

## 5. Paystack — `PAYSTACK_SECRET_KEY`

Primary payment provider. Used directly via the `https` module (no SDK) in [src/controllers/paystack.controller.ts](src/controllers/paystack.controller.ts) and [src/services/paystackCharge.service.ts](src/services/paystackCharge.service.ts).

### Steps

1. Sign up at <https://dashboard.paystack.com/#/signup>.
2. After login you start in **Test Mode** (toggle top-right). In **Test Mode**:
   - Go to **Settings → API Keys & Webhooks**.
   - Copy the **Secret Key** (`sk_test_...`). This is your `PAYSTACK_SECRET_KEY` for development.
3. For production, complete business verification (BVN, business documents). Once approved, switch to **Live Mode**, then **Settings → API Keys & Webhooks** → copy the **Live Secret Key** (`sk_live_...`) and use it as the production `PAYSTACK_SECRET_KEY`.
4. **Set up the webhook** so the backend hears successful charges:
   - In the same **API Keys & Webhooks** screen, set **Webhook URL** to `https://<your-backend-domain>/api/paystack/webhook`.
   - Paystack signs webhook payloads using your **Secret Key** — no separate webhook secret to configure (unlike Stripe). Verification happens in [src/controllers/paystack.controller.ts](src/controllers/paystack.controller.ts) using the same `PAYSTACK_SECRET_KEY` value.
5. Locally, expose the webhook with [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) and paste that URL into Paystack's webhook field. Example: `ngrok http 5000` → use the `https://...ngrok-free.app/api/paystack/webhook` URL.

Test card for Paystack test mode: `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`, OTP `123456`.

---

## 6. Web Push (VAPID) — `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

Used by **web-push `^3.6.7`** in [src/utils/pushNotification.ts](src/utils/pushNotification.ts) and exposed to the frontend via [src/controllers/push.controller.ts](src/controllers/push.controller.ts).

### Steps

1. From the `backend/` directory, generate a key pair (no install needed — `web-push` is already a dep):
   ```bash
   npx web-push generate-vapid-keys
   ```
   Output:
   ```
   =======================================
   Public Key:
   BMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Private Key:
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   =======================================
   ```
2. Paste:
   ```env
   VAPID_PUBLIC_KEY=BM...           # the "Public Key" line
   VAPID_PRIVATE_KEY=...            # the "Private Key" line
   VAPID_SUBJECT=mailto:ebringgstechnologies@gmail.com
   ```
   `VAPID_SUBJECT` must be either a `mailto:` URI or a `https://` URL — push services use it as a contact if your traffic looks abusive.

3. **Generate keys once per environment** and keep them stable forever. Rotating them invalidates every existing browser subscription stored in the DB — users would have to re-allow notifications.

4. The public key is also needed in the frontend to call `pushManager.subscribe({ applicationServerKey: ... })`. Either fetch it from the backend endpoint (`/api/push/vapid-key`) at runtime or mirror it as `VITE_VAPID_PUBLIC_KEY` in `frontend/.env`. The public key is safe to ship to the browser; the private one is not.

---

## 7. Google Gemini (AI Tutor) — `GEMINI_API_KEY`, `AI_TUTOR_DAILY_LIMIT`

Used by [src/services/aiTutor.service.ts](src/services/aiTutor.service.ts) via the Gemini REST API (no SDK — raw `https` calls). The pinned model is `gemini-1.5-flash`.

### Steps

1. Visit <https://aistudio.google.com/app/apikey> and sign in with a Google account.
2. Click **Create API key** → either create a new Google Cloud project or pick an existing one → **Create API key in existing/new project**.
3. Copy the key (starts with `AIza...`) and paste:
   ```env
   GEMINI_API_KEY=AIza...
   AI_TUTOR_DAILY_LIMIT=30
   ```
   `AI_TUTOR_DAILY_LIMIT` is a per-user per-day quota enforced in [src/controllers/aiTutor.controller.ts](src/controllers/aiTutor.controller.ts) — bump it as you scale.
4. Free tier (as of writing): 1500 requests/day, 1M tokens/min on `gemini-1.5-flash`. No billing required to start. Check current limits at <https://ai.google.dev/pricing>.
5. **Restrict the key** in [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials):
   - **API restrictions**: limit to **Generative Language API** only.
   - **Application restrictions**: for production, restrict by IP (your deploy host).

Leaving `GEMINI_API_KEY` blank disables the tutor gracefully — the controller returns a clean error rather than crashing.

---

## 8. WhatsApp Cloud API (optional) — `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`

Optional channel used by [src/services/whatsapp.service.ts](src/services/whatsapp.service.ts). Leaving both blank disables WhatsApp notifications silently. The two free things you need to ship: a **test phone number** Meta provides (free, no setup) and an **access token**.

> 🧭 **Note on Meta's UI.** Meta redesigns this console 2–3 times a year, so labels may have shifted slightly by the time you read this. If a label doesn't match exactly, look for the closest equivalent — the *order* of operations below is what matters.

---

### Part A — Create the Meta app (one-time, ~3 minutes)

This creates the "app shell" that WhatsApp will attach to. Even though you'll never build a "Facebook app" in the consumer sense, this is how Meta groups API access.

1. **Log in** at <https://developers.facebook.com/> with the Facebook account you want to own this app.
   - If this is your first time, you'll be prompted to register as a developer — accept the terms.
2. Top-right corner → click your **profile picture / "My Apps"** menu → **"Create App"**.
   - Or go directly to <https://developers.facebook.com/apps/creation/>
3. **Screen 1 — App details:**
   - **App name**: `E-Bringgs` (this is internal — users don't see it)
   - **App contact email**: `ebringgstechnologies@gmail.com`
   - Click **Next**.
4. **Screen 2 — "Select one or more use cases for your app":**
   - Tick **"Other"** at the bottom (the WhatsApp-specific use cases require a Business Portfolio already exists; "Other" is the safe path).
   - Click **Next**.
5. **Screen 3 — "Select an app type":**
   - Choose **"Business"** → **Next**.
6. **Screen 4 — Business portfolio:**
   - If you already have a Meta Business Portfolio (Business Manager), pick it.
   - If not, leave it as **"I don't want to connect a business portfolio yet"** — you can add one later. Click **Next**.
7. **Screen 5 — Review:**
   - Confirm details → **"Create app"**.
   - You may be asked to re-enter your Facebook password.
8. You'll land in the **App Dashboard** — URL looks like `https://developers.facebook.com/apps/<APP_ID>/dashboard/`. Keep this tab open.

---

### Part B — Add WhatsApp to the app

1. In the App Dashboard, scroll down to **"Add products to your app"** (a grid of tiles).
2. Find the **"WhatsApp"** tile → click **"Set up"** on it.
   - If you don't see it in the grid, use the **left sidebar** → **"Add product"** → search "WhatsApp" → **Set up**.
3. **WhatsApp setup wizard:**
   - If you skipped business portfolio in Part A, Meta will now prompt to **"Create a Meta Business Account"** — give it the name `E-Bringgs Technologies` and your country (Nigeria). Click **Continue**.
   - It will also create a **WhatsApp Business Account (WABA)** automatically with the same name.
   - Click **Continue** through any onboarding prompts until you reach **WhatsApp → API Setup**.

---

### Part C — Get the values for `.env` (the part you actually need)

You should now be on the **WhatsApp → API Setup** page (left sidebar shows "WhatsApp" with sub-items: **"API Setup"**, **"Configuration"**, **"Templates"**, **"Quickstart"**, etc.). If not, click **API Setup** in the sidebar.

This page has everything in one view:

| What's on the screen | What it looks like | Goes into `.env` as |
| --- | --- | --- |
| Section **"Send and receive messages"** → **"From"** dropdown shows a test phone number Meta provided (e.g. `+1 555 123 4567`) | Right below the dropdown, you'll see **"Phone number ID: 1234567890123456"** | `WHATSAPP_PHONE_NUMBER_ID=1234567890123456` |
| Section **"Temporary access token"** at the top | A long string starting with `EAA...`, with a **Copy** button next to it | `WHATSAPP_ACCESS_TOKEN=EAA…` |

⚠️ **The temporary token expires in 24 hours.** It's fine for testing — confirm your integration works, then come back to Part D for a permanent token before production.

You should also see a **"To"** field where you can add **your own personal WhatsApp number** as a test recipient. Click **"Manage phone number list"** → add your number → confirm via the OTP that WhatsApp sends you. Until you add a recipient, all sends will fail with `(#131030) Recipient phone number not in allowed list`. This is a sandbox restriction that goes away once the WABA is fully approved.

**Test the send-message button** at the bottom of API Setup → if your test phone receives the message, your `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` are both correct.

---

### Part D — Generate a permanent access token (for production)

Skip this for now if you're just testing. Come back when you're ready to deploy.

1. Open **Meta Business Suite** at <https://business.facebook.com/>.
2. Bottom-left → click **"All tools"** → **"Business settings"** (gear icon). Direct link: <https://business.facebook.com/settings>.
3. In Business Settings left sidebar → **"Users"** → **"System users"**.
4. Click **"Add"** (top-right blue button).
   - **System username**: `whatsapp-bot`
   - **System user role**: **Admin**
   - Click **"Create system user"** → confirm with your password.
5. The new system user appears in the list. Click their name → **"Add assets"** (right-side panel).
6. In the asset picker:
   - **Asset type**: **"Apps"**
   - Find your **E-Bringgs** app in the list → tick it
   - **"Partial access"** → toggle **"Develop app"** ON
   - **"Full control"** → toggle **"Manage app"** ON
   - Click **"Save changes"**.
7. Repeat **"Add assets"** for the **WhatsApp account**:
   - **Asset type**: **"WhatsApp accounts"**
   - Tick your WABA → enable **"Full control"** → **Save**.
8. Back on the system user's page → click **"Generate new token"** (top-right).
9. In the modal:
   - **App**: select your E-Bringgs app
   - **Token expiration**: **"Never"**
   - **Permissions** — tick all three of these (use the search box):
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
     - `business_management`
   - Click **"Generate token"**.
10. **Copy the token immediately** — Meta only shows it once. Paste into `.env` as the new `WHATSAPP_ACCESS_TOKEN`. Replace the temporary token.

---

### Part E — Add your real business phone number (production only)

The Meta-provided test number can only send to numbers you whitelist (~5 max) and shows the sender as a generic Meta number. For production, add your own:

1. Back in the developer console → **WhatsApp → API Setup** → next to the **"From"** dropdown, click **"Add phone number"**.
2. Enter:
   - **Business display name**: `E-Bringgs Technologies` (this is what customers see)
   - **Phone number**: a number you own — must be able to receive SMS or voice. **Cannot already be in use on the WhatsApp consumer app.** If it is, delete WhatsApp from that number first.
3. Verify via SMS/voice OTP.
4. Once verified, the new number appears in the **"From"** dropdown. Its **Phone number ID** is the new `WHATSAPP_PHONE_NUMBER_ID` for production.

> 📒 **Free tier**: 1,000 service-initiated conversations per month per WABA, plus unlimited user-initiated conversations (within 24 hours of a customer message). Marketing/utility/auth message templates are billed per conversation — see <https://developers.facebook.com/docs/whatsapp/pricing>.

---

### Common things that go wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| `(#131030) Recipient phone number not in allowed list` | Using temp token + recipient not whitelisted | Add recipient to "To" list in API Setup |
| `(#190) Invalid OAuth access token` | Temp token expired (24h) | Generate a new one in API Setup, or skip to Part D |
| `(#10) Application does not have permission` | System user token missing scopes | Re-run Part D step 9 — make sure all three permissions ticked |
| App stuck on "In development" | Default for new apps — limits you to test recipients | For production, complete Business Verification in Business Settings → fine for the test phone in dev |

---

## 9. EmailJS (Contact form — **frontend** `.env`)

> 📍 **These variables live in `frontend/.env`, not `backend/.env`** — EmailJS runs entirely in the browser. They must be prefixed with `VITE_` to be exposed to Vite's client bundle.

Used by the EmailJS browser SDK ([`@emailjs/browser`](https://www.npmjs.com/package/@emailjs/browser), current version **`^4.4.1`**) to send the [Contact](../frontend/src/pages/Contact.tsx) form submissions directly to your inbox — no backend round-trip, no DB write.

### Why EmailJS for this form

The contact form is a low-volume, drop-and-forget notification — it does not need to land in MongoDB. EmailJS delivers it straight to whatever inbox you wire up, which means:

- No backend route, no `nodemailer` config, no SMTP creds in the browser-bound flow.
- Replies go back to the visitor's `email` via the template's `Reply-To`.

The other form on the site (service inquiry on `/services`) still goes through the backend so it can be tracked in the admin dashboard — don't replace that one.

### Steps

1. **Install the SDK** (one-time, in `frontend/`):
   ```bash
   npm --prefix frontend install @emailjs/browser
   ```
2. Sign up at <https://dashboard.emailjs.com/sign-up> (free tier: **200 emails/month**, plenty for a contact form).
3. **Add an Email Service** (the inbox emails are delivered to):
   - Dashboard → **Email Services → Add New Service**.
   - Pick **Gmail** (easiest) — click **Connect Account** and OAuth into the Gmail account you want messages delivered to. Other options: Outlook, Yahoo, custom SMTP, SendGrid, etc.
   - After it's connected, copy the **Service ID** (e.g. `service_abc1234`). That's `VITE_EMAILJS_SERVICE_ID`.
4. **Create an Email Template** (the layout of the email you'll receive):
   - Dashboard → **Email Templates → Create New Template**.
   - **Settings tab**:
     - **To Email**: the inbox you want messages delivered to — use `ebringgstechnologies@gmail.com`.
     - **From Name**: `{{from_name}}` (will be filled with the visitor's name).
     - **Reply To**: `{{reply_to}}` (so hitting Reply in Gmail emails the visitor directly).
     - **Subject**: `New contact form: {{subject}}`.
   - **Content tab** — paste:
     ```
     New contact form submission from {{from_name}} ({{from_email}}).

     Topic: {{subject}}

     Message:
     {{message}}
     ```
   - **Save** → copy the **Template ID** (e.g. `template_xyz5678`). That's `VITE_EMAILJS_TEMPLATE_ID`.
5. **Get the Public Key** (used to init the SDK in the browser — safe to ship publicly, EmailJS rate-limits per key):
   - Dashboard → **Account → General** → copy **Public Key** (e.g. `abcDEF123456`). That's `VITE_EMAILJS_PUBLIC_KEY`.
6. **Restrict the key** (mandatory for production — otherwise anyone can scrape it and spam your inbox):
   - Dashboard → **Account → Security** → enable **Allowlist**: add your production domain (`ebringgs.com`) and `localhost` for dev.
   - Enable **reCAPTCHA v2** on the template to block bots (Dashboard → your template → Settings → reCAPTCHA).
7. Add to **[frontend/.env](../frontend/.env)** (create it if missing):
   ```env
   VITE_EMAILJS_SERVICE_ID=service_abc1234
   VITE_EMAILJS_TEMPLATE_ID=template_xyz5678
   VITE_EMAILJS_PUBLIC_KEY=abcDEF123456
   ```
   Restart `npm run dev:frontend` — Vite only re-reads `.env` on boot.

### Wiring the form

In [frontend/src/pages/Contact.tsx](../frontend/src/pages/Contact.tsx), replace the `useSubmitInquiry` call inside `handleSubmit` with EmailJS. Keep the `sent` / `error` state and UI as-is.

```tsx
import emailjs from '@emailjs/browser';

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        from_name: form.name,
        from_email: form.email,
        reply_to: form.email,
        subject: form.subject,
        message: form.message,
      },
      { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY },
    );
    setSent(true);
  } catch (err) {
    setError('Failed to send message. Please email us directly at hello@ebringgs.com');
  } finally {
    setLoading(false);
  }
};
```

The template variable names (`from_name`, `from_email`, `reply_to`, `subject`, `message`) must match the `{{placeholders}}` you used in step 4's template body. Rename them on either side, just keep them in sync.

### Verifying

1. Restart `npm run dev:frontend`.
2. Open the contact page, fill the form with a test email, hit **Send message**.
3. Within a few seconds you should receive the email at the **To Email** address from step 4.
4. Check **Dashboard → Email History** on EmailJS — every send (success or failure) is logged with the payload.

If the send fails:
- Open the browser console — EmailJS returns descriptive errors (`The user account is blocked`, `The Public Key is invalid`, `The template ID not found`, etc.).
- Check Dashboard → **Email History** for the failed entry's reason.
- Confirm the **Allowlist** includes the origin you're testing from.

---

## 10. Admin seed — `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

Consumed once by [src/scripts/seedAdmin.ts](src/scripts/seedAdmin.ts) when you run:

```bash
npm --prefix backend run seed:admin
```

This creates the first admin user so you can log into `/admin`. Pick a strong password (12+ chars, mixed case, digits, symbols) and a real email you control (used for password reset).

```env
ADMIN_NAME=Administrator
ADMIN_EMAIL=ebringgstechnologies@gmail.com
ADMIN_PASSWORD=Some-Strong-Pass-Phrase-Here-2026
```

After the seed runs successfully you can change the password from the admin profile page and **clear `ADMIN_PASSWORD` from `.env`** to avoid leaving it lying around.

---

## 11. Verifying everything works

After filling in `.env`:

```bash
# Type-check first
npm --prefix backend run typecheck

# Boot dev server
npm --prefix backend run dev
```

Look for these log lines:

| Log line | Means |
| --- | --- |
| `MongoDB connected: ...` | `MONGO_URI_*` worked |
| `Server running on port 5000` | `PORT` + boot OK |
| `WebSocket signaling ready at /ws` | WS attached to HTTP server |

Then open <http://localhost:5000/api/docs> — if Swagger UI loads, the Express app is healthy. From there:

- Hit `POST /api/auth/register` to confirm JWT signing works (200 with `accessToken` + `refreshToken`).
- Hit `POST /api/auth/forgot-password` with a real email to confirm SMTP works.
- Hit `POST /api/paystack/initialize` (after auth) to confirm Paystack key works — response should include an `authorization_url`.
- Hit `GET /api/push/vapid-key` to confirm VAPID keys are loaded.
- Hit `POST /api/ai-tutor/ask` (after auth) with a question to confirm Gemini.

If any of these 500s, check the backend logs — every controller routes errors through `errorHandler` in [src/middleware/error.middleware.ts](src/middleware/error.middleware.ts), which logs the cause.

---

## 12. Reference: package versions this guide is calibrated against

From [backend/package.json](backend/package.json):

| Package | Version | Used for |
| --- | --- | --- |
| `mongoose` | `^8.4.4` | MongoDB Atlas |
| `jsonwebtoken` | `^9.0.2` | JWT signing |
| `nodemailer` | `^6.9.14` | SMTP |
| `web-push` | `^3.6.7` | VAPID push |
| `dotenv` | `^16.4.5` | `.env` loading |
| `ws` | `^8.19.0` | WebSocket signaling |
| `node-cron` | `^4.2.1` | Scheduled jobs (e.g. installment reminders) |
| `helmet` | `^7.1.0` | Security headers |
| `express-rate-limit` | `^7.3.1` | `/api` rate limiting |
| `swagger-jsdoc` / `swagger-ui-express` | `^6.2.8` / `^5.0.1` | `/api/docs` |
| `zod` | `^3.23.8` | Request validation |

Paystack, Gemini, and WhatsApp are called via the raw `https` module (no SDK), so their setup is purely about provisioning keys in the respective dashboards.

From [frontend/package.json](../frontend/package.json) (relevant to the EmailJS section above):

| Package | Version | Used for |
| --- | --- | --- |
| `@emailjs/browser` | `^4.4.1` (install separately — not yet in deps) | Contact form delivery |

---

## 13. Deployment checklist (production `.env`)

- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` set to the production frontend URL (HTTPS)
- [ ] `MONGO_URI_PRODUCTION` points to a separate Atlas cluster from dev/staging
- [ ] Fresh `JWT_SECRET` + `JWT_REFRESH_SECRET` (not the dev ones)
- [ ] Production SMTP credentials with a verified sending domain
- [ ] `PAYSTACK_SECRET_KEY` is the **live** key (`sk_live_...`), webhook URL configured in Paystack dashboard
- [ ] VAPID keys generated once and never rotated
- [ ] `GEMINI_API_KEY` restricted in Google Cloud Console (Generative Language API only, IP-restricted)
- [ ] `WHATSAPP_ACCESS_TOKEN` is a permanent System User token, not the 24-hour temporary one
- [ ] `ADMIN_PASSWORD` cleared from `.env` after seeding
- [ ] `.env` is in `.gitignore` and has never been committed (run `git log --all -- backend/.env` to verify)
