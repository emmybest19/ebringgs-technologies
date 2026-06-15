import https from 'https';

/**
 * Public-site AI assistant. Different from aiTutor.service in two important
 * ways:
 *
 *  1. Audience. The tutor is for enrolled students working through a lesson;
 *     this assistant is for prospective students and clients browsing the
 *     marketing site. The system prompt is loaded with E-Bringgs business
 *     context so it can answer "what programs do you offer", "how much is
 *     the frontend cohort", "where can I see the schedule", etc.
 *
 *  2. Output shape. The tutor returns free-form text. The site assistant is
 *     asked to return a JSON envelope { answer, actions[] } so the UI can
 *     render in-line CTA chips that route the visitor to the right page.
 *     We tolerate the model returning plain text by falling back to "answer
 *     only, no actions".
 */

// 2.5-flash-lite has lower free-tier demand than the regular flash variant
// and is more than capable enough for short marketing-site Q&A. Bump to
// gemini-2.5-flash later if quality complaints come in.
const MODEL = 'gemini-2.5-flash-lite';
const MAX_OUTPUT_TOKENS = 700;

export interface AssistantAction {
  label: string;
  href: string;
}

export interface AssistantReply {
  answer: string;
  actions: AssistantAction[];
}

interface AskOptions {
  question: string;
  history?: { role: 'user' | 'model'; text: string }[];
}

const ALLOWED_HREFS = [
  '/', '/services', '/pricing', '/courses', '/schedule',
  '/about', '/how-it-works', '/contact', '/portfolio',
  '/login', '/register',
  '/services/software-development', '/services/data-analytics',
  '/services/research-support', '/services/ux-product-design',
];

const SYSTEM_INSTRUCTION = `You are the E-Bringgs Technologies site assistant, a friendly, concise guide for visitors browsing the website.

ABOUT E-BRINGGS:
E-Bringgs Technologies is a Nigerian tech company with two sides of the business:
  1. Training: live instructor-led cohorts and 1-on-1 mentorship for students who want to learn web/mobile/data skills.
  2. Services: we also build software, dashboards, research, and design for paying clients.

PROGRAMS (training tracks):
  - Frontend Development: HTML, CSS, JavaScript, TypeScript, React, Tailwind, Vite
  - Backend Development: Node.js, Express, TypeScript, MongoDB, REST APIs, JWT auth
  - Full-Stack Development: combined frontend + backend
  - Mobile App Development: React Native, iOS + Android
  - Research Writing: undergraduate, MSc, PhD, journal manuscripts
Each track has 3 tiers: Starter (live classes, ~₦50-80K), Live Cohort (intensive + mentor reviews, ~₦150-300K), 1-on-1 Mentorship (~₦400-550K). Exact prices live on /pricing.

CLIENT SERVICES (what we build for clients):
  - Software Development (web + mobile apps)
  - Data Analytics (dashboards, reports)
  - Research Support (academic + organizational)
  - UX / Product Design
Each capability has its own page: /services/software-development, /services/data-analytics, /services/research-support, /services/ux-product-design

KEY PAGES:
  - /pricing - all prices for both training and services
  - /courses - browse upcoming cohorts to enroll
  - /schedule - cohort start dates and live session times
  - /services - overview of what we do
  - /about - company background
  - /how-it-works - the learning + delivery process
  - /portfolio - shipped client work and student capstones
  - /contact - email + WhatsApp + form
  - /login and /register - account access

YOUR JOB:
- Answer visitor questions accurately based on the above.
- Be concise: 2-4 sentences usually, no walls of text.
- If you don't know an exact number/date, say so and point them to /contact or WhatsApp.
- Never invent prices, dates, or curriculum details not listed above.
- If someone seems ready to act, point them to the right page.

OUTPUT FORMAT (STRICT):
Always respond with valid JSON only, no markdown, no commentary, no fences. Schema:
{
  "answer": "your reply as plain text (markdown OK for emphasis but no fenced code blocks)",
  "actions": [
    { "label": "Short CTA text (max 4 words)", "href": "/pricing" }
  ]
}
"actions" is an array of 0 to 3 items. Only use href values from this allowlist: ${ALLOWED_HREFS.join(', ')}. If no action helps, return "actions": [].`;

export async function askSiteAssistant(opts: AskOptions): Promise<AssistantReply> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Site assistant not configured. Set GEMINI_API_KEY in environment.');
  }

  // Free-tier Gemini intermittently returns "high demand" overloads. Retry
  // up to two times with progressive backoff before giving up. Errors that
  // aren't transient (invalid key, schema error, etc.) bubble immediately.
  const backoffs = [0, 1200, 2800];
  let lastErr: Error | null = null;
  for (const wait of backoffs) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      return await askGeminiOnce(apiKey, opts);
    } catch (err) {
      lastErr = err as Error;
      const msg = lastErr.message || '';
      const isTransient = /high demand|temporarily unavailable|overloaded|503|429/i.test(msg);
      if (!isTransient) throw err;
    }
  }
  throw lastErr || new Error('Site assistant unavailable.');
}

async function askGeminiOnce(apiKey: string, opts: AskOptions): Promise<AssistantReply> {

  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const turn of opts.history ?? []) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }

  contents.push({ role: 'user', parts: [{ text: opts.question }] });

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const body = JSON.stringify(payload);

  const raw = await new Promise<string>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => { buf += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(buf);
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(parsed?.error?.message || `Gemini API error (HTTP ${res.statusCode})`));
            }
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
            const finishReason = parsed?.candidates?.[0]?.finishReason;
            if (!text) {
              if (finishReason === 'SAFETY') {
                return resolve(JSON.stringify({
                  answer: "I can't help with that one. Try rephrasing, or message us on WhatsApp.",
                  actions: [],
                }));
              }
              return reject(new Error('Empty response from Gemini'));
            }
            resolve(text);
          } catch {
            reject(new Error('Invalid JSON from Gemini'));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  return normalizeReply(raw);
}

// Tolerate the model returning plain text instead of strict JSON. Also drop
// any actions whose href isn't in our allowlist (defence against the model
// hallucinating paths).
function normalizeReply(raw: string): AssistantReply {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    const answer = typeof parsed.answer === 'string' && parsed.answer.trim()
      ? parsed.answer.trim()
      : trimmed;
    const actions: AssistantAction[] = Array.isArray(parsed.actions)
      ? parsed.actions
          .filter((a: unknown): a is AssistantAction =>
            typeof a === 'object' && a !== null &&
            typeof (a as AssistantAction).label === 'string' &&
            typeof (a as AssistantAction).href === 'string' &&
            ALLOWED_HREFS.includes((a as AssistantAction).href))
          .slice(0, 3)
          .map((a: AssistantAction) => ({ label: a.label.slice(0, 40), href: a.href }))
      : [];
    return { answer, actions };
  } catch {
    // Model ignored the JSON instruction — return its text as the answer.
    return { answer: trimmed, actions: [] };
  }
}
